// Site behaviour: the phone menu, the hero entrance and the statement that lights up.
// Plain script, no libraries, no network calls. Everything reads fine without it.
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Phone and tablet menu: a full-screen sheet ----
  var toggle = document.querySelector('[data-menu-toggle]');
  var sheet = document.getElementById('menu-sheet');
  if (toggle && sheet) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      sheet.classList.toggle('is-open', open);
      sheet.inert = !open;
      root.classList.toggle('menu-open', open);
    };
    sheet.inert = true;
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    sheet.addEventListener('click', function (e) {
      // Any link tap closes the sheet. The theme button keeps it open.
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
  }

  // ---- Hero entrance: the headline rises line by line, once ----
  var h1 = document.querySelector('[data-enter] h1');
  if (h1 && root.classList.contains('m-enter') && !root.classList.contains('m-enter-done')) {
    var words = h1.textContent.trim().split(/\s+/);
    var label = h1.textContent.trim();
    h1.setAttribute('aria-label', label);
    h1.innerHTML = words.map(function (w) {
      return '<span class="w" aria-hidden="true"><span>' + w.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</span></span>';
    }).join(' ');
    // Give each word its line number, so lines rise 80 ms apart.
    var top = null, line = -1;
    h1.querySelectorAll('.w').forEach(function (el) {
      if (el.offsetTop !== top) { top = el.offsetTop; line++; }
      el.firstChild.style.setProperty('--line', Math.min(line, 3));
    });
    h1.classList.add('is-entering');
    root.classList.add('m-enter-done');
    setTimeout(function () { h1.textContent = label; h1.removeAttribute('aria-label'); h1.classList.remove('is-entering'); }, 1200);
  }
  document.querySelectorAll('[data-enter] [data-enter-item]').forEach(function (el, i) { el.style.setProperty('--i', i); });

  // ---- Statement: words light up as the section scrolls through the screen ----
  var st = document.querySelector('[data-statement]');
  if (st && !reduce) {
    var text = st.textContent.trim();
    st.innerHTML = text.split(/\s+/).map(function (w) {
      return '<span class="sw">' + w.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</span>';
    }).join(' ');
    var spans = st.querySelectorAll('.sw');
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = st.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 when the statement's top reaches 85% of the screen, 1 when its bottom reaches 45%.
      var p = (vh * 0.85 - r.top) / (vh * 0.85 - vh * 0.45 + r.height);
      p = Math.max(0, Math.min(1, p));
      var lit = Math.round(p * spans.length);
      for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('is-lit', i < lit);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();
