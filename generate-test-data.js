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
  { nombre_completo: 'JUAN PÉREZ', cedula: '12345678', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '07/01/2026', abono: 8, resta: 0, observacion: 'REF 9001 TASA' },
  { nombre_completo: 'JUAN PÉREZ', cedula: '12345678', asignatura: 'INSCRIPCIÓN', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '15/01/2026', abono: 50, resta: 55, observacion: 'REF 9002' },
  { nombre_completo: 'MARÍA GONZÁLEZ', cedula: '87654321', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '10/01/2026', abono: 8, resta: 0, observacion: 'REF 9003 TASA' },
  { nombre_completo: 'MARÍA GONZÁLEZ', cedula: '87654321', asignatura: '2 ASIGNATURAS', uc: 6, costo_uc: 35, total_a_pagar: 210, fecha: '20/01/2026', abono: 100, resta: 110, observacion: 'REF 9004' }
];

// Datos de prueba - MAESTRÍA EN INGENIERÍA INDUSTRIAL
const industrial = [
  { nombre_completo: 'CARLOS RODRÍGUEZ', cedula: '11223344', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '08/01/2026', abono: 8, resta: 0, observacion: 'REF 9005 TASA' },
  { nombre_completo: 'CARLOS RODRÍGUEZ', cedula: '11223344', asignatura: 'INSCRIPCIÓN', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '18/01/2026', abono: 105, resta: 0, observacion: 'REF 9006' },
  { nombre_completo: 'ANA MARTÍNEZ', cedula: '55667788', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '12/01/2026', abono: 8, resta: 0, observacion: 'REF 9007 TASA' },
  { nombre_completo: 'ANA MARTÍNEZ', cedula: '55667788', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '22/01/2026', abono: 50, resta: 55, observacion: 'REF 9008' },
  { nombre_completo: 'JUAN PÉREZ', cedula: '12345678', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '25/01/2026', abono: 30, resta: 75, observacion: 'REF 9009 - Pago en otra maestría' }
];

// Datos de prueba - MAESTRÍA EN INGENIERÍA ELECTRÓNICA
const electronica = [
  { nombre_completo: 'LUIS FERNÁNDEZ', cedula: '99887766', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '09/01/2026', abono: 8, resta: 0, observacion: 'REF 9010 TASA' },
  { nombre_completo: 'LUIS FERNÁNDEZ', cedula: '99887766', asignatura: '2 ASIGNATURAS', uc: 6, costo_uc: 35, total_a_pagar: 210, fecha: '19/01/2026', abono: 210, resta: 0, observacion: 'REF 9011' },
  { nombre_completo: 'SOFÍA RAMÍREZ', cedula: '44556677', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '11/01/2026', abono: 8, resta: 0, observacion: 'REF 9012 TASA' },
  { nombre_completo: 'SOFÍA RAMÍREZ', cedula: '44556677', asignatura: 'INSCRIPCIÓN', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '21/01/2026', abono: 70, resta: 35, observacion: 'REF 9013' }
];

// Datos de prueba - MAESTRÍA EN INGENIERÍA METALÚRGICA
const metalurgica = [
  { nombre_completo: 'PEDRO SÁNCHEZ', cedula: '22334455', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '13/01/2026', abono: 8, resta: 0, observacion: 'REF 9014 TASA' },
  { nombre_completo: 'PEDRO SÁNCHEZ', cedula: '22334455', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '23/01/2026', abono: 35, resta: 70, observacion: 'REF 9015' },
  { nombre_completo: 'LAURA TORRES', cedula: '66778899', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '14/01/2026', abono: 8, resta: 0, observacion: 'REF 9016 TASA' },
  { nombre_completo: 'LAURA TORRES', cedula: '66778899', asignatura: 'INSCRIPCIÓN', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '24/01/2026', abono: 105, resta: 0, observacion: 'REF 9017' }
];

