// Dark mode is the default. A reader's choice is remembered in this browser only.
// Loaded in <head> before the page paints, so there is no flash of the wrong theme.
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('gtc-theme'); } catch (e) { /* storage blocked: use default */ }
  root.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');

  document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('gtc-theme', next); } catch (e) { /* ignore */ }
      });
    }
  });
})();
