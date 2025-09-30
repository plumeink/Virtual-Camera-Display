const { app, BrowserWindow, session, dialog, ipcMain, screen } = require('electron');
const path = require('path');
const { platform } = require('os');

// 添加命令行参数确保摄像头权限
app.commandLine.appendSwitch('enable-media-stream');
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('ignore-certificate-errors'); // 忽略证书错误
app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream'); // 自动允许媒体流权限

// 如果是Windows系统，添加特定权限参数
if (platform() === 'win32') {
  app.commandLine.appendSwitch('disable-features', 'MediaRouter');
  app.commandLine.appendSwitch('enable-features', 'WinRTMediaFoundation');
}

function createWindow() {
    // 检测系统语言以设置默认窗口标题
    const userLocale = app.getLocale();
    const isChinese = userLocale.startsWith('zh');
    
    // 从语言JSON文件中读取标题文本
    let defaultTitle = 'Virtual Camera Assistant'; // 默认英文标题
    try {
        const langFilePath = path.join(__dirname, 'lang', isChinese ? 'zh.json' : 'en.json');
        const langData = require(langFilePath);
        if (langData.appTitle) {
            defaultTitle = langData.appTitle;
        }
    } catch (error) {
        console.error('读取语言文件失败:', error);
    }
    
    // 创建无边框窗口
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        frame: false, // 无边框
        transparent: false, // 可根据需要设置为透明
        alwaysOnTop: false, // 可根据需要置顶
        resizable: true, // 允许程序调整窗口大小
        title: defaultTitle, // 设置默认窗口标题，从语言JSON文件读取
        icon: path.join(__dirname, 'icon.png'), // 可选：添加应用图标
        backgroundThrottling: false, // 禁用后台性能限制
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false, // 禁用web安全策略以便访问摄像头
            allowRunningInsecureContent: false,
            preload: path.join(__dirname, 'preload.js'),
            offscreen: false, // 保持正常的渲染模式
            backgroundThrottling: false // 禁用web安全策略以便访问摄像头
        }
    });

    // 加载包含摄像头显示的HTML
    mainWindow.loadFile('index.html');

    // 可选：打开开发者工具以便调试
    // mainWindow.webContents.openDevTools();

    // 处理窗口关闭
    mainWindow.on('closed', function () {
        app.quit();
    });

    // 监听来自渲染进程的视频尺寸信息
        ipcMain.on('update-window-size', (event, { width, height }) => {
                console.log('接收到视频尺寸信息:', width, 'x', height);
                
                // 确保窗口存在且未被销毁
                if (!mainWindow || mainWindow.isDestroyed()) {
                    console.error('主窗口不存在或已被销毁');
                    return;
                }
                
                // 确保最小窗口尺寸足够小，几乎不限制
                const minSize = 1;
                const targetWidth = Math.max(width, minSize);
                const targetHeight = Math.max(height, minSize);
                
                // 对于无边框窗口，使用setBounds方法可以更精确地控制窗口的位置和大小
                // 不做屏幕边界检查，直接设置为摄像头的实际分辨率，确保1:1显示
                console.log('严格按照摄像头像素调整窗口尺寸为:', targetWidth, 'x', targetHeight);
                
                // 尝试多次设置窗口大小，确保成功
                function trySetSize(attempts = 3) {
                    if (attempts <= 0) {
                        console.error('多次尝试设置窗口大小失败');
                        return;
                    }
                    
                    try {
                        // 使用setSize设置窗口大小
                        mainWindow.setSize(targetWidth, targetHeight);
                        console.log('窗口大小设置成功');
                        
                        // 确认窗口大小是否已更新
                        setTimeout(() => {
                            const currentSize = mainWindow.getSize();
                            console.log('当前窗口大小:', currentSize[0], 'x', currentSize[1]);
                            if (currentSize[0] !== targetWidth || currentSize[1] !== targetHeight) {
                                console.warn('窗口大小未按预期更新，尝试再次设置');
                                trySetSize(attempts - 1);
                            }
                        }, 100);
                    } catch (error) {
                        console.error('设置窗口大小时出错:', error);
                        trySetSize(attempts - 1);
                    }
                }
                
                // 立即尝试设置窗口大小
                trySetSize();
            });

        // 监听关闭窗口的请求
        ipcMain.on('close-window', () => {
            console.log('接收到关闭窗口请求，退出应用');
            app.quit();
        });
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
    // 请求摄像头权限
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['camera', 'microphone'];
        if (allowedPermissions.includes(permission)) {
            console.log('允许权限请求:', permission);
            callback(true); // 允许
        } else {
            console.log('拒绝权限请求:', permission);
            callback(false); // 拒绝
        }
    });

    // 处理权限检查
    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
        if (permission === 'camera' || permission === 'microphone') {
            console.log('权限检查通过:', permission);
            return true;
        }
        return false;
    });

    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// 在所有窗口关闭时退出应用 (macOS除外)
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// 安全设置：阻止新窗口创建
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
    });
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});