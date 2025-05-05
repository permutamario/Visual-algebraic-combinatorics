/**
 * mobile.js - Mobile-specific functionality for the polytope viewer
 */

// Check if the device is mobile
export function isMobileDevice() {
    return window.innerWidth <= 768;
}

// Initialize the mobile UI with just the polytope selector
export function initMobileFeatures() {
    console.log("Initializing mobile UI");
    
    // Create mobile header
    const mobileHeader = document.createElement('div');
    mobileHeader.id = 'mobile-header';
    mobileHeader.className = 'mobile-header';
    
    // Create container for the controls
    const container = document.createElement('div');
    container.className = 'mobile-header-container';
    
    // Create dropdown for polytope selection
    const mobileSelect = document.createElement('select');
    mobileSelect.id = 'mobile-polytope-select';
    
    // Create label
    const label = document.createElement('label');
    label.textContent = 'Select Polytope:';
    label.setAttribute('for', 'mobile-polytope-select');
    
    // Assemble the elements
    container.appendChild(label);
    container.appendChild(mobileSelect);
    mobileHeader.appendChild(container);
    
    // Add the header to the document
    document.body.insertBefore(mobileHeader, document.body.firstChild);
    
    // Make sure the header is visible
    mobileHeader.style.display = 'flex';
    
    console.log("Mobile UI initialized");
}

// Optimize Three.js renderer for mobile
export function optimizeRendererForMobile(renderer) {
    if (!renderer) return;
    
    // Use a lower pixel ratio for better performance
    const lowerRatio = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(lowerRatio);
    
    return renderer;
}

// Touch control enhancements for OrbitControls
export function enhanceTouchControls(controls) {
    if (!controls) return;
    
    // Make rotation and zooming more touch-friendly
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.8;
    
    return controls;
}

// Show mobile loading indicator
export function showMobileLoading(show) {
    // Create loading indicator if it doesn't exist
    let loader = document.querySelector('.mobile-loader');
    
    if (!loader && show) {
        loader = document.createElement('div');
        loader.className = 'mobile-loader';
        document.body.appendChild(loader);
    }
    
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
    }
}

// Show error message on mobile
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
