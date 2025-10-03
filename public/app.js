// Estado global
let miembros = [];
let miembrosAusentes = new Set();

// API Base URL - se ajusta automáticamente según el entorno
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : '/api';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  initTabs();
  setFechaActual();
  cargarMiembros();
  setupEventListeners();
});

// Sistema de Tabs
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      cambiarTab(tabName);
    });
  });
}

function cambiarTab(tabName) {
  // Actualizar botones
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Actualizar contenido
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`tab-${tabName}`).classList.add('active');

  // Recargar datos según el tab
  if (tabName === 'miembros') {
    mostrarTodosMiembros();
  } else if (tabName === 'historial') {
    cargarHistorial();
  }
}

// Fecha actual
function setFechaActual() {
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('fecha').value = hoy;
}

// Event Listeners
function setupEventListeners() {
  // Búsqueda de miembros
  document.getElementById('search').addEventListener('input', function(e) {
    filtrarMiembros(e.target.value);
  });

  // Guardar asistencia
  document.getElementById('btn-guardar').addEventListener('click', guardarAsistencia);

  // Añadir nuevo miembro
  document.getElementById('btn-nuevo-miembro').addEventListener('click', añadirNuevoMiembro);
}

// Cargar miembros desde el servidor
async function cargarMiembros() {
  mostrarLoading(true);
  try {
    const response = await fetch(`${API_BASE}/miembros`);
    if (!response.ok) throw new Error('Error al cargar miembros');

    miembros = await response.json();
    mostrarMiembros(miembros);
  } catch (error) {
    mostrarError('Error al cargar miembros: ' + error.message);
  } finally {
    mostrarLoading(false);
  }
}

// Mostrar miembros en la lista
function mostrarMiembros(lista) {
  const container = document.getElementById('lista-miembros');

  if (lista.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <p>No hay miembros registrados</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lista.map(miembro => `
    <div class="miembro-item ${miembrosAusentes.has(miembro.id) ? 'ausente' : ''}"
         data-id="${miembro.id}">
      <input type="checkbox"
             id="miembro-${miembro.id}"
             ${miembrosAusentes.has(miembro.id) ? 'checked' : ''}
             onchange="toggleAusente('${miembro.id}')">
      <label for="miembro-${miembro.id}" class="miembro-info">
        <div class="miembro-nombre">${miembro.nombre}</div>
        <div class="miembro-voz">${miembro.voz}</div>
      </label>
    </div>
  `).join('');
}

// Filtrar miembros por nombre
function filtrarMiembros(busqueda) {
  const filtrados = miembros.filter(m =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  mostrarMiembros(filtrados);
}

// Toggle ausente
function toggleAusente(miembroId) {
  if (miembrosAusentes.has(miembroId)) {
    miembrosAusentes.delete(miembroId);
  } else {
    miembrosAusentes.add(miembroId);
  }

  const item = document.querySelector(`[data-id="${miembroId}"]`);
  item.classList.toggle('ausente');
}

// Guardar asistencia
async function guardarAsistencia() {
  const fecha = document.getElementById('fecha').value;
  const tipo = document.getElementById('tipo').value;
  const notas = document.getElementById('notas').value;

  if (!fecha) {
    mostrarMensaje('Por favor, selecciona una fecha', 'error');
    return;
  }

  const btn = document.getElementById('btn-guardar');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  const ausentesArray = Array.from(miembrosAusentes);

  try {
    const response = await fetch(`${API_BASE}/asistencias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fecha,
        tipo,
        ausentes: ausentesArray,
        notas
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      mostrarMensaje('✅ ' + result.mensaje, 'success');
      // Limpiar formulario
      miembrosAusentes.clear();
      document.getElementById('notas').value = '';
      mostrarMiembros(miembros);
      setFechaActual();
    } else {
      mostrarMensaje('⚠️ ' + (result.mensaje || result.error), 'error');
    }
  } catch (error) {
    mostrarMensaje('❌ Error: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar Asistencia';
  }
}

// Añadir nuevo miembro
async function añadirNuevoMiembro() {
  const nombre = document.getElementById('nuevo-nombre').value.trim();
  const voz = document.getElementById('nueva-voz').value;

  if (!nombre) {
    mostrarMensajeMiembro('Por favor, introduce un nombre', 'error');
    return;
  }

  const btn = document.getElementById('btn-nuevo-miembro');
  btn.disabled = true;
  btn.textContent = 'Añadiendo...';

  try {
    const response = await fetch(`${API_BASE}/miembros`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, voz })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      mostrarMensajeMiembro('✅ Miembro añadido correctamente', 'success');
      // Limpiar formulario
      document.getElementById('nuevo-nombre').value = '';
      // Recargar lista
      await cargarMiembros();
    } else {
      mostrarMensajeMiembro('Error: ' + (result.error || 'Error desconocido'), 'error');
    }
  } catch (error) {
    mostrarMensajeMiembro('Error: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Añadir Miembro';
  }
}

// Mostrar todos los miembros
function mostrarTodosMiembros() {
  const container = document.getElementById('lista-todos-miembros');

  if (miembros.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <p>No hay miembros registrados</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="todos-miembros-list">
      ${miembros.map(miembro => `
        <div class="miembro-card">
          <div class="miembro-card-nombre">${miembro.nombre}</div>
          <div class="miembro-card-voz">${miembro.voz}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// Cargar historial
async function cargarHistorial() {
  const container = document.getElementById('lista-historial');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const response = await fetch(`${API_BASE}/historial?limit=20`);
    if (!response.ok) throw new Error('Error al cargar historial');

    const historial = await response.json();

    if (!historial || historial.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <p>No hay eventos registrados</p>
        </div>
      `;
      return;
    }

    container.innerHTML = historial.map(evento => {
      const fecha = new Date(evento.fecha);
      const fechaStr = fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      return `
        <div class="historial-item">
          <div class="historial-fecha">${fechaStr}</div>
          <div class="historial-tipo">${evento.tipo || 'Evento'}</div>
          <div class="historial-stats">
            <div class="stat stat-presentes">
              ✅ Presentes: ${evento.presentes || 0}
            </div>
            <div class="stat stat-ausentes">
              ❌ Ausentes: ${evento.ausentes || 0}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Error al cargar historial: ${error.message}</p>
      </div>
    `;
  }
}

// Utilidades UI
function mostrarLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function mostrarMensaje(texto, tipo) {
  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = texto;
  mensaje.className = `message ${tipo}`;
  mensaje.style.display = 'block';

  setTimeout(() => {
    mensaje.style.display = 'none';
  }, 5000);
}

function mostrarMensajeMiembro(texto, tipo) {
  const mensaje = document.getElementById('mensaje-miembro');
  mensaje.textContent = texto;
  mensaje.className = `message ${tipo}`;
  mensaje.style.display = 'block';

  setTimeout(() => {
    mensaje.style.display = 'none';
  }, 5000);
}

function mostrarError(texto) {
  alert('Error: ' + texto);
}
