const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Agrega una fila al final del worksheet sin reemplazarlo (preserva estilos)
function appendRowToSheet(worksheet, rowData) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  const newRowIdx = range.e.r + 1;
  rowData.forEach((val, colIdx) => {
    if (val === null || val === undefined || val === '') return;
    const cellRef = XLSX.utils.encode_cell({ r: newRowIdx, c: colIdx });
    worksheet[cellRef] = { v: val, t: typeof val === 'number' ? 'n' : 's' };
  });
  range.e.r = newRowIdx;
  worksheet['!ref'] = XLSX.utils.encode_range(range);
}

// Elimina una fila del worksheet desplazando las siguientes hacia arriba (preserva estilos de otras filas)
function deleteRowFromSheet(worksheet, rowIdx) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  // Desplazar filas hacia arriba desde rowIdx
  for (let r = rowIdx; r < range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const from = XLSX.utils.encode_cell({ r: r + 1, c });
      const to = XLSX.utils.encode_cell({ r, c });
      if (worksheet[from]) {
        worksheet[to] = worksheet[from];
      } else {
        delete worksheet[to];
      }
    }
  }
  // Limpiar la última fila (siempre, incluso si rowIdx === range.e.r)
  for (let c = range.s.c; c <= range.e.c; c++) {
    delete worksheet[XLSX.utils.encode_cell({ r: range.e.r, c })];
  }
  // Recalcular el rango real ignorando filas vacías al final
  let lastDataRow = range.s.r;
  for (let r = range.s.r; r <= range.e.r - 1; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      if (worksheet[XLSX.utils.encode_cell({ r, c })]) { lastDataRow = r; }
    }
  }
  range.e.r = lastDataRow;
  worksheet['!ref'] = XLSX.utils.encode_range(range);
}

// Actualiza una fila existente en el worksheet (preserva estilos de otras filas)
function updateRowInSheet(worksheet, rowIdx, rowData) {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  rowData.forEach((val, colIdx) => {
    const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
    if (val === null || val === undefined || val === '') {
      // Preservar celda existente si el nuevo valor está vacío
      return;
    }
    if (worksheet[cellRef]) {
      worksheet[cellRef].v = val;
      worksheet[cellRef].t = typeof val === 'number' ? 'n' : 's';
      delete worksheet[cellRef].w; // Forzar re-formateo
    } else {
      worksheet[cellRef] = { v: val, t: typeof val === 'number' ? 'n' : 's' };
    }
  });
}

