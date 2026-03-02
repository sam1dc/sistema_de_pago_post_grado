// Módulo de conversión de divisas USD → Bs

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
  const montoUSDInput = document.getElementById('montoUSD');
  const tasaBCVInput = document.getElementById('tasaBCV');

  if (fetchBCVBtn) {
    fetchBCVBtn.addEventListener('click', fetchBCVRate);
  }

  if (montoUSDInput) {
    montoUSDInput.addEventListener('input', calculateConversion);
  }
  
  if (tasaBCVInput) {
    tasaBCVInput.addEventListener('input', calculateConversion);
  }
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
      localStorage.setItem('tasaBCV', tasa.toFixed(2));
      localStorage.setItem('tasaBCVDate', data.fechaActualizacion || new Date().toISOString());
      
      if (bcvHelp) {
        const fecha = new Date(data.fechaActualizacion);
        bcvHelp.textContent = `Actualizado: ${fecha.toLocaleString('es-VE')}`;
        bcvHelp.className = 'help is-success';
      }
      
      calculateConversion();
    }
  } catch (error) {
    if (bcvHelp) {
      bcvHelp.textContent = 'Error al obtener la tasa. Ingresa manualmente.';
      bcvHelp.className = 'help is-danger';
    }
  } finally {
    fetchBCVBtn.classList.remove('is-loading');
  }
}

function calculateConversion() {
  const montoUSD = document.getElementById('montoUSD');
  const montoBs = document.getElementById('montoBs');
  const tasaBCV = document.getElementById('tasaBCV');
  
  if (!montoUSD || !montoBs || !tasaBCV) return;
  
  const usd = parseFloat(montoUSD.value) || 0;
  const tasa = parseFloat(tasaBCV.value) || 0;
  
  if (usd > 0 && tasa > 0) {
    const bs = usd * tasa;
    montoBs.value = `Bs ${bs.toFixed(2)}`;
  } else {
    montoBs.value = 'Bs 0.00';
  }
}
