import * as api from "./api.js";
import { renderGamesList, renderGameDetail } from "./games.js";
import { renderDevelopersList, renderDeveloperDetail } from "./developers.js";
import { renderReviewsList, renderReviewDetail } from "./reviews.js";
import { renderCountriesList } from "./countries.js";
import { escapeHtml, buildRating, routeParam } from "./utils.js";

const app = document.getElementById("app");
const modalOverlay = document.getElementById("modal-overlay");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");
const toastContainer = document.getElementById("toast-container");
const apiStatusDot = document.getElementById("api-status");
const apiStatusText = document.getElementById("api-status-text");

function starRating(rating) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return "★".repeat(value) + "☆".repeat(5 - value);
}

async function checkApiStatus() {
  try {
    await api.checkHealth();
    apiStatusDot.className = "status-dot online";
    apiStatusText.textContent = "API Online";
  } catch {
    apiStatusDot.className = "status-dot offline";
    apiStatusText.textContent = "API Offline";
  }
}
checkApiStatus();
setInterval(checkApiStatus, 15000);

export function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      ${
        type === "success"
          ? '<path d="M20 6L9 17l-5-5"/>'
          : type === "error"
            ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
            : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
      }
    </svg>
    <span>${escapeHtml(message)}</span>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

export function openModal(contentHTML) {
  modalBody.innerHTML = contentHTML;
  modalOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

export function closeModal() {
  modalOverlay.classList.add("hidden");
  modalBody.innerHTML = "";
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function setActiveNav(route) {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === route);
  });
}

const routes = {
  "": renderHome,
  home: renderHome,
  games: renderGames,
  developers: renderDevelopers,
  reviews: renderReviews,
  countries: renderCountries,
};

function parseHash() {
  const hash = window.location.hash.replace("#/", "").replace("#", "");
  const parts = hash.split("/").filter(Boolean);
  return { route: parts[0] || "home", params: parts.slice(1) };
}

