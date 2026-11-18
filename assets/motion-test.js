/* MXN — Motion test page (samples/motion). Loaded after main.js, only on that page.
   1 spring hover on product cards · 2 staggered reveals · 3 scroll-linked hero and banners · 4 fly-to-bag.
   Uses Motion (motion.dev) from the global `Motion` build. Does nothing if the visitor asks for reduced motion. */
(function () {
  var M = window.Motion;
  if (!M || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var animate = M.animate, scroll = M.scroll, inView = M.inView, stagger = M.stagger, hover = M.hover;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ease = [0.22, 1, 0.36, 1];
  var lift = { type: 'spring', visualDuration: 0.5, bounce: 0.3 };

  /* ---------- 1. spring hover on product cards (real mouse/trackpad only) ---------- */
  var cards = $$('.card');
  cards.forEach(function (card) {
    var a = $('.card-img.a', card), b = $('.card-img.b', card);
    if (a) animate(a, { opacity: 1, scale: 1 }, { duration: 0 });
    if (b) animate(b, { opacity: 0, scale: 1.08 }, { duration: 0 });
  });
  hover('.card', function (card) {
    var media = $('.card-media', card), a = $('.card-img.a', card), b = $('.card-img.b', card);
    if (media) animate(media, { y: -8, scale: 1.01 }, lift);
    if (a) animate(a, { opacity: 0, scale: 0.96 }, { duration: 0.6, ease: ease });
    if (b) animate(b, { opacity: 1, scale: 1 }, { duration: 0.8, ease: ease });
    return function () {
      if (media) animate(media, { y: 0, scale: 1 }, lift);
      if (a) animate(a, { opacity: 1, scale: 1 }, { duration: 0.6, ease: ease });
      if (b) animate(b, { opacity: 0, scale: 1.08 }, { duration: 0.6, ease: ease });
    };
  });

  /* ---------- 2. staggered reveals for grids (products, categories, feature tiles) ---------- */
  function rise(items, gap) {
    return animate(items, { opacity: [0, 1], y: [24, 0] }, { delay: stagger(gap || 0.07), duration: 0.8, ease: ease });
  }
  $$('.products, .cats, .grid.three').forEach(function (grid) {
    var items = Array.prototype.slice.call(grid.children);
    items.forEach(function (i) { i.classList.remove('reveal', 'pending'); });
    if (grid.closest('[hidden]')) return;                      // hidden tab: animated when its tab is chosen
    if (grid.getBoundingClientRect().top < window.innerHeight * 0.9) return; // already on screen: leave visible
    animate(items, { opacity: 0, y: 24 }, { duration: 0 });
    inView(grid, function () { rise(items); }, { amount: 0.15 });
  });
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('[role="tab"][data-tab]');
    if (!tab) return;
    requestAnimationFrame(function () {
      var panel = document.getElementById(tab.getAttribute('data-tab'));
      if (panel && !panel.hidden && panel.classList.contains('grid')) rise(Array.prototype.slice.call(panel.children), 0.05);
    });
  });

  /* ---------- 3. scroll-linked hero and banners ---------- */
  var hero = $('.hero');
  if (hero) {
    var out = { target: hero, offset: ['start start', 'end start'] };
    if ($('.hero-art')) scroll(animate('.hero-art', { y: [0, 140], scale: [1, 0.9] }, { ease: 'linear' }), out);
    if ($('.hero-bg .art-photo')) scroll(animate('.hero-bg .art-photo', { y: [0, 120], scale: [1, 1.08] }, { ease: 'linear' }), out);
    scroll(animate('.hero-copy', { y: [0, -60], opacity: [1, 0] }, { ease: 'linear' }), out);
  }
  // Bespoke / Our Story art drifts against the scroll. Uses the separate `translate` property so
  // any spin or float animation on the same element keeps running.
  $$('.parallax').forEach(function (el) {
    var d = parseFloat(el.getAttribute('data-speed') || 0.1) * 500;
    scroll(function (p) { el.style.translate = '0 ' + (d - 2 * d * p).toFixed(1) + 'px'; },
      { target: el.parentNode, offset: ['start end', 'end start'] });
  });
  // Collection tiles: photos settle from a slight zoom as they come into view.
  $$('.feature .tile-art').forEach(function (tile) {
    var img = $('img', tile);
    if (img) scroll(animate(img, { scale: [1.14, 1] }, { ease: 'linear' }), { target: tile, offset: ['start end', 'center center'] });
  });

  /* ---------- 4. "Add to bag": the piece flies into the bag ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.quick-add[data-add]');
    var bagBtn = $('.bag-btn');
    if (!btn || !bagBtn) return;
    var src = $('.card-img.a', btn.closest('.card'));
    if (!src) return;
    var r = src.getBoundingClientRect(), t = bagBtn.getBoundingClientRect();
    var ghost = src.cloneNode(true);
    ghost.classList.add('fly-ghost');
    ghost.removeAttribute('style');
    Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    document.body.appendChild(ghost);
    var dx = t.left + t.width / 2 - (r.left + r.width / 2);
    var dy = t.top + t.height / 2 - (r.top + r.height / 2);
    animate(ghost, {
      x: [0, dx * 0.45, dx],
      y: [0, Math.min(dy * 0.55, 0) - 90, dy],
      scale: [1, 0.5, 0.08],
      opacity: [1, 1, 0.4],
      borderRadius: ['12px', '40%', '50%']
    }, { duration: 0.9, ease: [0.65, 0, 0.35, 1] }).then(function () {
      ghost.remove();
      animate(bagBtn, { scale: [1, 1.22, 1] }, { duration: 0.45, ease: ease });
      var n = $('.bag-count');
      if (n) animate(n, { scale: [0.4, 1] }, { type: 'spring', visualDuration: 0.4, bounce: 0.55 });
    });
  });
})();
