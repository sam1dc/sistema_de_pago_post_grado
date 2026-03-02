let selectedDirectory = null;

// Inicializar aplicación
async function initApp() {
  // Cargar componentes HTML
  await window.loadAllComponents();
  
  // Inicializar eventos y lógica
  setupEventListeners();
  loadSavedData();
}

function setupEventListeners() {
  // Verificar si hay directorio guardado
  const savedDir = localStorage.getItem('excelDirectory');
  if (savedDir) {
    selectedDirectory = savedDir;
    const initialModal = document.getElementById('initialModal');
    if (initialModal) initialModal.classList.remove('is-active');
    updateDirectoryDisplay();
    loadExcelFiles();
  }

  // Cargar costo guardado
  const savedCost = localStorage.getItem('costoUC');
  const costoUCInput = document.getElementById('costoUC');
  if (savedCost && costoUCInput) {
    costoUCInput.value = savedCost;
  }

  // Toggle sidebar en móvil
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
  });

  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
  });

  // Sidebar Navigation
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const tabName = item.dataset.tab;
      
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('is-active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      item.classList.add('is-active');
      
      const tabElement = document.getElementById(tabName + '-tab');
      if (tabElement) {
        tabElement.classList.add('active');
      }

      // Cerrar sidebar en móvil
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  });

  // Seleccionar directorio inicial
  document.getElementById('selectInitialDir').addEventListener('click', async () => {
    const dir = await window.electronAPI.selectDirectory();
    if (dir) {
      selectedDirectory = dir;
      localStorage.setItem('excelDirectory', dir);
      document.getElementById('initialModal').classList.remove('is-active');
      updateDirectoryDisplay();
      await loadExcelFiles();
    }
  });

  // Cambiar directorio desde configuración
  document.getElementById('changeDirBtn').addEventListener('click', async () => {
    const dir = await window.electronAPI.selectDirectory();
    if (dir) {
      selectedDirectory = dir;
      localStorage.setItem('excelDirectory', dir);
      updateDirectoryDisplay();
      await loadExcelFiles();
    }
  });

  // Guardar costo por UC
  document.getElementById('saveCostBtn').addEventListener('click', () => {
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

  // Toggle crear nuevo archivo
  document.getElementById('createNewFile').addEventListener('change', (e) => {
    const newFileField = document.getElementById('newFileField');
    const fileSelect = document.getElementById('fileSelect');
    const sheetSelectField = document.getElementById('sheetSelectField');
    if (e.target.checked) {
      newFileField.classList.remove('hidden');
      fileSelect.disabled = true;
      sheetSelectField.style.display = 'none';
    } else {
      newFileField.classList.add('hidden');
      fileSelect.disabled = false;
    }
  });

  // Cargar hojas cuando se selecciona un archivo
  document.getElementById('fileSelect').addEventListener('change', async (e) => {
    const fileName = e.target.value;
    const sheetSelectField = document.getElementById('sheetSelectField');
    const sheetSelect = document.getElementById('sheetSelect');
    
    if (fileName && selectedDirectory) {
      try {
        const sheets = await window.electronAPI.getSheetNames(selectedDirectory, fileName);
        sheetSelect.innerHTML = '<option value="">Seleccione una maestría</option>';
        sheets.forEach(sheet => {
          const option = document.createElement('option');
          option.value = sheet;
          option.textContent = sheet;
          sheetSelect.appendChild(option);
        });
        sheetSelectField.style.display = 'block';
      } catch (error) {
        console.error('Error al cargar hojas:', error);
      }
    } else {
      sheetSelectField.style.display = 'none';
    }
  });

  // Calcular Total a Pagar automáticamente (UC * Costo UC)
  document.getElementById('addUC').addEventListener('input', () => {
    const uc = parseFloat(document.getElementById('addUC').value) || 0;
    const costoUC = parseFloat(document.getElementById('addCostoUC').value) || 0;
    document.getElementById('addTotalPagar').value = (uc * costoUC).toFixed(2);
    calculateDebt();
  });
  
  document.getElementById('addCostoUC').addEventListener('input', () => {
    const uc = parseFloat(document.getElementById('addUC').value) || 0;
    const costoUC = parseFloat(document.getElementById('addCostoUC').value) || 0;
    document.getElementById('addTotalPagar').value = (uc * costoUC).toFixed(2);
    calculateDebt();
  });

  // Calcular resta automáticamente
  document.getElementById('addAbono').addEventListener('input', calculateDebt);

  // Buscar estudiante para autocompletar
  document.getElementById('searchStudentBtn').addEventListener('click', searchStudentForAdd);

  // Evento para botón agregar cédula (delegación)
  document.body.addEventListener('click', (e) => {
    if (e.target.id === 'btnAgregarCedula') {
      const cedula = document.getElementById('searchCedula').value.trim();
      const studentForm = document.getElementById('studentForm');
      
      // Mostrar formulario
      studentForm.style.display = 'block';
      document.getElementById('addCedula').value = cedula;
      document.getElementById('addNombreCompleto').value = '';
      
      document.getElementById('addNombreCompleto').readOnly = false;
      
      // Autocompletar con costo por UC
      const costoUC = localStorage.getItem('costoUC');
      if (costoUC) {
        document.getElementById('addCostoUC').value = parseFloat(costoUC).toFixed(2);
      }
      
      // Limpiar mensaje de advertencia
      document.getElementById('addResults').innerHTML = '<div class="notification is-info"><button class="delete"></button>Complete los datos del nuevo alumno.</div>';
    }
    
    // Cerrar notificaciones
    if (e.target.classList.contains('delete')) {
      e.target.parentElement.remove();
    }
  });

  // Cancelar y limpiar formulario
  document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('studentForm').style.display = 'none';
    document.getElementById('searchCedula').value = '';
    document.getElementById('addResults').innerHTML = '';
    clearAddForm();
  });

  // Buscar alumno
  document.getElementById('searchBtn').addEventListener('click', searchStudent);

  // Agregar pago
  document.getElementById('addPaymentBtn').addEventListener('click', addPayment);

  // Enter en búsqueda
  document.getElementById('cedula').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('searchBtn').click();
  });
}

