// UI交互模块
const UIModule = {
    closeBtn: null,
    
    // 初始化UI模块
    init() {
        this.closeBtn = document.getElementById('closeBtn');
        
        // 绑定关闭窗口事件
        this.closeBtn.addEventListener('click', this.closeWindow.bind(this));
        
        // 设置页面可见性变化处理
        this.setupVisibilityHandler();
        
        // 设置定期检查摄像头连接状态
        this.setupCameraConnectionCheck();
    },
    
    // 关闭窗口
    closeWindow() {
        if (window.electronAPI && window.electronAPI.closeWindow) {
            window.electronAPI.closeWindow();
        } else {
            window.close();
        }
    },
    
    // 设置页面可见性变化处理
    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            const videoElement = document.getElementById('cameraPreview');
            if (document.hidden) {
                // 页面隐藏时暂停视频
                videoElement.pause();
            } else {
                // 页面显示时恢复视频
                videoElement.play().catch(e => console.error('恢复播放失败:', e));
            }
        });
    },
    
    // 设置定期检查摄像头连接状态
    setupCameraConnectionCheck() {
        setInterval(() => {
            if (window.appModules.camera && window.appModules.camera.currentStream) {
                const videoTrack = window.appModules.camera.currentStream.getVideoTracks()[0];
                if (videoTrack && videoTrack.readyState === 'ended') {
                    window.appModules.status.updateStatus('摄像头连接丢失', true);
                    window.appModules.camera.stopVideoStream();
                }
            }
        }, 5000);
    }
};

// 导出模块
window.appModules = window.appModules || {};
window.appModules.ui = UIModule;