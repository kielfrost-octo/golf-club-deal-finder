const EBAY_TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const EBAY_SEARCH_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
const EBAY_SCOPE = 'https://api.ebay.com/oauth/api_scope';

// eBay Golf Clubs category is 115280; refine with keywords per club type.
const CATEGORY_KEYWORDS = {
  driver: 'golf driver',
  putter: 'golf putter',
  iron: 'golf irons',
  wedge: 'golf wedge',
  hybrid: 'golf hybrid',
  wood: 'golf fairway wood',
};
const GOLF_CLUBS_CATEGORY_ID = '115280';

let cachedToken = null; // { value, expiresAt }

async function getAccessToken(env) {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const credentials = btoa(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`);
  const response = await fetch(EBAY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: EBAY_SCOPE,
    }),
  });

  if (!response.ok) {
    throw new Error(`eBay OAuth failed (${response.status})`);
  }

  const data = await response.json();
  cachedToken = {
    value: data.access_token,
    // Refresh a little early to avoid edge-of-expiry failures.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

function buildSearchQuery(term, category) {
  const parts = [];
  if (term) parts.push(term);
  parts.push(CATEGORY_KEYWORDS[category] ?? 'golf club');
  return parts.join(' ');
}

async function searchEbay(env, term, category) {
  const token = await getAccessToken(env);
  const params = new URLSearchParams({
    q: buildSearchQuery(term, category),
    category_ids: GOLF_CLUBS_CATEGORY_ID,
    limit: '30',
  });

  const response = await fetch(`${EBAY_SEARCH_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    },
  });

  if (!response.ok) {
    throw new Error(`eBay search failed (${response.status})`);
  }

  const data = await response.json();
  return (data.itemSummaries ?? []).map((item) => ({
    title: item.title,
    price: item.price?.value != null ? Number(item.price.value) : null,
    currency: item.price?.currency ?? 'USD',
    condition: item.condition ?? '',
    imageUrl: item.image?.imageUrl ?? null,
    itemWebUrl: item.itemWebUrl,
  }));
}

function resolveAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const allowList = (env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  return origin && allowList.includes(origin) ? origin : allowList[0] ?? '';
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', resolveAllowedOrigin(request, env));
  headers.set('Vary', 'Origin');
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return withCors(
        new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }),
        request,
        env,
      );
    }

    if (url.pathname !== '/search') {
      return withCors(new Response('Not found', { status: 404 }), request, env);
    }

    const term = url.searchParams.get('q') ?? '';
    const category = url.searchParams.get('category') ?? '';

    try {
      const items = await searchEbay(env, term, category);
      return withCors(
        new Response(JSON.stringify({ items }), {
          headers: { 'Content-Type': 'application/json' },
        }),
        request,
        env,
      );
    } catch (error) {
      return withCors(
        new Response(JSON.stringify({ error: error.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }),
        request,
        env,
      );
    }
  },
};
