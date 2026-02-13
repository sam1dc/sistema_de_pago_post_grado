const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const excelReader = require('./modules/excelReader');
const excelWriter = require('./modules/excelWriter');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('search-student', async (event, { directory, cedula }) => {
  try {
    return excelReader.searchStudent(directory, cedula);
  } catch (error) {
    throw new Error(`Error al procesar archivos: ${error.message}`);
  }
});

ipcMain.handle('get-excel-files', async (event, directory) => {
  try {
    return excelReader.getExcelFiles(directory);
  } catch (error) {
    throw new Error(`Error al listar archivos: ${error.message}`);
  }
});

ipcMain.handle('add-payment', async (event, { directory, fileName, paymentData }) => {
  try {
    return excelWriter.addPayment(directory, fileName, paymentData);
  } catch (error) {
    throw new Error(`Error al agregar pago: ${error.message}`);
  }
});

ipcMain.handle('create-new-file', async (event, { directory, fileName }) => {
  try {
    return excelWriter.createNewExcelFile(directory, fileName);
  } catch (error) {
    throw new Error(`Error al crear archivo: ${error.message}`);
  }
});