function loadSavedData() {
  // Cargar costo guardado
  const savedCost = localStorage.getItem('costoUC');
  const costoUCInput = document.getElementById('costoUC');
  if (savedCost && costoUCInput) {
    costoUCInput.value = savedCost;
  }
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

// Funciones auxiliares
function updateDirectoryDisplay() {
  const currentDirPath = document.getElementById('currentDirPath');
  if (currentDirPath) {
    currentDirPath.textContent = selectedDirectory || 'No seleccionado';
  }
}

async function loadExcelFiles() {
  if (!selectedDirectory) return;
  try {
    const files = await window.electronAPI.getExcelFiles(selectedDirectory);
    const select = document.getElementById('fileSelect');
    if (select) {
      select.innerHTML = '<option value="">Seleccione un archivo</option>';
      files.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        select.appendChild(option);
      });
    }
    updateFilesList(files);
    
    // Cargar maestrías disponibles para el filtro de búsqueda
    await loadMaestrias();
  } catch (error) {
    console.error('Error al cargar archivos:', error);
  }
}

async function loadMaestrias() {
  if (!selectedDirectory) return;
  try {
    const files = await window.electronAPI.getExcelFiles(selectedDirectory);
    const maestriasSet = new Set();
    
    // Obtener todas las hojas de todos los archivos
    for (const file of files) {
      const sheets = await window.electronAPI.getSheetNames(selectedDirectory, file);
      sheets.forEach(sheet => maestriasSet.add(sheet));
    }
    
    // Actualizar selector de maestrías en búsqueda
    const searchFilter = document.getElementById('searchMaestriaFilter');
    if (searchFilter) {
      searchFilter.innerHTML = '<option value="">Seleccione una maestría</option>';
      Array.from(maestriasSet).sort().forEach(maestria => {
        const option = document.createElement('option');
        option.value = maestria;
        option.textContent = maestria;
        searchFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al cargar maestrías:', error);
  }
}

function updateFilesList(files) {
  const filesList = document.getElementById('filesList');
  if (filesList && files) {
    if (files.length === 0) {
      filesList.innerHTML = '<p class="has-text-grey">No se encontraron archivos Excel en este directorio.</p>';
    } else {
      filesList.innerHTML = '<ul>' + files.map(f => `<li><span class="icon-text"><span class="icon has-text-info"><i class="mdi mdi-file-excel"></i></span><span>${f}</span></span></li>`).join('') + '</ul>';
    }
  }
}

function calculateDebt() {
  const totalPagar = parseFloat(document.getElementById('addTotalPagar').value) || 0;
  const abono = parseFloat(document.getElementById('addAbono').value) || 0;
  const resta = totalPagar - abono;
  document.getElementById('addResta').value = resta >= 0 ? resta.toFixed(2) : 0;
}

async function searchStudentForAdd() {
  const cedula = document.getElementById('searchCedula').value.trim();
  const addResults = document.getElementById('addResults');
  const studentForm = document.getElementById('studentForm');

  // Ocultar formulario al buscar
  studentForm.style.display = 'none';

  if (!selectedDirectory) {
    addResults.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, seleccione un directorio primero.</div>';
    return;
  }

  if (!cedula) {
    addResults.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, ingrese una cédula.</div>';
    return;
  }

  try {
    const data = await window.electronAPI.searchStudent(selectedDirectory, cedula);
    
    if (data) {
      // Estudiante encontrado - mostrar formulario con datos
      studentForm.style.display = 'block';
      document.getElementById('addCedula').value = cedula;
      document.getElementById('addNombreCompleto').value = data.student.nombre_completo;
      
      // Autocompletar Total a Pagar con deuda pendiente o costo por UC
      const costoUC = localStorage.getItem('costoUC');
      if (data.totalDebt > 0) {
        document.getElementById('addTotalPagar').value = data.totalDebt.toFixed(2);
      } else if (costoUC) {
        document.getElementById('addCostoUC').value = parseFloat(costoUC).toFixed(2);
      }
      
      document.getElementById('addNombreCompleto').readOnly = true;
      
      addResults.innerHTML = '<div class="notification is-success"><button class="delete"></button>Estudiante encontrado. Datos autocompletados.</div>';
    } else {
      // Estudiante no encontrado - NO mostrar formulario, solo pregunta
      addResults.innerHTML = `
        <div class="notification is-warning">
          <button class="delete"></button>
          No se encontró la cédula en el sistema. ¿Desea agregar esta cédula al sistema? 
          <button class="button is-small is-warning mt-2" id="btnAgregarCedula">Agregar Cédula</button>
        </div>
      `;
    }
  } catch (error) {
    addResults.innerHTML = `<div class="notification is-danger"><button class="delete"></button>${error.message}</div>`;
  }
}

function clearAddForm() {
  document.getElementById('addCedula').value = '';
  document.getElementById('addNombreCompleto').value = '';
  document.getElementById('addAsignatura').value = '';
  document.getElementById('addFecha').value = '';
  document.getElementById('addUC').value = '';
  document.getElementById('addCostoUC').value = '';
  document.getElementById('addAbono').value = '';
  document.getElementById('addTotalPagar').value = '';
  document.getElementById('addResta').value = '';
  document.getElementById('addObservacion').value = '';
  
  document.getElementById('addNombreCompleto').readOnly = false;
}

async function searchStudent() {
  const cedula = document.getElementById('cedula').value.trim();
  const maestriaFilter = document.getElementById('searchMaestriaFilter').value;
  const resultsDiv = document.getElementById('results');

  if (!selectedDirectory) {
    resultsDiv.innerHTML = '<div class="notification is-danger mt-4"><button class="delete"></button>Por favor, seleccione un directorio primero.</div>';
    return;
  }

  if (!cedula && !maestriaFilter) {
    resultsDiv.innerHTML = '<div class="notification is-danger mt-4"><button class="delete"></button>Por favor, ingrese una cédula o seleccione una maestría.</div>';
    return;
  }

  try {
    // Búsqueda solo por maestría
    if (!cedula && maestriaFilter) {
      const students = await window.electronAPI.searchByMaestria(selectedDirectory, maestriaFilter);
      
      if (!students || students.length === 0) {
        resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros en esta maestría.</div>';
        return;
      }
      
      // Obtener todos los pagos
      const allPayments = students.flatMap(s => s.payments);
      const totalDeuda = students.reduce((sum, s) => sum + s.totalDebt, 0);
      
      // Mostrar tabla de pagos
      let html = `
        <div class="box mt-5">
          <h2 class="title is-5 mb-4">Pagos en ${maestriaFilter}</h2>
          <div class="columns">
            <div class="column">
              <p><strong>Total de estudiantes:</strong> ${students.length}</p>
            </div>
            <div class="column">
              <p><strong>Total de pagos:</strong> ${allPayments.length}</p>
            </div>
            <div class="column">
              <p><strong>Deuda total:</strong> <span class="tag ${totalDeuda > 0 ? 'is-warning' : 'is-success'} is-large">$${totalDeuda.toFixed(2)}</span></p>
            </div>
          </div>
        </div>
        
        <div class="table-container">
          <table class="table is-fullwidth is-hoverable is-striped">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Fecha</th>
                <th>Trimestre</th>
                <th>Asignatura</th>
                <th>U.C</th>
                <th>Costo U.C</th>
                <th>Total a Pagar</th>
                <th>Abono</th>
                <th>Resta</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              ${allPayments.map(p => `
                <tr>
                  <td>${p.nombre_completo}</td>
                  <td>${p.cedula}</td>
                  <td>${p.fecha || 'N/A'}</td>
                  <td><span class="tag is-info is-light">${p.trimestre}</span></td>
                  <td>${p.asignatura || 'N/A'}</td>
                  <td>${p.uc || ''}</td>
                  <td>$${(p.costo_uc || 0).toFixed(2)}</td>
                  <td><strong>$${(p.total_a_pagar || 0).toFixed(2)}</strong></td>
                  <td><span class="tag is-success">$${(p.abono || 0).toFixed(2)}</span></td>
                  <td><span class="tag ${p.resta > 0 ? 'is-warning' : 'is-success'}">$${(p.resta || 0).toFixed(2)}</span></td>
                  <td>${p.observacion || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      
      resultsDiv.innerHTML = html;
      return;
    }
    
    // Búsqueda por cédula (con o sin filtro de maestría)
    const data = await window.electronAPI.searchStudent(selectedDirectory, cedula);

    if (!data) {
      resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros para esta cédula.</div>';
      return;
    }

    let { student, payments, totalDebt, trimestres } = data;
    
    // Aplicar filtro de maestría si está seleccionado
    if (maestriaFilter) {
      payments = payments.filter(p => p._sheet === maestriaFilter);
      if (payments.length === 0) {
        resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros para esta cédula en la maestría seleccionada.</div>';
        return;
      }
      // Recalcular deuda total con pagos filtrados
      totalDebt = payments.reduce((sum, p) => sum + (Number(p.resta) || 0), 0);
      // Recalcular trimestres únicos
      const trimestresSet = new Set(payments.map(p => p.trimestre));
      trimestres = trimestresSet.size;
    }

    let html = `
      <div class="box summary-box mt-5">
        <h2 class="title is-5 has-text-white mb-4">Información del Alumno</h2>
        <div class="columns is-multiline">
          <div class="column is-6">
            <p class="has-text-white-ter mb-2"><strong class="has-text-white">Nombre:</strong> ${student.nombre_completo}</p>
            <p class="has-text-white-ter mb-2"><strong class="has-text-white">Cédula:</strong> ${student.cedula}</p>
          </div>
          <div class="column is-6">
            <p class="has-text-white-ter mb-2"><strong class="has-text-white">Trimestres:</strong> ${trimestres}</p>
            ${maestriaFilter ? `<p class="has-text-white-ter mb-2"><strong class="has-text-white">Maestría:</strong> ${maestriaFilter}</p>` : ''}
          </div>
          <div class="column is-12">
            <p class="title is-3 has-text-white mt-2">Deuda Total: $${totalDebt.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <h3 class="title is-5 mt-5 mb-3">
        <span class="icon-text">
          <span class="icon has-text-primary">
            <i class="mdi mdi-history"></i>
          </span>
          <span>Historial de Pagos</span>
        </span>
      </h3>
      <div class="table-container">
        <table class="table is-fullwidth is-hoverable">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Trimestre</th>
              <th>Maestría</th>
              <th>Asignatura</th>
              <th>U.C</th>
              <th>Costo U.C</th>
              <th>Total a Pagar</th>
              <th>Abono</th>
              <th>Resta</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td>${p.fecha || 'N/A'}</td>
                <td><span class="tag is-info is-light">${p.trimestre}</span></td>
                <td><span class="tag is-link is-light">${p._sheet || 'N/A'}</span></td>
                <td>${p.asignatura || 'N/A'}</td>
                <td>${p.uc || ''}</td>
                <td>$${(p.costo_uc || 0).toFixed(2)}</td>
                <td><strong>$${(p.total_a_pagar || 0).toFixed(2)}</strong></td>
                <td><span class="tag is-success">$${(p.abono || 0).toFixed(2)}</span></td>
                <td><span class="tag ${p.resta > 0 ? 'is-warning' : 'is-success'}">$${(p.resta || 0).toFixed(2)}</span></td>
                <td>${p.observacion || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    resultsDiv.innerHTML = html;
  } catch (error) {
    resultsDiv.innerHTML = `<div class="notification is-danger mt-4"><button class="delete"></button>${error.message}</div>`;
  }
}

async function addPayment() {
  const resultsDiv = document.getElementById('addResults');

  if (!selectedDirectory) {
    resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, seleccione un directorio primero.</div>';
    return;
  }

  const createNew = document.getElementById('createNewFile').checked;
  let fileName, sheetName;

  if (createNew) {
    fileName = document.getElementById('newFileName').value.trim();
    if (!fileName) {
      resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, ingrese el nombre del archivo.</div>';
      return;
    }
    if (!fileName.endsWith('.xlsx')) fileName += '.xlsx';
    sheetName = null; // Para archivo nuevo, se usará el nombre por defecto
  } else {
    fileName = document.getElementById('fileSelect').value;
    if (!fileName) {
      resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, seleccione un archivo.</div>';
      return;
    }
    
    sheetName = document.getElementById('sheetSelect').value;
    if (!sheetName) {
      resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, seleccione una maestría (hoja).</div>';
      return;
    }
  }

  const uc = parseFloat(document.getElementById('addUC').value) || 0;
  const costoUC = parseFloat(document.getElementById('addCostoUC').value) || 0;
  const totalAPagar = uc * costoUC;

  const paymentData = {
    cedula: document.getElementById('addCedula').value.trim(),
    nombre_completo: document.getElementById('addNombreCompleto').value.trim(),
    asignatura: document.getElementById('addAsignatura').value.trim(),
    uc: uc,
    costo_uc: costoUC,
    total_a_pagar: totalAPagar,
    fecha: document.getElementById('addFecha').value,
    abono: parseFloat(document.getElementById('addAbono').value) || 0,
    resta: parseFloat(document.getElementById('addResta').value) || 0,
    observacion: document.getElementById('addObservacion').value.trim()
  };

  if (!paymentData.cedula || !paymentData.nombre_completo) {
    resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, complete los campos obligatorios (Cédula, Nombre Completo).</div>';
    return;
  }

  try {
    await window.electronAPI.addPayment(selectedDirectory, fileName, paymentData, sheetName);
    resultsDiv.innerHTML = '<div class="notification is-success"><button class="delete"></button>¡Pago agregado exitosamente!</div>';
    
    // Limpiar formulario
    document.getElementById('studentForm').style.display = 'none';
    document.getElementById('searchCedula').value = '';
    document.getElementById('sheetSelectField').style.display = 'none';
    clearAddForm();
    
    if (createNew) {
      document.getElementById('newFileName').value = '';
      document.getElementById('createNewFile').checked = false;
      document.getElementById('newFileField').classList.add('hidden');
      document.getElementById('fileSelect').disabled = false;
    }
    
    await loadExcelFiles();
    
    setTimeout(() => {
      resultsDiv.innerHTML = '';
    }, 3000);
  } catch (error) {
    resultsDiv.innerHTML = `<div class="notification is-danger"><button class="delete"></button>${error.message}</div>`;
  }
}
