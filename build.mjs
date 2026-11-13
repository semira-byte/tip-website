/**
 * The Inside Perspective · static site builder
 *
 *   node build.mjs            -> dist/     (what gets deployed to Vercel)
 *   PREVIEW=1 node build.mjs  -> preview/  (private review copy: relative links,
 *                                           placeholder images, forms simulate sending)
 *
 * Content lives in src/data.mjs. Page templates live in this file.
 * No dependencies: plain Node 18+.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, TIP_DATA } from './src/data.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PREVIEW = process.env.PREVIEW === '1';
const OUT = join(ROOT, PREVIEW ? 'preview' : 'dist');
const BUILD_DATE = new Date().toISOString().slice(0, 10);

/* =========================================================================
   Helpers
   ========================================================================= */

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const slugify = (s) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const pad = (n) => String(n).padStart(2, '0');

const ICONS = Object.fromEntries(
  readdirSync(join(ROOT, 'src/icons')).map((f) => {
    const svg = readFileSync(join(ROOT, 'src/icons', f), 'utf8');
    const filled = /fill="currentColor"/.test(svg.split('>')[0] + '>');
    const inner = svg
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, '')
      .replace(/\s+/g, ' ')
      .trim();
    return [f.replace('.svg', ''), { inner, filled }];
  })
);

/** Inline SVG icon. Decorative by default (hidden from screen readers). */
function icon(name, cls = '') {
  const i = ICONS[name];
  if (!i) throw new Error(`Missing icon: ${name}`);
  const paint = i.filled
    ? 'fill="currentColor"'
    : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" ${paint} aria-hidden="true" focusable="false">${i.inner}</svg>`;
}

const tagIcon = (tag) => (tag === 'Biology' ? 'dna' : tag === 'Mental Health' ? 'brain' : 'flame');

/* ---------- URLs ----------
   Production uses clean URLs (/episodes, /episodes/slug). Vercel serves the
   matching .html file because vercel.json has "cleanUrls": true.
   The private preview uses relative .html links so it works anywhere. */
// Listing pages that share a folder with their child pages are built as folder/index.html
// (e.g. /episodes -> episodes/index.html, next to /episodes/<slug>) so Vercel never has to
// choose between a file and a folder with the same name.
const DIR_INDEX = new Set(['/episodes']);

