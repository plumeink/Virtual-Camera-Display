// 状态管理模块
const StatusModule = {
    statusElement: null,
    permissionHelpElement: null,
    retryBtn: null,
    closeHelpBtn: null,
    helpBtn: null,
    
    // 初始化状态模块
    init() {
        this.statusElement = document.getElementById('status');
        this.permissionHelpElement = document.getElementById('permissionHelp');
        this.retryBtn = document.getElementById('retryBtn');
        this.closeHelpBtn = document.getElementById('closeHelpBtn');
        this.helpBtn = document.getElementById('helpBtn');
        
        // 绑定事件
        this.retryBtn.addEventListener('click', () => window.appModules.camera.autoConnectCamera());
        this.closeHelpBtn.addEventListener('click', this.hidePermissionHelp.bind(this));
        this.helpBtn.addEventListener('click', this.showPermissionHelp.bind(this));
    },
    
    // 更新状态文本
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
    
    // 显示权限帮助弹窗
    showPermissionHelp() {
        if (this.permissionHelpElement) {
            this.permissionHelpElement.classList.remove('hidden');
        }
    },
    
    // 隐藏权限帮助弹窗
    hidePermissionHelp() {
        if (this.permissionHelpElement) {
            this.permissionHelpElement.classList.add('hidden');
        }
    }
};

// 导出模块
window.appModules = window.appModules || {};
window.appModules.status = StatusModule;