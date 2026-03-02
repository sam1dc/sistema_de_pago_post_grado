// Módulo de OCR para extraer datos de capturas de pago móvil

export function initPaymentOCR() {
  const imageInput = document.getElementById('paymentImageInput');
  
  if (imageInput) {
    imageInput.addEventListener('change', handleImageUpload);
  }
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = document.getElementById('paymentImageName');
  const progress = document.getElementById('ocrProgress');
  const result = document.getElementById('ocrResult');
  
  if (fileName) fileName.textContent = file.name;
  if (progress) progress.style.display = 'block';
  if (result) result.innerHTML = '';

  try {
    // Preprocesar imagen para mejorar OCR
    const processedImage = await preprocessImage(file);
    
    const { data: { text } } = await Tesseract.recognize(processedImage, 'spa', {
      logger: (m) => {
        if (m.status === 'recognizing text' && progress) {
          const percent = Math.round(m.progress * 100);
          const progressBar = progress.querySelector('progress');
          if (progressBar) progressBar.value = percent;
        }
      }
    });

    console.log('Texto extraído:', text);

    const extractedData = extractPaymentData(text);
    
    console.log('Datos extraídos:', extractedData);
    
    if (progress) progress.style.display = 'none';
    
    if (extractedData.monto || extractedData.referencia || extractedData.fecha) {
      displayExtractedData(extractedData);
      applyExtractedData(extractedData);
    } else {
      if (result) {
        result.innerHTML = `<div class="notification is-warning"><button class="delete"></button>No se pudieron extraer datos automáticamente. Ingresa los datos manualmente.</div>`;
      }
    }
  } catch (error) {
    console.error('OCR Error:', error);
    if (progress) progress.style.display = 'none';
    if (result) {
      result.innerHTML = '<div class="notification is-danger"><button class="delete"></button>Error al procesar la imagen.</div>';
    }
  }
}

async function preprocessImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Aumentar resolución 2x
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Obtener datos de imagen
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convertir a blanco y negro con alto contraste
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const bw = avg > 128 ? 255 : 0;
          data[i] = bw;
          data[i + 1] = bw;
          data[i + 2] = bw;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL());
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function extractPaymentData(text) {
  const data = {
    monto: null,
    referencia: null,
    fecha: null
  };

  // Limpiar texto y normalizar espacios
  const cleanText = text.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();
  console.log('Texto limpio:', cleanText);

  // Extraer monto - Patrones específicos para Pago Móvil BDV
  const montoPatterns = [
    // Formato: 10.000,00 Bs (con punto de miles y coma decimal)
    /([\d]{1,3}(?:\.\d{3})*,\d{2})\s*Bs/i,
    // Formato: 10000,00 Bs (sin separador de miles)
    /([\d]+,\d{2})\s*Bs/i,
    // Formato: 10.000.00 Bs (con puntos)
    /([\d]{1,3}(?:\.\d{3})+)\s*Bs/i,
    // Bs seguido de número
    /Bs\.?\s*S?\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i,
    // Monto: o Total: con número y Bs
    /(?:monto|total)\s*:?\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*Bs/i,
    // Solo número grande con formato de moneda
    /\b([\d]{1,3}(?:\.\d{3})+,\d{2})\b/,
    /\b([\d]+,\d{2})\b/
  ];

  for (const pattern of montoPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      let montoStr = match[1];
      
      console.log('Match encontrado:', montoStr, 'con patrón:', pattern.source);
      
      // Normalizar formato venezolano: punto = miles, coma = decimal
      // Ejemplo: 10.000,00 → 10000.00
      if (montoStr.includes('.') && montoStr.includes(',')) {
        // Formato: 10.000,00
        montoStr = montoStr.replace(/\./g, '').replace(',', '.');
      }
      else if (montoStr.includes(',')) {
        // Formato: 10000,00
        montoStr = montoStr.replace(',', '.');
      }
      else if (montoStr.includes('.')) {
        // Verificar si es separador de miles o decimal
        const parts = montoStr.split('.');
        if (parts.length > 2 || (parts.length === 2 && parts[1].length !== 2)) {
          // Es separador de miles: 10.000 o 10.000.000
          montoStr = montoStr.replace(/\./g, '');
        }
        // Si tiene 2 decimales, dejarlo como está
      }
      
      const monto = parseFloat(montoStr);
      console.log('Monto parseado:', monto);
      
      if (!isNaN(monto) && monto > 0) {
        data.monto = monto;
        console.log('✓ Monto encontrado:', monto);
        break;
      }
    }
  }

  // Extraer referencia/operación
  const refPatterns = [
    /operaci[oó]n\s*:?\s*(\d{8,12})/i,
    /ref(?:erencia)?\.?\s*:?\s*(\d{4,12})/i,
    /\b(\d{10,12})\b/,
    /\b(\d{6,8})\b/
  ];

  for (const pattern of refPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      data.referencia = match[1];
      console.log('✓ Referencia encontrada:', match[1]);
      break;
    }
  }

  // Extraer fecha
  const fechaPatterns = [
    /fecha\s*:?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/
  ];

  for (const pattern of fechaPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      let year = match[3];
      if (year.length === 2) {
        year = '20' + year;
      }
      data.fecha = `${year}-${month}-${day}`;
      console.log('✓ Fecha encontrada:', data.fecha);
      break;
    }
  }

  return data;
}