function makeLinker(depth) {
  const base = PREVIEW ? (depth ? '../'.repeat(depth) : '') : '/';
  return {
    page(p) {
      // p like "/", "/episodes", "/episodes/slug", "/#subscribe"
      const [path, hash] = p.split('#');
      let out;
      if (!PREVIEW) out = path;
      else if (path === '/' || path === '') out = base + 'index.html';
      else if (DIR_INDEX.has(path)) out = base + path.replace(/^\//, '') + '/index.html';
      else out = base + path.replace(/^\//, '') + '.html';
      return hash !== undefined ? `${out}#${hash}` : out;
    },
    asset(p) {
      return PREVIEW ? base + p.replace(/^\//, '') : p;
    },
  };
}

const abs = (p) => SITE.url + (p === '/' ? '/' : p);

/* ---------- Data shaping ---------- */
const S3 = TIP_DATA.season3.episodes.map((ep) => ({
  ...ep,
  slug: slugify(ep.title),
  path: `/episodes/${slugify(ep.title)}`,
  isLive: ep.status === 'live' && !!ep.youtubeId,
}));
const LIVE = S3.filter((e) => e.isLive);
const LATEST = LIVE[LIVE.length - 1];
const epByNum = (n) => S3.find((e) => e.number === n);
const GUIDES = TIP_DATA.guides.map((g) => ({ ...g, path: `/guides/${g.id}` }));

function dateLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** Highlights the signature Liy word in a title. */
const liyTitle = (title) => esc(title).replace(/(\b[A-Za-z]+Liy\b)/g, '<span class="liy">$1</span>');

/* ---------- Images ---------- */
const PLACEHOLDER = (w, h, label) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="g" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#3b1a80"/><stop offset="1" stop-color="#0d0920"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="52%" fill="#a66fff" font-family="Inter,Arial" font-size="${Math.round(w / 22)}" text-anchor="middle" letter-spacing="3">${label}</text></svg>`
  );

/** Vercel resizes /images/* on the fly (see "images" in vercel.json), so phones
    get a ~640px file instead of the 3000px original. If resizing ever fails,
    onerror falls back to the original file. */
function responsiveImg(L, { src, alt, width, height, cls, sizes, eager = false, widths = [640, 1080, 1920] }) {
  if (PREVIEW) {
    return `<img class="${cls}" src="${L.asset(src)}" alt="${esc(alt)}" width="${width}" height="${height}" decoding="async">`;
  }
  const srcset = widths.map((w) => `/_vercel/image?url=${encodeURIComponent(src)}&amp;w=${w}&amp;q=80 ${w}w`).join(', ');
  return `<img class="${cls}" src="${src}" srcset="${srcset}" sizes="${sizes}" alt="${esc(alt)}" width="${width}" height="${height}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onerror="this.onerror=null;this.removeAttribute('srcset');">`;
}

function ytThumb(id, { cls = 'ep-thumb-photo', alt = '', max = false } = {}) {
  if (PREVIEW) return `<img class="${cls}" src="${PLACEHOLDER(480, 270, 'EPISODE')}" alt="${esc(alt)}" width="480" height="270">`;
  if (max) {
    return `<img class="${cls}" src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg" alt="${esc(alt)}" width="1280" height="720" decoding="async" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'">`;
  }
  return `<img class="${cls}" src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="${esc(alt)}" width="320" height="180" loading="lazy" decoding="async">`;
}

/* =========================================================================
   Shared layout
   ========================================================================= */

function head(L, { title, description, path, image, type = 'website', jsonld = [], noindex = false }) {
  const fullTitle = title ? `${title} · ${SITE.name}` : `${SITE.name} · ${SITE.tagline}`;
  const ogImage = image || `${SITE.url}/images/about-cover.jpg`;
  const ld = jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n  ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description)}">
  ${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${abs(path)}">`}
  <meta name="theme-color" content="#08080f">
  <link rel="icon" type="image/png" sizes="32x32" href="${L.asset('/images/favicon-32x32.png')}">
  <link rel="icon" type="image/png" sizes="16x16" href="${L.asset('/images/favicon-16x16.png')}">
  <link rel="icon" href="${L.asset('/images/favicon.ico')}" sizes="any">
  <link rel="apple-touch-icon" href="${L.asset('/images/apple-touch-icon.png')}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${abs(path)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(fullTitle)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="alternate" type="application/rss+xml" title="${SITE.name} podcast feed" href="${SITE.links.rss}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;display=swap">
  <link rel="stylesheet" href="${L.asset('/style.css')}">
  <script src="${L.asset('/assets/site.js')}" defer></script>
  ${ld}
</head>`;
}

const NAV_ITEMS = [
  ['/episodes', 'Episodes'],
  ['/resources', 'Resources'],
  ['/about', 'About'],
];

const LISTEN = [
  ['youtube', 'YouTube', 'brand-youtube'],
  ['spotify', 'Spotify', 'brand-spotify'],
  ['apple', 'Apple Podcasts', 'brand-apple-podcast'],
  ['rss', 'RSS', 'rss'],
];

function nav(L, current, { subscribeHref = '#subscribe' } = {}) {
  const links = NAV_ITEMS.map(
    ([p, label]) => `<a href="${L.page(p)}"${current === p ? ' aria-current="page"' : ''}>${label}</a>`
  ).join('\n      ');
  const mobile = NAV_ITEMS.map(
    ([p, label]) => `<a href="${L.page(p)}"${current === p ? ' aria-current="page"' : ''}>${label}</a>`
  ).join('\n    ');
  const listen = LISTEN.map(([k, label]) => `<a href="${SITE.links[k]}" target="_blank" rel="noopener">${label}</a>`).join('\n    ');
  return `
<a class="skip-link" href="#main">Skip to content</a>
<nav class="site-nav" aria-label="Main">
  <a class="nav-logo" href="${L.page('/')}" aria-label="${SITE.name}, home">TiP</a>
  <div class="nav-links">
      ${links}
  </div>
  <div class="nav-right">
    <a class="nav-cta" href="${subscribeHref}">Subscribe</a>
    <button class="nav-hamburger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${icon('menu-2', 'ico-open')}${icon('x', 'ico-close')}</button>
  </div>
</nav>
<div class="mobile-menu" id="mobile-menu">
    ${mobile}
    <span class="mobile-menu-label">Listen</span>
    ${listen}
</div>`;
}

function footer(L) {
  const internal = NAV_ITEMS.map(([p, label]) => `<li><a href="${L.page(p)}">${label}</a></li>`).join('');
  const external = [
    ['youtube', 'YouTube'],
    ['instagram', 'Instagram'],
    ['tiktok', 'TikTok'],
    ['spotify', 'Spotify'],
    ['apple', 'Apple Podcasts'],
    ['rss', 'RSS'],
  ]
    .map(([k, label]) => `<li><a href="${SITE.links[k]}" target="_blank" rel="noopener">${label}</a></li>`)
    .join('');
  return `
<footer class="site-footer">
  <div class="footer-logo">${SITE.name} · insideperspective.org</div>
  <ul class="footer-links">${internal}${external}</ul>
  <p class="footer-crisis">If you're struggling right now, call or text <a href="https://988lifeline.org" target="_blank" rel="noopener">988</a> (US) or visit <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a> to find support near you.</p>
</footer>
</body>
</html>
`;
}

function page(L, opts, current, body, navOpts) {
  return `${head(L, opts)}
<body>
${nav(L, current, navOpts)}
<main id="main">
${body}
</main>
${footer(L)}`;
}

/* ---------- Signup form (one component, used everywhere) ---------- */
let formCount = 0;
function signup({ source, eyebrow, title, sub, id = 'subscribe', button = 'Subscribe' }) {
  const n = ++formCount;
  const endpoint = PREVIEW ? 'mock:' : '/api/subscribe';
  return `
<section class="subscribe-section" id="${id}" aria-labelledby="signup-title-${n}">
  <div class="subscribe-eyebrow">${esc(eyebrow)}</div>
  <h2 class="subscribe-title" id="signup-title-${n}">${title}</h2>
  <p class="subscribe-sub">${esc(sub)}</p>
  <form class="signup-form" action="/api/subscribe" method="post" data-endpoint="${endpoint}" data-source="${esc(source)}" novalidate>
    <div class="hp" aria-hidden="true">
      <label for="company-${n}">Company</label>
      <input id="company-${n}" type="text" name="company" tabindex="-1" autocomplete="off">
    </div>
    <input type="hidden" name="ts" value="">
    <label class="sr-only" for="email-${n}">Email address</label>
    <div class="signup-row">
      <input class="signup-input" id="email-${n}" type="email" name="email" autocomplete="email" inputmode="email" placeholder="you@email.com" maxlength="254" required aria-describedby="signup-status-${n}">
      <button class="btn-primary signup-btn" type="submit"><span class="spinner" aria-hidden="true"></span><span class="btn-label">${esc(button)}</span></button>
    </div>
    <p class="form-status" id="signup-status-${n}" role="status" aria-live="polite"></p>
    <p class="signup-fine">No spam. Just new episodes and free resources. Unsubscribe anytime.</p>
  </form>
</section>`;
}

/* ---------- Cards ---------- */
function epCard(L, ep, headingLevel = 'h3') {
  const H = headingLevel;
  const label = `Ep. ${pad(ep.number)}`;
  const thumb = ep.isLive
    ? `${ytThumb(ep.youtubeId)}<div class="ep-thumb-wash"></div>`
    : `<svg class="ep-thumb-hex" width="90" height="104" viewBox="0 0 90 104" fill="none" aria-hidden="true"><polygon points="45,2 88,26 88,78 45,102 2,78 2,26" stroke="#7B2FFF" stroke-width="1" fill="none"/></svg>`;
  const titleHtml = ep.isLive
    ? `<a class="ep-card-link" href="${L.page(ep.path)}">${esc(ep.title)}</a>`
    : esc(ep.title);
  return `
    <li>
      <article class="ep-card ${ep.isLive ? 'is-live' : 'ep-coming'}">
        <div class="ep-thumb">
          <div class="ep-thumb-inner"></div>
          ${thumb}
          <span class="ep-num">${label}</span>
          <div class="ep-play" aria-hidden="true">${icon(ep.isLive ? 'player-play-filled' : 'clock')}</div>
        </div>
        <div class="ep-body">
          <div class="ep-tag">${icon(tagIcon(ep.tag))}${esc(ep.tag)}</div>
          <${H} class="ep-title"><span class="sr-only">${label}: </span>${titleHtml}</${H}>
          <p class="ep-desc">${esc(ep.description)}</p>
          <div class="ep-meta"><span class="ep-status ${ep.isLive ? 'live' : 'soon'}">${ep.isLive ? 'Watch now' : 'Coming soon'}</span></div>
        </div>
      </article>
    </li>`;
}

function archiveCard(ep) {
  const url = `https://www.youtube.com/watch?v=${ep.youtubeId}`;
  return `
    <li>
      <article class="ep-card is-live">
        <div class="ep-thumb">
          <div class="ep-thumb-inner"></div>
          ${ytThumb(ep.youtubeId)}<div class="ep-thumb-wash"></div>
          <span class="ep-num">Season ${ep.season}</span>
          <div class="ep-play" aria-hidden="true">${icon('player-play-filled')}</div>
        </div>
        <div class="ep-body">
          <div class="ep-tag">${icon(tagIcon(ep.tag))}${esc(ep.tag)}</div>
          <h3 class="ep-title"><a class="ep-card-link" href="${url}" target="_blank" rel="noopener">${esc(ep.title)}<span class="sr-only"> (opens YouTube)</span></a></h3>
          <div class="ep-meta"><span class="ep-status live">Watch on YouTube</span></div>
        </div>
      </article>
    </li>`;
}

function epNote(L, n, verbLive = 'Mentioned in') {
  if (n == null) return '';
  const ep = epByNum(n);
  if (!ep) return '';
  return ep.isLive
    ? `<span class="res-ep">${verbLive} Ep. ${pad(n)}</span>`
    : `<span class="res-ep">Pairs with Ep. ${pad(n)}, coming soon</span>`;
}

function resourceCard(L, r) {
  const typeIcon = r.type === 'Book' ? 'book' : r.type === 'Research' ? 'file-text' : 'world';
  return `
    <li>
      <a class="res-card" href="${esc(r.url)}" target="_blank" rel="noopener">
        <div class="res-type">${icon(typeIcon)}${esc(r.type)}</div>
        <h3 class="res-title">${esc(r.title)}</h3>
        ${r.author ? `<div class="res-author">${esc(r.author)}</div>` : ''}
        <p class="res-desc">${esc(r.description)}</p>
        <div class="res-foot">${epNote(L, r.relatedEpisode)}<span class="res-link">View resource ${icon('external-link')}<span class="sr-only"> (opens in a new tab)</span></span></div>
      </a>
    </li>`;
}

function guideCard(L, g, H = 'h3') {
  return `
    <li>
      <a class="res-card" href="${L.page(g.path)}">
        <div class="res-type">${icon('compass')}Free guide · ${esc(g.tag)}</div>
        <${H} class="res-title">${esc(g.title)}</${H}>
        <p class="res-desc">${esc(g.description)}</p>
        <div class="res-foot">${epNote(L, g.relatedEpisode, 'Goes with')}<span class="res-link">Read the guide ${icon('arrow-right')}</span></div>
      </a>
    </li>`;
}

function listenRow(label = 'Also on') {
  return `<div class="listen-row"><span>${label}</span>${LISTEN.map(
    ([k, name, ic]) => `<a href="${SITE.links[k]}" target="_blank" rel="noopener">${icon(ic)}${name}</a>`
  ).join('')}</div>`;
}

const crisisCard = (title = 'If this brings something up') => `
  <div class="crisis-card"><strong>${title}</strong>You don't have to sit with it alone. Call or text <a href="https://988lifeline.org" target="_blank" rel="noopener">988</a> (US) or visit <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a> to talk to someone right now.</div>`;

/* ---------- Structured data ---------- */
const SERIES = {
  '@type': 'PodcastSeries',
  name: SITE.name,
  url: SITE.url + '/',
};

function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(p) })),
  };
}

