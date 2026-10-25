(() => {
  const d = document, root = d.documentElement;
  root.classList.add('js');
  const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = reduceMq.matches;
  const y = d.getElementById('y'); if (y) y.textContent = new Date().getFullYear();

  // barra compacta: aparece al pasar el hero
  const bar = d.querySelector('.bar'), hero = d.querySelector('.hD, .hero');
  if (bar && hero) new IntersectionObserver(([e]) => bar.classList.toggle('is-on', !e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' }).observe(hero);

  // sección activa en la barra
  const links = [...d.querySelectorAll('.bar__nav a')];
  const secs = links.map(a => d.querySelector(a.getAttribute('href'))).filter(Boolean);
  const sio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-here', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => sio.observe(s));

  // anclas con scroll suave + compensación de la barra fija
  d.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#main') return;
    e.preventDefault();
    const smooth = reduceMq.matches ? 'auto' : 'smooth';
    if (id === '#top' || id === '#') {
      scrollTo({ top: 0, behavior: smooth });
      history.replaceState(null, '', location.pathname + location.search);
      return;
    }
    const t = d.querySelector(id); if (!t) return;
    scrollTo({ top: t.getBoundingClientRect().top + scrollY - 56, behavior: smooth });
    history.replaceState(null, '', id);
  }));

  // reveal
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  d.querySelectorAll('.reveal').forEach((el, n) => { el.style.transitionDelay = (n % 5) * 70 + 'ms'; io.observe(el); });

  // contadores
  const fmt = n => n.toLocaleString('es-AR');
  const counts = [...d.querySelectorAll('.count')];
  if (reduce) counts.forEach(el => el.textContent = fmt(+el.dataset.to));
  else {
    counts.forEach(el => el.textContent = '0');
    const cio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      const el = e.target, to = +el.dataset.to, t0 = performance.now(), dur = 2200;
      const step = t => { const p = Math.min((t - t0) / dur, 1); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 4)))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: .4 });
    counts.forEach(el => cio.observe(el));
  }

  // tira de atletas: desplazamiento infinito, pausa con hover/toque/foco
  const strip = d.getElementById('strip');
  if (strip && !reduce) {
    const items = [...strip.children];
    strip.classList.add('is-auto');
    items.forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.querySelector('img').alt = ''; strip.appendChild(c); });
    let period = 0, pos = 0, last = 0, hold = 0, hover = false, focus = false, visible = true;
    const SPEED = 40;
    const measure = () => { period = strip.children[items.length].offsetLeft - items[0].offsetLeft; };
    measure(); addEventListener('resize', measure); addEventListener('load', measure);
    strip.addEventListener('mouseenter', () => hover = true);
    strip.addEventListener('mouseleave', () => hover = false);
    strip.addEventListener('focusin', () => focus = true);
    strip.addEventListener('focusout', () => focus = false);
    const pauseFor = ms => hold = performance.now() + ms;
    strip.addEventListener('pointerdown', () => pauseFor(4000));
    strip.addEventListener('touchstart', () => pauseFor(4000), { passive: true });
    strip.addEventListener('wheel', () => pauseFor(2500), { passive: true });
    strip.addEventListener('scroll', () => {
      if (performance.now() >= hold || !period) return;
      if (strip.scrollLeft >= period + 1) strip.scrollLeft -= period;
    }, { passive: true });
    new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(strip);
    const tick = t => {
      const dt = last ? Math.min(t - last, 64) / 1000 : 0; last = t;
      if (hover || focus || !visible || t < hold || d.hidden) pos = strip.scrollLeft;
      else if (period) { pos += SPEED * dt; if (pos >= period) pos -= period; strip.scrollLeft = pos; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // video: loop silencioso, carga diferida
  const v = d.getElementById('reel-video'), sec = d.getElementById('video');
  if (v && sec && !reduce) {
    let loaded = false, inView = false;
    const play = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView && !loaded) {
        loaded = true;
        [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(([k, type]) => { const s = d.createElement('source'); s.src = v.dataset[k]; s.type = type; v.appendChild(s); });
        v.load();
      }
      if (loaded) (inView && !d.hidden) ? play() : v.pause();
    }, { rootMargin: '300px 0px' }).observe(sec);
    d.addEventListener('visibilitychange', () => { if (loaded) (d.hidden || !inView) ? v.pause() : play(); });
  }
})();
