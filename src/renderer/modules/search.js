// Módulo de búsqueda de estudiantes
export async function searchStudent(selectedDirectory) {
  const cedula = document.getElementById('cedula').value.trim();
  const maestriaFilter = document.getElementById('searchMaestriaFilter').value;
  const trimestreFilter = document.getElementById('searchTrimestreFilter').value;
  const fechaDesde = document.getElementById('searchFechaDesde').value;
  const fechaHasta = document.getElementById('searchFechaHasta').value;
  const resultsDiv = document.getElementById('results');

  if (!selectedDirectory) {
    resultsDiv.innerHTML = '<div class="notification is-danger mt-4"><button class="delete"></button>Por favor, seleccione un directorio primero.</div>';
    return;
  }

  if (!cedula && !maestriaFilter && !trimestreFilter && !fechaDesde && !fechaHasta) {
    resultsDiv.innerHTML = '<div class="notification is-danger mt-4"><button class="delete"></button>Por favor, ingrese una cédula o seleccione al menos un filtro.</div>';
    return;
  }

  try {
    // Búsqueda solo por filtros (sin cédula)
    if (!cedula && (maestriaFilter || trimestreFilter || fechaDesde || fechaHasta)) {
      await searchByFilters(selectedDirectory, maestriaFilter, trimestreFilter, fechaDesde, fechaHasta, resultsDiv);
      return;
    }
    
    // Búsqueda por cédula (con o sin filtros)
    await searchByCedula(selectedDirectory, cedula, maestriaFilter, trimestreFilter, fechaDesde, fechaHasta, resultsDiv);
  } catch (error) {
    resultsDiv.innerHTML = `<div class="notification is-danger mt-4"><button class="delete"></button>${error.message}</div>`;
  }
}

