(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = '8801314624969';
  const MAIL = 'shahriarsiam3130@gmail.com';

  /* mobile menu */
  const mb = $('.menu-btn'), mm = $('#mmenu');
  mb.addEventListener('click', () => {
    const open = mm.classList.toggle('open');
    mb.setAttribute('aria-expanded', open);
  });
  $$('a', mm).forEach(a => a.addEventListener('click', () => { mm.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); }));

  /* active nav link */
  const links = $$('.nav-links a');
  const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => spy.observe(s));

  /* reveal on scroll (content is visible without JS) */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv-up, .hs').forEach(el => io.observe(el));

  /* horizontal gallery: native swipe/trackpad, mouse drag on desktop, arrow buttons */
  const hs = $('.hs');
  if (hs) {
    const btns = $$('.hs-btn');
    const stepW = () => { const c = $('.hs-card', hs); return c ? c.getBoundingClientRect().width + 14 : 300; };
    const smooth = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    /* endless loop: a hidden copy of the cards follows the originals */
    const originals = $$('.hs-card', hs);
    originals.forEach(c => { const k = c.cloneNode(true); k.classList.add('clone'); k.setAttribute('aria-hidden', 'true'); k.tabIndex = -1; hs.append(k); });
    const loopW = () => $('.hs-card.clone', hs).offsetLeft - originals[0].offsetLeft;
    const wrap = () => { const w = loopW(); if (hs.scrollLeft >= w) hs.scrollLeft -= w; };
    const sync = wrap;
    btns.forEach(b => b.addEventListener('click', () => hs.scrollBy({ left: Number(b.dataset.dir) * stepW() * 2, behavior: smooth() })));
    hs.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); sync();
    hs.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { hs.scrollBy({ left: stepW(), behavior: smooth() }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { hs.scrollBy({ left: -stepW(), behavior: smooth() }); e.preventDefault(); }
    });
    let down = false, sx = 0, sl = 0, moved = 0;
    hs.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = 0; sx = e.clientX; sl = hs.scrollLeft;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) { hs.classList.add('dragging'); hs.scrollLeft = sl - dx; }
    });
    addEventListener('pointerup', () => {
      if (!down) return; down = false;
      if (hs.classList.contains('dragging')) {
        hs.classList.remove('dragging');
        const w = stepW(); hs.scrollTo({ left: Math.round(hs.scrollLeft / w) * w, behavior: smooth() });
      }
    });
    hs.addEventListener('click', e => { if (moved > 5) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);

    /* kinetic drift: slides on its own, pauses on hover, touch, drag, wheel or focus, resumes after a pause */
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let pos = 0, inView = false, hover = false, holdUntil = 0, last = 0;
    const SPEED = 32;                     /* px per second */
    const hold = (ms = 3000) => { holdUntil = performance.now() + ms; hs.classList.remove('auto'); };
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; }).observe(hs);
    hs.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hover = true; hs.classList.remove('auto'); } });
    hs.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hover = false; hold(800); } });
    ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin'].forEach(ev => hs.addEventListener(ev, () => hold(3500), { passive: true }));
    btns.forEach(b => b.addEventListener('click', () => hold(3500)));
    const tick = now => {
      const dt = Math.min(64, now - (last || now)); last = now;
      const running = inView && !hover && !down && now > holdUntil && !reduce.matches && !document.hidden;
      if (running) {
        if (!hs.classList.contains('auto')) { hs.classList.add('auto'); pos = hs.scrollLeft; }
        pos += SPEED * dt / 1000;
        const w = loopW(); if (pos >= w) pos -= w;
        hs.scrollLeft = pos;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* floating WhatsApp appears once the hero (and its own WhatsApp button) is passed */
  const fab = $('.fab'), hero = $('.hero');
  const syncFab = () => fab && hero && fab.classList.toggle('show', hero.getBoundingClientRect().bottom < 0);
  addEventListener('scroll', syncFab, { passive: true }); syncFab();

  /* filter tabs */
  $$('.tabs[data-filter]').forEach(bar => {
    const grid = document.getElementById(bar.dataset.filter);
    bar.addEventListener('click', e => {
      const t = e.target.closest('.tab'); if (!t) return;
      $$('.tab', bar).forEach(b => b.setAttribute('aria-selected', b === t));
      const f = t.dataset.f;
      [...grid.children].forEach(it => { it.hidden = !(f === 'all' || it.dataset.c === f); });
    });
  });

  /* lightbox: images and videos */
  const lb = $('#lb'), stage = $('.lb-stage', lb);
  let list = [], idx = 0, lastFocus = null;

  function render() {
    const it = list[idx];
    stage.innerHTML = '';
    if (it.type === 'img') {
      const img = new Image();
      img.src = it.src; img.alt = it.alt;
      stage.append(img);
    } else {
      const v = document.createElement('video');
      v.src = it.src; v.controls = true; v.autoplay = true; v.playsInline = true;
      if (it.poster) v.poster = it.poster;
      stage.append(v);
    }
    const cap = document.createElement('p');
    cap.className = 'lb-cap';
    cap.textContent = it.cap + '  (' + (idx + 1) + ' / ' + list.length + ')';
    stage.append(cap);
  }
  function open(items, i) {
    list = items; idx = i; lastFocus = document.activeElement;
    lb.hidden = false; lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    render();
    $('.lb-x', lb).focus();
  }
  function close() {
    lb.classList.remove('open'); lb.hidden = true;
    stage.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  function step(d) { idx = (idx + d + list.length) % list.length; render(); }

  $('.lb-x', lb).addEventListener('click', close);
  $('.lb-nav.prev', lb).addEventListener('click', () => step(-1));
  $('.lb-nav.next', lb).addEventListener('click', () => step(1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  let sx = null;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50 && !(e.target.tagName === 'VIDEO')) step(dx < 0 ? 1 : -1);
  });

  $('#gallery').addEventListener('click', e => {
    let b = e.target.closest('.g-item'); if (!b) return;
    if (b.classList.contains('clone')) b = $$('.hs-card:not(.clone)', $('#gallery'))[$$('.hs-card.clone', $('#gallery')).indexOf(b)];
    const vis = $$('.g-item:not(.clone)', $('#gallery')).filter(x => !x.hidden);
    const items = vis.map(x => { const im = $('img', x); return { type: 'img', src: im.src, alt: im.alt, cap: im.alt }; });
    open(items, vis.indexOf(b));
  });
  $('#videos').addEventListener('click', e => {
    const b = e.target.closest('.vcard'); if (!b) return;
    const vis = $$('.vcard', $('#videos')).filter(x => !x.hidden);
    const items = vis.map(x => ({ type: 'video', src: x.dataset.src, poster: $('img', x).src, cap: $('.meta b', x).textContent }));
    open(items, vis.indexOf(b));
  });

  /* only one inline video plays at a time */
  document.addEventListener('play', e => {
    $$('video').forEach(v => { if (v !== e.target) v.pause(); });
  }, true);

  /* inquiry form: WhatsApp or email, no server needed */
  const form = $('#inq'), F = form.elements, msg = $('.form-msg', form);
  let via = 'wa';
  const say = (text, bad) => { msg.textContent = text; msg.classList.toggle('bad', !!bad); };
  $$('button[type=submit]', form).forEach(b => b.addEventListener('click', () => { via = b.dataset.via; }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = F.name.value.trim(), phone = F.phone.value.trim(), email = F.email.value.trim();
    const badName = !name, badPhone = phone.replace(/\D/g, '').length < 7;
    const badEmail = !!email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    F.name.setAttribute('aria-invalid', badName);
    F.phone.setAttribute('aria-invalid', badPhone);
    F.email.setAttribute('aria-invalid', badEmail);
    if (badName || badPhone || badEmail) {
      say('Please check the highlighted fields so I can reply to you.', true);
      (badName ? F.name : badPhone ? F.phone : F.email).focus();
      return;
    }
    const lines = [
      'New project inquiry',
      'Name: ' + name,
      'Phone: ' + phone,
      email && 'Email: ' + email,
      'Service: ' + F.service.value,
      F.budget.value.trim() && 'Budget: ' + F.budget.value.trim(),
      F.msg.value.trim() && 'Details: ' + F.msg.value.trim()
    ].filter(Boolean).join('\n');
    if (via === 'wa') {
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(lines), '_blank', 'noopener');
      say('Thanks, ' + name + '. WhatsApp opened with your message ready, just press send. If it did not open, message me at +880 1314 624969.');
    } else {
      location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Project inquiry: ' + F.service.value) + '&body=' + encodeURIComponent(lines);
      say('Thanks, ' + name + '. Your email app should open with the message ready. If not, write to ' + MAIL + '.');
    }
  });
  ['name', 'phone', 'email'].forEach(n => F[n].addEventListener('input', () => { F[n].removeAttribute('aria-invalid'); if (msg.classList.contains('bad')) say(''); }));
})();
