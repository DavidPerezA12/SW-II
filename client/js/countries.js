import * as api from './api.js';
import { escapeHtml, routeParam } from './utils.js';

export async function renderCountriesList(container, showToast) {
  const state = { country: '', developer: '', gameName: '', loading: false };

  container.innerHTML = `
    <h1 class="page-title">Países</h1>
    <p class="page-subtitle">Información XML sobre países asociados a desarrolladores y videojuegos. Procedente de Wikidata.</p>

    <div class="toolbar">
      <div class="toolbar-group">
        <label>País</label>
        <input type="text" id="c-country" class="form-input" placeholder="Ej: Poland" value="${escapeHtml(state.country)}">
      </div>
      <div class="toolbar-group">
        <label>Desarrollador</label>
        <input type="text" id="c-developer" class="form-input" placeholder="Ej: CD Projekt RED" value="${escapeHtml(state.developer)}">
      </div>
      <div class="toolbar-group">
        <label>Videojuego</label>
        <input type="text" id="c-gameName" class="form-input" placeholder="Ej: The Witcher 3" value="${escapeHtml(state.gameName)}">
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-secondary btn-sm" id="c-reset">Limpiar</button>
        <button class="btn btn-primary btn-sm" id="c-refresh">Actualizar</button>
      </div>
    </div>

    <div id="c-results"></div>
  `;

  const els = {
    country: document.getElementById('c-country'),
    developer: document.getElementById('c-developer'),
    gameName: document.getElementById('c-gameName'),
    reset: document.getElementById('c-reset'),
    refresh: document.getElementById('c-refresh'),
    results: document.getElementById('c-results'),
  };

  function readState() {
    state.country = els.country.value.trim();
    state.developer = els.developer.value.trim();
    state.gameName = els.gameName.value.trim();
  }

  async function load() {
    if (state.loading) return;
    state.loading = true;
    els.results.innerHTML = `<div class="skeleton" style="width:100%;height:300px;"></div>`;

    try {
      const params = {};
      if (state.country) params.country = state.country;
      if (state.developer) params.developer = state.developer;
      if (state.gameName) params.gameName = state.gameName;

      const xmlText = await api.getCountries(params);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('La API devolvió XML no válido');
      }

      const countries = Array.from(xmlDoc.documentElement?.children || [])
        .filter(node => node.tagName === 'country');

      if (!countries.length) {
        els.results.innerHTML = `
          <div class="empty-state">
            <h3>Sin resultados</h3>
            <p>No se encontraron registros para los filtros aplicados.</p>
          </div>
        `;
        return;
      }

      const childText = (node, tagName) =>
        Array.from(node.children).find(child => child.tagName === tagName)?.textContent || '—';

      const rows = countries.map(node => ({
        gameId: childText(node, 'gameId'),
        gameName: childText(node, 'gameName'),
        developer: childText(node, 'developer'),
        country: childText(node, 'country'),
      }));

      els.results.innerHTML = `
        <div class="card" style="margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <div>
              <div class="stat-value" style="font-size:1.6rem">${rows.length}</div>
              <div class="stat-label">Registros encontrados</div>
            </div>
            <div class="api-format-actions inline">
              <span>Respuesta API</span>
              <button class="api-format-link" id="c-toggle-xml">XML</button>
            </div>
          </div>
        </div>

        <div id="c-xml-raw" class="hidden">
          <h4 class="section-title">XML</h4>
          <div class="xml-preview">${escapeHtml(xmlText)}</div>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Videojuego</th>
                <th>Game ID</th>
                <th>Desarrollador</th>
                <th>País</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td><strong>${escapeHtml(r.gameName)}</strong></td>
                  <td><a href="#/games/${routeParam(r.gameId)}">${escapeHtml(r.gameId)}</a></td>
                  <td>${escapeHtml(r.developer)}</td>
                  <td><span class="tag tag-accent2">${escapeHtml(r.country)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.getElementById('c-toggle-xml').addEventListener('click', () => {
        const raw = document.getElementById('c-xml-raw');
        raw.classList.toggle('hidden');
      });

    } catch (err) {
      showToast(err.message, 'error');
      els.results.innerHTML = `
        <div class="empty-state">
          <h3>Error al cargar países</h3>
          <p>${escapeHtml(err.message)}</p>
        </div>
      `;
    } finally {
      state.loading = false;
    }
  }

  [els.country, els.developer, els.gameName].forEach(el => {
    el.addEventListener('input', debounce(() => { readState(); load(); }, 400));
  });

  els.reset.addEventListener('click', () => {
    els.country.value = els.developer.value = els.gameName.value = '';
    readState(); load();
  });

  els.refresh.addEventListener('click', () => { readState(); load(); });

  await load();
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
