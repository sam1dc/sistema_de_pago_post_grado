const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'datos_prueba');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// Función para crear estructura de Excel con título y encabezados
function createExcelWithStructure(data, trimestre, maestria) {
  const titulo = `${maestria} ${trimestre}`;
  const encabezados = ['NOMBRE Y APELLIDO', 'CÉDULA', 'ASIGNATURA', 'U.C', 'COSTO U.C', 'TOTAL A PAGAR', 'FECHA', 'ABONO', 'RESTA', 'OBSERVACIÓN'];
  
  // Crear array de arrays
  const aoa = [
    [titulo], // Fila 0: Título
    encabezados, // Fila 1: Encabezados
    ...data.map(row => [
      row.nombre_completo,
      row.cedula,
      row.asignatura,
      row.uc,
      row.costo_uc,
      row.total_a_pagar,
      row.fecha,
      row.abono,
      row.resta,
      row.observacion
    ])
  ];
  
  return XLSX.utils.aoa_to_sheet(aoa);
}

// Datos de prueba - MAESTRÍA EN INGENIERÍA ELÉCTRICA
const electrica = [
  { nombre_completo: 'JUAN PÉREZ', cedula: '12345678', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '07/01/2026', abono: 8, resta: '', observacion: 'REF 9001 TASA' },
  { nombre_completo: 'JUAN PÉREZ', cedula: '12345678', asignatura: 'INSCRIPCIÓN', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '15/01/2026', abono: 105, resta: '', observacion: 'REF 9002' },
  { nombre_completo: 'MARÍA GONZÁLEZ', cedula: '87654321', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '10/01/2026', abono: 8, resta: '', observacion: 'REF 9003 TASA' },
  { nombre_completo: 'MARÍA GONZÁLEZ', cedula: '87654321', asignatura: '2 ASIGNATURAS', uc: 6, costo_uc: 35, total_a_pagar: 210, fecha: '20/01/2026', abono: 100, resta: 110, observacion: 'REF 9004' }
];

// Datos de prueba - MAESTRÍA EN INGENIERÍA INDUSTRIAL
const industrial = [
  { nombre_completo: 'CARLOS RODRÍGUEZ', cedula: '11223344', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '08/01/2026', abono: 8, resta: '', observacion: 'REF 9005 TASA' },
  { nombre_completo: 'CARLOS RODRÍGUEZ', cedula: '11223344', asignatura: 'INSCRIPCIÓN', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '18/01/2026', abono: 105, resta: '', observacion: 'REF 9006' },
  { nombre_completo: 'ANA MARTÍNEZ', cedula: '55667788', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '12/01/2026', abono: 8, resta: '', observacion: 'REF 9007 TASA' },
  { nombre_completo: 'ANA MARTÍNEZ', cedula: '55667788', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '22/01/2026', abono: 50, resta: 55, observacion: 'REF 9008' }
];

// Datos de prueba - MAESTRÍA EN INGENIERÍA ELECTRÓNICA
const electronica = [
  { nombre_completo: 'LUIS FERNÁNDEZ', cedula: '99887766', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '09/01/2026', abono: 8, resta: '', observacion: 'REF 9009 TASA' },
  { nombre_completo: 'LUIS FERNÁNDEZ', cedula: '99887766', asignatura: '2 ASIGNATURAS', uc: 6, costo_uc: 35, total_a_pagar: 210, fecha: '19/01/2026', abono: 210, resta: '', observacion: 'REF 9010' },
  { nombre_completo: 'SOFÍA RAMÍREZ', cedula: '44556677', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '11/01/2026', abono: 8, resta: '', observacion: 'REF 9011 TASA' },
  { nombre_completo: 'SOFÍA RAMÍREZ', cedula: '44556677', asignatura: 'INSCRIPCIÓN', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '21/01/2026', abono: 70, resta: 35, observacion: 'REF 9012' }
];

