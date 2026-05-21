import * as api from './api.js';
import { escapeHtml, buildRating, routeParam } from './utils.js';

const DEFAULT_LIMIT = 20;

function buildTag(text, variant = 'muted') {
  return `<span class="tag tag-${variant}">${escapeHtml(text)}</span>`;
}

function translateGenre(genre) {
  const translations = {
    Action: 'Acción',
    Adventure: 'Aventura',
    Arcade: 'Arcade',
    'Board Games': 'Juegos de mesa',
    Card: 'Cartas',
    Casual: 'Casual',
    Educational: 'Educativo',
    Family: 'Familiar',
    Fighting: 'Lucha',
    Indie: 'Indie',
    Massively: 'Multijugador masivo',
    Platformer: 'Plataformas',
    Puzzle: 'Puzle',
    Racing: 'Carreras',
    RPG: 'Rol',
    Shooter: 'Disparos',
    Simulation: 'Simulación',
    Sports: 'Deportes',
    Strategy: 'Estrategia'
  };

  return translations[genre] || genre;
}

function buildDeveloperReference(developer) {
  if (typeof developer === 'object' && developer?.id) {
    return `<a href="#/developers/${routeParam(developer.id)}" class="tag tag-muted">${escapeHtml(developer.name || developer.id)}</a>`;
  }

  const developerName = typeof developer === 'string' ? developer : developer?.name;
  return buildTag(developerName || 'Desarrollador desconocido', 'muted');
}

function renderJsonModal(title, data) {
  return `
    <h2 class="modal-title">${escapeHtml(title)}</h2>
    <pre class="json-preview">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
  `;
}

