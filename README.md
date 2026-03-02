# Sistema de Consulta de Pagos de Alumnos

Aplicación de escritorio con Electron para consultar y gestionar pagos de alumnos desde archivos Excel.

## Características

- Consulta de pagos por cédula de alumno
- Visualización de deuda total y semestres cursados
- Agregar nuevos pagos
- **OCR de capturas de pago móvil** - Extrae automáticamente monto, referencia y fecha
- **Conversión automática Bs → USD** - Usa tasa del BCV actualizable
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
│       ├── modules/            # Módulos JavaScript
│       │   ├── search.js       # Lógica de búsqueda
│       │   ├── addPayment.js   # Lógica de agregar pago
│       │   ├── utils.js        # Utilidades
│       │   ├── currencyConverter.js # Conversor Bs → USD
│       │   └── paymentOCR.js   # OCR de capturas de pago
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
- **Tesseract.js** - OCR para extraer datos de imágenes
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
3. Ir a **Configuración** → Actualizar tasa del BCV (para conversión automática)
4. Configurar el costo por semestre en **Configuración** (opcional)

### Consultar Pagos
1. Ir a **Consultar Pagos**
2. Ingresar cédula del alumno
3. Ver historial de pagos y deuda total

### Agregar Pago con OCR (Nuevo)
1. Ir a **Agregar Pago**
2. **Subir captura de pago móvil** (BDV, Banesco, Mercantil, Bancamiga, etc.)
3. El sistema extrae automáticamente:
   - Monto en Bs
   - Referencia/Operación
   - Fecha del pago
4. Convierte automáticamente Bs → USD usando la tasa configurada
5. Autocompleta los campos del formulario
6. Ingresar cédula (autocompleta datos si existe)
7. Seleccionar archivo Excel o crear uno nuevo
8. Guardar

### Agregar Pago Manual
1. Ir a **Agregar Pago**
2. Ingresar cédula (autocompleta datos si existe)
3. Completar información del pago manualmente
4. El "Total a Pagar" se autocompleta con:
   - Deuda pendiente del estudiante, o
   - Costo por semestre configurado
5. Seleccionar archivo Excel o crear uno nuevo
6. Guardar

### Configuración
1. Ir a **Configuración**
2. **Conversor de Divisas:**
   - Presionar "Actualizar" para obtener tasa del BCV automáticamente
   - O ingresar tasa manualmente
   - Probar conversión USD → Bs
3. Cambiar directorio de archivos Excel
4. Configurar costo estándar por semestre
5. Ver lista de archivos Excel encontrados

## OCR de Capturas de Pago

### Bancos Soportados
- Banco de Venezuela (BDV)
- Banesco
- Mercantil
- Provincial
- Bancamiga
- Bancaribe
- Otros bancos venezolanos con formato similar

### Formatos Detectados
- **Monto:** `10.000,00 Bs` o `Bs 10.000,00`
- **Referencia:** 4-12 dígitos
- **Fecha:** DD/MM/YYYY o DD-MM-YYYY

### Cómo Funciona
1. La imagen se preprocesa (escala 2x + alto contraste)
2. Tesseract.js extrae el texto en español
3. Patrones regex buscan monto, referencia y fecha
4. Convierte Bs → USD usando tasa guardada
5. Autocompleta campos del formulario

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
- **modules/**: Lógica separada por funcionalidad
  - `currencyConverter.js` - Conversión Bs → USD con API del BCV
  - `paymentOCR.js` - Extracción de datos de imágenes
  - `search.js` - Búsqueda de estudiantes
  - `addPayment.js` - Agregar pagos
  - `utils.js` - Utilidades compartidas
- **components-loader.js**: Carga dinámicamente los componentes
- **app.js**: Lógica centralizada de la aplicación
- **styles.css**: Estilos globales y responsive

### Agregar un Nuevo Módulo

1. Crear `components/nuevo-modulo.html`
2. Agregar entrada en el sidebar de `index.html`
3. Agregar carga en `components-loader.js`
4. Crear `modules/nuevo-modulo.js` con la lógica
5. Importar y usar en `app.js`

## Características Responsive

- **Desktop**: Sidebar siempre visible
- **Mobile/Tablet**: Menú hamburguesa con sidebar deslizable
- Breakpoint: 768px

## API Externa

### Tasa del BCV
- **API:** https://ve.dolarapi.com/v1/dolares/oficial
- **Gratuita:** Sin autenticación
- **Datos:** Tasa oficial del BCV actualizada
- **Caché:** Se guarda en localStorage para reutilizar

## Desarrollo

### Estructura de Archivos
- Mantén los componentes HTML pequeños y enfocados
- Usa clases de Bulma para estilos consistentes
- Iconos con Material Design Icons (clase `mdi`)
- Guarda configuraciones en `localStorage`
- Modulariza la lógica en archivos separados

### Convenciones
- IDs descriptivos para elementos interactivos
- Notificaciones con clase `notification` de Bulma
- Validaciones antes de operaciones con archivos
- Mensajes de error claros para el usuario
- Console.log para debug en desarrollo

## Notas Técnicas

### OCR
- Primera ejecución descarga `spa.traineddata` (~4-5 MB)
- Se cachea en el navegador para usos posteriores
- Preprocesamiento mejora precisión en áreas con fondo

### Conversión de Divisas
- Formato venezolano: punto = miles, coma = decimal
- Ejemplo: `10.000,00` = diez mil bolívares
- Conversión: `Bs / Tasa = USD`
