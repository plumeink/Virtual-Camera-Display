// 摄像头管理模块
const CameraModule = {
    videoElement: null,
    deviceSelector: null,
    refreshBtn: null,
    currentStream: null,
    isConnected: false,
    currentDeviceName: '',
    
    // 初始化摄像头模块
    init() {
        this.videoElement = document.getElementById('cameraPreview');
        this.deviceSelector = document.getElementById('deviceSelector');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        // 绑定事件
        this.refreshBtn.addEventListener('click', this.autoConnectCamera.bind(this));
        this.deviceSelector.addEventListener('change', async (event) => {
            if (event.target.value) {
                await this.startVideoStream(event.target.value);
            }
        });
        
        // 双击切换全屏
        this.videoElement.addEventListener('dblclick', () => {
            if (!document.fullscreenElement) {
                this.videoElement.requestFullscreen().catch(err => {
                    console.error('全屏请求失败:', err);
                });
            } else {
                document.exitFullscreen();
            }
        });
    },
    
    // 获取所有摄像头设备
    async getCameraDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error getting camera devices:', error);
            window.appModules.status.updateStatus(window.getTextSync('errorGetDevices'), true);
            return [];
        }
    },
    
    // 填充设备选择器
    populateDeviceSelector(cameras) {
        this.deviceSelector.innerHTML = '<option value="">Select camera...</option>';
        cameras.forEach(camera => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.textContent = camera.label || `Camera ${this.deviceSelector.options.length}`;
            this.deviceSelector.appendChild(option);
        });
        this.deviceSelector.style.display = 'block';
    },
    
    // 启动视频流
    async startVideoStream(deviceId) {
        try {
            // 先停止已有的流
            this.stopVideoStream();
            
            window.appModules.status.updateStatus(window.getTextSync('statusAccessing'));
            
            // 使用严格的约束条件尝试
            const constraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : true
            };
            
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('成功获取媒体流，轨道数量:', stream.getTracks().length);
            } catch (initialError) {
                console.error('首次尝试失败，使用更宽松的约束条件:', initialError);
                // 使用更宽松的约束条件重试
                const looseConstraints = {
                    video: deviceId ? { deviceId: { exact: deviceId } } : true
                };
                window.appModules.status.updateStatus(window.getTextSync('statusUsingAlternative'));
                stream = await navigator.mediaDevices.getUserMedia(looseConstraints);
                console.log('使用宽松约束条件成功获取媒体流');
            }
            
            this.videoElement.srcObject = stream;
            this.currentStream = stream;
            
            // 获取视频轨道信息
            const videoTrack = stream.getVideoTracks()[0];
            console.log('视频轨道信息:', videoTrack.label, '状态:', videoTrack.readyState);
            
            // 监听视频元数据加载完成事件，用于获取视频实际尺寸
            this.videoElement.onloadedmetadata = function() {
                window.appModules.resolution.updateVideoDimensions();
            };
            
            // 初始设置视频尺寸变化事件监听，仅在自动检测模式下响应
            this.videoElement.onresize = function() {
                const presetResolution = document.getElementById('presetResolution');
                if (presetResolution && presetResolution.value === 'auto') {
                    window.appModules.resolution.updateVideoDimensions();
                }
            };
            
            // 确保视频流稳定后再获取尺寸
            let streamStabilized = false;
            let stabilizationAttempts = 0;
            const maxStabilizationAttempts = 5;
            const stabilizationInterval = 500;
            
            // 视频流稳定性检查
            function checkStreamStability() {
                if (stabilizationAttempts >= maxStabilizationAttempts) {
                    streamStabilized = true;
                    console.log('视频流已稳定');
                    window.appModules.resolution.updateVideoDimensions(); // 最后再更新一次窗口尺寸
                    return;
                }
                
                if (this.videoElement.videoWidth > 0 && this.videoElement.videoHeight > 0) {
                    console.log(`稳定性检查 #${stabilizationAttempts + 1}: 检测到尺寸 ${this.videoElement.videoWidth}x${this.videoElement.videoHeight}`);
                    stabilizationAttempts++;
                    setTimeout(checkStreamStability.bind(this), stabilizationInterval);
                } else {
                    console.log('视频尺寸尚未可用，等待...');
                    setTimeout(checkStreamStability.bind(this), stabilizationInterval);
                }
            }
            
            // 启动稳定性检查
            setTimeout(checkStreamStability.bind(this), stabilizationInterval);
            
            // 更新连接状态和设备名称
            this.isConnected = true;
            this.currentDeviceName = videoTrack.label;
            
            window.appModules.status.updateStatus(window.getTextSync('statusConnected') + videoTrack.label);
            window.appModules.status.hidePermissionHelp();
            
            // 监听视频流事件
            videoTrack.onended = () => {
                console.log('视频轨道已结束');
                this.isConnected = false;
                this.currentDeviceName = '';
                window.appModules.status.updateStatus(window.getTextSync('statusDisconnected'), true);
            };
            
            videoTrack.onerror = (event) => {
                console.error('视频轨道错误:', event);
                this.isConnected = false;
                this.currentDeviceName = '';
                window.appModules.status.updateStatus(window.getTextSync('statusError'), true);
            };
            
            return true;
            
        } catch (error) {
            console.error('访问摄像头失败:', error);
            
            // 更详细的错误类型判断和处理
            let errorMessage = window.getTextSync('errorCannotAccess');
            if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
                errorMessage = window.getTextSync('errorNoDevice');
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = window.getTextSync('errorPermissionDenied');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = window.getTextSync('errorDeviceBusy');
            } else if (error.name === 'AbortError') {
                errorMessage = window.getTextSync('errorAborted');
            } else {
                errorMessage = window.getTextSync('errorDeviceList') + error.message;
            }
            
            window.appModules.status.updateStatus(errorMessage, true);
            
            // 显示更多帮助信息
            window.appModules.status.showPermissionHelp();
            
            return false;
        }
    },
    
    // 停止视频流
    stopVideoStream() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
            this.videoElement.srcObject = null;
        }
    },
    
    // 自动尝试连接摄像头
    async autoConnectCamera() {
        window.appModules.status.updateStatus(window.getTextSync('statusSearching'));
        window.appModules.status.hidePermissionHelp();
        
        // 清理设备选择器
        this.deviceSelector.innerHTML = '<option value="">Select camera...</option>';
        this.deviceSelector.style.display = 'none';
        
        try {
            // 先尝试获取所有摄像头
            const cameras = await this.getCameraDevices();
            console.log('找到的摄像头数量:', cameras.length);
            
            if (cameras.length === 0) {
                window.appModules.status.updateStatus(window.getTextSync('statusNoDevices'), true);
                window.appModules.status.showPermissionHelp();
                return;
            }
            
            // 填充设备选择器
            this.populateDeviceSelector(cameras);
            
            // 定义更多虚拟摄像头可能的标签关键词
            const virtualCameraKeywords = ['virtual', 'virtual camera'];
            
            // 尝试连接虚拟摄像头
            let virtualCamera = null;
            for (const camera of cameras) {
                if (camera.label) {
                    const lowerLabel = camera.label.toLowerCase();
                    if (virtualCameraKeywords.some(keyword => lowerLabel.includes(keyword))) {
                        virtualCamera = camera;
                        break;
                    }
                }
            }
            
            if (virtualCamera) {
                window.appModules.status.updateStatus(window.getTextSync('statusVirtualCameraFound') + virtualCamera.label);
                console.log('尝试连接虚拟摄像头:', virtualCamera.label);
                const success = await this.startVideoStream(virtualCamera.deviceId);
                if (!success) {
                    // 如果虚拟摄像头连接失败，尝试所有可用摄像头
                    window.appModules.status.updateStatus(window.getTextSync('statusVirtualCameraFailed'));
                    for (const camera of cameras) {
                        if (camera.deviceId !== virtualCamera.deviceId) {
                            console.log('尝试连接备用摄像头:', camera.label);
                            if (await this.startVideoStream(camera.deviceId)) {
                                return;
                            }
                        }
                    }
                    window.appModules.status.updateStatus(window.getTextSync('statusAllFailed'), true);
                }
            } else {
                // 如果没有找到虚拟摄像头，尝试所有摄像头
                window.appModules.status.updateStatus(window.getTextSync('statusUsingAlternative'));
                for (const camera of cameras) {
                    console.log('Attempting to connect to camera:', camera.label || 'Unknown camera');
                    if (await this.startVideoStream(camera.deviceId)) {
                        return;
                    }
                }
                window.appModules.status.updateStatus(window.getTextSync('statusAllFailed'), true);
            }
        } catch (error) {
            console.error('自动连接摄像头过程中发生错误:', error);
            window.appModules.status.updateStatus(window.getTextSync('statusAutoFailed') + error.message, true);
            window.appModules.status.showPermissionHelp();
        }
    }
};

// 导出模块
window.appModules = window.appModules || {};
window.appModules.camera = CameraModule;