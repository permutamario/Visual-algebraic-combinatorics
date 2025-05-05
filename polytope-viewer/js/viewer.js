import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// Import BufferGeometryUtils for vertex merging
//import { BufferGeometryUtils } from 'three/addons/utils/BufferGeometryUtils.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

let scene, camera, renderer, controls;
let currentPolytopeMesh = null; // Mesh for faces using multi-material groups
let currentEdgesMesh = null;    // LineSegments mesh for edges
let faceMaterials = [];         // Array of MeshStandardMaterial for faces
let edgeMaterial;               // Single LineBasicMaterial for edges
let isViewerReady = false;      // Flag to check if mesh exists and is ready for updates

// --- Constants ---
// Tolerance for merging vertices. Adjust carefully if needed.
// Smaller values are less aggressive but might not fix all gaps.
// Larger values might distort the geometry. Start small.
const MERGE_VERTEX_TOLERANCE = 1e-3; // e.g., 0.000001 units

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

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        preserveDrawingBuffer: true
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const headLight = new THREE.DirectionalLight(0xffffff, 0.8);
    // position on the camera’s +Z axis so it always points “forward”
    headLight.position.set(0, 0, 1);
    camera.add(headLight);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;

    // Edge Material
    edgeMaterial = new THREE.LineBasicMaterial({ color: 0x1a1a1a });

    // Event Listeners & Startup
    window.addEventListener('resize', onWindowResize);
    setTimeout(onWindowResize, 100);
    animate();
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

/**
 * MINIMAL TRIANGULATION: Handles ONLY 3-vertex (tris) and 4-vertex (quads) faces.
 * Skips faces with 5+ vertices.
 * Assumes convex faces.
 * @param {number[][]} originalFacesData - Array of arrays of vertex indices.
 * @returns {{indices: number[], groups: {start: number, count: number, materialIndex: number}[]}} Object containing triangulated indices and geometry groups.
 */
function minimalTriangulateQuadsAndTris(originalFacesData) {
    const triangulatedIndices = [];
    const geometryGroups = [];
    let vertexIndexOffset = 0;
    let validMaterialIndex = 0; // Index for materials corresponding to processed faces

    if (!originalFacesData || !Array.isArray(originalFacesData)) {
        console.error("Invalid originalFacesData provided to minimalTriangulateQuadsAndTris.");
        return { indices: [], groups: [] };
    }

    originalFacesData.forEach((originalFaceVertexIndices, faceIdx) => {
        if (!originalFaceVertexIndices || !Array.isArray(originalFaceVertexIndices)) {
             console.warn(`Skipping face ${faceIdx}: Invalid face data.`);
             return;
        }

        const numVerts = originalFaceVertexIndices.length;
        let trianglesAddedCount = 0;
        const groupStartIndex = vertexIndexOffset;

        if (numVerts === 3) {
            // It's already a triangle
            const [v0, v1, v2] = originalFaceVertexIndices;
            // Basic index validation
            if (typeof v0 === 'number' && typeof v1 === 'number' && typeof v2 === 'number') {
                 triangulatedIndices.push(v0, v1, v2);
                 trianglesAddedCount = 1;
                 vertexIndexOffset += 3;
            } else {
                console.error(`Invalid index in triangle face ${faceIdx}:`, originalFaceVertexIndices);
            }

        } else if (numVerts === 4) {
            // It's a quad, split into two triangles: (v0, v1, v2) and (v0, v2, v3)
            const [v0, v1, v2, v3] = originalFaceVertexIndices;
             // Basic index validation
            if (typeof v0 === 'number' && typeof v1 === 'number' && typeof v2 === 'number' && typeof v3 === 'number') {
                triangulatedIndices.push(v0, v1, v2); // First triangle
                triangulatedIndices.push(v0, v2, v3); // Second triangle
                trianglesAddedCount = 2;
                vertexIndexOffset += 6; // 3 indices * 2 triangles
            } else {
                 console.error(`Invalid index in quad face ${faceIdx}:`, originalFaceVertexIndices);
            }

        } else {
            // --- This function ONLY handles tris and quads ---
            console.warn(`Skipping face ${faceIdx}: Has ${numVerts} vertices. This minimal function only handles 3 or 4.`);
            return; // Skip this face entirely, do not add a group/material
        }

        // Add a group ONLY if triangles were successfully added
        if (trianglesAddedCount > 0) {
            const vertexCountForGroup = trianglesAddedCount * 3;
            geometryGroups.push({
                start: groupStartIndex,
                count: vertexCountForGroup,
                materialIndex: validMaterialIndex
            });
            validMaterialIndex++; // Increment the material index only for processed faces
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
    for (let i = 0; i < faceGroups.length; i++) {
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff, // Default color
            metalness: 0.1,
            roughness: 0.75,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: defaultOpacity,
            depthWrite: true, // Important for correct depth sorting with transparency
            // Consider adding polygonOffset for Z-fighting if merging isn't enough
            // polygonOffset: true,
            // polygonOffsetFactor: 1, // Adjust as needed
            // polygonOffsetUnits: 1
        });
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
    // -------------------------------------------------------------


    // --- Create Face Mesh ---
    currentPolytopeMesh = new THREE.Mesh(finalFaceGeometry, faceMaterials); // Use final geometry (merged or original)
    scene.add(currentPolytopeMesh);


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
    console.log("Polytope mesh and edges updated in scene.");
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

// --- Internal Helpers ---
function onWindowResize() {
    if (!renderer || !camera) return;
    const canvas = renderer.domElement;
    const controlsElement = document.getElementById('controls');
    const container = canvas.parentElement || document.body;
    const controlsWidth = controlsElement ? controlsElement.offsetWidth : 0;
    const width = Math.max(1, container.clientWidth - controlsWidth);
    const height = Math.max(1, container.clientHeight);
    if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}
