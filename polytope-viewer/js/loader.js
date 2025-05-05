// js/loader.js

/**
 * Asynchronously loads and parses JSON data for a polytope.
 * @param {string} filename - The name of the JSON file (e.g., "cube.json").
 * @param {string} [basePath='./polytopes/data/'] - The base path to the polytopes data directory. <<-- CHANGE THIS LINE
 * @returns {Promise<object|null>} A promise that resolves with the parsed polytope data object,
 *                                 or null if loading or parsing fails.
 */
export async function loadPolytopeData(filename, basePath = './polytopes/data/') { // <-- UPDATED PATH
    const url = `${basePath}${filename}`;
    console.log(`Attempting to load: ${url}`); // Log the correct path being tried
    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Provide more specific error info if possible
            let errorText = response.statusText || `Status Code ${response.status}`;
            try { // Try to get text body for more details (e.g., server error message)
                const body = await response.text();
                if (body) errorText += ` - ${body.substring(0, 100)}`; // Limit length
            } catch (bodyError) { /* Ignore if reading body fails */ }
            throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
        }
        const data = await response.json(); // This can also throw SyntaxError for invalid JSON
        console.log(`Successfully loaded and parsed: ${filename}`);
        // Basic validation (optional but good practice)
        if (!data.vertices || !data.faces) {
             console.error("Loaded data is missing 'vertices' or 'faces' property.");
             return null;
        }
        // Add check for empty faces array if needed by viewer
        if (data.faces.length === 0) {
             console.warn(`Polytope '${data.name}' has an empty 'faces' array. Viewer might not render anything.`);
             // Depending on requirements, you might return null here or let viewer handle it
             // return null;
        }
        return data;
    } catch (error) {
        console.error(`Failed to load or parse polytope data from ${url}:`, error);
        return null; // Return null to indicate failure
    }
}
