const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  searchStudent: (directory, cedula) => ipcRenderer.invoke('search-student', { directory, cedula }),
  searchByMaestria: (directory, maestria) => ipcRenderer.invoke('search-by-maestria', { directory, maestria }),
  getExcelFiles: (directory) => ipcRenderer.invoke('get-excel-files', directory),
  getSheetNames: (directory, fileName) => ipcRenderer.invoke('get-sheet-names', { directory, fileName }),
  addPayment: (directory, fileName, paymentData, sheetName) => ipcRenderer.invoke('add-payment', { directory, fileName, paymentData, sheetName }),
  createNewFile: (directory, fileName) => ipcRenderer.invoke('create-new-file', { directory, fileName }),
  getLastDebtInSheet: (directory, fileName, sheetName, cedula) => ipcRenderer.invoke('get-last-debt-in-sheet', { directory, fileName, sheetName, cedula }),
  getLastFileAndSheet: (directory, cedula) => ipcRenderer.invoke('get-last-file-and-sheet', { directory, cedula })
});
