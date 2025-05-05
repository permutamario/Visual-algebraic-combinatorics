import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// Import BufferGeometryUtils for vertex merging
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { isMobileDevice } from './mobile.js';

let scene, camera, renderer, controls;
let currentPolytopeMesh = null; // Mesh for faces using multi-material groups
let currentEdgesMesh = null;    // LineSegments mesh for edges
let currentVerticesMesh = null; // Group of spheres for vertices
let faceMaterials = [];         // Array of MeshStandardMaterial for faces
let edgeMaterial;               // Single LineBasicMaterial for edges
let vertexMaterial;             // Material for vertex spheres
let isViewerReady = false;      // Flag to check if mesh exists and is ready for updates
let autoRotationEnabled = false; // Flag for autorotation
let captureFrameFunction = null; // Function to capture frames for GIF recording

// --- Constants ---
// Tolerance for merging vertices. Adjust carefully if needed.
// Smaller values are less aggressive but might not fix all gaps.
// Larger values might distort the geometry. Start small.
const MERGE_VERTEX_TOLERANCE = 1e-3; // e.g., 0.000001 units

// Adjust vertex size based on device
const VERTEX_SIZE = isMobileDevice() ? 0.025 : 0.03;

// --- Initialization ---
export function init(canvas) {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);

    // Camera
    const initialWidth = canvas.clientWidth || window.innerWidth;
    const initialHeight = canvas.clientHeight || window.innerHeight;
    const aspectRatio = (initialWidth > 0 && initialHeight > 0) ? initialWidth / initialHeight : 1;
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera.position.z = 3;

    // Renderer with mobile optimizations
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: !isMobileDevice(), // Only use antialiasing on desktop
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance' // Request high performance GPU
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(isMobileDevice() ? Math.min(2, window.devicePixelRatio) : window.devicePixelRatio);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const headLight = new THREE.DirectionalLight(0xffffff, 0.8);
    // position on the camera's +Z axis so it always points "forward"
    headLight.position.set(0, 0, 1);
    camera.add(headLight);
    scene.add(camera); // Add camera to scene to ensure headlight works
    headLight.visible = false;

    // Controls with mobile optimizations
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = isMobileDevice() ? 0.4 : 0.5; // Slower rotation for mobile
    controls.zoomSpeed = isMobileDevice() ? 0.7 : 1.0;   // Slower zoom for mobile

    // Edge Material
    edgeMaterial = new THREE.LineBasicMaterial({ color: 0x1a1a1a });

    // Vertex Material - for the spheres
    vertexMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000
    });

    // Event Listeners & Startup
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', () => {
        // Wait for orientation change to complete
        setTimeout(onWindowResize, 300);
    });
    
    // Initial resize
    setTimeout(onWindowResize, 100);
    animate();
    
    // Return renderer and controls for potential external modification
    return { renderer, controls };
}

// Helper to check readiness
export function isReady() {
    return isViewerReady && currentPolytopeMesh !== null && faceMaterials.length > 0;
}

// --- Geometry Processing ---

/**
 * Triangulates faces using a simple fan method.
 * Assumes convex, planar faces (typical for Sage library polytopes).
 * @param {number[][]} originalFacesData - Array of arrays, each inner array contains vertex indices for an original face.
 * @returns {{indices: number[], groups: {start: number, count: number, materialIndex: number}[]}} Object containing triangulated indices and geometry groups. Returns empty arrays if input is invalid.
 */
