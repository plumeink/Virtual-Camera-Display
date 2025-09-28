// 分辨率管理模块
const ResolutionModule = {
    videoElement: null,
    resolutionDisplay: null,
    presetResolution: null,
    customWidth: null,
    customHeight: null,
    applyResolution: null,
    
    // 初始化分辨率模块
    init() {
        this.videoElement = document.getElementById('cameraPreview');
        this.resolutionDisplay = document.getElementById('resolutionDisplay');
        this.presetResolution = document.getElementById('presetResolution');
        this.customWidth = document.getElementById('customWidth');
        this.customHeight = document.getElementById('customHeight');
        this.applyResolution = document.getElementById('applyResolution');
        
        // 初始化分辨率选择器
        this.initializeResolutionSelector();
    },
    
    // 初始化分辨率选择器
    initializeResolutionSelector() {
        // 预设分辨率选择事件
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
        
        // 应用自定义分辨率
        this.applyResolution.addEventListener('click', function() {
            const resolutionModule = window.appModules.resolution;
            if (resolutionModule.customWidth.value && resolutionModule.customHeight.value) {
                const width = parseInt(resolutionModule.customWidth.value);
                const height = parseInt(resolutionModule.customHeight.value);
                
                if (width > 0 && height > 0) {
                    window.appModules.status.updateStatus(`应用自定义分辨率: ${width}x${height}`);
                    resolutionModule.applyCustomResolution(width, height);
                } else {
                    window.appModules.status.updateStatus('请输入有效的分辨率数值', true);
                }
            } else if (resolutionModule.presetResolution.value !== 'auto') {
                const [width, height] = resolutionModule.presetResolution.value.split('x').map(Number);
                window.appModules.status.updateStatus(`应用预设分辨率: ${width}x${height}`);
                resolutionModule.applyCustomResolution(width, height);
            } else {
                window.appModules.status.updateStatus('已切换为自动检测分辨率模式');
                resolutionModule.switchToAutoResolution();
            }
        });
    },
    
    // 切换到自动检测分辨率模式
    switchToAutoResolution() {
        // 隐藏分辨率显示标签
        if (this.resolutionDisplay) {
            this.resolutionDisplay.classList.add('hidden');
        }
        
        // 重置视频元素样式，让它能够自由调整大小以匹配摄像头原始分辨率
        if (this.videoElement) {
            this.videoElement.style.objectFit = 'none';
            this.videoElement.style.width = '100%';
            this.videoElement.style.height = '100%';
        }
        
        // 强制重新获取摄像头原始分辨率
        if (window.appModules.camera.currentStream && this.videoElement) {
            // 停止当前流
            window.appModules.camera.stopVideoStream();
            // 重新连接摄像头以获取原始分辨率
            setTimeout(() => {
                window.appModules.camera.autoConnectCamera();
            }, 100);
        }
        
        // 重新启用视频尺寸变化监听
        this.videoElement.onresize = function() {
            window.appModules.resolution.updateVideoDimensions();
        };
        
        // 重新启用视频元数据加载完成事件监听
        this.videoElement.onloadedmetadata = function() {
            window.appModules.resolution.updateVideoDimensions();
        };
    },
    
    // 更新视频尺寸并发送给主进程
    updateVideoDimensions() {
        try {
            if (window.electronAPI && typeof window.electronAPI.updateWindowSize === 'function' && 
                this.videoElement && this.videoElement.videoWidth > 0 && this.videoElement.videoHeight > 0) {
                
                const videoWidth = this.videoElement.videoWidth;
                const videoHeight = this.videoElement.videoHeight;
                console.log('检测到摄像头实际像素尺寸:', videoWidth, 'x', videoHeight);
                
                // 在界面上显示检测到的分辨率
                if (this.resolutionDisplay) {
                    this.resolutionDisplay.textContent = `分辨率: ${videoWidth}×${videoHeight}`;
                    this.resolutionDisplay.classList.remove('hidden');
                }
                
                // 确保视频元素正确显示
                this.videoElement.style.display = 'block';
                this.videoElement.style.width = '100%';
                this.videoElement.style.height = '100%';
                
                // 直接发送原始摄像头尺寸，不做任何缩放或调整
                // 确保窗口严格按照摄像头输出的像素比例调整
                window.electronAPI.updateWindowSize({ width: videoWidth, height: videoHeight });
            } else if (this.videoElement) {
                console.warn('无法获取有效的视频尺寸，使用默认尺寸');
                // 确保视频元素至少可见
                this.videoElement.style.display = 'block';
                this.videoElement.style.width = '100%';
                this.videoElement.style.height = '100%';
            }
        } catch (error) {
            console.error('更新视频尺寸时发生错误:', error);
            // 确保视频元素至少可见
            if (this.videoElement) {
                this.videoElement.style.display = 'block';
                this.videoElement.style.width = '100%';
                this.videoElement.style.height = '100%';
            }
        }
    },
    
    // 应用自定义分辨率并调整窗口大小
    applyCustomResolution(width, height) {
        console.log('应用自定义分辨率:', width, 'x', height);
        
        // 确认window.electronAPI是否存在
        if (!window.electronAPI) {
            console.error('electronAPI对象不存在');
            return;
        }
        
        if (!window.electronAPI.updateWindowSize) {
            console.error('updateWindowSize方法不存在');
            return;
        }
        
        // 尝试修改视频元素的样式以匹配指定分辨率
        if (this.videoElement) {
            this.videoElement.style.objectFit = 'contain';
        }
        
        // 禁用视频尺寸变化的自动检测，防止窗口大小被重置
        this.videoElement.onresize = function() {
            // 在手动设置分辨率模式下不响应视频尺寸变化
        };
        
        // 使用setTimeout延迟调用，确保没有其他代码干扰
        setTimeout(() => {
            // 强制调整窗口大小到指定分辨率
            console.log('调整窗口尺寸:', width, 'x', height);
            window.electronAPI.updateWindowSize({ width: width, height: height });
            console.log('窗口尺寸更新请求已发送');
        }, 100);
        
        // 在分辨率显示区域显示当前使用的自定义分辨率
        if (this.resolutionDisplay) {
            this.resolutionDisplay.textContent = `自定义分辨率: ${width}×${height}`;
            this.resolutionDisplay.classList.remove('hidden');
        }
    },
    
    // 强制设置窗口尺寸（不依赖摄像头自动检测）
    forceWindowSize(width, height) {
        if (window.electronAPI && typeof window.electronAPI.updateWindowSize === 'function') {
            // 直接发送指定尺寸，与自动检测模式保持一致的窗口大小更新行为
            console.log('强制设置窗口尺寸:', width, 'x', height);
            window.electronAPI.updateWindowSize({ width: width, height: height });
        }
    }
};

// 导出模块
window.appModules = window.appModules || {};
window.appModules.resolution = ResolutionModule;