function breadcrumbNav(L, items) {
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${items
    .map(([name, p], i) =>
      i === items.length - 1 ? `<li aria-current="page">${esc(name)}</li>` : `<li><a href="${L.page(p)}">${esc(name)}</a></li>`
    )
    .join('')}</ol></nav>`;
}

/* =========================================================================
   Pages
   ========================================================================= */
const pages = {}; // outPath -> html

/* ---------- Home ---------- */
{
  const L = makeLinker(0);
  const featuredGuides = [...GUIDES].sort((a, b) => {
    const live = (g) => (g.relatedEpisode != null && epByNum(g.relatedEpisode)?.isLive ? 0 : 1);
    return live(a) - live(b);
  }).slice(0, 3);

  const body = `
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-content">
      <div class="hero-eyebrow">Season 3 · Now streaming</div>
      <h1 class="hero-title" id="hero-title">The <span class="accent">Inside</span><br>Perspective</h1>
      <p class="hero-theme">"${esc(TIP_DATA.season3.theme)}"</p>
      <p class="hero-desc">
        Every day you make choices that affect your body, your mind, and your energy.
        <strong>Most of us never stop to think about what that's actually doing on the inside.</strong>
        That's what this podcast is for.
      </p>
      <div class="hero-actions">
        <a class="btn-primary" href="${L.page(LATEST.path)}">${icon('player-play-filled')}Watch the newest episode</a>
        <a class="btn-ghost" href="#subscribe">${icon('mail')}Get episodes by email</a>
      </div>
      ${listenRow('Also on')}
    </div>
    <div class="hero-visual">
      ${responsiveImg(L, { src: '/images/hero-hand.webp', alt: 'The Inside Perspective logo: a glass hand wearing a gold ring', width: 3000, height: 2909, cls: 'hero-visual-img', sizes: '(max-width: 768px) 190px, 52vw', eager: true })}
    </div>
  </section>

  <ul class="pillars-bar">
    <li class="pillar"><span class="pillar-icon">${icon('dna')}</span><div><div class="pillar-num">Pillar 01</div><div class="pillar-name">Biology</div></div></li>
    <li class="pillar"><span class="pillar-icon">${icon('flame')}</span><div><div class="pillar-num">Pillar 02</div><div class="pillar-name">Lifestyle</div></div></li>
    <li class="pillar"><span class="pillar-icon">${icon('brain')}</span><div><div class="pillar-num">Pillar 03</div><div class="pillar-name">Mental Health</div></div></li>
  </ul>

  <section class="section" aria-labelledby="s3-title">
    <div class="section-header">
      <div>
        <div class="section-eyebrow">Now streaming</div>
        <h2 class="section-title" id="s3-title">Season 3</h2>
      </div>
      <a class="section-link" href="${L.page('/episodes')}">All episodes ${icon('arrow-right')}</a>
    </div>
    <div class="s3-banner">
      <div>
        <div class="s3-label">Season theme</div>
        <div class="s3-title">I'm Learning to Take Care of Myself</div>
        <div class="s3-theme">A season opener plus 5 episodes. Real talk. No filter.</div>
      </div>
      <div class="s3-badge">${LIVE.length} of ${S3.length} out now</div>
    </div>
    <ul class="episodes-grid">${S3.map((e) => epCard(L, e)).join('')}
    </ul>
  </section>

  <section class="section" aria-labelledby="guides-title">
    <div class="section-header">
      <div>
        <div class="section-eyebrow">Free for Insiders</div>
        <h2 class="section-title" id="guides-title">Guides</h2>
      </div>
      <a class="section-link" href="${L.page('/resources')}">All resources ${icon('arrow-right')}</a>
    </div>
    <ul class="resources-grid">${featuredGuides.map((g) => guideCard(L, g)).join('')}
    </ul>
  </section>

  <section class="s3-banner cta-banner" aria-labelledby="uf-cta-title" style="margin-top:56px;">
    <div>
      <div class="s3-label">Anonymous, always</div>
      <h2 class="s3-title" id="uf-cta-title">Got something to share?</h2>
      <div class="s3-theme">Stories, questions, or topics you'd love to hear discussed.</div>
    </div>
    <a class="btn-primary" href="${L.page('/episodes#unfiltered-perspectives')}">Unfiltered Perspectives ${icon('arrow-right')}</a>
  </section>
  ${signup({ source: 'home', eyebrow: 'For the Insiders', title: "Don't miss<br>Season 3", sub: 'New episodes and free guides, straight to your inbox. Be the first to know when the next one drops.' })}`;

  pages['index.html'] = page(
    L,
    {
      title: '',
      description: SITE.description,
      path: '/',
      jsonld: [
        {
          '@context': 'https://schema.org',
          ...SERIES,
          description: SITE.description,
          image: `${SITE.url}/images/about-cover.jpg`,
          webFeed: SITE.links.rss,
          inLanguage: 'en-US',
          author: { '@type': 'Person', name: SITE.host },
          sameAs: [SITE.links.youtube, SITE.links.spotify, SITE.links.apple, SITE.links.instagram, SITE.links.tiktok],
        },
      ],
    },
    '/',
    body
  );
}

/* ---------- Episodes ---------- */
{
  const L = makeLinker(1);
  const legacyMap = Object.fromEntries(LIVE.map((e) => [String(e.number), L.page(e.path)]));
  const body = `
  <div class="page-hero" data-episode-map="${esc(JSON.stringify(legacyMap))}">
    <div class="page-hero-eyebrow">${SITE.name}</div>
    <h1>All Episodes</h1>
    <p>Real talk about your health, your healing, and everything in between. Not from a place of perfection, but from a place of growth.</p>
    <div class="hero-actions" style="margin-top:24px;">
      <a class="btn-primary" href="${L.page(LATEST.path)}">${icon('player-play-filled')}Watch the latest: Ep. ${pad(LATEST.number)}</a>
      <a class="btn-ghost" href="#unfiltered-perspectives">${icon('message-circle')}Share your perspective</a>
    </div>
    ${listenRow('Listen on')}
  </div>

  <section class="section" aria-labelledby="s3-title">
    <div class="section-header">
      <div>
        <div class="section-eyebrow">Now streaming</div>
        <h2 class="section-title" id="s3-title">Season 3</h2>
      </div>
      <div class="s3-badge">${LIVE.length} of ${S3.length} out now</div>
    </div>
    <div class="s3-banner">
      <div>
        <div class="s3-label">Season theme</div>
        <div class="s3-title">"I'm Learning to Take Care of Myself."</div>
        <div class="s3-theme">A season opener plus 5 episodes. Biology · Mental Health · Lifestyle.</div>
      </div>
    </div>
    <ul class="episodes-grid">${S3.map((e) => epCard(L, e)).join('')}
    </ul>
  </section>

  <section class="section" aria-labelledby="prev-title">
    <div class="section-header">
      <div>
        <div class="section-eyebrow">The archive</div>
        <h2 class="section-title" id="prev-title">Previous seasons</h2>
      </div>
      <a class="section-link" href="${SITE.links.youtube}" target="_blank" rel="noopener">Full archive on YouTube ${icon('external-link')}</a>
    </div>
    <ul class="episodes-grid">${TIP_DATA.previousEpisodes.map(archiveCard).join('')}
    </ul>
    <p class="archive-note">Seasons 1 and 2 live on <a href="${SITE.links.youtube}" target="_blank" rel="noopener">YouTube</a> and <a href="${SITE.links.spotify}" target="_blank" rel="noopener">Spotify</a>.</p>
  </section>

  <section class="unfiltered-section" id="unfiltered-perspectives" aria-labelledby="uf-title">
    <div class="unfiltered-intro">
      <div class="section-eyebrow">Anonymous, always</div>
      <h2 class="section-title" id="uf-title">Unfiltered Perspectives</h2>
      <p>
        Have a story, question, or insight you'd like to share? The Inside Perspective is creating space
        for open and honest conversations, completely anonymous. Whether it's a personal experience, a
        thought-provoking question, or a topic you'd love to hear discussed, your voice matters. Drop your
        thoughts below, and let's reflect, connect, and grow together.
      </p>
    </div>
    <form class="unfiltered-card" id="unfiltered-form" action="${PREVIEW ? 'mock:' : SITE.unfilteredEndpoint}" method="POST" novalidate>
      <div class="hp" aria-hidden="true">
        <label for="uf-gotcha">Leave this empty</label>
        <input id="uf-gotcha" type="text" name="_gotcha" tabindex="-1" autocomplete="off">
      </div>
      <div class="unfiltered-field">
        <label class="unfiltered-label" for="unfiltered-type">This is</label>
        <select class="unfiltered-select" id="unfiltered-type" name="type">
          <option value="Personal experience">A personal experience</option>
          <option value="Question">A question</option>
          <option value="Topic idea">A topic idea</option>
          <option value="Something else">Something else</option>
        </select>
      </div>
      <div class="unfiltered-field">
        <label class="unfiltered-label" for="unfiltered-message">Your thoughts</label>
        <textarea class="unfiltered-textarea" id="unfiltered-message" name="message" placeholder="Share as much or as little as you want..." maxlength="5000" required aria-describedby="uf-status uf-care"></textarea>
      </div>
      <p class="unfiltered-note unfiltered-care" id="uf-care">Submissions may inspire future episodes, but I'm not able to respond to them personally. If you're in crisis, please call or text <a href="https://988lifeline.org" target="_blank" rel="noopener">988</a> (US) or visit <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a> instead.</p>
      <button class="btn-primary" type="submit"><span class="spinner" aria-hidden="true"></span><span class="btn-label">Submit anonymously</span></button>
      <p class="form-status" id="uf-status" role="status" aria-live="polite"></p>
      <p class="unfiltered-note">I don't ask for your name or email. Only include them if you want to.</p>
    </form>
  </section>
  ${signup({ source: 'episodes', eyebrow: 'For the Insiders', title: 'Never miss<br>an episode', sub: 'Get new episodes and free guides in your inbox the day they drop.' })}`;

  pages['episodes/index.html'] = page(
    L,
    {
      title: 'Episodes',
      description: 'Every episode of The Inside Perspective. Biology, mental health, and lifestyle: real talk for the Insiders.',
      path: '/episodes',
      jsonld: [
        {
          '@context': 'https://schema.org',
          ...SERIES,
          hasPart: LIVE.map((e) => ({ '@type': 'PodcastEpisode', name: e.title, url: abs(e.path), episodeNumber: e.number })),
        },
      ],
    },
    '/episodes',
    body
  );
}

/* ---------- Episode pages ---------- */
for (const ep of LIVE) {
  const L = makeLinker(1);
  const idx = S3.indexOf(ep);
  const prev = S3[idx - 1];
  const next = S3[idx + 1];
  const sources = TIP_DATA.resources.filter((r) => r.relatedEpisode === ep.number && r.type === 'Research');
  const books = TIP_DATA.resources.filter((r) => r.relatedEpisode === ep.number && r.type !== 'Research');
  const guides = GUIDES.filter((g) => g.relatedEpisode === ep.number);
  const watchUrl = `https://www.youtube.com/watch?v=${ep.youtubeId}`;
  const crumbs = [['Home', '/'], ['Episodes', '/episodes'], [`Ep. ${pad(ep.number)}`, ep.path]];
  const about = (ep.about && ep.about.length ? ep.about : [ep.description]).map((p) => `<p>${esc(p)}</p>`).join('\n        ');

  const goDeeper = [
    ...guides.map((g) => `<li><a href="${L.page(g.path)}">${icon('compass')}<span>${esc(g.title)}<small>Free guide</small></span></a></li>`),
    ...books.map((b) => `<li><a href="${esc(b.url)}" target="_blank" rel="noopener">${icon('book')}<span>${esc(b.title)}<small>${esc(b.author || 'Book')}</small></span></a></li>`),
  ];

  const navCard = (e, dir) => {
    if (!e) return '<div></div>';
    const lbl = dir === 'prev' ? 'Previous episode' : 'Up next';
    if (e.isLive) return `<a class="${dir}" href="${L.page(e.path)}"><small>${lbl}</small><b>Ep. ${pad(e.number)} · ${esc(e.title)}</b></a>`;
    return `<span class="${dir}"><small>${lbl} · Coming soon</small><b>Ep. ${pad(e.number)} · ${esc(e.title)}</b></span>`;
  };

  const body = `
  <section class="episode-hero" aria-labelledby="ep-title">
    ${breadcrumbNav(L, crumbs)}
    <div class="episode-layout">
      <div>
        <div class="episode-kicker">
          <span class="k-num">Season 3 · Ep. ${pad(ep.number)}</span>
          <span class="k-tag">${icon(tagIcon(ep.tag))}${esc(ep.tag)}</span>
          ${ep.datePublished ? `<time class="k-date" datetime="${ep.datePublished}">${dateLabel(ep.datePublished)}</time>` : ''}
        </div>
        <h1 class="episode-title" id="ep-title">${liyTitle(ep.title)}</h1>
        <p class="episode-lede">${esc(ep.description)}</p>
        <div class="hero-actions">
          <a class="btn-primary" href="${watchUrl}" target="_blank" rel="noopener">${icon('brand-youtube')}Watch on YouTube</a>
          <a class="btn-ghost" href="${ep.spotifyUrl || SITE.links.spotify}" target="_blank" rel="noopener">${icon('brand-spotify')}Listen on Spotify</a>
        </div>
      </div>
      <div>
        ${PREVIEW
          ? `<a class="video-facade" href="${watchUrl}" target="_blank" rel="noopener" aria-label="Play episode on YouTube: ${esc(ep.title)}">
          ${ytThumb(ep.youtubeId, { cls: '', alt: '' })}
          <span class="play-btn">${icon('player-play-filled')}</span>
          <span class="play-label">Plays right here on the live site</span>
        </a>`
          : `<button class="video-facade" type="button" data-youtube-id="${ep.youtubeId}" data-title="${esc(ep.title)}" aria-label="Play episode: ${esc(ep.title)}">
          ${ytThumb(ep.youtubeId, { cls: '', alt: '', max: true })}
          <span class="play-btn">${icon('player-play-filled')}</span>
          <span class="play-label">Play here</span>
        </button>`}
      </div>
    </div>
  </section>

  <section class="episode-body" aria-label="Episode details">
    <div class="prose">
      <h2>About this episode</h2>
        ${about}
      ${ep.contentNote ? `<p><strong>Content note:</strong> ${esc(ep.contentNote)}</p>` : ''}
      ${sources.length ? `<h2>Sources mentioned</h2>
      <ul>${sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>, ${esc(s.author)}</li>`).join('')}</ul>` : ''}
      ${ep.transcript ? `<h2>Transcript</h2>${ep.transcript.map((p) => `<p>${esc(p)}</p>`).join('')}` : ''}
    </div>
    <aside class="side-stack" aria-label="More for this episode">
      ${crisisCard()}
      ${goDeeper.length ? `<div class="side-card"><h2>Go deeper</h2><ul class="link-list">${goDeeper.join('')}</ul></div>` : ''}
      <div class="side-card"><h2>Listen everywhere</h2><ul class="link-list">${LISTEN.map(
        ([k, name, ic]) => `<li><a href="${SITE.links[k]}" target="_blank" rel="noopener">${icon(ic)}<span>${name}</span></a></li>`
      ).join('')}</ul></div>
    </aside>
  </section>

  <nav class="ep-nav" aria-label="More episodes">
    ${navCard(prev, 'prev')}
    ${navCard(next, 'next')}
  </nav>
  ${signup({ source: `episode-${ep.number}`, eyebrow: 'For the Insiders', title: 'Get the next one<br>first', sub: 'New episodes and free guides, straight to your inbox.' })}`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: ep.title,
    url: abs(ep.path),
    description: ep.description,
    episodeNumber: ep.number,
    image: `https://i.ytimg.com/vi/${ep.youtubeId}/maxresdefault.jpg`,
    partOfSeason: { '@type': 'PodcastSeason', seasonNumber: 3, name: `Season 3: ${TIP_DATA.season3.theme}` },
    partOfSeries: SERIES,
    sameAs: [watchUrl, ep.spotifyUrl].filter(Boolean),
  };
  if (ep.datePublished) ld.datePublished = ep.datePublished;

  pages[`episodes/${ep.slug}.html`] = page(
    L,
    {
      title: `Ep. ${pad(ep.number)}: ${ep.title}`,
      description: ep.description,
      path: ep.path,
      type: 'article',
      image: `https://i.ytimg.com/vi/${ep.youtubeId}/maxresdefault.jpg`,
      jsonld: [ld, breadcrumbLd(crumbs)],
    },
    '/episodes',
    body
  );
}

