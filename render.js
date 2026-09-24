function formatPrice(item) {
  if (item.price == null) return 'N/A';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: item.currency ?? 'USD' }).format(item.price);
}

function itemCardHtml(item, { showImage }) {
  const image = showImage
    ? `<img class="item-thumb" src="${item.imageUrl ?? ''}" alt="" loading="lazy" onerror="this.style.display='none'">`
    : '';
  return `
    <a class="item-card" href="${item.itemWebUrl}" target="_blank" rel="noopener noreferrer">
      ${image}
      <div class="item-body">
        <p class="item-title">${item.title}</p>
        <p class="item-meta">
          <span class="item-price">${formatPrice(item)}</span>
          <span class="item-condition">${item.condition ?? ''}</span>
        </p>
      </div>
    </a>
  `;
}

/** @param {Array} results */
export function renderCompact(results) {
  const list = document.createElement('div');
  list.className = 'results results--compact';
  list.innerHTML = results.map((item) => itemCardHtml(item, { showImage: false })).join('');
  return list;
}

/** @param {Array} results */
export function renderGrid(results) {
  const grid = document.createElement('div');
  grid.className = 'results results--grid';
  grid.innerHTML = results.map((item) => itemCardHtml(item, { showImage: true })).join('');
  return grid;
}
