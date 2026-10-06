/* --------------------------------------------------------------- selects
   Hearth dropdowns. The native <select> stays as the value holder so
   forms, validation, labels and existing change listeners keep working;
   only the browser's plain popup is replaced with a styled listbox.

   Loaded after js/main.js on the marketing pages and after
   js/dashboard.js on the dashboards. No dependencies. */

(function () {
  'use strict';

  var uid = 0;
  var open = null; /* { sel, panel, rows, active } */
  var typeBuf = '';
  var typeTimer = null;

  function optsOf(sel) {
    return Array.prototype.slice.call(sel.options);
  }

  function selectable(row) {
    return row.selectable;
  }

  function labelFor(sel) {
    var own = sel.getAttribute('aria-label');
    if (own) return own;
    if (sel.id) {
      var lb = document.querySelector('label[for="' + sel.id + '"]');
      if (lb) return lb.textContent.replace(/\*/g, '').trim();
    }
    return 'Choose an option';
  }

  /* ---------------------------------------------------------------- move */
  function setActive(o, i, doScroll) {
    if (i < 0 || i >= o.rows.length) return;
    if (o.activeRow) o.activeRow.classList.remove('is-active');
    var row = o.rows[i].row;
    row.classList.add('is-active');
    o.activeRow = row;
    o.active = i;
    o.sel.setAttribute('aria-activedescendant', row.id);
    if (doScroll !== false) row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function step(o, dir) {
    var n = o.rows.length;
    if (!n) return;
    var i = o.active;
    for (var c = 0; c < n; c++) {
      i = (i + dir + n) % n;
      if (selectable(o.rows[i])) { setActive(o, i, true); return; }
    }
  }

  function stepEdge(o, from, dir) {
    for (var c = 0; c < o.rows.length; c++) {
      var i = from + dir * c;
      if (i < 0 || i >= o.rows.length) break;
      if (selectable(o.rows[i])) { setActive(o, i, true); return; }
    }
  }

  function typeahead(o, ch) {
    typeBuf += ch.toLowerCase();
    clearTimeout(typeTimer);
    typeTimer = setTimeout(function () { typeBuf = ''; }, 600);
    var n = o.rows.length;
    for (var c = 1; c <= n; c++) {
      var i = (o.active + c) % n;
      if (selectable(o.rows[i]) && o.rows[i].text.indexOf(typeBuf) === 0) {
        setActive(o, i, true);
        return;
      }
    }
  }

  /* --------------------------------------------------------------- panel */
  function closePanel(refocus) {
    if (!open) return;
    var o = open;
    open = null;
    if (o.panel && o.panel.parentNode) o.panel.parentNode.removeChild(o.panel);
    window.removeEventListener('scroll', reposition, true);
    window.removeEventListener('resize', reposition, true);
    o.sel.classList.remove('is-open');
    o.sel.setAttribute('aria-expanded', 'false');
    o.sel.removeAttribute('aria-activedescendant');
    if (refocus) o.sel.focus();
  }

  function reposition() {
    if (open) place(open);
  }

  function place(o) {
    var r = o.sel.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var gap = 8;
    var h = o.panel.offsetHeight;
    var w = Math.max(Math.round(r.width), 180);
    var top;

    if (r.bottom + gap + h <= vh - 8) {
      top = r.bottom + gap;
      o.panel.setAttribute('data-drop', 'down');
    } else if (r.top - gap - h >= 8) {
      top = r.top - gap - h;
      o.panel.setAttribute('data-drop', 'up');
    } else if (r.bottom > vh / 2) {
      top = r.top - gap - h;
      o.panel.setAttribute('data-drop', 'up');
    } else {
      top = r.bottom + gap;
      o.panel.setAttribute('data-drop', 'down');
    }

    if (top < 8) top = 8;
    if (top + h > vh - 8) top = Math.max(8, vh - 8 - h);

    var left = Math.round(r.left);
    if (left + w > vw - 8) left = vw - 8 - w;
    if (left < 8) left = 8;

    o.panel.style.left = Math.round(left) + 'px';
    o.panel.style.top = Math.round(top) + 'px';
    o.panel.style.width = w + 'px';
  }

  function commit(o, rowIndex) {
    var entry = o.rows[rowIndex];
    if (!entry || !entry.selectable) return;
    var sel = o.sel;
    var changed = sel.selectedIndex !== entry.index;
    sel.selectedIndex = entry.index;
    closePanel(false);
    sel.focus();
    if (changed) {
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function openPanel(sel) {
    if (open && open.sel === sel) { closePanel(true); return; }
    if (open) closePanel(false);

    var opts = optsOf(sel);
    var idBase = 'hs-' + (++uid);
    var panel = document.createElement('div');
    panel.className = 'hs-select-panel';
    panel.id = idBase;
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', labelFor(sel));
    panel.tabIndex = -1;

    var rows = [];
    var active = -1;
    var idx = 0;

    function addRow(opt) {
      var i = opts.indexOf(opt);
      var row = document.createElement('div');
      row.className = 'hs-select-opt';
      row.setAttribute('role', 'option');
      row.id = idBase + '-o' + idx;
      row.dataset.index = String(i);
      row.setAttribute('aria-selected', i === sel.selectedIndex ? 'true' : 'false');
      var ok = !opt.disabled && !(opt.parentNode && opt.parentNode.disabled);
      row.setAttribute('aria-disabled', ok ? 'false' : 'true');
      row.appendChild(document.createTextNode(opt.textContent.trim()));
      var check = document.createElement('i');
      check.className = 'bi bi-check-lg hs-select-opt__check';
      check.setAttribute('aria-hidden', 'true');
      row.appendChild(check);
      panel.appendChild(row);
      var entry = { row: row, index: i, selectable: ok, text: opt.textContent.trim().toLowerCase() };
      rows.push(entry);
      if (i === sel.selectedIndex && ok && active === -1) active = rows.length - 1;
      row.addEventListener('click', function () {
        commit(open || { sel: sel, rows: rows }, rows.indexOf(entry));
      });
      idx++;
    }

    Array.prototype.forEach.call(sel.children, function (node) {
      if (node.tagName === 'OPTGROUP') {
        var g = document.createElement('div');
        g.className = 'hs-select-group';
        g.setAttribute('role', 'presentation');
        g.textContent = node.label;
        panel.appendChild(g);
        Array.prototype.forEach.call(node.children, function (opt) {
          if (opt.tagName === 'OPTION') addRow(opt);
        });
      } else if (node.tagName === 'OPTION') {
        addRow(node);
      }
    });

    if (active === -1) {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].selectable) { active = i; break; }
      }
    }

    panel.addEventListener('mousedown', function (e) { e.preventDefault(); });
    document.body.appendChild(panel);

    sel.classList.add('is-open');
    sel.setAttribute('aria-expanded', 'true');
    sel.setAttribute('aria-controls', panel.id);

    open = { sel: sel, panel: panel, rows: rows, active: active, activeRow: null };
    place(open);
    if (active > -1) setActive(open, active, false);
    if (panel.scrollHeight > panel.clientHeight) {
      var a = open.rows[active];
      if (a) a.row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition, true);
  }

  /* -------------------------------------------------------------- wiring */
  function enhance(sel) {
    if (sel.dataset.hsEnhanced === '1') return;
    sel.dataset.hsEnhanced = '1';

    sel.setAttribute('aria-haspopup', 'listbox');
    sel.setAttribute('aria-expanded', 'false');

    sel.addEventListener('mousedown', function (e) {
      if (sel.disabled) return;
      e.preventDefault();                       /* stop the native popup */
      if (open && open.sel === sel) closePanel(false);
      else openPanel(sel);
      sel.focus();
    });

    sel.addEventListener('click', function (e) {
      e.preventDefault();                       /* touch/click safety net */
    });

    sel.addEventListener('keydown', function (e) {
      var k = e.key;

      if (k === 'Escape') {
        if (open && open.sel === sel) { e.preventDefault(); closePanel(true); }
        return;
      }
      if (k === 'Tab') { if (open && open.sel === sel) closePanel(false); return; }

      if (!open) {
        if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ' || k === 'Spacebar') {
          e.preventDefault();
          openPanel(sel);
        }
        return;
      }
      if (open.sel !== sel) return;

      if (k === 'ArrowDown') { e.preventDefault(); step(open, 1); }
      else if (k === 'ArrowUp') { e.preventDefault(); step(open, -1); }
      else if (k === 'Home') { e.preventDefault(); stepEdge(open, 0, 1); }
      else if (k === 'End') { e.preventDefault(); stepEdge(open, open.rows.length - 1, -1); }
      else if (k === 'Enter' || k === ' ' || k === 'Spacebar') { e.preventDefault(); commit(open, open.active); }
      else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); typeahead(open, k); }
    });

    sel.addEventListener('blur', function () {
      if (open && open.sel === sel) closePanel(false);
    });
  }

  function scan(root) {
    var list = (root || document).querySelectorAll('select.form-select');
    Array.prototype.forEach.call(list, enhance);
  }

  document.addEventListener('pointerdown', function (e) {
    if (!open) return;
    if (open.panel.contains(e.target) || open.sel.contains(e.target)) return;
    closePanel(false);
  }, true);

  function boot() {
    scan(document);
    if (typeof MutationObserver === 'undefined') return;
    new MutationObserver(function () { scan(document); })
      .observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