// Datos de prueba - MAESTRÍA EN INGENIERÍA MECÁNICA
const mecanica = [
  { nombre_completo: 'DIEGO MORALES', cedula: '33445566', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '15/01/2026', abono: 8, resta: 0, observacion: 'REF 9018 TASA' },
  { nombre_completo: 'DIEGO MORALES', cedula: '33445566', asignatura: '2 ASIGNATURAS', uc: 6, costo_uc: 35, total_a_pagar: 210, fecha: '25/01/2026', abono: 150, resta: 60, observacion: 'REF 9019' },
  { nombre_completo: 'VALENTINA CRUZ', cedula: '77889900', asignatura: 'PREINSCRIPCIÓN', uc: '', costo_uc: '', total_a_pagar: 8, fecha: '16/01/2026', abono: 8, resta: 0, observacion: 'REF 9020 TASA' },
  { nombre_completo: 'VALENTINA CRUZ', cedula: '77889900', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '26/01/2026', abono: 105, resta: 0, observacion: 'REF 9021' }
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

// Datos para trimestre 2026-2
const electrica2 = [
  { nombre_completo: 'JUAN PÉREZ', cedula: '12345678', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '15/07/2026', abono: 20, resta: 85, observacion: 'REF 9022' },
  { nombre_completo: 'MARÍA GONZÁLEZ', cedula: '87654321', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '20/07/2026', abono: 50, resta: 55, observacion: 'REF 9023' }
];

const industrial2 = [
  { nombre_completo: 'CARLOS RODRÍGUEZ', cedula: '11223344', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '18/07/2026', abono: 105, resta: 0, observacion: 'REF 9024' },
  { nombre_completo: 'ANA MARTÍNEZ', cedula: '55667788', asignatura: '2 ASIGNATURAS', uc: 6, costo_uc: 35, total_a_pagar: 210, fecha: '22/07/2026', abono: 100, resta: 110, observacion: 'REF 9025' }
];

const electronica2 = [
  { nombre_completo: 'LUIS FERNÁNDEZ', cedula: '99887766', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '19/07/2026', abono: 70, resta: 35, observacion: 'REF 9026' },
  { nombre_completo: 'SOFÍA RAMÍREZ', cedula: '44556677', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '21/07/2026', abono: 60, resta: 45, observacion: 'REF 9027' }
];

const metalurgica2 = [
  { nombre_completo: 'PEDRO SÁNCHEZ', cedula: '22334455', asignatura: '2 ASIGNATURAS', uc: 6, costo_uc: 35, total_a_pagar: 210, fecha: '23/07/2026', abono: 210, resta: 0, observacion: 'REF 9028' },
  { nombre_completo: 'LAURA TORRES', cedula: '66778899', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '24/07/2026', abono: 40, resta: 65, observacion: 'REF 9029' }
];

const mecanica2 = [
  { nombre_completo: 'DIEGO MORALES', cedula: '33445566', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '25/07/2026', abono: 105, resta: 0, observacion: 'REF 9030' },
  { nombre_completo: 'VALENTINA CRUZ', cedula: '77889900', asignatura: 'UC', uc: 3, costo_uc: 35, total_a_pagar: 105, fecha: '26/07/2026', abono: 80, resta: 25, observacion: 'REF 9031' }
];

// Crear segundo archivo Excel
const wb2 = XLSX.utils.book_new();

const ws2_1 = createExcelWithStructure(electrica2, '2026-2', 'MAESTRÍA EN ING. ELÉCTRICA');
XLSX.utils.book_append_sheet(wb2, ws2_1, 'MAESTRIA EN ING. ELÉCTRICA ');

const ws2_2 = createExcelWithStructure(industrial2, '2026-2', 'MAESTRÍA EN ING. INDUSTRIAL');
XLSX.utils.book_append_sheet(wb2, ws2_2, 'MAESTRIA EN ING. INDUSTRIAL');

const ws2_3 = createExcelWithStructure(electronica2, '2026-2', 'MAESTRÍA EN ING. ELECTRÓNICA');
XLSX.utils.book_append_sheet(wb2, ws2_3, 'MAESTRIA EN ING. ELECTRÓNICA ');

const ws2_4 = createExcelWithStructure(metalurgica2, '2026-2', 'MAESTRÍA EN ING. METALÚRGICA');
XLSX.utils.book_append_sheet(wb2, ws2_4, 'MAESTRIA EN ING. METALÚRGICA ');

const ws2_5 = createExcelWithStructure(mecanica2, '2026-2', 'MAESTRÍA EN ING. MECÁNICA');
XLSX.utils.book_append_sheet(wb2, ws2_5, 'MAESTRIA EN ING. MECÁNICA ');

XLSX.writeFile(wb2, path.join(dataDir, 'CONTROL DE PAGOS DEL TRIMESTRE 2026-2.xlsx'));

console.log('✓ Archivos Excel de prueba creados en:', dataDir);
console.log('\n=== CÉDULAS DE PRUEBA ===\n');
console.log('📊 JUAN PÉREZ (12345678):');
console.log('   - ING. ELÉCTRICA 2026-1: $55');
console.log('   - ING. INDUSTRIAL 2026-1: $75');
console.log('   - ING. ELÉCTRICA 2026-2: $85');
console.log('   💰 DEUDA TOTAL: $215 (en 3 registros diferentes)\n');
console.log('📊 MARÍA GONZÁLEZ (87654321):');
console.log('   - ING. ELÉCTRICA 2026-1: $110');
console.log('   - ING. ELÉCTRICA 2026-2: $55');
console.log('   💰 DEUDA TOTAL: $165\n');
console.log('📊 ANA MARTÍNEZ (55667788):');
console.log('   - ING. INDUSTRIAL 2026-1: $55');
console.log('   - ING. INDUSTRIAL 2026-2: $110');
console.log('   💰 DEUDA TOTAL: $165\n');
console.log('📊 SOFÍA RAMÍREZ (44556677):');
console.log('   - ING. ELECTRÓNICA 2026-1: $35');
console.log('   - ING. ELECTRÓNICA 2026-2: $45');
console.log('   💰 DEUDA TOTAL: $80\n');
console.log('📊 LAURA TORRES (66778899):');
console.log('   - ING. METALÚRGICA 2026-2: $65');
console.log('   💰 DEUDA TOTAL: $65\n');
console.log('📊 ESTUDIANTES SIN DEUDA:');
console.log('   - CARLOS RODRÍGUEZ (11223344)');
console.log('   - LUIS FERNÁNDEZ (99887766) - Solo en 2026-1');
console.log('   - VALENTINA CRUZ (77889900) - Solo en 2026-1\n');
console.log('💡 Prueba con 12345678 (Juan Pérez) para ver deuda acumulada en múltiples maestrías y trimestres!');

