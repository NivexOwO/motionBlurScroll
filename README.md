# Motion Blur Scroll - [ Vencord ]

A userplugin for [Vencord](https://vencord.dev) that adds a vertical motion blur effect when scrolling through Discord.

## Features
- **Vertical SVG Blur** — applies a dynamic `<feGaussianBlur>` filter along the Y-axis based on scroll velocity.
- **Wheel & Middle-Click Detection** — triggers only on mouse wheel input and middle-click autoscroll, ignoring automatic scroll jumps when switching channels.
- **Scroll Limit Check** — stops triggering once a container reaches its top or bottom scroll boundary.
- **Universal Container Support** — works across chats, server lists, settings, and other scrollable panels.
- **In-App Settings** — includes sliders for maximum blur intensity, velocity sensitivity, and trail decay rate.

## Installing

> [!WARNING]
>- Make sure you are running a **Vencord developer build** compiled from source.
>- Open your Vencord directory, navigate to the `src` folder, and create a `userplugins` subfolder (`src/userplugins`) if it does not exist yet.

### Option 1: Via Git (Recommended)

**Vencord developer build** can be found [here](https://docs.vencord.dev/installing/).

1. Open your terminal inside the `src/userplugins` directory.
2. Clone this repository:
   ```
   git clone https://github.com/NivexOwO/motionBlurScroll
   ```
3. Verify that the plugin path looks like `src/userplugins/motionBlurScroll/index.tsx`.
4. Go back to the root Vencord folder and build it:
   ```
   pnpm build
   ```
5. Fully reload Discord (`Ctrl + R`) and enable **MotionBlurScroll** under **Settings > Vencord > Plugins**.

### Option 2: Manual ZIP Download
1. Click the green **`<> Code`** button at the top of this page and choose **Download ZIP**.
2. Extract the archive into `src/userplugins` and rename the extracted folder so the structure matches `src/userplugins/motionBlurScroll/index.tsx`.
3. Open a terminal in your root Vencord directory and run: `pnpm build`
4. Reload Discord (`Ctrl + R`) and enable the plugin in **Settings > Vencord > Plugins**.
