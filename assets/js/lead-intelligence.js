(function () {
  'use strict';

  var CONSENT = 'd2c_cookie_consent';
  var VISITOR = 'd2c_visitor_id';
  var SESSION = 'd2c_session_id';
  var LANDING = 'd2c_landing_page';
  var FIRST_TOUCH = 'd2c_first_touch';
  var IP_ENDPOINT = 'https://api64.ipify.org?format=json';
  var ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'fbclid', 'msclkid', 'ttclid', 'li_fat_id'];
  var cachedIp = null;
  var cachedGeo = null;

  function cookieFlags(days) {
    return '; path=/; max-age=' + (days * 24 * 60 * 60) + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }

  function setCookie(name, value, days) {
    document.cookie = name + '=' + encodeURIComponent(value) + cookieFlags(days);
  }

  function getCookie(name) {
    var escaped = name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&');
    var match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function getJSONCookie(name) {
    try {
      var value = getCookie(name);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function consent() {
    return getCookie(CONSENT) || 'unknown';
  }

  function uid(prefix) {
    var value = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2);
    return prefix + '_' + value;
  }

  function currentAttribution() {
    var params = new URLSearchParams(location.search);
    return ATTR_KEYS.reduce(function (acc, key) {
      var value = params.get(key);
      if (value) acc[key] = value;
      return acc;
    }, {});
  }

  function ensureCookies() {
    if (consent() !== 'accepted') {
      return { visitorId: null, sessionId: null, landingPage: null, firstTouch: null };
    }

    var visitorId = getCookie(VISITOR) || uid('visitor');
    var sessionId = getCookie(SESSION) || uid('session');
    var landingPage = getCookie(LANDING) || location.href;
    var firstTouch = getJSONCookie(FIRST_TOUCH);
    var attr = currentAttribution();

    setCookie(VISITOR, visitorId, 180);
    setCookie(SESSION, sessionId, 1);
    setCookie(LANDING, landingPage, 30);

    if (!firstTouch && Object.keys(attr).length) {
      firstTouch = Object.assign({}, attr, {
        captured_at: new Date().toISOString(),
        landing_page: landingPage,
        referrer: document.referrer || null
      });
      setCookie(FIRST_TOUCH, JSON.stringify(firstTouch), 180);
    }

    return { visitorId: visitorId, sessionId: sessionId, landingPage: landingPage, firstTouch: firstTouch };
  }

  function primeIp() {
    if (consent() !== 'accepted' || cachedIp) return;
    var controller = window.AbortController ? new AbortController() : null;
    var timeout = controller ? setTimeout(function () { controller.abort(); }, 1400) : null;
    fetch(IP_ENDPOINT, { cache: 'no-store', signal: controller ? controller.signal : undefined })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        cachedIp = { public_ip: data && data.ip ? data.ip : null, ip_source: data && data.ip ? 'api64.ipify.org' : 'unavailable' };
      })
      .catch(function () {
        cachedIp = { public_ip: null, ip_source: 'unavailable' };
      })
      .finally(function () {
        if (timeout) clearTimeout(timeout);
      });
  }

  function primeGeo() {
    if (consent() !== 'accepted' || cachedGeo || !navigator.geolocation) return;
    if (!navigator.permissions || !navigator.permissions.query) {
      cachedGeo = geoFallback('unknown_not_requested');
      return;
    }
    navigator.permissions.query({ name: 'geolocation' })
      .then(function (permission) {
        if (permission.state !== 'granted') {
          cachedGeo = geoFallback(permission.state);
          return;
        }
        navigator.geolocation.getCurrentPosition(function (position) {
          cachedGeo = {
            geolocation_supported: true,
            geolocation_permission: 'granted',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy_meters: position.coords.accuracy
          };
        }, function () {
          cachedGeo = geoFallback('unavailable');
        }, { enableHighAccuracy: false, timeout: 1400, maximumAge: 600000 });
      })
      .catch(function () {
        cachedGeo = geoFallback('unknown_not_requested');
      });
  }

  function geoFallback(state) {
    return {
      geolocation_supported: Boolean(navigator.geolocation),
      geolocation_permission: state,
      latitude: null,
      longitude: null,
      accuracy_meters: null
    };
  }

  function primeSignals() {
    if (consent() === 'accepted') {
      primeIp();
      primeGeo();
    }
  }

  function networkSnapshot() {
    if (cachedIp) return cachedIp;
    return {
      public_ip: null,
      ip_source: consent() === 'accepted' ? 'pending_or_unavailable' : 'not_collected_without_cookie_consent'
    };
  }

  function geoSnapshot() {
    if (cachedGeo) return cachedGeo;
    return geoFallback(consent() === 'accepted' ? 'pending_or_not_granted' : 'not_collected_without_cookie_consent');
  }

  function connectionInfo() {
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return null;
    return {
      effective_type: connection.effectiveType || null,
      downlink_mbps: typeof connection.downlink === 'number' ? connection.downlink : null,
      rtt_ms: typeof connection.rtt === 'number' ? connection.rtt : null,
      save_data: Boolean(connection.saveData)
    };
  }

  function deviceInfo() {
    return {
      user_agent: navigator.userAgent || null,
      platform: navigator.platform || null,
      vendor: navigator.vendor || null,
      language: navigator.language || null,
      languages: navigator.languages ? navigator.languages.join(',') : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      timezone_offset_minutes: new Date().getTimezoneOffset(),
      viewport_width: innerWidth,
      viewport_height: innerHeight,
      screen_width: screen ? screen.width : null,
      screen_height: screen ? screen.height : null,
      color_depth: screen ? screen.colorDepth : null,
      device_pixel_ratio: devicePixelRatio || 1,
      max_touch_points: navigator.maxTouchPoints || 0,
      hardware_concurrency: navigator.hardwareConcurrency || null,
      device_memory_gb: navigator.deviceMemory || null,
      connection: connectionInfo(),
      cookies_enabled: navigator.cookieEnabled,
      do_not_track: navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack || null,
      online: navigator.onLine,
      webdriver: Boolean(navigator.webdriver)
    };
  }

  function formContext(form) {
    var service = form.querySelector('[name="servico"], [name="service_area"]');
    var isContact = form.id === 'contactForm' || form.getAttribute('name') === 'contactForm';
    return {
      type: isContact ? 'contact' : (form.id === 'serviceForm' ? 'service' : 'lead'),
      service_area: service ? service.value : null
    };
  }

  function metadata(form) {
    var tracking = ensureCookies();
    var ctx = formContext(form);
    return {
      schema: 'data2comms.lead_context.v1',
      captured_at: new Date().toISOString(),
      consent: { cookies: consent() },
      form: {
        id: form.id || null,
        name: form.getAttribute('name') || null,
        type: ctx.type,
        service_area: ctx.service_area
      },
      visitor: {
        visitor_id: tracking.visitorId,
        session_id: tracking.sessionId
      },
      page: {
        title: document.title,
        url: location.href,
        path: location.pathname,
        referrer: document.referrer || null,
        landing_page: tracking.landingPage || location.href
      },
      attribution: {
        current: currentAttribution(),
        first_touch: tracking.firstTouch
      },
      device: deviceInfo(),
      network: networkSnapshot(),
      geolocation: geoSnapshot()
    };
  }

  function flat(data) {
    var connection = data.device.connection || {};
    return {
      meta_schema: data.schema,
      meta_captured_at: data.captured_at,
      meta_cookie_consent: data.consent.cookies,
      meta_visitor_id: data.visitor.visitor_id,
      meta_session_id: data.visitor.session_id,
      meta_form_id: data.form.id,
      meta_form_type: data.form.type,
      meta_service_area: data.form.service_area,
      meta_page_url: data.page.url,
      meta_page_path: data.page.path,
      meta_page_title: data.page.title,
      meta_referrer: data.page.referrer,
      meta_landing_page: data.page.landing_page,
      meta_utm_source: data.attribution.current.utm_source,
      meta_utm_medium: data.attribution.current.utm_medium,
      meta_utm_campaign: data.attribution.current.utm_campaign,
      meta_utm_term: data.attribution.current.utm_term,
      meta_utm_content: data.attribution.current.utm_content,
      meta_gclid: data.attribution.current.gclid,
      meta_fbclid: data.attribution.current.fbclid,
      meta_public_ip: data.network.public_ip,
      meta_ip_source: data.network.ip_source,
      meta_geo_permission: data.geolocation.geolocation_permission,
      meta_geo_latitude: data.geolocation.latitude,
      meta_geo_longitude: data.geolocation.longitude,
      meta_geo_accuracy_meters: data.geolocation.accuracy_meters,
      meta_user_agent: data.device.user_agent,
      meta_platform: data.device.platform,
      meta_language: data.device.language,
      meta_languages: data.device.languages,
      meta_timezone: data.device.timezone,
      meta_timezone_offset_minutes: data.device.timezone_offset_minutes,
      meta_viewport: data.device.viewport_width + 'x' + data.device.viewport_height,
      meta_screen: data.device.screen_width + 'x' + data.device.screen_height,
      meta_device_pixel_ratio: data.device.device_pixel_ratio,
      meta_touch_points: data.device.max_touch_points,
      meta_hardware_concurrency: data.device.hardware_concurrency,
      meta_device_memory_gb: data.device.device_memory_gb,
      meta_connection_type: connection.effective_type,
      meta_connection_downlink_mbps: connection.downlink_mbps,
      meta_connection_rtt_ms: connection.rtt_ms,
      meta_save_data: connection.save_data,
      meta_do_not_track: data.device.do_not_track,
      meta_online: data.device.online,
      meta_webdriver: data.device.webdriver
    };
  }

  function hidden(form, name, value) {
    var field = form.querySelector('input[type="hidden"][name="' + name + '"][data-d2c-meta-field="true"]');
    if (!field) {
      field = document.createElement('input');
      field.type = 'hidden';
      field.name = name;
      field.setAttribute('data-d2c-meta-field', 'true');
      form.appendChild(field);
    }
    field.value = value == null ? '' : String(value);
  }

  function shouldTrack(form) {
    return form && (form.id === 'contactForm' || form.id === 'serviceForm' || form.getAttribute('name') === 'contactForm');
  }

  function writeMetadataToForm(form) {
    if (!shouldTrack(form)) return;
    var data = metadata(form);
    hidden(form, 'lead_metadata', JSON.stringify(data));
    Object.entries(flat(data)).forEach(function (entry) {
      var value = entry[1];
      if (value !== undefined && value !== null && value !== '') hidden(form, entry[0], value);
    });
  }

  function updateGtag(value) {
    if (typeof gtag !== 'function') return;
    gtag('consent', 'update', {
      analytics_storage: value === 'accepted' ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  function injectBannerCSS() {
    if (document.getElementById('d2c-cookie-style')) return;
    var style = document.createElement('style');
    style.id = 'd2c-cookie-style';
    style.textContent = '.d2c-cookie-banner{position:fixed;z-index:9999;left:16px;right:16px;bottom:16px;max-width:720px;margin:0 auto;background:#0A0A0A;color:#F2F0EB;border:1px solid #D6FF00;box-shadow:0 20px 60px rgba(10,10,10,.32);padding:18px;font-family:Inter,sans-serif}.d2c-cookie-banner__title{margin:0 0 8px;font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase}.d2c-cookie-banner__text{margin:0;color:rgba(242,240,235,.76);font-size:14px;line-height:1.55}.d2c-cookie-banner__actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.d2c-cookie-banner__button{min-height:44px;border:1px solid #D6FF00;padding:0 16px;font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}.d2c-cookie-banner__button--accept{background:#D6FF00;color:#0A0A0A}.d2c-cookie-banner__button--decline{background:transparent;color:#F2F0EB}@media(max-width:640px){.d2c-cookie-banner{left:10px;right:10px;bottom:10px;padding:16px}.d2c-cookie-banner__actions,.d2c-cookie-banner__button{width:100%}}';
    document.head.appendChild(style);
  }

  function showBanner() {
    if (consent() !== 'unknown' || document.getElementById('d2c-cookie-banner')) return;
    injectBannerCSS();
    var banner = document.createElement('section');
    banner.id = 'd2c-cookie-banner';
    banner.className = 'd2c-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Preferências de cookies e dados');
    banner.innerHTML = '<p class="d2c-cookie-banner__title">Cookies e inteligência de dados</p><p class="d2c-cookie-banner__text">Usamos cookies first-party para entender origem, sessão, dispositivo, IP público quando disponível e sinais técnicos dos contatos enviados. Isso ajuda a qualificar a conversa com a data2comms. Você pode recusar sem bloquear o formulário.</p><div class="d2c-cookie-banner__actions"><button type="button" class="d2c-cookie-banner__button d2c-cookie-banner__button--accept" data-d2c-cookie-accept>Aceitar cookies</button><button type="button" class="d2c-cookie-banner__button d2c-cookie-banner__button--decline" data-d2c-cookie-decline>Recusar</button></div>';
    banner.querySelector('[data-d2c-cookie-accept]').addEventListener('click', function () {
      setCookie(CONSENT, 'accepted', 180);
      ensureCookies();
      primeSignals();
      updateGtag('accepted');
      banner.remove();
    });
    banner.querySelector('[data-d2c-cookie-decline]').addEventListener('click', function () {
      setCookie(CONSENT, 'declined', 90);
      updateGtag('declined');
      banner.remove();
    });
    document.body.appendChild(banner);
  }

  window.Data2CommsLead = { writeMetadataToForm: writeMetadataToForm, showCookieBanner: showBanner, getConsent: consent };
  document.addEventListener('submit', function (event) { writeMetadataToForm(event.target); }, true);
  document.addEventListener('DOMContentLoaded', function () {
    if (consent() === 'accepted') {
      ensureCookies();
      primeSignals();
      updateGtag('accepted');
    } else {
      updateGtag(consent());
      showBanner();
    }
  });
}());
