// --- Element References ---
export const elements = {
    polytopeSelect: document.getElementById('polytope-select'),
    faceColorPicker: document.getElementById('face-color-picker'),
    faceOpacitySlider: document.getElementById('face-opacity-slider'),
    colorSchemeSelect: document.getElementById('color-scheme-select'),
    vertexEmphasisToggle: document.getElementById('vertex-emphasis-toggle'),
    vertexColorPicker: document.getElementById('vertex-color-picker'),
    autorotateButton: document.getElementById('autorotate-button'),
    exportButton: document.getElementById('export-button'),
    exportGifButton: document.getElementById('export-gif-button'),
    loadingStatus: document.getElementById('loading-status'),
    errorMessage: document.getElementById('error-message'),
};

// Store callbacks to prevent duplicate listeners if functions are called multiple times
let polytopeChangeCallback = null;
let schemeChangeCallback = null;
let autorotateState = false;

// --- Initialization ---

/** Populates the polytope selection dropdown. */
export function populatePolytopeDropdown(polytopeFilenames, onChangeCallback) {
    if (!elements.polytopeSelect || !polytopeFilenames) {
        console.error("Polytope select element or filenames missing for dropdown population.");
        return;
    }

    // Store the callback
    polytopeChangeCallback = onChangeCallback;

    elements.polytopeSelect.innerHTML = ''; // Clear existing options
    polytopeFilenames.forEach(filename => {
        const option = document.createElement('option');
        option.value = filename;
        // Derive name from filename (remove .json, capitalize)
        option.textContent = filename
            .replace('.json', '')
            .replace(/_/g, ' ') // Replace underscores with spaces
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
        elements.polytopeSelect.appendChild(option);
    });

    // Remove existing listener before adding new one to prevent duplicates
    elements.polytopeSelect.removeEventListener('change', handlePolytopeSelectChange); // Use named handler
    elements.polytopeSelect.addEventListener('change', handlePolytopeSelectChange);
}
// Named handler function for the event listener
function handlePolytopeSelectChange(event) {
    if (polytopeChangeCallback) {
        polytopeChangeCallback(event.target.value);
    }
}


/** Populates the color scheme selection dropdown. */
export function populateColorSchemeDropdown(schemeNames, onChangeCallback) {
    if (!elements.colorSchemeSelect || !schemeNames) {
        console.error("Color scheme select element or scheme names missing for dropdown population.");
        return;
    }

    // Store the callback
    schemeChangeCallback = onChangeCallback;

    elements.colorSchemeSelect.innerHTML = ''; // Clear existing
    schemeNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        elements.colorSchemeSelect.appendChild(option);
    });

    // Remove existing listener before adding new one
    elements.colorSchemeSelect.removeEventListener('change', handleColorSchemeSelectChange); // Use named handler
    elements.colorSchemeSelect.addEventListener('change', handleColorSchemeSelectChange);
}
// Named handler function for the event listener
function handleColorSchemeSelectChange(event) {
    if (schemeChangeCallback) {
        schemeChangeCallback(event.target.value);
    }
}


/** Sets the initial selected options in the dropdowns */
export function setInitialSelections(polytopeFilename, schemeName) {
    if (elements.polytopeSelect && polytopeFilename) {
        elements.polytopeSelect.value = polytopeFilename;
    }
    if (elements.colorSchemeSelect && schemeName) {
        elements.colorSchemeSelect.value = schemeName;
    }
}

// --- Getters ---

export function getSelectedPolytope() {
    return elements.polytopeSelect ? elements.polytopeSelect.value : null;
}

export function getSelectedColorScheme() {
    return elements.colorSchemeSelect ? elements.colorSchemeSelect.value : null;
}

export function getFaceColor() {
    // Return default white if element doesn't exist, though it should
    return elements.faceColorPicker ? elements.faceColorPicker.value : '#ffffff';
}

export function getFaceOpacity() {
    // Return default 1.0 if element doesn't exist
    return elements.faceOpacitySlider ? parseFloat(elements.faceOpacitySlider.value) : 1.0;
}

export function getVertexEmphasis() {
    return elements.vertexEmphasisToggle ? elements.vertexEmphasisToggle.checked : false;
}


export function getVertexColor() {
    return elements.vertexColorPicker ? elements.vertexColorPicker.value : '#000000';
}