/* ---------- Resources ---------- */
{
  const L = makeLinker(0);
  const books = TIP_DATA.resources.filter((r) => r.type === 'Book');
  const research = TIP_DATA.resources.filter((r) => r.type === 'Research');
  const websites = TIP_DATA.resources.filter((r) => r.type === 'Website');
  const block = (id, eyebrow, title, items, render, intro = '') =>
    items.length
      ? `
  <section class="section" aria-labelledby="${id}">
    <div class="section-eyebrow">${eyebrow}</div>
    <h2 class="section-title" id="${id}">${title}</h2>
    ${intro ? `<p class="section-intro">${intro}</p>` : '<div style="height:24px"></div>'}
    <ul class="resources-grid">${items.map(render).join('')}
    </ul>
  </section>`
      : '';

  const body = `
  <div class="page-hero">
    <div class="page-hero-eyebrow">${SITE.name}</div>
    <h1>Resources</h1>
    <p>Free guides, books, and research from the show. Everything here is curated: if it's on this page, it means something.</p>
  </div>
  ${block('guides-title', 'From the show', 'Free guides', GUIDES, (g) => guideCard(L, g), 'Short, real explanations of what is happening in your body and what actually helps. Free, always.')}
  ${block('books-title', 'Reading list', 'Books', books, (r) => resourceCard(L, r))}
  ${block('research-title', 'Referenced on the podcast', 'Research', research, (r) => resourceCard(L, r))}
  ${block('web-title', 'Explore further', 'Websites and tools', websites, (r) => resourceCard(L, r))}
  ${signup({ source: 'resources', eyebrow: 'Free for Insiders', title: 'New guides,<br>in your inbox', sub: 'A new resource comes with every episode. Get them the day they drop.' })}`;

  pages['resources.html'] = page(
    L,
    {
      title: 'Resources',
      description: 'Free guides, books, and research from The Inside Perspective podcast, curated for the Insiders.',
      path: '/resources',
    },
    '/resources',
    body
  );
}

