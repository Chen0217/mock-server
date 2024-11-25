// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const { fork } = require('child_process');
const { ipcMain } = require('electron');
const fs = require('fs')

// const nodePath = process.execPath;
const scriptPath = path.join(__dirname, 'server.js')

// userData path
const envProxyPath = path.join(app.getPath('userData'), 'env.proxy.ip');
const routerDelPath = path.join(app.getPath('userData'), 'router-delete.json');
const routerGetPath = path.join(app.getPath('userData'), 'router-get.json');
const routerPostPath = path.join(app.getPath('userData'), 'router-post.json');
const routerPutPath = path.join(app.getPath('userData'), 'router-put.json');
const singleProxyPath = path.join(app.getPath('userData'), 'single-proxy.json');
// 挂载环境变量
process.env.envProxyPath = envProxyPath
process.env.routerDelPath = routerDelPath
process.env.routerGetPath = routerGetPath
process.env.routerPostPath = routerPostPath
process.env.routerPutPath = routerPutPath
process.env.singleProxyPath = singleProxyPath
// 检查文件是否存在
if (!fs.existsSync(envProxyPath)) fs.writeFileSync(envProxyPath, 'http://guava.ob.shuyilink.com', 'utf8');
if (!fs.existsSync(routerDelPath)) fs.writeFileSync(routerDelPath, '{}', 'utf8');
if (!fs.existsSync(routerGetPath)) fs.writeFileSync(routerGetPath, '{}', 'utf8');
if (!fs.existsSync(routerPostPath)) fs.writeFileSync(routerPostPath, '{}', 'utf8');
if (!fs.existsSync(routerPutPath)) fs.writeFileSync(routerPutPath, '{}', 'utf8');
if (!fs.existsSync(singleProxyPath)) fs.writeFileSync(singleProxyPath, '{}', 'utf8');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) return app.quit()

let mainWindow
let currentProxyUrl
function createWindow () {

  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) return app.quit()
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

function forkChildProcess(scriptPath) {
  return new Promise((resolve, reject) => {
    try {
      nodeProcess = fork(scriptPath);
      // 其他处理逻辑
    } catch (err) {
      console.error('Error starting child process:', err);
    }
    nodeProcess.on('error', (err) => {
      reject(err);
    });
    nodeProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        reject(new Error(`Child process exited with code ${code} and signal ${signal}`));
      } else {
        resolve(nodeProcess);
      }
    });
    nodeProcess.on('message', (data) => {
      console.log(`🐛🐛🐛 Node.js Server Output: ${data}`);
      mainWindow && mainWindow.webContents?.send('message-to-renderer', data.toString());
    });
  
    nodeProcess.on('close', (code) => {
      console.log(`🐛🐛🐛 Node.js Server exited with code ${code}`);
    });
  });
}

const startNodeProcess = () => {
  forkChildProcess(scriptPath)
    .then(() => {
      // nodeProcess.on('message', (data) => {
      //   console.log(`🐛🐛🐛 Node.js Server Output: ${data}`);
      //   mainWindow && mainWindow.webContents?.send('message-to-renderer', data.toString());
      // });
      
      // nodeProcess.on('error', (err) => {
      //   console.log(`🐛🐛🐛 Node.js Server error with: ${err}`);
      // })
    
      // nodeProcess.on('close', (code) => {
      //   console.log(`🐛🐛🐛 Node.js Server exited with code ${code}`);
      // });
    })
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  // 当试图运行第二个实例时,我们应该focus到现有窗口
  if (mainWindow) {
    if (mainWindow.isMinimized?.()) mainWindow.restore?.();
    mainWindow.focus?.();
  }
});

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

app.on('will-quit', () => {
  // 终止子进程
  if (nodeProcess) {
    nodeProcess.kill('SIGINT'); // 终止现有子进程
  }
});

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
    console.log("🚀sy ~ ipcMain.on ~ message:", message)
    // fs.writeFileSync(`${__dirname}/public/env.proxy.ip`, message, 'utf8');
    fs.writeFileSync(envProxyPath, message, 'utf8');
    console.log("🚀sy ~ ipcMain.on ~ fs.readFileSync(envProxyPath, 'utf8');:", fs.readFileSync(envProxyPath, 'utf8'))
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
      fs.writeFileSync(routerPostPath, JSON.stringify(data, null, 2), 'utf8');
      fs.writeFileSync(routerGetPath, JSON.stringify({}, null, 2), 'utf8');
      fs.writeFileSync(routerPutPath, JSON.stringify({}, null, 2), 'utf8');
      fs.writeFileSync(routerDelPath, JSON.stringify({}, null, 2), 'utf8');
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