// Datos de prueba - MAESTRÍA EN INGENIERÍA METALÚRGICA
const metalurgica = [
  { nombre_completo: 'PEDRO SÁNCHEZ', cedula: '22334455', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '13/01/2026', abono: 8, resta: '', observacion: 'REF 9013 TASA' },
  { nombre_completo: 'PEDRO SÁNCHEZ', cedula: '22334455', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '23/01/2026', abono: 35, resta: 70, observacion: 'REF 9014' },
  { nombre_completo: 'LAURA TORRES', cedula: '66778899', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '14/01/2026', abono: 8, resta: '', observacion: 'REF 9015 TASA' },
  { nombre_completo: 'LAURA TORRES', cedula: '66778899', asignatura: 'INSCRIPCIÓN', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '24/01/2026', abono: 105, resta: '', observacion: 'REF 9016' }
];

// Datos de prueba - MAESTRÍA EN INGENIERÍA MECÁNICA
const mecanica = [
  { nombre_completo: 'DIEGO MORALES', cedula: '33445566', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '15/01/2026', abono: 8, resta: '', observacion: 'REF 9017 TASA' },
  { nombre_completo: 'DIEGO MORALES', cedula: '33445566', asignatura: '2 ASIGNATURAS', uc: 6, costo_uc: 35, total_a_pagar: 210, fecha: '25/01/2026', abono: 150, resta: 60, observacion: 'REF 9018' },
  { nombre_completo: 'VALENTINA CRUZ', cedula: '77889900', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '16/01/2026', abono: 8, resta: '', observacion: 'REF 9019 TASA' },
  { nombre_completo: 'VALENTINA CRUZ', cedula: '77889900', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '26/01/2026', abono: 105, resta: '', observacion: 'REF 9020' }
];

// Crear archivo Excel con múltiples hojas
const wb = XLSX.utils.book_new();

const ws1 = createExcelWithStructure(electrica, '2026-1', 'MAESTRÍA EN ING. ELÉCTRICA');
XLSX.utils.book_append_sheet(wb, ws1, 'MAESTRIA EN ING. ELÉCTRICA ');

const ws2 = createExcelWithStructure(industrial, '2026-1', 'MAESTRÍA EN ING. INDUSTRIAL');
XLSX.utils.book_append_sheet(wb, ws2, 'MAESTRIA EN ING. INDUSTRIAL');

const ws3 = createExcelWithStructure(electronica, '2026-1', 'MAESTRÍA EN ING. ELECTRÓNICA');
XLSX.utils.book_append_sheet(wb, ws3, 'MAESTRIA EN ING. ELECTRÓNICA ');

const ws4 = createExcelWithStructure(metalurgica, '2026-1', 'MAESTRÍA EN ING. METALÚRGICA');
XLSX.utils.book_append_sheet(wb, ws4, 'MAESTRIA EN ING. METALÚRGICA ');

const ws5 = createExcelWithStructure(mecanica, '2026-1', 'MAESTRÍA EN ING. MECÁNICA');
XLSX.utils.book_append_sheet(wb, ws5, 'MAESTRIA EN ING. MECÁNICA ');

XLSX.writeFile(wb, path.join(dataDir, 'CONTROL DE PAGOS DEL TRIMESTRE 2026-1.xlsx'));

console.log('✓ Archivo Excel de prueba creado en:', dataDir);
console.log('\nCédulas de prueba por maestría:\n');
console.log('INGENIERÍA ELÉCTRICA:');
console.log('  - 12345678 (Juan Pérez) - Debe: $0');
console.log('  - 87654321 (María González) - Debe: $110');
console.log('\nINGENIERÍA INDUSTRIAL:');
console.log('  - 11223344 (Carlos Rodríguez) - Debe: $0');
console.log('  - 55667788 (Ana Martínez) - Debe: $55');
console.log('\nINGENIERÍA ELECTRÓNICA:');
console.log('  - 99887766 (Luis Fernández) - Debe: $0');
console.log('  - 44556677 (Sofía Ramírez) - Debe: $35');
console.log('\nINGENIERÍA METALÚRGICA:');
console.log('  - 22334455 (Pedro Sánchez) - Debe: $70');
console.log('  - 66778899 (Laura Torres) - Debe: $0');
console.log('\nINGENIERÍA MECÁNICA:');
console.log('  - 33445566 (Diego Morales) - Debe: $60');
console.log('  - 77889900 (Valentina Cruz) - Debe: $0');
