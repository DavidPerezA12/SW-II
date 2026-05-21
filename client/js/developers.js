import * as api from './api.js';
import { escapeHtml, routeParam } from './utils.js';

const DEFAULT_LIMIT = 20;

function buildTag(text, variant = 'muted') {
  return `<span class="tag tag-${variant}">${escapeHtml(text)}</span>`;
}

function renderJsonModal(title, data) {
  return `
    <h2 class="modal-title">${escapeHtml(title)}</h2>
    <pre class="json-preview">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
  `;
}

export async function renderDevelopersList(container, openModal, closeModal, showToast) {
  const state = { page: 1, limit: DEFAULT_LIMIT, search: '', gameId: '', sort: '', loading: false };

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Desarrolladores</h1>
      <p class="page-subtitle">Estudios de desarrollo y sus juegos asociados.</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-group">
        <label>Búsqueda</label>
        <input type="text" id="d-search" class="form-input" placeholder="Nombre..." value="${escapeHtml(state.search)}">
      </div>
      <div class="toolbar-group" style="min-width:120px">
        <label>ID de juego</label>
        <input type="number" id="d-gameId" class="form-input" placeholder="Ej: 3328" value="${escapeHtml(state.gameId)}">
      </div>
      <div class="toolbar-group" style="min-width:160px">
        <label>Ordenar</label>
        <select id="d-sort" class="form-select">
          <option value="">Por defecto</option>
          <option value="name">Nombre ↑</option>
          <option value="-name">Nombre ↓</option>
          <option value="games_count">Juegos ↑</option>
          <option value="-games_count">Juegos ↓</option>
        </select>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-secondary btn-sm" id="d-reset">Limpiar</button>
        <button class="btn btn-primary btn-sm" id="d-create">+ Nuevo desarrollador</button>
      </div>
    </div>

    <div id="d-grid" class="card-grid stagger"></div>
    <div id="d-pagination" class="pagination"></div>
  `;

  const els = {
    search: document.getElementById('d-search'),
    gameId: document.getElementById('d-gameId'),
    sort: document.getElementById('d-sort'),
    reset: document.getElementById('d-reset'),
    create: document.getElementById('d-create'),
    grid: document.getElementById('d-grid'),
    pagination: document.getElementById('d-pagination'),
  };

  function readState() {
    state.search = els.search.value.trim();
    state.gameId = els.gameId.value.trim();
    state.sort = els.sort.value;
  }

  async function load() {
    if (state.loading) return;
    state.loading = true;
    els.grid.innerHTML = Array(4).fill(0).map(() => `
      <div class="card">
        <div class="skeleton" style="width:64px;height:64px;margin-bottom:14px"></div>
        <div class="skeleton" style="width:60%;height:20px;margin-bottom:10px"></div>
        <div class="skeleton" style="width:40%;height:14px"></div>
      </div>
    `).join('');

    try {
      const params = { page: state.page, limit: state.limit };
      if (state.search) params.search = state.search;
      if (state.gameId) params.gameId = state.gameId;
      if (state.sort) params.sort = state.sort;

      const data = await api.getDevelopers(params);
      const items = data.developers || [];
      const total = data.total ?? data.developers_length ?? 0;

      if (!items.length) {
        els.grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>No se encontraron desarrolladores</h3><p>Cambia la búsqueda o el identificador del juego.</p></div>`;
      } else {
        els.grid.innerHTML = items.map(d => `
          <article class="card">
            <div style="display:flex;gap:14px;align-items:flex-start">
              ${d.image_background ? `<img src="${escapeHtml(d.image_background)}" style="width:56px;height:56px;object-fit:cover;flex-shrink:0;background:var(--bg-tertiary)">` : `<div style="width:56px;height:56px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.7rem;flex-shrink:0">SIN IMG</div>`}
              <div style="min-width:0">
                <h3 class="card-title" style="margin-bottom:2px"><a href="#/developers/${routeParam(d.id)}">${escapeHtml(d.name)}</a></h3>
                <p class="card-text">${d.games_count ?? 0} juegos · ${(d.games || []).length} en lista</p>
              </div>
            </div>
            <div class="card-meta" style="flex-wrap:wrap">
              ${(d.games || []).slice(0, 3).map(g => buildTag(typeof g === 'string' ? g : g.name, 'muted')).join('')}
              ${(d.games || []).length > 3 ? buildTag(`+${(d.games || []).length - 3}`, 'muted') : ''}
            </div>
            <div class="card-actions">
              <a href="#/developers/${routeParam(d.id)}" class="btn btn-secondary btn-sm">Ver</a>
              <button class="btn btn-ghost btn-sm" data-edit="${escapeHtml(d.id)}">Editar</button>
              <button class="btn btn-danger btn-sm" data-del="${escapeHtml(d.id)}">Eliminar</button>
            </div>
          </article>
        `).join('');
      }

      const totalPages = Math.max(1, Math.ceil(total / state.limit));
      els.pagination.innerHTML = `
        <button class="pagination-btn" id="d-prev" ${state.page <= 1 ? 'disabled' : ''}>←</button>
        ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = i + 1;
          return `<button class="pagination-btn ${p === state.page ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }).join('')}
        ${totalPages > 5 ? `<span class="pagination-info">de ${totalPages}</span>` : ''}
        <button class="pagination-btn" id="d-next" ${state.page >= totalPages ? 'disabled' : ''}>→</button>
        <span class="pagination-info">${total} resultados</span>
      `;

      document.getElementById('d-prev')?.addEventListener('click', () => { state.page--; load(); });
      document.getElementById('d-next')?.addEventListener('click', () => { state.page++; load(); });
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
      <h2 class="modal-title text-danger">Eliminar desarrollador</h2>
      <p class="mb-2">¿Estás seguro? Esta acción no se puede deshacer.</p>
      <div class="flex gap-1" style="justify-content:flex-end;margin-top:24px">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-danger" id="confirm-del-dev">Eliminar</button>
      </div>
    `);
    document.getElementById('confirm-del-dev').addEventListener('click', async () => {
      try {
        await api.deleteDeveloper(id);
        closeModal();
        showToast('Desarrollador eliminado', 'success');
        load();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  async function openEditModal(id) {
    try {
      const dev = await api.getDeveloper(id);
      openModal(renderDevForm(dev));
      bindDevForm(document.getElementById('dev-form'), async (body) => {
        await api.updateDeveloper(id, body);
        closeModal();
        showToast('Desarrollador actualizado', 'success');
        load();
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  [els.search, els.gameId, els.sort].forEach(el => {
    el.addEventListener('change', () => { readState(); state.page = 1; load(); });
    if (el.tagName === 'INPUT') el.addEventListener('input', debounce(() => { readState(); state.page = 1; load(); }, 400));
  });

  els.reset.addEventListener('click', () => {
    els.search.value = els.gameId.value = ''; els.sort.value = '';
    readState(); state.page = 1; load();
  });

  els.create.addEventListener('click', () => {
    openModal(renderDevForm());
    bindDevForm(document.getElementById('dev-form'), async (body) => {
      await api.createDeveloper(body);
      closeModal();
      showToast('Desarrollador creado', 'success');
      load();
    });
  });

  await load();
}

export async function renderDeveloperDetail(container, id, openModal, closeModal, showToast) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="skeleton" style="width:200px;height:28px;margin:0 auto 16px"></div>
      <div class="skeleton" style="width:280px;height:16px;margin:0 auto"></div>
    </div>
  `;

  try {
    const dev = await api.getDeveloper(id);
    container.innerHTML = `
      <div style="margin-bottom:20px">
        <a href="#/developers" class="btn btn-ghost btn-sm" style="padding-left:0">← Volver</a>
      </div>
      <div class="detail-header">
        ${dev.image_background ? `<img src="${escapeHtml(dev.image_background)}" class="detail-image" style="height:220px;object-fit:cover">` : '<div class="detail-image" style="display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);color:var(--text-muted)">Sin imagen</div>'}
        <div class="detail-info">
          <h2>${escapeHtml(dev.name)}</h2>
          <p>Slug: ${escapeHtml(dev.slug)} · ID: ${dev.id} · ${dev.games_count ?? 0} juegos</p>
          <div class="detail-actions">
            <button class="btn btn-primary btn-sm" id="dd-edit">Editar</button>
            <button class="btn btn-danger btn-sm" id="dd-del">Eliminar</button>
          </div>
          <div class="api-format-actions">
            <span>Respuesta API</span>
            <button class="api-format-link" id="dd-json">JSON</button>
          </div>
        </div>
      </div>

      <h3 class="section-title">Juegos asociados</h3>
      <div id="dd-games" class="card-grid stagger"></div>
    `;

    const games = dev.games || [];
    const gamesEl = document.getElementById('dd-games');
    if (!games.length) {
      gamesEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>Sin juegos</h3><p>Este desarrollador no tiene juegos registrados.</p></div>`;
    } else {
      gamesEl.innerHTML = games.map(g => `
        <div class="card">
          <h3 class="card-title"><a href="#/games/${routeParam(g.id)}">${escapeHtml(g.name)}</a></h3>
          <p class="card-text">ID: ${g.id} · Añadido: ${g.added ?? '—'} veces</p>
          <div class="card-actions">
            <a href="#/games/${routeParam(g.id)}" class="btn btn-secondary btn-sm">Ver juego</a>
          </div>
        </div>
      `).join('');
    }

    document.getElementById('dd-json').addEventListener('click', () => {
      openModal(renderJsonModal(`JSON · ${dev.name || 'Desarrollador'}`, dev));
    });

    document.getElementById('dd-edit').addEventListener('click', async () => {
      openModal(renderDevForm(dev));
      bindDevForm(document.getElementById('dev-form'), async (body) => {
        await api.updateDeveloper(id, body);
        closeModal();
        showToast('Desarrollador actualizado', 'success');
        renderDeveloperDetail(container, id, openModal, closeModal, showToast);
      });
    });

    document.getElementById('dd-del').addEventListener('click', () => {
      openModal(`
        <h2 class="modal-title text-danger">Eliminar desarrollador</h2>
        <p class="mb-2">¿Eliminar "${escapeHtml(dev.name)}"? Esta acción no se puede deshacer.</p>
        <div class="flex gap-1" style="justify-content:flex-end;margin-top:24px">
          <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-danger" id="confirm-del-dd">Eliminar</button>
        </div>
      `);
      document.getElementById('confirm-del-dd').addEventListener('click', async () => {
        try {
          await api.deleteDeveloper(id);
          closeModal();
          showToast('Desarrollador eliminado', 'success');
          window.location.hash = '#/developers';
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No encontrado</h3>
        <p>${err.message}</p>
        <a href="#/developers" class="btn btn-secondary mt-2">Volver</a>
      </div>
    `;
  }
}

export function renderDevForm(dev = null) {
  const isEdit = !!dev;
  const games = (dev?.games || []).map(g => ({
    id: g.id || '',
    slug: g.slug || '',
    name: g.name || '',
    added: g.added || 0,
  }));

  return `
    <h2 class="modal-title">${isEdit ? 'Editar' : 'Nuevo'} desarrollador</h2>
    <form id="dev-form" class="form-grid">
      ${!isEdit ? `
        <div class="form-group">
          <label class="form-label">ID *</label>
          <input type="number" name="id" class="form-input" required min="1">
        </div>
      ` : ''}
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input type="text" name="name" class="form-input" required value="${escapeHtml(dev?.name || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Slug *</label>
        <input type="text" name="slug" class="form-input" required value="${escapeHtml(dev?.slug || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Games count</label>
        <input type="number" name="games_count" class="form-input" min="0" value="${dev?.games_count ?? ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Imagen (URL)</label>
        <input type="url" name="image_background" class="form-input" value="${escapeHtml(dev?.image_background || '')}">
      </div>
      <div class="form-group full">
        <label class="form-label">Juegos (JSON: [{"id", "slug", "name", "added"}])</label>
        <textarea name="games_json" class="form-textarea" rows="4">${escapeHtml(JSON.stringify(games, null, 2))}</textarea>
        <div class="form-hint">Array de objetos con id, slug, name y added.</div>
      </div>
      <div class="form-group full" style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar cambios' : 'Crear desarrollador'}</button>
      </div>
    </form>
  `;
}

function bindDevForm(form, onSubmit) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = {};
    fd.forEach((v, k) => {
      if (k === 'id' || k === 'games_count') body[k] = v ? Number(v) : undefined;
      else if (k === 'games_json') {
        try {
          const parsed = JSON.parse(v);
          if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('games debe ser un array no vacío');
          body.games = parsed;
        } catch {
          window.showToast('El campo juegos no es un JSON válido', 'error');
          throw new Error('Invalid JSON');
        }
      } else {
        body[k] = v || undefined;
      }
    });
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    try {
      await onSubmit(body);
    } catch (err) {
      if (err.message !== 'Invalid JSON') window.showToast(err.message || 'Error al guardar', 'error');
    }
  });
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