function triangulateFaces(originalFacesData) {
    const triangulatedIndices = [];
    const geometryGroups = [];
    let vertexIndexOffset = 0; // Running offset in the final index buffer
    let validMaterialIndex = 0; // Index for materials corresponding to faces that yield triangles

    if (!originalFacesData || !Array.isArray(originalFacesData)) {
        console.error("Invalid originalFacesData provided to triangulateFaces.");
        return { indices: [], groups: [] };
    }

    originalFacesData.forEach((originalFaceVertexIndices, faceIdx) => {
        // Basic validation for the face itself
        if (!originalFaceVertexIndices || !Array.isArray(originalFaceVertexIndices) || originalFaceVertexIndices.length < 3) {
            console.warn(`Skipping original face ${faceIdx}: needs at least 3 vertices. Got:`, originalFaceVertexIndices);
            return; // Skip this face, don't add a group or material index
        }

        const groupStartIndex = vertexIndexOffset; // Where this face's triangles will start
        let trianglesAddedCount = 0;
        const v0 = originalFaceVertexIndices[0];

        // Fan Triangulation: (v0, v1, v2), (v0, v2, v3), ...
        for (let i = 1; i < originalFaceVertexIndices.length - 1; i++) {
            const v1 = originalFaceVertexIndices[i];
            const v2 = originalFaceVertexIndices[i + 1];

            // Additional validation for indices within the face
            if (typeof v0 !== 'number' || typeof v1 !== 'number' || typeof v2 !== 'number') {
                console.error(`Invalid vertex index found during triangulation for original face ${faceIdx}. Indices: [${v0}, ${v1}, ${v2}]`);
                continue; // Skip this specific invalid triangle
            }

            triangulatedIndices.push(v0, v1, v2);
            trianglesAddedCount++;
            vertexIndexOffset += 3; // Advance offset by 3 indices per triangle
        }

        // Only add a group if triangles were successfully generated for this face
        if (trianglesAddedCount > 0) {
            const vertexCountForGroup = trianglesAddedCount * 3;
            geometryGroups.push({
                start: groupStartIndex,        // Start index in the combined index buffer
                count: vertexCountForGroup,    // Number of indices for this group
                materialIndex: validMaterialIndex // Maps to the faceMaterials array
            });
            validMaterialIndex++; // Increment the material index for the next valid face
        } else {
             console.warn(`No triangles generated for face ${faceIdx} despite having >= 3 vertices. Indices:`, originalFaceVertexIndices);
        }
    });

    return { indices: triangulatedIndices, groups: geometryGroups };
}

