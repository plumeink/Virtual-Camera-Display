const { contextBridge, ipcRenderer } = require('electron');

// Expose limited API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Send video size information to main process
  updateWindowSize: (dimensions) => {
    // Support two calling methods: 1. Pass object {width, height} 2. Pass two separate parameters width, height
    let width, height;
    if (typeof dimensions === 'object' && dimensions !== null) {
      // First case: Object passed
      width = dimensions.width;
      height = dimensions.height;
    } else {
      // Second case: Two separate parameters passed
      width = dimensions;
      height = arguments[1];
    }
    
    console.log('Sending video dimensions to main process:', width, 'x', height);
    ipcRenderer.send('update-window-size', { width, height });
  },
  
  // Close window
  closeWindow: () => {
    ipcRenderer.send('close-window');
  }
});

// Listen for messages from main process
ipcRenderer.on('message', (event, message) => {
  console.log('Received message from main process:', message);
});