import * as UI from './ui.js';
import * as Loader from './loader.js';
import * as Viewer from './viewer.js';

const POLYTOPE_LIST_URL = './polytopes/data/polytope_list.json'; // Path relative to index.html
//const DEFAULT_POLYTOPE = AVAILABLE_POLYTOPES[0] || null; // Use the first as default

// Define Color Schemes
const COLOR_SCHEMES = [
    {
        name: "Default Single", // Keeps original behavior - uses color picker
        colors: null // Special flag indicating use color picker value
    },
    {
        name: "Face Index", // Simple rainbow effect based on face order
        colors: [
            "#FF0000", // Red
            "#FF7F00", // Orange
            "#FFFF00", // Yellow
            "#00FF00", // Green
            "#0000FF", // Blue
            "#4B0082", // Indigo
            "#8B00FF", // Violet
            // Add more colors if needed for polytopes with many faces
            "#FF1493", // DeepPink
            "#00CED1", // DarkTurquoise
            "#FFD700", // Gold
            "#ADFF2F", // GreenYellow
            "#BA55D3", // MediumOrchid
        ]
    },
    {
        name: "Pastel",
        colors: [
            "#A8E6CF", "#DCEDC1", "#FFD3B6", "#FFAAA5", "#FF8B94",
            "#77DD77", "#FDFD96", "#83CEEE", "#B19CD9", "#FEC8D8",
        ]
    },
    {
        name: "Grayscale",
        colors: [
            "#F0F0F0", "#DCDCDC", "#C8C8C8", "#B4B4B4", "#A0A0A0",
            "#8C8C8C", "#787878", "#646464", "#505050", "#3C3C3C",
        ]
    }
    // Add more schemes here
];
// Start with "Face Index" as default instead of single color
const DEFAULT_COLOR_SCHEME_NAME = COLOR_SCHEMES[1].name;

// --- Application State ---
let currentPolytopeFilename = null;
let availablePolytopesList = []; // Will be populated by fetching the manifest
let defaultPolytope = null;      // Will be determined after fetching list
let currentColorScheme = COLOR_SCHEMES.find(s => s.name === DEFAULT_COLOR_SCHEME_NAME) || COLOR_SCHEMES[0];

// --- Initialization ---
// Make initApp async to handle fetching the list
async function initApp() {
    console.log("Initializing Polytope Viewer...");
    UI.showLoading(true); // Show loading indicator early

    // 1. Fetch the list of available polytopes
    try {
        console.log(`Fetching polytope list from: ${POLYTOPE_LIST_URL}`);
        const response = await fetch(POLYTOPE_LIST_URL);
        if (!response.ok) {
            throw new Error(`HTTP error fetching list! Status: ${response.status}`);
        }
        availablePolytopesList = await response.json(); // Expects an array of strings

        if (!Array.isArray(availablePolytopesList) || availablePolytopesList.length === 0) {
             console.error("Fetched polytope list is invalid or empty.", availablePolytopesList);
             throw new Error("No valid polytopes found in the manifest file.");
        }
        console.log(`Found ${availablePolytopesList.length} available polytopes:`, availablePolytopesList);
        // Determine the default polytope (e.g., the first one in the list)
        defaultPolytope = availablePolytopesList[0];

    } catch (error) {
        console.error("Failed to load or parse polytope list:", error);
        UI.showErrorMessage(`Error loading polytope list: ${error.message}. Cannot initialize viewer.`);
        UI.showLoading(false);
        return; // Stop initialization if list fails
    }

    // Proceed ONLY if the list was loaded successfully

    // 2. Initialize the Viewer
    const canvas = document.getElementById('viewer-canvas');
    if (!canvas) {
        console.error("Canvas element #viewer-canvas not found!");
        UI.showErrorMessage("Fatal Error: Canvas not found.");
        UI.showLoading(false); // Hide loading indicator on error
        return;
    }
    Viewer.init(canvas);
    console.log("Viewer initialized.");

    // 3. Populate UI dropdowns using the fetched list
    // Pass the fetched list directly
    UI.populatePolytopeDropdown(availablePolytopesList, handlePolytopeSelectionChange);
    UI.populateColorSchemeDropdown(COLOR_SCHEMES.map(s => s.name), handleColorSchemeChange);
    console.log("Dropdowns populated.");

    // 4. Set up UI event listeners (same as before)
    UI.setupEventListeners({
        onColorChange: handleFaceColorChange,
        onOpacityChange: Viewer.updateFaceOpacity,
        onExportClick: Viewer.exportToPNG,
    });
    console.log("UI Event listeners set up.");

    // 5. Set initial UI selections using the determined default polytope
    UI.setInitialSelections(defaultPolytope, DEFAULT_COLOR_SCHEME_NAME);
    UI.toggleFaceColorPicker(currentColorScheme.name === "Default Single"); // Set initial picker state

    // 6. Load the default polytope
    if (defaultPolytope) {
        console.log(`Loading default polytope: ${defaultPolytope}`);
        // loadAndDisplayPolytope will hide the loading indicator in its 'finally' block
        await loadAndDisplayPolytope(defaultPolytope); // Make sure loading finishes if needed
    } else {
        console.warn("No default polytope determined.");
        UI.showErrorMessage("No polytopes available to display.");
        UI.showLoading(false); // Hide loading indicator if no default is loaded
    }
    // Final check: If still loading, hide indicator (should be handled by loadAndDisplayPolytope)
    // UI.showLoading(false);
}



