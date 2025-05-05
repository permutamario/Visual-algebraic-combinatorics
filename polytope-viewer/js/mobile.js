/**
 * mobile.js - Mobile-specific functionality for the polytope viewer
 */

const POLYTOPE_LIST_URL = './polytopes/data/polytope_list.json';

// Check if the device is mobile
export function isMobileDevice() {
    return window.innerWidth <= 768;
}

// Initialize the mobile UI with just the polytope selector and options menu
export function initMobileFeatures() {
    console.log("Initializing mobile UI");
    
    // Create mobile header
    const mobileHeader = document.createElement('div');
    mobileHeader.id = 'mobile-header';
    mobileHeader.className = 'mobile-header';
    
    // Create container for controls
    const container = document.createElement('div');
    container.className = 'mobile-header-container';
    
    // Polytope dropdown
    const mobileSelect = document.createElement('select');
    mobileSelect.id = 'mobile-polytope-select';
    const label = document.createElement('label');
    label.textContent = 'Select Polytope:';
    label.setAttribute('for', 'mobile-polytope-select');
    container.appendChild(label);
    container.appendChild(mobileSelect);
    mobileHeader.appendChild(container);
    document.body.insertBefore(mobileHeader, document.body.firstChild);
    mobileHeader.style.display = 'flex';

    // ===== Mobile Options Button & Menu =====
    const optionsButton = document.createElement('button');
    optionsButton.id = 'mobile-options-button';
    optionsButton.textContent = 'Options';
    document.body.appendChild(optionsButton);

    const optionsMenu = document.createElement('div');
    optionsMenu.id = 'mobile-options-menu';

    // Autorotate toggle
    const autoLabel = document.createElement('label');
    autoLabel.textContent = 'Animate:';
    const autoToggle = document.createElement('input');
    autoToggle.type = 'checkbox';
    autoToggle.id = 'mobile-autorotate-toggle';
    autoToggle.checked = true;
    autoLabel.prepend(autoToggle);
    optionsMenu.appendChild(autoLabel);

    // Color picker
    const colorLabel = document.createElement('label');
    colorLabel.setAttribute('for', 'mobile-color-picker');
    colorLabel.textContent = 'Color:';
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.id = 'mobile-color-picker';
    colorPicker.value = '#4285f4';
    optionsMenu.appendChild(colorLabel);
    optionsMenu.appendChild(colorPicker);

    document.body.appendChild(optionsMenu);

    // Toggle menu
    optionsButton.addEventListener('click', () => {
        optionsMenu.style.display = optionsMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Dispatch custom events
    autoToggle.addEventListener('change', () => {
        document.dispatchEvent(new CustomEvent('mobileAutorotateChange', { detail: autoToggle.checked }));
    });
    colorPicker.addEventListener('change', () => {
        document.dispatchEvent(new CustomEvent('mobileColorChange', { detail: colorPicker.value }));
    });
    // ===== End Mobile Options =====

    console.log("Mobile UI initialized");
}

// Optimize Three.js renderer for mobile
export function optimizeRendererForMobile(renderer) {
    if (!renderer) return;
    return renderer;
}

// Touch control enhancements for OrbitControls
export function enhanceTouchControls(controls) {
    if (!controls) return;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.8;
    return controls;
}

// Show an error message on mobile
export function showMobileError(message) {
    let errorElement = document.getElementById('mobile-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'mobile-error';
        errorElement.className = 'mobile-error';
        document.body.appendChild(errorElement);
    }
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Show a loading indicator on mobile
export function showMobileLoading(message = 'Loading...') {
    let loader = document.getElementById('mobile-loading');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'mobile-loading';
        loader.className = 'mobile-loading';
        document.body.appendChild(loader);
    }
    loader.textContent = message;
    loader.style.display = 'block';
}

// Hide the mobile loading indicator
export function hideMobileLoading() {
    const loader = document.getElementById('mobile-loading');
    if (loader) loader.style.display = 'none';
}

// Enhanced fetch for polytope list with error handling
export async function fetchPolytopeList() {
    try {
        const response = await fetch(POLYTOPE_LIST_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('Invalid JSON');
        return data;
    } catch (err) {
        console.error('Mobile fetch error:', err);
        return ['cube.json','dodecahedron.json','icosahedron.json','octahedron.json','tetrahedron.json'];
    }
}
