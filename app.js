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
  $$('.rv-up').forEach(el => io.observe(el));

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
    const b = e.target.closest('.g-item'); if (!b) return;
    const vis = $$('.g-item', $('#gallery')).filter(x => !x.hidden);
    const items = vis.map(x => { const im = $('img', x); return { type: 'img', src: im.src, alt: im.alt, cap: $('figcaption', x).textContent }; });
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
  $$('button[type=submit]', form).forEach(b => b.addEventListener('click', () => { via = b.dataset.via; }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = F.name.value.trim(), phone = F.phone.value.trim();
    F.name.setAttribute('aria-invalid', !name);
    F.phone.setAttribute('aria-invalid', phone.replace(/\D/g, '').length < 7);
    if (!name) { F.name.focus(); return; }
    if (phone.replace(/\D/g, '').length < 7) { F.phone.focus(); return; }
    const lines = [
      'New project inquiry',
      'Name: ' + name,
      'Phone: ' + phone,
      F.email.value.trim() && 'Email: ' + F.email.value.trim(),
      'Service: ' + F.service.value,
      F.budget.value.trim() && 'Budget: ' + F.budget.value.trim(),
      F.msg.value.trim() && 'Details: ' + F.msg.value.trim()
    ].filter(Boolean).join('\n');
    if (via === 'wa') {
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(lines), '_blank', 'noopener');
    } else {
      location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Project inquiry: ' + F.service.value) + '&body=' + encodeURIComponent(lines);
    }
    msg.textContent = 'Thanks, ' + name + '. Your message is ready to send.';
  });
  ['name', 'phone'].forEach(n => F[n].addEventListener('input', () => F[n].removeAttribute('aria-invalid')));
})();
