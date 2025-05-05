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

// For mobile: Enhanced fetch with better error handling
async function fetchPolytopeList() {
    console.log("Mobile: Attempting to fetch polytope list");
    
    try {
        // Log the exact URL being used
        const resolvedUrl = new URL(POLYTOPE_LIST_URL, window.location.href).href;
        console.log(`Mobile: Resolved full URL: ${resolvedUrl}`);
        
        // Add cache-busting query parameter
        const urlWithCacheBust = `${resolvedUrl}?_=${new Date().getTime()}`;
        console.log(`Mobile: Using URL with cache-busting: ${urlWithCacheBust}`);
        
        // Perform the fetch with explicit mode and credentials
        const response = await fetch(urlWithCacheBust, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error(`Mobile: HTTP error ${response.status}: ${response.statusText}`);
            throw new Error(`Network error: ${response.status}`);
        }
        
        // Get the raw text first for debugging
        const rawText = await response.text();
        console.log(`Mobile: Raw response text (first 100 chars): ${rawText.substring(0, 100)}`);
        
        // Try to parse the JSON
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (parseError) {
            console.error("Mobile: JSON parse error:", parseError);
            console.log("Mobile: Raw response that failed to parse:", rawText);
            throw new Error("Failed to parse JSON response");
        }
        
        // Validate the data
        if (!Array.isArray(data)) {
            console.error("Mobile: Response is not an array:", data);
            throw new Error("Polytope list is not an array");
        }
        
        if (data.length === 0) {
            console.warn("Mobile: Polytope list is empty");
        } else {
            console.log(`Mobile: Successfully loaded ${data.length} polytopes`);
        }
        
        return data;
    } catch (error) {
        console.error("Mobile: Error fetching polytope list:", error);
        
        // Try fallback to a hardcoded list if fetch fails
        console.log("Mobile: Using fallback polytope list");
        return [
            "cube.json",
            "dodecahedron.json",
            "icosahedron.json",
            "octahedron.json",
            "tetrahedron.json"
        ];
    }
}
