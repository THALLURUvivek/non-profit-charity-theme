/* ==========================================================================
   Hearth Foundation — dashboard runtime
   --------------------------------------------------------------------------
   Handles the auth gate, renders both dashboards from js/dashboard-data.js,
   and owns the small interactions (filters, approvals, settings saves).

   Deliberately does not load main.js. The dashboards opt out of the
   preloader, custom cursor and scroll hijacking — they are a tool, not a
   marketing page — so none of that engine applies.
   ========================================================================== */
(function () {
  'use strict';

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));

  const DATA = window.HearthData;
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SESSION_KEY = 'hearth.session';

  /* account key <-> dashboard role. Accounts are keyed by login name, the
     dashboards are keyed by role, so every hop needs this mapping. */
  const KEY_BY_ROLE = { admin: 'admin', user: 'donor' };
  const dashFor = role => (role === 'admin' ? 'admin.html' : 'user.html');

  /* ---------------------------------------------------------------- 00 */
  /* session helpers — sessionStorage so closing the tab signs you out */
  const session = {
    read() {
      try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
      catch (e) { return null; }
    },
    write(data) {
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (e) {}
    },
    clear() {
      try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    }
  };

  /* ---------------------------------------------------------------- 01 */
  /* formatting */
  const compact = v => {
    const n = Number(v) || 0;
    const abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(abs >= 1e10 ? 0 : 2).replace(/\.0+$/, '') + 'B';
    if (abs >= 1e6) return (n / 1e6).toFixed(abs >= 1e8 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (abs >= 1e3) return (n / 1e3).toFixed(abs >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'k';
    return String(Math.round(n));
  };
  const money = v => '$' + Number(v || 0).toLocaleString('en-US');

  /* CSV without a library. The BOM keeps Excel from mangling the accents in
     names like "Girls' education". */
  function downloadCsv(filename, headers, rows) {
    const cell = v => {
      const s = v == null ? '' : String(v);
      return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const body = [headers].concat(rows).map(r => r.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + body], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* escape anything that came from the data module before it hits innerHTML */
  const esc = s => String(s == null ? '' : s)
    .replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* count up once, respecting reduced motion */
  function countTo(el, target, opts) {
    opts = opts || {};
    const dur = opts.duration || 1200;
    const fmt = opts.format || compact;
    const suffix = opts.suffix || '';
    if (REDUCED) { el.textContent = fmt(target) + suffix; return; }
    const t0 = window.performance.now();
    const tick = now => {
      const p = clamp01((now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased) + suffix;
      if (p < 1) window.requestAnimationFrame(tick);
      else el.textContent = fmt(target) + suffix;
    };
    window.requestAnimationFrame(tick);
  }
  const clamp01 = v => Math.min(Math.max(v, 0), 1);

  /* grow bars and meters when they scroll into view */
  function growOnScroll(els, apply) {
    if (!els.length) return;
    const IO = window.IntersectionObserver;
    if (REDUCED || typeof IO !== 'function') { els.forEach(apply); return; }
    const io = new IO((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        els.filter(x => x === e.target).forEach(apply);
        obs.unobserve(e.target);
      });
    }, { threshold: .25 });
    els.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------------- 02 */
  /* signup — creates the account, then signs the new donor straight in */
  function initSignup() {
    const form = $('[data-signup-form]');
    if (!form) return;

    const error = $('[data-signup-error]');
    const first = $('#suFirst', form);
    const last  = $('#suLast', form);
    const mail  = $('#suEmail', form);
    const pw    = $('#suPassword', form);
    const pw2   = $('#suConfirmPassword', form);
    const terms = $('#suTerms', form);
    const submit = $('[data-signup-submit]', form);

    const showError = msg => {
      if (!error) return;
      error.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i><span>' + esc(msg) + '</span>';
      error.classList.add('is-visible');
    };
    const clearError = () => {
      if (!error) return;
      error.classList.remove('is-visible');
      $$('.is-invalid', form).forEach(f => f.classList.remove('is-invalid'));
    };

    /* password reveal */
    $$('[data-pw-toggle]', form).forEach(btn => {
      btn.addEventListener('click', () => {
        const input = $('#' + btn.dataset.pwToggle, form);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        btn.innerHTML = '<i class="bi bi-eye' + (show ? '-slash' : '') + '"></i>';
      });
    });

    /* strength meter — length plus character variety, nothing sent anywhere */
    const meter = $('[data-pw-meter]', form);
    const note = $('[data-pw-note]', form);
    const LABELS = ['', 'Too weak', 'Fair', 'Good', 'Strong'];
    const TONES = ['', 'weak', 'weak', 'fair', 'good'];

    /* Guidance only. Not a real entropy score, and nothing is transmitted. */
    const scorePw = v => {
      let s = 0;
      if (v.length >= 8) s++;
      if (v.length >= 12) s++;
      if (/[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
      return Math.min(s, 4);
    };

    const paintStrength = v => {
      const s = scorePw(v);
      if (meter) meter.className = 'pw-meter' + (v ? ' is-' + s : '');
      if (note) {
        note.className = 'pw-note' + (v && TONES[s] ? ' is-' + TONES[s] : '');
        note.textContent = v ? LABELS[s] : 'Use 8+ characters with a number and a symbol.';
      }
    };

    if (pw) {
      pw.addEventListener('input', () => paintStrength(pw.value));
      paintStrength(pw.value);
    }

    [first, last, mail, pw, pw2].forEach(f => f && f.addEventListener('input', clearError));

    /* social buttons redirect to error page */
    $$('[data-social]', form.parentNode).forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = '404.html';
      });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      clearError();

      const firstName = (first.value || '').trim();
      const lastName  = (last.value || '').trim();
      const mailVal   = (mail.value || '').trim();
      const pass      = pw.value || '';

      const bad = (input, msg) => {
        if (input) { input.classList.add('is-invalid'); input.focus(); }
        showError(msg);
      };

      if (!firstName) return bad(first, 'Tell us your first name.');
      if (!lastName)  return bad(last, 'Tell us your last name.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mailVal)) return bad(mail, 'That email address does not look complete.');
      if (pass.length < 8) return bad(pw, 'Use at least eight characters for your password.');
      if (!/[A-Z]/.test(pass) || !/[a-z]/.test(pass) || !/[0-9]/.test(pass) || !/[^A-Za-z0-9]/.test(pass)) {
        return bad(pw, 'Use a mix of upper, lower, numbers and a symbol.');
      }
      if (!pw2 || !pw2.value) return bad(pw2, 'Please confirm your password.');
      if (pass !== pw2.value) return bad(pw2, 'Passwords do not match.');
      if (!terms.checked) {
        terms.focus();
        return showError('Please accept the terms so we can create the account.');
      }

      /* a real backend would hash the password and store nothing in session.
         Here we keep the whole record in memory for this tab only. */
      const key = 'member';
      DATA.accounts[key] = {
        role: 'user',
        name: firstName + ' ' + lastName,
        initials: (firstName.charAt(0) + lastName.charAt(0)).toUpperCase(),
        title: 'New account',
        email: mailVal,
        lastLogin: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        mfaEnabled: false
      };

      if (submit) { submit.classList.add('is-loading'); submit.disabled = true; }

      setTimeout(() => {
        session.write({ key: key, role: 'user', name: DATA.accounts[key].name, at: Date.now() });
        location.href = 'user.html';
      }, 700);
    });
  }

  /* ---------------------------------------------------------------- 03 */
  /* auth gate */
  function initAuth() {
    const form = $('[data-auth-form]');
    if (!form) return;

    /* ?as=admin|donor — arriving from the other dashboard's "view the other
       side" link, so the sign-in has to be allowed to change account */
    const wanted = new URLSearchParams(location.search).get('as');
    const wantKey = DATA.accounts[wanted] ? wanted : null;

    /* already signed in? go straight through — unless we were sent here to
       switch accounts, in which case the stale session gets cleared below */
    const existing = session.read();
    if (!wantKey && existing && DATA.accounts[existing.key]) {
      location.replace(dashFor(existing.role));
      return;
    }
    if (wantKey && existing) session.clear();

    const error = $('[data-auth-error]');
    const email = $('#authEmail', form);
    const pw = $('#authPassword', form);
    const submit = $('[data-auth-submit]', form);

    const showError = msg => {
      if (!error) return;
      error.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i><span>' + esc(msg) + '</span>';
      error.classList.add('is-visible');
    };
    const clearError = () => error && error.classList.remove('is-visible');

    /* mirror the picked role into the email field so the demo needs no typing */
    const pickRole = key => {
      const radio = $('input[name="role"][value="' + key + '"]', form);
      if (!radio) return;
      radio.checked = true;
      const opt = radio.closest('.role-opt');
      if (opt && opt.dataset.who && email) email.value = opt.dataset.who;
    };

    $$('.role-opt input', form).forEach(r => {
      r.addEventListener('change', () => {
        clearError();
        pickRole(r.value);
      });
    });

    const checked = $('input[name="role"]:checked', form);
    if (checked) pickRole(checked.value);
    if (wantKey) {
      pickRole(wantKey);
      const hint = $('.form-hint', form);
      if (hint) hint.textContent = 'You were signed in to the other dashboard, so that session was closed. Any four characters work — this is a demo.';
      if (pw) pw.focus();
    }

    [email, pw].forEach(f => f && f.addEventListener('input', clearError));

    form.addEventListener('submit', e => {
      e.preventDefault();
      clearError();

      const picked = $('input[name="role"]:checked', form);
      if (!picked) return showError('Choose which dashboard you want to open.');

      const key = picked.value;
      const account = DATA.accounts[key];
      if (!account) return showError('That account does not exist.');

      const mail = (email.value || '').trim();
      const pass = pw.value || '';

      if (!mail) return showError('Enter the email address for this account.');
      if (pass.length < 4) return showError('Passwords on this demo are at least four characters.');

      if (submit) {
        submit.classList.add('is-loading');
        submit.disabled = true;
      }

      setTimeout(() => {
        session.write({ key: key, role: account.role, name: account.name, at: Date.now() });
        location.href = dashFor(account.role);
      }, 600);
    });
  }

  /* gate + identity block for the dashboards themselves */
  function initSession(requiredRole) {
    const s = session.read();

    /* Signed in as the other account: send them back through the gate with the
       role we actually want, instead of bouncing between the two dashboards. */
    if (s && DATA.accounts[s.key] && s.role !== requiredRole) {
      session.clear();
      location.replace('login.html?as=' + (KEY_BY_ROLE[requiredRole] || 'admin'));
      return null;
    }
    if (!s || !DATA.accounts[s.key] || s.role !== requiredRole) {
      location.replace('login.html');
      return null;
    }
    return DATA.accounts[s.key];
  }

  function wireSignOut() {
    $$('[data-signout]').forEach(btn => {
      btn.addEventListener('click', () => {
        session.clear();
        location.href = 'index.html';
      });
    });
  }

  /* highlight the section the reader is actually on, so the sidebar is not
     frozen on "Overview" after the first click */
  function wireNav() {
    const nav = $('[data-nav]');
    if (!nav) return;

    const links = $$('a[href]', nav);
    const anchor = a => (a.getAttribute('href') || '').split('#')[1] || '';
    const clear = () => links.forEach(a => {
      a.classList.remove('is-active');
      a.removeAttribute('aria-current');
    });
    const mark = a => {
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'true');
    };

    const activate = id => {
      /* no hash in the URL (fresh load): the first in-page link is the
         sensible default, since these navs open on the overview */
      if (!id) { clear(); const first = links.filter(a => anchor(a))[0]; if (first) mark(first); return; }
      clear();
      const match = links.filter(a => anchor(a) === id)[0];
      if (match) mark(match);
    };

    nav.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      if (anchor(a)) activate(anchor(a));
    });

    window.addEventListener('hashchange', () => activate(location.hash.slice(1)));
    activate(location.hash.slice(1));
  }

  /* ---------------------------------------------------------------- 03 */
  /* shared shell pieces */
  function renderShell(account, roleLabel, navHtml) {
    document.body.classList.add('is-dashboard');
    /* no fixed header here, so the marketing offset would push anchor
       targets out of view — reset it to a comfortable gutter */
    document.documentElement.classList.add('is-dashboard-page');

    const who = $('[data-me]');
    if (who) {
      who.innerHTML =
        '<div class="dash-me__top">' +
          '<span class="avatar">' + esc(account.initials) + '</span>' +
          '<span>' +
            '<b class="dash-me__name">' + esc(account.name) + '</b>' +
            '<span class="dash-me__title">' + esc(account.title) + '</span>' +
          '</span>' +
        '</div>' +
        '<p class="dash-me__row mb-2"><i class="bi bi-shield-check"></i> Last sign-in ' + esc(account.lastLogin) + '</p>' +
        '<button class="dash-signout" type="button" data-signout>' +
          '<i class="bi bi-box-arrow-right"></i> Sign out</button>';
    }

    const nav = $('[data-nav]');
    if (nav) nav.innerHTML = navHtml;
    wireNav();

    const role = $('[data-role-label]');
    if (role) role.textContent = roleLabel;

    const email = $('[data-me-email]');
    if (email) email.textContent = account.email;

    const first = $('[data-me-first]');
    if (first) first.textContent = account.name.split(' ')[0];

    wireSignOut();
  }

  const statusPill = status => {
    const map = {
      paid:     ['pill--paid', 'bi-check-circle-fill', 'Paid'],
      refunded: ['pill--refunded', 'bi-arrow-counterclockwise', 'Refunded'],
      pending:  ['pill--pending', 'bi-hourglass-split', 'Pending'],
      review:   ['pill--pending', 'bi-eye', 'Needs review'],
      urgent:   ['pill--urgent', 'bi-exclamation-triangle-fill', 'Urgent']
    };
    const m = map[status] || map.pending;
    return '<span class="pill ' + m[0] + '"><i class="bi ' + m[1] + '"></i>' + m[2] + '</span>';
  };

  /* ---------------------------------------------------------------- 04 */
  /* ADMIN */
  function initAdmin(account) {
    const D = DATA.admin;

    renderShell(account, 'Administrator',
      '<h6>Overview</h6>' +
      '<a href="admin.html#overview"><i class="bi bi-speedometer2"></i> Overview</a>' +
      '<a href="admin.html#income"><i class="bi bi-graph-up-arrow"></i> Income</a>' +
      '<a href="admin.html#programmes"><i class="bi bi-diagram-3"></i> Programmes</a>' +
      '<h6>Work</h6>' +
      '<a href="admin.html#queue"><i class="bi bi-inbox"></i> Approvals <span class="count" data-queue-count>' + D.queue.length + '</span></a>' +
      '<a href="admin.html#gifts"><i class="bi bi-gift"></i> Recent gifts</a>' +
      '<a href="admin.html#audit"><i class="bi bi-shield-check"></i> Audit</a>' +
      '<h6>Account</h6>' +
      '<a href="user.html"><i class="bi bi-box-arrow-up-right"></i> View donor view</a>' +
      '<a href="index.html"><i class="bi bi-house"></i> Back to site</a>');

    /* --- KPI tiles --- */
    const kpiHost = $('[data-kpis]');
    if (kpiHost) {
      kpiHost.innerHTML = D.kpis.map(k => {
        const dir = k.trendUp ? 'up' : 'down';
        const arrow = k.trendUp ? 'bi-arrow-up-right' : 'bi-arrow-down-right';
        const val = k.prefix === '$'
          ? '<span data-kpi="' + k.id + '">$0</span>'
          : '<span data-kpi="' + k.id + '">0</span>';
        return '<div class="panel kpi">' +
          '<p class="kpi__label">' + esc(k.label) + '</p>' +
          '<p class="kpi__value">' + val + '</p>' +
          '<div class="kpi__foot">' +
            '<span class="kpi__note">' + esc(k.note) + '</span>' +
            '<span class="trend trend--' + dir + '"><i class="bi ' + arrow + '"></i>' +
              Math.abs(k.trend) + '%</span>' +
          '</div>' +
        '</div>';
      }).join('');

      const cells = $$('[data-kpi]', kpiHost);
      growOnScroll(cells, el => {
        const k = D.kpis.find(x => x.id === el.dataset.kpi);
        if (!k) return;
        countTo(el, k.value, { format: k.prefix === '$' ? v => '$' + compact(v) : v => Math.round(v).toLocaleString('en-US') });
      });
    }

    /* --- income bars --- */
    const barHost = $('[data-income-bars]');
    if (barHost) {
      const rec = D.income.recurring, one = D.income.oneTime;
      barHost.innerHTML = rec.map((v, i) => {
        const total = v + one[i];
        const tip = D.income.labels[i] + ' — ' + money(total) + ' total (' + money(v) + ' recurring, ' + money(one[i]) + ' one-time)';
        return '<div class="bars__col" title="' + esc(tip) + '">' +
          '<div class="bars__seg bars__seg--onetime" style="--f:' + one[i] + '"></div>' +
          '<div class="bars__seg bars__seg--recurring" style="--f:' + v + '"></div>' +
        '</div>';
      }).join('');

      const labels = $('[data-income-labels]');
      if (labels) labels.innerHTML = D.income.labels.map(l => '<span>' + esc(l) + '</span>').join('');

      const segs = $$('.bars__seg', barHost);
      growOnScroll(segs, el => {
        el.style.transition = 'transform .9s cubic-bezier(.22,1,.36,1)';
        el.style.transform = 'scaleY(1)';
      });
    }

    /* --- allocation meters --- */
    const allocHost = $('[data-allocation]');
    if (allocHost) {
      allocHost.innerHTML = D.allocation.map(a =>
        '<div class="meter">' +
          '<div class="meter__head"><span>' + esc(a.label) + '</span><b>' + money(a.amount) + '</b></div>' +
          '<div class="meter__track"><span class="meter__fill" data-grow="' + a.pct + '" style="--w:' + a.pct + '%;background:' + a.color + '"></span></div>' +
        '</div>'
      ).join('');

      const fills = $$('.meter__fill', allocHost);
      growOnScroll(fills, el => {
        el.style.transition = 'transform .9s cubic-bezier(.22,1,.36,1)';
        el.style.transform = 'scaleX(1)';
      });
    }

    /* --- approval queue --- */
    const queueHost = $('[data-queue]');
    if (queueHost) {
      const open = D.queue.slice();

      const syncCount = () => {
        const count = $('[data-queue-count]');
        if (!count) return;
        count.textContent = open.length;
        count.style.display = open.length ? '' : 'none';
      };

      const draw = list => {
        queueHost.innerHTML = list.length
          ? list.map(q =>
              '<article class="queue__item" data-id="' + esc(q.id) + '">' +
                '<div class="queue__top">' +
                  statusPill(q.status) +
                  '<span class="queue__title">' + esc(q.title) + '</span>' +
                  (q.amount ? '<b class="num">' + money(q.amount) + '</b>' : '') +
                '</div>' +
                '<p class="queue__note">' + esc(q.note) + '</p>' +
                '<div class="queue__actions">' +
                  '<span class="tag">' + esc(q.id) + '</span>' +
                  '<span class="tag"><i class="bi bi-person"></i> ' + esc(q.who) + '</span>' +
                  '<span class="tag"><i class="bi bi-clock"></i> ' + esc(q.age) + ' old</span>' +
                  '<button class="btn-mini btn-mini--go" data-approve="' + esc(q.id) + '">Approve</button>' +
                  '<button class="btn-mini" data-decline="' + esc(q.id) + '">Decline</button>' +
                '</div>' +
              '</article>'
            ).join('')
          : '<p class="dash-empty"><i class="bi bi-check2-circle"></i><br>Nothing waiting. The queue is clear.</p>';
        syncCount();
      };
      draw(open);

      /* Remove only the decided row rather than redrawing the list: the next
         Approve button keeps focus, so a keyboard user can clear the queue
         without re-tabbing through everything. */
      const decide = (id, verb) => {
        const item = open.find(q => q.id === id);
        if (!item) return;
        open.splice(open.indexOf(item), 1);

        const row = $$('.queue__item', queueHost).filter(el => el.dataset.id === id)[0];
        if (row) row.remove(); else draw(open);
        if (!open.length) draw(open);
        else syncCount();

        showToast(verb, item.id + ' — ' + item.title);
      };

      queueHost.addEventListener('click', e => {
        const okBtn = e.target.closest('[data-approve]');
        const noBtn = e.target.closest('[data-decline]');
        if (okBtn) decide(okBtn.dataset.approve, 'Approved');
        else if (noBtn) decide(noBtn.dataset.decline, 'Declined');
      });
    }

    /* --- recent gifts, filterable --- */
    const giftHost = $('[data-gifts]');
    if (giftHost) {
      const draw = filter => {
        const rows = D.recentGifts.filter(g => filter === 'all' || g.frequency === filter);
        if (!rows.length) {
          giftHost.innerHTML = '<tr><td colspan="4" class="dash-empty">No gifts in this category.</td></tr>';
          return;
        }
        giftHost.innerHTML = rows.map(g =>
          '<tr>' +
            '<td><b>' + esc(g.donor) + '</b><div class="muted">' + esc(g.at) + ' · ' + esc(g.method) + '</div></td>' +
            '<td><span class="tag">' + esc(g.frequency) + '</span></td>' +
            '<td class="muted">' + g.programme + '</td>' +
            '<td class="num">' + money(g.amount) + '</td>' +
          '</tr>'
        ).join('');
      };
      draw('all');

      $$('[data-gift-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
          $$('[data-gift-filter]').forEach(b => {
            b.classList.remove('is-active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
          draw(btn.dataset.giftFilter);
        });
      });
    }

    /* --- programme health --- */
    const progHost = $('[data-programmes]');
    if (progHost) {
      progHost.innerHTML = D.programmes.map(p => {
        const colour = p.health >= 85 ? 'var(--leaf)' : p.health >= 70 ? 'var(--gold)' : 'var(--coral)';
        return '<tr>' +
          '<td><b>' + esc(p.name) + '</b>' +
            (p.flag ? '<div class="muted"><i class="bi bi-flag-fill"></i> ' + esc(p.flag) + '</div>' : '') + '</td>' +
          '<td class="num">' + p.projects + '</td>' +
          '<td class="num">' + compact(p.spend) + '</td>' +
          '<td style="min-width:150px;">' +
            '<div class="meter__track"><span class="meter__fill" data-grow="' + p.health + '" style="--w:' + p.health + '%;background:' + colour + '"></span></div>' +
            '<span class="muted">' + p.health + ' / 100</span>' +
          '</td>' +
        '</tr>';
      }).join('');

      const fills = $$('.meter__fill', progHost);
      growOnScroll(fills, el => {
        el.style.transition = 'transform .9s cubic-bezier(.22,1,.36,1)';
        el.style.transform = 'scaleX(1)';
      });
    }

    /* --- audit panel --- */
    const auditHost = $('[data-audit]');
    if (auditHost) {
      const A = D.audit;
      auditHost.innerHTML =
        '<div class="dash-grid dash-grid--2">' +
          '<div><p class="kpi__label">Independent audit</p>' +
            '<p class="kpi__value" style="font-size:1.6rem;">' + esc(A.lastAudit.opinion) + '</p>' +
            '<p class="kpi__note">' + esc(A.lastAudit.body) + ' · ' + esc(A.lastAudit.date) + '</p></div>' +
          '<div><p class="kpi__label">To programmes</p>' +
            '<p class="kpi__value" style="font-size:1.6rem;">' + A.programShare + '%</p>' +
            '<p class="kpi__note">Target is 84%. ' + A.independentAudits + ' audits a year.</p></div>' +
        '</div>' +
        '<div class="table-wrap" style="margin-top:1.5rem;">' +
          '<table class="dash-table">' +
            '<tbody>' +
              '<tr><td>Sub-grants published above $1,000</td><td class="num">' + A.subGrants.toLocaleString('en-US') + '</td></tr>' +
              '<tr><td>Projects written up as failures</td><td class="num">' + A.openFailures + '</td></tr>' +
              '<tr><td>Accounts last filed</td><td class="num">' + esc(A.lastFiled) + '</td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
        '<p class="kpi__note" style="margin-top:1rem;">These are the same figures published on the ' +
          '<a class="link-underline" href="index.html#transparency">transparency page</a>. The dashboard reads them from one place.</p>';
    }

    /* --- export --- */
    const exportBtn = $('[data-export="gifts"]');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        downloadCsv(
          'hearth-recent-gifts-' + D.period.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.csv',
          ['Donor', 'Date', 'Frequency', 'Designation', 'Method', 'Amount'],
          D.recentGifts.map(g => [g.donor, g.at, g.frequency, g.programme, g.method, g.amount])
        );
        showToast('Export ready', D.recentGifts.length + ' gifts downloaded as CSV.');
      });
    }

    const period = $('[data-period]');
    if (period) period.textContent = D.period;
    const synced = $('[data-synced]');
    if (synced) synced.textContent = 'Last synced ' + D.lastSynced;
  }

  /* ---------------------------------------------------------------- 05 */
  /* USER (donor) */
  function initUser(account) {
    const U = DATA.user;

    renderShell(account, 'Donor',
      '<h6>My giving</h6>' +
      '<a href="user.html#overview"><i class="bi bi-speedometer2"></i> Overview</a>' +
      '<a href="user.html#gift"><i class="bi bi-credit-card"></i> Monthly gift</a>' +
      '<a href="user.html#history"><i class="bi bi-receipt"></i> Receipts</a>' +
      '<a href="user.html#impact"><i class="bi bi-heart-pulse"></i> My impact</a>' +
      '<a href="user.html#settings"><i class="bi bi-sliders"></i> Settings</a>' +
      '<h6>Elsewhere</h6>' +
      '<a href="admin.html"><i class="bi bi-box-arrow-up-right"></i> View admin view</a>' +
      '<a href="index.html"><i class="bi bi-house"></i> Back to site</a>');

    /* --- personal KPIs --- */
    const kpiHost = $('[data-kpis]');
    if (kpiHost) {
      const tiles = [
        { id: 'given',  label: 'Total given',     value: U.totalGiven,  prefix: '$', note: 'Since ' + U.memberSince },
        { id: 'months', label: 'Months giving',   value: U.monthsActive, prefix: '',  note: 'Unbroken — ' + U.streak + ' in a row' },
        { id: 'avg',    label: 'Average gift',    value: U.avgGift,     prefix: '$', note: 'Across every gift' },
        { id: 'rank',   label: 'Supporter rank',  value: U.rank,        prefix: '',  note: 'By lifetime giving' }
      ];
      kpiHost.innerHTML = tiles.map(t => {
        const val = t.prefix === '$'
          ? '<span data-kpi="' + t.id + '">$0</span>'
          : '<span data-kpi="' + t.id + '">0</span>';
        return '<div class="panel kpi">' +
          '<p class="kpi__label">' + esc(t.label) + '</p>' +
          '<p class="kpi__value">' + val + '</p>' +
          '<div class="kpi__foot"><span class="kpi__note">' + esc(t.note) + '</span></div>' +
        '</div>';
      }).join('');

      const cells = $$('[data-kpi]', kpiHost);
      growOnScroll(cells, el => {
        const t = tiles.find(x => x.id === el.dataset.kpi);
        if (!t) return;
        countTo(el, t.value, { format: t.prefix === '$' ? v => '$' + Math.round(v).toLocaleString('en-US') : v => Math.round(v).toLocaleString('en-US') });
      });
    }

    /* --- personal giving history bars --- */
    const barHost = $('[data-giving-bars]');
    if (barHost) {
      barHost.innerHTML = U.giving.values.map((v, i) =>
        '<div class="bars__col" title="' + esc(money(v) + ' given in ' + U.giving.labels[i]) + '">' +
          '<div class="bars__seg bars__seg--recurring" style="--f:' + v + '"></div>' +
        '</div>'
      ).join('');

      const labels = $('[data-giving-labels]');
      if (labels) labels.innerHTML = U.giving.labels.map(l => '<span>' + esc(l) + '</span>').join('');

      const segs = $$('.bars__seg', barHost);
      growOnScroll(segs, el => {
        el.style.transition = 'transform .9s cubic-bezier(.22,1,.36,1)';
        el.style.transform = 'scaleY(1)';
      });
    }

    /* --- live gift card --- */
    const giftHost = $('[data-gift-card]');
    if (giftHost) {
      giftHost.innerHTML =
        '<div class="gift-card-live__top">' +
          '<div><p class="kpi__label" style="color:rgba(255,255,255,.6);">Your monthly gift</p>' +
            '<p class="gift-card-live__amount">$<span data-gift-amount>' + U.gift.amount + '</span>' +
            '<small> /mo</small></p></div>' +
          '<span class="pill pill--paid"><i class="bi bi-check-circle-fill"></i> Active</span>' +
        '</div>' +
        '<dl>' +
          '<div><dt>Next charge</dt><dd>' + esc(U.gift.nextCharge) + '</dd></div>' +
          '<div><dt>Payment method</dt><dd>' + esc(U.gift.method) + '</dd></div>' +
          '<div><dt>Designation</dt><dd>' + esc(U.gift.designation) + '</dd></div>' +
          '<div><dt>Started</dt><dd>' + esc(U.gift.started) + '</dd></div>' +
          '<div><dt>Fees covered</dt><dd>' + (U.gift.feeCoverage ? 'Yes — 100% to the field' : 'No') + '</dd></div>' +
        '</dl>' +
        '<div class="d-flex flex-wrap gap-2" style="margin-top:1.25rem;">' +
          '<button class="btn-mini" data-gift-action="change">Change amount</button>' +
          '<button class="btn-mini" data-gift-action="designate">Change designation</button>' +
          '<button class="btn-mini" data-gift-action="cancel">Cancel gift</button>' +
        '</div>';

      giftHost.addEventListener('click', e => {
        const btn = e.target.closest('[data-gift-action]');
        if (!btn) return;
        const copy = {
          change:    'Amount changes take effect from your next charge. We would email you a link, not make you call.',
          designate: 'Restricted gifts are never moved between programmes without your written consent.',
          cancel:    'One email, no phone call, no retention offer. That is the whole process.'
        };
        showToast(btn.dataset.giftAction.charAt(0).toUpperCase() + btn.dataset.giftAction.slice(1), copy[btn.dataset.giftAction]);
      });
    }

    /* --- impact --- */
    const impactHost = $('[data-impact]');
    if (impactHost) {
      impactHost.innerHTML = U.impact.map(i =>
        '<a class="impact-tile" href="' + esc(i.href) + '">' +
          '<i class="bi ' + esc(i.icon) + '"></i>' +
          '<b data-impact-n="' + i.value + '">0</b>' +
          '<span>' + esc(i.label) + '</span>' +
          '<em>see where this goes</em>' +
        '</a>'
      ).join('');

      const nums = $$('[data-impact-n]', impactHost);
      growOnScroll(nums, el => {
        countTo(el, +el.dataset.impactN, { format: v => Math.round(v).toLocaleString('en-US') });
      });
    }

    /* --- receipt history --- */
    const histHost = $('[data-history]');
    if (histHost) {
      const draw = filter => {
        const rows = U.history.filter(h => filter === 'all' || h.status === filter);
        if (!rows.length) {
          histHost.innerHTML = '<tr><td colspan="4" class="dash-empty">Nothing here.</td></tr>';
          return;
        }
        histHost.innerHTML = rows.map(h =>
          '<tr>' +
            '<td><code>' + esc(h.ref) + '</code><div class="muted">' + esc(h.designation) + '</div></td>' +
            '<td class="muted">' + esc(h.date) + '</td>' +
            '<td>' + statusPill(h.status) + '</td>' +
            '<td class="num">' + money(h.amount) + '</td>' +
          '</tr>'
        ).join('');
      };
      draw('all');

      $$('[data-history-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
          $$('[data-history-filter]').forEach(b => {
            b.classList.remove('is-active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
          draw(btn.dataset.historyFilter);
        });
      });
    }

    /* --- tax box --- */
    const taxHost = $('[data-tax]');
    if (taxHost) {
      const T = U.tax;
      taxHost.innerHTML =
        '<div class="table-wrap"><table class="dash-table"><tbody>' +
          '<tr><td>Legal name</td><td class="num">' + esc(account.name) + '</td></tr>' +
          '<tr><td>Tax year</td><td class="num">2026</td></tr>' +
          '<tr><td>Gift deductible</td><td class="num">' + (T.deductible ? 'Yes — 501(c)(3)' : 'No') + '</td></tr>' +
          '<tr><td>EIN</td><td class="num"><code>' + esc(T.ein) + '</code></td></tr>' +
          '<tr><td>Lifetime giving</td><td class="num">' + money(T.lifetimeGiven) + '</td></tr>' +
        '</tbody></table></div>' +
        '<p class="kpi__note" style="margin-top:1rem;">Combined statement for ' + esc(T.lastSummary) +
        ', sent ' + esc(T.lastSummaryDate) + '. Next one arrives January 2027.</p>';
    }

    /* --- settings: prefill + save --- */
    const P = U.preferences;
    const setVal = (id, v) => { const el = $('#' + id); if (el && v !== undefined) el.value = v; };
    const setChk = (id, v) => { const el = $('#' + id); if (el && v !== undefined) el.checked = !!v; };
    setVal('prefEmail', P.email);
    setVal('prefCountry', P.country);
    setChk('prefReceipts', P.receipts);
    setChk('prefQuarterly', P.quarterlyUpdate);
    setChk('prefAppeals', P.appeals);
    setChk('prefAnonymous', P.anonymous);

    const form = $('[data-settings-form]');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const mail = $('#prefEmail');
        if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) {
          mail.classList.add('is-invalid');
          mail.focus();
          showToast('Not saved', 'That email address does not look complete.');
          return;
        }
        if (mail) mail.classList.remove('is-invalid');
        showToast('Preferences saved', 'We have updated ' + (mail ? mail.value.trim() : 'your account') + '.');
      });
    }

    /* --- export --- */
    const receiptBtn = $('[data-export="receipts"]');
    if (receiptBtn) {
      receiptBtn.addEventListener('click', () => {
        downloadCsv(
          'hearth-receipts-' + account.email.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.csv',
          ['Reference', 'Date', 'Designation', 'Method', 'Status', 'Amount'],
          U.history.map(h => [h.ref, h.date, h.designation, h.method, h.status, h.amount])
        );
        showToast('Receipts downloaded', U.history.length + ' receipts exported as CSV.');
      });
    }

    const since = $('[data-since]');
    if (since) since.textContent = 'Member since ' + U.memberSince;
  }

  /* ---------------------------------------------------------------- 06 */
  function showToast(title, body) {
    const note = $('[data-toast]');
    if (!note) return;
    note.innerHTML = '<i class="bi bi-check-circle-fill"></i><span><b>' + esc(title) + '</b> ' + esc(body) + '</span>';
    note.classList.add('is-visible');
    setTimeout(() => note.classList.remove('is-visible'), 4200);
  }

  /* ---------------------------------------------------------------- 07 */
  function init() {
    if (!DATA) return;

    if ($('[data-signup-form]')) { initSignup(); return; }
    if ($('[data-auth-form]')) { initAuth(); return; }

    if ($('[data-dashboard="admin"]')) {
      const acct = initSession('admin');
      if (acct) initAdmin(acct);
      return;
    }
    if ($('[data-dashboard="user"]')) {
      const acct = initSession('user');
      if (acct) initUser(acct);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
