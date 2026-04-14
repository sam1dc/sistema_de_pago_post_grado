const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Caché en memoria
let _cache = { directory: null, records: null };

function readExcelFilesCached(directory) {
  if (_cache.directory === directory && _cache.records) return _cache.records;
  const records = readExcelFiles(directory);
  _cache = { directory, records };
  return records;
}

function invalidateCache() {
  _cache = { directory: null, records: null };
}

// Convierte fecha de Excel (número serial o string) a DD/MM/YYYY
function formatExcelDate(value) {
  if (!value) return '';
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (!date) return String(value);
    const d = String(date.d).padStart(2, '0');
    const m = String(date.m).padStart(2, '0');
    return `${d}/${m}/${date.y}`;
  }
  return String(value);
}

function readExcelFiles(directory) {
  const files = fs.readdirSync(directory).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  let allRecords = [];

  for (const file of files) {
    const workbook = XLSX.readFile(path.join(directory, file));
    
    // Leer TODAS las hojas del archivo
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      
      // Leer como array de arrays para manejar estructura personalizada
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      // Fila 0: Título en columna 2 (ej: "MAESTRÍA EN ING. ELÉCTRICA 2026-1")
      // Fila 1: Vacía
      // Fila 2: Encabezados
      // Fila 3+: Datos
      
      if (rawData.length < 4) continue; // Hoja vacía
      
      // Buscar el trimestre en cualquier celda de la fila 0, luego en el nombre del archivo
      const tituloRow = rawData[0] || [];
      const tituloCell = tituloRow.find(c => c && String(c).match(/\d{4}[-\/]\w+/i));
      const trimestreMatch = tituloCell
        ? String(tituloCell).match(/(\d{4})[-\/](\w+)/)
        : String(file).match(/(\d{4})[-\/](\w+)/);
      const trimestre = trimestreMatch ? `${trimestreMatch[1]}-${trimestreMatch[2]}` : '';
      
      // Procesar datos desde fila 3
      for (let i = 3; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row[2] && !row[3]) continue; // Saltar filas vacías (sin nombre ni cédula)
        
        const record = {
          nombre_completo: row[2],
          cedula: String(row[3] || '').replace(/\./g, ''),  // Normalizar: quitar puntos
          asignatura: row[5],
          uc: row[6],
          costo_uc: row[7],
          total_a_pagar: row[8],
          fecha: formatExcelDate(row[9]),
          abono: row[10],
          resta: row[11],
          observacion: row[12],
          trimestre: trimestre,
          _file: file,
          _sheet: sheetName,
          _rowIndex: i
        };
        
        allRecords.push(record);
      }
    }
  }

  return allRecords;
}

function searchStudent(directory, cedula) {
  const allRecords = readExcelFilesCached(directory);
  const studentRecords = allRecords.filter(r => String(r.cedula) === String(cedula));
  
  if (studentRecords.length === 0) return null;

  // Agrupar por trimestre
  const trimestreMap = {};
  studentRecords.forEach(record => {
    const trim = record.trimestre;
    if (!trimestreMap[trim]) {
      trimestreMap[trim] = [];
    }
    trimestreMap[trim].push(record);
  });

  // Calcular deuda total: suma de todos los TOTAL_A_PAGAR - suma de todos los ABONO
  let totalAPagar = 0;
  let totalAbonado = 0;
  
  studentRecords.forEach(record => {
    const toPagar = Number(record.total_a_pagar) || 0;
    const abono = Number(record.abono) || 0;
    totalAPagar += toPagar;
    totalAbonado += abono;
    console.log(`Registro: TOTAL_A_PAGAR=${toPagar}, ABONO=${abono}, Archivo=${record._file}, Hoja=${record._sheet}`);
  });
  
  const totalDebt = totalAPagar - totalAbonado;
  console.log(`DEUDA TOTAL: ${totalAPagar} - ${totalAbonado} = ${totalDebt}`);

  const trimestres = Object.keys(trimestreMap).length;

  return {
    student: studentRecords[0],
    payments: studentRecords,
    totalDebt: totalDebt >= 0 ? totalDebt : 0,
    trimestres
  };
}

function getExcelFiles(directory) {
  return fs.readdirSync(directory).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
}

function getSheetNames(directory, fileName) {
  const filePath = path.join(directory, fileName);
  if (!fs.existsSync(filePath)) return [];
  const workbook = XLSX.readFile(filePath);
  return workbook.SheetNames;
}

function searchByMaestria(directory, maestria) {
  const allRecords = readExcelFilesCached(directory);
  const maestriaRecords = allRecords.filter(r => r._sheet === maestria);
  
  if (maestriaRecords.length === 0) return null;
  
  // Agrupar por estudiante
  const studentMap = {};
  maestriaRecords.forEach(record => {
    const cedula = record.cedula;
    if (!studentMap[cedula]) {
      studentMap[cedula] = {
        student: record,
        payments: [],
        totalDebt: 0
      };
    }
    studentMap[cedula].payments.push(record);
  });
  
  // Calcular deuda: solo la última resta de cada estudiante en esta maestría
  Object.keys(studentMap).forEach(cedula => {
    const payments = studentMap[cedula].payments;
    const lastPayment = payments[payments.length - 1];
    studentMap[cedula].totalDebt = Number(lastPayment.resta) || 0;
  });
  
  return Object.values(studentMap);
}

function getLastDebtInSheet(directory, fileName, sheetName, cedula) {
  const filePath = path.join(directory, fileName);
  if (!fs.existsSync(filePath)) return 0;
  
  const workbook = XLSX.readFile(filePath);
  if (!workbook.Sheets[sheetName]) return 0;
  
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Buscar última fila del estudiante (desde fila 2 en adelante)
  let lastResta = 0;
  for (let i = rawData.length - 1; i >= 2; i--) {
    const row = rawData[i];
    if (String(row[3]) === String(cedula)) {
      lastResta = Number(row[11]) || 0; // Columna 11 = Resta
      break;
    }
  }
  
  return lastResta;
}

function getLastFileAndSheet(directory, cedula) {
  const allRecords = readExcelFilesCached(directory);
  const studentRecords = allRecords.filter(r => String(r.cedula) === String(cedula));
  
  if (studentRecords.length === 0) return null;
  
  const lastRecord = studentRecords[studentRecords.length - 1];
  return {
    file: lastRecord._file,
    sheet: lastRecord._sheet
  };
}

module.exports = {
  readExcelFiles,
  searchStudent,
  getExcelFiles,
  getSheetNames,
  searchByMaestria,
  getLastDebtInSheet,
  getLastFileAndSheet,
  invalidateCache
};
