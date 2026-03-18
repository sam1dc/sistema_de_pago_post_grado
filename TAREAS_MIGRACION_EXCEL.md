# Tareas para Migración al Nuevo Formato de Excel

## Análisis del Problema

El formato actual de los archivos Excel ha cambiado significativamente. El código actual espera una estructura simple, pero los archivos reales tienen una estructura más compleja:

### Estructura Actual (Real)
```
Fila 0: [empty, empty, "MAESTRÍA EN ING. ELÉCTRICA 2026-1"]
Fila 1: [empty] (fila vacía)
Fila 2: ["N°", "CODIGO", "NOMBRE Y APELLIDO", "CÉDULA", "CODIGO2", "ASIGNATURA", "U.C", "COSTO U.C", "TOTAL A PAGAR", "FECHA", "ABONO", "RESTA", "OBSERVACIÓN"]
Fila 3+: [empty, empty, "GUSTAVO MARCHAN", 20645646, empty, "PREINSCRIPCIÓN", empty, empty, 8, 46029, 8, empty, "REF: 9069 TASA: 311,88"]
```

### Estructura Esperada por el Código
```
Fila 0: ["MAESTRÍA EN ING. ELÉCTRICA 2026-1"]
Fila 1: ["NOMBRE Y APELLIDO", "CÉDULA", "ASIGNATURA", "U.C", "COSTO U.C", "TOTAL A PAGAR", "FECHA", "ABONO", "RESTA", "OBSERVACIÓN"]
Fila 2+: ["GUSTAVO MARCHAN", 20645646, "PREINSCRIPCIÓN", empty, empty, 8, 46029, 8, empty, "REF: 9069"]
```

## Diferencias Críticas Identificadas

1. **Columnas adicionales**: Los archivos reales tienen columnas "N°", "CODIGO" y "CODIGO2" que no están en el código
2. **Posición de datos**: Los datos están en las columnas 2, 3, 5, 6, 7, 8, 9, 10, 11, 12 (índices)
3. **Mapeo incorrecto**: El código actual mapea incorrectamente las columnas
4. **Nombres de hojas**: Hay más maestrías y especialidades de las esperadas
## Tareas Requeridas

### 1. Actualizar `excelReader.js`

#### 1.1 Corregir mapeo de columnas en `readExcelFiles()`
```javascript
// ANTES (incorrecto):
const record = {
  nombre_completo: row[0],  // ❌ Debería ser row[2]
  cedula: row[1],           // ❌ Debería ser row[3]
  asignatura: row[2],       // ❌ Debería ser row[5]
  uc: row[3],              // ❌ Debería ser row[6]
  costo_uc: row[4],        // ❌ Debería ser row[7]
  total_a_pagar: row[5],   // ❌ Debería ser row[8]
  fecha: row[6],           // ❌ Debería ser row[9]
  abono: row[7],           // ❌ Debería ser row[10]
  resta: row[8],           // ❌ Debería ser row[11]
  observacion: row[9],     // ❌ Debería ser row[12]
};

// DESPUÉS (correcto):
const record = {
  nombre_completo: row[2],  // NOMBRE Y APELLIDO
  cedula: row[3],           // CÉDULA
  asignatura: row[5],       // ASIGNATURA
  uc: row[6],              // U.C
  costo_uc: row[7],        // COSTO U.C
  total_a_pagar: row[8],   // TOTAL A PAGAR
  fecha: row[9],           // FECHA
  abono: row[10],          // ABONO
  resta: row[11],          // RESTA
  observacion: row[12],    // OBSERVACIÓN
  // Ignoramos N°, CODIGO, CODIGO2 (row[0], row[1], row[4])
};
```

#### 1.2 Actualizar función `getLastDebtInSheet()`
```javascript
// Cambiar índice de columna RESTA de 8 a 11
lastResta = Number(row[11]) || 0; // Columna 11 = Resta
```

### 2. Actualizar `excelWriter.js`