function addPayment(directory, fileName, paymentData, sheetName = null) {
  const filePath = path.join(directory, fileName);
  let workbook, targetSheetName;

  if (fs.existsSync(filePath)) {
    // Archivo existe
    workbook = XLSX.readFile(filePath);
    
    // Si no se especifica hoja, usar la primera
    targetSheetName = sheetName || workbook.SheetNames[0];
    
    // Buscar la hoja (con o sin espacios al final)
    let foundSheet = workbook.Sheets[targetSheetName];
    if (!foundSheet) {
      // Intentar buscar con trim
      const trimmedName = targetSheetName.trim();
      foundSheet = Object.keys(workbook.Sheets).find(name => 
        name.trim() === trimmedName
      );
      if (foundSheet) {
        targetSheetName = foundSheet;
      } else {
        throw new Error(`La hoja "${targetSheetName}" no existe en el archivo`);
      }
    }
    
    const worksheet = workbook.Sheets[targetSheetName];
    
    const newRow = [
      '',                          // N°
      '',                          // CODIGO
      paymentData.nombre_completo, // NOMBRE Y APELLIDO
      paymentData.cedula,          // CÉDULA
      '',                          // CODIGO2
      paymentData.asignatura,      // ASIGNATURA
      paymentData.uc,              // U.C
      paymentData.costo_uc,        // COSTO U.C
      paymentData.total_a_pagar,   // TOTAL A PAGAR
      paymentData.fecha,           // FECHA
      paymentData.abono,           // ABONO
      paymentData.resta,           // RESTA
      paymentData.observacion      // OBSERVACIÓN
    ];
    
    appendRowToSheet(worksheet, newRow);
  } else {
    // Archivo nuevo, crear estructura completa con todas las maestrías
    const trimestre = fileName.match(/\d{4}-\d+/)?.[0] || '2026-1';
    targetSheetName = sheetName || 'MAESTRÍA EN ING. ELÉCTRICA';
    
    const maestrias = [
      'MAESTRÍA EN ING. ELECTRÓNICA',
      'MAESTRÍA EN ING. MATALÚRGICA',
      'MAESTRÍA EN ING. ELÉCTRICA',
      'MAESTRÍA EN ING. INDUSTRIAL',
      'MAESTRÍA EN ING. MATEMÁTICA APL',
      'MAESTRÍA EN ING. MECÁNICA',
      'ESP. EN CORROSIÓN',
      'ESP. EN GERENCIA DE MANTENIMIEN',
      'ESP. PREVENCIÓN Y CONTROL DE R',
      'ESP. INSTRUMENTACIÓN ',
      'ESP. EN  TELECOMUNICACIONES',
      'ESP. EN ELECTROMEDICINA',
      'ESP. SOLDADURA',
      'ESP. REDUCCIÓN DIRECTA',
      'ESP. INFORMACIÓN'
    ];
    
    workbook = XLSX.utils.book_new();
    
    const headers = ['N°', 'CODIGO', 'NOMBRE Y APELLIDO', 'CÉDULA', 'CODIGO2', 'ASIGNATURA', 'U.C', 'COSTO U.C', 'TOTAL A PAGAR', 'FECHA', 'ABONO', 'RESTA', 'OBSERVACIÓN'];

    maestrias.forEach(maestria => {
      const titulo = `${maestria.trim()} ${trimestre}`;
      const rawData = [
        [null, null, titulo],  // Fila 0: Título en columna 2
        [],                    // Fila 1: Vacía
        headers                // Fila 2: Encabezados
      ];
      
      if (maestria.trim() === targetSheetName.trim()) {
        rawData.push([
          '', '',
          paymentData.nombre_completo,
          paymentData.cedula,
          '',
          paymentData.asignatura,
          paymentData.uc,
          paymentData.costo_uc,
          paymentData.total_a_pagar,
          paymentData.fecha,
          paymentData.abono,
          paymentData.resta,
          paymentData.observacion
        ]);
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(rawData);
      XLSX.utils.book_append_sheet(workbook, worksheet, maestria);
    });
  }

  XLSX.writeFile(workbook, filePath);
  return true;
}

function createNewExcelFile(directory, fileName) {
  const filePath = path.join(directory, fileName);
  if (fs.existsSync(filePath)) {
    throw new Error('El archivo ya existe');
  }
  return fileName;
}

function deletePayment(directory, fileName, sheetName, rowIndex, cedula, fecha) {
  const filePath = path.join(directory, fileName);
  
  if (!fs.existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  
  const workbook = XLSX.readFile(filePath);
  
  // Resolver nombre de hoja (puede tener espacios al final)
  let resolvedSheet = sheetName;
  if (!workbook.Sheets[sheetName]) {
    const found = Object.keys(workbook.Sheets).find(n => n.trim() === sheetName.trim());
    if (!found) throw new Error('Hoja no encontrada');
    resolvedSheet = found;
  }
  
  const ws = workbook.Sheets[resolvedSheet];
  const wsRange = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  if (rowIndex < 0 || rowIndex >= rawData.length) {
    throw new Error('Índice de fila inválido');
  }

  // Verificar que la fila corresponde al pago correcto usando cédula
  const normalize = v => String(v || '').replace(/\./g, '').trim();
  const rowCedula = normalize(rawData[rowIndex][3]);
  const expectedCedula = normalize(cedula);

  // rowIndex es índice en rawData; convertir a índice real del worksheet
  let targetRow = wsRange.s.r + rowIndex;
  console.log('[deletePayment] rowIndex:', rowIndex, '| rowCedula:', JSON.stringify(rowCedula), '| expectedCedula:', JSON.stringify(expectedCedula), '| match:', rowCedula === expectedCedula);

  if (expectedCedula && normalize(rawData[rowIndex][3]) !== expectedCedula) {
    // El índice no coincide: buscar la fila correcta por cédula + fecha
    const fechaNorm = String(fecha || '').trim();
    let found = -1;
    let foundByCedulaOnly = -1;
    for (let i = 3; i < rawData.length; i++) {
      if (normalize(rawData[i][3]) === expectedCedula) {
        if (foundByCedulaOnly === -1) foundByCedulaOnly = i;
        if (!fechaNorm || String(rawData[i][9] || '').includes(fechaNorm) || fechaNorm.includes(String(rawData[i][9] || ''))) {
          found = i;
          break;
        }
      }
    }
    if (found === -1) found = foundByCedulaOnly;
    if (found === -1) {
      throw new Error(
        `DATOS_INVALIDOS: No se encontró la fila a eliminar. La cédula "${cedula}" en este registro puede estar mal escrita o tener un formato incorrecto en el Excel. Por favor, corrija o elimine manualmente la fila en el archivo Excel.`
      );
    }
    targetRow = wsRange.s.r + found; // convertir a índice del worksheet
  }
  
  console.log('[deletePayment] Eliminando fila ws:', targetRow, '(rawIndex:', rowIndex, ') de hoja', resolvedSheet);
  deleteRowFromSheet(ws, targetRow);
  XLSX.writeFile(workbook, filePath);
  // Forzar flush a disco en Windows
  const fd = fs.openSync(filePath, 'r+');
  fs.fsyncSync(fd);
  fs.closeSync(fd);
  console.log('[deletePayment] Archivo guardado y flushed OK');
  return true;
}

function updatePayment(directory, fileName, sheetName, rowIndex, paymentData) {
  const filePath = path.join(directory, fileName);
  
  if (!fs.existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  
  const workbook = XLSX.readFile(filePath);
  
  if (!workbook.Sheets[sheetName]) {
    throw new Error('Hoja no encontrada');
  }
  
  const worksheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  
  if (rowIndex < 0 || rowIndex > range.e.r) {
    throw new Error('Índice de fila inválido');
  }
  
  updateRowInSheet(worksheet, rowIndex, [
    '',                          // N°
    '',                          // CODIGO
    paymentData.nombre_completo, // NOMBRE Y APELLIDO
    paymentData.cedula,          // CÉDULA
    '',                          // CODIGO2
    paymentData.asignatura,      // ASIGNATURA
    paymentData.uc,              // U.C
    paymentData.costo_uc,        // COSTO U.C
    paymentData.total_a_pagar,   // TOTAL A PAGAR
    paymentData.fecha,           // FECHA
    paymentData.abono,           // ABONO
    paymentData.resta,           // RESTA
    paymentData.observacion      // OBSERVACIÓN
  ]);
  
  XLSX.writeFile(workbook, filePath);
  
  return true;
}

module.exports = {
  addPayment,
  createNewExcelFile,
  deletePayment,
  updatePayment
};
