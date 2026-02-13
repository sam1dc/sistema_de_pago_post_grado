# Sistema de Consulta de Pagos de Alumnos

Aplicación de escritorio con Electron para consultar y gestionar pagos de alumnos desde archivos Excel.

## Características

- Consulta de pagos por cédula de alumno
- Visualización de deuda total y semestres cursados
- Agregar nuevos pagos
- Autocompletado de datos de estudiantes existentes
- Creación de nuevos archivos Excel por semestre
- Historial completo de pagos

## Estructura del Proyecto

```
student-payments-app/
├── src/
│   ├── main/                    # Proceso principal de Electron
│   │   ├── index.js            # Entry point
│   │   ├── preload.js          # Preload script
│   │   └── modules/            # Módulos del backend
│   │       ├── excelReader.js  # Lectura de archivos Excel
│   │       └── excelWriter.js  # Escritura de archivos Excel
│   └── renderer/               # Interfaz de usuario
│       └── index.html          # UI principal
├── datos_prueba/               # Datos de ejemplo
├── build/                      # Recursos para build
├── dist/                       # Ejecutables generados
├── generate-test-data.js       # Script para generar datos de prueba
└── package.json
```

## Instalación

```bash
npm install
```

## Uso

### Ejecutar la aplicación

```bash
npm start
```

### Generar datos de prueba

```bash
node generate-test-data.js
```

Esto creará la carpeta `datos_prueba/` con 3 archivos Excel de ejemplo.

### Cédulas de prueba

- **12345678** - Juan Pérez (3 semestres, debe $1100)
- **87654321** - María González (3 semestres, debe $3700)
- **11223344** - Carlos Rodríguez (2 semestres, debe $0)
- **55667788** - Ana Martínez (2 semestres, debe $2400)

### Generar ejecutable para Windows

```bash
npm run build:win
```

El instalador se generará en `dist/Sistema de Pagos Setup X.X.X.exe`

## Flujo de Trabajo

### Consultar Pagos
1. Seleccionar directorio con archivos Excel
2. Ingresar cédula del alumno
3. Ver historial de pagos y deuda total

### Agregar Pago
1. Seleccionar directorio con archivos Excel
2. Ingresar cédula (autocompleta datos si existe)
3. Completar información del pago
4. Seleccionar archivo Excel o crear uno nuevo
5. Guardar

## Estructura de Datos en Excel

Los archivos Excel deben contener las siguientes columnas:

- `cedula` - Cédula del alumno
- `nombre` - Nombre del alumno
- `apellido` - Apellido del alumno
- `fecha` - Fecha del pago
- `nro_referencia_del_pago` - Número de referencia
- `pago` - Monto pagado
- `cuanto_debe` - Saldo pendiente
- `total_a_pagar` - Total pendiente del semestre
- `semestre` - Semestre (ej: 2026-1)
- `carrera` - Carrera del alumno

## Tecnologías

- Electron 28
- Node.js
- XLSX (lectura/escritura de Excel)
- HTML/CSS/JavaScript vanilla