// --- Core Update Function ---
/** Creates/updates the face and edge meshes for the given polytope data. */
export function updatePolytopeMesh(polytopeData) {
    isViewerReady = false;

    // --- Cleanup ---
    if (currentPolytopeMesh) {
        scene.remove(currentPolytopeMesh);
        currentPolytopeMesh.geometry.dispose();
        faceMaterials.forEach(mat => mat.dispose()); // Dispose materials associated with the old mesh
        currentPolytopeMesh = null;
    }
    if (currentEdgesMesh) {
        scene.remove(currentEdgesMesh);
        currentEdgesMesh.geometry.dispose();
        currentEdgesMesh = null;
    }
    if (currentVerticesMesh) {
        scene.remove(currentVerticesMesh);
        if (currentVerticesMesh.isGroup) {
            // Clean up group of sphere meshes
            currentVerticesMesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        } else if (currentVerticesMesh.geometry) {
            // Clean up single mesh
            currentVerticesMesh.geometry.dispose();
        }
        currentVerticesMesh = null;
    }
    faceMaterials = []; // Reset materials array for the new polytope

    // --- Validate Input Data ---
    if (!polytopeData || !polytopeData.vertices || !polytopeData.vertices.length || !polytopeData.faces) {
        console.error("Invalid or empty polytope data provided to updatePolytopeMesh.");
        if (renderer && scene && camera) renderer.render(scene, camera);
        return;
    }

    // --- Prepare Vertex Data ---
    const faceGeometry = new THREE.BufferGeometry();
    const vertexPositions = polytopeData.vertices.flat();
    faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertexPositions, 3));

    // --- Triangulate Faces and Get Groups ---
    const { indices: faceIndices, groups: faceGroups } = triangulateFaces(polytopeData.faces);

    if (faceIndices.length === 0 || faceGroups.length === 0) {
        console.error("No valid triangles or groups generated from face data. Cannot create mesh.");
        if (renderer && scene && camera) renderer.render(scene, camera);
        return;
    }

    // --- Create Materials (One per *Group*, i.e., per original valid face) ---
    const defaultOpacity = 0.9; // Reset opacity for new mesh
    
    // Use simpler materials on mobile
    const materialType = isMobileDevice() ? 
        THREE.MeshLambertMaterial : // Simpler, faster material for mobile
        THREE.MeshStandardMaterial;  // Higher quality material for desktop
    
    for (let i = 0; i < faceGroups.length; i++) {
        let materialOptions = {
            color: 0xffffff, // Default color
            side: THREE.DoubleSide,
            transparent: true,
            opacity: defaultOpacity,
            depthWrite: true // Important for correct depth sorting with transparency
        };
        
        // Add PBR properties only if using MeshStandardMaterial
        if (materialType === THREE.MeshStandardMaterial) {
            materialOptions.metalness = 0.1;
            materialOptions.roughness = 0.75;
        }
        
        const material = new materialType(materialOptions);
        faceMaterials.push(material);
    }

    // --- Setup Face Geometry ---
    faceGeometry.setIndex(faceIndices); // Apply triangulated indices
    faceGeometry.clearGroups();         // Clear any previous groups
    faceGroups.forEach(group => {       // Add the new groups
        faceGeometry.addGroup(group.start, group.count, group.materialIndex);
    });
    // Compute normals BEFORE merging, as merging can change vertex count/indices
    faceGeometry.computeVertexNormals();

    // --- Vertex Merging (Attempt to fix float precision gaps) ---
    let finalFaceGeometry = faceGeometry; // Use original by default
    let mergeSuccess = false;
    try {
        const mergedGeometry = mergeVertices(faceGeometry, MERGE_VERTEX_TOLERANCE);
        if (mergedGeometry.attributes.position.count !== faceGeometry.attributes.position.count) {
             console.log(`Vertices merged successfully (tolerance: ${MERGE_VERTEX_TOLERANCE}). Count reduced from ${faceGeometry.attributes.position.count} to ${mergedGeometry.attributes.position.count}.`);
             // Important: Recompute normals AFTER merging
             mergedGeometry.computeVertexNormals();
             finalFaceGeometry = mergedGeometry; // Use the merged geometry
             faceGeometry.dispose(); // Dispose the original, unmerged geometry
             mergeSuccess = true;
        } else {
            console.log("Vertex merging did not alter vertex count (tolerance might be too low or geometry precise).");
            // No need to dispose faceGeometry here, as we'll use it directly
        }
    } catch (mergeError) {
        console.error("Error during vertex merging:", mergeError);
        // Fallback to using the original geometry
        finalFaceGeometry = faceGeometry;
    }

    // --- Create Face Mesh ---
    currentPolytopeMesh = new THREE.Mesh(finalFaceGeometry, faceMaterials); // Use final geometry (merged or original)
    scene.add(currentPolytopeMesh);

    // --- Create Vertices as Spheres ---
    // On mobile, use fewer segments for better performance
    const sphereSegments = isMobileDevice() ? 6 : 8;
    
    if (polytopeData.vertices && polytopeData.vertices.length > 0) {
        // Create a small sphere geometry for each vertex
        const sphereGeometry = new THREE.SphereGeometry(VERTEX_SIZE, sphereSegments, sphereSegments);
        
        // Create a group to hold all vertex spheres
        const verticesGroup = new THREE.Group();
        
        // Create and position a sphere at each vertex
        for (let i = 0; i < polytopeData.vertices.length; i++) {
            const vertex = polytopeData.vertices[i];
            const sphereMaterial = vertexMaterial.clone(); // Clone material for each sphere
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.set(parseFloat(vertex[0]), parseFloat(vertex[1]), parseFloat(vertex[2]));
            verticesGroup.add(sphere);
        }
        
        // Store the group for later access
        currentVerticesMesh = verticesGroup;
        currentVerticesMesh.visible = false; // Initially hidden
        scene.add(currentVerticesMesh);
    }

    // --- Create Edge Geometry (Based on ORIGINAL faces) ---
    const edgeGeometry = new THREE.BufferGeometry();
    const edgeIndices = [];
    const uniqueEdges = new Set();
    polytopeData.faces.forEach(originalFaceVertexIndices => {
        if (!originalFaceVertexIndices || originalFaceVertexIndices.length < 2) return;
        for (let i = 0; i < originalFaceVertexIndices.length; i++) {
            const idx1 = originalFaceVertexIndices[i];
            const idx2 = originalFaceVertexIndices[(i + 1) % originalFaceVertexIndices.length];
            if (typeof idx1 !== 'number' || typeof idx2 !== 'number') continue;
            const edgeKey = Math.min(idx1, idx2) + '_' + Math.max(idx1, idx2);
            if (!uniqueEdges.has(edgeKey)) {
                edgeIndices.push(idx1, idx2);
                uniqueEdges.add(edgeKey);
            }
        }
    });

    if (edgeIndices.length > 0) {
         // Edges need to use the *original* vertex positions if merging happened,
         // otherwise indices might point to merged/removed vertices.
         // So, we set the attribute directly from the initial data again.
        edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertexPositions, 3));
        edgeGeometry.setIndex(edgeIndices);
        currentEdgesMesh = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        scene.add(currentEdgesMesh);
    } else {
        console.warn("No edges generated for the polytope.");
    }

    // --- Finalize Scene Setup ---
    adjustCameraToObject(currentPolytopeMesh);
    isViewerReady = true;
    console.log("Polytope mesh, edges, and vertices updated in scene.");
}

