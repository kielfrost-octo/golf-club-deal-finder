import { WORKER_URL } from './config.js';

export class SearchError extends Error {}

/**
 * @param {string} term free-text search term
 * @param {string} category club category (driver, putter, iron, wedge, hybrid, wood)
 * @param {{signal?: AbortSignal}} [opts]
 * @returns {Promise<Array<{title: string, price: number, currency: string, condition: string, imageUrl: string|null, itemWebUrl: string}>>}
 */
export async function searchClubs(term, category, opts = {}) {
  const params = new URLSearchParams({ q: term ?? '', category: category ?? '' });
  const url = `${WORKER_URL}/search?${params.toString()}`;

  let response;
  try {
    response = await fetch(url, { signal: opts.signal });
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause;
    throw new SearchError('Could not reach the search service. Please try again.', { cause });
  }

  if (!response.ok) {
    throw new SearchError(`Search failed (${response.status}).`);
  }

  const data = await response.json();
  return Array.isArray(data?.items) ? data.items : [];
}
