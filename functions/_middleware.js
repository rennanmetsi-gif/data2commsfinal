const ACERVO_HOST = 'acervolula.com.br';
const ACERVO_WWW_HOST = 'www.acervolula.com.br';
const ACERVO_INDEX_PATHS = new Set(['/', '/index.html']);

function acervoRobots() {
  return new Response(
    'User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: https://acervolula.com.br/sitemap.xml\n',
    { headers: { 'content-type': 'text/plain; charset=UTF-8' } }
  );
}

function acervoSitemap() {
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      '  <url><loc>https://acervolula.com.br/</loc></url>\n' +
      '</urlset>\n',
    { headers: { 'content-type': 'application/xml; charset=UTF-8' } }
  );
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === ACERVO_WWW_HOST) {
    url.hostname = ACERVO_HOST;
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  if (url.hostname === ACERVO_HOST && url.pathname === '/robots.txt') {
    return acervoRobots();
  }
  if (url.hostname === ACERVO_HOST && url.pathname === '/sitemap.xml') {
    return acervoSitemap();
  }

  const response = await context.next();
  if (url.hostname !== ACERVO_HOST) return response;

  const headers = new Headers(response.headers);
  if (ACERVO_INDEX_PATHS.has(url.pathname)) {
    headers.set('Link', '<https://acervolula.com.br/>; rel="canonical"');
  } else if ((headers.get('content-type') || '').includes('text/html')) {
    // As paginas institucionais continuam acessiveis, mas pertencem ao dominio
    // historico da Data2Comms e nao devem disputar indexacao no novo dominio.
    headers.set('X-Robots-Tag', 'noindex, follow');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
