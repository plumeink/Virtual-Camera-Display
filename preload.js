const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露有限的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 发送视频尺寸信息到主进程
  updateWindowSize: (dimensions) => {
    // 支持两种调用方式：1. 传入对象 {width, height} 2. 传入两个独立参数 width, height
    let width, height;
    if (typeof dimensions === 'object' && dimensions !== null) {
      // 第一种情况：传入了对象
      width = dimensions.width;
      height = dimensions.height;
    } else {
      // 第二种情况：传入了两个独立参数
      width = dimensions;
      height = arguments[1];
    }
    
    console.log('发送视频尺寸信息到主进程:', width, 'x', height);
    ipcRenderer.send('update-window-size', { width, height });
  },
  
  // 关闭窗口
  closeWindow: () => {
    ipcRenderer.send('close-window');
  }
});

// 监听主进程消息
ipcRenderer.on('message', (event, message) => {
  console.log('从主进程收到消息:', message);
});