// --- Camera Adjustment ---
function adjustCameraToObject(targetObject) {
    if (!targetObject || !targetObject.geometry) return;

    controls.reset(); // Reset controls state first

    try {
        // Ensure bounding sphere is computed on the geometry used by the mesh
        if (!targetObject.geometry.boundingSphere) {
            targetObject.geometry.computeBoundingSphere();
        }
        const sphere = targetObject.geometry.boundingSphere;

        if (sphere && sphere.radius > 0 && isFinite(sphere.radius)) {
            const center = sphere.center;
            const distance = Math.max(sphere.radius * 2.5, 2.0); // Camera distance based on radius
            camera.position.set(center.x, center.y, center.z + distance); // Position camera relative to center
            controls.target.copy(center); // Set orbit target
            camera.lookAt(center);
        } else {
            console.warn("Could not compute valid bounding sphere. Using default camera position.");
            camera.position.set(0, 0, 3);
            controls.target.set(0, 0, 0);
            camera.lookAt(0, 0, 0);
        }
        controls.update(); // Apply changes
    } catch(e){
         console.error("Error computing bounding sphere or setting camera:", e);
         // Fallback position on error
         camera.position.set(0, 0, 3);
         controls.target.set(0, 0, 0);
         camera.lookAt(0, 0, 0);
         controls.update();
    }
}

// --- Style Updates ---
export function applyColorScheme(schemeColors, singleHexColor) {
    if (!isReady()) return;

    if (schemeColors && Array.isArray(schemeColors) && schemeColors.length > 0) {
        faceMaterials.forEach((material, index) => {
            if (material?.color) {
                material.color.set(schemeColors[index % schemeColors.length]);
            }
        });
    } else if (singleHexColor && typeof singleHexColor === 'string') {
        faceMaterials.forEach(material => {
            if (material?.color) {
                material.color.set(singleHexColor);
            }
        });
    } else {
         console.warn("applyColorScheme called with invalid parameters.");
    }
}

export function updateFaceOpacity(opacityValue) {
    if (!isReady()) return;
    const numericOpacity = parseFloat(opacityValue);
    if (isNaN(numericOpacity)) return;
    const clampedOpacity = Math.max(0, Math.min(1, numericOpacity));
    faceMaterials.forEach(material => {
        if (material) {
            material.opacity = clampedOpacity;
        }
    });
}

export function toggleVertexEmphasis(enabled) {
    if (!currentVerticesMesh) return;
    currentVerticesMesh.visible = enabled;
}

export function updateVertexSize(size) {
    if (!currentVerticesMesh || !currentVerticesMesh.isGroup) return;
    
    // Store current rotation and visibility
    const currentRotation = new THREE.Euler().copy(currentVerticesMesh.rotation);
    const visible = currentVerticesMesh.visible;
    const currentColor = vertexMaterial.color.clone();
    
    // Remove old vertex group
    scene.remove(currentVerticesMesh);
    
    // Use fewer segments on mobile
    const sphereSegments = isMobileDevice() ? 6 : 8;
    
    // Create new sphere geometry with updated size
    const sphereGeometry = new THREE.SphereGeometry(size, sphereSegments, sphereSegments);
    
    // Create a new group
    const verticesGroup = new THREE.Group();
    
    // Recreate spheres with new size but keep positions
    currentVerticesMesh.children.forEach(oldSphere => {
        const newMaterial = new THREE.MeshBasicMaterial({ color: currentColor });
        const newSphere = new THREE.Mesh(sphereGeometry, newMaterial);
        newSphere.position.copy(oldSphere.position);
        verticesGroup.add(newSphere);
    });
    
    // Clean up old meshes
    currentVerticesMesh.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    });
    
    // Set up the new group
    verticesGroup.rotation.copy(currentRotation);
    verticesGroup.visible = visible;
    currentVerticesMesh = verticesGroup;
    scene.add(currentVerticesMesh);
}

