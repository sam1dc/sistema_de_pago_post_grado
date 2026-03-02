// Módulo de utilidades y funciones auxiliares
export async function loadExcelFiles(selectedDirectory) {
  if (!selectedDirectory) return;
  try {
    const files = await window.electronAPI.getExcelFiles(selectedDirectory);
    const select = document.getElementById('fileSelect');
    if (select) {
      select.innerHTML = '<option value="">Seleccione un archivo</option>';
      files.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        select.appendChild(option);
      });
    }
    updateFilesList(files);
    await loadMaestrias(selectedDirectory);
  } catch (error) {
    console.error('Error al cargar archivos:', error);
  }
}

export async function loadMaestrias(selectedDirectory) {
  if (!selectedDirectory) return;
  try {
    const files = await window.electronAPI.getExcelFiles(selectedDirectory);
    const maestriasSet = new Set();
    const trimestresSet = new Set();
    
    for (const file of files) {
      const sheets = await window.electronAPI.getSheetNames(selectedDirectory, file);
      sheets.forEach(sheet => maestriasSet.add(sheet));
      
      // Extraer trimestre del nombre del archivo
      const match = file.match(/\d{4}-\d+/);
      if (match) trimestresSet.add(match[0]);
    }
    
    // Cargar maestrías
    const searchFilter = document.getElementById('searchMaestriaFilter');
    if (searchFilter) {
      searchFilter.innerHTML = '<option value="">Todas las maestrías</option>';
      Array.from(maestriasSet).sort().forEach(maestria => {
        const option = document.createElement('option');
        option.value = maestria;
        option.textContent = maestria;
        searchFilter.appendChild(option);
      });
    }
    
    // Cargar trimestres
    const trimestreFilter = document.getElementById('searchTrimestreFilter');
    if (trimestreFilter) {
      trimestreFilter.innerHTML = '<option value="">Todos los trimestres</option>';
      Array.from(trimestresSet).sort().forEach(trimestre => {
        const option = document.createElement('option');
        option.value = trimestre;
        option.textContent = trimestre;
        trimestreFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error al cargar maestrías:', error);
  }
}

export function updateFilesList(files) {
  const filesList = document.getElementById('filesList');
  if (filesList && files) {
    if (files.length === 0) {
      filesList.innerHTML = '<p class="has-text-grey">No se encontraron archivos Excel en este directorio.</p>';
    } else {
      filesList.innerHTML = '<ul>' + files.map(f => `<li><span class="icon-text"><span class="icon has-text-info"><i class="mdi mdi-file-excel"></i></span><span>${f}</span></span></li>`).join('') + '</ul>';
    }
  }
}

export function updateDirectoryDisplay(selectedDirectory) {
  const currentDirPath = document.getElementById('currentDirPath');
  if (currentDirPath) {
    currentDirPath.textContent = selectedDirectory || 'No seleccionado';
  }
}
