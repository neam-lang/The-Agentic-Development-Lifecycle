/* The Agentic Development Lifecycle — reading behaviour.
   No dependencies. Everything degrades to a working static site if this
   file fails to load: navigation, figures and text never depend on it. */
(function () {
  'use strict';

  var BASE = document.body.getAttribute('data-base') || '';
  var K = {
    theme: 'adlc-theme',
    seen: 'adlc-seen',       // {href: timestamp} — chapters opened
    last: 'adlc-last',       // {href, title, pct} — for "continue reading"
    size: 'adlc-size'        // reading size step
  };

  function read(k, d) {
    try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; }
  }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  /* ---------- theme ---------- */

  var saved = localStorage.getItem(K.theme);
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  var tbtn = document.getElementById('theme-toggle');
  if (tbtn) tbtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : cur === 'light' ? 'dark'
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(K.theme, next);
  });

  /* ---------- reading size ---------- */

  var SIZES = ['s', 'm', 'l'];
  function applySize(s) {
    document.documentElement.setAttribute('data-size', s);
    localStorage.setItem(K.size, s);
  }
  applySize(localStorage.getItem(K.size) || 'm');

  var sbtn = document.getElementById('size-toggle');
  if (sbtn) sbtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-size') || 'm';
    applySize(SIZES[(SIZES.indexOf(cur) + 1) % SIZES.length]);
  });

  /* ---------- scroll progress, and where the reader stopped ---------- */

  var article = document.querySelector('article');
  var fill = document.querySelector('.progress-fill');

  if (article && fill) {
    var tick = false;
    function paint() {
      var top = article.offsetTop;
      var span = article.offsetHeight - window.innerHeight + 120;
      var pct = span > 0 ? (window.scrollY - top + 120) / span : 1;
      pct = Math.max(0, Math.min(1, pct));
      fill.style.width = (pct * 100).toFixed(1) + '%';
      var here = location.pathname.split('/').slice(-2).join('/');
      write(K.last, { href: here, title: document.title.split(' · ')[0], pct: pct });
      tick = false;
    }
    addEventListener('scroll', function () {
      if (!tick) { tick = true; requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }

  /* ---------- mark what has been opened ---------- */

  if (article) {
    var seen = read(K.seen, {});
    seen[location.pathname.split('/').slice(-2).join('/')] = Date.now();
    write(K.seen, seen);
  }

  var seenMap = read(K.seen, {});
  function isSeen(href) {
    var key = href.replace(/^\.\//, '');
    for (var k in seenMap) if (k.indexOf(key) !== -1 || key.indexOf(k) !== -1) return true;
    return false;
  }

  var cards = document.querySelectorAll('.card[href]');
  var done = 0;
  for (var i = 0; i < cards.length; i++) {
    if (isSeen(cards[i].getAttribute('href'))) { cards[i].classList.add('seen'); done++; }
  }

  /* ---------- index: overall progress and continue reading ---------- */

  var meter = document.getElementById('read-meter');
  if (meter && cards.length) {
    var pc = Math.round(done / cards.length * 100);
    meter.querySelector('.rm-fill').style.width = pc + '%';
    meter.querySelector('.rm-text').textContent =
      done + ' of ' + cards.length + ' opened · ' + pc + '%';
  }

  var cont = document.getElementById('continue');
  if (cont) {
    var last = read(K.last, null);
    if (last && last.href) {
      var a = cont.querySelector('a');
      a.href = BASE + last.href;
      cont.querySelector('.cont-title').textContent = last.title;
      cont.querySelector('.cont-pct').textContent = Math.round(last.pct * 100) + '% through';
      cont.hidden = false;
    }
  }

  /* ---------- previous / next by keyboard ---------- */

  function go(sel) {
    var el = document.querySelector(sel);
    if (el) location.href = el.href;
  }
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = (e.target.tagName || '').toLowerCase();
    if (t === 'input' || t === 'textarea') return;
    if (e.key === 'ArrowLeft') go('.ch-nav a:not(.next)');
    if (e.key === 'ArrowRight') go('.ch-nav a.next');
  });

  /* ---------- search ---------- */

  var overlay = document.getElementById('search');
  if (!overlay) return;

  var input = overlay.querySelector('input');
  var results = overlay.querySelector('.sr-list');
  var hint = overlay.querySelector('.sr-hint');
  var index = null, loading = false;

  function load(cb) {
    if (index) return cb();
    if (loading) return;
    loading = true;
    hint.textContent = 'Loading the index…';
    fetch(BASE + 'assets/search.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { index = d; loading = false; hint.textContent = ''; cb(); })
      .catch(function () { loading = false; hint.textContent = 'Search index unavailable.'; });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function mark(text, terms) {
    var out = esc(text);
    terms.forEach(function (t) {
      if (t.length < 2) return;
      out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'),
                        '<mark>$1</mark>');
    });
    return out;
  }

  function run(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) { results.innerHTML = ''; hint.textContent = ''; return; }

    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var e = index[i];
      var hay = (e.t + ' ' + e.c + ' ' + e.x).toLowerCase();
      var score = 0, all = true;
      for (var j = 0; j < terms.length; j++) {
        var n = hay.split(terms[j]).length - 1;
        if (!n) { all = false; break; }
        score += n;
        if (e.t.toLowerCase().indexOf(terms[j]) !== -1) score += 20;  // title hits rank first
      }
      if (all) hits.push({ e: e, s: score });
    }
    hits.sort(function (a, b) { return b.s - a.s; });

    hint.textContent = hits.length
      ? hits.length + ' result' + (hits.length === 1 ? '' : 's')
      : 'No match.';

    results.innerHTML = hits.slice(0, 40).map(function (h) {
      var e = h.e;
      var where = e.x.toLowerCase().indexOf(terms[0]);
      var snip = where === -1 ? e.x.slice(0, 150)
        : e.x.slice(Math.max(0, where - 60), where + 110);
      return '<a class="sr-item" href="' + BASE + e.u + '">' +
             '<div class="sr-ch">' + esc(e.c) + '</div>' +
             '<div class="sr-t">' + mark(e.t, terms) + '</div>' +
             '<div class="sr-x">…' + mark(snip, terms) + '…</div></a>';
    }).join('');
  }

  var timer;
  input.addEventListener('input', function () {
    var q = input.value;
    clearTimeout(timer);
    timer = setTimeout(function () { load(function () { run(q); }); }, 90);
  });

  function open() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    input.focus();
    input.select();
    load(function () { if (input.value) run(input.value); });
  }
  function close() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  var sb = document.getElementById('search-btn');
  if (sb) sb.addEventListener('click', open);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  addEventListener('keydown', function (e) {
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault(); open(); return;
    }
    var t = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && t !== 'input' && t !== 'textarea') {
      e.preventDefault(); open(); return;
    }
    if (e.key === 'Escape' && !overlay.hidden) close();
    if (!overlay.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      var items = overlay.querySelectorAll('.sr-item');
      if (!items.length) return;
      var cur = document.activeElement;
      var idx = Array.prototype.indexOf.call(items, cur);
      var nxt = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
      if (nxt < 0) { input.focus(); return; }
      if (nxt >= items.length) nxt = items.length - 1;
      items[nxt].focus();
    }
  });
})();
