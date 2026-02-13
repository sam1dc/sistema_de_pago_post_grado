const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'datos_prueba');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// Datos de prueba - Semestre 1
const semestre1 = [
  { cedula: '12345678', nombre: 'Juan', apellido: 'Pérez', fecha: '2025-01-15', nro_referencia_del_pago: 'REF001', pago: 1500, cuanto_debe: 500, total_a_pagar: 500, semestre: '2025-1', carrera: 'Ingeniería' },
  { cedula: '12345678', nombre: 'Juan', apellido: 'Pérez', fecha: '2025-02-20', nro_referencia_del_pago: 'REF002', pago: 500, cuanto_debe: 0, total_a_pagar: 0, semestre: '2025-1', carrera: 'Ingeniería' },
  { cedula: '87654321', nombre: 'María', apellido: 'González', fecha: '2025-01-10', nro_referencia_del_pago: 'REF003', pago: 800, cuanto_debe: 1200, total_a_pagar: 1200, semestre: '2025-1', carrera: 'Medicina' },
  { cedula: '11223344', nombre: 'Carlos', apellido: 'Rodríguez', fecha: '2025-01-20', nro_referencia_del_pago: 'REF004', pago: 1800, cuanto_debe: 0, total_a_pagar: 0, semestre: '2025-1', carrera: 'Derecho' }
];

// Datos de prueba - Semestre 2
const semestre2 = [
  { cedula: '12345678', nombre: 'Juan', apellido: 'Pérez', fecha: '2025-07-10', nro_referencia_del_pago: 'REF005', pago: 1200, cuanto_debe: 800, total_a_pagar: 800, semestre: '2025-2', carrera: 'Ingeniería' },
  { cedula: '87654321', nombre: 'María', apellido: 'González', fecha: '2025-07-15', nro_referencia_del_pago: 'REF006', pago: 1500, cuanto_debe: 500, total_a_pagar: 500, semestre: '2025-2', carrera: 'Medicina' },
  { cedula: '11223344', nombre: 'Carlos', apellido: 'Rodríguez', fecha: '2025-07-12', nro_referencia_del_pago: 'REF007', pago: 1800, cuanto_debe: 0, total_a_pagar: 0, semestre: '2025-2', carrera: 'Derecho' },
  { cedula: '55667788', nombre: 'Ana', apellido: 'Martínez', fecha: '2025-07-18', nro_referencia_del_pago: 'REF008', pago: 700, cuanto_debe: 1500, total_a_pagar: 1500, semestre: '2025-2', carrera: 'Arquitectura' }
];

// Datos de prueba - Semestre 3
const semestre3 = [
  { cedula: '12345678', nombre: 'Juan', apellido: 'Pérez', fecha: '2026-01-05', nro_referencia_del_pago: 'REF009', pago: 1700, cuanto_debe: 300, total_a_pagar: 300, semestre: '2026-1', carrera: 'Ingeniería' },
  { cedula: '87654321', nombre: 'María', apellido: 'González', fecha: '2026-01-08', nro_referencia_del_pago: 'REF010', pago: 0, cuanto_debe: 2000, total_a_pagar: 2000, semestre: '2026-1', carrera: 'Medicina' },
  { cedula: '55667788', nombre: 'Ana', apellido: 'Martínez', fecha: '2026-01-12', nro_referencia_del_pago: 'REF011', pago: 1300, cuanto_debe: 900, total_a_pagar: 900, semestre: '2026-1', carrera: 'Arquitectura' }
];

// Crear archivos Excel
const wb1 = XLSX.utils.book_new();
const ws1 = XLSX.utils.json_to_sheet(semestre1);
XLSX.utils.book_append_sheet(wb1, ws1, 'Pagos');
XLSX.writeFile(wb1, path.join(dataDir, 'pagos_semestre_2025-1.xlsx'));

const wb2 = XLSX.utils.book_new();
const ws2 = XLSX.utils.json_to_sheet(semestre2);
XLSX.utils.book_append_sheet(wb2, ws2, 'Pagos');
XLSX.writeFile(wb2, path.join(dataDir, 'pagos_semestre_2025-2.xlsx'));

const wb3 = XLSX.utils.book_new();
const ws3 = XLSX.utils.json_to_sheet(semestre3);
XLSX.utils.book_append_sheet(wb3, ws3, 'Pagos');
XLSX.writeFile(wb3, path.join(dataDir, 'pagos_semestre_2026-1.xlsx'));

console.log('✓ Archivos Excel de prueba creados en:', dataDir);
console.log('\nCédulas de prueba:');
console.log('- 12345678 (Juan Pérez - 3 semestres)');
console.log('  Semestre 2025-1: Pagado completamente (Debe $0)');
console.log('  Semestre 2025-2: Saldo pendiente $800');
console.log('  Semestre 2026-1: Saldo pendiente $300');
console.log('  Total debe: $1100');
console.log('\n- 87654321 (María González - 3 semestres)');
console.log('  Semestre 2025-1: Saldo pendiente $1200');
console.log('  Semestre 2025-2: Saldo pendiente $500');
console.log('  Semestre 2026-1: Saldo pendiente $2000');
console.log('  Total debe: $3700');
console.log('\n- 11223344 (Carlos Rodríguez - 2 semestres)');
console.log('  Semestre 2025-1: Pagado completamente (Debe $0)');
console.log('  Semestre 2025-2: Pagado completamente (Debe $0)');
console.log('  Total debe: $0');
console.log('\n- 55667788 (Ana Martínez - 2 semestres)');
console.log('  Semestre 2025-2: Saldo pendiente $1500');
console.log('  Semestre 2026-1: Saldo pendiente $900');
console.log('  Total debe: $2400');
