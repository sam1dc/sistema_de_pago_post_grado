console.log('Starting minimal Electron app...');
console.log('process.versions.electron:', process.versions.electron);

try {
  const electron = require('electron');
  console.log('Electron type:', typeof electron);
  console.log('Electron:', electron);
  
  if (typeof electron === 'object' && electron.app) {
    const { app, BrowserWindow } = electron;
    
    app.whenReady().then(() => {
      const win = new BrowserWindow({ width: 800, height: 600 });
      win.loadURL('data:text/html,<h1>Electron Works!</h1>');
      console.log('Window created successfully!');
    });
    
    app.on('window-all-closed', () => {
      app.quit();
    });
  } else {
    console.error('Electron module is not an object or app is undefined');
    console.error('This might be a module resolution issue');
  }
} catch (error) {
  console.error('Error requiring electron:', error);
}