export async function renderGamesList(container, openModal, closeModal, showToast) {
  const state = {
    page: 1,
    limit: DEFAULT_LIMIT,
    search: '',
    platform: '',
    genre: '',
    store: '',
    minRating: '',
    sort: '',
    loading: false,
  };

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Videojuegos</h1>
      <p class="page-subtitle">Consulta videojuegos y prueba filtros sobre la colección principal.</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-group">
        <label>Búsqueda</label>
        <input type="text" id="g-search" class="form-input" placeholder="Nombre del juego..." value="${escapeHtml(state.search)}">
      </div>
      <div class="toolbar-group">
        <label>Plataforma</label>
        <input type="text" id="g-platform" class="form-input" placeholder="PC, PlayStation..." value="${escapeHtml(state.platform)}">
      </div>
      <div class="toolbar-group">
        <label>Género</label>
        <input type="text" id="g-genre" class="form-input" placeholder="Action, RPG..." value="${escapeHtml(state.genre)}">
      </div>
      <div class="toolbar-group">
        <label>Tienda</label>
        <input type="text" id="g-store" class="form-input" placeholder="Steam, GOG..." value="${escapeHtml(state.store)}">
      </div>
      <div class="toolbar-group" style="min-width:100px">
        <label>Min. Rating</label>
        <input type="number" id="g-minRating" class="form-input" placeholder="0-5" step="0.1" min="0" max="5" value="${escapeHtml(state.minRating)}">
      </div>
      <div class="toolbar-group" style="min-width:140px">
        <label>Ordenar</label>
        <select id="g-sort" class="form-select">
          <option value="">Por defecto</option>
          <option value="name">Nombre ↑</option>
          <option value="-name">Nombre ↓</option>
          <option value="rating">Rating ↑</option>
          <option value="-rating">Rating ↓</option>
          <option value="released">Fecha ↑</option>
          <option value="-released">Fecha ↓</option>
          <option value="metacritic">Metacritic ↑</option>
          <option value="-metacritic">Metacritic ↓</option>
        </select>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-secondary btn-sm" id="g-reset">Limpiar</button>
        <button class="btn btn-primary btn-sm" id="g-create">+ Nuevo juego</button>
      </div>
    </div>

    <div id="g-grid" class="card-grid stagger"></div>
    <div id="g-pagination" class="pagination"></div>
  `;

  const els = {
    search: document.getElementById('g-search'),
    platform: document.getElementById('g-platform'),
    genre: document.getElementById('g-genre'),
    store: document.getElementById('g-store'),
    minRating: document.getElementById('g-minRating'),
    sort: document.getElementById('g-sort'),
    reset: document.getElementById('g-reset'),
    create: document.getElementById('g-create'),
    grid: document.getElementById('g-grid'),
    pagination: document.getElementById('g-pagination'),
  };

  function readState() {
    state.search = els.search.value.trim();
    state.platform = els.platform.value.trim();
    state.genre = els.genre.value.trim();
    state.store = els.store.value.trim();
    state.minRating = els.minRating.value.trim();
    state.sort = els.sort.value;
  }

  async function load() {
    if (state.loading) return;
    state.loading = true;
    els.grid.innerHTML = Array(6).fill(0).map(() => `
      <div class="card">
        <div class="skeleton" style="width:100%;height:160px;margin-bottom:16px"></div>
        <div class="skeleton" style="width:60%;height:20px;margin-bottom:10px"></div>
        <div class="skeleton" style="width:40%;height:14px"></div>
      </div>
    `).join('');

    try {
      const params = { page: state.page, limit: state.limit };
      if (state.search) params.search = state.search;
      if (state.platform) params.platform = state.platform;
      if (state.genre) params.genre = state.genre;
      if (state.store) params.store = state.store;
      if (state.minRating) params.minRating = state.minRating;
      if (state.sort) params.sort = state.sort;

      const data = await api.getGames(params);
      const games = data.videogames || [];
      const total = data.total ?? data.videogames_length ?? 0;

      if (games.length === 0) {
        els.grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <h3>No se encontraron juegos</h3>
            <p>Cambia algún filtro o crea un videojuego nuevo.</p>
          </div>
        `;
      } else {
        els.grid.innerHTML = games.map(g => `
          <article class="card">
            ${g.background_image ? `<img src="${escapeHtml(g.background_image)}" alt="" class="card-image" loading="lazy">` : '<div class="card-image" style="display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.8rem">Sin imagen</div>'}
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
              ${(g.genres || []).slice(0, 3).map(x => buildTag(translateGenre(x), 'accent')).join('')}
              ${buildRating(g.rating)}
            </div>
            <h3 class="card-title"><a href="#/games/${routeParam(g.id)}">${escapeHtml(g.name)}</a></h3>
            <p class="card-text">${escapeHtml(g.released || 'Sin fecha')} · ${escapeHtml((g.platforms || []).slice(0, 3).join(', '))}${(g.platforms || []).length > 3 ? '...' : ''}</p>
            <div class="card-meta">Metacritic: ${escapeHtml(g.metacritic ?? '—')} · ${(g.stores || []).length} tiendas</div>
            <div class="card-actions">
              <a href="#/games/${routeParam(g.id)}" class="btn btn-secondary btn-sm">Ver</a>
              <button class="btn btn-ghost btn-sm" data-edit="${escapeHtml(g.id)}">Editar</button>
              <button class="btn btn-danger btn-sm" data-del="${escapeHtml(g.id)}">Eliminar</button>
            </div>
          </article>
        `).join('');
      }

      const totalPages = Math.max(1, Math.ceil(total / state.limit));
      els.pagination.innerHTML = `
        <button class="pagination-btn" id="g-prev" ${state.page <= 1 ? 'disabled' : ''}>←</button>
        ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = i + 1;
          return `<button class="pagination-btn ${p === state.page ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }).join('')}
        ${totalPages > 5 ? `<span class="pagination-info">de ${totalPages}</span>` : ''}
        <button class="pagination-btn" id="g-next" ${state.page >= totalPages ? 'disabled' : ''}>→</button>
        <span class="pagination-info">${total} resultados</span>
      `;

      document.getElementById('g-prev')?.addEventListener('click', () => { state.page--; load(); });
      document.getElementById('g-next')?.addEventListener('click', () => { state.page++; load(); });
      els.pagination.querySelectorAll('[data-page]').forEach(b => {
        b.addEventListener('click', () => { state.page = Number(b.dataset.page); load(); });
      });
      els.grid.querySelectorAll('[data-edit]').forEach(b => {
        b.addEventListener('click', () => openEditModal(b.dataset.edit));
      });
      els.grid.querySelectorAll('[data-del]').forEach(b => {
        b.addEventListener('click', () => confirmDelete(b.dataset.del));
      });

    } catch (err) {
      showToast(err.message, 'error');
      els.grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div>`;
    } finally {
      state.loading = false;
    }
  }

  function confirmDelete(id) {
    openModal(`
      <h2 class="modal-title text-danger">Eliminar videojuego</h2>
      <p class="mb-2">¿Estás seguro de que quieres eliminar este videojuego? Esta acción no se puede deshacer.</p>
      <div class="flex gap-1" style="justify-content:flex-end;margin-top:24px">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-danger" id="confirm-del">Eliminar</button>
      </div>
    `);
    document.getElementById('confirm-del').addEventListener('click', async () => {
      try {
        await api.deleteGame(id);
        closeModal();
        showToast('Videojuego eliminado', 'success');
        load();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  async function openEditModal(id) {
    try {
      const game = await api.getGame(id);
      openModal(renderGameForm(game));
      bindFormSubmit(document.getElementById('game-form'), async (body) => {
        await api.updateGame(id, body);
        closeModal();
        showToast('Videojuego actualizado', 'success');
        load();
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  [els.search, els.platform, els.genre, els.store, els.minRating, els.sort].forEach(el => {
    el.addEventListener('change', () => { readState(); state.page = 1; load(); });
    if (el.tagName === 'INPUT') el.addEventListener('input', debounce(() => { readState(); state.page = 1; load(); }, 400));
  });

  els.reset.addEventListener('click', () => {
    els.search.value = els.platform.value = els.genre.value = els.store.value = els.minRating.value = '';
    els.sort.value = '';
    readState(); state.page = 1; load();
  });

  els.create.addEventListener('click', () => {
    openModal(renderGameForm());
    bindFormSubmit(document.getElementById('game-form'), async (body) => {
      await api.createGame(body);
      closeModal();
      showToast('Videojuego creado', 'success');
      load();
    });
  });

  await load();
}

export async function renderGameDetail(container, id, openModal, closeModal, showToast) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="skeleton" style="width:200px;height:28px;margin:0 auto 16px"></div>
      <div class="skeleton" style="width:280px;height:16px;margin:0 auto"></div>
    </div>
  `;

  try {
    const game = await api.getGame(id);
    const hasImage = game.background_image;

    container.innerHTML = `
      <div style="margin-bottom:20px">
        <a href="#/games" class="btn btn-ghost btn-sm" style="padding-left:0">← Volver</a>
      </div>
      <div class="detail-header">
        ${hasImage ? `<img src="${escapeHtml(game.background_image)}" alt="${escapeHtml(game.name)}" class="detail-image">` : '<div class="detail-image" style="display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);color:var(--text-muted)">Sin imagen</div>'}
        <div class="detail-info">
          <h2>${escapeHtml(game.name)}</h2>
          <p>${escapeHtml(game.released || 'Fecha desconocida')} · ID: ${game.id}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
            ${(game.genres || []).map(g => buildTag(translateGenre(g), 'accent')).join('')}
            ${(game.platforms || []).map(p => buildTag(p, 'muted')).join('')}
          </div>
          <div class="detail-actions">
            <button class="btn btn-primary btn-sm" id="gd-edit">Editar</button>
            <button class="btn btn-danger btn-sm" id="gd-del">Eliminar</button>
          </div>
          <div class="api-format-actions">
            <span>Respuesta API</span>
            <button class="api-format-link" id="gd-json">JSON</button>
          </div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab-btn active" data-tab="info">Información</button>
        <button class="tab-btn" data-tab="reviews">Reviews</button>
        <button class="tab-btn" data-tab="countries">Países</button>
        <button class="tab-btn" data-tab="enriched">Resumen</button>
      </div>

      <div id="tab-content"></div>
    `;

    const tabContent = document.getElementById('tab-content');

    function renderInfo() {
      tabContent.innerHTML = `
        <div class="tab-panel">
          <div class="card-grid game-metrics" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 24px;">
            <div class="card"><div class="card-title">Valoración</div>${buildRating(game.rating, false) || '<div class="stat-value detail-stat-value">—</div>'}</div>
            <div class="card"><div class="card-title">Metacritic</div><div class="stat-value detail-stat-value">${escapeHtml(game.metacritic ?? '—')}</div></div>
            <div class="card"><div class="card-title">Tiempo de juego</div><div class="stat-value detail-stat-value">${escapeHtml(game.playtime ?? '—')} h</div></div>
            <div class="card"><div class="card-title">Clasificación ESRB</div><div class="stat-value detail-stat-value">${escapeHtml(game.esrb_rating ?? '—')}</div></div>
          </div>
          <div class="card">
            <h4 class="section-title">Tiendas</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${(game.stores || []).length ? game.stores.map(s => buildTag(s, 'accent2')).join('') : '<span class="text-muted">No hay tiendas registradas</span>'}
            </div>
          </div>
          ${game.developers?.length ? `
            <div class="card mt-2">
              <h4 class="section-title">Desarrolladores</h4>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${game.developers.map(buildDeveloperReference).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    async function renderReviews() {
      tabContent.innerHTML = '<div class="tab-panel"><div class="skeleton" style="width:100%;height:120px"></div></div>';
      try {
        const data = await api.getGameReviews(id);
        const reviews = data.reviews || [];
        if (!reviews.length) {
          tabContent.innerHTML = `<div class="tab-panel empty-state"><h3>Sin reviews</h3><p>Este juego no tiene reviews todavía.</p></div>`;
          return;
        }
        tabContent.innerHTML = `
          <div class="tab-panel">
            <div class="card-grid" style="grid-template-columns: 1fr;">
              ${reviews.map(r => `
                <div class="card">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div>
                      <div class="card-title">${escapeHtml(r.user || 'Anónimo')} ${buildRating(r.rating)}</div>
                      <p class="card-text mt-1">${escapeHtml(r.comment)}</p>
                    </div>
                    <span class="text-muted" style="font-size:0.75rem;white-space:nowrap">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } catch (err) {
        tabContent.innerHTML = `<div class="tab-panel empty-state"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div>`;
      }
    }

    async function renderCountries() {
      tabContent.innerHTML = '<div class="tab-panel"><div class="skeleton" style="width:100%;height:200px"></div></div>';
      try {
        const xml = await api.getGameCountry(id);
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'application/xml');
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) throw new Error('XML inválido devuelto por la API');
        
        const countryNodes = Array.from(xmlDoc.documentElement?.children || []).filter(n => n.tagName === 'country');
        
        const parsedCountries = countryNodes.map(node => {
          const dev = Array.from(node.children).find(c => c.tagName === 'developer')?.textContent || 'Desconocido';
          const ctry = Array.from(node.children).find(c => c.tagName === 'country')?.textContent || 'Desconocido';
          return { developer: dev, country: ctry };
        });

        tabContent.innerHTML = `
          <div class="tab-panel">
            <div class="section-row" style="display: flex; justify-content: space-between; align-items: center;">
              <h4 class="section-title">Países</h4>
              <button class="btn btn-secondary btn-sm" id="toggle-countries-xml">Ver XML Original</button>
            </div>
            
            <div class="table-container" id="countries-parsed-view">
              <table class="table">
                <thead>
                  <tr>
                    <th>Desarrollador</th>
                    <th>País</th>
                  </tr>
                </thead>
                <tbody>
                  ${parsedCountries.map(c => `
                    <tr>
                      <td><strong>${escapeHtml(c.developer)}</strong></td>
                      <td><span class="tag tag-accent">${escapeHtml(c.country)}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div id="countries-xml-view" class="hidden" style="margin-top: 20px;">
              <span class="api-format-note">Respuesta XML</span>
              <div class="xml-preview">${escapeHtml(xml)}</div>
            </div>
          </div>
        `;

        document.getElementById('toggle-countries-xml').addEventListener('click', (e) => {
          const xmlView = document.getElementById('countries-xml-view');
          if (xmlView.classList.contains('hidden')) {
            xmlView.classList.remove('hidden');
            e.target.textContent = 'Ocultar XML';
          } else {
            xmlView.classList.add('hidden');
            e.target.textContent = 'Ver XML Original';
          }
        });

      } catch (err) {
        if (err.status === 404) {
          tabContent.innerHTML = `
            <div class="tab-panel empty-state">
              <h3>404 · Sin países asociados</h3>
              <p>La API respondió correctamente, pero no tiene información de países para este videojuego.</p>
            </div>
          `;
          return;
        }
        tabContent.innerHTML = `<div class="tab-panel empty-state"><h3>Error al cargar países</h3><p>${escapeHtml(err.message)}</p></div>`;
      }
    }

    async function renderEnriched() {
      tabContent.innerHTML = '<div class="tab-panel"><div class="skeleton" style="width:100%;height:200px"></div></div>';
      try {
        const data = await api.getGameEnriched(id);
        const countries = data.wikidata?.countries || [];
        const reviews = data.reviews || [];
        tabContent.innerHTML = `
          <div class="tab-panel">
            <div class="card-grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin-bottom: 20px;">
              <div class="card">
                <div class="card-title text-accent">Países</div>
                <div class="stat-value" style="font-size:1.6rem">${countries.length}</div>
                <div class="card-meta">${countries.map(c => escapeHtml(c.country)).join(', ') || '—'}</div>
              </div>
              <div class="card">
                <div class="card-title text-accent2">Reviews</div>
                <div class="stat-value" style="font-size:1.6rem">${reviews.length}</div>
                <div class="card-meta">${reviews.length ? `Última: ${escapeHtml(reviews[0].user || 'Anónimo')}` : 'Sin reviews'}</div>
              </div>
            </div>
            ${countries.length ? `
              <div class="card">
                <h4 class="section-title">Desarrolladores y países</h4>
                <div class="table-container">
                  <table class="table">
                    <thead><tr><th>Desarrollador</th><th>País</th></tr></thead>
                    <tbody>
                      ${countries.map(c => `<tr><td>${escapeHtml(c.developer)}</td><td>${escapeHtml(c.country)}</td></tr>`).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      } catch (err) {
        tabContent.innerHTML = `<div class="tab-panel empty-state"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div>`;
      }
    }

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        if (tab === 'info') renderInfo();
        if (tab === 'reviews') renderReviews();
        if (tab === 'countries') renderCountries();
        if (tab === 'enriched') renderEnriched();
      });
    });

    renderInfo();

    document.getElementById('gd-json').addEventListener('click', () => {
      openModal(renderJsonModal(`JSON · ${game.name || 'Videojuego'}`, game));
    });

    document.getElementById('gd-edit').addEventListener('click', async () => {
      openModal(renderGameForm(game));
      bindFormSubmit(document.getElementById('game-form'), async (body) => {
        await api.updateGame(id, body);
        closeModal();
        showToast('Videojuego actualizado', 'success');
        renderGameDetail(container, id, openModal, closeModal, showToast);
      });
    });

    document.getElementById('gd-del').addEventListener('click', () => {
      openModal(`
        <h2 class="modal-title text-danger">Eliminar videojuego</h2>
        <p class="mb-2">¿Eliminar "${escapeHtml(game.name)}"? Esta acción no se puede deshacer.</p>
        <div class="flex gap-1" style="justify-content:flex-end;margin-top:24px">
          <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-danger" id="confirm-del">Eliminar</button>
        </div>
      `);
      document.getElementById('confirm-del').addEventListener('click', async () => {
        try {
          await api.deleteGame(id);
          closeModal();
          showToast('Videojuego eliminado', 'success');
          window.location.hash = '#/games';
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No encontrado</h3>
        <p>${escapeHtml(err.message)}</p>
        <a href="#/games" class="btn btn-secondary mt-2">Volver al listado</a>
      </div>
    `;
  }
}

export function renderGameForm(game = null) {
  const isEdit = !!game;
  return `
    <h2 class="modal-title">${isEdit ? 'Editar' : 'Nuevo'} videojuego</h2>
    <form id="game-form" class="form-grid">
      ${!isEdit ? `
        <div class="form-group">
          <label class="form-label">ID *</label>
          <input type="number" name="id" class="form-input" required min="1">
        </div>
      ` : ''}
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input type="text" name="name" class="form-input" required value="${escapeHtml(game?.name || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Slug</label>
        <input type="text" name="slug" class="form-input" value="${escapeHtml(game?.slug || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Fecha de lanzamiento</label>
        <input type="date" name="released" class="form-input" value="${escapeHtml(game?.released || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Imagen (URL)</label>
        <input type="url" name="background_image" class="form-input" value="${escapeHtml(game?.background_image || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Rating</label>
        <input type="number" name="rating" class="form-input" step="0.01" min="0" max="5" value="${game?.rating ?? ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Metacritic</label>
        <input type="number" name="metacritic" class="form-input" min="0" max="100" value="${game?.metacritic ?? ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Playtime (horas)</label>
        <input type="number" name="playtime" class="form-input" min="0" value="${game?.playtime ?? ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Plataformas * (coma separadas)</label>
        <input type="text" name="platforms" class="form-input" required value="${escapeHtml((game?.platforms || []).join(', '))}">
      </div>
      <div class="form-group">
        <label class="form-label">Géneros * (coma separados)</label>
        <input type="text" name="genres" class="form-input" required value="${escapeHtml((game?.genres || []).join(', '))}">
      </div>
      <div class="form-group">
        <label class="form-label">Tiendas * (coma separadas)</label>
        <input type="text" name="stores" class="form-input" required value="${escapeHtml((game?.stores || []).join(', '))}">
      </div>
      <div class="form-group">
        <label class="form-label">ESRB Rating</label>
        <input type="text" name="esrb_rating" class="form-input" value="${escapeHtml(game?.esrb_rating || '')}">
      </div>
      <div class="form-group full" style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar cambios' : 'Crear videojuego'}</button>
      </div>
    </form>
  `;
}

function bindFormSubmit(form, onSubmit) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = {};
    fd.forEach((v, k) => {
      if (k === 'id' || k === 'metacritic' || k === 'playtime') {
        body[k] = v ? Number(v) : undefined;
      } else if (k === 'rating') {
        body[k] = v ? parseFloat(v) : undefined;
      } else if (['platforms', 'genres', 'stores'].includes(k)) {
        body[k] = v.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        body[k] = v || undefined;
      }
    });
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    try {
      await onSubmit(body);
    } catch (err) {
      window.showToast(err.message || 'Error al guardar', 'error');
    }
  });
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
