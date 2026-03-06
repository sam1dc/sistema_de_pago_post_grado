// Módulo de conversión de divisas USD → Bs

function showToast(message, type = 'is-info') {
  if (window.bulmaToast) {
    window.bulmaToast.toast({
      message,
      type,
      dismissible: false,
      pauseOnHover: true,
      duration: 3000,
      position: 'top-center',
      closeOnClick: true,
      opacity: 1,
      single: false
    });
  }
}

export function initCurrencyConverter() {
  loadSavedRate();
  setupEventListeners();
}

function loadSavedRate() {
  const savedTasa = localStorage.getItem('tasaBCV');
  const savedTasaDate = localStorage.getItem('tasaBCVDate');
  const tasaBCVInput = document.getElementById('tasaBCV');
  const bcvHelp = document.getElementById('bcvDateHelp');
  
  if (savedTasa && tasaBCVInput) {
    tasaBCVInput.value = savedTasa;
    if (savedTasaDate && bcvHelp) {
      const date = new Date(savedTasaDate);
      bcvHelp.textContent = `Última actualización: ${date.toLocaleString('es-VE')}`;
      bcvHelp.className = 'help is-info';
    }
  }
}

function setupEventListeners() {
  const fetchBCVBtn = document.getElementById('fetchBCVBtn');
  const saveBCVBtn = document.getElementById('saveBCVBtn');
  const tasaBCVInput = document.getElementById('tasaBCV');

  if (fetchBCVBtn) {
    fetchBCVBtn.addEventListener('click', fetchBCVRate);
  }

  if (saveBCVBtn) {
    saveBCVBtn.addEventListener('click', saveBCVRate);
  }
}

function saveBCVRate() {
  const tasaBCVInput = document.getElementById('tasaBCV');
  const bcvHelp = document.getElementById('bcvDateHelp');
  
  const tasa = parseFloat(tasaBCVInput.value);
  
  if (!tasa || tasa <= 0) {
    showToast('Ingresa una tasa válida', 'is-danger');
    return;
  }
  
  localStorage.setItem('tasaBCV', tasa.toFixed(2));
  localStorage.setItem('tasaBCVDate', new Date().toISOString());
  
  if (bcvHelp) {
    const fecha = new Date();
    bcvHelp.textContent = `Guardado: ${fecha.toLocaleString('es-VE')}`;
    bcvHelp.className = 'help is-success';
  }
  
  showToast('Tasa guardada correctamente', 'is-success');
}

async function fetchBCVRate() {
  const fetchBCVBtn = document.getElementById('fetchBCVBtn');
  const tasaBCVInput = document.getElementById('tasaBCV');
  const bcvHelp = document.getElementById('bcvDateHelp');
  
  fetchBCVBtn.classList.add('is-loading');
  
  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    const data = await response.json();
    
    if (data && data.promedio) {
      const tasa = data.promedio;
      tasaBCVInput.value = tasa.toFixed(2);
      
      if (bcvHelp) {
        const fecha = new Date(data.fechaActualizacion);
        bcvHelp.textContent = `Obtenido del BCV: ${fecha.toLocaleString('es-VE')}`;
        bcvHelp.className = 'help is-info';
      }
      
      showToast('Tasa obtenida. Presiona Guardar para aplicar', 'is-success');
    }
  } catch (error) {
    if (bcvHelp) {
      bcvHelp.textContent = 'Error al obtener la tasa';
      bcvHelp.className = 'help is-danger';
    }
    showToast('Error al obtener la tasa del BCV', 'is-danger');
  } finally {
    fetchBCVBtn.classList.remove('is-loading');
  }
}
