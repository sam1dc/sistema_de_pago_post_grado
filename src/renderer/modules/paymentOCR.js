// Módulo de OCR para extraer datos de capturas de pago móvil

export function initPaymentOCR() {
  const imageInput = document.getElementById('paymentImageInput');
  const dropZone = document.getElementById('ocrDropZone');
  const removeBtn = document.getElementById('ocrRemoveBtn');
  
  if (imageInput && dropZone) {
    // Click en la zona para abrir selector
    dropZone.addEventListener('click', () => imageInput.click());
    
    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          handleImageUpload(file);
        } else {
          showToast('Solo se permiten archivos de imagen', 'is-danger');
        }
      }
    });
    
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleImageUpload(file);
    });
  }
  
  if (removeBtn) {
    removeBtn.addEventListener('click', resetOCR);
  }
}

function showToast(message, type = 'is-info') {
  if (window.bulmaToast) {
    window.bulmaToast.toast({
      message,
      type,
      dismissible: true,
      pauseOnHover: true,
      duration: 3000,
      position: 'top-center',
      closeOnClick: true,
      opacity: 1,
      single: false
    });
  }
}

function resetOCR() {
  const dropZone = document.getElementById('ocrDropZone');
  const preview = document.getElementById('ocrPreview');
  const imageInput = document.getElementById('paymentImageInput');
  
  if (dropZone) dropZone.style.display = 'block';
  if (preview) preview.style.display = 'none';
  if (imageInput) imageInput.value = '';
}

async function handleImageUpload(file) {
  const dropZone = document.getElementById('ocrDropZone');
  const preview = document.getElementById('ocrPreview');
  const previewImage = document.getElementById('ocrPreviewImage');
  const fileName = document.getElementById('ocrFileName');
  const statusText = document.getElementById('ocrStatusText');
  const progress = document.getElementById('ocrProgress');
  
  // Mostrar preview
  if (dropZone) dropZone.style.display = 'none';
  if (preview) preview.style.display = 'block';
  if (fileName) fileName.textContent = file.name;
  if (statusText) {
    statusText.textContent = 'Procesando con OCR...';
    statusText.style.display = 'block';
  }
  
  // Crear URL para preview
  const reader = new FileReader();
  reader.onload = (e) => {
    if (previewImage) previewImage.src = e.target.result;
  };
  reader.readAsDataURL(file);
  
  showToast('Procesando imagen con OCR...', 'is-info');

  try {
    const processedImage = await preprocessImage(file);
    
    const { data: { text } } = await Tesseract.recognize(processedImage, 'spa', {
      logger: (m) => {
        if (m.status === 'recognizing text' && progress) {
          const percent = Math.round(m.progress * 100);
          progress.value = percent;
        }
      }
    });

    console.log('Texto extraído:', text);

    const extractedData = extractPaymentData(text);
    console.log('Datos extraídos:', extractedData);
    
    // Cambiar estado a completado
    if (statusText) {
      statusText.textContent = '✓ Procesado';
      statusText.classList.remove('is-info');
      statusText.classList.add('has-text-success');
    }
    
    if (extractedData.monto || extractedData.referencia || extractedData.fecha) {
      applyExtractedData(extractedData);
      showToast('✓ Datos extraídos correctamente', 'is-success');
    } else {
      showToast('No se detectaron datos. Ingresa manualmente.', 'is-warning');
    }
  } catch (error) {
    console.error('OCR Error:', error);
    showToast('Error al procesar la imagen', 'is-danger');
    resetOCR();
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

    // Agregar info en observación
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
