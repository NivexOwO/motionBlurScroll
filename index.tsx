import { definePluginSettings } from "@api/Settings";
import definePlugin, { makeRange, OptionType } from "@utils/types";

const settings = definePluginSettings({
    intensity: {
        type: OptionType.SLIDER,
        description: "Maximum motion blur intensity",
        default: 8,
        markers: makeRange(2, 20, 2),
        stickToMarkers: false,
    },
    sensitivity: {
        type: OptionType.SLIDER,
        description: "Scroll velocity sensitivity",
        default: 0.35,
        markers: makeRange(0.1, 1.0, 0.1),
        stickToMarkers: false,
    },
    decay: {
        type: OptionType.SLIDER,
        description: "Blur trail decay rate (lower = faster fade)",
        default: 0.84,
        markers: makeRange(0.7, 0.95, 0.05),
        stickToMarkers: false,
    }
});

let svgContainer: HTMLDivElement | null = null;
let styleEl: HTMLStyleElement | null = null;
let blurNode: Element | null = null;

let currentBlur = 0;
let rafId: number | null = null;
let activeTarget: HTMLElement | null = null;

let lastWheelTime = 0;
let isMiddleScrolling = false;
let lastScrollTop = 0;
let lastScrollLeft = 0;
let lastScrollTime = 0;
let lastScrolledEl: HTMLElement | null = null;

function canActuallyScroll(el: HTMLElement, deltaY: number, deltaX: number): boolean {
    if (deltaY < 0 && el.scrollTop > 1) return true;
    if (deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
    if (deltaX < 0 && el.scrollLeft > 1) return true;
    if (deltaX > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true;
    return false;
}

function findScrollableTarget(startEl: HTMLElement | null, deltaY = 0, deltaX = 0): HTMLElement | null {
    let el = startEl;
    while (el && el !== document.body && el !== document.documentElement) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY === "auto" || style.overflowY === "scroll";
        const overflowX = style.overflowX === "auto" || style.overflowX === "scroll";

        if ((overflowY && el.scrollHeight > el.clientHeight) || (overflowX && el.scrollWidth > el.clientWidth)) {
            if (deltaY === 0 && deltaX === 0) return el;
            if (canActuallyScroll(el, deltaY, deltaX)) return el;
        }
        el = el.parentElement;
    }
    return null;
}

function updateBlurLoop() {
    if (currentBlur > 0.1) {
        currentBlur *= settings.store.decay;
        if (blurNode) {
            blurNode.setAttribute("stdDeviation", `0 ${currentBlur.toFixed(2)}`);
        }
        rafId = requestAnimationFrame(updateBlurLoop);
    } else {
        currentBlur = 0;
        if (blurNode) {
            blurNode.setAttribute("stdDeviation", "0 0");
        }
        if (activeTarget) {
            activeTarget.classList.remove("vc-motion-blur-active");
            activeTarget = null;
        }
        rafId = null;
    }
}

function triggerBlur(target: HTMLElement, amount: number) {
    if (activeTarget && activeTarget !== target) {
        activeTarget.classList.remove("vc-motion-blur-active");
    }
    activeTarget = target;
    currentBlur = Math.min(Math.max(currentBlur, amount), settings.store.intensity);

    if (currentBlur > 0.2) {
        activeTarget.classList.add("vc-motion-blur-active");
        if (!rafId) {
            rafId = requestAnimationFrame(updateBlurLoop);
        }
    }
}

function handleWheel(e: WheelEvent) {
    const rawTarget = e.target as HTMLElement | null;
    if (!rawTarget) return;

    const scrollable = findScrollableTarget(rawTarget, e.deltaY, e.deltaX);
    if (!scrollable) return;

    lastWheelTime = performance.now();
    const delta = Math.abs(e.deltaY) || Math.abs(e.deltaX);
    const impulse = currentBlur + delta * settings.store.sensitivity * 0.08;
    triggerBlur(scrollable, impulse);
}

function handleMouseDown(e: MouseEvent) {
    if (isMiddleScrolling) {
        isMiddleScrolling = false;
        return;
    }

    if (e.button === 1) {
        const rawTarget = e.target as HTMLElement | null;
        if (findScrollableTarget(rawTarget)) {
            isMiddleScrolling = true;
            lastScrollTime = performance.now();
        }
    }
}

function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && isMiddleScrolling) {
        isMiddleScrolling = false;
    }
}

function handleScroll(e: Event) {
    const target = e.target as HTMLElement | null;
    if (!target || typeof target.scrollTop !== "number") return;

    const now = performance.now();
    const isWheelInertia = now - lastWheelTime < 350;

    if (!isMiddleScrolling && !isWheelInertia) {
        lastScrolledEl = target;
        lastScrollTop = target.scrollTop;
        lastScrollLeft = target.scrollLeft;
        lastScrollTime = now;
        return;
    }

    if (target === lastScrolledEl) {
        const dt = now - lastScrollTime;
        const dy = Math.abs(target.scrollTop - lastScrollTop);
        const dx = Math.abs(target.scrollLeft - lastScrollLeft);
        const dist = Math.max(dy, dx);

        if (dt > 0 && dist > 0.5) {
            const velocity = dist / dt;
            const blurAmount = velocity * settings.store.sensitivity * 14;
            triggerBlur(target, blurAmount);
        }
    }

    lastScrolledEl = target;
    lastScrollTop = target.scrollTop;
    lastScrollLeft = target.scrollLeft;
    lastScrollTime = now;
}

export default definePlugin({
    name: "MotionBlurScroll",
    description: "Adds directional motion blur effect on wheel and middle-click scroll",
    authors: [{ name: "nivex", id: 1508172401844682849n }],
    settings,

    start() {
        svgContainer = document.createElement("div");
        svgContainer.style.cssText = "position:absolute;width:0;height:0;pointer-events:none;";
        svgContainer.innerHTML = `
            <svg xmlns="http://w3.org">
                <defs>
                    <filter id="vc-scroll-motion-blur" x="-5%" y="-20%" width="110%" height="140%">
                        <feGaussianBlur id="vc-blur-node" in="SourceGraphic" stdDeviation="0 0" />
                    </filter>
                </defs>
            </svg>
        `;
        document.body.appendChild(svgContainer);
        blurNode = document.getElementById("vc-blur-node");

        styleEl = document.createElement("style");
        styleEl.textContent = `
            .vc-motion-blur-active > * {
                filter: url(#vc-scroll-motion-blur);
                will-change: filter;
            }
        `;
        document.head.appendChild(styleEl);

        document.addEventListener("wheel", handleWheel, { capture: true, passive: true });
        document.addEventListener("mousedown", handleMouseDown, { capture: true, passive: true });
        document.addEventListener("keydown", handleKeyDown, { capture: true, passive: true });
        document.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    },

    stop() {
        document.removeEventListener("wheel", handleWheel, { capture: true });
        document.removeEventListener("mousedown", handleMouseDown, { capture: true });
        document.removeEventListener("keydown", handleKeyDown, { capture: true });
        document.removeEventListener("scroll", handleScroll, { capture: true });
        if (rafId) cancelAnimationFrame(rafId);
        svgContainer?.remove();
        styleEl?.remove();
        activeTarget?.classList.remove("vc-motion-blur-active");
        svgContainer = null;
        styleEl = null;
        blurNode = null;
        activeTarget = null;
        isMiddleScrolling = false;
    }
});