export function updateVertexColor(color) {
    if (!currentVerticesMesh || !currentVerticesMesh.isGroup) return;
    
    // Update material color for each sphere
    currentVerticesMesh.children.forEach(sphere => {
        if (sphere.material) {
            sphere.material.color.set(color);
        }
    });
    
    // Save color in vertex material for future meshes
    vertexMaterial.color.set(color);
}

export function toggleAutorotation(enabled) {
    autoRotationEnabled = enabled;
    
    // If disabling autorotation, reset rotation to prevent weird angles
    if (!enabled && currentPolytopeMesh) {
        currentPolytopeMesh.rotation.set(0, 0, 0);
        if (currentEdgesMesh) currentEdgesMesh.rotation.set(0, 0, 0);
        if (currentVerticesMesh) currentVerticesMesh.rotation.set(0, 0, 0);
    }
}

// --- Export ---
export function exportToPNG() {
    if (!renderer || !scene || !camera) {
         console.error("Cannot export: Viewer not initialized.");
         alert("Cannot export image: Viewer not ready.");
         return;
    }
    try {
        renderer.render(scene, camera); // Ensure render before export
        const dataURL = renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'polytope_export.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to export canvas to PNG:", error);
        alert("Error exporting image. See browser console for details.");
    }
}

// Mobile-optimized GIF export
export function exportToGIF(duration = 3, fps = 15, quality = 10) {
    console.log(`Creating GIF with: ${duration}s duration, ${fps} FPS, quality ${quality}`);
    
    // Use lower quality settings for mobile
    const useMobileSettings = isMobileDevice();
    const actualFps = useMobileSettings ? Math.min(fps, 12) : fps; // Lower FPS for mobile
    const actualQuality = useMobileSettings ? Math.min(quality, 5) : quality; // Lower quality for mobile
    const actualDuration = useMobileSettings ? Math.min(duration, 2) : duration; // Shorter duration for mobile
  
    if (!renderer || !scene || !camera) {
        console.error("Cannot export: Viewer not initialized.");
        alert("Cannot export GIF: Viewer not ready.");
        return;
    }
  
    // Check if GIF.js is available
    if (typeof GIF === 'undefined') {
        console.error("GIF.js library not loaded.");
        alert("GIF export requires the GIF.js library which isn't loaded correctly.");
        return;
    }
  
    try {
        // Create progress indicator
        const progressDiv = document.createElement('div');
        progressDiv.style.position = 'absolute';
        progressDiv.style.top = '50%';
        progressDiv.style.left = '50%';
        progressDiv.style.transform = 'translate(-50%, -50%)';
        progressDiv.style.padding = '20px';
        progressDiv.style.background = 'rgba(0,0,0,0.7)';
        progressDiv.style.color = 'white';
        progressDiv.style.borderRadius = '5px';
        progressDiv.style.zIndex = '1000';
        progressDiv.textContent = 'Recording frames...';
        document.body.appendChild(progressDiv);
    
        // The current rotation states
        const wasAutorotating = autoRotationEnabled;
    
        // Force enable autorotation
        toggleAutorotation(true);
    
        // Reset rotations for a clean start
        if (currentPolytopeMesh) currentPolytopeMesh.rotation.set(0, 0, 0);
        if (currentEdgesMesh) currentEdgesMesh.rotation.set(0, 0, 0);
        if (currentVerticesMesh) currentVerticesMesh.rotation.set(0, 0, 0);
    
        // Create a GIF recorder
        const gif = new GIF({
            workers: useMobileSettings ? 1 : 2, // Use fewer workers on mobile
            quality: actualQuality,
            width: useMobileSettings ? Math.min(renderer.domElement.width, 480) : renderer.domElement.width,
            height: useMobileSettings ? Math.min(renderer.domElement.height, 480) : renderer.domElement.height,
            workerScript: './vendor/gif.js/gif.worker.js'
        });
    
        // Handle GIF completion
        gif.on('finished', function(blob) {
            console.log("GIF processing complete!");
            
            // Remove progress indicator
            document.body.removeChild(progressDiv);
            
            // Restore original state
            if (!wasAutorotating) {
                toggleAutorotation(false);
            }
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'polytope_animation.gif';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
        });
    
        // Handle GIF progress
        gif.on('progress', function(p) {
            progressDiv.textContent = `Processing GIF: ${Math.round(p * 100)}%`;
        });
    
        const totalFrames = Math.floor(actualDuration * actualFps);
        console.log(`Will capture ${totalFrames} frames`);

        let framesCaptured = 0;

        // Calculate the rotation increment for a more reasonable rotation
        // Adjust this value to control rotation speed - lower = slower
        const totalRotation = Math.PI*0.4; // Half turn (180 degrees) for the full animation
        const rotationIncrement = totalRotation / totalFrames;

        function captureFrame() {
            // Render current frame
            renderer.render(scene, camera);
            
            // Add frame to the GIF
            gif.addFrame(renderer.domElement, { copy: true, delay: 1000 / actualFps });
            framesCaptured++;
            progressDiv.textContent = `Recording: ${Math.round((framesCaptured / totalFrames) * 100)}%`;
            
            // Check if we need more frames
            if (framesCaptured < totalFrames) {
                // Apply a gentler rotation
                currentPolytopeMesh.rotation.y += rotationIncrement;
                currentPolytopeMesh.rotation.x += rotationIncrement * 0.2; // Much gentler on X axis
                currentPolytopeMesh.rotation.z += rotationIncrement * 0.1; // Very subtle on Z axis
                
                // Apply to edges and vertices
                if (currentEdgesMesh) currentEdgesMesh.rotation.copy(currentPolytopeMesh.rotation);
                if (currentVerticesMesh) currentVerticesMesh.rotation.copy(currentPolytopeMesh.rotation);
                
                // Schedule next frame capture
                setTimeout(captureFrame, 1000 / actualFps);
            } else {
                // We're done capturing frames
                console.log(`Finished capturing ${framesCaptured} frames, rendering GIF`);
                progressDiv.textContent = "Processing GIF...";
                gif.render();
            }
        }
    
        // Start capturing
        captureFrame();
    
    } catch (e) {
        console.error("Error in GIF export:", e);
        alert("Error creating GIF: " + e.message);
    }
}