/* ---------- Guide pages ---------- */
for (const g of GUIDES) {
  const L = makeLinker(1);
  const ep = g.relatedEpisode != null ? epByNum(g.relatedEpisode) : null;
  const crumbs = [['Home', '/'], ['Resources', '/resources'], [g.title, g.path]];
  const text = g.sections.map((s) => s.body).join(' ');
  const relatedBooks = TIP_DATA.resources.filter((r) => r.type === 'Book' && text.includes(`<em>${r.title}</em>`));
  const others = GUIDES.filter((x) => x.id !== g.id).slice(0, 4);

  const side = [
    ep && ep.isLive
      ? `<div class="side-card"><h2>The episode it goes with</h2><ul class="link-list"><li><a href="${L.page(ep.path)}">${icon('player-play-filled')}<span>Ep. ${pad(ep.number)} · ${esc(ep.title)}<small>Watch now</small></span></a></li></ul></div>`
      : ep
        ? `<div class="side-card"><h2>The episode it goes with</h2><ul class="link-list"><li><span style="display:flex;gap:10px;padding:12px 0;font-size:14px;color:var(--text-muted);">${icon('clock')}<span>Ep. ${pad(ep.number)} · ${esc(ep.title)}<small>Coming soon</small></span></span></li></ul></div>`
        : '',
    g.tag === 'Mental Health' ? crisisCard('If you need support now') : '',
    relatedBooks.length
      ? `<div class="side-card"><h2>Read next</h2><ul class="link-list">${relatedBooks
          .map((b) => `<li><a href="${esc(b.url)}" target="_blank" rel="noopener">${icon('book')}<span>${esc(b.title)}<small>${esc(b.author)}</small></span></a></li>`)
          .join('')}</ul></div>`
      : '',
    `<div class="side-card"><h2>More free guides</h2><ul class="link-list">${others
      .map((o) => `<li><a href="${L.page(o.path)}">${icon('compass')}<span>${esc(o.title)}</span></a></li>`)
      .join('')}</ul></div>`,
  ].join('\n      ');

  const body = `
  <div class="page-hero">
    ${breadcrumbNav(L, crumbs)}
    <div class="page-hero-eyebrow">Free guide · ${esc(g.tag)}</div>
    <h1>${esc(g.title)}</h1>
    <p>${esc(g.description)}</p>
  </div>
  <section class="guide-body" aria-label="Guide">
    <div class="prose">
      ${g.sections.map((s) => `<div class="guide-section"><h2>${esc(s.heading)}</h2><div>${s.body}</div></div>`).join('\n      ')}
    </div>
    <aside class="side-stack" aria-label="Related">
      ${side}
    </aside>
  </section>
  ${signup({ source: `guide-${g.id}`, eyebrow: 'Free for Insiders', title: 'Want the next<br>guide?', sub: 'A new free guide comes with every episode. Get them in your inbox.' })}`;

  pages[`guides/${g.id}.html`] = page(
    L,
    {
      title: g.title,
      description: g.description,
      path: g.path,
      type: 'article',
      jsonld: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: g.title,
          description: g.description,
          url: abs(g.path),
          author: { '@type': 'Person', name: SITE.host },
          publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url + '/' },
        },
        breadcrumbLd(crumbs),
      ],
    },
    '/resources',
    body
  );
}

