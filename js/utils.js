/**
 * utils.js — Small shared helpers used by the quiz, exam, leaderboard,
 * history and authentication sections.
 */

/** Escape a value so it can safely be inserted into HTML markup. */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape a value for use inside a double-quoted HTML attribute. */
function escapeAttr(value) {
  return escapeHtml(value);
}

window.escapeHtml = escapeHtml;
window.escapeAttr = escapeAttr;
