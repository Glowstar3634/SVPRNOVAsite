
(() => {
  const homeView = document.getElementById('home-view');
  const researchView = document.getElementById('research-view');
  const header = document.getElementById('site-header');
  const navResearch = header?.querySelector('a[href="/research"]');
  const routeViews = { home: homeView, research: researchView };

  const pathRoute = () => /\/research(?:\/|$)/.test(window.location.pathname) ? 'research' : 'home';

  const setRoute = (route, { push = false, hash = '' } = {}) => {
    Object.entries(routeViews).forEach(([name, el]) => {
      if (!el) return;
      const active = name === route;
      el.hidden = !active;
      el.setAttribute('aria-hidden', String(!active));
    });
    document.body.classList.toggle('route-research', route === 'research');
    navResearch?.classList.toggle('route-active', route === 'research');
    if (push && window.location.protocol !== 'file:') history.pushState({ route }, '', route === 'research' ? `/research${hash || ''}` : `/${hash || ''}`);
    requestAnimationFrame(() => {
      if (hash) {
        const target = document.querySelector(hash);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      window.dispatchEvent(new Event('resize'));
    });
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;

    if (/\/research\/?$/.test(url.pathname)) {
      event.preventDefault();
      setRoute('research', { push: true, hash: url.hash });
      return;
    }
    if ((url.pathname === '/' || url.pathname.endsWith('/index.html')) && link.dataset.routeLink === 'home') {
      event.preventDefault();
      setRoute('home', { push: true, hash: url.hash });
      return;
    }
  });

  window.addEventListener('popstate', () => setRoute(pathRoute(), { push: false, hash: window.location.hash }));

  // Direct /research loads skip the homepage ignition but keep the same shell.
  const initial = pathRoute();
  if (initial === 'research') {
    document.body.classList.remove('prelaunch');
    document.body.classList.add('site-launched');
    document.getElementById('stellar-intro')?.remove();
  }
  setRoute(initial, { push: false, hash: window.location.hash });

  // Knowledge-field parallax is deliberately subtle: these are distant stars.
  const field = document.getElementById('knowledge-field');
  const knowledgePoints = field ? [...field.querySelectorAll('[data-depth]')] : [];
  let px = 0, py = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', (event) => {
    tx = (event.clientX / innerWidth - .5) * 2;
    ty = (event.clientY / innerHeight - .5) * 2;
  }, { passive: true });
  const moveKnowledge = () => {
    px += (tx - px) * .045;
    py += (ty - py) * .045;
    knowledgePoints.forEach((node) => {
      const depth = Number(node.dataset.depth || .2);
      node.style.setProperty('--kpx', `${-px * 34 * depth}px`);
      node.style.setProperty('--kpy', `${-py * 23 * depth}px`);
    });
    requestAnimationFrame(moveKnowledge);
  };
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(moveKnowledge);

  // Pulse a route through the Spectrum architecture to make the research cycle feel live.
  const particleLayer = document.getElementById('architecture-particles');
  if (particleLayer) {
    const ns = 'http://www.w3.org/2000/svg';
    const points = [[136,106],[634,110],[651,493],[126,510]];
    points.forEach((point, index) => {
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('r', index === 0 ? '3.5' : '2.6');
      dot.setAttribute('fill', index === 0 ? '#FFFAEC' : '#94B1FF');
      dot.style.filter = 'drop-shadow(0 0 6px #94B1FF)';
      const animateX = document.createElementNS(ns, 'animate');
      animateX.setAttribute('attributeName','cx'); animateX.setAttribute('dur',`${4.8 + index*.55}s`); animateX.setAttribute('repeatCount','indefinite');
      animateX.setAttribute('values',`${point[0]};380;${points[(index+1)%points.length][0]}`);
      const animateY = document.createElementNS(ns, 'animate');
      animateY.setAttribute('attributeName','cy'); animateY.setAttribute('dur',`${4.8 + index*.55}s`); animateY.setAttribute('repeatCount','indefinite');
      animateY.setAttribute('values',`${point[1]};310;${points[(index+1)%points.length][1]}`);
      dot.append(animateX,animateY); particleLayer.appendChild(dot);
    });
  }
})();
