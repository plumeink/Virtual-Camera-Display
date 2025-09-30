// Application main entry file

// Initialize application
function initApp() {
    // Check media device support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Browser does not support camera access');
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = window.getTextSync('statusBrowserNotSupported');
            statusElement.style.color = '#ff6b6b';
        }
        return;
    }
    
    // Initialize all modules
    try {
        // Initialize status module
        window.appModules.status.init();
        
        // Initialize camera module
        window.appModules.camera.init();
        
        // Initialize resolution module
        window.appModules.resolution.init();
        
        // Initialize UI module
        window.appModules.ui.init();
        
        console.log('All modules initialized');
        
        // Wait a moment before attempting to connect to ensure permission system is ready
        setTimeout(() => {
            window.appModules.camera.autoConnectCamera();
        }, 500);
    } catch (error) {
        console.error('Application initialization failed:', error);
        window.appModules.status.updateStatus('Application initialization failed: ' + error.message, true);
    }
}

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // 如果页面已经加载完成，则直接初始化
    initApp();
}

// 添加全局错误处理
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.appModules && window.appModules.status) {
        window.appModules.status.updateStatus('Application error occurred, please restart the application', true);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise rejection:', event.reason);
    if (window.appModules && window.appModules.status) {
        window.appModules.status.updateStatus('Application async error occurred, please restart the application', true);
    }
});