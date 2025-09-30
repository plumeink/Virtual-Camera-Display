// Status Management Module
const StatusModule = {
    statusElement: null,
    permissionHelpElement: null,
    retryBtn: null,
    closeHelpBtn: null,
    helpBtn: null,
    
    // Initialize status module
    init() {
        this.statusElement = document.getElementById('status');
        this.permissionHelpElement = document.getElementById('permissionHelp');
        this.retryBtn = document.getElementById('retryBtn');
        this.closeHelpBtn = document.getElementById('closeHelpBtn');
        this.helpBtn = document.getElementById('helpBtn');
        
        // Bind events
        this.retryBtn.addEventListener('click', () => window.appModules.camera.autoConnectCamera());
        this.closeHelpBtn.addEventListener('click', this.hidePermissionHelp.bind(this));
        this.helpBtn.addEventListener('click', this.showPermissionHelp.bind(this));
    },
    
    // Update status text
    updateStatus(message, isError = false) {
        if (this.statusElement) {
            this.statusElement.textContent = message;
            if (isError) {
                this.statusElement.style.color = '#ff6b6b';
            } else {
                this.statusElement.style.color = 'white';
            }
        }
    },
    
    // Show permission help popup
    showPermissionHelp() {
        if (this.permissionHelpElement) {
            this.permissionHelpElement.classList.remove('hidden');
        }
    },
    
    // Hide permission help popup
    hidePermissionHelp() {
        if (this.permissionHelpElement) {
            this.permissionHelpElement.classList.add('hidden');
        }
    }
};

// Export module
window.appModules = window.appModules || {};
window.appModules.status = StatusModule;