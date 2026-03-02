// Módulo de búsqueda de estudiantes
export async function searchStudent(selectedDirectory) {
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
      await searchByMaestriaOnly(selectedDirectory, maestriaFilter, resultsDiv);
      return;
    }
    
    // Búsqueda por cédula (con o sin filtro de maestría)
    await searchByCedula(selectedDirectory, cedula, maestriaFilter, resultsDiv);
  } catch (error) {
    resultsDiv.innerHTML = `<div class="notification is-danger mt-4"><button class="delete"></button>${error.message}</div>`;
  }
}

async function searchByMaestriaOnly(selectedDirectory, maestriaFilter, resultsDiv) {
  const students = await window.electronAPI.searchByMaestria(selectedDirectory, maestriaFilter);
  
  if (!students || students.length === 0) {
    resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros en esta maestría.</div>';
    return;
  }
  
  const allPayments = students.flatMap(s => s.payments);
  const totalDeuda = students.reduce((sum, s) => sum + s.totalDebt, 0);
  
  const html = `
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
            <th>Acción</th>
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
              <td>
                ${p.resta > 0 ? `<button class="button is-small is-warning btnPagarFila" data-cedula="${p.cedula}" data-nombre="${p.nombre_completo}" data-deuda="${p.resta}">
                  <span class="icon is-small">
                    <i class="mdi mdi-cash"></i>
                  </span>
                  <span>Pagar</span>
                </button>` : '<span class="tag is-success">Pagado</span>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  resultsDiv.innerHTML = html;
}

async function searchByCedula(selectedDirectory, cedula, maestriaFilter, resultsDiv) {
  const data = await window.electronAPI.searchStudent(selectedDirectory, cedula);

  if (!data) {
    resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros para esta cédula.</div>';
    return;
  }

  let { student, payments, totalDebt, trimestres } = data;
  
  if (maestriaFilter) {
    payments = payments.filter(p => p._sheet === maestriaFilter);
    if (payments.length === 0) {
      resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros para esta cédula en la maestría seleccionada.</div>';
      return;
    }
    totalDebt = payments.reduce((sum, p) => sum + (Number(p.resta) || 0), 0);
    const trimestresSet = new Set(payments.map(p => p.trimestre));
    trimestres = trimestresSet.size;
  }

  const html = `
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
          ${totalDebt > 0 ? `<button class="button is-warning is-medium mt-3" id="btnPagarDeuda" data-cedula="${student.cedula}" data-nombre="${student.nombre_completo}" data-deuda="${totalDebt}">
            <span class="icon">
              <i class="mdi mdi-cash"></i>
            </span>
            <span>Pagar Deuda</span>
          </button>` : ''}
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
}
