const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function addPayment(directory, fileName, paymentData) {
  const filePath = path.join(directory, fileName);
  let workbook, worksheet, data;

  if (fs.existsSync(filePath)) {
    workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    worksheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(worksheet);
    data.push(paymentData);
  } else {
    workbook = XLSX.utils.book_new();
    data = [paymentData];
  }

  const newWorksheet = XLSX.utils.json_to_sheet(data);
  
  if (fs.existsSync(filePath)) {
    workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;
  } else {
    XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Pagos');
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

module.exports = {
  addPayment,
  createNewExcelFile
};
