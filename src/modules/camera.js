// 摄像头管理模块
const CameraModule = {
    videoElement: null,
    deviceSelector: null,
    refreshBtn: null,
    currentStream: null,
    
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
            console.error('获取摄像头设备失败:', error);
            window.appModules.status.updateStatus('获取摄像头设备失败', true);
            return [];
        }
    },
    
    // 填充设备选择器
    populateDeviceSelector(cameras) {
        this.deviceSelector.innerHTML = '<option value="">选择摄像头...</option>';
        cameras.forEach(camera => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.textContent = camera.label || `摄像头 ${this.deviceSelector.options.length}`;
            this.deviceSelector.appendChild(option);
        });
        this.deviceSelector.style.display = 'block';
    },
    
    // 启动视频流
    async startVideoStream(deviceId) {
        try {
            // 先停止已有的流
            this.stopVideoStream();
            
            window.appModules.status.updateStatus(`正在连接摄像头...`);
            
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
                window.appModules.status.updateStatus('使用备用设置尝试连接...');
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
            
            window.appModules.status.updateStatus('摄像头已连接: ' + videoTrack.label);
            window.appModules.status.hidePermissionHelp();
            
            // 监听视频流事件
            videoTrack.onended = () => {
                console.log('视频轨道已结束');
                window.appModules.status.updateStatus('摄像头连接已断开', true);
            };
            
            videoTrack.onerror = (event) => {
                console.error('视频轨道错误:', event);
                window.appModules.status.updateStatus('摄像头出现错误', true);
            };
            
            return true;
            
        } catch (error) {
            console.error('访问摄像头失败:', error);
            
            // 更详细的错误类型判断和处理
            let errorMessage = '无法访问摄像头';
            if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
                errorMessage = '未找到摄像头设备，请确保OBS虚拟摄像头已启动';
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = '摄像头访问被拒绝，请检查系统权限设置';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = '摄像头被其他应用占用，请关闭占用摄像头的程序';
            } else if (error.name === 'AbortError') {
                errorMessage = '摄像头访问被中止，请稍后重试';
            } else {
                errorMessage += ': ' + error.message;
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
        window.appModules.status.updateStatus('正在搜索摄像头...');
        window.appModules.status.hidePermissionHelp();
        
        // 清理设备选择器
        this.deviceSelector.innerHTML = '<option value="">选择摄像头...</option>';
        this.deviceSelector.style.display = 'none';
        
        try {
            // 先尝试获取所有摄像头
            const cameras = await this.getCameraDevices();
            console.log('找到的摄像头数量:', cameras.length);
            
            if (cameras.length === 0) {
                window.appModules.status.updateStatus('未找到任何摄像头设备', true);
                window.appModules.status.showPermissionHelp();
                return;
            }
            
            // 填充设备选择器
            this.populateDeviceSelector(cameras);
            
            // 定义更多OBS虚拟摄像头可能的标签关键词
            const obsKeywords = ['obs', 'virtual', '虚拟', 'virtual camera', '虚拟摄像头', 'obs-camera'];
            
            // 尝试连接虚拟摄像头 (OBS Virtual Camera)
            let obsCamera = null;
            for (const camera of cameras) {
                if (camera.label) {
                    const lowerLabel = camera.label.toLowerCase();
                    if (obsKeywords.some(keyword => lowerLabel.includes(keyword))) {
                        obsCamera = camera;
                        break;
                    }
                }
            }
            
            if (obsCamera) {
                window.appModules.status.updateStatus(`找到OBS虚拟摄像头: ${obsCamera.label}`);
                console.log('尝试连接OBS虚拟摄像头:', obsCamera.label);
                const success = await this.startVideoStream(obsCamera.deviceId);
                if (!success) {
                    // 如果OBS虚拟摄像头连接失败，尝试所有可用摄像头
                    window.appModules.status.updateStatus('OBS虚拟摄像头连接失败，尝试其他摄像头...');
                    for (const camera of cameras) {
                        if (camera.deviceId !== obsCamera.deviceId) {
                            console.log('尝试连接备用摄像头:', camera.label);
                            if (await this.startVideoStream(camera.deviceId)) {
                                return;
                            }
                        }
                    }
                    window.appModules.status.updateStatus('所有摄像头连接失败', true);
                }
            } else {
                // 如果没有找到OBS虚拟摄像头，尝试所有摄像头
                window.appModules.status.updateStatus('未找到OBS虚拟摄像头，尝试连接可用摄像头...');
                for (const camera of cameras) {
                    console.log('尝试连接摄像头:', camera.label || '未知摄像头');
                    if (await this.startVideoStream(camera.deviceId)) {
                        return;
                    }
                }
                window.appModules.status.updateStatus('所有摄像头连接失败', true);
            }
        } catch (error) {
            console.error('自动连接摄像头过程中发生错误:', error);
            window.appModules.status.updateStatus('自动连接失败: ' + error.message, true);
            window.appModules.status.showPermissionHelp();
        }
    }
};

// 导出模块
window.appModules = window.appModules || {};
window.appModules.camera = CameraModule;