async function router() {
  const { route, params } = parseHash();
  setActiveNav(route);
  window.scrollTo(0, 0);

  const handler = routes[route];
  if (handler) {
    app.innerHTML =
      '<div class="empty-state"><div class="skeleton" style="width:120px;height:24px;margin:0 auto 16px;"></div><div class="skeleton" style="width:200px;height:16px;margin:0 auto;"></div></div>';
    try {
      await handler(params);
    } catch (err) {
      app.innerHTML = `
        <div class="empty-state">
          <h3>Error al cargar</h3>
          <p>${escapeHtml(err.message || "No se pudo cargar la vista.")}</p>
        </div>
      `;
    }
  } else {
    app.innerHTML = `
      <div class="empty-state">
        <h3>Página no encontrada</h3>
        <p>La ruta solicitada no existe en esta aplicación.</p>
        <a href="#/" class="btn btn-primary mt-2">Volver al inicio</a>
      </div>
    `;
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("load", router);


async function renderHome() {
  app.innerHTML = `
    <h1 class="page-title">Panel de control</h1>
    <p class="page-subtitle">Resumen en tiempo real de la base de datos de SW-II.</p>
    <div class="stats-grid" id="stats-grid">
      <div class="stat-card"><div class="skeleton" style="height:60px"></div></div>
      <div class="stat-card"><div class="skeleton" style="height:60px"></div></div>
      <div class="stat-card"><div class="skeleton" style="height:60px"></div></div>
      <div class="stat-card"><div class="skeleton" style="height:60px"></div></div>
    </div>
    
    <div class="form-grid" style="margin-top: 48px;">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;">
          <h3 class="section-title" style="margin-bottom:0">Últimos Videojuegos</h3>
          <a href="#/games" class="btn btn-ghost btn-sm">Ver todos →</a>
        </div>
        <div id="latest-games" style="display:flex;flex-direction:column;gap:16px;">
          <div class="skeleton" style="height:80px;border-radius:0"></div>
          <div class="skeleton" style="height:80px;border-radius:0"></div>
          <div class="skeleton" style="height:80px;border-radius:0"></div>
        </div>
      </div>
      
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;">
          <h3 class="section-title" style="margin-bottom:0">Reviews Recientes</h3>
          <a href="#/reviews" class="btn btn-ghost btn-sm">Ver todas →</a>
        </div>
        <div id="recent-reviews" style="display:flex;flex-direction:column;gap:16px;">
          <div class="skeleton" style="height:80px;border-radius:0"></div>
          <div class="skeleton" style="height:80px;border-radius:0"></div>
          <div class="skeleton" style="height:80px;border-radius:0"></div>
        </div>
      </div>
    </div>
  `;

  const grid = document.getElementById("stats-grid");
  const latestGames = document.getElementById("latest-games");
  const recentReviews = document.getElementById("recent-reviews");

  try {
    const [gamesData, devData, revData, topGames] = await Promise.all([
      api.getGames({ limit: 1 }),
      api.getDevelopers({ limit: 1 }),
      api.getReviews({ limit: 4 }),
      api.getGames({ limit: 4 }),
    ]);

    grid.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${gamesData.total ?? gamesData.videogames_length ?? "—"}</div>
        <div class="stat-label">Videojuegos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${devData.total ?? devData.developers_length ?? "—"}</div>
        <div class="stat-label">Estudios</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${revData.total ?? "—"}</div>
        <div class="stat-label">Reviews</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${gamesData.videogames?.[0]?.platforms?.length ?? "—"}</div>
        <div class="stat-label">Plataformas</div>
      </div>
    `;

    const games = topGames.videogames || topGames.data || [];
    if (games.length === 0) {
      latestGames.innerHTML =
        '<div class="empty-state" style="padding:40px 20px;"><p>No hay juegos registrados.</p></div>';
    } else {
      latestGames.innerHTML = games
        .slice(0, 4)
        .map(
          (g) => `
        <a href="#/games/${routeParam(g.id)}" class="card" style="flex-direction:row;align-items:center;padding:16px;gap:16px;text-decoration:none">
          ${
            g.background_image
              ? `<img src="${escapeHtml(g.background_image)}" alt="" style="width:64px;height:64px;object-fit:cover;border:2px solid var(--border);">`
              : `<div style="width:64px;height:64px;background:var(--bg-tertiary);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:var(--text-muted)">SIN IMG</div>`
          }
          <div style="flex:1;min-width:0;">
            <div style="font-family:var(--font-display);font-size:1.1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(g.name || "Desconocido")}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${escapeHtml(g.released || "Fecha desconocida")}</div>
          </div>
          ${buildRating(g.rating) || '<div class="badge">-</div>'}
        </a>
      `,
        )
        .join("");
    }

    const reviews = revData.reviews || revData.data || [];
    if (reviews.length === 0) {
      recentReviews.innerHTML =
        '<div class="empty-state" style="padding:40px 20px;"><p>No hay reviews registradas.</p></div>';
    } else {
      recentReviews.innerHTML = reviews
        .slice(0, 4)
        .map(
          (r) => `
        <a href="#/reviews/${routeParam(r.id)}" class="card" style="padding:16px;text-decoration:none">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-family:var(--font-display);color:var(--accent);font-size:1.1rem">${escapeHtml(r.user || "Anónimo")}</div>
            <div style="color:var(--accent3);letter-spacing:2px;font-size:1.2rem">${starRating(r.rating)}</div>
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">"${escapeHtml(r.comment || "Sin comentario")}"</div>
        </a>
      `,
        )
        .join("");
    }
  } catch (err) {
    grid.innerHTML = `<div class="stat-card" style="grid-column:1/-1"><div class="stat-label text-danger">Error de conexión</div><div class="stat-value">OFFLINE</div></div>`;
    latestGames.innerHTML = `<div class="empty-state"><p class="text-danger">No se pudo cargar</p></div>`;
    recentReviews.innerHTML = `<div class="empty-state"><p class="text-danger">No se pudo cargar</p></div>`;
  }
}

async function renderGames(params) {
  if (params.length === 0) {
    await renderGamesList(app, openModal, closeModal, showToast);
  } else {
    await renderGameDetail(app, params[0], openModal, closeModal, showToast);
  }
}

async function renderDevelopers(params) {
  if (params.length === 0) {
    await renderDevelopersList(app, openModal, closeModal, showToast);
  } else {
    await renderDeveloperDetail(
      app,
      params[0],
      openModal,
      closeModal,
      showToast,
    );
  }
}

async function renderReviews(params) {
  if (params.length === 0) {
    await renderReviewsList(app, openModal, closeModal, showToast);
  } else {
    await renderReviewDetail(app, params[0], openModal, closeModal, showToast);
  }
}

async function renderCountries() {
  await renderCountriesList(app, showToast);
}

window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
