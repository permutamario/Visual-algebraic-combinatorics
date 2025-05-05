import GIF from 'gif.js';

let isRecording = false;
let gifRecorder = null;
let frameCount = 0;
let targetFrames = 0;

export function startRecording(renderer, scene, camera, options = {}) {
  const { 
    duration = 10, // seconds
    fps = 15,
    quality = 10,
    onProgress = () => {},
    onFinished = () => {}
  } = options;
  
  if (isRecording) return;
  
  targetFrames = duration * fps;
  frameCount = 0;
  isRecording = true;
  
  // Initialize gif.js
  gifRecorder = new GIF({
    quality: quality,
    workers: 2,
    width: renderer.domElement.width,
    height: renderer.domElement.height,
    workerScript: 'https://cdn.jsdelivr.net/npm/gif.js/dist/gif.worker.js'
  });
  
  // Set up event handlers
  gifRecorder.on('progress', onProgress);
  gifRecorder.on('finished', (blob) => {
    isRecording = false;
    onFinished(blob);
  });
  
  // Return a function that should be called on each frame
  return function captureFrame() {
    if (!isRecording) return false;
    
    // Render the scene
    renderer.render(scene, camera);
    
    // Capture the current canvas content
    gifRecorder.addFrame(renderer.domElement, { copy: true, delay: 1000 / fps });
    
    frameCount++;
    
    // Check if we've captured enough frames
    if (frameCount >= targetFrames) {
      isRecording = false;
      gifRecorder.render(); // Start processing the GIF
      return false; // Stop capturing
    }
    
    return true; // Continue capturing
  };
}

export function isCurrentlyRecording() {
  return isRecording;
}
