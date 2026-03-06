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
    
    // Verificar que la hoja existe
    if (!workbook.Sheets[targetSheetName]) {
      throw new Error(`La hoja "${targetSheetName}" no existe en el archivo`);
    }
    
    const worksheet = workbook.Sheets[targetSheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Agregar nueva fila de datos con la deuda actualizada
    const newRow = [
      paymentData.nombre_completo,
      paymentData.cedula,
      paymentData.asignatura,
      paymentData.uc,
      paymentData.costo_uc,
      paymentData.total_a_pagar,
      paymentData.fecha,
      paymentData.abono,
      paymentData.resta,
      paymentData.observacion
    ];
    rawData.push(newRow);
    
    // Actualizar la hoja específica
    workbook.Sheets[targetSheetName] = XLSX.utils.aoa_to_sheet(rawData);
  } else {
    // Archivo nuevo, crear estructura completa
    const trimestre = fileName.match(/\d{4}-\d+/)?.[0] || '2026-1';
    targetSheetName = sheetName || 'MAESTRIA EN ING. ELÉCTRICA ';
    const titulo = `MAESTRÍA EN ING. ELÉCTRICA ${trimestre}`;
    
    const rawData = [
      [titulo], // Fila 0: Título
      ['NOMBRE Y APELLIDO', 'CÉDULA', 'ASIGNATURA', 'U.C', 'COSTO U.C', 'TOTAL A PAGAR', 'FECHA', 'ABONO', 'RESTA', 'OBSERVACIÓN'], // Fila 1: Encabezados
      [
        paymentData.nombre_completo,
        paymentData.cedula,
        paymentData.asignatura,
        paymentData.uc,
        paymentData.costo_uc,
        paymentData.total_a_pagar,
        paymentData.fecha,
        paymentData.abono,
        paymentData.resta,
        paymentData.observacion
      ] // Fila 2: Primer dato
    ];
    
    workbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(rawData);
    XLSX.utils.book_append_sheet(workbook, newWorksheet, targetSheetName);
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
    paymentData.nombre_completo,
    paymentData.cedula,
    paymentData.asignatura,
    paymentData.uc,
    paymentData.costo_uc,
    paymentData.total_a_pagar,
    paymentData.fecha,
    paymentData.abono,
    paymentData.resta,
    paymentData.observacion
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
