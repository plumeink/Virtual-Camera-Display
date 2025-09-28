// 应用主入口文件

// 初始化应用
function initApp() {
    // 检查媒体设备支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('浏览器不支持摄像头访问');
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = '您的浏览器不支持摄像头访问';
            statusElement.style.color = '#ff6b6b';
        }
        return;
    }
    
    // 初始化各个模块
    try {
        // 初始化状态模块
        window.appModules.status.init();
        
        // 初始化摄像头模块
        window.appModules.camera.init();
        
        // 初始化分辨率模块
        window.appModules.resolution.init();
        
        // 初始化UI模块
        window.appModules.ui.init();
        
        console.log('所有模块初始化完成');
        
        // 等待一会儿再尝试连接，确保权限系统已就绪
        setTimeout(() => {
            window.appModules.camera.autoConnectCamera();
        }, 500);
    } catch (error) {
        console.error('应用初始化失败:', error);
        window.appModules.status.updateStatus('应用初始化失败: ' + error.message, true);
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
    console.error('全局错误:', event.error);
    if (window.appModules && window.appModules.status) {
        window.appModules.status.updateStatus('应用发生错误，请重启应用', true);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
    if (window.appModules && window.appModules.status) {
        window.appModules.status.updateStatus('应用发生异步错误，请重启应用', true);
    }
});