async function searchByFilters(selectedDirectory, maestriaFilter, trimestreFilter, fechaDesde, fechaHasta, resultsDiv) {
  let students = [];
  
  if (maestriaFilter) {
    students = await window.electronAPI.searchByMaestria(selectedDirectory, maestriaFilter);
  } else {
    // Si no hay filtro de maestría, obtener todos los registros
    const allFiles = await window.electronAPI.getExcelFiles(selectedDirectory);
    for (const file of allFiles) {
      const sheets = await window.electronAPI.getSheetNames(selectedDirectory, file);
      for (const sheet of sheets) {
        const data = await window.electronAPI.searchByMaestria(selectedDirectory, sheet);
        if (data) students.push(...data);
      }
    }
  }
  
  if (!students || students.length === 0) {
    resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros.</div>';
    return;
  }
  
  let allPayments = students.flatMap(s => s.payments);
  
  // Aplicar filtros
  if (trimestreFilter) {
    allPayments = allPayments.filter(p => p.trimestre === trimestreFilter);
  }
  
  if (fechaDesde || fechaHasta) {
    allPayments = allPayments.filter(p => {
      if (!p.fecha) return false;
      
      let fechaPago;
      // Detectar formato de fecha
      if (p.fecha.includes('/')) {
        // Formato DD/MM/YYYY
        const parts = p.fecha.split('/');
        if (parts.length === 3) {
          fechaPago = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else if (p.fecha.includes('-')) {
        // Formato YYYY-MM-DD (ya está en el formato correcto)
        fechaPago = p.fecha;
      }
      
      if (!fechaPago) return false;
      
      if (fechaDesde && fechaHasta) {
        return fechaPago >= fechaDesde && fechaPago <= fechaHasta;
      } else if (fechaDesde) {
        return fechaPago >= fechaDesde;
      } else if (fechaHasta) {
        return fechaPago <= fechaHasta;
      }
      return false;
    });
  }
  
  if (allPayments.length === 0) {
    resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros con los filtros seleccionados.</div>';
    return;
  }
  
  const uniqueStudents = [...new Set(allPayments.map(p => p.cedula))].length;
  
  const html = `
    <div class="box mt-5">
      <h2 class="title is-5 mb-4">Resultados de Búsqueda</h2>
      <div class="columns">
        <div class="column">
          <p><strong>Total de estudiantes:</strong> ${uniqueStudents}</p>
        </div>
        <div class="column">
          <p><strong>Total de pagos:</strong> ${allPayments.length}</p>
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
            <th>Maestría</th>
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
              <td><span class="tag is-link is-light">${p._sheet || 'N/A'}</span></td>
              <td>${p.asignatura || 'N/A'}</td>
              <td>${p.uc || ''}</td>
              <td>$${(parseFloat(p.costo_uc) || 0).toFixed(2)}</td>
              <td><strong>$${(parseFloat(p.total_a_pagar) || 0).toFixed(2)}</strong></td>
              <td><span class="tag is-success">$${(parseFloat(p.abono) || 0).toFixed(2)}</span></td>
              <td><span class="tag ${p.resta > 0 ? 'is-warning' : 'is-success'}">$${(parseFloat(p.resta) || 0).toFixed(2)}</span></td>
              <td>${p.observacion || ''}</td>
              <td>
                <button class="button is-small is-info btnVerDetalles" data-cedula="${p.cedula}">
                  <span class="icon is-small">
                    <i class="mdi mdi-eye"></i>
                  </span>
                  <span>Ver</span>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  resultsDiv.innerHTML = html;
}

async function searchByMaestriaOnly(selectedDirectory, maestriaFilter, resultsDiv) {
  const students = await window.electronAPI.searchByMaestria(selectedDirectory, maestriaFilter);
  
  if (!students || students.length === 0) {
    resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros en esta maestría.</div>';
    return;
  }
  
  const allPayments = students.flatMap(s => s.payments);
  
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
              <td>$${(parseFloat(p.costo_uc) || 0).toFixed(2)}</td>
              <td><strong>$${(parseFloat(p.total_a_pagar) || 0).toFixed(2)}</strong></td>
              <td><span class="tag is-success">$${(parseFloat(p.abono) || 0).toFixed(2)}</span></td>
              <td><span class="tag ${p.resta > 0 ? 'is-warning' : 'is-success'}">$${(parseFloat(p.resta) || 0).toFixed(2)}</span></td>
              <td>${p.observacion || ''}</td>
              <td>
                <button class="button is-small is-info btnVerDetalles" data-cedula="${p.cedula}">
                  <span class="icon is-small">
                    <i class="mdi mdi-eye"></i>
                  </span>
                  <span>Ver</span>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  resultsDiv.innerHTML = html;
}

async function searchByCedula(selectedDirectory, cedula, maestriaFilter, trimestreFilter, fechaDesde, fechaHasta, resultsDiv) {
  const data = await window.electronAPI.searchStudent(selectedDirectory, cedula);

  if (!data) {
    resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros para esta cédula.</div>';
    return;
  }

  let { student, payments, totalDebt, trimestres } = data;
  
  // Aplicar filtros
  if (maestriaFilter) {
    payments = payments.filter(p => p._sheet === maestriaFilter);
  }
  
  if (trimestreFilter) {
    payments = payments.filter(p => p.trimestre === trimestreFilter);
  }
  
  if (fechaDesde || fechaHasta) {
    payments = payments.filter(p => {
      if (!p.fecha) return false;
      const parts = p.fecha.split('/');
      if (parts.length === 3) {
        const fechaPago = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        
        if (fechaDesde && fechaHasta) {
          return fechaPago >= fechaDesde && fechaPago <= fechaHasta;
        } else if (fechaDesde) {
          return fechaPago >= fechaDesde;
        } else if (fechaHasta) {
          return fechaPago <= fechaHasta;
        }
      }
      return false;
    });
  }
  
  if (payments.length === 0) {
    resultsDiv.innerHTML = '<div class="notification is-warning mt-4"><button class="delete"></button>No se encontraron registros para esta cédula con los filtros seleccionados.</div>';
    return;
  }
  
  // Recalcular trimestres según filtros
  const trimestresSet = new Set(payments.map(p => p.trimestre));
  trimestres = trimestresSet.size;
  
  // totalDebt ya viene calculado correctamente del backend (suma TOTAL_A_PAGAR - suma ABONO)

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
            <th>Acciones</th>
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
              <td>$${(parseFloat(p.costo_uc) || 0).toFixed(2)}</td>
              <td><strong>$${(parseFloat(p.total_a_pagar) || 0).toFixed(2)}</strong></td>
              <td><span class="tag is-success">$${(parseFloat(p.abono) || 0).toFixed(2)}</span></td>
              <td><span class="tag ${p.resta > 0 ? 'is-warning' : 'is-success'}">$${(parseFloat(p.resta) || 0).toFixed(2)}</span></td>
              <td>${p.observacion || ''}</td>
              <td>
                <div class="buttons are-small has-addons">
                  <button class="button is-info btnEditPayment" 
                    data-file="${p._file}" 
                    data-sheet="${p._sheet}" 
                    data-row="${p._rowIndex}"
                    data-payment='${JSON.stringify(p)}'>
                    <span class="icon"><i class="mdi mdi-pencil"></i></span>
                  </button>
                  <button class="button is-danger btnDeletePayment" 
                    data-file="${p._file}" 
                    data-sheet="${p._sheet}" 
                    data-row="${p._rowIndex}">
                    <span class="icon"><i class="mdi mdi-delete"></i></span>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  resultsDiv.innerHTML = html;
}
