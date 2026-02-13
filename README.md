# Sistema de Consulta de Pagos de Alumnos

Aplicación de escritorio con Electron para consultar y gestionar pagos de alumnos desde archivos Excel.

## Características

- Consulta de pagos por cédula de alumno
- Visualización de deuda total y semestres cursados
- Agregar nuevos pagos
- Autocompletado de datos de estudiantes existentes
- Creación de nuevos archivos Excel por semestre
- Historial completo de pagos
- Configuración de costo por semestre
- Interfaz responsive con diseño moderno (Bulma CSS)
- Arquitectura modular con componentes separados

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
│       ├── index.html          # Estructura principal (70 líneas)
│       ├── styles.css          # Estilos globales
│       ├── app.js              # Lógica de la aplicación
│       ├── components-loader.js # Cargador de componentes
│       ├── components/         # Componentes HTML modulares
│       │   ├── search.html     # Módulo de búsqueda
│       │   ├── add-payment.html # Módulo de agregar pago
│       │   └── config.html     # Módulo de configuración
│       └── assets/             # Recursos
│           ├── logo.png
│           └── logo.ico
├── datos_prueba/               # Datos de ejemplo
├── build/                      # Recursos para build
├── dist/                       # Ejecutables generados
├── generate-test-data.js       # Script para generar datos de prueba
└── package.json
```

## Tecnologías

- **Electron 28** - Framework de aplicación de escritorio
- **Node.js** - Runtime de JavaScript
- **XLSX** - Lectura/escritura de archivos Excel
- **Bulma CSS** - Framework CSS moderno
- **Material Design Icons** - Iconografía
- **Arquitectura modular** - Componentes HTML separados

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

### Primera Vez
1. Al abrir la app, aparece un modal para seleccionar el directorio de archivos Excel
2. El directorio se guarda automáticamente en localStorage
3. Configurar el costo por semestre en **Configuración** (opcional)

### Consultar Pagos
1. Ir a **Consultar Pagos**
2. Ingresar cédula del alumno
3. Ver historial de pagos y deuda total

### Agregar Pago
1. Ir a **Agregar Pago**
2. Ingresar cédula (autocompleta datos si existe)
3. Completar información del pago
4. El "Total a Pagar" se autocompleta con:
   - Deuda pendiente del estudiante, o
   - Costo por semestre configurado
5. Seleccionar archivo Excel o crear uno nuevo
6. Guardar

### Configuración
1. Ir a **Configuración**
2. Cambiar directorio de archivos Excel
3. Configurar costo estándar por semestre
4. Ver lista de archivos Excel encontrados

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

## Arquitectura Modular

La aplicación utiliza una arquitectura de componentes para facilitar el mantenimiento:

- **index.html**: Estructura base y layout
- **components/**: Cada vista es un componente HTML independiente
- **components-loader.js**: Carga dinámicamente los componentes
- **app.js**: Lógica centralizada de la aplicación
- **styles.css**: Estilos globales y responsive

### Agregar un Nuevo Módulo

1. Crear `components/nuevo-modulo.html`
2. Agregar entrada en el sidebar de `index.html`
3. Agregar carga en `components-loader.js`
4. Implementar lógica en `app.js`

## Características Responsive

- **Desktop**: Sidebar siempre visible
- **Mobile/Tablet**: Menú hamburguesa con sidebar deslizable
- Breakpoint: 768px

## Desarrollo

### Estructura de Archivos
- Mantén los componentes HTML pequeños y enfocados
- Usa clases de Bulma para estilos consistentes
- Iconos con Material Design Icons (clase `mdi`)
- Guarda configuraciones en `localStorage`

### Convenciones
- IDs descriptivos para elementos interactivos
- Notificaciones con clase `notification` de Bulma
- Validaciones antes de operaciones con archivos
- Mensajes de error claros para el usuario
