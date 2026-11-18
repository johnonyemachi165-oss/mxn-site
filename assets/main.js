/* MXN — interactions: menus, drawers, cookie consent, hero slider, tabs, scroll motion, filters. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  /* ---------- toast ---------- */
  var toastEl = $('.toast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------- overlays (drawers + modals) ---------- */
  var openStack = [];
  // every control that opens a panel says so (aria-haspopup / aria-expanded / aria-controls)
  $$('[data-open]').forEach(function (b) {
    var target = document.getElementById(b.getAttribute('data-open'));
    if (!target) return;
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', target.id);
  });
  function setExpanded(id, v) { $$('[data-open="' + id + '"]').forEach(function (b) { b.setAttribute('aria-expanded', v ? 'true' : 'false'); }); }
  function openOverlay(id, opener) {
    var el = document.getElementById(id);
    if (!el) return;
    closeMega();
    setExpanded(id, true);
    el.hidden = false;
    el._opener = opener || document.activeElement;
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('open'); }); });
    if (openStack.indexOf(el) === -1) openStack.push(el);
    document.body.classList.add('overlay-open');
    var focusable = el.querySelector('input:not([disabled]), button, a[href]');
    setTimeout(function () { if (focusable) focusable.focus({ preventScroll: true }); }, 60);
  }
  function closeOverlay(el) {
    el = el || openStack[openStack.length - 1];
    if (!el) return;
    el.classList.remove('open');
    setExpanded(el.id, false);
    openStack.splice(openStack.indexOf(el), 1);
    setTimeout(function () { if (!el.classList.contains('open')) el.hidden = true; }, 450);
    if (!openStack.length) document.body.classList.remove('overlay-open');
    if (el._opener && el._opener.focus) el._opener.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open]');
    if (opener) {
      e.preventDefault();
      var id = opener.getAttribute('data-open');
      // one panel at a time: opening a new one closes the others
      openStack.slice().forEach(function (o) { if (o.id !== id) closeOverlay(o); });
      openOverlay(id, opener);
      return;
    }
    var closer = e.target.closest('[data-close]');
    if (closer) {
      var host = closer.closest('.drawer, .modal');
      if (closer.classList.contains('scrim')) { closeOverlay(); return; }
      closeOverlay(host);
      return;
    }
    // clicking the dimmed area around a modal card closes it
    if (e.target.classList && e.target.classList.contains('modal')) closeOverlay(e.target);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { openStack.slice().forEach(function (o) { closeOverlay(o); }); closeMega(); }
  });

  /* ---------- header: solid after scrolling past the hero ---------- */
  var header = $('.site-header');
  function onHeader() { if (header) header.classList.toggle('scrolled', window.scrollY > 40); }

  /* ---------- mega menus ---------- */
  var megaItems = $$('.has-mega');
  function setMega(li, on) {
    var d = li.querySelector('details');
    li.classList.toggle('open', on);
    if (d) d.open = on;
  }
  function closeMega() {
    megaItems.forEach(function (li) { setMega(li, false); });
    if (header) header.classList.remove('mega-open');
  }
  megaItems.forEach(function (li) {
    var s = li.querySelector('summary'), t;
    function open() { clearTimeout(t); megaItems.forEach(function (o) { if (o !== li) setMega(o, false); }); setMega(li, true); header.classList.add('mega-open'); }
    function later() { t = setTimeout(function () { setMega(li, false); if (!$('.has-mega.open')) header.classList.remove('mega-open'); }, 180); }
    li.addEventListener('mouseenter', open);
    li.addEventListener('mouseleave', later);
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) later(); });
    s.addEventListener('click', function (e) {
      // clicking opens the menu (hover already may have); on touch screens a second tap closes it
      e.preventDefault();
      if (li.classList.contains('open') && window.matchMedia('(hover: none)').matches) closeMega(); else open();
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.has-mega')) closeMega(); });

  /* ---------- tabs ---------- */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          var panel = document.getElementById(t.getAttribute('data-tab'));
          if (panel) {
            panel.hidden = !on;
            if (on) {
              panel.classList.remove('fade-in'); void panel.offsetWidth; panel.classList.add('fade-in');
              $$('.reveal.pending', panel).forEach(function (r) { r.classList.remove('pending'); });
            }
          }
        });
      });
    });
  });

  /* ---------- hero slider ---------- */
  var hero = $('.hero');
  if (hero) {
    var slides = $$('.hero-slide', hero), dots = $$('.hero-dots button', hero), cur = 0, timer;
    var go = function (n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('active', i === cur); s.setAttribute('aria-hidden', i === cur ? 'false' : 'true'); });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
    };
    var auto = function () { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(cur + 1); }, 4000); };
    hero.addEventListener('click', function (e) {
      var b = e.target.closest('[data-hero], [data-slide]');
      if (!b) return;
      if (b.hasAttribute('data-slide')) go(+b.getAttribute('data-slide'));
      else go(cur + (b.getAttribute('data-hero') === 'next' ? 1 : -1));
      auto();
    });
    hero.addEventListener('mouseenter', function () { clearInterval(timer); });
    hero.addEventListener('mouseleave', auto);
    // with the opening intro playing, the slider starts once the page is revealed
    if (doc.classList.contains('intro-on')) document.addEventListener('mxn:introdone', auto, { once: true });
    else auto();
  }

  /* ---------- scroll motion: background orbs, hero depth, parallax art ---------- */
  var parallax = document.body.classList.contains('mtest') ? [] : $$('.parallax'); // Motion test page drives its own
  var ticking = false;
  function onScroll() {
    ticking = false;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var y = window.scrollY;
    doc.style.setProperty('--sy', (y / max).toFixed(4));
    if (hero) hero.style.setProperty('--hp', Math.min(1, y / hero.offsetHeight).toFixed(3));
    var vh = window.innerHeight;
    parallax.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-speed') || 0.1);
      el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
    });
    onHeader();
  }
  if (!reduce) {
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener('resize', onScroll);
  }
  else window.addEventListener('scroll', onHeader, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ----------
     Starts on the visitor's first scroll, so everything stays visible for screenshots, printing
     and anyone who never scrolls; after that, sections below the screen fade up as they arrive. */
  function startReveal() {
    window.removeEventListener('wheel', startReveal);
    window.removeEventListener('touchmove', startReveal);
    window.removeEventListener('keydown', keyReveal);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var sibs = el.parentNode ? $$(':scope > .reveal', el.parentNode) : [];
          var idx = Math.max(0, sibs.indexOf(el));
          el.style.transitionDelay = Math.min(idx % 6, 5) * 70 + 'ms';
          el.classList.remove('pending');
          io.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
    $$('.reveal').forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight + 60) { el.classList.add('pending'); io.observe(el); }
    });
  }
  function keyReveal(e) { if (['ArrowDown', 'PageDown', ' ', 'End'].indexOf(e.key) > -1) startReveal(); }
  if ('IntersectionObserver' in window && !reduce && window.scrollY < 10) {
    window.addEventListener('wheel', startReveal, { passive: true, once: true });
    window.addEventListener('touchmove', startReveal, { passive: true, once: true });
    window.addEventListener('keydown', keyReveal);
  }

  /* ---------- cookie consent ---------- */
  var cookie = $('#cookie');
  if (cookie && !store.get('mxn-cookie')) cookie.hidden = false;
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cookie]');
    if (!b) return;
    var choice = b.getAttribute('data-cookie');
    if (choice === 'save') {
      var prefs = {};
      $$('#prefs input[type=checkbox]').forEach(function (c) { prefs[c.name] = c.checked; });
      store.set('mxn-cookie', JSON.stringify(prefs));
    } else {
      $$('#prefs input[type=checkbox]:not([disabled])').forEach(function (c) { c.checked = choice === 'accept'; });
      store.set('mxn-cookie', choice);
    }
    if (cookie) cookie.hidden = true;
    var prefsEl = $('#prefs');
    if (prefsEl && !prefsEl.hidden) closeOverlay(prefsEl);
    toast(choice === 'decline' ? 'Optional cookies declined' : 'Your choices are saved');
    maybeJoin();
  });

  /* ---------- gentle "Join the MXN List" invitation (once, after consent) ---------- */
  function maybeJoin() {
    if (store.get('mxn-join') || !$('.hero')) return;
    store.set('mxn-join', '1');
    setTimeout(function () { if (!openStack.length) openOverlay('join'); }, 9000);
  }
  if (store.get('mxn-cookie')) maybeJoin();

  /* ---------- forms: thank-you state ---------- */
  $$('form[data-thanks]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = document.createElement('p');
      p.className = 'form-thanks';
      p.textContent = f.getAttribute('data-thanks');
      f.replaceWith(p);
    });
  });

  /* ---------- bag ---------- */
  var bag = [];
  try { bag = JSON.parse(store.get('mxn-bag') || '[]'); } catch (e) { bag = []; }
  function renderBag() {
    var n = $('.bag-count'), list = $('.bag-list'), empty = $('.bag-empty');
    if (n) { n.hidden = !bag.length; n.textContent = bag.length; }
    if (list) list.innerHTML = bag.map(function (b) { return '<li><span>' + b.name + '</span><span>' + b.price + '</span></li>'; }).join('');
    if (empty) empty.hidden = !!bag.length;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (!b) return;
    var card = b.closest('.card');
    bag.push({ name: b.getAttribute('data-add'), price: card ? $('.price', card).textContent.replace('From ', '') : '' });
    store.set('mxn-bag', JSON.stringify(bag));
    renderBag();
    toast('Added to your bag');
  });
  document.addEventListener('click', function (e) { if (e.target.closest('a[href="#"]') && !e.target.closest('[data-open]')) e.preventDefault(); });
  renderBag();

  /* ---------- collection: sort, filter, load more ---------- */
  var grid = $('.coll-grid');
  if (grid) {
    var cards = $$('.card', grid), shown = +grid.getAttribute('data-page') || 16;
    var more = $('.load-more'), countEl = $('.count b'), form = $('.filter-form'), sortSel = $('.sort select');
    cards.forEach(function (c, i) { c.dataset.order = i; });
    var apply = function () {
      var ready = $('input[name=ready]', form).checked;
      var range = ($('input[name=price]:checked', form) || {}).value || 'any';
      var lo = 0, hi = Infinity;
      if (range !== 'any') { lo = +range.split('-')[0]; hi = +range.split('-')[1]; }
      var order = sortSel.value;
      var sorted = cards.slice().sort(function (a, b) {
        if (order === 'low') return a.dataset.price - b.dataset.price;
        if (order === 'high') return b.dataset.price - a.dataset.price;
        if (order === 'new') return b.dataset.new - a.dataset.new || a.dataset.order - b.dataset.order;
        return a.dataset.order - b.dataset.order;
      });
      var visible = 0;
      sorted.forEach(function (c) {
        grid.appendChild(c);
        var p = +c.dataset.price;
        var ok = (!ready || c.dataset.ready === '1') && p >= lo && p <= hi;
        c.classList.toggle('filtered-out', !ok);
        if (ok) { visible++; c.classList.toggle('paged-out', visible > shown); c.classList.remove('pending'); }
      });
      if (countEl) countEl.textContent = visible;
      if (more) { more.textContent = visible <= shown ? "You've seen every piece" : 'Load more'; more.disabled = visible <= shown; }
    };
    form.addEventListener('change', apply);
    form.addEventListener('reset', function () { setTimeout(apply, 0); });
    sortSel.addEventListener('change', apply);
    if (more) more.addEventListener('click', function () { shown += 12; apply(); });
    var q = new URLSearchParams(location.search).get('q');
    if (q) {
      cards.forEach(function (c) { if ($('.card-title', c).textContent.toLowerCase().indexOf(q.toLowerCase()) === -1) c.classList.add('filtered-out'); });
    }
    apply();
    if (q) { var v = 0; cards.forEach(function (c) { if ($('.card-title', c).textContent.toLowerCase().indexOf(q.toLowerCase()) === -1) c.classList.add('filtered-out'); else v++; }); if (countEl) countEl.textContent = v; }
  }
})();
