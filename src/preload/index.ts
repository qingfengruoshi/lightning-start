import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
    // 调用主进程方法
    invoke: (channel: string, ...args: any[]) => {
        return ipcRenderer.invoke(channel, ...args);
    },

    // 发送消息到主进程
    send: (channel: string, ...args: any[]) => {
        ipcRenderer.send(channel, ...args);
    },

    // 监听主进程消息
    on: (channel: string, callback: (...args: any[]) => void) => {
        const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) =>
            callback(...args);
        ipcRenderer.on(channel, subscription);

        return () => {
            ipcRenderer.removeListener(channel, subscription);
        };
    },

    // 移除监听器
    removeListener: (channel: string, callback: (...args: any[]) => void) => {
        ipcRenderer.removeListener(channel, callback);
    },
});

// 类型声明
declare global {
    interface Window {
        electron: {
            invoke: (channel: string, ...args: any[]) => Promise<any>;
            send: (channel: string, ...args: any[]) => void;
            on: (channel: string, callback: (...args: any[]) => void) => () => void;
            removeListener: (channel: string, callback: (...args: any[]) => void) => void;
        };
    }
}
