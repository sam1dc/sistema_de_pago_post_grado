// Módulo de agregar pagos
export async function addPayment(selectedDirectory) {
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
    sheetName = null;
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
  const totalAPagarInput = parseFloat(document.getElementById('addTotalPagar').value) || 0;
  
  // Si hay UC y costo, calcular. Si no, usar el valor del input (para pagos de deuda)
  const totalAPagar = (uc > 0 && costoUC > 0) ? (uc * costoUC) : totalAPagarInput;
  const abono = parseFloat(document.getElementById('addAbono').value) || 0;
  const resta = totalAPagar - abono;

  const paymentData = {
    cedula: document.getElementById('addCedula').value.trim(),
    nombre_completo: document.getElementById('addNombreCompleto').value.trim(),
    asignatura: document.getElementById('addAsignatura').value.trim(),
    uc: uc || '',
    costo_uc: costoUC || '',
    total_a_pagar: totalAPagar,
    fecha: document.getElementById('addFecha').value,
    abono: abono,
    resta: resta >= 0 ? resta : 0,
    observacion: document.getElementById('addObservacion').value.trim()
  };

  if (!paymentData.cedula || !paymentData.nombre_completo || !paymentData.fecha) {
    resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, complete los campos obligatorios (Cédula, Nombre Completo, Fecha).</div>';
    return;
  }

  try {
    await window.electronAPI.addPayment(selectedDirectory, fileName, paymentData, sheetName);
    resultsDiv.innerHTML = '<div class="notification is-success"><button class="delete"></button>¡Pago agregado exitosamente!</div>';
    
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
    
    await window.electronAPI.getExcelFiles(selectedDirectory);
    
    setTimeout(() => {
      resultsDiv.innerHTML = '';
    }, 3000);
  } catch (error) {
    resultsDiv.innerHTML = `<div class="notification is-danger"><button class="delete"></button>${error.message}</div>`;
  }
}

export async function searchStudentForAdd(selectedDirectory) {
  const cedula = document.getElementById('searchCedula').value.trim();
  const addResults = document.getElementById('addResults');
  const studentForm = document.getElementById('studentForm');

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
      studentForm.style.display = 'block';
      document.getElementById('addCedula').value = cedula;
      document.getElementById('addNombreCompleto').value = data.student.nombre_completo;
      
      const costoUC = localStorage.getItem('costoUC');
      if (data.totalDebt > 0) {
        document.getElementById('addTotalPagar').value = data.totalDebt.toFixed(2);
      } else if (costoUC) {
        document.getElementById('addCostoUC').value = parseFloat(costoUC).toFixed(2);
      }
      
      document.getElementById('addNombreCompleto').readOnly = true;
      
      addResults.innerHTML = '<div class="notification is-success"><button class="delete"></button>Estudiante encontrado. Datos autocompletados.</div>';
    } else {
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

export function clearAddForm() {
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

export function calculateDebt() {
  const totalPagar = parseFloat(document.getElementById('addTotalPagar').value) || 0;
  const abono = parseFloat(document.getElementById('addAbono').value) || 0;
  const resta = totalPagar - abono;
  document.getElementById('addResta').value = resta >= 0 ? resta.toFixed(2) : 0;
}
