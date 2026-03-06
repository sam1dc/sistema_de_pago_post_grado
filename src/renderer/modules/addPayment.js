// Módulo de agregar pagos

function showToast(message, type = 'is-info') {
  if (window.bulmaToast) {
    window.bulmaToast.toast({
      message,
      type,
      dismissible: false,
      pauseOnHover: true,
      duration: 3000,
      position: 'top-center',
      closeOnClick: true,
      opacity: 1,
      single: false
    });
  }
}
export async function addPayment(selectedDirectory) {
  const resultsDiv = document.getElementById('addResults');

  if (!selectedDirectory) {
    resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, seleccione un directorio primero.</div>';
    return;
  }

  const createNew = document.getElementById('createNewFile').checked;
  let fileName, sheetName;

  if (createNew) {
    const trimestre = document.getElementById('newFileName').value.trim();
    if (!trimestre) {
      resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, ingrese el trimestre (Ej: 2026-1).</div>';
      return;
    }
    fileName = `CONTROL DE PAGOS DEL TRIMESTRE ${trimestre}.xlsx`;
    
    sheetName = document.getElementById("newFileMaestriaSelect").value;
    if (!sheetName) {
      resultsDiv.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Por favor, seleccione una maestría.</div>';
      return;
    }
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

  const cedula = document.getElementById('addCedula').value.trim();
  const uc = parseFloat(document.getElementById('addUC').value) || 0;
  const costoUC = parseFloat(document.getElementById('addCostoUC').value) || 0;
  const abono = parseFloat(document.getElementById('addAbono').value) || 0;
  
  // Calcular nuevo cargo por UC
  const nuevoCargoUC = uc * costoUC;
  
  // TOTAL A PAGAR = solo el nuevo cargo (no incluye deuda anterior)
  const totalAPagar = nuevoCargoUC;
  
  // Obtener deuda acumulada para calcular RESTA
  let deudaAcumulada = 0;
  try {
    const studentData = await window.electronAPI.searchStudent(selectedDirectory, cedula);
    if (studentData) {
      deudaAcumulada = studentData.totalDebt || 0;
    }
  } catch (error) {
    console.error('Error al obtener deuda acumulada:', error);
  }
  
  // RESTA = deuda anterior + nuevo cargo - abono
  const resta = (deudaAcumulada + totalAPagar) - abono;

  // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY
  const fechaInput = document.getElementById("addFecha").value;
  let fechaFormateada = "";
  if (fechaInput) {
    const parts = fechaInput.split("-");
    if (parts.length === 3) {
      fechaFormateada = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const paymentData = {
    cedula: cedula,
    nombre_completo: document.getElementById('addNombreCompleto').value.trim(),
    asignatura: document.getElementById('addAsignatura').value.trim() || 'ABONO',
    uc: uc || '',
    costo_uc: costoUC || '',
    total_a_pagar: totalAPagar,
    fecha: fechaFormateada,
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
    
    
    // Recargar todo el sistema
    if (window.reloadSystemData) {
      await window.reloadSystemData();
    }
    
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
  
  // Limpiar campos del formulario antes de buscar
  document.getElementById('addCedula').value = '';
  document.getElementById('addNombreCompleto').value = '';
  document.getElementById('addNombreCompleto').readOnly = false;
  document.getElementById('addAsignatura').value = '';
  document.getElementById('addUC').value = '';
  document.getElementById('addCostoUC').value = '';
  document.getElementById('addAbono').value = '';
  document.getElementById('addTotalPagar').value = '';
  document.getElementById('addResta').value = '';
  document.getElementById('addObservacion').value = '';
  
  // Limpiar selectores de archivo
  const fileSelect = document.getElementById('fileSelect');
  if (fileSelect) fileSelect.value = '';
  const sheetSelect = document.getElementById('sheetSelect');
  if (sheetSelect) {
    sheetSelect.innerHTML = '<option value="">Seleccione primero un archivo</option>';
    sheetSelect.disabled = true;
  }
  
  // Ocultar y limpiar deuda actual
  const deudaActualInfo = document.getElementById('deudaActualInfo');
  if (deudaActualInfo) {
    deudaActualInfo.style.display = 'none';
    const deudaActualMonto = document.getElementById('deudaActualMonto');
    if (deudaActualMonto) deudaActualMonto.textContent = '0.00';
  }
  
  // Ocultar botón OCR por defecto
  const ocrButtonContainer = document.getElementById('ocrButtonContainer');
  if (ocrButtonContainer) ocrButtonContainer.style.display = 'none';

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
      
      // Mostrar botón OCR
      if (ocrButtonContainer) ocrButtonContainer.style.display = 'block';      
      // Mostrar deuda total pero NO autocompletar Total a Pagar
      // El usuario debe seleccionar archivo/maestría primero
      if (data.totalDebt > 0) {
        showToast(`Estudiante encontrado. Deuda total: $${data.totalDebt.toFixed(2)}`, 'is-info');
      } else {
        const costoUC = localStorage.getItem('costoUC');
        if (costoUC) {
          document.getElementById('addCostoUC').value = parseFloat(costoUC).toFixed(2);
        }
        showToast('Estudiante encontrado sin deudas', 'is-success');
      }
      addResults.innerHTML = '';
      
      document.getElementById('addNombreCompleto').readOnly = true;
    } else {
      addResults.innerHTML = `
        <div class="notification is-warning">
          <button class="delete"></button>
          No se encontró la cédula en el sistema. ¿Desea agregar esta cédula al sistema? 
          <button class="button is-small is-warning mt-2" id="btnAgregarCedula">Agregar Cédula</button>
        </div>
      `;
      
      // Mostrar formulario y botón OCR para nuevo estudiante
      studentForm.style.display = 'block';
      document.getElementById('addCedula').value = cedula;
      if (ocrButtonContainer) ocrButtonContainer.style.display = 'block';    }
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
  
  // Resetear radio buttons
  const useExistingFile = document.getElementById('useExistingFile');
  if (useExistingFile) useExistingFile.checked = true;
  const existingFileFields = document.getElementById('existingFileFields');
  if (existingFileFields) existingFileFields.style.display = 'block';
  const newFileField = document.getElementById('newFileField');
  if (newFileField) newFileField.style.display = 'none';}

export async function calculateDebt(selectedDirectory) {
  const cedula = document.getElementById('addCedula').value.trim();
  const uc = parseFloat(document.getElementById('addUC').value) || 0;
  const costoUC = parseFloat(document.getElementById('addCostoUC').value) || 0;
  const abono = parseFloat(document.getElementById('addAbono').value) || 0;
  
  let deudaAcumulada = 0;
  
  if (cedula && selectedDirectory) {
    try {
      const studentData = await window.electronAPI.searchStudent(selectedDirectory, cedula);
      if (studentData) {
        deudaAcumulada = studentData.totalDebt || 0;
      }
    } catch (error) {
      console.error('Error al obtener deuda:', error);
    }
  }
  
  // TOTAL A PAGAR = solo nuevo cargo (UC × Costo UC)
  const nuevoCargoUC = uc * costoUC;
  
  // RESTA = deuda acumulada + nuevo cargo - abono
  const resta = (deudaAcumulada + nuevoCargoUC) - abono;
  
  document.getElementById('addTotalPagar').value = nuevoCargoUC.toFixed(2);
  document.getElementById('addResta').value = resta >= 0 ? resta.toFixed(2) : 0;
}
