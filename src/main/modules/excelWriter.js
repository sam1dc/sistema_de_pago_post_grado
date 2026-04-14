const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Agregar nueva fila de datos con la deuda actualizada
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
    rawData.push(newRow);
    
    // Actualizar la hoja específica
    workbook.Sheets[targetSheetName] = XLSX.utils.aoa_to_sheet(rawData);
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

function deletePayment(directory, fileName, sheetName, rowIndex) {
  const filePath = path.join(directory, fileName);
  
  if (!fs.existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  
  const workbook = XLSX.readFile(filePath);
  
  if (!workbook.Sheets[sheetName]) {
    throw new Error('Hoja no encontrada');
  }
  
  const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
  
  // Eliminar la fila (rowIndex es el índice en el array rawData)
  if (rowIndex < 0 || rowIndex >= rawData.length) {
    throw new Error('Índice de fila inválido');
  }
  
  rawData.splice(rowIndex, 1);
  
  // Actualizar la hoja
  workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(rawData);
  XLSX.writeFile(workbook, filePath);
  
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
  
  const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
  
  if (rowIndex < 0 || rowIndex >= rawData.length) {
    throw new Error('Índice de fila inválido');
  }
  
  // Actualizar la fila
  rawData[rowIndex] = [
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
  
  // Actualizar la hoja
  workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(rawData);
  XLSX.writeFile(workbook, filePath);
  
  return true;
}

module.exports = {
  addPayment,
  createNewExcelFile,
  deletePayment,
  updatePayment
};
