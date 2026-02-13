const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function readExcelFiles(directory) {
  const files = fs.readdirSync(directory).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
  let allRecords = [];

  for (const file of files) {
    const workbook = XLSX.readFile(path.join(directory, file));
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    allRecords = allRecords.concat(data.map(record => ({ ...record, _file: file })));
  }

  return allRecords;
}

function searchStudent(directory, cedula) {
  const allRecords = readExcelFiles(directory);
  const studentRecords = allRecords.filter(r => String(r.cedula) === String(cedula));
  
  if (studentRecords.length === 0) return null;

  // Agrupar por semestre y obtener el último registro de cada uno
  const semesterMap = {};
  studentRecords.forEach(record => {
    const sem = record.semestre;
    if (!semesterMap[sem]) {
      semesterMap[sem] = [];
    }
    semesterMap[sem].push(record);
  });

  // Calcular deuda total solo de semestres no pagados (cuanto_debe > 0 en el último registro)
  let totalDebt = 0;
  Object.values(semesterMap).forEach(records => {
    const lastRecord = records[records.length - 1];
    totalDebt += Number(lastRecord.cuanto_debe) || 0;
  });

  const semesters = Object.keys(semesterMap).length;

  return {
    student: studentRecords[0],
    payments: studentRecords,
    totalDebt,
    semesters
  };
}

function getExcelFiles(directory) {
  return fs.readdirSync(directory).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));
}

module.exports = {
  readExcelFiles,
  searchStudent,
  getExcelFiles
};
