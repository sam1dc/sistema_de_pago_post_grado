const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  searchStudent: (directory, cedula) => ipcRenderer.invoke('search-student', { directory, cedula }),
  getExcelFiles: (directory) => ipcRenderer.invoke('get-excel-files', directory),
  addPayment: (directory, fileName, paymentData) => ipcRenderer.invoke('add-payment', { directory, fileName, paymentData }),
  createNewFile: (directory, fileName) => ipcRenderer.invoke('create-new-file', { directory, fileName })
});