/* ---------- About ---------- */
{
  const L = makeLinker(0);
  const pillar = (n, ic, title, desc, tags, cred) => `
      <li class="pillar-card">
        <div class="pillar-card-num" aria-hidden="true">${n}</div>
        <div class="pillar-icon-badge">${icon(ic)}</div>
        <div class="pillar-label">Pillar ${n}</div>
        <h3 class="pillar-title">${title}</h3>
        <p class="pillar-desc">${desc}</p>
        <ul class="pillar-tags">${tags.map((t) => `<li class="pillar-tag">${t}</li>`).join('')}</ul>
        ${cred ? `<div class="pillar-credential">${icon(cred[0])}${cred[1]}</div>` : ''}
      </li>`;

  const body = `
  <section class="about-hero" aria-labelledby="about-title">
    <div class="about-hero-content">
      <div class="hero-eyebrow" style="margin-bottom:28px;">For the Insiders</div>
      <h1 id="about-title">What is <span>TiP</span>?</h1>
      <div class="about-body" style="margin-top:32px;">
        <p>
          Every day you make choices that affect your body, your mind, and your energy.
          The food you eat, the relationships you stay in, the stress you carry, the things you witness.
          <strong>Most of us never stop to think about what that's actually doing on the inside.</strong>
        </p>
        <p>That's what this podcast is for.</p>
        <p>
          The Inside Perspective is a deep dive into the inner workings of your health and healing.
          We talk about the real stuff: <strong>mental health, your cycle, your nervous system, confidence, rest,
          and everything in between.</strong> Not from a place of perfection but from a place of growth.
        </p>
        <p>This is for the Insiders. The ones doing the work even when it's uncomfortable.</p>
      </div>
    </div>
    <div class="about-hero-visual">
      ${responsiveImg(L, { src: '/images/about-cover.jpg', alt: 'Illustrated cover art of the host, Aaliyah, waving with headphones on', width: 1024, height: 1536, cls: 'about-hero-visual-img', sizes: '(max-width: 768px) 55vw, 42vw', eager: false, widths: [640, 1080] })}
    </div>
  </section>

  <section class="section" style="border-top:0.5px solid var(--card-border);" aria-labelledby="host-title">
    <div class="section-eyebrow">Meet your host</div>
    <h2 class="section-title" id="host-title" style="margin-bottom:24px;">Hi, I'm Aaliyah</h2>
    <div class="about-body" style="max-width:640px;">
      <p>
        I have a degree in Biology and a certification in life coaching, and I started this show because
        those two worlds never seemed to talk to each other: the actual science of what's happening in your
        body, and the real, unglamorous work of doing something about it. I wanted a space that held both,
        without the polish that makes most wellness content feel unreachable, and a space where voices that
        don't usually get centered, <strong>especially Black voices,</strong> get to lead instead of being an afterthought.
      </p>
      <p>
        I'm not here because I have it all figured out. I'm learning to take care of myself too, out loud,
        so you don't have to do it alone.
      </p>
    </div>
  </section>

  <section class="section" aria-labelledby="pillars-title">
    <div class="section-eyebrow">What we cover</div>
    <h2 class="section-title" id="pillars-title">Three pillars</h2>
    <p class="section-intro">Every episode lives inside one of these three. They overlap more than you'd think, since your biology, your daily choices, and your mental health are never really separate things.</p>
    <ul class="pillars-grid">
      ${pillar('01', 'dna', 'Biology', 'How your body actually works: hormones, the nervous system, your cycle, and what stress is doing beneath the surface. Understanding the mechanism is the first step to working with it instead of against it.', ['Hormones', 'Nervous system', 'Your cycle', 'Stress response'], ['school', 'Degree in Biology'])}
      ${pillar('02', 'flame', 'Lifestyle', 'The choices you make every day: movement, rest, relationships, and how to build a life that actually supports your healing. Small, repeatable habits over perfect, unsustainable ones.', ['Movement', 'Rest', 'Relationships', 'Habits'], ['certificate', 'Certified Life Coach'])}
      ${pillar('03', 'brain', 'Mental Health', 'Anxiety, depression, confidence, self-worth: the inner work, no filter. Lived experience meets real information, without pretending either one is the whole picture on its own.', ['Anxiety', 'Depression', 'Confidence', 'Self-worth'])}
    </ul>
  </section>
  ${signup({ source: 'about', eyebrow: 'Season 3 is streaming', title: 'Ready to go<br>inside?', sub: 'Get new episodes and free guides in your inbox the day they drop.' })}`;

  pages['about.html'] = page(
    L,
    {
      title: 'About',
      description: 'The Inside Perspective is a podcast about the inner workings of your health and healing, hosted by Aaliyah. For the Insiders doing the work.',
      path: '/about',
    },
    '/about',
    body
  );
}