// --- Event Handlers ---

/** Handles the change event from the polytope selection dropdown. */
function handlePolytopeSelectionChange(selectedFilename) {
    if (selectedFilename && selectedFilename !== currentPolytopeFilename) {
        console.log(`Polytope selection changed to: ${selectedFilename}`);
        loadAndDisplayPolytope(selectedFilename); // This will re-apply current color scheme
    }
}

/** Handles the change event from the color scheme selection dropdown. */
function handleColorSchemeChange(schemeName) {
    const selectedScheme = COLOR_SCHEMES.find(s => s.name === schemeName);
    if (selectedScheme) {
        console.log(`Color scheme changed to: ${schemeName}`);
        currentColorScheme = selectedScheme;
        applyCurrentColorScheme(); // Apply the newly selected scheme
        // Enable/disable single color picker based on scheme
        UI.toggleFaceColorPicker(selectedScheme.name === "Default Single");
    } else {
        console.warn(`Selected color scheme "${schemeName}" not found.`);
    }
}

/** Handles input changes from the single face color picker. */
function handleFaceColorChange(color) {
    console.log(`Face color picker changed to: ${color}`);
    // Only apply if the "Default Single" scheme is active
    // Or: Always apply, forcing the scheme to "Default Single"
    if (!currentColorScheme || currentColorScheme.name !== "Default Single") {
        // If user changes color picker, assume they want single color mode
        UI.elements.colorSchemeSelect.value = "Default Single";
        currentColorScheme = COLOR_SCHEMES.find(s => s.name === "Default Single");
        UI.toggleFaceColorPicker(true); // Ensure picker stays enabled
         console.log("Switched scheme to 'Default Single' due to color picker interaction.");
    }
    // Apply the color using the viewer function
    Viewer.applyColorScheme(null, color);
}


// --- Core Logic ---

/** Loads data and updates viewer, handles UI states. */
async function loadAndDisplayPolytope(filename) {
    if (!filename) return;

    UI.showLoading(true);
    UI.showErrorMessage('');
    currentPolytopeFilename = filename; // Track current selection attempt

    try {
        const polytopeData = await Loader.loadPolytopeData(filename);

        if (polytopeData) {
            Viewer.updatePolytopeMesh(polytopeData);
            applyCurrentColorScheme(); // Apply selected scheme AFTER mesh is built
            // Update UI select in case load was triggered programmatically
            if (UI.elements.polytopeSelect.value !== filename) {
                UI.elements.polytopeSelect.value = filename;
            }
        } else {
            // Loader handled the console error, show user message
            UI.showErrorMessage(`Failed to load data for ${filename}. Check console.`);
            Viewer.updatePolytopeMesh(null); // Clear the viewer on load failure
        }
    } catch (error) {
        // Catch any unexpected errors during the process
        console.error(`Error in loadAndDisplayPolytope for ${filename}:`, error);
        UI.showErrorMessage(`An unexpected error occurred while loading ${filename}.`);
         Viewer.updatePolytopeMesh(null); // Clear the viewer
    } finally {
        UI.showLoading(false);
    }
}

/** Helper to apply the currently selected color scheme to the viewer */
function applyCurrentColorScheme() {
    if (!Viewer.isReady()) { // Check if viewer has finished loading mesh
       console.warn("Viewer not ready, skipping color scheme application.");
       return;
    }

    if (!currentColorScheme) {
         console.error("Current color scheme is not set.");
         return;
    }

    if (currentColorScheme.name === "Default Single") {
        // Use the current color picker value for the single color
        Viewer.applyColorScheme(null, UI.getFaceColor());
    } else {
        // Use the colors array from the scheme object
        Viewer.applyColorScheme(currentColorScheme.colors);
    }
}


// --- Start the Application ---
// Ensure the DOM is fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp(); // DOMContentLoaded has already fired
}
