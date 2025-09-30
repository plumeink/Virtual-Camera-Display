// UI Interaction Module
const UIModule = {
    closeBtn: null,
    
    // Initialize UI Module
    init() {
        this.closeBtn = document.getElementById('closeBtn');
        
        // Bind close window event
        this.closeBtn.addEventListener('click', this.closeWindow.bind(this));
        
        // Set up page visibility handler
        this.setupVisibilityHandler();
        
        // Set up periodic camera connection check
        this.setupCameraConnectionCheck();
    },
    
    // Close window
    closeWindow() {
        if (window.electronAPI && window.electronAPI.closeWindow) {
            window.electronAPI.closeWindow();
        } else {
            window.close();
        }
    },
    
    // Set up page visibility handler
    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            const videoElement = document.getElementById('cameraPreview');
            if (document.hidden) {
                // Pause video when page is hidden
                videoElement.pause();
            } else {
                // Resume video when page is visible
                videoElement.play().catch(e => console.error('Failed to resume playback:', e));
            }
        });
    },
    
    // Set up periodic camera connection check
    setupCameraConnectionCheck() {
        setInterval(() => {
            if (window.appModules.camera && window.appModules.camera.currentStream) {
                const videoTrack = window.appModules.camera.currentStream.getVideoTracks()[0];
                if (videoTrack && videoTrack.readyState === 'ended') {
                    window.appModules.status.updateStatus(window.getTextSync('statusCameraLost'), true);
                    window.appModules.camera.stopVideoStream();
                }
            }
        }, 5000);
    }
};

// Export module
window.appModules = window.appModules || {};
window.appModules.ui = UIModule;