export function toggleAutorotation() {
    autorotateState = !autorotateState;
    if (elements.autorotateButton) {
        elements.autorotateButton.textContent = autorotateState ? 'Stop Autorotation' : 'Start Autorotation';
    }
    return autorotateState;
}

export function getAutorotationState() {
    return autorotateState;
}

// --- Event Listeners Setup ---
/** Sets up event listeners for UI controls that don't have them set during population. */
export function setupEventListeners(callbacks) {
    // Dropdown listeners are set in their respective populate functions.

    if (elements.faceColorPicker && callbacks.onColorChange) {
        // Use 'input' for real-time updates as color is dragged
        elements.faceColorPicker.addEventListener('input', (event) => {
            callbacks.onColorChange(event.target.value);
        });
    }

    if (elements.faceOpacitySlider && callbacks.onOpacityChange) {
        elements.faceOpacitySlider.addEventListener('input', (event) => {
            callbacks.onOpacityChange(parseFloat(event.target.value));
        });
    }
    
    // Vertex emphasis controls
    if (elements.vertexEmphasisToggle && callbacks.onVertexEmphasisToggle) {
        elements.vertexEmphasisToggle.addEventListener('change', (event) => {
            const isEnabled = event.target.checked;
            toggleVertexControls(isEnabled);
            callbacks.onVertexEmphasisToggle(isEnabled);
        });
    }

    
    if (elements.vertexColorPicker && callbacks.onVertexColorChange) {
        elements.vertexColorPicker.addEventListener('input', (event) => {
            callbacks.onVertexColorChange(event.target.value);
        });
    }
    
    // Autorotation toggle
    if (elements.autorotateButton && callbacks.onAutorotateToggle) {
        elements.autorotateButton.addEventListener('click', () => {
            const newState = toggleAutorotation();
            callbacks.onAutorotateToggle(newState);
        });
    }

    if (elements.exportButton && callbacks.onExportClick) {
        elements.exportButton.addEventListener('click', () => {
            callbacks.onExportClick();
        });
    }

    console.log("exportGifButton:", elements.exportGifButton);
    console.log("onExportGifClick callback:", callbacks.onExportGifClick);

    // Export Listener
    if (elements.exportGifButton && callbacks.onExportGifClick) {
	elements.exportGifButton.addEventListener('click', () => {
	    console.log("Export GIF button clicked");
	    callbacks.onExportGifClick();
	});
    }
    
}

// --- UI State Updates ---

export function showLoading(isLoading) {
    if (elements.loadingStatus) {
        elements.loadingStatus.style.display = isLoading ? 'block' : 'none';
    }
    // Disable controls while loading
    const controlsToDisable = [
        elements.polytopeSelect,
        elements.colorSchemeSelect,
        elements.faceColorPicker,
        elements.faceOpacitySlider,
        elements.vertexEmphasisToggle,
        elements.vertexColorPicker,
        elements.autorotateButton,
        elements.exportButton
    ];
    controlsToDisable.forEach(control => {
        if (control) control.disabled = isLoading;
    });

    // Re-enable color picker based on scheme if finishing loading
    if (!isLoading && elements.colorSchemeSelect) {
        toggleFaceColorPicker(elements.colorSchemeSelect.value === "Default Single");
    }
}

export function showErrorMessage(message) {
    if (elements.errorMessage) {
        elements.errorMessage.textContent = message || '';
        elements.errorMessage.style.display = message ? 'block' : 'none';
    }
}

/** Enable/disable the face color picker and its label visually. */
export function toggleFaceColorPicker(enabled) {
    if (elements.faceColorPicker) {
        elements.faceColorPicker.disabled = !enabled;
        // Also style the control and its label for visual feedback
        elements.faceColorPicker.style.opacity = enabled ? '1' : '0.5';
        elements.faceColorPicker.style.cursor = enabled ? 'pointer' : 'not-allowed';

        // Attempt to style the associated label (assumes label is sibling or parent)
        const label = document.querySelector(`label[for="${elements.faceColorPicker.id}"]`);
        if (label) {
            label.style.opacity = enabled ? '1' : '0.6';
        }
    }
}

/** Enable/disable the vertex controls based on emphasis toggle */
export function toggleVertexControls(enabled) {
    
    if (elements.vertexColorPicker) {
        elements.vertexColorPicker.disabled = !enabled;
        elements.vertexColorPicker.style.opacity = enabled ? '1' : '0.5';
    }
    
}
