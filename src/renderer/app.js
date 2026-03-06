import { searchStudent } from './modules/search.js';
import { addPayment, searchStudentForAdd, clearAddForm, calculateDebt } from './modules/addPayment.js';
import { loadExcelFiles, updateDirectoryDisplay } from './modules/utils.js';
import { initCurrencyConverter } from './modules/currencyConverter.js';
import { initPaymentOCR } from './modules/paymentOCR.js';

let selectedDirectory = null;

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
  const selectDirBtn = document.getElementById('selectDirBtn');
  if (selectDirBtn) {
    selectDirBtn.addEventListener('click', async () => {
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

  // Toggle crear nuevo archivo
  const createNewFile = document.getElementById('createNewFile');
  if (createNewFile) {
    createNewFile.addEventListener('change', (e) => {
      const newFileField = document.getElementById('newFileField');
      const fileSelect = document.getElementById('fileSelect');
      const sheetSelectField = document.getElementById('sheetSelectField');
      if (e.target.checked) {
        if (newFileField) newFileField.classList.remove('hidden');
        if (fileSelect) fileSelect.disabled = true;
        if (sheetSelectField) sheetSelectField.style.display = 'none';
      } else {
        if (newFileField) newFileField.classList.add('hidden');
        if (fileSelect) fileSelect.disabled = false;
      }
    });
  }

  // Cargar hojas cuando se selecciona un archivo
  const fileSelect = document.getElementById('fileSelect');
  if (fileSelect) {
    fileSelect.addEventListener('change', async (e) => {
      const fileName = e.target.value;
      const sheetSelectField = document.getElementById('sheetSelectField');
      const sheetSelect = document.getElementById('sheetSelect');
      
      if (fileName && selectedDirectory) {
        try {
          const sheets = await window.electronAPI.getSheetNames(selectedDirectory, fileName);
          if (sheetSelect) {
            sheetSelect.innerHTML = '<option value="">Seleccione una maestría</option>';
            sheets.forEach(sheet => {
              const option = document.createElement('option');
              option.value = sheet;
              option.textContent = sheet;
              sheetSelect.appendChild(option);
            });
          }
          if (sheetSelectField) sheetSelectField.style.display = 'block';
        } catch (error) {
          console.error('Error al cargar hojas:', error);
        }
      } else {
        if (sheetSelectField) sheetSelectField.style.display = 'none';
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
}

function loadSavedData() {
  const savedCost = localStorage.getItem('costoUC');
  const costoUCInput = document.getElementById('costoUC');
  if (savedCost && costoUCInput) {
    costoUCInput.value = savedCost;
  }
}

document.addEventListener('DOMContentLoaded', initApp);