#### 2.1 Corregir estructura de encabezados en `addPayment()`
```javascript
// ANTES (incorrecto):
['NOMBRE Y APELLIDO', 'CÉDULA', 'ASIGNATURA', 'U.C', 'COSTO U.C', 'TOTAL A PAGAR', 'FECHA', 'ABONO', 'RESTA', 'OBSERVACIÓN']

// DESPUÉS (correcto):
['N°', 'CODIGO', 'NOMBRE Y APELLIDO', 'CÉDULA', 'CODIGO2', 'ASIGNATURA', 'U.C', 'COSTO U.C', 'TOTAL A PAGAR', 'FECHA', 'ABONO', 'RESTA', 'OBSERVACIÓN']
```

#### 2.2 Corregir estructura de datos en `addPayment()`
```javascript
// ANTES (incorrecto):
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

// DESPUÉS (correcto):
const newRow = [
  '',                             // N° (vacío)
  '',                             // CODIGO (vacío)
  paymentData.nombre_completo,    // NOMBRE Y APELLIDO
  paymentData.cedula,             // CÉDULA
  '',                             // CODIGO2 (vacío)
  paymentData.asignatura,         // ASIGNATURA
  paymentData.uc,                 // U.C
  paymentData.costo_uc,          // COSTO U.C
  paymentData.total_a_pagar,     // TOTAL A PAGAR
  paymentData.fecha,              // FECHA
  paymentData.abono,              // ABONO
  paymentData.resta,              // RESTA
  paymentData.observacion         // OBSERVACIÓN
];
```

#### 2.3 Actualizar lista de maestrías y mejorar formato
```javascript
// Lista completa de maestrías y especialidades:
const maestrias = [
  'MAESTRÍA EN ING. ELECTRÓNICA',
  'MAESTRÍA EN ING. METALÚRGICA',
  'MAESTRÍA EN ING. ELÉCTRICA', 
  'MAESTRÍA EN ING. INDUSTRIAL',
  'MAESTRÍA EN ING. MATEMÁTICA APLICADA',
  'MAESTRÍA EN ING. MECÁNICA',
  'ESP. EN CORROSIÓN',
  'ESP. EN GERENCIA DE MANTENIMIENTO',
  'ESP. PREVENCIÓN Y CONTROL DE RIESGOS',
  'ESP. INSTRUMENTACIÓN',
  'ESP. EN TELECOMUNICACIONES',
  'ESP. EN ELECTROMEDICINA',
  'ESP. SOLDADURA'
];

// Crear todas las hojas automáticamente con formato mejorado
maestrias.forEach(maestria => {
  const titulo = `${maestria} ${trimestre}`;
  const rawData = [
    // Fila 0: Título centrado y destacado
    ['', '', titulo, '', '', '', '', '', '', '', '', '', ''],
    // Fila 1: Vacía para separación
    [''],
    // Fila 2: Encabezados con formato consistente
    ['N°', 'CÓDIGO', 'NOMBRE Y APELLIDO', 'CÉDULA', 'CÓDIGO 2', 'ASIGNATURA', 'U.C', 'COSTO U.C', 'TOTAL A PAGAR', 'FECHA', 'ABONO', 'RESTA', 'OBSERVACIÓN']
  ];
  
  // Si esta es la maestría seleccionada, agregar el pago
  if (maestria === targetMaestria) {
    rawData.push([
      '', // N° (se puede numerar automáticamente después)
      '', // CÓDIGO
      paymentData.nombre_completo,
      paymentData.cedula,
      '', // CÓDIGO 2
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
  
  // Aplicar formato mejorado
  aplicarFormatoMejorado(worksheet, maestria);
  
  XLSX.utils.book_append_sheet(workbook, worksheet, maestria);
});
```

