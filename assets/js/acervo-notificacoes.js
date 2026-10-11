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
  var status = document.getElementById('noti-status');
  var disableButton = document.getElementById('noti-disable');
  var badge = document.getElementById('noti-count');
  var newsPanel = document.getElementById('noti-news');
  var newsList = document.getElementById('noti-news-list');
  var prefs = readJSON(STORAGE_KEY, null);
  var currentCards = collectCards(document);
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
  function prefTopics() {
    return checkboxes.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
  }
  function stateChoices() {
    return Array.prototype.slice.call(statePanel.querySelectorAll('input:checked')).map(function (c) { return c.value; });
  }
  function readPrefsFromForm() {
    return {enabled:true,topics:prefTopics(),states:stateChoices(),cities:[],savedAt:Date.now()};
  }
  function matches(card, userPrefs) {
    if (!userPrefs || !userPrefs.enabled || userPrefs.topics.indexOf(card.topic) < 0) return false;
    if (card.topic !== 'mobilizacoes') return true;
    if (userPrefs.states.length && userPrefs.states.indexOf(card.uf) < 0) return false;
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
  function updateLaunch() {
    var enabled = prefs && prefs.enabled;
    launch.querySelector('.noti-launch-state').textContent = enabled && 'Notification' in window && Notification.permission === 'granted' ? 'Avisos ativados' : enabled ? 'Preferências salvas' : 'Escolher novidades';
  }
  function openDialog() {
    disableButton.hidden = !(prefs && prefs.enabled);
    checkboxes.forEach(function (c) { c.checked = !!(prefs && prefs.topics && prefs.topics.indexOf(c.value) >= 0); });
    statePanel.querySelectorAll('input').forEach(function (input) {
      input.checked = !!(prefs && prefs.states && prefs.states.indexOf(input.value) >= 0);
    });
    toggleLocation(); renderAlerts();
    status.textContent = '';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else { dialog.setAttribute('open',''); dialog.classList.add('noti-dialog-fallback'); }
    document.getElementById('noti-dialog-title').focus();
  }
  function closeDialog() {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else { dialog.removeAttribute('open'); dialog.classList.remove('noti-dialog-fallback'); }
  }
  function activateNotifications() {
    var updated = readPrefsFromForm();
    if (!updated.topics.length) {
      status.textContent = 'Escolha ao menos um tipo de novidade.';
      return;
    }
    if (!saveJSON(STORAGE_KEY, updated)) return;
    prefs = updated;
    currentCards = collectCards(document);
    saveJSON(SNAP_KEY, currentCards.map(function(c) { return c.id; }));
    saveJSON(ALERTS_KEY, []);
    renderAlerts();
    closeDialog(); // Fecha a central antes de chamar o aviso nativo, ainda no clique do visitante.
    updateLaunch();
    var hint = launch.closest('.noti-launch').querySelector('.noti-launch-copy small');
    if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator)) {
      hint.textContent = 'Preferências salvas. Avisos do navegador indisponíveis aqui.';
      return;
    }
    function finishPermission(permission) {
      updateLaunch();
      if (permission === 'granted') {
        hint.textContent = 'Avisos ativados com o site aberto.';
        navigator.serviceWorker.register('/acervo-notificacoes-sw.js', {scope:'/'})
          .catch(function() {hint.textContent='Preferências salvas. Não foi possível preparar os avisos.';});
      } else if (permission === 'denied') {
        hint.textContent = 'Permissão bloqueada. Libere nas configurações do navegador.';
      } else {
        hint.textContent = 'Preferências salvas. Você pode permitir avisos depois.';
      }
    }
    if (Notification.permission === 'default') {
      try {
        var result = Notification.requestPermission();
        if (result && typeof result.then === 'function') result.then(finishPermission).catch(function() {
          hint.textContent='Preferências salvas. Não foi possível pedir permissão.';
        });
        else if (typeof result === 'string') finishPermission(result);
      } catch (error) {
        hint.textContent = 'Preferências salvas. Não foi possível pedir permissão.';
      }
    } else {
      finishPermission(Notification.permission);
    }
  }
  function disablePreferences() {
    prefs = null;
    removeJSON(STORAGE_KEY); removeJSON(SNAP_KEY); removeJSON(ALERTS_KEY);
    checkboxes.forEach(function(c) { c.checked = false; });
    statePanel.querySelectorAll('input').forEach(function(c) { c.checked = false; });
    toggleLocation(); renderAlerts(); updateLaunch();
    disableButton.hidden = true;
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
        handleNewCards(cards);
      }).catch(function() { /* Falha de rede não desativa preferências. */ })
      .finally(function() { checkBusy = false; });
  }

  renderStates();
  updateLaunch();
  renderAlerts();
  if (prefs && prefs.enabled) handleNewCards(currentCards);

  launch.addEventListener('click', openDialog);
  document.getElementById('noti-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', function(event) { if (event.target === dialog) closeDialog(); });
  checkboxes.forEach(function(c) { c.addEventListener('change', toggleLocation); });
  document.getElementById('noti-activate').addEventListener('click', activateNotifications);
  document.getElementById('noti-disable').addEventListener('click', disablePreferences);
  document.getElementById('noti-clear-news').addEventListener('click', function() {
    saveJSON(ALERTS_KEY, []); renderAlerts(); launch.classList.remove('noti-has-news');
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') pollUpdates();
  });
  window.addEventListener('focus', pollUpdates);
  window.setInterval(pollUpdates, CHECK_EVERY_MS);
})();