// --- Internal Helpers ---
function onWindowResize() {
    if (!renderer || !camera) return;
    
    const canvas = renderer.domElement;
    
    // Get current dimensions
    const container = canvas.parentElement || document.body;
    let width = container.clientWidth;
    let height = container.clientHeight;
    
    // In mobile portrait mode, we might need to adjust for control panel
    if (isMobileDevice()) {
        const controlsPanel = document.getElementById('controls');
        const isControlsVisible = controlsPanel && controlsPanel.classList.contains('visible');
        
        if (isControlsVisible && window.innerWidth < window.innerHeight) {
            // If controls are visible in portrait mode, adjust canvas height
            height = Math.max(1, window.innerHeight - controlsPanel.offsetHeight);
        } else {
            // Full screen if controls are hidden
            height = window.innerHeight;
        }
        width = window.innerWidth;
    }
    
    // Ensure minimum dimensions
    width = Math.max(1, width);
    height = Math.max(1, height);
    
    // Only resize if dimensions have changed
    if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}

function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  if (controls) controls.update();
  
  // Handle autorotation if enabled
  if (autoRotationEnabled && currentPolytopeMesh) {
    // Mobile-friendly rotation speed (slightly slower on mobile)
    const rotationFactor = isMobileDevice() ? 0.8 : 1.0;
    
    // Rotate around multiple axes for a more interesting effect
    currentPolytopeMesh.rotation.y += 0.005 * rotationFactor;  // Primary rotation
    currentPolytopeMesh.rotation.x += 0.002 * rotationFactor;  // Slight tilt on X axis
    currentPolytopeMesh.rotation.z += 0.001 * rotationFactor;  // Minimal rotation on Z axis
    
    // Apply the same rotation to edges and vertices to keep them aligned
    if (currentEdgesMesh) {
      currentEdgesMesh.rotation.copy(currentPolytopeMesh.rotation);
    }
    if (currentVerticesMesh) {
      currentVerticesMesh.rotation.copy(currentPolytopeMesh.rotation);
    }
  }
  
  // Capture frame if recording
  if (captureFrameFunction) {
    const continueCapturing = captureFrameFunction();
    if (!continueCapturing) {
      captureFrameFunction = null;
    }
  }
  
  // Render the scene - only render when needed on mobile for performance
  if (renderer && scene && camera) {
    if (!isMobileDevice() || autoRotationEnabled || controls.update()) {
      renderer.render(scene, camera);
    }
  }
}
