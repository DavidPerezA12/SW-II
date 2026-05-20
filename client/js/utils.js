export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(
    /[&<>'"]/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m],
  );
}

export function routeParam(value) {
  return encodeURIComponent(String(value ?? ""));
}

export function buildRating(rating, compact = true) {
  const value = Number(rating);
  if (!Number.isFinite(value)) return "";

  const normalized = Math.max(0, Math.min(5, value));
  const display = normalized.toFixed(2).replace(/\.?0+$/, "");

  return `
    <span class="rating-pill${compact ? " compact" : ""}" style="--rating:${normalized * 20}%" aria-label="Valoración ${display} de 5">
      <div class="stars-wrapper">
        <div class="stars-empty">☆☆☆☆☆</div>
        <div class="stars-filled">★★★★★</div>
      </div>
      <span class="rating-value">${display}</span>
    </span>
  `;
}
