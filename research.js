
(() => {
  const homeView = document.getElementById('home-view');
  const researchView = document.getElementById('research-view');
  const chaptersView = document.getElementById('chapters-view');
  const aboutView = document.getElementById('about-view');
  const joinView = document.getElementById('join-view');
  const header = document.getElementById('site-header');
  const navResearch = header?.querySelector('a[href="/research"]');
  const navChapters = header?.querySelector('a[href="/chapters"]');
  const navAbout = header?.querySelector('a[href="/about"]');
  const navJoin = header?.querySelector('a[href="/join"]');
  const routeViews = { home: homeView, research: researchView, chapters: chaptersView, about: aboutView, join: joinView };

  const pathRoute = () => {
    if (/\/join(?:\/|$)/.test(window.location.pathname)) return 'join';
    if (/\/about(?:\/|$)/.test(window.location.pathname)) return 'about';
    if (/\/chapters(?:\/|$)/.test(window.location.pathname)) return 'chapters';
    if (/\/research(?:\/|$)/.test(window.location.pathname)) return 'research';
    return 'home';
  };

  const setRoute = (route, { push = false, hash = '' } = {}) => {
    Object.entries(routeViews).forEach(([name, el]) => {
      if (!el) return;
      const active = name === route;
      el.hidden = !active;
      el.setAttribute('aria-hidden', String(!active));
    });
    document.body.classList.toggle('route-research', route === 'research');
    document.body.classList.toggle('route-chapters', route === 'chapters');
    document.body.classList.toggle('route-about', route === 'about');
    document.body.classList.toggle('route-join', route === 'join');
    navResearch?.classList.toggle('route-active', route === 'research');
    navChapters?.classList.toggle('route-active', route === 'chapters');
    navAbout?.classList.toggle('route-active', route === 'about');
    navJoin?.classList.toggle('route-active', route === 'join');
    if (push && window.location.protocol !== 'file:') {
      const path = route === 'research' ? '/research' : route === 'chapters' ? '/chapters' : route === 'about' ? '/about' : route === 'join' ? '/join' : '/';
      history.pushState({ route }, '', `${path}${hash || ''}`);
    }
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

    if (researchView && /\/research\/?$/.test(url.pathname)) {
      event.preventDefault();
      setRoute('research', { push: true, hash: url.hash });
      return;
    }
    if (chaptersView && /\/chapters\/?$/.test(url.pathname)) {
      event.preventDefault();
      setRoute('chapters', { push: true, hash: url.hash });
      return;
    }
    if (aboutView && /\/about\/?$/.test(url.pathname)) {
      event.preventDefault();
      setRoute('about', { push: true, hash: url.hash });
      return;
    }
    if (joinView && /\/join\/?$/.test(url.pathname)) {
      event.preventDefault();
      setRoute('join', { push: true, hash: url.hash });
      return;
    }
    if (homeView && (url.pathname === '/' || url.pathname.endsWith('/index.html')) && link.dataset.routeLink === 'home') {
      event.preventDefault();
      setRoute('home', { push: true, hash: url.hash });
      return;
    }
  });

  window.addEventListener('popstate', () => setRoute(pathRoute(), { push: false, hash: window.location.hash }));

  // Direct internal-route loads skip the homepage ignition but keep the same shell.
  const initial = pathRoute();
  if (initial !== 'home') {
    document.body.classList.remove('prelaunch');
    document.body.classList.add('site-launched');
    document.getElementById('stellar-intro')?.remove();
  }
  setRoute(initial, { push: false, hash: window.location.hash });

  // Mount the same stateful Spectrum prism visualization used on the homepage.
  window.SVPRSpectrum?.mount(document.getElementById('spectrum-canvas-research'));

  // Research cosmic parallax: the same reverse-direction movement language as
  // the homepage. The question constellation moves as one connected distant layer
  // so its SVG lines remain attached to its stars.
  const field = document.getElementById('knowledge-field');
  const modelDepthNodes = [...document.querySelectorAll('[data-model-depth]')];
  const outcomeField = document.getElementById('outcome-field');
  const outcomeNodes = outcomeField ? [...outcomeField.querySelectorAll('[data-orbit-speed]')] : [];
  let px = 0, py = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', (event) => {
    tx = (event.clientX / innerWidth - .5) * 2;
    ty = (event.clientY / innerHeight - .5) * 2;
  }, { passive: true });

  const moveResearchCosmos = (time = 0) => {
    px += (tx - px) * .052;
    py += (ty - py) * .052;

    if (field) {
      field.style.setProperty('--field-px', `${-px * 42}px`);
      field.style.setProperty('--field-py', `${-py * 30}px`);
    }

    modelDepthNodes.forEach((node) => {
      const depth = Number(node.dataset.modelDepth || .2);
      node.style.setProperty('--model-px', `${-px * 52 * depth}px`);
      node.style.setProperty('--model-py', `${-py * 36 * depth}px`);
    });

    if (outcomeField && outcomeNodes.length && !outcomeField.hidden) {
      const rect = outcomeField.getBoundingClientRect();
      const usableX = Math.max(80, rect.width * .5 - 95);
      const usableY = Math.max(70, rect.height * .5 - 55);
      outcomeNodes.forEach((node) => {
        const radiusX = usableX * Number(node.dataset.orbitRadius || .3) * 1.3;
        const radiusY = usableY * Number(node.dataset.orbitY || .24) * 1.3;
        const speed = Number(node.dataset.orbitSpeed || .00006) * 3.5;
        const angle = Number(node.dataset.orbitAngle || 0) + time * speed;
        const tilt = Number(node.dataset.orbitTilt || 0);
        const ex = Math.cos(angle) * radiusX;
        const ey = Math.sin(angle) * radiusY;
        const x = ex * Math.cos(tilt) - ey * Math.sin(tilt);
        const y = ex * Math.sin(tilt) + ey * Math.cos(tilt);
        node.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      });
    }
    requestAnimationFrame(moveResearchCosmos);
  };
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(moveResearchCosmos);
  else if (field) {
    field.style.setProperty('--field-px','0px'); field.style.setProperty('--field-py','0px');
  }

  // Discipline knowledge fragments fan into a 216-degree outward-facing arc.
  // The arc is centered on the radial line from the section center through each
  // discipline card, so the fragments bloom away from the central narrative.
  const disciplineNodes = [...document.querySelectorAll('.discipline-node')];
  const positionDisciplineFragments = () => {
    const ARC_SPAN = 216 * Math.PI / 180;
    disciplineNodes.forEach((node) => {
      const styles = getComputedStyle(node);
      const ox = parseFloat(styles.getPropertyValue('--orbit-x')) || 0;
      const oy = parseFloat(styles.getPropertyValue('--orbit-y')) || -1;
      const outwardAngle = Math.atan2(oy, ox);

      const icons = [...node.querySelectorAll('.discipline-icon')];
      const topics = [...node.querySelectorAll('.discipline-topic')];
      const fragments = [];
      const count = Math.max(icons.length, topics.length);
      for (let i = 0; i < count; i++) {
        if (topics[i]) fragments.push({ el: topics[i], type: 'topic' });
        if (icons[i]) fragments.push({ el: icons[i], type: 'icon' });
      }

      const last = Math.max(1, fragments.length - 1);
      fragments.forEach((fragment, index) => {
        const fraction = index / last;
        const angle = outwardAngle - ARC_SPAN / 2 + ARC_SPAN * fraction;
        // Larger radius than V2.5 for cleaner separation, with a slight
        // alternating offset so labels and icons do not stack on one curve.
        const radius = (fragment.type === 'icon' ? 255 : 235) + (index % 2 ? 10 : -4);
        const outwardBias = 26;
        const x = Math.cos(angle) * radius + Math.cos(outwardAngle) * outwardBias;
        const y = Math.sin(angle) * radius + Math.sin(outwardAngle) * outwardBias;
        fragment.el.style.setProperty('--pop-x', `${x.toFixed(1)}px`);
        fragment.el.style.setProperty('--pop-y', `${y.toFixed(1)}px`);
        if (fragment.type === 'icon') fragment.el.style.setProperty('--pop-scale', '1');
      });
    });
  };
  positionDisciplineFragments();
  window.addEventListener('resize', positionDisciplineFragments, { passive: true });

  const disciplineOrbit = document.getElementById('discipline-orbit');
  const disciplineLines = disciplineOrbit?.querySelector('.discipline-lines');
  const disciplineCenter = disciplineOrbit?.querySelector('.discipline-center-copy');
  const updateDisciplineLines = () => {
    if (!disciplineOrbit || !disciplineLines || !disciplineCenter || innerWidth <= 1080) return;
    const orbitRect = disciplineOrbit.getBoundingClientRect();
    const centerRect = disciplineCenter.getBoundingClientRect();
    const viewBox = disciplineLines.viewBox.baseVal;
    const sx = viewBox.width / orbitRect.width;
    const sy = viewBox.height / orbitRect.height;
    const cx = (centerRect.left + centerRect.width / 2 - orbitRect.left) * sx;
    const cy = (centerRect.top + centerRect.height / 2 - orbitRect.top) * sy;
    const lines = [...disciplineLines.querySelectorAll('line')];
    disciplineNodes.forEach((node, index) => {
      const line = lines[index];
      if (!line) return;
      const rect = node.getBoundingClientRect();
      const nx = (rect.left + rect.width / 2 - orbitRect.left) * sx;
      const ny = (rect.top + rect.height / 2 - orbitRect.top) * sy;
      line.setAttribute('x1', String(cx));
      line.setAttribute('y1', String(cy));
      line.setAttribute('x2', String(nx));
      line.setAttribute('y2', String(ny));
    });
  };
  requestAnimationFrame(updateDisciplineLines);
  window.addEventListener('resize', () => requestAnimationFrame(updateDisciplineLines), { passive: true });
  disciplineNodes.forEach((node) => {
    node.addEventListener('mouseenter', () => requestAnimationFrame(updateDisciplineLines));
    node.addEventListener('mouseleave', () => requestAnimationFrame(updateDisciplineLines));
    node.addEventListener('focus', () => requestAnimationFrame(updateDisciplineLines));
    node.addEventListener('blur', () => requestAnimationFrame(updateDisciplineLines));
  });

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
