import { searchStudent } from './modules/search.js';
import { addPayment, searchStudentForAdd, clearAddForm, calculateDebt } from './modules/addPayment.js';
import { loadExcelFiles, updateDirectoryDisplay } from './modules/utils.js';
import { initCurrencyConverter } from './modules/currencyConverter.js';
import { initPaymentOCR } from './modules/paymentOCR.js';

let selectedDirectory = null;

// Función global para recargar todos los selectores del sistema
window.reloadSystemData = async function() {
  const currentDirectory = selectedDirectory || localStorage.getItem('excelDirectory');
  if (!currentDirectory) {
    console.log('No hay directorio seleccionado');
    return;
  }
  
  console.log('Recargando sistema con directorio:', currentDirectory);
  
  try {
    // Recargar archivos Excel
    const files = await window.electronAPI.getExcelFiles(currentDirectory);
    console.log('Archivos encontrados:', files);
    
    // Actualizar selector en "Agregar Pago"
    const fileSelect = document.getElementById('fileSelect');
    if (fileSelect && files) {
      const currentValue = fileSelect.value;
      fileSelect.innerHTML = '<option value="">Seleccione un archivo</option>';
      files.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        fileSelect.appendChild(option);
      });
      if (currentValue) fileSelect.value = currentValue;
      console.log('Selector de archivos actualizado');
    }
    
    // Recargar filtros de "Consultar Pagos"
    await reloadSearchFilters(currentDirectory);
    
    console.log('Sistema actualizado correctamente');
  } catch (error) {
    console.error('Error al recargar datos del sistema:', error);
  }
};

// Función para recargar filtros de búsqueda
async function reloadSearchFilters(directory) {
  try {
    const maestriaFilter = document.getElementById('searchMaestriaFilter');
    const trimestreFilter = document.getElementById('searchTrimestreFilter');
    
    if (!maestriaFilter && !trimestreFilter) return;
    
    // Obtener todos los archivos y leer sus datos
    const files = await window.electronAPI.getExcelFiles(directory);
    const allMaestrias = new Set();
    const allTrimestres = new Set();
    
    for (const file of files) {
      // Extraer trimestre del nombre del archivo
      const trimestreMatch = file.match(/(\d{4}-\d+)/);
      if (trimestreMatch) {
        allTrimestres.add(trimestreMatch[1]);
      }
      
      // Obtener hojas (maestrías) del archivo
      try {
        const sheets = await window.electronAPI.getSheetNames(directory, file);
        sheets.forEach(sheet => allMaestrias.add(sheet));
      } catch (error) {
        console.error(`Error al leer hojas de ${file}:`, error);
      }
    }
    
    // Actualizar filtro de maestrías
    if (maestriaFilter && allMaestrias.size > 0) {
      const currentValue = maestriaFilter.value;
      maestriaFilter.innerHTML = '<option value="">Todas las maestrías</option>';
      [...allMaestrias].sort().forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = m.trim();
        maestriaFilter.appendChild(option);
      });
      if (currentValue) maestriaFilter.value = currentValue;
      console.log('Filtro de maestrías actualizado:', allMaestrias.size, 'maestrías');
    }
    
    // Actualizar filtro de trimestres
    if (trimestreFilter && allTrimestres.size > 0) {
      const currentValue = trimestreFilter.value;
      trimestreFilter.innerHTML = '<option value="">Todos los trimestres</option>';
      [...allTrimestres].sort().forEach(t => {
        const option = document.createElement('option');
        option.value = t;
        option.textContent = t;
        trimestreFilter.appendChild(option);
      });
      if (currentValue) trimestreFilter.value = currentValue;
      console.log('Filtro de trimestres actualizado:', allTrimestres.size, 'trimestres');
    }
  } catch (error) {
    console.error('Error al recargar filtros:', error);
  }
}

// Inicializar aplicación
async function initApp() {
  await window.loadAllComponents();
  
  // Esperar un momento para que los componentes se rendericen
  await new Promise(resolve => setTimeout(resolve, 100));
  
  setupEventListeners();
  loadSavedData();
}

