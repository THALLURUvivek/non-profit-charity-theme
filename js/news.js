/* ==========================================================================
   Hearth Foundation — article renderer
   --------------------------------------------------------------------------
   article.html is one template; the story it shows comes from ?id=<slug> in
   js/news-data.js. Rendered synchronously at parse time so main.js sees the
   finished DOM and can animate the headline and hero.

   Unknown or missing slug renders an inline not-found panel rather than
   bouncing to 404.html, so the reader keeps the URL they followed.
   ========================================================================== */
(function () {
  'use strict';

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));

  const DATA = window.HearthNews;

  /* ---------------------------------------------------------------- 00 */
  const esc = s => String(s == null ? '' : s)
    .replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const SITE = 'https://hearthfoundation.org';

  /* story URLs are relative so the demo works from a file server, but the
     canonical + og:url we publish are absolute */
  const storyUrl = s => 'article.html?id=' + encodeURIComponent(s.slug);
  const absUrl  = s => SITE + '/' + storyUrl(s);

  /* ---------------------------------------------------------------- 01 */
  /* one data attribute, swapped on load: <title>, meta description, canonical,
     Open Graph and Twitter cards. Crawlers that do not run JS still get the
     generic copy from the HTML head.

     Tags are upserted rather than assumed — a missing one is created, so a
     typo in the head can never silently drop a field from a shared preview. */
  function upsert(sel, make, value) {
    const el = $(sel);
    if (el) { el.setAttribute('content', value); return; }
    const made = make();
    made.setAttribute('content', value);
    document.head.appendChild(made);
  }

  function setMeta(story) {
    const title = story.title + ' — Hearth Foundation';
    document.title = title;

    const head = document.head;

    const desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', story.dek);
    else {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      m.setAttribute('content', story.dek);
      head.appendChild(m);
    }

    const canonical = $('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', absUrl(story));
    else {
      const l = document.createElement('link');
      l.setAttribute('rel', 'canonical');
      l.setAttribute('href', absUrl(story));
      head.appendChild(l);
    }

    const prop = n => () => {
      const m = document.createElement('meta');
      m.setAttribute('property', n);
      return m;
    };
    const named = n => () => {
      const m = document.createElement('meta');
      m.setAttribute('name', n);
      return m;
    };

    upsert('meta[property="og:title"]',       prop('og:title'),       title);
    upsert('meta[property="og:description"]', prop('og:description'), story.dek);
    upsert('meta[property="og:url"]',         prop('og:url'),         absUrl(story));
    upsert('meta[property="og:image"]',       prop('og:image'),       story.hero.src);
    upsert('meta[property="article:published_time"]', prop('article:published_time'), story.iso);
    upsert('meta[name="twitter:title"]',       named('twitter:title'),       title);
    upsert('meta[name="twitter:description"]', named('twitter:description'), story.dek);
    upsert('meta[name="twitter:image"]',       named('twitter:image'),       story.hero.src);
  }

  /* ---------------------------------------------------------------- 02 */
  /* body blocks -> markup

     Adjacent elements are separated by whitespace on purpose. Without it the
     nodes fuse in textContent, so copied text, reader-mode extraction and the
     word count all produce "installation$1,340" instead of two words. */

  function blockHtml(b) {
    switch (b.t) {
      case 'h2':
        return '<h2>' + esc(b.v) + '</h2>';

      case 'quote':
        return '<blockquote class="pullquote">' + esc(b.v) +
          (b.by ? ' <cite>' + esc(b.by) + '</cite>' : '') + '</blockquote>';

      case 'list':
        return '<ul>\n' + b.items.map(i => '<li>' + esc(i) + '</li>').join('\n') + '\n</ul>';

      case 'stats':
        return '<div class="factrow">\n' + b.items.map(s =>
          '<div><b>' + esc(s.v) + '</b> <span>' + esc(s.l) + '</span></div>').join('\n') + '\n</div>';

      case 'note':
        return '<aside class="whatwrong">' +
          '<b><i class="bi bi-exclamation-triangle-fill"></i> What we got wrong</b> ' + esc(b.v) +
        '</aside>';

      case 'figure':
        return '<figure>\n' +
          '<img src="' + esc(b.src) + '" alt="' + esc(b.alt) + '" width="1200" height="800" loading="lazy" decoding="async">\n' +
          (b.credit ? '<figcaption>' + esc(b.credit) + '</figcaption>\n' : '') +
        '</figure>';

      case 'p':
      default:
        return '<p>' + esc(b.v) + '</p>';
    }
  }

  /* same card as the news.html archive, so related and archive never drift */
  function cardHtml(story) {
    const cat = DATA.categories[story.category] || { label: story.category, cls: '' };
    return '<article class="card-shell" data-stagger-item>' +
      '<div class="card-shell__media">' +
        '<span class="card-shell__tag ' + cat.cls + '">' + esc(cat.label) + '</span>' +
        '<img src="' + esc(story.hero.src) + '" width="700" height="480" loading="lazy" decoding="async" alt="' + esc(story.hero.alt) + '">' +
      '</div>' +
      '<div class="card-shell__body">' +
        '<p class="card-shell__meta"><i class="bi bi-calendar3"></i> ' + esc(story.date) + ' <span>·</span> ' + story.readTime + ' min</p>' +
        '<h3>' + esc(story.title) + '</h3>' +
        '<p>' + esc(story.excerpt || story.dek) + '</p>' +
        '<div class="card-shell__foot">' +
          '<span class="card-shell__price" style="font-size:1rem;"><i class="bi ' + esc(story.kickerIcon || 'bi-geo-alt') + '"></i> ' + esc(story.kicker) + '</span>' +
          '<a class="arrow-btn" href="' + storyUrl(story) + '" aria-label="Read: ' + esc(story.title) + '"><i class="bi bi-arrow-up-right"></i></a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* ---------------------------------------------------------------- 03 */
  function renderHead(s) {
    const cat = DATA.categories[s.category] || { label: s.category };

    const crumb = $('[data-crumb]');
    if (crumb) crumb.textContent = s.title;

    const tags = $('[data-article-tags]');
    if (tags) {
      tags.innerHTML =
        '<span class="tag">' + esc(cat.label) + '</span>' +
        '<span class="tag"><i class="bi bi-calendar3"></i> ' + esc(s.date) + '</span>' +
        '<span class="tag">' + s.readTime + ' min read</span>' +
        (s.kicker ? '<span class="tag"><i class="bi ' + esc(s.kickerIcon || 'bi-geo-alt') + '"></i> ' + esc(s.kicker) + '</span>' : '');
    }

    const title = $('[data-article-title]');
    if (title) title.textContent = s.title;

    const dek = $('[data-article-dek]');
    if (dek) dek.textContent = s.dek;

    const byline = $('[data-article-byline]');
    if (byline) {
      byline.innerHTML =
        '<img src="' + esc(s.author.photo) + '" alt="Portrait of ' + esc(s.author.name) + '" width="54" height="54" loading="lazy" decoding="async">' +
        '<span>' +
          '<b>' + esc(s.author.name) + '</b>' +
          '<span>' + esc(s.author.role) + '</span>' +
        '</span>';
    }
  }

  function renderHero(s) {
    const fig = $('[data-article-hero]');
    if (!fig) return;
    const img = $('[data-article-hero-img]', fig);
    if (img) {
      img.src = s.hero.src;
      img.alt = s.hero.alt;
    }
    const credit = $('[data-article-credit]', fig);
    if (credit) {
      credit.textContent = s.hero.credit || '';
      credit.hidden = !s.hero.credit;
    }
    fig.hidden = false;
  }

  function renderBody(s) {
    const host = $('[data-article-body]');
    if (host) host.innerHTML = s.blocks.map(blockHtml).join('\n');

    const take = $('[data-article-takeaways]');
    if (take) {
      if (!s.takeaways || !s.takeaways.length) { take.hidden = true; return; }
      const list = $('[data-article-takeaway-list]', take);
      if (list) list.innerHTML = s.takeaways.map(t => '<li>' + esc(t) + '</li>').join('');
      take.hidden = false;
    }
  }

  function renderAuthor(s) {
    const card = $('[data-article-author]');
    if (!card) return;
    card.innerHTML =
      '<img src="' + esc(s.author.photo) + '" alt="Portrait of ' + esc(s.author.name) + '" width="76" height="76" loading="lazy" decoding="async">' +
      '<div>' +
        '<h3>' + esc(s.author.name) + '</h3>' +
        '<p class="byline-card__role">' + esc(s.author.role) + '</p>' +
        '<p>Writes the field reports we publish unedited, and signs off on the numbers in them. ' +
          'Every story carries the community board\'s sign-off before publication — including the parts that went wrong.</p>' +
        '<div class="byline-card__links">' +
          '<a class="link-underline" href="news.html">More from the archive</a>' +
          '<a class="link-underline" href="mailto:press@hearthfoundation.org">Ask a question</a>' +
        '</div>' +
      '</div>';
    card.hidden = false;
  }

  function renderFacts(s) {
    const dl = $('[data-article-facts]');
    if (!dl) return;
    const cat = DATA.categories[s.category] || { label: s.category };
    const rows = [
      ['Type', cat.label],
      ['Published', s.date],
      ['Reading time', s.readTime + ' min'],
      ['Written by', s.author.name]
    ];
    if (s.kicker) rows.push(['Filed under', s.kicker]);
    dl.innerHTML = rows.map(r =>
      '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>').join('');
  }

  function renderShare(s) {
    const host = $('[data-article-share]');
    if (!host) return;
    const url = encodeURIComponent(absUrl(s));
    const text = encodeURIComponent(s.title);
    host.innerHTML =
      '<a href="https://twitter.com/intent/tweet?url=' + url + '&text=' + text + '" target="_blank" rel="noopener" aria-label="Share on X"><i class="bi bi-twitter-x"></i></a>' +
      '<a href="https://www.linkedin.com/sharing/share-offsite/?url=' + url + '" target="_blank" rel="noopener" aria-label="Share on LinkedIn"><i class="bi bi-linkedin"></i></a>' +
      '<a href="mailto:?subject=' + text + '&body=' + url + '" aria-label="Share by email"><i class="bi bi-envelope"></i></a>' +
      '<button type="button" data-copy-link aria-label="Copy link to this story"><i class="bi bi-link-45deg"></i></button>';

    const btn = $('[data-copy-link]', host);
    if (btn) btn.addEventListener('click', () => copyLink(btn));
  }

  function renderRelated(s) {
    const section = $('[data-article-related-section]');
    const host = $('[data-article-related]');
    if (!host) return;

    const related = DATA.related(s, 3);
    /* nothing curated for this story — fall back to the newest three so the
       page never ends on an empty band */
    const list = related.length ? related : DATA.latest(4).filter(x => x.slug !== s.slug).slice(0, 3);
    if (!list.length) { if (section) section.hidden = true; return; }

    host.innerHTML = list.map(cardHtml).join('');
    if (section) section.hidden = false;
  }

  function renderFoot(s) {
    const foot = $('[data-article-foot]');
    if (foot) {
      foot.innerHTML =
        'Published ' + esc(s.date) + ' · ' + esc(s.author.name) + ' · ' +
        '<a class="link-underline" href="index.html#transparency">See how this was funded</a>';
    }
  }

  /* ---------------------------------------------------------------- 04 */
  function copyLink(btn) {
    const url = location.href;
    const done = ok => {
      const icon = btn.querySelector('i');
      if (!icon) return;
      icon.className = ok ? 'bi bi-check2' : 'bi bi-x-lg';
      btn.setAttribute('aria-label', ok ? 'Link copied' : 'Copy failed');
      setTimeout(() => {
        icon.className = 'bi bi-link-45deg';
        btn.setAttribute('aria-label', 'Copy link to this story');
      }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => done(true), () => done(fallbackCopy(url)));
      return;
    }
    done(fallbackCopy(url));
  }

  /* clipboard API needs a secure context, which a plain http demo is not */
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  /* thin reading-progress bar — 0 to 100% across the prose block only */
  function initReadProgress() {
    const bar = $('[data-read-bar]');
    const body = $('[data-article-body]');
    if (!bar || !body) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const box = body.getBoundingClientRect();
      const start = box.top + window.pageYOffset;
      const span = box.height || 1;
      const pct = ((window.pageYOffset + window.innerHeight * 0.75 - start) / span) * 100;
      bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------------------------------------------------------------- 05 */
  /* Archive cards on news.html carry hand-written text: a read-time estimate,
     an excerpt and a kicker. Rewrite all three from the data so an edit to an
     article body cannot leave a stale number or a mismatched teaser sitting in
     the archive. Safe on any page — it only touches cards declaring data-story,
     and the static markup is already correct for anyone without JS. */
  function syncArchiveCards() {
    $$('[data-story]').forEach(card => {
      const s = DATA.get(card.getAttribute('data-story'));
      if (!s) return;

      const meta = $('.card-shell__meta', card);
      if (meta) {
        const last = meta.lastChild;
        if (last && last.nodeType === 3) last.nodeValue = ' ' + s.readTime + ' min';
      }

      const excerpt = $('.card-shell__body h3 + p', card);
      if (excerpt) excerpt.textContent = s.excerpt || s.dek;

      const kicker = $('.card-shell__price', card);
      if (kicker) {
        const icon = kicker.querySelector('i');
        kicker.textContent = (icon ? icon.outerHTML + ' ' : '') + s.kicker;
      }
    });
  }

  function renderNotFound(slug) {
    document.title = 'Story not found — Hearth Foundation';
    const crumb = $('[data-crumb]');
    if (crumb) crumb.textContent = 'Not found';

    const title = $('[data-article-title]');
    if (title) title.textContent = 'That story is not here';

    const dek = $('[data-article-dek]');
    if (dek) {
      dek.textContent = slug
        ? 'Nothing is published under "' + slug + '". It may have been renamed, or the link may be mistyped.'
        : 'No story was requested. Pick one from the archive — there are 312 field reports back to 2013.';
    }

    const tags = $('[data-article-tags]');
    if (tags) tags.innerHTML = '';

    /* the not-found state is a plain panel, so drop the aside and related band
       rather than leaving empty furniture on the page */
    const aside = $('.article-aside');
    if (aside) aside.remove();
    const rel = $('[data-article-related-section]');
    if (rel) rel.remove();
    const hero = $('[data-article-hero]');
    if (hero) hero.remove();
    const take = $('[data-article-takeaways]');
    if (take) take.remove();

    const body = $('[data-article-body]');
    if (body) {
      body.className = '';
      body.innerHTML =
        '<div class="err-links" style="margin-top:0;border-top:0;padding-top:0;">' +
          '<h2>Try one of these</h2>' +
          '<ul>' +
            '<li><a href="news.html"><i class="bi bi-journal-text"></i> The full archive</a></li>' +
            '<li><a href="index.html"><i class="bi bi-house"></i> Home</a></li>' +
            '<li><a href="contact.html"><i class="bi bi-envelope"></i> Tell us the link was broken</a></li>' +
          '</ul>' +
        '</div>';
    }

    const byline = $('[data-article-byline]');
    if (byline) byline.remove();
    const foot = $('[data-article-foot]');
    if (foot) foot.remove();
  }

  /* ---------------------------------------------------------------- 06 */
  function init() {
    if (!DATA) return;

    /* runs on news.html too, where there is no article shell */
    syncArchiveCards();

    if (!$('[data-article-title]')) return;

    const slug = new URLSearchParams(location.search).get('id');
    const story = slug ? DATA.get(slug) : null;

    if (!story) { renderNotFound(slug); return; }

    setMeta(story);
    renderHead(story);
    renderHero(story);
    renderBody(story);
    renderAuthor(story);
    renderFacts(story);
    renderShare(story);
    renderRelated(story);
    renderFoot(story);
    initReadProgress();
  }

  /* Render before main.js initialises so the headline split and hero
     animations see a finished DOM. Both scripts sit at the end of body, so
     readyState is still "loading" here. */
  init();
})();