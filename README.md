# Sistema de Consulta de Pagos de Alumnos

Aplicación de escritorio con Electron para consultar pagos de alumnos desde archivos Excel.

## Características

- Selección de directorio con archivos Excel
- Búsqueda por cédula de alumno
- Visualización de deuda total actual
- Conteo de semestres con pagos
- Historial completo de pagos

## Instalación

```bash
npm install
```

## Ejecutar la aplicación

```bash
npm start
```

## Generar datos de prueba

```bash
node generate-test-data.js
```

Esto creará una carpeta `datos_prueba` con 3 archivos Excel de ejemplo.

## Cédulas de prueba

- **12345678** - Juan Pérez (3 semestres, debe $1600)
- **87654321** - María González (3 semestres, debe $3700)
- **11223344** - Carlos Rodríguez (2 semestres, debe $0)
- **55667788** - Ana Martínez (2 semestres, debe $2400)

## Uso

1. Ejecutar `npm start`
2. Hacer clic en "Seleccionar Directorio de Archivos Excel"
3. Seleccionar la carpeta `datos_prueba` (o cualquier carpeta con archivos Excel)
4. Ingresar una cédula
5. Hacer clic en "Buscar"

## Estructura de datos en Excel

Los archivos Excel deben contener las siguientes columnas:
- cedula
- nombre
- apellido
- fecha
- nro_referencia_del_pago
- cuanto_debe
- total_a_pagar
- semestre
- carrera