function displayExtractedData(data) {
  const result = document.getElementById('ocrResult');
  if (!result) return;

  const tasa = parseFloat(localStorage.getItem('tasaBCV')) || 0;
  
  let html = '<div class="notification is-success">';
  html += '<button class="delete"></button>';
  html += '<strong>✓ Datos extraídos de la imagen:</strong>';
  html += '<div class="content mt-3">';
  
  if (data.monto && tasa > 0) {
    const usd = data.monto / tasa;
    html += `<div class="box has-background-white mb-2">`;
    html += `<p class="mb-1"><strong>Monto pagado:</strong></p>`;
    html += `<p class="is-size-5 has-text-weight-bold has-text-info">Bs ${data.monto.toFixed(2)}</p>`;
    html += `<p class="is-size-6 has-text-grey">Tasa: ${tasa.toFixed(2)} → <strong class="has-text-primary">$${usd.toFixed(2)} USD</strong></p>`;
    html += `</div>`;
  } else if (data.monto) {
    html += `<div class="box has-background-white mb-2">`;
    html += `<p><strong>Monto:</strong> Bs ${data.monto.toFixed(2)}</p>`;
    html += `<p class="help is-warning">⚠️ Configura la tasa del BCV en Configuración para convertir a USD</p>`;
    html += `</div>`;
  }
  
  if (data.referencia) {
    html += `<p><strong>Referencia:</strong> ${data.referencia}</p>`;
  }
  
  if (data.fecha) {
    const fecha = new Date(data.fecha);
    html += `<p><strong>Fecha:</strong> ${fecha.toLocaleDateString('es-VE')}</p>`;
  }
  
  html += '</div></div>';
  result.innerHTML = html;
}

function applyExtractedData(data) {
  const tasa = parseFloat(localStorage.getItem('tasaBCV')) || 0;
  
  // Convertir Bs a USD usando la tasa guardada
  if (data.monto && tasa > 0) {
    const usd = data.monto / tasa;
    const abonoInput = document.getElementById('addAbono');
    if (abonoInput) {
      abonoInput.value = usd.toFixed(2);
      abonoInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Agregar info en observación con la diferencia
    const observacionInput = document.getElementById('addObservacion');
    if (observacionInput) {
      let obs = `Pago Bs ${data.monto.toFixed(2)} / Tasa ${tasa.toFixed(2)}`;
      if (data.referencia) {
        obs += ` / REF ${data.referencia}`;
      }
      observacionInput.value = obs;
    }
  }

  // Aplicar fecha
  if (data.fecha) {
    const fechaInput = document.getElementById('addFecha');
    if (fechaInput) {
      fechaInput.value = data.fecha;
    }
  }
}
