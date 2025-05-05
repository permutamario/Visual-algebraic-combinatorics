## polytope-viewer Project Specification

### Overview
The **polytope-viewer** is a web-based 3D polyhedron visualizer built with Three.js and SageMath. It consists of:
1. A **front-end** (HTML, CSS, JavaScript) that loads polytope data (JSON) and renders interactive 3D models in the browser.
2. A **data-generation script** (`generate_jsons.py`) that uses SageMath to construct polytope objects, convert them into structured JSON, and produce a manifest of available polytopes.

### Folder Structure
```
polytope-viewer/
├── index.html           # Main entry point for the viewer interface
├── style.css            # Layout and styling for controls & canvas
├── js/                  # Front-end application logic
│   ├── loader.js        # Fetches JSON manifest & data
│   ├── main.js          # Initializes UI & orchestrates loading
│   ├── ui.js            # Handles user controls (color, opacity, selection)
│   └── viewer.js        # Sets up Three.js scene & renders meshes
├── vendor/              # Three.js modules (three.module.js, examples, etc.)
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
- Defines the UI controls: a dropdown for selecting polytopes, color and opacity pickers, and an export button.
- Loads Three.js via `importmap` (either local in `vendor/` or via CDN).
- Includes `js/main.js` as the entry-point module.

**style.css**
- Uses Flexbox to position the control panel and 3D canvas side by side.
- Styles inputs, sliders, buttons, and scroll behavior in the control pane.

**js/loader.js**
- Fetches `polytopes/data/polytope_list.json`.
- Loads each listed JSON file asynchronously.

**js/main.js**
- Calls loader to retrieve available polytopes and populates the `<select>` dropdown.
- Registers event listeners: on polytope change, on color/opacity updates, on export.

**js/ui.js**
- Encapsulates control-state management for color schemes and additional options.
- Emits update events consumed by `viewer.js`.

**js/viewer.js**
- Initializes a Three.js scene, camera, lights, and a mesh.
- Converts loaded JSON (with `vertices` and face-index arrays) into `BufferGeometry` and `Mesh` objects.
- Applies material settings based on UI controls and re-renders the scene on changes.

**polytopes/generate_jsons.py**
- Scans `build_functions/` for all `build_*.py` scripts.
- Imports each builder module and calls its `build()` function to obtain a Sage `Polyhedron` object and a display name.
- Extracts **Vertices** and **Faces** data and saves each to `data/<name>.json`, then updates the manifest.

### Adding New Polytopes
1. **Create** a new file `build_<identifier>.py` in `polytopes/build_functions/` with a `build()` function returning `(poly_obj, display_name)`.
2. **Run** the JSON-generation script:  
   ```bash
   cd polytope-viewer/polytopes
   sage generate_jsons.py
   ```
3. **Verify** that `data/<identifier>.json` exists and is listed in `polytope_list.json`.
4. **Reload** the web app; the new polytope will appear in the dropdown.

---

This Markdown file is structured for easy parsing by AI tools or documentation generators.
