/* Təməl — construction materials marketplace demo (static, data lives in the browser). */
(function () {
  'use strict';
  const SEED = window.SEED;
  const KEY = 'temel-demo-v1';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- state ---------- */
  function fresh() {
    return { user: [], sellers: [], hidden: [], deleted: [], vip: {}, blocked: [], orders: SEED.orders.slice(), status: {}, cart: [], favs: [], seq: 4 };
  }
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Brauzer yaddaşı doludur — şəkilləri azaldın'); } }

  const sellers = () => SEED.sellers.concat(S.sellers);
  const sellerById = (id) => sellers().find((s) => s.id === id);
  const catById = (id) => SEED.categories.find((c) => c.id === id);
  function allListings() {
    return SEED.listings.concat(S.user)
      .filter((l) => !S.deleted.includes(l.id))
      .map((l) => Object.assign({}, l, { vip: S.vip[l.id] != null ? S.vip[l.id] : !!l.vip }));
  }
  const visible = () => allListings().filter((l) => !S.hidden.includes(l.id) && !S.blocked.includes(l.seller));
  const byId = (id) => allListings().find((l) => l.id === Number(id));

  /* ---------- formatting ---------- */
  function money(n) {
    const fixed = Math.abs(n - Math.round(n)) < 0.005 ? String(Math.round(n)) : n.toFixed(2);
    const [i, d] = fixed.split('.');
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d ? ',' + d : '');
  }
  const qtyFmt = (q) => money(Math.round(q * 100) / 100);
  const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
  function when(d, t) {
    if (d === 0) return 'bu gün, ' + t;
    if (d === 1) return 'dünən, ' + t;
    const x = new Date(); x.setDate(x.getDate() - d);
    return x.getDate() + ' ' + MONTHS[x.getMonth()] + ' ' + x.getFullYear();
  }
  const imgSrc = (l) => (l.photos && l.photos[0]) || (l.img ? 'img/' + l.img + '.webp' : '');
  const pct = (l) => (l.old ? Math.round((1 - l.price / l.old) * 100) : 0);

  /* ---------- icons ---------- */
  const IC = {
    bag: '<path d="M7 5h10l2 4v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9z"/><path d="M5 9h14M9 13h6"/>',
    brick: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>',
    rebar: '<path d="M4 18 18 4M7 20 20 7"/><path d="M6 14l2 2M9 11l2 2M12 8l2 2M15 5l2 2"/>',
    bucket: '<path d="M5 8h14l-1.5 11a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z"/><path d="M5 8c0-3 3-4 7-4s7 1 7 4"/><path d="M8 13h8"/>',
    tile: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
    sheet: '<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4"/>',
    pipe: '<path d="M3 9h9a4 4 0 0 1 4 4v8M3 15h6a1 1 0 0 1 1 1v5"/><path d="M3 7v10M14 21h6"/>',
    bolt: '<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>',
    drill: '<path d="M4 7h11v6H4zM15 9h5M10 13l-1 7h4l1-7"/>',
    roof: '<path d="M2 12 12 4l10 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    door: '<rect x="6" y="3" width="12" height="18" rx="1"/><circle cx="15" cy="12" r="1"/>',
    cart: '<path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
    store: '<path d="M4 9 5.5 4h13L20 9"/><path d="M4 9h16v2a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 11z"/><path d="M5 13v7h14v-7M10 20v-4h4v4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0"/>',
    shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.4-1"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    filter: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'
  };
  const icon = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;

  /* ---------- consumption calculator ---------- */
  // Each entry: inputs, and fn(values, listing) -> { qty (in listing unit), lines[], glyph }
  const CALC = {
    concrete: { title: 'Neçə kisə sement lazımdır?', inputs: [{ k: 'v', label: 'Beton həcmi', suf: 'm³', def: 2, step: 0.5 }],
      fn: ({ v }) => { const kg = v * 350; const n = Math.ceil(kg / 50); return { qty: n, glyph: 'bag', lines: [`${qtyFmt(v)} m³ beton (M300) × 350 kq sement = ${money(kg)} kq`, `${money(kg)} kq ÷ 50 kq = <b>${n} kisə</b>`] }; } },
    plaster: { title: 'Divara neçə kisə suvaq gedəcək?', inputs: [{ k: 'a', label: 'Divar sahəsi', suf: 'm²', def: 30, step: 1 }, { k: 't', label: 'Qalınlıq', suf: 'sm', def: 1.5, step: 0.5 }],
      fn: ({ a, t }) => { const kg = a * t * 9; const n = Math.ceil(kg / 30); return { qty: n, glyph: 'bag', lines: [`${qtyFmt(a)} m² × ${qtyFmt(t)} sm × 9 kq = ${money(Math.round(kg))} kq`, `${money(Math.round(kg))} kq ÷ 30 kq = <b>${n} kisə</b>`] }; } },
    adhesive: { title: 'Nə qədər yapışdırıcı lazımdır?', inputs: [{ k: 'a', label: 'Kafel sahəsi', suf: 'm²', def: 15, step: 1 }],
      fn: ({ a }) => { const kg = a * 5; const n = Math.ceil(kg / 25); return { qty: n, glyph: 'bag', lines: [`${qtyFmt(a)} m² × 5 kq = ${money(kg)} kq`, `${money(kg)} kq ÷ 25 kq = <b>${n} kisə</b>`] }; } },
    brick: { title: 'Divara neçə kərpic gedəcək?', inputs: [{ k: 'a', label: 'Divar sahəsi', suf: 'm²', def: 12, step: 1 }, { k: 'w', label: 'Divar qalınlığı', options: [['51', 'yarım kərpic (12 sm)'], ['102', 'bir kərpic (25 sm)']], def: '102' }],
      fn: ({ a, w }) => { const per = Number(w); const n = Math.ceil((a * per * 1.05) / 10) * 10; return { qty: n, glyph: 'brick', per: 50, lines: [`${qtyFmt(a)} m² × ${per} ədəd/m² (məhlul tikişi ilə)`, `+ 5% sınıq ehtiyatı, 10-a yuvarlaqlaşdırılıb = <b>${money(n)} ədəd</b>`] }; } },
    block: { title: 'Neçə blok lazımdır?', inputs: [{ k: 'a', label: 'Divar sahəsi', suf: 'm²', def: 20, step: 1 }],
      fn: ({ a }) => { const n = Math.ceil((a / 0.18) * 1.05); return { qty: n, glyph: 'brick', lines: [`Bir blokun üzü 0,6 × 0,3 = 0,18 m²`, `${qtyFmt(a)} m² ÷ 0,18 + 5% ehtiyat = <b>${n} blok</b>`] }; } },
    paint: { title: 'Neçə vedrə boya lazımdır?', inputs: [{ k: 'a', label: 'Boyanacaq sahə', suf: 'm²', def: 60, step: 5 }, { k: 'c', label: 'Qat sayı', suf: 'qat', def: 2, step: 1 }],
      fn: ({ a, c }) => { const L = (a * c) / 9; const n = Math.ceil(L / 10); return { qty: n, glyph: 'bucket', lines: [`${qtyFmt(a)} m² × ${c} qat ÷ 9 m²/L = ${qtyFmt(Math.round(L * 10) / 10)} L`, `${qtyFmt(Math.round(L * 10) / 10)} L ÷ 10 L = <b>${n} vedrə</b>`] }; } },
    facade: { title: 'Fasada neçə vedrə gedəcək?', inputs: [{ k: 'a', label: 'Fasad sahəsi', suf: 'm²', def: 120, step: 10 }, { k: 'c', label: 'Qat sayı', suf: 'qat', def: 2, step: 1 }],
      fn: ({ a, c }) => { const L = (a * c) / 7; const n = Math.ceil(L / 15); return { qty: n, glyph: 'bucket', lines: [`${qtyFmt(a)} m² × ${c} qat ÷ 7 m²/L = ${qtyFmt(Math.round(L))} L`, `${qtyFmt(Math.round(L))} L ÷ 15 L = <b>${n} vedrə</b>`] }; } },
    tile: { title: 'Neçə qutu lazımdır?', inputs: [{ k: 'a', label: 'Otağın sahəsi', suf: 'm²', def: 14, step: 1 }],
      fn: ({ a }, l) => { const need = a * 1.1; const packs = Math.ceil(need / l.pack); const q = Math.round(packs * l.pack * 100) / 100; return { qty: q, glyph: 'tile', glyphCount: packs, lines: [`${qtyFmt(a)} m² + 10% kəsim ehtiyatı = ${qtyFmt(Math.round(need * 100) / 100)} m²`, `Qutu ${qtyFmt(l.pack)} m² → <b>${packs} qutu = ${qtyFmt(q)} m²</b>`] }; } },
    drywall: { title: 'Neçə vərəq alçıpan lazımdır?', inputs: [{ k: 'a', label: 'Arakəsmə/tavan sahəsi', suf: 'm²', def: 18, step: 1 }],
      fn: ({ a }) => { const n = Math.ceil((a * 1.1) / 3); return { qty: n, glyph: 'sheet', lines: [`Bir vərəq 1,2 × 2,5 = 3 m²`, `${qtyFmt(a)} m² + 10% ÷ 3 = <b>${n} vərəq</b>`] }; } },
    roll: { title: 'Neçə rulon lazımdır?', inputs: [{ k: 'a', label: 'İzolyasiya sahəsi', suf: 'm²', def: 40, step: 2 }],
      fn: ({ a }, l) => { const n = Math.ceil((a * 1.05) / l.pack); return { qty: n, glyph: 'sheet', lines: [`Bir rulon ${qtyFmt(l.pack)} m²`, `${qtyFmt(a)} m² + 5% ÷ ${qtyFmt(l.pack)} = <b>${n} rulon</b>`] }; } },
    board: { title: 'Neçə vərəq lazımdır?', inputs: [{ k: 'a', label: 'İzolyasiya sahəsi', suf: 'm²', def: 30, step: 1 }],
      fn: ({ a }, l) => { const n = Math.ceil((a * 1.05) / l.pack); return { qty: n, glyph: 'sheet', lines: [`Bir vərəq 1,2 × 0,6 = 0,72 m²`, `${qtyFmt(a)} m² + 5% ÷ 0,72 = <b>${n} vərəq</b>`] }; } },
    roof: { title: 'Dama nə qədər çerepitsa lazımdır?', inputs: [{ k: 'a', label: 'Damın sahəsi', suf: 'm²', def: 80, step: 5 }],
      fn: ({ a }) => { const q = Math.ceil(a * 1.15); return { qty: q, glyph: 'roof', per: 5, lines: [`${qtyFmt(a)} m² + 15% (üst-üstə düşmə və kəsim)`, `= <b>${q} m²</b>`] }; } },
    length: { title: 'Neçə metr lazımdır?', inputs: [{ k: 'm', label: 'Lazım olan uzunluq', suf: 'm', def: 48, step: 6 }],
      fn: ({ m }, l) => { const q = Math.max(l.min || 1, Math.ceil(m)); return { qty: q, glyph: 'rebar', per: 6, lines: [`${qtyFmt(m)} m, minimum sifariş ${qtyFmt(l.min || 1)} ${l.unit}`, `= <b>${q} ${l.unit}</b>`] }; } }
  };

  /* ---------- small UI pieces ---------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = icon('check') + '<span>' + msg + '</span>';
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }
  const cartCount = () => S.cart.length;
  function syncBadges() {
    $$('[data-badge=cart]').forEach((b) => { b.textContent = cartCount(); b.hidden = !cartCount(); });
    $$('[data-badge=fav]').forEach((b) => { b.textContent = S.favs.length; b.hidden = !S.favs.length; });
  }
  function addToCart(id, q, fromEl) {
    const l = byId(id); if (!l) return;
    const ex = S.cart.find((c) => c.id === l.id);
    if (ex) ex.q = Math.round((ex.q + q) * 100) / 100; else S.cart.push({ id: l.id, q });
    save(); syncBadges();
    if (fromEl) fly(fromEl);
    toast(`Səbətə əlavə olundu: ${esc(l.title)}`);
  }
  function fly(fromEl) {
    const target = $$('.cart-btn').find((b) => b.offsetParent !== null);
    const img = fromEl.closest('.card, .pd')?.querySelector('img');
    if (!target || !img || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
    const g = img.cloneNode(); g.className = 'flyer';
    Object.assign(g.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(g);
    requestAnimationFrame(() => {
      g.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top + b.height / 2 - a.top - a.height / 2}px) scale(${24 / a.width})`;
      g.style.opacity = '0.2';
    });
    setTimeout(() => { g.remove(); target.classList.add('bump'); setTimeout(() => target.classList.remove('bump'), 400); }, 650);
  }

  function card(l, opts) {
    const s = sellerById(l.seller) || {};
    const fav = S.favs.includes(l.id);
    const p = pct(l);
    return `<article class="card${l.mine ? ' card--mine' : ''}${opts && opts.flash ? ' flash' : ''}">
      <a class="card__media" href="#/elan/${l.id}">
        ${imgSrc(l) ? `<img src="${esc(imgSrc(l))}" alt="${esc(l.title)}" loading="lazy">` : `<div class="noimg">${icon(catById(l.cat)?.icon || 'box')}</div>`}
        <span class="card__tags">${l.vip ? `<span class="tag tag--vip">${icon('crown')}VIP</span>` : ''}${p ? `<span class="tag tag--sale">−${p}%</span>` : ''}${l.used ? '<span class="tag">İşlənmiş</span>' : ''}${l.mine ? '<span class="tag tag--mine">Sizin elan</span>' : ''}</span>
      </a>
      <button class="card__fav${fav ? ' on' : ''}" data-fav="${l.id}" aria-label="Seçilmişlərə əlavə et">${icon('heart')}</button>
      <div class="card__body">
        <a href="#/elan/${l.id}" class="card__link">
          <div class="price"><b>${money(l.price)} AZN</b><span>/ ${esc(l.unit)}</span>${l.old ? `<s>${money(l.old)} AZN</s>` : ''}</div>
          <h3 class="card__title">${esc(l.title)}</h3>
          <p class="card__line">${esc(l.line || '')}</p>
        </a>
        <div class="card__seller">${icon(s.type === 'Mağaza' ? 'store' : 'user')}<span>${esc(s.name || '')}</span>${s.type === 'Mağaza' ? '<em>Mağaza</em>' : ''}</div>
        <div class="card__foot"><span>${esc(s.city || l.city || '')}, ${when(l.d, l.t)}</span>
          <button class="add" data-add="${l.id}" aria-label="Səbətə at">${icon('cart')}<span>Səbətə</span></button></div>
      </div>
    </article>`;
  }
  const grid = (list, opts) => list.length ? `<div class="grid">${list.map((l) => card(l, opts && opts.flashId === l.id ? { flash: true } : null)).join('')}</div>` : `<div class="empty">${icon('search')}<p>Bu şərtlərə uyğun elan tapılmadı.</p><a class="btn btn--ghost" href="#/axtar">Filtrləri sıfırla</a></div>`;
  const sortNew = (a, b) => a.d - b.d || (b.t || '').localeCompare(a.t || '');

  /* ---------- search box (home + results) ---------- */
  function searchBox(q) {
    q = q || {};
    const cities = Array.from(new Set(sellers().map((s) => s.city)));
    return `<form class="sbox" id="sbox">
      <div class="seg" role="radiogroup">
        ${[['', 'Hamısı'], ['new', 'Yeni'], ['used', 'İşlənmiş']].map(([v, t]) => `<label><input type="radio" name="cond" value="${v}" ${(q.cond || '') === v ? 'checked' : ''}><span>${t}</span></label>`).join('')}
      </div>
      <div class="sbox__row">
        <label class="fld fld--grow">${icon('search')}<input name="q" value="${esc(q.q || '')}" placeholder="Məhsul, ölçü, marka — məs. sement M500" autocomplete="off"></label>
        <label class="fld"><select name="cat"><option value="">Kateqoriya: hamısı</option>${SEED.categories.map((c) => `<option value="${c.id}" ${q.cat === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label>
        <label class="fld"><select name="city"><option value="">Şəhər: hamısı</option>${cities.map((c) => `<option ${q.city === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <div class="fld fld--price"><input name="min" inputmode="decimal" value="${esc(q.min || '')}" placeholder="Qiymət, min"><i>–</i><input name="max" inputmode="decimal" value="${esc(q.max || '')}" placeholder="maks"><span>AZN</span></div>
        <button class="btn btn--primary sbox__go">Axtar</button>
      </div>
    </form>`;
  }
  function readQuery() {
    const h = location.hash.split('?')[1] || '';
    return Object.fromEntries(new URLSearchParams(h));
  }
  function filterList(q) {
    let list = visible();
    if (q.q) { const t = q.q.toLocaleLowerCase('az'); list = list.filter((l) => (l.title + ' ' + (l.line || '') + ' ' + Object.values(l.specs || {}).join(' ')).toLocaleLowerCase('az').includes(t)); }
    if (q.cat) list = list.filter((l) => l.cat === q.cat);
    if (q.city) list = list.filter((l) => (sellerById(l.seller) || {}).city === q.city);
    if (q.cond === 'new') list = list.filter((l) => !l.used);
    if (q.cond === 'used') list = list.filter((l) => l.used);
    if (q.min) list = list.filter((l) => l.price >= Number(String(q.min).replace(',', '.')));
    if (q.max) list = list.filter((l) => l.price <= Number(String(q.max).replace(',', '.')));
    if (q.type) list = list.filter((l) => (sellerById(l.seller) || {}).type === q.type);
    if (q.del) list = list.filter((l) => (sellerById(l.seller) || {}).delivery);
    if (q.sale) list = list.filter((l) => l.old);
    const sorts = { new: sortNew, cheap: (a, b) => a.price - b.price, dear: (a, b) => b.price - a.price };
    list.sort((a, b) => (b.vip - a.vip) || (sorts[q.sort] || sortNew)(a, b));
    return list;
  }

  /* ---------- views ---------- */
  function vHome() {
    const list = visible();
    const today = list.filter((l) => l.d === 0).sort(sortNew);
    const vip = list.filter((l) => l.vip);
    const sale = list.filter((l) => l.old).sort((a, b) => pct(b) - pct(a));
    const flashId = Number(sessionStorage.getItem('temel-flash')) || null; sessionStorage.removeItem('temel-flash');
    const stores = sellers().filter((s) => s.type === 'Mağaza' && !S.blocked.includes(s.id));
    return `
    <section class="hero">
      <div class="wrap">
        <div class="hero__top">
          <div><h1>Tikinti materialları — <span>mağazalardan və ustalardan</span>, bir yerdə</h1>
          <p class="hero__sub">${list.length} elan · ${stores.length} mağaza · qiyməti, ölçüsü və çatdırılması ilə</p>
          <div class="hero__pts"><span>${icon('calc')}Nə qədər lazım olduğunu sayt hesablayır</span><span>${icon('cart')}Bir səbətdə bir neçə mağaza</span><span>${icon('truck')}Çatdırılan elanlar ayrıca filtrdə</span></div>
          <div class="pop"><small>Tez-tez axtarılır:</small>${['sement M500', 'kərpic', 'keramoqranit', 'laminat', 'armatur', 'alçıpan', 'boya'].map((t) => `<a href="#/axtar?q=${encodeURIComponent(t)}">${t}</a>`).join('')}</div></div>
          <aside class="feed" aria-label="Bu gün yerləşdirilən elanlar"><header><i></i>Bu gün yerləşdirilənlər<b>${today.length}</b></header><div class="feed__list" id="feed">${today.slice(0, 4).map(feedRow).join('')}</div></aside>
        </div>
        ${searchBox({})}
      </div>
    </section>
    <div class="wrap">
      <nav class="cats" aria-label="Kateqoriyalar">${SEED.categories.map((c) => { const n = list.filter((l) => l.cat === c.id).length; return `<a href="#/axtar?cat=${c.id}" class="cat">${icon(c.icon)}<span>${c.short}</span><em>${n}</em></a>`; }).join('')}</nav>

      ${vip.length ? `<section class="sec"><header class="sec__h"><h2>${icon('crown', 'gold')}VIP elanlar</h2><a href="#/axtar">Bütün elanlar</a></header><div class="rail">${vip.map((l) => card(l)).join('')}</div></section>` : ''}

      <section class="sec"><header class="sec__h"><h2>Bu gün — ${today.length} yeni elan</h2><a href="#/axtar?sort=new">Hamısı</a></header>${grid(today.slice(0, 8), { flashId })}</section>

      ${sale.length ? `<section class="sec"><header class="sec__h"><h2>Endirimdə</h2><a href="#/axtar?sale=1">Hamısı</a></header><div class="rail">${sale.map((l) => card(l)).join('')}</div></section>` : ''}

      <section class="sec"><header class="sec__h"><h2>Mağazalar</h2></header>
        <div class="stores">${stores.map((s) => { const n = list.filter((l) => l.seller === s.id).length; return `<a class="store" href="#/satici/${s.id}"><span class="store__av">${esc(s.name.slice(0, 1))}</span><b>${esc(s.name)}</b><small>${esc(s.city)} · ${n} elan${s.delivery ? ' · çatdırılma' : ''}</small></a>`; }).join('')}</div>
      </section>

      <section class="sec"><header class="sec__h"><h2>Bütün elanlar</h2><a href="#/axtar">Filtrlə axtar</a></header>${grid(list.slice().sort(sortNew).filter((l) => l.d > 0).slice(0, 12))}
        <div class="more"><a class="btn btn--ghost" href="#/axtar">Daha çox elan</a></div></section>

      <section class="sell">
        <div><h2>Məhsulunuz var? Elan yerləşdirin.</h2><p>Mağaza da, təmirdən artıq qalan materialı satan da — şəkil, qiymət, ölçü vahidi. Bir dəqiqəyə.</p></div>
        <a class="btn btn--primary btn--lg" href="#/yeni-elan">${icon('plus')}Yeni elan</a>
      </section>
    </div>`;
  }

  function feedRow(l) {
    return `<a class="frow" href="#/elan/${l.id}"><span class="frow__img">${imgSrc(l) ? `<img src="${esc(imgSrc(l))}" alt="">` : icon('box')}</span><span class="frow__t"><b>${esc(l.title)}</b><small>${esc((sellerById(l.seller) || {}).name || '')}</small></span><span class="frow__p"><b>${money(l.price)} AZN</b><small>${esc(l.t)}</small></span></a>`;
  }
  let feedTimer = null, feedIdx = 4;
  function startFeed() {
    clearInterval(feedTimer);
    const box = $('#feed'); if (!box || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const today = visible().filter((l) => l.d === 0).sort(sortNew);
    if (today.length <= 4) return;
    feedTimer = setInterval(() => {
      const el = $('#feed'); if (!el) { clearInterval(feedTimer); return; }
      const l = today[feedIdx++ % today.length];
      el.insertAdjacentHTML('afterbegin', feedRow(l));
      el.firstElementChild.classList.add('in');
      const last = el.lastElementChild; last.classList.add('gone'); setTimeout(() => last.remove(), 450);
    }, 3200);
  }

  function vSearch() {
    const q = readQuery();
    const list = filterList(q);
    const chip = (k, label) => q[k] ? `<a class="chip" href="${qs(Object.assign({}, q, { [k]: '' }))}">${label}${icon('close')}</a>` : '';
    const title = q.cat ? catById(q.cat)?.name : q.q ? `“${esc(q.q)}” üzrə` : 'Bütün elanlar';
    return `<div class="wrap">
      <div class="crumbs"><a href="#/">Əsas</a> / <span>${title}</span></div>
      ${searchBox(q)}
      <div class="results">
        <aside class="side">
          <details open><summary>${icon('filter')}Əlavə filtrlər</summary>
          <form id="side">
            <fieldset><legend>Satıcı</legend>
              ${[['', 'Hamısı'], ['Mağaza', 'Mağaza'], ['Fərdi', 'Fərdi şəxs']].map(([v, t]) => `<label class="rad"><input type="radio" name="type" value="${v}" ${(q.type || '') === v ? 'checked' : ''}>${t}</label>`).join('')}
            </fieldset>
            <fieldset><legend>Seçimlər</legend>
              <label class="chk"><input type="checkbox" name="del" value="1" ${q.del ? 'checked' : ''}>Çatdırılma var</label>
              <label class="chk"><input type="checkbox" name="sale" value="1" ${q.sale ? 'checked' : ''}>Endirimdə</label>
            </fieldset>
            <fieldset><legend>Kateqoriya</legend>
              ${SEED.categories.map((c) => `<a class="side__cat${q.cat === c.id ? ' on' : ''}" href="${qs(Object.assign({}, q, { cat: q.cat === c.id ? '' : c.id }))}">${icon(c.icon)}${c.name}<em>${visible().filter((l) => l.cat === c.id).length}</em></a>`).join('')}
            </fieldset>
          </form></details>
        </aside>
        <div class="results__main">
          <div class="results__bar"><b>${list.length} elan</b>
            <div class="chips">${chip('cat', catById(q.cat)?.short || '')}${chip('q', esc(q.q || ''))}${chip('city', esc(q.city || ''))}${chip('type', esc(q.type || ''))}${chip('del', 'Çatdırılma')}${chip('sale', 'Endirim')}</div>
            <label class="sort">Sırala: <select id="sort">${[['new', 'Ən yeni'], ['cheap', 'Əvvəlcə ucuz'], ['dear', 'Əvvəlcə bahalı']].map(([v, t]) => `<option value="${v}" ${(q.sort || 'new') === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          </div>
          ${grid(list)}
        </div>
      </div></div>`;
  }
  function qs(o) { const p = new URLSearchParams(); Object.entries(o).forEach(([k, v]) => { if (v) p.set(k, v); }); const s = p.toString(); return '#/axtar' + (s ? '?' + s : ''); }

  function vListing(id) {
    const l = byId(id);
    if (!l || S.deleted.includes(l.id)) return vMissing();
    const s = sellerById(l.seller) || {};
    const c = catById(l.cat) || {};
    const step = l.pack || 1;
    const min = l.min || 1;
    const similar = visible().filter((x) => x.cat === l.cat && x.id !== l.id).slice(0, 4);
    const photos = l.photos && l.photos.length ? l.photos : [imgSrc(l)].filter(Boolean);
    const just = sessionStorage.getItem('temel-just') === String(l.id); if (just) sessionStorage.removeItem('temel-just');
    const p = pct(l);
    return `<div class="wrap pd">
      <div class="crumbs"><a href="#/">Əsas</a> / <a href="#/axtar?cat=${c.id}">${esc(c.name)}</a> / <span>${esc(l.title)}</span></div>
      ${just ? `<div class="notice">${icon('check')}<div><b>Elanınız dərc olundu.</b> İndi əsas səhifədə “Bu gün” bölməsindədir. Admin paneldə isə moderasiya üçün görünür.</div></div>` : ''}
      ${S.hidden.includes(l.id) ? `<div class="notice notice--warn">${icon('eyeOff')}<div>Bu elan admin tərəfindən gizlədilib, axtarışda görünmür.</div></div>` : ''}
      <div class="pd__top">
        <div class="gal">
          <div class="gal__main">${photos[0] ? `<img id="galmain" src="${esc(photos[0])}" alt="${esc(l.title)}">` : `<div class="noimg">${icon(c.icon || 'box')}</div>`}
            <span class="card__tags">${l.vip ? `<span class="tag tag--vip">${icon('crown')}VIP</span>` : ''}${p ? `<span class="tag tag--sale">−${p}%</span>` : ''}${l.used ? '<span class="tag">İşlənmiş</span>' : ''}</span></div>
          ${photos.length > 1 ? `<div class="gal__thumbs">${photos.map((src, i) => `<button data-thumb="${esc(src)}" class="${i ? '' : 'on'}"><img src="${esc(src)}" alt=""></button>`).join('')}</div>` : ''}
        </div>
        <div class="buy">
          <div class="price price--big"><b>${money(l.price)} AZN</b><span>/ ${esc(l.unit)}</span>${l.old ? `<s>${money(l.old)} AZN</s>` : ''}</div>
          <h1>${esc(l.title)}</h1>
          <p class="muted">${esc(l.line || '')}</p>
          <ul class="facts">
            <li>${icon('box')}${l.stock > 1 ? `Stokda: <b>${money(l.stock)} ${esc(l.unit)}</b>` : '<b>Tək lot</b>'}</li>
            <li>${icon('truck')}${s.delivery ? 'Satıcı çatdırır' : 'Yalnız özün götür'}</li>
            <li>${icon('pin')}${esc(s.city || '')}${s.area ? ', ' + esc(s.area) : ''}</li>
          </ul>
          <div class="qty" data-step="${step}" data-min="${min}" data-price="${l.price}">
            <span class="qty__l">Miqdar</span>
            <div class="qty__ctl"><button type="button" data-q="-">−</button><input id="qty" inputmode="decimal" value="${qtyFmt(min)}"><button type="button" data-q="+">+</button><span>${esc(l.unit)}</span></div>
            <div class="qty__sum">Cəmi: <b id="qsum">${money(l.price * min)} AZN</b></div>
          </div>
          ${l.pack ? `<p class="hint">Satış qutu/paketlə: 1 qutu = ${qtyFmt(l.pack)} ${esc(l.unit)}</p>` : ''}
          <div class="buy__btns">
            <button class="btn btn--primary btn--lg" data-addq="${l.id}">${icon('cart')}Səbətə at</button>
            <button class="btn btn--dark btn--lg" data-now="${l.id}">İndi sifariş et</button>
          </div>
          <div class="seller">
            <a href="#/satici/${s.id}" class="seller__h"><span class="store__av">${esc((s.name || '?').slice(0, 1))}</span><div><b>${esc(s.name || '')}</b><small>${esc(s.type || '')} · ${s.since ? s.since + '-dən saytda' : 'yeni satıcı'}</small></div></a>
            <div class="seller__row"><button class="btn btn--ghost" data-phone>${icon('phone')}<span>Nömrəni göstər</span></button>
              <button class="btn btn--ghost${S.favs.includes(l.id) ? ' on' : ''}" data-fav="${l.id}">${icon('heart')}<span>Seçilmiş</span></button></div>
            ${s.hours ? `<small class="muted">İş saatı: ${esc(s.hours)}</small>` : ''}
          </div>
        </div>
      </div>

      ${l.calc && CALC[l.calc] ? calcBlock(l) : ''}

      <div class="pd__info">
        <section><h2>Xüsusiyyətlər</h2><dl class="specs">${Object.entries(l.specs || {}).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}<div><dt>Kateqoriya</dt><dd>${esc(c.name)}</dd></div><div><dt>Elan №</dt><dd>${l.id}</dd></div><div><dt>Yerləşdirilib</dt><dd>${when(l.d, l.t)}</dd></div></dl></section>
        <section><h2>Təsvir</h2><p class="desc">${esc(l.desc || '')}</p></section>
      </div>
      ${similar.length ? `<section class="sec"><header class="sec__h"><h2>Oxşar elanlar</h2><a href="#/axtar?cat=${c.id}">Hamısı</a></header>${grid(similar)}</section>` : ''}
    </div>`;
  }

  function calcBlock(l) {
    const C = CALC[l.calc];
    return `<section class="calc" data-calc="${l.calc}" data-id="${l.id}">
      <div class="calc__l">
        <h2>${icon('calc')}${C.title}</h2>
        <p class="muted">Ölçünü yazın — lazım olan miqdarı və məbləği hesablayaq. Hesabın hər addımı göstərilir.</p>
        <div class="calc__in">${C.inputs.map((i) => i.options
          ? `<label class="cfld"><span>${i.label}</span><select data-k="${i.k}">${i.options.map(([v, t]) => `<option value="${v}" ${v === i.def ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`
          : `<label class="cfld"><span>${i.label}</span><div class="cfld__n"><button type="button" data-cs="-" data-st="${i.step}">−</button><input data-k="${i.k}" inputmode="decimal" value="${qtyFmt(i.def)}"><button type="button" data-cs="+" data-st="${i.step}">+</button><em>${i.suf}</em></div></label>`).join('')}</div>
        <ol class="calc__steps" id="csteps"></ol>
      </div>
      <div class="calc__r">
        <div class="calc__viz" id="cviz"></div>
        <div class="calc__res"><div><small>Lazım olan</small><b id="cqty"></b></div><div><small>Məbləğ</small><b id="csum"></b></div></div>
        <button class="btn btn--primary" id="cadd">${icon('cart')}Bu miqdarı səbətə at</button>
      </div>
    </section>`;
  }
  let calcQty = 0;
  function runCalc() {
    const box = $('.calc'); if (!box) return;
    const l = byId(box.dataset.id); const C = CALC[box.dataset.calc];
    const vals = {};
    $$('[data-k]', box).forEach((el) => { vals[el.dataset.k] = el.tagName === 'SELECT' ? el.value : Math.max(0, Number(String(el.value).replace(',', '.')) || 0); });
    const r = C.fn(vals, l);
    calcQty = r.qty;
    $('#csteps').innerHTML = r.lines.map((x) => `<li><span>${x}</span></li>`).join('');
    $('#cqty').textContent = `${qtyFmt(r.qty)} ${l.unit}`;
    $('#csum').textContent = `${money(r.qty * l.price)} AZN`;
    if (AREA[box.dataset.calc] && vals.a) { $('#cviz').innerHTML = areaViz(box.dataset.calc, vals, l); return; }
    // visual: one glyph per unit (or per N units when large)
    const count = r.glyphCount != null ? r.glyphCount : r.qty;
    let per = 1; while (count / per > 60) per = per === 1 ? (r.per || 5) : per * 2;
    const n = Math.ceil(count / per);
    const viz = $('#cviz');
    viz.innerHTML = `<div class="glyphs">${Array.from({ length: n }, (_, i) => `<i style="--i:${i}">${icon(r.glyph)}</i>`).join('')}</div><small>${per > 1 ? `1 işarə = ${per} ${r.glyphCount != null ? 'qutu' : l.unit}` : `${n} ${r.glyphCount != null ? 'qutu' : l.unit}`}</small>`;
  }

  // Draws the wall/floor from the entered area and "lays" the material on it.
  const AREA = {
    tile: { wall: false }, brick: { wall: true }, block: { wall: true }, drywall: { wall: true }, board: { wall: true }
  };
  function unitOf(type, l, vals) {
    if (type === 'tile') return l.img === 'laminate' ? { w: 1.38, h: 0.193, bond: 0.33, fill: '#c9995f', line: '#8f6434', name: 'laminat' } : { w: 0.6, h: 0.6, bond: 0, fill: '#dccbb0', line: '#9a8768', name: 'kafel' };
    if (type === 'brick') return vals.w === '51' ? { w: 0.26, h: 0.075, bond: 0.5, fill: '#c4582f', line: '#efe3d6', name: 'kərpic' } : { w: 0.13, h: 0.075, bond: 0.5, fill: '#c4582f', line: '#efe3d6', name: 'kərpic' };
    if (type === 'block') return { w: 0.61, h: 0.31, bond: 0.5, fill: '#ebe8e2', line: '#a8a197', name: 'blok' };
    if (type === 'drywall') return { w: 1.2, h: 2.5, bond: 0, fill: '#f3f1ed', line: '#b5ada3', name: 'vərəq' };
    return { w: 1.2, h: 0.6, bond: 0.5, fill: '#a9dfb6', line: '#5f9d6d', name: 'vərəq' };
  }
  function areaViz(type, vals, l) {
    const a = Math.max(0.5, vals.a); const wall = AREA[type].wall;
    const H = wall ? 2.7 : Math.sqrt(a / 1.5); const W = a / H;
    const sc = Math.min(440 / W, 170 / H); const pw = W * sc, ph = H * sc;
    const u = unitOf(type, l, vals); const uw = u.w * sc, uh = u.h * sc; const off = u.bond * uw;
    const id = 'p' + Math.random().toString(36).slice(2, 7);
    const sw = Math.max(0.6, Math.min(2, uh / 6));
    const pat = `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${uw}" height="${uh * 2}" ${wall ? `y="${ph % (uh * 2)}"` : ''}>
      <rect width="${uw}" height="${uh * 2}" fill="${u.fill}"/>
      <path d="M0 0H${uw}M0 ${uh}H${uw}M0 0V${uh}M${off} ${uh}V${uh * 2}" stroke="${u.line}" stroke-width="${sw}" fill="none"/></pattern>`;
    return `<svg class="aviz" viewBox="-30 -8 ${pw + 40} ${ph + 34}" role="img" aria-label="${qtyFmt(Math.round(W * 10) / 10)} × ${qtyFmt(Math.round(H * 10) / 10)} m">
      <defs>${pat}</defs>
      <rect x="0" y="0" width="${pw}" height="${ph}" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.35)" stroke-dasharray="4 4"/>
      <rect x="0" y="0" width="${pw}" height="${ph}" fill="url(#${id})"/>
      <rect class="aviz__cover ${wall ? 'up' : 'right'}" x="0" y="0" width="${pw}" height="${ph}"/>
      <text x="${pw / 2}" y="${ph + 20}" text-anchor="middle">${qtyFmt(Math.round(W * 10) / 10)} m</text>
      <text x="-10" y="${ph / 2}" text-anchor="middle" transform="rotate(-90 -10 ${ph / 2})">${qtyFmt(Math.round(H * 10) / 10)} m</text>
    </svg><small>${wall ? 'Divar' : 'Döşəmə'} ≈ ${qtyFmt(Math.round(W * 10) / 10)} × ${qtyFmt(Math.round(H * 10) / 10)} m — ${u.name} miqyasla çəkilib</small>`;
  }

  function vSeller(id) {
    const s = sellerById(id); if (!s) return vMissing();
    const list = visible().filter((l) => l.seller === id).sort(sortNew);
    return `<div class="wrap">
      <div class="crumbs"><a href="#/">Əsas</a> / <span>${esc(s.name)}</span></div>
      <header class="shop"><span class="store__av store__av--lg">${esc(s.name.slice(0, 1))}</span><div><h1>${esc(s.name)}</h1>
        <p class="muted">${esc(s.type)} · ${esc(s.city)}${s.area ? ', ' + esc(s.area) : ''}${s.hours ? ' · ' + esc(s.hours) : ''}${s.delivery ? ' · çatdırılma var' : ''}</p></div>
        <b class="shop__n">${list.length}<small>elan</small></b></header>
      ${S.blocked.includes(id) ? `<div class="notice notice--warn">${icon('eyeOff')}<div>Bu satıcı admin tərəfindən bloklanıb.</div></div>` : ''}
      ${grid(list)}
    </div>`;
  }

  function vFavs() {
    const list = visible().filter((l) => S.favs.includes(l.id));
    return `<div class="wrap"><div class="crumbs"><a href="#/">Əsas</a> / <span>Seçilmişlər</span></div><h1 class="ph">Seçilmiş elanlar</h1>${list.length ? grid(list) : `<div class="empty">${icon('heart')}<p>Ürək işarəsinə basdığınız elanlar burada toplanır.</p><a class="btn btn--primary" href="#/axtar">Elanlara bax</a></div>`}</div>`;
  }

  function cartGroups() {
    const groups = {};
    S.cart.forEach((c) => { const l = byId(c.id); if (!l) return; (groups[l.seller] = groups[l.seller] || []).push({ l, q: c.q }); });
    return groups;
  }
  function vCart() {
    const groups = cartGroups();
    const keys = Object.keys(groups);
    if (!keys.length) return `<div class="wrap"><div class="crumbs"><a href="#/">Əsas</a> / <span>Səbət</span></div><h1 class="ph">Səbət</h1><div class="empty">${icon('cart')}<p>Səbət boşdur.</p><a class="btn btn--primary" href="#/axtar">Elanlara bax</a></div></div>`;
    let total = 0;
    const blocks = keys.map((sid) => {
      const s = sellerById(sid) || {};
      const sub = groups[sid].reduce((a, x) => a + x.l.price * x.q, 0); total += sub;
      return `<section class="cg"><header class="cg__h"><a href="#/satici/${sid}">${icon(s.type === 'Mağaza' ? 'store' : 'user')}<b>${esc(s.name)}</b></a><small>${s.delivery ? icon('truck') + 'Çatdırılma var' : icon('pin') + 'Yalnız özün götür · ' + esc(s.city)}</small></header>
        ${groups[sid].map(({ l, q }) => `<div class="ci"><a href="#/elan/${l.id}" class="ci__img">${imgSrc(l) ? `<img src="${esc(imgSrc(l))}" alt="">` : icon('box')}</a>
          <div class="ci__t"><a href="#/elan/${l.id}">${esc(l.title)}</a><small>${money(l.price)} AZN / ${esc(l.unit)}</small></div>
          <div class="qty__ctl qty__ctl--sm" data-cid="${l.id}" data-step="${l.pack || 1}" data-min="${l.min || 1}"><button data-cq="-">−</button><input value="${qtyFmt(q)}" data-cqi inputmode="decimal"><button data-cq="+">+</button><span>${esc(l.unit)}</span></div>
          <b class="ci__sum">${money(l.price * q)} AZN</b>
          <button class="ci__x" data-rm="${l.id}" aria-label="Sil">${icon('trash')}</button></div>`).join('')}
        <footer class="cg__f">Bu satıcı üzrə: <b>${money(sub)} AZN</b></footer></section>`;
    }).join('');
    return `<div class="wrap"><div class="crumbs"><a href="#/">Əsas</a> / <span>Səbət</span></div>
      <h1 class="ph">Səbət <small>${S.cart.length} məhsul · ${keys.length} satıcı</small></h1>
      <div class="cart"><div>${blocks}</div>
      <aside class="sum"><h2>Sifariş</h2>
        ${keys.length > 1 ? `<p class="hint">${icon('store')}Məhsullar ${keys.length} fərqli satıcıdandır — sifariş hər satıcıya ayrıca gedəcək.</p>` : ''}
        <div class="sum__r"><span>Məhsullar</span><b>${money(total)} AZN</b></div>
        <div class="sum__r"><span>Çatdırılma</span><span>satıcı ilə razılaşma</span></div>
        <div class="sum__r sum__r--t"><span>Cəmi</span><b>${money(total)} AZN</b></div>
        <a class="btn btn--primary btn--lg btn--block" href="#/sifaris">Sifarişi rəsmiləşdir</a>
        <p class="muted small">Ödəniş satıcıya: nağd və ya kartla, məhsulu təhvil alanda.</p>
      </aside></div></div>`;
  }

  function vCheckout() {
    const groups = cartGroups(); const keys = Object.keys(groups);
    if (!keys.length) { location.hash = '#/sebet'; return ''; }
    const total = keys.reduce((a, k) => a + groups[k].reduce((b, x) => b + x.l.price * x.q, 0), 0);
    const anyNoDel = keys.some((k) => !(sellerById(k) || {}).delivery);
    return `<div class="wrap"><div class="crumbs"><a href="#/">Əsas</a> / <a href="#/sebet">Səbət</a> / <span>Sifariş</span></div>
      <h1 class="ph">Sifarişi rəsmiləşdir</h1>
      <div class="cart"><form id="order" class="form" novalidate>
        <div class="row2"><label class="f"><span>Ad, soyad</span><input name="name" required autocomplete="name" placeholder="Məs. Elvin Məmmədov"></label>
        <label class="f"><span>Telefon</span><input name="phone" required inputmode="tel" autocomplete="tel" placeholder="+994 __ ___ __ __"></label></div>
        <fieldset class="f"><span>Təhvil alma</span><div class="opts">
          <label class="opt"><input type="radio" name="mode" value="Çatdırılma" checked><div><b>${icon('truck')}Çatdırılma</b><small>Satıcı ünvana gətirir, qiyməti zəng edib deyir</small></div></label>
          <label class="opt"><input type="radio" name="mode" value="Özü götürür"><div><b>${icon('store')}Özüm götürəcəyəm</b><small>Satıcının ünvanından</small></div></label></div>
          ${anyNoDel ? `<small class="hint">Bəzi satıcılar çatdırmır — onların məhsulunu özünüz götürəcəksiniz.</small>` : ''}</fieldset>
        <label class="f" id="addr"><span>Ünvan</span><input name="addr" placeholder="Rayon, küçə, bina — məs. Yasamal r., Ş. Mehdiyev 12"></label>
        <label class="f"><span>Qeyd <em>(istəyə görə)</em></span><textarea name="note" rows="3" placeholder="Məs. Mərtəbə 5-dir, lift yoxdur"></textarea></label>
        <button class="btn btn--primary btn--lg">Sifarişi göndər · ${money(total)} AZN</button>
        <p class="muted small">Demo: sifariş yalnız bu brauzerdə saxlanır və admin paneldə görünür. Heç yerə göndərilmir.</p>
      </form>
      <aside class="sum"><h2>Sifarişiniz</h2>${keys.map((k) => `<div class="sum__g"><b>${esc((sellerById(k) || {}).name)}</b>${groups[k].map(({ l, q }) => `<div class="sum__r"><span>${esc(l.title)} × ${qtyFmt(q)}</span><span>${money(l.price * q)}</span></div>`).join('')}</div>`).join('')}
        <div class="sum__r sum__r--t"><span>Cəmi</span><b>${money(total)} AZN</b></div></aside></div></div>`;
  }

  function vDone() {
    const ids = (readQuery().ids || '').split(',');
    const os = S.orders.filter((o) => ids.includes(o.id));
    if (!os.length) return vMissing();
    return `<div class="wrap done"><div class="done__mark">${icon('check')}</div>
      <h1>Sifarişiniz qəbul olundu</h1>
      <p class="muted">${os.length > 1 ? `Sifariş ${os.length} satıcıya bölündü. Hər biri sizə ayrıca zəng edəcək.` : 'Satıcı qısa zamanda sizə zəng edəcək.'}</p>
      <div class="done__list">${os.map((o) => `<div class="done__o"><b>${o.id}</b><span>${esc((sellerById(o.seller) || {}).name)}</span><span>${money(o.total)} AZN</span><span class="st st--new">Yeni</span></div>`).join('')}</div>
      <div class="done__btns"><a class="btn btn--primary" href="#/">Əsas səhifə</a><a class="btn btn--ghost" href="#/admin/sifarisler">Satıcı tərəfdən bax (admin)</a></div></div>`;
  }

  /* ---------- new listing ---------- */
  let draftPhotos = [];
  function vNew() {
    draftPhotos = [];
    const units = ['ədəd', 'kisə', 'm²', 'metr', 'vərəq', 'rulon', 'vedrə', 'dəst', 'ton', 'lot'];
    const cities = ['Bakı', 'Sumqayıt', 'Xırdalan', 'Gəncə', 'Mingəçevir', 'Şirvan', 'Lənkəran'];
    return `<div class="wrap"><div class="crumbs"><a href="#/">Əsas</a> / <span>Yeni elan</span></div>
      <h1 class="ph">Yeni elan</h1>
      <div class="newl"><form id="newl" class="form" novalidate>
        <fieldset class="f"><span>Şəkillər <em>(4-ə qədər)</em></span>
          <div class="ups" id="ups"><label class="up">${icon('camera')}<span>Şəkil əlavə et</span><input type="file" accept="image/*" multiple id="upin"></label></div></fieldset>
        <label class="f"><span>Başlıq</span><input name="title" required maxlength="70" placeholder="Məs. Portland sement M500, 50 kq"></label>
        <div class="row2"><label class="f"><span>Kateqoriya</span><select name="cat" required>${SEED.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select></label>
          <fieldset class="f"><span>Vəziyyət</span><div class="seg seg--sm"><label><input type="radio" name="cond" value="new" checked><span>Yeni</span></label><label><input type="radio" name="cond" value="used"><span>İşlənmiş</span></label></div></fieldset></div>
        <div class="row3"><label class="f"><span>Qiymət, AZN</span><input name="price" required inputmode="decimal" placeholder="0,00"></label>
          <label class="f"><span>Ölçü vahidi</span><select name="unit">${units.map((u) => `<option>${u}</option>`).join('')}</select></label>
          <label class="f"><span>Stokda</span><input name="stock" inputmode="numeric" placeholder="Məs. 200"></label></div>
        <label class="f"><span>Qısa xüsusiyyət <em>(kartda görünür)</em></span><input name="line" maxlength="60" placeholder="Məs. 50 kq · M500 · paletlə 40 kisə"></label>
        <label class="f"><span>Təsvir</span><textarea name="desc" rows="4" placeholder="Vəziyyəti, çatdırılma, endirim şərtləri…"></textarea></label>
        <div class="row2"><label class="f"><span>Satıcının adı</span><input name="sname" required placeholder="Mağaza adı və ya adınız"></label>
          <fieldset class="f"><span>Kimsiniz?</span><div class="seg seg--sm"><label><input type="radio" name="stype" value="Fərdi" checked><span>Fərdi şəxs</span></label><label><input type="radio" name="stype" value="Mağaza"><span>Mağaza</span></label></div></fieldset></div>
        <div class="row2"><label class="f"><span>Şəhər</span><select name="city">${cities.map((c) => `<option>${c}</option>`).join('')}</select></label>
          <label class="f"><span>Telefon</span><input name="phone" inputmode="tel" placeholder="+994 __ ___ __ __"></label></div>
        <label class="chk"><input type="checkbox" name="del" value="1">Çatdırılma edirəm</label>
        <button class="btn btn--primary btn--lg">Elanı dərc et</button>
        <p class="muted small">Demo: elan yalnız bu brauzerdə saxlanır. Real saytda satıcı SMS ilə daxil olur, elan moderasiyadan keçir.</p>
      </form>
      <aside class="preview"><small class="preview__l">${icon('eye')}Alıcı elanı belə görəcək</small><div id="pv"></div></aside></div></div>`;
  }
  function draftFromForm(f) {
    const d = Object.fromEntries(new FormData(f));
    return {
      id: 0, mine: true, cat: d.cat, title: d.title || 'Elanın başlığı', price: Number(String(d.price || '0').replace(',', '.')) || 0,
      unit: d.unit, line: d.line || 'Qısa xüsusiyyət burada görünəcək', used: d.cond === 'used', d: 0, t: nowT(), photos: draftPhotos.slice(),
      seller: '_draft', _s: { name: d.sname || 'Satıcı', type: d.stype, city: d.city }
    };
  }
  const nowT = () => { const x = new Date(); return String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0'); };
  function renderPreview() {
    const f = $('#newl'); if (!f) return;
    const d = draftFromForm(f);
    const tmp = { id: '_draft', name: d._s.name, type: d._s.type, city: d._s.city };
    S.sellers.push(tmp);
    $('#pv').innerHTML = card(d).replace(/href="[^"]*"/g, 'href="javascript:void 0"');
    S.sellers.pop();
  }
  function compress(file) {
    return new Promise((res) => {
      const r = new FileReader();
      r.onload = () => { const im = new Image(); im.onload = () => {
        const sc = Math.min(1, 900 / Math.max(im.width, im.height));
        const c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.78)); }; im.onerror = () => res(null); im.src = r.result; };
      r.readAsDataURL(file);
    });
  }
  function renderUps() {
    const ups = $('#ups'); if (!ups) return;
    $$('.upth', ups).forEach((x) => x.remove());
    draftPhotos.forEach((src, i) => ups.insertAdjacentHTML('beforeend', `<div class="upth"><img src="${src}" alt=""><button type="button" data-uprm="${i}" aria-label="Sil">${icon('close')}</button>${i === 0 ? '<em>Əsas</em>' : ''}</div>`));
    $('.up', ups).hidden = draftPhotos.length >= 4;
  }

  /* ---------- admin ---------- */
  function adminShell(tab, body) {
    const tabs = [['', 'İcmal', 'chart'], ['elanlar', 'Elanlar', 'box'], ['sifarisler', 'Sifarişlər', 'cart'], ['saticilar', 'Satıcılar', 'store']];
    const newOrders = S.orders.filter((o) => (S.status[o.id] || o.status) === 'Yeni').length;
    return `<div class="admin"><aside class="admin__nav"><div class="admin__brand">${icon('shield')}<div><b>Admin panel</b><small>Saytın sahibi üçün</small></div></div>
      ${tabs.map(([k, t, ic]) => `<a href="#/admin${k ? '/' + k : ''}" class="${tab === k ? 'on' : ''}">${icon(ic)}${t}${k === 'sifarisler' && newOrders ? `<em>${newOrders}</em>` : ''}</a>`).join('')}
      <button class="admin__reset" data-reset>Demonu sıfırla</button>
      <a class="admin__back" href="#/">← Sayta qayıt</a></aside>
      <main class="admin__main"><div class="admin__demo">Demo rejimi: giriş tələb olunmur. Real saytda bu bölmə parol və iki addımlı təsdiqlə qorunur.</div>${body}</main></div>`;
  }
  function vAdmin(tab) {
    const all = allListings();
    const vis = visible();
    if (tab === 'elanlar') {
      const rows = all.slice().sort(sortNew).map((l) => {
        const s = sellerById(l.seller) || {}; const hid = S.hidden.includes(l.id) || S.blocked.includes(l.seller);
        return `<tr class="${hid ? 'off' : ''}"><td><a href="#/elan/${l.id}" class="at__img">${imgSrc(l) ? `<img src="${esc(imgSrc(l))}" alt="">` : icon('box')}</a></td>
          <td><a href="#/elan/${l.id}" class="at__t">${esc(l.title)}</a><small>№ ${l.id} · ${esc(catById(l.cat)?.short || '')}${l.mine ? ' · <b class="newb">yeni istifadəçi</b>' : ''}</small></td>
          <td>${esc(s.name)}<small>${esc(s.type)}</small></td><td class="num">${money(l.price)} AZN<small>/ ${esc(l.unit)}</small></td><td>${when(l.d, l.t)}</td>
          <td><span class="st ${hid ? 'st--off' : 'st--ok'}">${hid ? 'Gizli' : 'Aktiv'}</span></td>
          <td class="acts"><button class="ab${l.vip ? ' on' : ''}" data-vip="${l.id}" title="VIP">${icon('crown')}<span>VIP</span></button><button class="ab" data-hide="${l.id}" title="${S.hidden.includes(l.id) ? 'Göstər' : 'Gizlət'}">${icon(S.hidden.includes(l.id) ? 'eye' : 'eyeOff')}<span>${S.hidden.includes(l.id) ? 'Göstər' : 'Gizlət'}</span></button><button class="ab ab--del" data-del="${l.id}" title="Sil">${icon('trash')}<span>Sil</span></button></td></tr>`;
      }).join('');
      return adminShell('elanlar', `<header class="ah"><h1>Elanlar <small>${all.length}</small></h1><p class="muted">Lazımsız və ya qaydaya uyğun olmayan elanı gizlədin və ya silin. VIP elanlar əsas səhifədə ən yuxarıda görünür — satıcılara ödənişli xidmət kimi satıla bilər.</p></header>
        <div class="tbl"><table><thead><tr><th></th><th>Elan</th><th>Satıcı</th><th>Qiymət</th><th>Tarix</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`);
    }
    if (tab === 'sifarisler') {
      const os = S.orders.slice().sort((a, b) => a.d - b.d || b.t.localeCompare(a.t));
      return adminShell('sifarisler', `<header class="ah"><h1>Sifarişlər <small>${os.length}</small></h1><p class="muted">Alıcı səbətdən sifariş verəndə burada görünür; hər sifariş öz satıcısına aiddir. Real saytda satıcıya eyni anda Telegram və ya SMS bildirişi gedir.</p></header>
        <div class="orders">${os.map((o) => { const s = sellerById(o.seller) || {}; const st = S.status[o.id] || o.status; return `<article class="ord"><header><b>${o.id}</b><span class="muted">${when(o.d, o.t)}</span>
          <select data-st="${o.id}" class="st-sel st-sel--${st === 'Yeni' ? 'new' : st === 'Ləğv edildi' ? 'off' : 'ok'}">${['Yeni', 'Təsdiqləndi', 'Çatdırıldı', 'Ləğv edildi'].map((x) => `<option ${x === st ? 'selected' : ''}>${x}</option>`).join('')}</select></header>
          <div class="ord__b"><div><small>Alıcı</small>${esc(o.name)}<br><span class="muted">${esc(o.phone)}</span></div><div><small>Satıcı</small>${esc(s.name)}</div><div><small>Təhvil</small>${esc(o.mode)}${o.addr ? '<br><span class="muted">' + esc(o.addr) + '</span>' : ''}</div></div>
          <ul class="ord__i">${o.items.map((it) => { const l = byId(it.id); return l ? `<li><span>${esc(l.title)}</span><span>${qtyFmt(it.q)} ${esc(l.unit)}</span></li>` : ''; }).join('')}</ul>
          <footer><span>Cəmi</span><b>${money(o.total)} AZN</b></footer></article>`; }).join('')}</div>`);
    }
    if (tab === 'saticilar') {
      return adminShell('saticilar', `<header class="ah"><h1>Satıcılar <small>${sellers().length}</small></h1><p class="muted">Qaydaları pozan satıcını bloklayın — bütün elanları bir düymə ilə saytdan çıxır.</p></header>
        <div class="tbl"><table><thead><tr><th>Satıcı</th><th>Növ</th><th>Şəhər</th><th>Elan</th><th>Sifariş</th><th></th></tr></thead><tbody>${sellers().map((s) => { const b = S.blocked.includes(s.id); return `<tr class="${b ? 'off' : ''}"><td><a href="#/satici/${s.id}" class="at__t">${esc(s.name)}</a></td><td>${esc(s.type)}</td><td>${esc(s.city)}</td><td class="num">${all.filter((l) => l.seller === s.id).length}</td><td class="num">${S.orders.filter((o) => o.seller === s.id).length}</td><td class="acts"><button class="ab${b ? ' on' : ''}" data-block="${s.id}">${icon(b ? 'eye' : 'eyeOff')}<span>${b ? 'Blokdan çıxar' : 'Blokla'}</span></button></td></tr>`; }).join('')}</tbody></table></div>`);
    }
    const today = vis.filter((l) => l.d === 0).length;
    const revenue = S.orders.filter((o) => (S.status[o.id] || o.status) !== 'Ləğv edildi').reduce((a, o) => a + o.total, 0);
    const counts = SEED.categories.map((c) => ({ c, n: vis.filter((l) => l.cat === c.id).length })).sort((a, b) => b.n - a.n);
    const max = Math.max(1, ...counts.map((x) => x.n));
    const recent = S.orders.slice().sort((a, b) => a.d - b.d || b.t.localeCompare(a.t)).slice(0, 4);
    return adminShell('', `<header class="ah"><h1>İcmal</h1></header>
      <div class="kpis"><div class="kpi"><small>Aktiv elan</small><b>${vis.length}</b></div><div class="kpi"><small>Bu gün yeni</small><b>${today}</b></div>
        <div class="kpi"><small>Sifariş</small><b>${S.orders.length}</b></div><div class="kpi"><small>Sifarişlərin həcmi</small><b>${money(revenue)} <i>AZN</i></b></div></div>
      <div class="a2"><section class="panel"><h2>Kateqoriyalar üzrə elanlar</h2><div class="bars">${counts.map(({ c, n }) => `<div class="bar"><span>${c.short}</span><i style="--w:${(n / max) * 100}%"></i><b>${n}</b></div>`).join('')}</div></section>
        <section class="panel"><h2>Son sifarişlər</h2>${recent.map((o) => `<a class="mini" href="#/admin/sifarisler"><b>${o.id}</b><span>${esc((sellerById(o.seller) || {}).name)}</span><span>${money(o.total)} AZN</span><span class="st st--${(S.status[o.id] || o.status) === 'Yeni' ? 'new' : 'ok'}">${S.status[o.id] || o.status}</span></a>`).join('')}</section></div>`);
  }

  function vMissing() { return `<div class="wrap"><div class="empty">${icon('search')}<p>Bu səhifə tapılmadı və ya elan silinib.</p><a class="btn btn--primary" href="#/">Əsas səhifə</a></div></div>`; }

  /* ---------- router ---------- */
  function route() {
    const path = (location.hash.replace(/^#\/?/, '').split('?')[0] || '').split('/');
    const [a, b] = path;
    let html;
    document.body.classList.toggle('is-admin', a === 'admin');
    document.body.classList.toggle('on-home', !a);
    setMega(false);
    if (!a) html = vHome();
    else if (a === 'axtar') html = vSearch();
    else if (a === 'elan') html = vListing(b);
    else if (a === 'satici') html = vSeller(b);
    else if (a === 'secilmis') html = vFavs();
    else if (a === 'sebet') html = vCart();
    else if (a === 'sifaris') html = vCheckout();
    else if (a === 'ugur') html = vDone();
    else if (a === 'yeni-elan') html = vNew();
    else if (a === 'admin') html = vAdmin(b || '');
    else html = vMissing();
    $('#app').innerHTML = html;
    $$('.mnav a').forEach((x) => x.classList.toggle('on', x.getAttribute('href') === '#/' + (a || '') || (a === undefined && x.getAttribute('href') === '#/')));
    syncBadges();
    if (!a) startFeed(); else clearInterval(feedTimer);
    const hs = $('#hsearch input'); if (hs) hs.value = a === 'axtar' ? (readQuery().q || '') : '';
    onScroll();
    if (a === 'elan') runCalc();
    if (a === 'yeni-elan') renderPreview();
    const keep = sessionStorage.getItem('temel-keep-scroll'); sessionStorage.removeItem('temel-keep-scroll');
    if (!keep) window.scrollTo(0, 0);
    const t = { '': 'Təməl — tikinti materialları elanları', axtar: 'Axtarış — Təməl', sebet: 'Səbət — Təməl', admin: 'Admin — Təməl', 'yeni-elan': 'Yeni elan — Təməl' };
    document.title = a === 'elan' && byId(b) ? byId(b).title + ' — Təməl' : (t[a || ''] || 'Təməl');
  }
  const rerender = () => { sessionStorage.setItem('temel-keep-scroll', '1'); route(); };

  /* ---------- events ---------- */
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('button, a'); if (!t) return;
    if (t.dataset.add) { e.preventDefault(); const l = byId(t.dataset.add); addToCart(l.id, l.min || 1, t); return; }
    if (t.dataset.fav) { e.preventDefault(); const id = Number(t.dataset.fav); S.favs = S.favs.includes(id) ? S.favs.filter((x) => x !== id) : S.favs.concat(id); save(); syncBadges();
      $$(`[data-fav="${id}"]`).forEach((b) => b.classList.toggle('on', S.favs.includes(id))); if (S.favs.includes(id)) toast('Seçilmişlərə əlavə olundu'); return; }
    if (t.dataset.q) { const box = t.closest('.qty'); const inp = $('#qty'); const st = Number(box.dataset.step), mn = Number(box.dataset.min);
      let v = Number(inp.value.replace(',', '.')) || mn; v = t.dataset.q === '+' ? v + st : Math.max(mn, v - st); inp.value = qtyFmt(Math.round(v * 100) / 100); updQty(); return; }
    if (t.dataset.addq) { const v = Number($('#qty').value.replace(',', '.')) || 1; addToCart(Number(t.dataset.addq), v, t); return; }
    if (t.dataset.now) { const v = Number($('#qty').value.replace(',', '.')) || 1; const id = Number(t.dataset.now); if (!S.cart.find((c) => c.id === id)) { S.cart.push({ id, q: v }); save(); } location.hash = '#/sifaris'; return; }
    if (t.id === 'cadd') { const id = Number($('.calc').dataset.id); addToCart(id, calcQty, $('.pd__top .buy__btns button')); return; }
    if (t.dataset.cs) { const inp = t.parentElement.querySelector('input'); const st = Number(t.dataset.st); let v = Number(inp.value.replace(',', '.')) || 0; v = t.dataset.cs === '+' ? v + st : Math.max(0, v - st); inp.value = qtyFmt(v); runCalc(); return; }
    if (t.dataset.thumb) { $('#galmain').src = t.dataset.thumb; $$('.gal__thumbs button').forEach((x) => x.classList.toggle('on', x === t)); return; }
    if (t.hasAttribute('data-phone')) { t.querySelector('span').textContent = '+994 50 000 00 00 (demo)'; return; }
    if (t.dataset.cq) { const box = t.closest('[data-cid]'); const id = Number(box.dataset.cid); const c = S.cart.find((x) => x.id === id); const st = Number(box.dataset.step), mn = Number(box.dataset.min);
      c.q = Math.round((t.dataset.cq === '+' ? c.q + st : Math.max(mn, c.q - st)) * 100) / 100; save(); rerender(); return; }
    if (t.dataset.rm) { S.cart = S.cart.filter((c) => c.id !== Number(t.dataset.rm)); save(); rerender(); return; }
    if (t.dataset.uprm) { draftPhotos.splice(Number(t.dataset.uprm), 1); renderUps(); renderPreview(); return; }
    if (t.dataset.vip) { const id = Number(t.dataset.vip); const l = byId(id); S.vip[id] = !l.vip; save(); rerender(); toast(S.vip[id] ? 'Elan VIP oldu — əsas səhifədə yuxarıda' : 'VIP götürüldü'); return; }
    if (t.dataset.hide) { const id = Number(t.dataset.hide); S.hidden = S.hidden.includes(id) ? S.hidden.filter((x) => x !== id) : S.hidden.concat(id); save(); rerender(); toast(S.hidden.includes(id) ? 'Elan gizlədildi' : 'Elan yenidən görünür'); return; }
    if (t.dataset.del) { const id = Number(t.dataset.del); if (!confirm('Elan silinsin? Bu əməliyyat geri qaytarılmır.')) return; S.deleted.push(id); S.cart = S.cart.filter((c) => c.id !== id); save(); rerender(); toast('Elan silindi'); return; }
    if (t.dataset.block) { const id = t.dataset.block; S.blocked = S.blocked.includes(id) ? S.blocked.filter((x) => x !== id) : S.blocked.concat(id); save(); rerender(); toast(S.blocked.includes(id) ? 'Satıcı bloklandı, elanları gizləndi' : 'Satıcı blokdan çıxdı'); return; }
    if (t.hasAttribute('data-reset')) { if (!confirm('Demo ilkin vəziyyətə qaytarılsın? Əlavə etdiyiniz elanlar və sifarişlər silinəcək.')) return; S = fresh(); save(); location.hash = '#/admin'; route(); toast('Demo sıfırlandı'); return; }
  });
  function updQty() { const box = $('.qty'); if (!box) return; const v = Number($('#qty').value.replace(',', '.')) || 0; $('#qsum').textContent = money(v * Number(box.dataset.price)) + ' AZN'; }

  document.addEventListener('input', (e) => {
    if (e.target.id === 'qty') updQty();
    if (e.target.dataset.k !== undefined && e.target.closest('.calc')) runCalc();
    if (e.target.closest('#newl')) renderPreview();
  });
  document.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.dataset.k !== undefined && t.closest('.calc')) runCalc();
    if (t.id === 'sort') { location.hash = qs(Object.assign(readQuery(), { sort: t.value })); }
    if (t.closest('#side')) { const f = new FormData($('#side')); const q = readQuery(); q.type = f.get('type') || ''; q.del = f.get('del') || ''; q.sale = f.get('sale') || ''; location.hash = qs(q); }
    if (t.closest('#sbox') && t.name === 'cond' && location.hash.startsWith('#/axtar')) $('#sbox').requestSubmit();
    if (t.dataset.cqi !== undefined) { const box = t.closest('[data-cid]'); const c = S.cart.find((x) => x.id === Number(box.dataset.cid)); c.q = Math.max(Number(box.dataset.min), Number(t.value.replace(',', '.')) || 0); save(); rerender(); }
    if (t.dataset.st) { S.status[t.dataset.st] = t.value; save(); rerender(); toast(`${t.dataset.st}: ${t.value}`); }
    if (t.name === 'mode') $('#addr').hidden = t.value !== 'Çatdırılma';
    if (t.id === 'upin') {
      const files = Array.from(t.files).slice(0, 4 - draftPhotos.length);
      for (const f of files) { const d = await compress(f); if (d) draftPhotos.push(d); }
      t.value = ''; renderUps(); renderPreview();
    }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target; e.preventDefault();
    if (f.id === 'hsearch') { const v = f.elements.q.value.trim(); location.hash = qs(v ? { q: v } : {}); f.elements.q.blur(); return; }
    if (f.id === 'sbox') { const d = Object.fromEntries(new FormData(f)); const q = Object.assign(location.hash.startsWith('#/axtar') ? readQuery() : {}, d); location.hash = qs(q); return; }
    if (f.id === 'order') {
      const d = Object.fromEntries(new FormData(f)); let bad = false;
      ['name', 'phone'].forEach((k) => { const el = f.elements[k]; const ok = String(d[k] || '').trim().length > (k === 'phone' ? 6 : 1); el.classList.toggle('err', !ok); if (!ok) bad = true; });
      if (d.mode === 'Çatdırılma' && !String(d.addr || '').trim()) { f.elements.addr.classList.add('err'); bad = true; } else f.elements.addr.classList.remove('err');
      if (bad) { toast('Qırmızı xanaları doldurun'); return; }
      const groups = cartGroups(); const ids = [];
      const x = new Date(); const pre = 'TM-' + String(x.getMonth() + 1).padStart(2, '0') + String(x.getDate()).padStart(2, '0') + '-';
      Object.keys(groups).forEach((sid) => {
        const id = pre + String(S.seq++).padStart(3, '0'); ids.push(id);
        S.orders.push({ id, seller: sid, name: d.name, phone: d.phone, addr: d.mode === 'Çatdırılma' ? d.addr : '', mode: (sellerById(sid) || {}).delivery ? d.mode : 'Özü götürür',
          items: groups[sid].map(({ l, q }) => ({ id: l.id, q })), total: Math.round(groups[sid].reduce((a, y) => a + y.l.price * y.q, 0) * 100) / 100, status: 'Yeni', d: 0, t: nowT() });
      });
      S.cart = []; save(); location.hash = '#/ugur?ids=' + ids.join(','); return;
    }
    if (f.id === 'newl') {
      const d = Object.fromEntries(new FormData(f)); let bad = false;
      ['title', 'price', 'sname'].forEach((k) => { const ok = String(d[k] || '').trim() && (k !== 'price' || Number(String(d.price).replace(',', '.')) > 0); f.elements[k].classList.toggle('err', !ok); if (!ok) bad = true; });
      if (bad) { toast('Başlıq, qiymət və satıcı adı lazımdır'); return; }
      let s = sellers().find((x) => x.name.toLocaleLowerCase('az') === d.sname.trim().toLocaleLowerCase('az'));
      if (!s) { s = { id: 'u' + Date.now(), name: d.sname.trim(), type: d.stype, city: d.city, since: new Date().getFullYear(), delivery: !!d.del, mine: true }; S.sellers.push(s); }
      const id = Math.max(200, ...allListings().map((l) => l.id), ...S.deleted) + 1;
      const specs = {}; if (d.line) specs['Qısa'] = d.line; specs['Vəziyyət'] = d.cond === 'used' ? 'İşlənmiş' : 'Yeni';
      S.user.push({ id, mine: true, cat: d.cat, seller: s.id, title: d.title.trim(), price: Number(String(d.price).replace(',', '.')), unit: d.unit, line: d.line, used: d.cond === 'used',
        d: 0, t: nowT(), photos: draftPhotos.slice(), specs, desc: d.desc, stock: Number(d.stock) || 1, min: 1, calc: null });
      save(); sessionStorage.setItem('temel-just', String(id)); sessionStorage.setItem('temel-flash', String(id)); location.hash = '#/elan/' + id;
    }
  });

  /* ---------- header: catalog menu, search, theme ---------- */
  function renderMega() {
    const vis = visible();
    $('#mega').innerHTML = `<div class="mega__grid">${SEED.categories.map((c) => `<a class="mega__c" href="#/axtar?cat=${c.id}"><i>${icon(c.icon)}</i><b>${c.name}</b><em>${vis.filter((l) => l.cat === c.id).length}</em></a>`).join('')}</div>
      <div class="mega__f"><a href="#/axtar">Bütün elanlar</a><a href="#/axtar?sale=1">Endirimlər</a><a href="#/axtar?type=Mağaza">Mağazalar</a><a href="#/axtar?type=Fərdi">Fərdi satıcılar</a></div>`;
  }
  function setMega(open) {
    const m = $('#mega'), b = $('#katBtn'); if (!m) return;
    if (open) renderMega();
    m.hidden = !open; b.setAttribute('aria-expanded', String(open));
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('#katBtn')) { setMega($('#mega').hidden); return; }
    if (!e.target.closest('#mega') || e.target.closest('a')) setMega(false);
    if (e.target.closest('#themeBtn')) {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('temel-theme', next); } catch (err) { /* private mode */ }
      applyTheme();
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMega(false); });
  const darkMQ = matchMedia('(prefers-color-scheme: dark)');
  function isDark() { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : darkMQ.matches; }
  function applyTheme() {
    const d = isDark();
    document.documentElement.classList.toggle('is-dark', d);
    $('#themeBtn').setAttribute('aria-label', d ? 'Gündüz rejimi' : 'Gecə rejimi');
  }
  darkMQ.addEventListener('change', applyTheme);
  function onScroll() {
    const hero = $('.hero'); const top = $('#top');
    top.classList.toggle('scrolled', !hero || window.scrollY > hero.offsetTop + hero.offsetHeight - 120);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  window.addEventListener('hashchange', route);
  applyTheme();
  route();
})();
