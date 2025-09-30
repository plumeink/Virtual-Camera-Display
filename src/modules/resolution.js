// Resolution Management Module
const ResolutionModule = {
    videoElement: null,
    resolutionDisplay: null,
    presetResolution: null,
    customWidth: null,
    customHeight: null,
    applyResolution: null,
    
    // Initialize resolution module
    init() {
        this.videoElement = document.getElementById('cameraPreview');
        this.resolutionDisplay = document.getElementById('resolutionDisplay');
        this.presetResolution = document.getElementById('presetResolution');
        this.customWidth = document.getElementById('customWidth');
        this.customHeight = document.getElementById('customHeight');
        this.applyResolution = document.getElementById('applyResolution');
        
        // Initialize resolution selector
        this.initializeResolutionSelector();
    },
    
    // Initialize resolution selector
    initializeResolutionSelector() {
        // Preset resolution selection event
        this.presetResolution.addEventListener('change', function() {
            const resolutionModule = window.appModules.resolution;
            if (this.value !== 'auto') {
                const [width, height] = this.value.split('x').map(Number);
                resolutionModule.customWidth.value = width;
                resolutionModule.customHeight.value = height;
            } else {
                resolutionModule.customWidth.value = '';
                resolutionModule.customHeight.value = '';
            }
        });
        
        // Apply custom resolution
        this.applyResolution.addEventListener('click', function() {
            const resolutionModule = window.appModules.resolution;
            if (resolutionModule.customWidth.value && resolutionModule.customHeight.value) {
                const width = parseInt(resolutionModule.customWidth.value);
                const height = parseInt(resolutionModule.customHeight.value);
                
                if (width > 0 && height > 0) {
                    window.appModules.status.updateStatus(`${window.getTextSync('statusCustomResolution')}${width}x${height}`);
                    resolutionModule.applyCustomResolution(width, height);
                } else {
                    window.appModules.status.updateStatus(window.getTextSync('statusInvalidResolution'), true);
                }
            } else if (resolutionModule.presetResolution.value !== 'auto') {
                const [width, height] = resolutionModule.presetResolution.value.split('x').map(Number);
                window.appModules.status.updateStatus(`${window.getTextSync('statusPresetResolution')}${width}x${height}`);
                resolutionModule.applyCustomResolution(width, height);
            } else {
                window.appModules.status.updateStatus(window.getTextSync('statusAutoResolution'));
                resolutionModule.switchToAutoResolution();
            }
        });
    },
    
    // Switch to auto resolution detection mode
    switchToAutoResolution() {
        // Hide resolution display label
        if (this.resolutionDisplay) {
            this.resolutionDisplay.classList.add('hidden');
        }
        
        // Reset video element style to freely adjust size to match camera's original resolution
        if (this.videoElement) {
            this.videoElement.style.objectFit = 'none';
            this.videoElement.style.width = '100%';
            this.videoElement.style.height = '100%';
        }
        
        // Force re-acquisition of camera's original resolution
        if (window.appModules.camera.currentStream && this.videoElement) {
            // Stop current stream
            window.appModules.camera.stopVideoStream();
            // Reconnect camera to get original resolution
            setTimeout(() => {
                window.appModules.camera.autoConnectCamera();
            }, 100);
        }
        
        // Re-enable video size change monitoring
        this.videoElement.onresize = function() {
            window.appModules.resolution.updateVideoDimensions();
        };
        
        // Re-enable video metadata load completion event monitoring
        this.videoElement.onloadedmetadata = function() {
            window.appModules.resolution.updateVideoDimensions();
        };
    },
    
    // Update video dimensions and send to main process
    updateVideoDimensions() {
        try {
            if (window.electronAPI && typeof window.electronAPI.updateWindowSize === 'function' && 
                this.videoElement && this.videoElement.videoWidth > 0 && this.videoElement.videoHeight > 0) {
                
                const videoWidth = this.videoElement.videoWidth;
                const videoHeight = this.videoElement.videoHeight;
                console.log('Detected camera actual pixel dimensions:', videoWidth, 'x', videoHeight);
                
                // Display detected resolution on interface
                if (this.resolutionDisplay) {
                    this.resolutionDisplay.textContent = `${window.getTextSync('labelResolutionDisplay')}${videoWidth}×${videoHeight}`;
                    this.resolutionDisplay.classList.remove('hidden');
                }
                
                // Ensure video element displays correctly
                this.videoElement.style.display = 'block';
                this.videoElement.style.width = '100%';
                this.videoElement.style.height = '100%';
                
                // Directly send original camera dimensions without any scaling or adjustment
                // Ensure window strictly adjusts according to camera's output pixel ratio
                window.electronAPI.updateWindowSize({ width: videoWidth, height: videoHeight });
            } else if (this.videoElement) {
                console.warn('Cannot get valid video dimensions, using default dimensions');
                // Ensure video element is at least visible
                this.videoElement.style.display = 'block';
                this.videoElement.style.width = '100%';
                this.videoElement.style.height = '100%';
            }
        } catch (error) {
            console.error('Error updating video dimensions:', error);
            // Ensure video element is at least visible
            if (this.videoElement) {
                this.videoElement.style.display = 'block';
                this.videoElement.style.width = '100%';
                this.videoElement.style.height = '100%';
            }
        }
    },
    
    // Apply custom resolution and adjust window size
    applyCustomResolution(width, height) {
        console.log('Applying custom resolution:', width, 'x', height);
        
        // Confirm window.electronAPI exists
        if (!window.electronAPI) {
            console.error('electronAPI object does not exist');
            return;
        }
        
        if (!window.electronAPI.updateWindowSize) {
            console.error('updateWindowSize method does not exist');
            return;
        }
        
        // Try modifying video element style to match specified resolution
        if (this.videoElement) {
            this.videoElement.style.objectFit = 'contain';
        }
        
        // Disable automatic detection of video size changes to prevent window size from being reset
        this.videoElement.onresize = function() {
            // Do not respond to video size changes in manual resolution setting mode
        };
        
        // Use setTimeout for delayed call to ensure no other code interference
        setTimeout(() => {
            // Force adjust window size to specified resolution
            console.log('Adjusting window dimensions:', width, 'x', height);
            window.electronAPI.updateWindowSize({ width: width, height: height });
            console.log('Window dimension update request sent');
        }, 100);
        
        // Display currently used custom resolution in resolution display area
        if (this.resolutionDisplay) {
            this.resolutionDisplay.textContent = `${window.getTextSync('labelCustomResolution')}${width}×${height}`;
            this.resolutionDisplay.classList.remove('hidden');
        }
    },
    
    // Force set window size (independent of camera auto-detection)
    forceWindowSize(width, height) {
        if (window.electronAPI && typeof window.electronAPI.updateWindowSize === 'function') {
            // Directly send specified dimensions, maintaining consistent window size update behavior with auto-detection mode
            console.log('Forcing window dimensions:', width, 'x', height);
            window.electronAPI.updateWindowSize({ width: width, height: height });
        }
    }
};

// Export module
window.appModules = window.appModules || {};
window.appModules.resolution = ResolutionModule;