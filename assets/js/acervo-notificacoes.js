/* Acervo Lula: preferências de avisos, verificações ao visitar e com a página aberta.
   O envio push com navegador fechado exige servidor e assinaturas Web Push. */
(function () {
  'use strict';
  var STORAGE_KEY = 'acervo-lula-notify-prefs-v1';
  var SNAP_KEY = 'acervo-lula-notify-snapshot-v1';
  var ALERTS_KEY = 'acervo-lula-notify-alerts-v1';
  var CHECK_EVERY_MS = 4 * 60 * 1000;
  var stateNames = {
    AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',
    DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',
    MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',
    PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',RJ:'Rio de Janeiro',
    RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',
    RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins'
  };
  var dialog = document.getElementById('noti-dialog');
  var launch = document.getElementById('noti-open');
  if (!dialog || !launch) return;
  var checkboxes = Array.prototype.slice.call(dialog.querySelectorAll('[name="noti-topic"]'));
  var locationPanel = document.getElementById('noti-locations');
  var statePanel = document.getElementById('noti-states');
  var cityPanel = document.getElementById('noti-cities');
  var citySearch = document.getElementById('noti-city-search');
  var status = document.getElementById('noti-status');
  var permissionInfo = document.getElementById('noti-permission-note');
  var enableBrowser = document.getElementById('noti-enable-browser');
  var badge = document.getElementById('noti-count');
  var newsPanel = document.getElementById('noti-news');
  var newsList = document.getElementById('noti-news-list');
  var prefs = readJSON(STORAGE_KEY, null);
  var selectedCities = [];
  var currentCards = collectCards(document);
  var availableCities = availableCityOptions(currentCards);
  var checkBusy = false;

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { status.textContent = 'Seu navegador bloqueou o armazenamento local. Permita dados do site para guardar suas preferências.'; return false; }
  }
  function removeJSON(key) {
    try { localStorage.removeItem(key); } catch (error) {}
  }
  function normalize(s) {
    return String(s || '').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function hashText(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }
  function collectCards(doc) {
    return Array.prototype.slice.call(doc.querySelectorAll('#digital a.link, #ferramentas a.link, #presencial a.link'))
      .map(function (a) {
        var section = a.closest('section');
        if (!section) return null;
        var sectionId = section.id;
        var title = (a.querySelector('strong') || a).textContent.trim().replace(/\s+/g, ' ');
        var meta = (a.querySelector('.link-meta') || a).textContent.trim().replace(/\s+/g, ' ');
        var parts = meta.split(/\s*·\s*/);
        var uf = sectionId === 'presencial' && /^[A-Z]{2}$/.test(parts[0] || '') ? parts[0] : '';
        var city = uf ? (parts[1] || '').trim() : '';
        var href = a.getAttribute('href') || '';
        var topic = sectionId === 'presencial' ? 'mobilizacoes'
          : /v[ií]deo|youtube|tiktok/i.test(meta + ' ' + title) ? 'videos'
          : sectionId === 'ferramentas' ? 'ferramentas' : 'grupos';
        return {
          id: hashText(sectionId + '|' + uf + '|' + city + '|' + title + '|' + href),
          topic: topic, uf: uf, city: city, title: title,
          label: uf ? city + ' (' + uf + '): ' + title : title,
          link: '/#' + sectionId
        };
      }).filter(Boolean);
  }
  function availableCityOptions(cards) {
    var unique = {};
    cards.forEach(function (card) {
      if (card.uf && card.city) unique[card.uf + '|' + normalize(card.city)] = {uf:card.uf,city:card.city};
    });
    return Object.keys(unique).map(function (k) { return unique[k]; }).sort(function (a,b) {
      return a.city.localeCompare(b.city,'pt-BR') || a.uf.localeCompare(b.uf);
    });
  }
  function prefTopics() {
    return checkboxes.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
  }
  function stateChoices() {
    return Array.prototype.slice.call(statePanel.querySelectorAll('input:checked')).map(function (c) { return c.value; });
  }
  function readPrefsFromForm() {
    return {enabled:true,topics:prefTopics(),states:stateChoices(),cities:selectedCities.slice(),savedAt:Date.now()};
  }
  function matches(card, userPrefs) {
    if (!userPrefs || !userPrefs.enabled || userPrefs.topics.indexOf(card.topic) < 0) return false;
    if (card.topic !== 'mobilizacoes') return true;
    if (userPrefs.states.length && userPrefs.states.indexOf(card.uf) < 0) return false;
    if (userPrefs.cities.length && userPrefs.cities.indexOf(card.uf + '|' + normalize(card.city)) < 0) return false;
    return true;
  }
  function renderStates() {
    Object.keys(stateNames).forEach(function (uf) {
      var label = document.createElement('label');
      label.className = 'noti-location-choice';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'noti-state';
      input.value = uf;
      input.checked = !!(prefs && prefs.states && prefs.states.indexOf(uf) >= 0);
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + uf + ' · ' + stateNames[uf]));
      statePanel.appendChild(label);
    });
    statePanel.addEventListener('change', function () {
      var states = stateChoices();
      selectedCities = selectedCities.filter(function (code) { return !states.length || states.indexOf(code.split('|')[0]) >= 0; });
      renderCities();
    });
  }
  function renderCities() {
    var states = stateChoices();
    var q = normalize(citySearch.value);
    cityPanel.textContent = '';
    var count = 0;
    var frag = document.createDocumentFragment();
    availableCities.forEach(function (entry) {
      if (states.length && states.indexOf(entry.uf) < 0) return;
      var code = entry.uf + '|' + normalize(entry.city);
      if (q && normalize(entry.city + ' ' + entry.uf).indexOf(q) < 0) return;
      count++;
      var label = document.createElement('label');
      label.className = 'noti-location-choice';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.value = code;
      input.checked = selectedCities.indexOf(code) >= 0;
      input.addEventListener('change', function () {
        if (input.checked && selectedCities.indexOf(code) < 0) selectedCities.push(code);
        if (!input.checked) selectedCities = selectedCities.filter(function (item) { return item !== code; });
      });
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + entry.city + ' · ' + entry.uf));
      frag.appendChild(label);
    });
    cityPanel.appendChild(frag);
    if (!count) {
      var empty = document.createElement('p');
      empty.className = 'noti-small';
      empty.textContent = 'Nenhuma cidade encontrada nesta lista. Selecione o estado para receber os novos atos da região.';
      cityPanel.appendChild(empty);
    }
  }
  function renderAlerts() {
    var alerts = readJSON(ALERTS_KEY, []);
    newsList.textContent = '';
    newsPanel.hidden = !alerts.length;
    badge.hidden = !alerts.length;
    if (alerts.length) badge.textContent = String(alerts.length);
    alerts.forEach(function (entry) {
      var item = document.createElement('li');
      var a = document.createElement('a');
      a.href = entry.link || '/';
      a.textContent = entry.label;
      a.addEventListener('click', function () { closeDialog(); });
      item.appendChild(a);
      newsList.appendChild(item);
    });
  }
  function toggleLocation() {
    locationPanel.hidden = !checkboxes.some(function (c) { return c.value === 'mobilizacoes' && c.checked; });
  }
  function updatePermission() {
    var supported = !!(window.isSecureContext && 'Notification' in window && 'serviceWorker' in navigator);
    var state = supported ? Notification.permission : 'unsupported';
    enableBrowser.disabled = !supported || state === 'denied' || state === 'granted';
    enableBrowser.textContent = state === 'granted' ? 'Avisos do navegador ativados ✓'
      : state === 'denied' ? 'Avisos bloqueados pelo navegador'
      : state === 'unsupported' ? 'Navegador não compatível' : 'Permitir avisos do navegador';
    permissionInfo.textContent = state === 'denied' ? 'O navegador bloqueou avisos. Para permitir novamente, altere as permissões nas configurações do site.'
      : state === 'granted' ? 'Permissão concedida. Os avisos automáticos funcionam enquanto este site está aberto.'
      : 'Você também pode ativar avisos do navegador. Por enquanto eles funcionam com a página aberta.';
  }
  function updateLaunch() {
    var enabled = prefs && prefs.enabled;
    launch.querySelector('.noti-launch-state').textContent = enabled ? 'Preferências salvas' : 'Escolher novidades';
  }
  function openDialog() {
    checkboxes.forEach(function (c) { c.checked = !!(prefs && prefs.topics && prefs.topics.indexOf(c.value) >= 0); });
    statePanel.querySelectorAll('input').forEach(function (input) {
      input.checked = !!(prefs && prefs.states && prefs.states.indexOf(input.value) >= 0);
    });
    selectedCities = (prefs && prefs.cities ? prefs.cities : []).slice();
    citySearch.value = '';
    toggleLocation(); renderCities(); updatePermission(); renderAlerts();
    status.textContent = '';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else { dialog.setAttribute('open',''); dialog.classList.add('noti-dialog-fallback'); }
    document.getElementById('noti-dialog-title').focus();
  }
  function closeDialog() {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else { dialog.removeAttribute('open'); dialog.classList.remove('noti-dialog-fallback'); }
  }
  function savePreferences() {
    var updated = readPrefsFromForm();
    if (!updated.topics.length) {
      status.textContent = 'Selecione ao menos um tipo de novidade.';
      return;
    }
    if (!saveJSON(STORAGE_KEY, updated)) return;
    prefs = updated;
    currentCards = collectCards(document);
    saveJSON(SNAP_KEY, currentCards.map(function(c) { return c.id; }));
    saveJSON(ALERTS_KEY, []);
    updateLaunch(); renderAlerts();
    status.textContent = 'Preferências salvas neste dispositivo. Confira a central quando voltar ao site.';
  }
  function disablePreferences() {
    prefs = null;
    removeJSON(STORAGE_KEY); removeJSON(SNAP_KEY); removeJSON(ALERTS_KEY);
    selectedCities = []; checkboxes.forEach(function(c) { c.checked = false; });
    statePanel.querySelectorAll('input').forEach(function(c) { c.checked = false; });
    toggleLocation(); renderCities(); renderAlerts(); updateLaunch();
    status.textContent = 'Avisos desta página desativados. A permissão geral do navegador pode ser revogada nas configurações do site.';
  }
  function sendBrowserAlert(newOnes) {
    if (!newOnes.length || !('Notification' in window) || Notification.permission !== 'granted') return;
    var title = newOnes.length === 1 ? 'Nova atualização no Acervo Lula' : newOnes.length + ' novidades no Acervo Lula';
    var body = newOnes.length === 1 ? newOnes[0].label : newOnes[0].label + ' e outras novidades.';
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/acervo-notificacoes-sw.js', {scope:'/'})
        .then(function(reg) { return reg.showNotification(title,{body:body,tag:'acervo-lula-updates',data:{url:'/'}}); })
        .catch(function() { /* O painel na página continua mostrando as novidades. */ });
    }
  }
  function handleNewCards(cards) {
    if (!prefs || !prefs.enabled) return;
    var previous = readJSON(SNAP_KEY, null);
    var allIds = cards.map(function (card) { return card.id; });
    if (!previous || !Array.isArray(previous)) {
      saveJSON(SNAP_KEY, allIds);
      return;
    }
    var ids = new Set(previous);
    var updated = cards.filter(function(c) { return !ids.has(c.id) && matches(c,prefs); });
    saveJSON(SNAP_KEY, allIds);
    if (!updated.length) return;
    var alerts = updated.map(function(c) { return {id:c.id,label:c.label,link:c.link,time:Date.now()}; })
      .concat(readJSON(ALERTS_KEY, [])).slice(0,20);
    saveJSON(ALERTS_KEY, alerts);
    renderAlerts();
    sendBrowserAlert(updated);
    if (!dialog.open) launch.classList.add('noti-has-news');
  }
  function pollUpdates() {
    if (checkBusy || !prefs || !prefs.enabled || document.visibilityState !== 'visible') return;
    checkBusy = true;
    fetch('/?acervo_novidades=' + Date.now(), {cache:'no-store',credentials:'same-origin'})
      .then(function(response) { if (!response.ok) throw new Error('HTTP '+response.status); return response.text(); })
      .then(function(html) {
        var parsed = new DOMParser().parseFromString(html,'text/html');
        var cards = collectCards(parsed);
        if (cards.length < 10) return;
        availableCities = availableCityOptions(cards);
        handleNewCards(cards);
      }).catch(function() { /* Falha de rede não desativa preferências. */ })
      .finally(function() { checkBusy = false; });
  }

  renderStates();
  renderCities();
  updateLaunch();
  renderAlerts();
  if (prefs && prefs.enabled) handleNewCards(currentCards);

  launch.addEventListener('click', openDialog);
  document.getElementById('noti-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', function(event) { if (event.target === dialog) closeDialog(); });
  checkboxes.forEach(function(c) { c.addEventListener('change', toggleLocation); });
  citySearch.addEventListener('input', renderCities);
  document.getElementById('noti-save').addEventListener('click', savePreferences);
  document.getElementById('noti-disable').addEventListener('click', disablePreferences);
  document.getElementById('noti-clear-news').addEventListener('click', function() {
    saveJSON(ALERTS_KEY, []); renderAlerts(); launch.classList.remove('noti-has-news');
  });
  enableBrowser.addEventListener('click', function () {
    if (!window.isSecureContext || !('Notification' in window)) { updatePermission(); return; }
    Notification.requestPermission().then(function() {
      updatePermission();
      if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/acervo-notificacoes-sw.js',{scope:'/'})
          .catch(function() { permissionInfo.textContent = 'Permissão concedida, mas o serviço de avisos não pôde ser preparado.'; });
      }
    }).catch(updatePermission);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') pollUpdates();
  });
  window.addEventListener('focus', pollUpdates);
  window.setInterval(pollUpdates, CHECK_EVERY_MS);
})();
