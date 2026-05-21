import * as api from './api.js';
import { escapeHtml, buildRating, routeParam } from './utils.js';

const DEFAULT_LIMIT = 20;

function renderJsonModal(title, data) {
  return `
    <h2 class="modal-title">${escapeHtml(title)}</h2>
    <pre class="json-preview">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
  `;
}

function filterReviews(items, state) {
  return items.filter(review => {
    const matchesId = !state.id || Number(review.id) === Number(state.id);
    const matchesRating = !state.rating || Number(review.rating) === Number(state.rating);
    return matchesId && matchesRating;
  });
}

function paginate(items, page, limit) {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}

export async function renderReviewsList(container, openModal, closeModal, showToast) {
  const state = { page: 1, limit: DEFAULT_LIMIT, id: '', gameId: '', rating: '', loading: false };

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Reviews</h1>
      <p class="page-subtitle">Opiniones y valoraciones de los usuarios.</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-group" style="min-width:120px">
        <label>ID Review</label>
        <input type="number" id="r-id" class="form-input" placeholder="Ej: 4" value="${escapeHtml(state.id)}">
      </div>
      <div class="toolbar-group" style="min-width:120px">
        <label>ID Juego</label>
        <input type="number" id="r-gameId" class="form-input" placeholder="Ej: 3328" value="${escapeHtml(state.gameId)}">
      </div>
      <div class="toolbar-group" style="min-width:120px">
        <label>Rating</label>
        <select id="r-rating" class="form-select">
          <option value="">Todos</option>
          <option value="1">1 ★</option>
          <option value="2">2 ★★</option>
          <option value="3">3 ★★★</option>
          <option value="4">4 ★★★★</option>
          <option value="5">5 ★★★★★</option>
        </select>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-secondary btn-sm" id="r-reset">Limpiar</button>
        <button class="btn btn-primary btn-sm" id="r-create">+ Nueva review</button>
      </div>
    </div>

    <div id="r-grid" class="card-grid stagger" style="grid-template-columns: 1fr;"></div>
    <div id="r-pagination" class="pagination"></div>
  `;

  const els = {
    id: document.getElementById('r-id'),
    gameId: document.getElementById('r-gameId'),
    rating: document.getElementById('r-rating'),
    reset: document.getElementById('r-reset'),
    create: document.getElementById('r-create'),
    grid: document.getElementById('r-grid'),
    pagination: document.getElementById('r-pagination'),
  };

  function readState() {
    state.id = els.id.value.trim();
    state.gameId = els.gameId.value.trim();
    state.rating = els.rating.value;
  }

  async function load() {
    if (state.loading) return;
    state.loading = true;
    els.grid.innerHTML = Array(4).fill(0).map(() => `
      <div class="card">
        <div class="skeleton" style="width:40%;height:18px;margin-bottom:10px"></div>
        <div class="skeleton" style="width:100%;height:60px"></div>
      </div>
    `).join('');

    try {
      const params = { page: state.page, limit: state.limit };
      if (state.id) params.id = state.id;
      if (state.rating) params.rating = state.rating;

      const data = state.gameId
        ? await api.getReviewsByGame(state.gameId)
        : await api.getReviews(params);
      const rawItems = data.reviews || [];
      const filteredItems = state.gameId ? filterReviews(rawItems, state) : rawItems;
      const total = state.gameId ? filteredItems.length : (data.total ?? data.reviews_length ?? 0);
      const items = state.gameId ? paginate(filteredItems, state.page, state.limit) : filteredItems;

      if (!items.length) {
        els.grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>No se encontraron reviews</h3><p>Cambia el filtro o crea una review nueva.</p></div>`;
      } else {
        els.grid.innerHTML = items.map(r => `
          <article class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
              <div style="min-width:0;flex:1">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
                  <h3 class="card-title" style="margin:0"><a href="#/reviews/${routeParam(r.id)}">${escapeHtml(r.user || 'Anónimo')}</a></h3>
                  ${buildRating(r.rating)}
                  <span class="tag tag-muted">${escapeHtml(r.gameName || '')}</span>
                </div>
                <p class="card-text">${escapeHtml(r.comment)}</p>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
                <span class="text-muted" style="font-size:0.75rem">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm" data-edit="${escapeHtml(r.id)}">Editar</button>
                  <button class="btn btn-danger btn-sm" data-del="${escapeHtml(r.id)}">Eliminar</button>
                </div>
              </div>
            </div>
          </article>
        `).join('');
      }

      const totalPages = Math.max(1, Math.ceil(total / state.limit));
      els.pagination.innerHTML = `
        <button class="pagination-btn" id="r-prev" ${state.page <= 1 ? 'disabled' : ''}>←</button>
        ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = i + 1;
          return `<button class="pagination-btn ${p === state.page ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }).join('')}
        ${totalPages > 5 ? `<span class="pagination-info">de ${totalPages}</span>` : ''}
        <button class="pagination-btn" id="r-next" ${state.page >= totalPages ? 'disabled' : ''}>→</button>
        <span class="pagination-info">${total} resultados</span>
      `;

      document.getElementById('r-prev')?.addEventListener('click', () => { state.page--; load(); });
      document.getElementById('r-next')?.addEventListener('click', () => { state.page++; load(); });
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
      if (state.gameId && err.status === 404) {
        els.grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>No se encontraron reviews</h3><p>No hay reviews para el videojuego indicado.</p></div>`;
        els.pagination.innerHTML = '<span class="pagination-info">0 resultados</span>';
        return;
      }
      showToast(err.message, 'error');
      els.grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div>`;
    } finally {
      state.loading = false;
    }
  }

  function confirmDelete(id) {
    openModal(`
      <h2 class="modal-title text-danger">Eliminar review</h2>
      <p class="mb-2">¿Estás seguro de eliminar esta review?</p>
      <div class="flex gap-1" style="justify-content:flex-end;margin-top:24px">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-danger" id="confirm-del-rev">Eliminar</button>
      </div>
    `);
    document.getElementById('confirm-del-rev').addEventListener('click', async () => {
      try {
        await api.deleteReview(id);
        closeModal();
        showToast('Review eliminada', 'success');
        load();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  async function openEditModal(id) {
    try {
      const data = await api.getReviews({ id });
      const review = (data.reviews || [])[0];
      if (!review) return showToast('Review no encontrada', 'error');
      openModal(renderReviewForm(review));
      bindReviewForm(document.getElementById('review-form'), async (body) => {
        await api.updateReview(id, body);
        closeModal();
        showToast('Review actualizada', 'success');
        load();
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  [els.id, els.gameId, els.rating].forEach(el => {
    el.addEventListener('change', () => { readState(); state.page = 1; load(); });
    if (el.tagName === 'INPUT') el.addEventListener('input', debounce(() => { readState(); state.page = 1; load(); }, 400));
  });

  els.reset.addEventListener('click', () => {
    els.id.value = ''; els.gameId.value = ''; els.rating.value = '';
    readState(); state.page = 1; load();
  });

  els.create.addEventListener('click', () => {
    openModal(renderReviewForm());
    bindReviewForm(document.getElementById('review-form'), async (body) => {
      await api.createReview(body);
      closeModal();
      showToast('Review creada', 'success');
      load();
    });
  });

  await load();
}

export async function renderReviewDetail(container, id, openModal, closeModal, showToast) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="skeleton" style="width:200px;height:28px;margin:0 auto 16px"></div>
      <div class="skeleton" style="width:280px;height:16px;margin:0 auto"></div>
    </div>
  `;

  try {
    const data = await api.getReviews({ id });
    const r = (data.reviews || [])[0];
    if (!r) throw new Error('Review no encontrada');

    container.innerHTML = `
      <div style="margin-bottom:20px">
        <a href="#/reviews" class="btn btn-ghost btn-sm" style="padding-left:0">← Volver</a>
      </div>
      <div class="card" style="max-width:720px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:16px">
          <div>
            <h2 style="font-family:var(--font-display);font-size:1.6rem;margin-bottom:6px">${escapeHtml(r.user || 'Anónimo')}</h2>
            <div style="font-size:1.1rem">${buildRating(r.rating)}</div>
          </div>
          <div class="text-muted" style="font-size:0.8rem">
            ${r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
          </div>
        </div>
        <div style="margin-bottom:20px">
          <span class="tag tag-accent">${escapeHtml(r.gameName || '')}</span>
          <span class="tag tag-muted">Game ID: ${r.gameId}</span>
        </div>
        <p style="font-size:1rem;line-height:1.7;color:var(--text-secondary)">${escapeHtml(r.comment)}</p>
        <div class="detail-actions" style="margin-top:24px">
          <button class="btn btn-primary btn-sm" id="rd-edit">Editar</button>
          <button class="btn btn-danger btn-sm" id="rd-del">Eliminar</button>
        </div>
        <div class="api-format-actions">
          <span>Respuesta API</span>
          <button class="api-format-link" id="rd-json">JSON</button>
        </div>
      </div>
    `;

    document.getElementById('rd-json').addEventListener('click', () => {
      openModal(renderJsonModal(`JSON · Review ${r.id}`, r));
    });

    document.getElementById('rd-edit').addEventListener('click', async () => {
      openModal(renderReviewForm(r));
      bindReviewForm(document.getElementById('review-form'), async (body) => {
        await api.updateReview(id, body);
        closeModal();
        showToast('Review actualizada', 'success');
        renderReviewDetail(container, id, openModal, closeModal, showToast);
      });
    });

    document.getElementById('rd-del').addEventListener('click', () => {
      openModal(`
        <h2 class="modal-title text-danger">Eliminar review</h2>
        <p class="mb-2">¿Eliminar esta review permanentemente?</p>
        <div class="flex gap-1" style="justify-content:flex-end;margin-top:24px">
          <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-danger" id="confirm-del-rd">Eliminar</button>
        </div>
      `);
      document.getElementById('confirm-del-rd').addEventListener('click', async () => {
        try {
          await api.deleteReview(id);
          closeModal();
          showToast('Review eliminada', 'success');
          window.location.hash = '#/reviews';
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
        <a href="#/reviews" class="btn btn-secondary mt-2">Volver</a>
      </div>
    `;
  }
}

export function renderReviewForm(review = null) {
  const isEdit = !!review;
  return `
    <h2 class="modal-title">${isEdit ? 'Editar' : 'Nueva'} review</h2>
    <form id="review-form" class="form-grid">
      ${!isEdit ? `
        <div class="form-group">
          <label class="form-label">ID *</label>
          <input type="number" name="id" class="form-input" required min="1">
        </div>
      ` : ''}
      <div class="form-group">
        <label class="form-label">Game ID *</label>
        <input type="number" name="gameId" class="form-input" required min="1" value="${review?.gameId ?? ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Nombre del juego *</label>
        <input type="text" name="gameName" class="form-input" required value="${escapeHtml(review?.gameName || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Usuario</label>
        <input type="text" name="user" class="form-input" value="${escapeHtml(review?.user || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">Rating * (1-5)</label>
        <input type="number" name="rating" class="form-input" required min="1" max="5" value="${review?.rating ?? ''}">
      </div>
      <div class="form-group full">
        <label class="form-label">Comentario *</label>
        <textarea name="comment" class="form-textarea" required rows="4">${escapeHtml(review?.comment || '')}</textarea>
      </div>
      <div class="form-group full" style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar cambios' : 'Crear review'}</button>
      </div>
    </form>
  `;
}

function bindReviewForm(form, onSubmit) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = {};
    fd.forEach((v, k) => {
      if (['id', 'gameId', 'rating'].includes(k)) body[k] = v ? Number(v) : undefined;
      else body[k] = v || undefined;
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
