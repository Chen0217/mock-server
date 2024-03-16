// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const { spawn } = require('child_process');
const { ipcMain } = require('electron');
const fs = require('fs')

let mainWindow
let currentProxyUrl
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 650,
    webPreferences: {
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('dist/index.html')
  // mainWindow.webContents.openDevTools()

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let nodeProcess

const startNodeProcess = () => {
  nodeProcess = spawn('node', ['server.js']);

  nodeProcess.stdout.on('data', (data) => {
    console.log(`🐛🐛🐛 Node.js Server Output: ${data}`);
    mainWindow && mainWindow.webContents?.send('message-to-renderer', data.toString());
  });

  nodeProcess.on('close', (code) => {
    console.log(`🐛🐛🐛 Node.js Server exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  createWindow()

  startNodeProcess()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
// 关闭子进程  nodeProcess.kill('SIGTERM'); // 或者使用 'SIGINT' 信号
// 根据 nodeProcess.exitCode === null 判断进程是否活跃
const restartNodeProcess = () => {
  if (nodeProcess) {
    nodeProcess.kill('SIGINT'); // 终止现有子进程
  }
  // 启动新的子进程
  startNodeProcess();
}

ipcMain.on('change-proxy-ip', (event, message) => {
  // if (nodeProcess.exitCode === null) {
  //   console.log(`🚀 nodeProcess is active!`)
  // }
  // 重复操作
  if (currentProxyUrl == message) return
  currentProxyUrl = message
  // 替换proxyUrl
  try {
    fs.writeFileSync(`${__dirname}/public/env.proxy.ip`, message, 'utf8');
  } catch (err) {
    console.error('写文件时出错:', err);
  }
  restartNodeProcess()
});

ipcMain.on('api-mock-reset', (event, message) => {
  if (message) {
    try {
      const data = {
        "/mes-mock-server/example": {
            "status": true,
            "code": "200",
            "message": "success",
            "data": "ok"
        }
      }
      fs.writeFileSync(`${__dirname}/public/router-post.json`, JSON.stringify(data, null, 2), 'utf8');
      fs.writeFileSync(`${__dirname}/public/router-get.json`, JSON.stringify({}, null, 2), 'utf8');
      fs.writeFileSync(`${__dirname}/public/router-put.json`, JSON.stringify({}, null, 2), 'utf8');
      fs.writeFileSync(`${__dirname}/public/router-delete.json`, JSON.stringify({}, null, 2), 'utf8');
      restartNodeProcess()
    }  catch (err) {
      console.error('写文件时出错:', err);
    }
  }
})

ipcMain.on('api-mock-restart', (event, message) => {
  if (message) restartNodeProcess()
})

// 修改接口消息 get post
// 重置
// 关于接口校验

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
