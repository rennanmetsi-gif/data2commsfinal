(function () {
  'use strict';

  if (window.__d2cLeadFormDataBridgeInstalled || typeof window.FormData !== 'function') return;

  const NativeFormData = window.FormData;

  function shouldTrack(form) {
    return form && (form.id === 'contactForm' || form.id === 'serviceForm' || form.getAttribute('name') === 'contactForm');
  }

  function readMetadata(formData) {
    const raw = formData.get('lead_metadata');
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function line(label, value) {
    return `${label}: ${value == null ? '' : value}`;
  }

  function buildContext(metadata) {
    const connection = metadata.device && metadata.device.connection ? JSON.stringify(metadata.device.connection) : '';
    const current = metadata.attribution && metadata.attribution.current ? metadata.attribution.current : {};

    return [
      '--- CONTEXTO TECNICO DO LEAD ---',
      line('capturado_em', metadata.captured_at),
      line('consentimento_cookies', metadata.consent && metadata.consent.cookies),
      line('formulario', metadata.form && metadata.form.type),
      line('servico_area', metadata.form && metadata.form.service_area),
      line('pagina', metadata.page && metadata.page.url),
      line('origem_referrer', metadata.page && metadata.page.referrer),
      line('landing_page', metadata.page && metadata.page.landing_page),
      line('utm_source', current.utm_source),
      line('utm_medium', current.utm_medium),
      line('utm_campaign', current.utm_campaign),
      line('gclid', current.gclid),
      line('fbclid', current.fbclid),
      line('visitor_id', metadata.visitor && metadata.visitor.visitor_id),
      line('session_id', metadata.visitor && metadata.visitor.session_id),
      line('ip_publico', metadata.network && metadata.network.public_ip),
      line('ip_fonte', metadata.network && metadata.network.ip_source),
      line('geo_permissao', metadata.geolocation && metadata.geolocation.geolocation_permission),
      line('geo_latitude', metadata.geolocation && metadata.geolocation.latitude),
      line('geo_longitude', metadata.geolocation && metadata.geolocation.longitude),
      line('geo_precisao_metros', metadata.geolocation && metadata.geolocation.accuracy_meters),
      line('user_agent', metadata.device && metadata.device.user_agent),
      line('plataforma', metadata.device && metadata.device.platform),
      line('idioma', metadata.device && metadata.device.language),
      line('fuso', metadata.device && metadata.device.timezone),
      line('viewport', metadata.device ? `${metadata.device.viewport_width}x${metadata.device.viewport_height}` : ''),
      line('tela', metadata.device ? `${metadata.device.screen_width}x${metadata.device.screen_height}` : ''),
      line('touch_points', metadata.device && metadata.device.max_touch_points),
      line('memoria_gb', metadata.device && metadata.device.device_memory_gb),
      line('cpu_threads', metadata.device && metadata.device.hardware_concurrency),
      line('conexao', connection),
      line('do_not_track', metadata.device && metadata.device.do_not_track),
      line('lead_metadata_json', JSON.stringify(metadata))
    ].join('\n');
  }

  function appendContext(formData) {
    const metadata = readMetadata(formData);
    if (!metadata) return formData;

    const original = String(formData.get('desafio') || '').trim();
    if (original.includes('--- CONTEXTO TECNICO DO LEAD ---')) return formData;

    formData.set('desafio', `${original}\n\n${buildContext(metadata)}`.trim());
    return formData;
  }

  const D2CFormData = function (form) {
    if (shouldTrack(form) && window.Data2CommsLead && typeof window.Data2CommsLead.writeMetadataToForm === 'function') {
      window.Data2CommsLead.writeMetadataToForm(form);
    }

    const formData = new NativeFormData(form);
    return shouldTrack(form) ? appendContext(formData) : formData;
  };

  D2CFormData.prototype = NativeFormData.prototype;
  window.FormData = D2CFormData;
  window.__d2cLeadFormDataBridgeInstalled = true;
})();