function setupEventListeners() {
  const savedDir = localStorage.getItem('excelDirectory');
  if (savedDir) {
    selectedDirectory = savedDir;
    const initialModal = document.getElementById('initialModal');
    if (initialModal) initialModal.classList.remove('is-active');
    updateDirectoryDisplay(selectedDirectory);
    loadExcelFiles(selectedDirectory);
  }

  const savedCost = localStorage.getItem('costoUC');
  const costoUCInput = document.getElementById('costoUC');
  if (savedCost && costoUCInput) {
    costoUCInput.value = savedCost;
  }

  // Inicializar conversor de divisas
  initCurrencyConverter();

  // Inicializar OCR de pagos
  initPaymentOCR();

  // Toggle sidebar en móvil
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  
  if (hamburgerBtn && sidebar && overlay) {
    hamburgerBtn.addEventListener('click', () => {
      sidebar.classList.toggle('is-active');
      overlay.classList.toggle('is-active');
    });
    
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('is-active');
      overlay.classList.remove('is-active');
    });
  }

  // Navegación
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('is-active'));
      
      const targetTab = document.getElementById(target);
      if (targetTab) targetTab.classList.add('active');
      item.classList.add('is-active');
      
      // Mostrar botón OCR si el formulario de estudiante está visible en "Agregar Pago"
      if (target === 'add-tab') {
        const studentForm = document.getElementById('studentForm');
        const ocrButtonContainer = document.getElementById('ocrButtonContainer');
        if (studentForm && ocrButtonContainer && studentForm.style.display !== 'none') {
          ocrButtonContainer.style.display = 'block';
        }
      }
      
      if (window.innerWidth <= 768 && sidebar && overlay) {
        sidebar.classList.remove('is-active');
        overlay.classList.remove('is-active');
      }
    });
  });

  // Modal inicial
  const selectInitialDir = document.getElementById('selectInitialDir');
  if (selectInitialDir) {
    selectInitialDir.addEventListener('click', async () => {
      const directory = await window.electronAPI.selectDirectory();
      if (directory) {
        selectedDirectory = directory;
        localStorage.setItem('excelDirectory', directory);
        const initialModal = document.getElementById('initialModal');
        if (initialModal) initialModal.classList.remove('is-active');
        updateDirectoryDisplay(selectedDirectory);
        loadExcelFiles(selectedDirectory);
      }
    });
  }

  // Configuración
  const changeDirBtn = document.getElementById('changeDirBtn');
  if (changeDirBtn) {
    changeDirBtn.addEventListener('click', async () => {
      const directory = await window.electronAPI.selectDirectory();
      if (directory) {
        selectedDirectory = directory;
        localStorage.setItem('excelDirectory', directory);
        updateDirectoryDisplay(selectedDirectory);
        loadExcelFiles(selectedDirectory);
      }
    });
  }

  const saveCostBtn = document.getElementById('saveCostBtn');
  if (saveCostBtn) {
    saveCostBtn.addEventListener('click', () => {
      const cost = document.getElementById('costoUC').value;
      if (!cost || parseFloat(cost) <= 0) {
        document.getElementById('costResult').innerHTML = '<div class="notification is-danger"><button class="delete"></button>Ingresa un monto válido.</div>';
        return;
      }
      localStorage.setItem('costoUC', cost);
      document.getElementById('costResult').innerHTML = '<div class="notification is-success"><button class="delete"></button>Costo por U.C guardado: $' + parseFloat(cost).toFixed(2) + '</div>';
      setTimeout(() => {
        document.getElementById('costResult').innerHTML = '';
      }, 3000);
    });
  }

  // Toggle entre usar archivo existente o crear nuevo
  const useExistingFile = document.getElementById('useExistingFile');
  const createNewFile = document.getElementById('createNewFile');
  
  if (useExistingFile && createNewFile) {
    useExistingFile.addEventListener('change', () => {
      const existingFileFields = document.getElementById('existingFileFields');
      const newFileField = document.getElementById('newFileField');
      const fileSelect = document.getElementById('fileSelect');
      const sheetSelectField = document.getElementById('sheetSelectField');
      
      if (existingFileFields) existingFileFields.style.display = 'block';
      if (newFileField) newFileField.style.display = 'none';
      
      // Resetear selectores
      if (fileSelect) fileSelect.value = '';
      if (sheetSelectField) sheetSelectField.style.display = 'none';
    });
    
    createNewFile.addEventListener('change', () => {
      const existingFileFields = document.getElementById('existingFileFields');
      const newFileField = document.getElementById('newFileField');
      const sheetSelectField = document.getElementById('sheetSelectField');
      if (existingFileFields) existingFileFields.style.display = 'none';
      if (newFileField) newFileField.style.display = 'block';
      if (sheetSelectField) sheetSelectField.style.display = 'none';
    });
  }

  // Cargar hojas cuando se selecciona un archivo
  const fileSelect = document.getElementById('fileSelect');
  if (fileSelect) {
    fileSelect.addEventListener('change', async (e) => {
      const fileName = e.target.value;
      const sheetSelectField = document.getElementById('sheetSelectField');
      const sheetSelect = document.getElementById('sheetSelect');
      
      if (!fileName) {
        if (sheetSelectField) sheetSelectField.style.display = 'none';
        return;
      }
      
      if (!selectedDirectory) {
        console.error('No hay directorio seleccionado');
        alert('Por favor, seleccione un directorio primero en Configuración');
        return;
      }
      
      try {
        const sheets = await window.electronAPI.getSheetNames(selectedDirectory, fileName);
        if (sheetSelect) {
          sheetSelect.innerHTML = '<option value="">Seleccione una maestría</option>';
          sheets.forEach(sheet => {
            const option = document.createElement('option');
            option.value = sheet;
            option.textContent = sheet.trim(); // Mostrar sin espacios extras
            sheetSelect.appendChild(option);
          });
          sheetSelect.disabled = false;
        }
        if (sheetSelectField) sheetSelectField.style.display = 'block';
      } catch (error) {
        console.error('Error al cargar hojas:', error);
        alert('Error al cargar las maestrías del archivo');
      }
    });
  }

  // Actualizar Total a Pagar cuando se selecciona una maestría
  const sheetSelect = document.getElementById('sheetSelect');
  if (sheetSelect) {
    sheetSelect.addEventListener('change', async (e) => {
      const sheetName = e.target.value;
      const fileName = document.getElementById('fileSelect').value;
      const cedula = document.getElementById('addCedula').value.trim();
      
      if (sheetName && fileName && cedula && selectedDirectory) {
        calculateDebt(selectedDirectory);
      }
    });
  }

  // Calcular Total a Pagar automáticamente
  const addUC = document.getElementById('addUC');
  const addCostoUC = document.getElementById('addCostoUC');
  const addAbono = document.getElementById('addAbono');
  
  if (addUC) {
    addUC.addEventListener('input', () => {
      const uc = parseFloat(document.getElementById('addUC').value) || 0;
      const costoUC = parseFloat(document.getElementById('addCostoUC').value) || 0;
      const totalPagar = document.getElementById('addTotalPagar');
      if (totalPagar) totalPagar.value = (uc * costoUC).toFixed(2);
      calculateDebt(selectedDirectory);
    });
  }
  
  if (addCostoUC) {
    addCostoUC.addEventListener('input', () => {
      const uc = parseFloat(document.getElementById('addUC').value) || 0;
      const costoUC = parseFloat(document.getElementById('addCostoUC').value) || 0;
      const totalPagar = document.getElementById('addTotalPagar');
      if (totalPagar) totalPagar.value = (uc * costoUC).toFixed(2);
      calculateDebt(selectedDirectory);
    });
  }

  if (addAbono) {
    addAbono.addEventListener('input', () => calculateDebt(selectedDirectory));
  }

  // Buscar estudiante para autocompletar
  const searchStudentBtn = document.getElementById('searchStudentBtn');
  if (searchStudentBtn) {
    searchStudentBtn.addEventListener('click', () => searchStudentForAdd(selectedDirectory));
  }

  // Limpiar mensaje de deuda cuando se cambia la cédula
  const searchCedula = document.getElementById('searchCedula');
  if (searchCedula) {
    searchCedula.addEventListener('input', () => {
      const addResults = document.getElementById('addResults');
      if (addResults) addResults.innerHTML = '';
      const studentForm = document.getElementById('studentForm');
      if (studentForm) studentForm.style.display = 'none';
      const ocrButtonContainer = document.getElementById('ocrButtonContainer');
      if (ocrButtonContainer) ocrButtonContainer.style.display = 'none';
      
      // Limpiar campos del formulario
      const addCedula = document.getElementById('addCedula');
      if (addCedula) addCedula.value = '';
      const addNombreCompleto = document.getElementById('addNombreCompleto');
      if (addNombreCompleto) {
        addNombreCompleto.value = '';
        addNombreCompleto.readOnly = false;
      }
      
      // Limpiar campos de pago
      const addAsignatura = document.getElementById('addAsignatura');
      if (addAsignatura) addAsignatura.value = '';
      const addUC = document.getElementById('addUC');
      if (addUC) addUC.value = '';
      const addCostoUC = document.getElementById('addCostoUC');
      if (addCostoUC) addCostoUC.value = '';
      const addAbono = document.getElementById('addAbono');
      if (addAbono) addAbono.value = '';
      const addTotalPagar = document.getElementById('addTotalPagar');
      if (addTotalPagar) addTotalPagar.value = '';
      const addResta = document.getElementById('addResta');
      if (addResta) addResta.value = '';
      const addObservacion = document.getElementById('addObservacion');
      if (addObservacion) addObservacion.value = '';
      
      // Limpiar selectores de archivo
      const fileSelect = document.getElementById('fileSelect');
      if (fileSelect) fileSelect.value = '';
      const sheetSelect = document.getElementById('sheetSelect');
      if (sheetSelect) {
        sheetSelect.innerHTML = '<option value="">Seleccione primero un archivo</option>';
        sheetSelect.disabled = true;
      }
      
      // Ocultar deuda actual
      const deudaActualInfo = document.getElementById('deudaActualInfo');
      if (deudaActualInfo) deudaActualInfo.style.display = 'none';
    });
  }

  // Evento para botón agregar cédula
  document.body.addEventListener('click', (e) => {
    if (e.target.id === 'btnAgregarCedula') {
      const cedula = document.getElementById('searchCedula').value.trim();
      const studentForm = document.getElementById('studentForm');
      
      if (studentForm) studentForm.style.display = 'block';
      const addCedula = document.getElementById('addCedula');
      if (addCedula) addCedula.value = cedula;
      const addNombreCompleto = document.getElementById('addNombreCompleto');
      if (addNombreCompleto) {
        addNombreCompleto.value = '';
        addNombreCompleto.readOnly = false;
      }
      
      const costoUC = localStorage.getItem('costoUC');
      if (costoUC) {
        const addCostoUCInput = document.getElementById('addCostoUC');
        if (addCostoUCInput) addCostoUCInput.value = parseFloat(costoUC).toFixed(2);
      }
      
      const addResults = document.getElementById('addResults');
      if (addResults) addResults.innerHTML = '';
    }
    
    // Botón Pagar Deuda (desde búsqueda por cédula)
    if (e.target.closest('#btnPagarDeuda')) {
      const btn = e.target.closest('#btnPagarDeuda');
      const cedula = btn.dataset.cedula;
      const nombre = btn.dataset.nombre;
      const deuda = btn.dataset.deuda;
      
      // Cambiar a la vista de agregar pago
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('is-active'));
      
      const addTab = document.getElementById('add-tab');
      if (addTab) addTab.classList.add('active');
      const addMenuItem = document.querySelector('[data-target="add-tab"]');
      if (addMenuItem) addMenuItem.classList.add('is-active');
      
      // Precargar datos
      setTimeout(async () => {
        const studentForm = document.getElementById('studentForm');
        if (studentForm) studentForm.style.display = 'block';
        
        // Mostrar botón OCR
        const ocrButtonContainer = document.getElementById('ocrButtonContainer');
        if (ocrButtonContainer) ocrButtonContainer.style.display = 'block';
        
        const addCedula = document.getElementById('addCedula');
        if (addCedula) addCedula.value = cedula;
        
        const addNombreCompleto = document.getElementById('addNombreCompleto');
        if (addNombreCompleto) {
          addNombreCompleto.value = nombre;
          addNombreCompleto.readOnly = true;
        }
        
        // Mostrar deuda actual
        const deudaActualInfo = document.getElementById('deudaActualInfo');
        const deudaActualMonto = document.getElementById('deudaActualMonto');
        if (deudaActualInfo && deudaActualMonto) {
          deudaActualMonto.textContent = parseFloat(deuda).toFixed(2);
          deudaActualInfo.style.display = 'block';
        }
        
        // Mostrar deuda en Total a Pagar para referencia
        const addTotalPagar = document.getElementById('addTotalPagar');
        if (addTotalPagar) addTotalPagar.value = parseFloat(deuda).toFixed(2);
        
        const addResta = document.getElementById('addResta');
        if (addResta) addResta.value = parseFloat(deuda).toFixed(2);
        
        // Obtener último archivo y maestría del estudiante
        try {
          const lastInfo = await window.electronAPI.getLastFileAndSheet(selectedDirectory, cedula);
          if (lastInfo) {
            const fileSelect = document.getElementById('fileSelect');
            const createNewFile = document.getElementById('createNewFile');
            
            if (fileSelect && createNewFile) {
              createNewFile.checked = false;
              fileSelect.disabled = false;
              fileSelect.value = lastInfo.file;
              
              // Cargar hojas del archivo
              const sheets = await window.electronAPI.getSheetNames(selectedDirectory, lastInfo.file);
              const sheetSelect = document.getElementById('sheetSelect');
              const sheetSelectField = document.getElementById('sheetSelectField');
              
              if (sheetSelect) {
                sheetSelect.innerHTML = '<option value="">Seleccione una maestría</option>';
                sheets.forEach(sheet => {
                  const option = document.createElement('option');
                  option.value = sheet;
                  option.textContent = sheet;
                  sheetSelect.appendChild(option);
                });
                sheetSelect.value = lastInfo.sheet;
              }
              
              if (sheetSelectField) sheetSelectField.style.display = 'block';
            }
          }
        } catch (error) {
          console.error('Error al obtener último archivo:', error);
        }
        
        const addResults = document.getElementById('addResults');
        if (addResults) {
          addResults.innerHTML = '<div class="notification is-info"><button class="delete"></button>Complete los datos del pago. Puede agregar nuevos cargos (UC) o solo registrar un abono.</div>';
        }
      }, 100);
    }
    
    // Botón Ver Detalles (desde tabla de maestría)
    if (e.target.closest('.btnVerDetalles')) {
      const btn = e.target.closest('.btnVerDetalles');
      const cedula = btn.dataset.cedula;
      
      // Buscar el estudiante por cédula
      const cedulaInput = document.getElementById('cedula');
      if (cedulaInput) cedulaInput.value = cedula;
      
      // Limpiar filtro de maestría
      const maestriaFilter = document.getElementById('searchMaestriaFilter');
      if (maestriaFilter) maestriaFilter.value = '';
      
      // Ejecutar búsqueda
      searchStudent(selectedDirectory);
    }
    
    // Botón Pagar (desde tabla de maestría) - MANTENER POR COMPATIBILIDAD
    if (e.target.closest('.btnPagarFila')) {
      const btn = e.target.closest('.btnPagarFila');
      const cedula = btn.dataset.cedula;
      const nombre = btn.dataset.nombre;
      const deuda = btn.dataset.deuda;
      
      // Cambiar a la vista de agregar pago
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('is-active'));
      
      const addTab = document.getElementById('add-tab');
      if (addTab) addTab.classList.add('active');
      const addMenuItem = document.querySelector('[data-target="add-tab"]');
      if (addMenuItem) addMenuItem.classList.add('is-active');
      
      // Precargar datos
      setTimeout(() => {
        const studentForm = document.getElementById('studentForm');
        if (studentForm) studentForm.style.display = 'block';
        
        const addCedula = document.getElementById('addCedula');
        if (addCedula) addCedula.value = cedula;
        
        const addNombreCompleto = document.getElementById('addNombreCompleto');
        if (addNombreCompleto) {
          addNombreCompleto.value = nombre;
          addNombreCompleto.readOnly = true;
        }
        
        const addTotalPagar = document.getElementById('addTotalPagar');
        if (addTotalPagar) addTotalPagar.value = parseFloat(deuda).toFixed(2);
        
        const addResults = document.getElementById('addResults');
        if (addResults) {
          addResults.innerHTML = '<div class="notification is-info"><button class="delete"></button>Complete los datos del pago para saldar la deuda.</div>';
        }
      }, 100);
    }
  });

  // Cancelar agregar pago
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      const studentForm = document.getElementById('studentForm');
      if (studentForm) studentForm.style.display = 'none';
      const searchCedula = document.getElementById('searchCedula');
      if (searchCedula) searchCedula.value = '';
      const addResults = document.getElementById('addResults');
      if (addResults) addResults.innerHTML = '';
      clearAddForm();
    });
  }

  // Buscar alumno
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => searchStudent(selectedDirectory));
  }

  // Limpiar búsqueda
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      document.getElementById('cedula').value = '';
      document.getElementById('searchMaestriaFilter').value = '';
      document.getElementById('searchTrimestreFilter').value = '';
      document.getElementById('searchFechaDesde').value = '';
      document.getElementById('searchFechaHasta').value = '';
      document.getElementById('results').innerHTML = '';
    });
  }

  // Agregar pago
  const addPaymentBtn = document.getElementById('addPaymentBtn');
  if (addPaymentBtn) {
    addPaymentBtn.addEventListener('click', () => addPayment(selectedDirectory));
  }

  // Enter en búsqueda
  const cedula = document.getElementById('cedula');
  if (cedula) {
    cedula.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) searchBtn.click();
      }
    });
  }

  // Delegación de eventos para botones dinámicos (editar/eliminar)
  document.addEventListener('click', async (e) => {
    // Eliminar pago
    if (e.target.closest('.btnDeletePayment')) {
      const btn = e.target.closest('.btnDeletePayment');
      const file = btn.dataset.file;
      const sheet = btn.dataset.sheet;
      const row = parseInt(btn.dataset.row);
      const cedula = btn.dataset.cedula || '';
      const fecha = btn.dataset.fecha || '';
      
      if (confirm('¿Estás seguro de eliminar este pago?')) {
        // Deshabilitar todos los botones de eliminar mientras se procesa
        document.querySelectorAll('.btnDeletePayment').forEach(b => b.disabled = true);
        try {
          await window.electronAPI.deletePayment(selectedDirectory, file, sheet, row, cedula, fecha);
          showToast('Pago eliminado correctamente', 'is-success');
          
          // Esperar que el archivo se escriba en disco antes de recargar
          await new Promise(r => setTimeout(r, 800));
          if (window.reloadSystemData) await window.reloadSystemData();
          const searchBtn = document.getElementById('searchBtn');
          if (searchBtn) searchBtn.click();
        } catch (error) {
          console.error('DELETE ERROR:', error.message, { file, sheet, row, cedula, fecha });
          if (error.message.includes('EBUSY') || error.message.includes('locked')) {
            showToast('⚠️ El archivo Excel está abierto. Por favor, cierra Microsoft Excel e intenta de nuevo.', 'is-danger');
          } else if (error.message.includes('DATOS_INVALIDOS')) {
            const msg = error.message.replace('DATOS_INVALIDOS: ', '');
            showToast('⚠️ ' + msg, 'is-warning', 8000);
          } else {
            showToast('Error al eliminar pago: ' + error.message, 'is-danger');
          }
        }
      }
    }
  });
}

function showToast(message, type = 'is-info', duration = 3000) {
  if (window.bulmaToast) {
    window.bulmaToast.toast({
      message,
      type,
      dismissible: false,
      pauseOnHover: true,
      duration,
      position: 'top-center',
      closeOnClick: true,
      opacity: 1,
      single: false
    });
  }
}

function loadSavedData() {
  const savedCost = localStorage.getItem('costoUC');
  const costoUCInput = document.getElementById('costoUC');
  if (savedCost && costoUCInput) {
    costoUCInput.value = savedCost;
  }
}

document.addEventListener('DOMContentLoaded', initApp);
