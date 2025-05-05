## polytope-viewer Project Specification

### Overview
The **polytope-viewer** is a web-based 3D polyhedron visualizer built with Three.js and SageMath. It consists of:
1. A **front-end** (HTML, CSS, JavaScript) that loads polytope data (JSON) and renders interactive 3D models in the browser.
2. A **data-generation script** (`generate_jsons.py`) that uses SageMath to construct polytope objects, convert them into structured JSON, and produce a manifest of available polytopes.
3. **Adaptive interfaces** for both desktop and mobile devices with optimized controls and interactions for each platform.

### Features
- Interactive 3D viewer with orbital camera controls
- Polytope selection from dropdown menu
- Multiple color schemes for faces (Default Single, Face Index, Pastel, Grayscale, Vibrant, Earthy, Neon, Colorblind Friendly)
- Customizable face opacity
- Vertex emphasis with configurable vertex color
- Vertices rendered as true 3D spheres
- Autorotation with multi-axis movement
- Export to PNG image and animated GIF
- Responsive design with separate optimized interfaces for desktop and mobile devices

### Folder Structure
```
polytope-viewer/
├── index.html           # Main entry point for the viewer interface
├── style.css            # Layout and styling for controls & canvas
├── js/                  # Front-end application logic
│   ├── loader.js        # Fetches JSON manifest & data
│   ├── main.js          # Initializes UI & orchestrates loading
│   ├── ui.js            # Handles user controls (color, opacity, selection)
│   ├── mobile.js        # Mobile-specific functionality and UI
│   └── viewer.js        # Sets up Three.js scene & renders meshes
├── vendor/              # Third-party libraries
│   ├── three.module.js  # Three.js core library
│   ├── examples/        # Three.js examples and addons
│   └── gif.js/          # GIF.js library for animation export
│       ├── gif.js
│       └── gif.worker.js
└── polytopes/           # Polytope data & generation scripts
    ├── build_functions/ # SageMath builder scripts for each polytope
    │   ├── build_cube.py           # Cube builder
    │   ├── build_tetrahedron.py    # Tetrahedron builder
    │   └── truncated_octahedron.py # Permutahedron P3 builder
    │   └── __init__.py             # Package marker
    ├── data/             # Generated JSON files (e.g. cube.json, tetrahedron.json)
    │   └── polytope_list.json # Manifest listing all JSON files
    └── generate_jsons.py # Script to run under Sage; converts builders → JSON
```

### File Descriptions

**index.html**
- Defines the UI controls: a dropdown for selecting polytopes, color and opacity pickers, export buttons, and more
- Includes vertex emphasis toggle and controls for vertex appearance
- Adds autorotation toggle button
- Includes PNG and GIF export buttons
- Loads Three.js via `importmap` and GIF.js via script tag
- Includes `js/main.js` as the entry-point module

**style.css**
- Uses Flexbox to position the control panel and 3D canvas side by side in desktop mode
- Styles inputs, sliders, buttons, and scroll behavior in the control pane
- Includes responsive design for different screen sizes
- Special styling for vertex controls and autorotation button
- Separate styling for mobile interface with device-specific optimizations
- Uses media queries to apply mobile-specific styles only when needed

**js/loader.js**
- Fetches `polytopes/data/polytope_list.json`
- Loads each listed JSON file asynchronously

**js/main.js**
- Detects device type (mobile/desktop) before initializing the appropriate interface
- Calls loader to retrieve available polytopes and populates the appropriate dropdown
- Manages predefined color schemes and their application
- Handles vertex emphasis and autorotation states
- Registers event listeners for all UI controls including both export options
- Contains separate initialization paths for mobile and desktop devices

**js/ui.js**
- Encapsulates control-state management for color schemes and additional options
- Manages vertex emphasis controls (visibility and color)
- Handles autorotation button state
- Emits update events consumed by `viewer.js`

**js/mobile.js**
- Handles mobile-specific functionality and UI adaptations
- Provides device type detection
- Creates simplified mobile interface with just a polytope selector
- Optimizes Three.js renderer settings for mobile performance
- Enhances touch controls for better mobile interaction
- Manages mobile-specific loading indicators and error messages

**js/viewer.js**
- Initializes a Three.js scene, camera, lights, and a mesh
- Converts loaded JSON (with `vertices` and face-index arrays) into `BufferGeometry` and `Mesh` objects
- Renders vertices as 3D spheres with configurable color
- Implements multi-axis autorotation
- Provides PNG and GIF export functionality with mobile-specific optimizations
- Applies material settings based on UI controls and re-renders the scene on changes
- Contains performance optimizations for mobile devices

### Desktop vs. Mobile Interface

**Desktop Interface**
- Full-featured control panel on the left side of the screen
- All controls visible simultaneously for quick access
- Advanced options for customizing colors, opacity, and vertex appearance
- High-quality rendering and export options
- Standard mouse controls for camera rotation and zoom

**Mobile Interface**
- Simplified UI focused on viewing experience
- Single dropdown menu at the top of the screen for polytope selection
- Automatic activation of autorotation for better visualization
- Optimized touch controls for camera manipulation
- Reduced rendering quality for better performance
- Automatic screen orientation handling
- Mobile-specific loading indicators

**Implementation Details**
- Device detection happens before any UI is created to prevent flashing of incorrect interfaces
- CSS uses body classes and media queries to completely separate mobile/desktop styles
- Shared core functionality with platform-specific optimizations
- Mobile interface created from scratch rather than adapted from desktop UI
- Optimized Three.js settings for mobile:
  - Lower pixel ratio for better performance
  - Touch-friendly camera controls
  - Simplified materials and geometry
  - Optimized GIF export settings

### Adding New Polytopes
1. **Create** a new file `build_<identifier>.py` in `polytopes/build_functions/` with a `build()` function returning `(poly_obj, display_name)`
2. **Run** the JSON-generation script:  
   ```bash
   cd polytope-viewer/polytopes
   sage generate_jsons.py
   ```
3. **Verify** that `data/<identifier>.json` exists and is listed in `polytope_list.json`
4. **Reload** the web app; the new polytope will appear in the dropdown

### Visualization Features

**Color Schemes**
- Default Single: Uses a single color selected from the color picker
- Face Index: Rainbow colors based on face order
- Pastel: Soft pastel colors
- Grayscale: Varying shades of gray
- Vibrant: Bright, saturated colors
- Earthy: Natural earth tones
- Neon: Bright fluorescent colors
- Colorblind Friendly: Colors distinguishable for those with red-green colorblindness

**Vertex Emphasis**
- Toggle to show or hide vertices
- Customizable vertex color
- Vertices rendered as true 3D spheres

**Autorotation**
- Toggleable rotation animation (always on for mobile)
- Multi-axis rotation (X, Y, Z) for more dynamic movement
- Smooth rotation that maintains alignment between faces, edges, and vertices

**Export Options**
- PNG Export: Captures current view as a static image
- GIF Export: Creates an animated GIF of the polytope rotating on multiple axes
- Both export options maintain the current visual appearance including colors, opacity, and vertex visibility
- Mobile-optimized export with reduced quality settings for better performance

---

This Markdown file is structured for easy parsing by AI tools or documentation generators.
