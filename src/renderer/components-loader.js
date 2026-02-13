// Cargar componentes HTML
async function loadComponent(componentName, containerId) {
  try {
    const response = await fetch(`components/${componentName}.html`);
    const html = await response.text();
    document.getElementById(containerId).innerHTML = html;
  } catch (error) {
    console.error(`Error loading component ${componentName}:`, error);
  }
}

// Cargar todos los componentes al iniciar
async function loadAllComponents() {
  await Promise.all([
    loadComponent('search', 'search-tab'),
    loadComponent('add-payment', 'add-tab'),
    loadComponent('config', 'config-tab')
  ]);
}

// Exportar para usar en app.js
window.loadAllComponents = loadAllComponents;
