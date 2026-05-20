const API_BASE = 'http://localhost:3001';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const contentType = res.headers.get('content-type') || '';
  let data;

  if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
    data = await res.text();
  } else {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const err = new Error(data?.message || `Error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

function withQuery(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return qs ? `${path}?${qs}` : path;
}

export const checkHealth = () => request('/');

export const getGames = (params = {}) => {
  return request(withQuery('/games', params));
};

export const getGame = (id) => request(`/games/${id}`);
export const getGameCountry = (id) => request(`/games/${id}/country`);
export const getGameReviews = (id) => request(`/games/${id}/reviews`);
export const getGameEnriched = (id) => request(`/games/${id}/enriched`);
export const createGame = (body) => request('/games', { method: 'POST', body: JSON.stringify(body) });
export const updateGame = (id, body) => request(`/games/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteGame = (id) => request(`/games/${id}`, { method: 'DELETE' });

export const getDevelopers = (params = {}) => {
  return request(withQuery('/developers', params));
};

export const getDeveloper = (id) => request(`/developers/${id}`);
export const createDeveloper = (body) => request('/developers', { method: 'POST', body: JSON.stringify(body) });
export const updateDeveloper = (id, body) => request(`/developers/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteDeveloper = (id) => request(`/developers/${id}`, { method: 'DELETE' });

export const getReviews = (params = {}) => {
  return request(withQuery('/reviews', params));
};

export const getReviewsByGame = (gameId) => request(`/reviews/game/${gameId}`);
export const createReview = (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) });
export const updateReview = (id, body) => request(`/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deleteReview = (id) => request(`/reviews/${id}`, { method: 'DELETE' });

export const getCountries = (params = {}) => {
  return request(withQuery('/countries', params));
};
