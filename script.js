(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  // ---------------------------------------------------------------------------
  // Header + navigation
  // ---------------------------------------------------------------------------
  const header = document.getElementById('site-header');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 34);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const setMenu = (open) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  };

  menuToggle?.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

  // ---------------------------------------------------------------------------
  // Scroll reveals
  // ---------------------------------------------------------------------------
  const revealTargets = document.querySelectorAll('.reveal, .system-map, .constellation-map');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible', 'in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -7% 0px' });
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible', 'in-view'));
  }

  document.getElementById('year').textContent = String(new Date().getFullYear());

  // ---------------------------------------------------------------------------
  // Global starfield environment
  // One persistent field sits behind the whole document. Opaque technical
  // sections simply cover it, so cosmic sections feel like one continuous space.
  // ---------------------------------------------------------------------------
  const spaceCanvas = document.getElementById('space-canvas');
  const spaceCtx = spaceCanvas?.getContext('2d');
  let stars = [];
  let spaceWidth = 0;
  let spaceHeight = 0;
  let dpr = 1;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let starTime = 0;

  const randomStar = () => ({
    x: Math.random(),
    y: Math.random(),
    depth: 0.18 + Math.random() * 0.82,
    radius: 0.35 + Math.random() * 1.25,
    alpha: 0.22 + Math.random() * 0.78,
    phase: Math.random() * Math.PI * 2,
    warmth: Math.random() < 0.045,
  });

  const resizeSpace = () => {
    if (!spaceCanvas || !spaceCtx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    spaceWidth = window.innerWidth;
    spaceHeight = window.innerHeight;
    spaceCanvas.width = Math.round(spaceWidth * dpr);
    spaceCanvas.height = Math.round(spaceHeight * dpr);
    spaceCanvas.style.width = `${spaceWidth}px`;
    spaceCanvas.style.height = `${spaceHeight}px`;
    spaceCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(clamp((spaceWidth * spaceHeight) / 5200, 135, 310));
    stars = Array.from({ length: count }, randomStar);
  };

  const drawSpace = (time = 0) => {
    if (!spaceCtx) return;
    const delta = Math.min(32, time - starTime || 16);
    starTime = time;
    pointer.x += (pointer.tx - pointer.x) * (reduceMotion ? 1 : 0.035 * delta / 16);
    pointer.y += (pointer.ty - pointer.y) * (reduceMotion ? 1 : 0.035 * delta / 16);

    spaceCtx.clearRect(0, 0, spaceWidth, spaceHeight);
    spaceCtx.fillStyle = '#000';
    spaceCtx.fillRect(0, 0, spaceWidth, spaceHeight);

    const scrollDrift = reduceMotion ? 0 : (window.scrollY * 0.012) % spaceHeight;
    stars.forEach((star) => {
      const depthShiftX = pointer.x * 24 * star.depth;
      const depthShiftY = pointer.y * 17 * star.depth;
      let x = star.x * spaceWidth + depthShiftX;
      let y = star.y * spaceHeight + depthShiftY + scrollDrift * star.depth;
      x = ((x % spaceWidth) + spaceWidth) % spaceWidth;
      y = ((y % spaceHeight) + spaceHeight) % spaceHeight;

      const twinkle = reduceMotion ? 1 : 0.82 + Math.sin(time * 0.0012 + star.phase) * 0.18;
      const alpha = star.alpha * twinkle;
      const radius = star.radius * (0.65 + star.depth * 0.65);
      const color = star.warmth ? `rgba(255,235,124,${alpha})` : `rgba(255,255,255,${alpha})`;

      if (radius > 1.15) {
        spaceCtx.shadowBlur = 7 * star.depth;
        spaceCtx.shadowColor = star.warmth ? 'rgba(255,201,1,.45)' : 'rgba(148,177,255,.55)';
      } else {
        spaceCtx.shadowBlur = 0;
      }
      spaceCtx.beginPath();
      spaceCtx.arc(x, y, radius, 0, Math.PI * 2);
      spaceCtx.fillStyle = color;
      spaceCtx.fill();
    });
    spaceCtx.shadowBlur = 0;

    if (!reduceMotion) requestAnimationFrame(drawSpace);
  };

  if (spaceCanvas && spaceCtx) {
    resizeSpace();
    window.addEventListener('resize', resizeSpace, { passive: true });
    window.addEventListener('pointermove', (event) => {
      pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    if (reduceMotion) drawSpace(0);
    else requestAnimationFrame(drawSpace);
  }

  // Hero mark gets a tiny extra parallax offset so it feels nested inside the field.
  const heroMark = document.getElementById('hero-mark-wrap');
  if (heroMark && !reduceMotion) {
    window.addEventListener('pointermove', (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 9;
      const y = (event.clientY / window.innerHeight - 0.5) * 7;
      heroMark.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, { passive: true });
  }

  // ---------------------------------------------------------------------------
  // Spectrum generative network visual
  // ---------------------------------------------------------------------------
  const spectrumCanvas = document.getElementById('spectrum-canvas');
  const spectrumCtx = spectrumCanvas?.getContext('2d');
  let spectrumNodes = [];
  let spectrumW = 0;
  let spectrumH = 0;
  let spectrumDpr = 1;
  let spectrumPointer = { x: 0, y: 0, active: false };

  const palette = ['#5267E8', '#94B1FF', '#FFFAEC', '#5A0A86'];

  const makeSpectrumNode = (index) => {
    const angle = Math.random() * Math.PI * 2;
    const ring = 0.12 + Math.pow(Math.random(), .7) * .42;
    return {
      x: .5 + Math.cos(angle) * ring,
      y: .5 + Math.sin(angle) * ring,
      vx: (Math.random() - .5) * .00022,
      vy: (Math.random() - .5) * .00022,
      r: 1.4 + Math.random() * 2.6,
      group: index % palette.length,
      phase: Math.random() * Math.PI * 2,
    };
  };

  const resizeSpectrum = () => {
    if (!spectrumCanvas || !spectrumCtx) return;
    const rect = spectrumCanvas.getBoundingClientRect();
    spectrumW = Math.max(1, rect.width);
    spectrumH = Math.max(1, rect.height);
    spectrumDpr = Math.min(window.devicePixelRatio || 1, 2);
    spectrumCanvas.width = Math.round(spectrumW * spectrumDpr);
    spectrumCanvas.height = Math.round(spectrumH * spectrumDpr);
    spectrumCtx.setTransform(spectrumDpr, 0, 0, spectrumDpr, 0, 0);
    if (!spectrumNodes.length) spectrumNodes = Array.from({ length: 58 }, (_, i) => makeSpectrumNode(i));
  };

  const drawSpectrum = (time = 0) => {
    if (!spectrumCtx) return;
    spectrumCtx.clearRect(0, 0, spectrumW, spectrumH);

    if (!reduceMotion) {
      spectrumNodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < .06 || node.x > .94) node.vx *= -1;
        if (node.y < .06 || node.y > .94) node.vy *= -1;
        if (spectrumPointer.active) {
          const px = spectrumPointer.x / spectrumW;
          const py = spectrumPointer.y / spectrumH;
          const dx = px - node.x;
          const dy = py - node.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < .06 && dist2 > .0001) {
            node.x -= dx * .0009;
            node.y -= dy * .0009;
          }
        }
      });
    }

    for (let i = 0; i < spectrumNodes.length; i++) {
      const a = spectrumNodes[i];
      for (let j = i + 1; j < spectrumNodes.length; j++) {
        const b = spectrumNodes[j];
        const dx = (a.x - b.x) * spectrumW;
        const dy = (a.y - b.y) * spectrumH;
        const distance = Math.hypot(dx, dy);
        const threshold = Math.min(spectrumW, spectrumH) * .17;
        if (distance > threshold) continue;
        const alpha = (1 - distance / threshold) * (a.group === b.group ? .22 : .09);
        spectrumCtx.beginPath();
        spectrumCtx.moveTo(a.x * spectrumW, a.y * spectrumH);
        spectrumCtx.lineTo(b.x * spectrumW, b.y * spectrumH);
        spectrumCtx.strokeStyle = `rgba(148,177,255,${alpha})`;
        spectrumCtx.lineWidth = .7;
        spectrumCtx.stroke();
      }
    }

    spectrumNodes.forEach((node) => {
      const pulse = reduceMotion ? 1 : .88 + Math.sin(time * .0018 + node.phase) * .12;
      spectrumCtx.beginPath();
      spectrumCtx.arc(node.x * spectrumW, node.y * spectrumH, node.r * pulse, 0, Math.PI * 2);
      spectrumCtx.fillStyle = palette[node.group];
      spectrumCtx.shadowBlur = node.r > 2.6 ? 14 : 6;
      spectrumCtx.shadowColor = palette[node.group];
      spectrumCtx.globalAlpha = node.group === 3 ? .68 : .9;
      spectrumCtx.fill();
      spectrumCtx.globalAlpha = 1;
    });
    spectrumCtx.shadowBlur = 0;

    if (!reduceMotion) requestAnimationFrame(drawSpectrum);
  };

  if (spectrumCanvas && spectrumCtx) {
    resizeSpectrum();
    window.addEventListener('resize', resizeSpectrum, { passive: true });
    spectrumCanvas.addEventListener('pointermove', (event) => {
      const rect = spectrumCanvas.getBoundingClientRect();
      spectrumPointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
    }, { passive: true });
    spectrumCanvas.addEventListener('pointerleave', () => { spectrumPointer.active = false; });
    if (reduceMotion) drawSpectrum(0);
    else requestAnimationFrame(drawSpectrum);
  }

  // ---------------------------------------------------------------------------
  // Constellation topology
  // ---------------------------------------------------------------------------
  const constellationMap = document.getElementById('constellation-map');
  const constellationSvg = document.getElementById('constellation-lines');
  if (constellationMap && constellationSvg) {
    const core = { x: 50, y: 48 };
    const nodes = [...constellationMap.querySelectorAll('.constellation-node')];
    const links = nodes.map((node, index) => ({
      from: core,
      to: { x: Number(node.dataset.x), y: Number(node.dataset.y) },
      node,
      delay: index * .12,
    }));

    // A few secondary relationships make the system feel like a network instead
    // of a hub-and-spoke diagram.
    const secondary = [
      [0, 3], [0, 5], [1, 2], [2, 4], [3, 4], [1, 5]
    ].map(([a, b], index) => ({
      from: { x: Number(nodes[a].dataset.x), y: Number(nodes[a].dataset.y) },
      to: { x: Number(nodes[b].dataset.x), y: Number(nodes[b].dataset.y) },
      delay: .5 + index * .09,
      secondary: true,
    }));

    [...links, ...secondary].forEach((link) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(link.from.x * 10));
      line.setAttribute('y1', String(link.from.y * 6.8));
      line.setAttribute('x2', String(link.to.x * 10));
      line.setAttribute('y2', String(link.to.y * 6.8));
      line.style.setProperty('--delay', `${link.delay}s`);
      if (link.secondary) line.style.opacity = '.42';
      if (link.node) {
        line.dataset.nodeIndex = String(nodes.indexOf(link.node));
        link.node.style.setProperty('--node-delay', String(nodes.indexOf(link.node)));
        link.node.addEventListener('mouseenter', () => line.classList.add('active'));
        link.node.addEventListener('mouseleave', () => line.classList.remove('active'));
        link.node.addEventListener('focus', () => line.classList.add('active'));
        link.node.addEventListener('blur', () => line.classList.remove('active'));
      }
      constellationSvg.appendChild(line);
    });
  }

  // ---------------------------------------------------------------------------
  // Background score
  // Browsers generally block audible autoplay. We try once; if blocked, the score
  // begins on the visitor's first interaction unless they explicitly pause it.
  // ---------------------------------------------------------------------------
  const audio = document.getElementById('site-score');
  const soundControl = document.getElementById('sound-control');
  const soundLabel = soundControl?.querySelector('.sound-label');
  let userPaused = false;
  let volumeFrame = null;

  const setSoundUI = (playing, needsGesture = false) => {
    if (!soundControl) return;
    soundControl.classList.toggle('playing', playing);
    soundControl.setAttribute('aria-pressed', String(playing));
    soundControl.setAttribute('aria-label', playing ? 'Pause SVPRNOVA score' : 'Play SVPRNOVA score');
    if (soundLabel) soundLabel.textContent = playing ? 'SCORE ON' : (needsGesture ? 'PLAY SCORE' : 'SCORE OFF');
  };

  const fadeVolume = (target, duration = 900) => {
    if (!audio) return;
    if (volumeFrame) cancelAnimationFrame(volumeFrame);
    const start = audio.volume;
    const began = performance.now();
    const tick = (now) => {
      const progress = clamp((now - began) / duration, 0, 1);
      audio.volume = start + (target - start) * progress;
      if (progress < 1) volumeFrame = requestAnimationFrame(tick);
    };
    volumeFrame = requestAnimationFrame(tick);
  };

  const playScore = async () => {
    if (!audio) return false;
    try {
      audio.volume = 0;
      await audio.play();
      fadeVolume(.22, 1500);
      setSoundUI(true);
      return true;
    } catch (_) {
      setSoundUI(false, true);
      return false;
    }
  };

  const pauseScore = () => {
    if (!audio) return;
    userPaused = true;
    fadeVolume(0, 280);
    window.setTimeout(() => audio.pause(), 300);
    setSoundUI(false);
  };

  soundControl?.addEventListener('click', async () => {
    if (!audio) return;
    if (audio.paused) {
      userPaused = false;
      await playScore();
    } else {
      pauseScore();
    }
  });

  const firstGesture = async (event) => {
    if (event.target.closest?.('#sound-control')) return;
    if (audio?.paused && !userPaused) await playScore();
    document.removeEventListener('pointerdown', firstGesture);
    document.removeEventListener('keydown', firstGesture);
  };
  document.addEventListener('pointerdown', firstGesture, { passive: true });
  document.addEventListener('keydown', firstGesture);

  window.addEventListener('load', async () => {
    if (!audio) return;
    const played = await playScore();
    if (!played) setSoundUI(false, true);
  });
})();
