// Turnstile calls these. Subscribe stays disabled until the "are you human" check passes,
// so readers can't submit too early (the server would reject a form without the check).
window.gtcTurnstileOk = function () {
  document.querySelectorAll('[data-signup-submit]').forEach(function (b) { b.disabled = false; });
  document.querySelectorAll('[data-signup-hint]').forEach(function (h) { h.hidden = true; });
};
window.gtcTurnstileReset = function () {
  document.querySelectorAll('[data-signup-submit]').forEach(function (b) { b.disabled = true; });
  document.querySelectorAll('[data-signup-hint]').forEach(function (h) { h.hidden = false; });
};
