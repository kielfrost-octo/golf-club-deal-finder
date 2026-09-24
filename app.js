import { searchClubs, SearchError } from './api.js';
import { renderCompact, renderGrid } from './render.js';
import { UI_VARIANT } from './config.js';

const form = document.querySelector('#search-form');
const termInput = document.querySelector('#search-term');
const categorySelect = document.querySelector('#search-category');
const resultsContainer = document.querySelector('#results-container');
const statusEl = document.querySelector('#status');

const renderResults = UI_VARIANT === 'grid' ? renderGrid : renderCompact;

let activeController = null;

function setStatus(message) {
  statusEl.textContent = message ?? '';
}

function clearResults() {
  resultsContainer.replaceChildren();
}

async function handleSearch(event) {
  event.preventDefault();

  activeController?.abort();
  activeController = new AbortController();

  const term = termInput.value.trim();
  const category = categorySelect.value;

  clearResults();
  setStatus('Searching…');

  try {
    const results = await searchClubs(term, category, { signal: activeController.signal });

    if (results.length === 0) {
      setStatus('No listings found. Try a different search.');
      return;
    }

    setStatus(`${results.length} listing${results.length === 1 ? '' : 's'} found`);
    resultsContainer.replaceChildren(renderResults(results));
  } catch (error) {
    if (error?.name === 'AbortError') return;
    setStatus(error instanceof SearchError ? error.message : 'Something went wrong. Please try again.');
  }
}

form.addEventListener('submit', handleSearch);
