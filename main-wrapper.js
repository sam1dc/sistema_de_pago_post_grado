// Wrapper para forzar la resolución correcta de Electron
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === 'electron' && process.versions.electron) {
    // Forzar la carga del módulo electron desde el proceso
    try {
      return process.electronBinding('electron');
    } catch (e) {
      // Si falla, intentar con el método original
      return originalRequire.apply(this, arguments);
    }
  }
  return originalRequire.apply(this, arguments);
};

// Ahora cargar el main.js original
require('./main.js');
