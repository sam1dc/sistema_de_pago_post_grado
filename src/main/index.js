const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const excelReader = require('./modules/excelReader');
const excelWriter = require('./modules/excelWriter');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../renderer/assets/logo.ico'),
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

ipcMain.handle('search-by-maestria', async (event, { directory, maestria }) => {
  try {
    return excelReader.searchByMaestria(directory, maestria);
  } catch (error) {
    throw new Error(`Error al buscar por maestría: ${error.message}`);
  }
});

ipcMain.handle('get-excel-files', async (event, directory) => {
  try {
    return excelReader.getExcelFiles(directory);
  } catch (error) {
    throw new Error(`Error al listar archivos: ${error.message}`);
  }
});

ipcMain.handle('get-sheet-names', async (event, { directory, fileName }) => {
  try {
    return excelReader.getSheetNames(directory, fileName);
  } catch (error) {
    throw new Error(`Error al obtener hojas: ${error.message}`);
  }
});

ipcMain.handle('add-payment', async (event, { directory, fileName, paymentData, sheetName }) => {
  try {
    const result = excelWriter.addPayment(directory, fileName, paymentData, sheetName);
    excelReader.invalidateCache();
    return result;
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

ipcMain.handle('get-last-debt-in-sheet', async (event, { directory, fileName, sheetName, cedula }) => {
  try {
    return excelReader.getLastDebtInSheet(directory, fileName, sheetName, cedula);
  } catch (error) {
    throw new Error(`Error al obtener deuda: ${error.message}`);
  }
});

ipcMain.handle('get-last-file-and-sheet', async (event, { directory, cedula }) => {
  try {
    return excelReader.getLastFileAndSheet(directory, cedula);
  } catch (error) {
    throw new Error(`Error al obtener último archivo: ${error.message}`);
  }
});

ipcMain.handle('delete-payment', async (event, { directory, fileName, sheetName, rowIndex }) => {
  try {
    const result = excelWriter.deletePayment(directory, fileName, sheetName, rowIndex);
    excelReader.invalidateCache();
    return result;
  } catch (error) {
    throw new Error(`Error al eliminar pago: ${error.message}`);
  }
});

ipcMain.handle('update-payment', async (event, { directory, fileName, sheetName, rowIndex, paymentData }) => {
  try {
    const result = excelWriter.updatePayment(directory, fileName, sheetName, rowIndex, paymentData);
    excelReader.invalidateCache();
    return result;
  } catch (error) {
    throw new Error(`Error al actualizar pago: ${error.message}`);
  }
});
