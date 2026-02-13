# Generar Ejecutable

## Para Windows:

```bash
npm run build:win
```

El ejecutable se generará en la carpeta `dist/`

## Archivos generados:

- **Instalador**: `dist/Sistema de Pagos Setup X.X.X.exe` - Para instalar en otras computadoras
- **Portable**: `dist/win-unpacked/` - Versión portable sin instalación

## Nota:

Si quieres un ícono personalizado, coloca un archivo `icon.ico` en la carpeta `build/`
De lo contrario, usará el ícono por defecto de Electron.

## Distribución:

Comparte el archivo `Sistema de Pagos Setup X.X.X.exe` con tus clientes.
Ellos solo necesitan ejecutarlo e instalar la aplicación.
