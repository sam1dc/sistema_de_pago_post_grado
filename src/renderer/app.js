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
    document.getElementById('initialModal').classList.remove('is-active');
    updateDirectoryDisplay();
    loadExcelFiles();
  }

  // Cargar costo guardado
  const savedCost = localStorage.getItem('semesterCost');
  if (savedCost) {
    document.getElementById('semesterCost').value = savedCost;
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

  // Guardar costo por semestre
  document.getElementById('saveCostBtn').addEventListener('click', () => {
    const cost = document.getElementById('semesterCost').value;
    if (!cost || parseFloat(cost) <= 0) {
      document.getElementById('costResult').innerHTML = '<div class="notification is-danger"><button class="delete"></button>Ingresa un monto válido.</div>';
      return;
    }
    localStorage.setItem('semesterCost', cost);
    document.getElementById('costResult').innerHTML = '<div class="notification is-success"><button class="delete"></button>Costo guardado: $' + parseFloat(cost).toFixed(2) + '</div>';
    setTimeout(() => {
      document.getElementById('costResult').innerHTML = '';
    }, 3000);
  });

  // Toggle crear nuevo archivo
  document.getElementById('createNewFile').addEventListener('change', (e) => {
    const newFileField = document.getElementById('newFileField');
    const fileSelect = document.getElementById('fileSelect');
    if (e.target.checked) {
      newFileField.classList.remove('hidden');
      fileSelect.disabled = true;
    } else {
      newFileField.classList.add('hidden');
      fileSelect.disabled = false;
    }
  });

  // Calcular cuánto debe automáticamente
  document.getElementById('addTotalPagar').addEventListener('input', calculateDebt);
  document.getElementById('addPago').addEventListener('input', calculateDebt);

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
      document.getElementById('addNombre').value = '';
      document.getElementById('addApellido').value = '';
      document.getElementById('addCarrera').value = '';
      document.getElementById('addSemestre').value = '';
      
      document.getElementById('addNombre').readOnly = false;
      document.getElementById('addApellido').readOnly = false;
      document.getElementById('addCarrera').readOnly = false;
      document.getElementById('addSemestre').readOnly = false;
      
      // Autocompletar con costo por semestre
      const semesterCost = localStorage.getItem('semesterCost');
      if (semesterCost) {
        document.getElementById('addTotalPagar').value = parseFloat(semesterCost).toFixed(2);
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
  // Verificar si hay directorio guardado
  const savedDir = localStorage.getItem('excelDirectory');
  if (savedDir) {
    selectedDirectory = savedDir;
    document.getElementById('initialModal').classList.remove('is-active');
    updateDirectoryDisplay();
    loadExcelFiles();
  }

  // Cargar costo guardado
  const savedCost = localStorage.getItem('semesterCost');
  if (savedCost) {
    document.getElementById('semesterCost').value = savedCost;
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
  } catch (error) {
    console.error('Error al cargar archivos:', error);
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
  const pago = parseFloat(document.getElementById('addPago').value) || 0;
  const debe = totalPagar - pago;
  document.getElementById('addDebe').value = debe >= 0 ? debe.toFixed(2) : 0;
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
      document.getElementById('addNombre').value = data.student.nombre;
      document.getElementById('addApellido').value = data.student.apellido;
      document.getElementById('addCarrera').value = data.student.carrera;
      document.getElementById('addSemestre').value = '';
      
      // Autocompletar Total a Pagar con deuda pendiente o costo por semestre
      const semesterCost = localStorage.getItem('semesterCost');
      if (data.totalDebt > 0) {
        document.getElementById('addTotalPagar').value = data.totalDebt.toFixed(2);
      } else if (semesterCost) {
        document.getElementById('addTotalPagar').value = parseFloat(semesterCost).toFixed(2);
      }
      
      document.getElementById('addNombre').readOnly = true;
      document.getElementById('addApellido').readOnly = true;
      document.getElementById('addCarrera').readOnly = true;
      document.getElementById('addSemestre').readOnly = false;
      
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
  document.getElementById('addNombre').value = '';
  document.getElementById('addApellido').value = '';
  document.getElementById('addCarrera').value = '';
  document.getElementById('addFecha').value = '';
  document.getElementById('addReferencia').value = '';
  document.getElementById('addPago').value = '';
  document.getElementById('addTotalPagar').value = '';
  document.getElementById('addDebe').value = '';
  document.getElementById('addSemestre').value = '';
  
  document.getElementById('addNombre').readOnly = false;
  document.getElementById('addApellido').readOnly = false;
  document.getElementById('addCarrera').readOnly = false;
  document.getElementById('addSemestre').readOnly = false;
}

async function searchStudent() {
  const cedula = document.getElementById('cedula').value.trim();
  const resultsDiv = document.getElementById('results');

  if (!selectedDirectory) {
    resultsDiv.innerHTML = '<div class="notification is-danger mt-4"><button class="delete"></button>Por favor, seleccione un directorio primero.</div>';
    return;
  }

  if (!cedula) {
    resultsDiv.innerHTML = '<div class="notification is-danger mt-4"><button class="delete"></button>Por favor, ingrese una cédula.</div>';
    return;
  }

  try {
    const data = await window.electronAPI.searchStudent(selectedDirectory, cedula);

    if (!data) {
      resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros para esta cédula.</div>';
      return;
    }

    const { student, payments, totalDebt, semesters } = data;

    let html = `
      <div class="box summary-box mt-5">
        <h2 class="title is-5 has-text-white mb-4">Información del Alumno</h2>
        <div class="columns is-multiline">
          <div class="column is-6">
            <p class="has-text-white-ter mb-2"><strong class="has-text-white">Nombre:</strong> ${student.nombre} ${student.apellido}</p>
            <p class="has-text-white-ter mb-2"><strong class="has-text-white">Cédula:</strong> ${student.cedula}</p>
          </div>
          <div class="column is-6">
            <p class="has-text-white-ter mb-2"><strong class="has-text-white">Carrera:</strong> ${student.carrera}</p>
            <p class="has-text-white-ter mb-2"><strong class="has-text-white">Semestres:</strong> ${semesters}</p>
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
              <th>Semestre</th>
              <th>Nro. Referencia</th>
              <th>Total a Pagar</th>
              <th>Pago</th>
              <th>Debe</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td>${p.fecha || 'N/A'}</td>
                <td><span class="tag is-info is-light">${p.semestre}</span></td>
                <td>${p.nro_referencia_del_pago || 'N/A'}</td>
                <td><strong>$${(p.total_a_pagar || 0).toFixed(2)}</strong></td>
                <td><span class="tag is-success">$${(p.pago || 0).toFixed(2)}</span></td>
                <td><span class="tag ${p.cuanto_debe > 0 ? 'is-warning' : 'is-success'}">$${(p.cuanto_debe || 0).toFixed(2)}</span></td>
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
  let fileName;

  if (createNew) {
    fileName = document.getElementById('newFileName').value.trim();
    if (!fileName) {
      resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, ingrese el nombre del archivo.</div>';
      return;
    }
    if (!fileName.endsWith('.xlsx')) fileName += '.xlsx';
  } else {
    fileName = document.getElementById('fileSelect').value;
    if (!fileName) {
      resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, seleccione un archivo.</div>';
      return;
    }
  }

  const paymentData = {
    cedula: document.getElementById('addCedula').value.trim(),
    nombre: document.getElementById('addNombre').value.trim(),
    apellido: document.getElementById('addApellido').value.trim(),
    carrera: document.getElementById('addCarrera').value.trim(),
    fecha: document.getElementById('addFecha').value,
    nro_referencia_del_pago: document.getElementById('addReferencia').value.trim(),
    pago: parseFloat(document.getElementById('addPago').value) || 0,
    total_a_pagar: parseFloat(document.getElementById('addTotalPagar').value) || 0,
    cuanto_debe: parseFloat(document.getElementById('addDebe').value) || 0,
    semestre: document.getElementById('addSemestre').value.trim()
  };

  if (!paymentData.cedula || !paymentData.nombre || !paymentData.apellido) {
    resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, complete los campos obligatorios (Cédula, Nombre, Apellido).</div>';
    return;
  }

  try {
    await window.electronAPI.addPayment(selectedDirectory, fileName, paymentData);
    resultsDiv.innerHTML = '<div class="notification is-success"><button class="delete"></button>¡Pago agregado exitosamente!</div>';
    
    // Limpiar formulario
    document.getElementById('studentForm').style.display = 'none';
    document.getElementById('searchCedula').value = '';
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
