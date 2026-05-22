const viteApiUrl =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_MOVIES_API_URL
    ? import.meta.env.VITE_MOVIES_API_URL
    : undefined;

const legacyApiUrl =
  typeof process !== "undefined" && process.env?.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL
    : undefined;

const BASE_URL = viteApiUrl || legacyApiUrl || "http://localhost:8080/api/movies";

function normalizeTitleArticle(title) {
  if (typeof title !== "string") {
    return title;
  }

  const match = title.match(/^(.*),\s*(The|A|An)$/i);
  if (!match) {
    return title;
  }

  const rawName = match[1]?.trim();
  const rawArticle = match[2]?.trim();
  if (!rawName || !rawArticle) {
    return title;
  }

  const article = rawArticle[0].toUpperCase() + rawArticle.slice(1).toLowerCase();
  return `${article} ${rawName}`;
}

function normalizeMoviePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeMoviePayload(item));
  }

  if ("titleClean" in payload) {
    return {
      ...payload,
      titleClean: normalizeTitleArticle(payload.titleClean),
    };
  }

  return payload;
}

async function apiFetch(path) {
  try {
    const res = await fetch(BASE_URL + path);
    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }
    const payload = await res.json();
    return normalizeMoviePayload(payload);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown API error");
  }
}

export const getPopularMovies = () => apiFetch("/popular");
export const searchMovies = (q) =>
  apiFetch(`/search?q=${encodeURIComponent(q)}`);
export const getMovieById = (id) => apiFetch(`/${id}`);
export const getRecommendations = (id) => apiFetch(`/${id}/recommendations`);
export const filterMovies = (params = {}) => {
  const qs = Object.entries(params)
    .filter(([_, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return apiFetch(`/filter${qs ? `?${qs}` : ""}`);
};
