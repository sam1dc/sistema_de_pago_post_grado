const Tesseract = require('tesseract.js');

async function testOCR() {
  console.log('Procesando imagen...');
  
  const { data: { text } } = await Tesseract.recognize(
    './ejemplo de 1 pago.jpeg',
    'spa'
  );
  
  console.log('\n=== TEXTO EXTRAÍDO ===');
  console.log(text);
  console.log('\n=== FIN ===');
}

testOCR().catch(console.error);