#### 2.4 Agregar función de formato mejorado
```javascript
function aplicarFormatoMejorado(worksheet, maestria) {
  // Configurar anchos de columna
  const colWidths = [
    { wch: 5 },   // N°
    { wch: 10 },  // CÓDIGO
    { wch: 25 },  // NOMBRE Y APELLIDO
    { wch: 12 },  // CÉDULA
    { wch: 10 },  // CÓDIGO 2
    { wch: 20 },  // ASIGNATURA
    { wch: 6 },   // U.C
    { wch: 12 },  // COSTO U.C
    { wch: 15 },  // TOTAL A PAGAR
    { wch: 12 },  // FECHA
    { wch: 12 },  // ABONO
    { wch: 12 },  // RESTA
    { wch: 30 }   // OBSERVACIÓN
  ];
  worksheet['!cols'] = colWidths;
  
  // Configurar altura de filas
  worksheet['!rows'] = [
    { hpt: 25 }, // Fila título
    { hpt: 15 }, // Fila vacía
    { hpt: 20 }  // Fila encabezados
  ];
  
  // Merge cells para el título (C1:F1)
  if (!worksheet['!merges']) worksheet['!merges'] = [];
  worksheet['!merges'].push({
    s: { r: 0, c: 2 }, // Start: C1
    e: { r: 0, c: 5 }  // End: F1
  });
  
  // Aplicar estilos (si la librería XLSX lo soporta)
  // Título centrado y en negrita
  if (worksheet['C1']) {
    worksheet['C1'].s = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }
  
  // Encabezados en negrita y centrados
  const headers = ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3', 'M3'];
  headers.forEach(cell => {
    if (worksheet[cell]) {
      worksheet[cell].s = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'E8F4FD' } } // Fondo azul claro
      };
    }
  });
}

### 6. Mejoras de Formato y Organización

#### 6.1 Características del formato mejorado
- **Títulos centrados**: Cada hoja tendrá el título de la maestría/especialidad centrado
- **Columnas con ancho optimizado**: Cada columna tendrá el ancho apropiado para su contenido
- **Encabezados destacados**: Fondo de color y texto en negrita para los encabezados
- **Separación visual**: Fila vacía entre título y encabezados
- **Nombres completos**: Especialidades con nombres completos (sin abreviaciones)
- **Todas las hojas creadas**: Al crear un archivo nuevo, se generan automáticamente todas las maestrías y especialidades

#### 6.2 Beneficios organizacionales
- **Navegación mejorada**: Todas las especialidades disponibles desde el inicio
- **Consistencia**: Formato uniforme en todos los archivos
- **Legibilidad**: Mejor presentación visual de los datos
- **Profesionalismo**: Apariencia más formal y organizada
- **Eficiencia**: No necesidad de crear hojas manualmente

#### 6.3 Estructura de hojas mejorada
```
MAESTRÍA EN ING. ELÉCTRICA 2026-1    (centrado, negrita, merged)
                                     (fila vacía)
N° | CÓDIGO | NOMBRE Y APELLIDO | CÉDULA | ... (encabezados con fondo de color)
---|--------|-------------------|--------|---
   |        | GUSTAVO MARCHAN   | 20645646| ... (datos)
```

#### 6.4 Lista completa de especialidades a crear automáticamente
```javascript
const especialidades = [
  // Maestrías
  'MAESTRÍA EN ING. ELECTRÓNICA',
  'MAESTRÍA EN ING. METALÚRGICA', 
  'MAESTRÍA EN ING. ELÉCTRICA',
  'MAESTRÍA EN ING. INDUSTRIAL',
  'MAESTRÍA EN ING. MATEMÁTICA APLICADA',
  'MAESTRÍA EN ING. MECÁNICA',
  
  // Especialidades
  'ESP. EN CORROSIÓN',
  'ESP. EN GERENCIA DE MANTENIMIENTO',
  'ESP. PREVENCIÓN Y CONTROL DE RIESGOS',
  'ESP. INSTRUMENTACIÓN',
  'ESP. EN TELECOMUNICACIONES', 
  'ESP. EN ELECTROMEDICINA',
  'ESP. SOLDADURA'
];
```

### 7. Migración de Datos Existentes (Si Aplica)

Si hay archivos Excel generados por la aplicación anterior:
- Crear script de migración para convertir formato antiguo al nuevo
- Respaldar archivos existentes antes de la migración
- Aplicar el nuevo formato a archivos existentes