/* ---------- 404 ---------- */
{
  const L = makeLinker(0);
  // 404 is served from any URL depth, so it always uses root links in production
  const body = `
  <section class="notfound" aria-labelledby="nf-title">
    <div class="section-eyebrow">404</div>
    <h1 id="nf-title">This page went quiet</h1>
    <p>The link might be old, or the page moved. Here's where to pick back up.</p>
    <div class="hero-actions">
      <a class="btn-primary" href="${L.page('/episodes')}">See the episodes</a>
      <a class="btn-ghost" href="${L.page('/')}">Go home</a>
    </div>
  </section>`;
  pages['404.html'] = page(L, { title: 'Page not found', description: 'This page could not be found.', path: '/404', noindex: true }, '', body, {
    subscribeHref: L.page('/#subscribe'),
  });
}

/* =========================================================================
   Write output
   ========================================================================= */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const [file, html] of Object.entries(pages)) {
  if (/[\u2013\u2014]/.test(html)) throw new Error(`Em or en dash found in ${file}`);
  const dest = join(OUT, file);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
}

cpSync(join(ROOT, 'static'), OUT, { recursive: true });

if (!PREVIEW) {
  // Vercel runs `npm run build` on every push (see vercel.json), serves dist/,
  // and picks up the serverless function from the top level api/ folder.

  const urls = ['/', '/episodes', '/resources', '/about', ...LIVE.map((e) => e.path), ...GUIDES.map((g) => g.path)];
  writeFileSync(
    join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${abs(u)}</loc><lastmod>${BUILD_DATE}</lastmod></url>`)
      .join('\n')}\n</urlset>\n`
  );
  writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
}

console.log(`Built ${Object.keys(pages).length} pages -> ${OUT}`);
