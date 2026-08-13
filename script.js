(() => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

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
  const intro = document.getElementById('stellar-intro');
  const introStar = document.getElementById('intro-star');
  const heroMark = document.getElementById('hero-mark-wrap');
  const heroTitle = document.getElementById('hero-title-lockup');
  const heroContent = document.getElementById('hero-content');
  let constellationMotion = null;

  const randomStar = () => ({
    x: Math.random(),
    y: Math.random(),
    depth: 0.12 + Math.random() * 0.88,
    radius: 0.18 + Math.random() * 0.72,
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
    const count = Math.round(clamp((spaceWidth * spaceHeight) / 4300, 165, 390));
    stars = Array.from({ length: count }, randomStar);
  };

  const drawSpace = (time = 0) => {
    if (!spaceCtx) return;
    const delta = Math.min(32, time - starTime || 16);
    starTime = time;
    pointer.x += (pointer.tx - pointer.x) * (reduceMotion ? 1 : 0.052 * delta / 16);
    pointer.y += (pointer.ty - pointer.y) * (reduceMotion ? 1 : 0.052 * delta / 16);

    spaceCtx.clearRect(0, 0, spaceWidth, spaceHeight);
    spaceCtx.fillStyle = '#000';
    spaceCtx.fillRect(0, 0, spaceWidth, spaceHeight);

    const scrollDrift = reduceMotion ? 0 : (window.scrollY * 0.012) % spaceHeight;
    stars.forEach((star) => {
      // Reverse parallax: the stellar field drifts opposite the pointer,
      // reinforcing the feeling of looking into a deep scene rather than dragging it.
      const depthShiftX = -pointer.x * 76 * star.depth;
      const depthShiftY = -pointer.y * 54 * star.depth;
      let x = star.x * spaceWidth + depthShiftX;
      let y = star.y * spaceHeight + depthShiftY + scrollDrift * star.depth;
      x = ((x % spaceWidth) + spaceWidth) % spaceWidth;
      y = ((y % spaceHeight) + spaceHeight) % spaceHeight;

      const twinkle = reduceMotion ? 1 : 0.82 + Math.sin(time * 0.0012 + star.phase) * 0.18;
      const alpha = star.alpha * twinkle;
      const radius = star.radius * (0.58 + star.depth * 0.62);
      const color = star.warmth ? `rgba(255,235,124,${alpha})` : `rgba(255,255,255,${alpha})`;

      if (radius > 0.72) {
        spaceCtx.shadowBlur = 5 * star.depth;
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

    if (!reduceMotion) {
      // The intro star is deliberately distant: it participates in the field,
      // but moves much less than the foreground layers.
      if (introStar && !intro?.classList.contains('is-igniting')) {
        introStar.style.setProperty('--intro-px', `${-pointer.x * 13}px`);
        introStar.style.setProperty('--intro-py', `${-pointer.y * 9}px`);
      }

      // The resolved hero sits closer to the viewer than the starfield itself.
      if (document.body.classList.contains('site-launched')) {
        if (heroMark) {
          heroMark.style.setProperty('--parallax-x', `${-pointer.x * 66}px`);
          heroMark.style.setProperty('--parallax-y', `${-pointer.y * 46}px`);
        }
        if (heroTitle) {
          heroTitle.style.setProperty('--parallax-x', `${-pointer.x * 48}px`);
          heroTitle.style.setProperty('--parallax-y', `${-pointer.y * 34}px`);
        }
        if (heroContent) {
          heroContent.style.setProperty('--parallax-x', `${-pointer.x * 48}px`);
          heroContent.style.setProperty('--parallax-y', `${-pointer.y * 34}px`);
        }
      }

      // Constellation points live deeper in space. Each gets a distinct small
      // displacement; connection endpoints follow the points precisely.
      if (constellationMotion) constellationMotion(pointer.x, pointer.y);
    }

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

  // Pointer movement also modulates the resolved stellar flare.
  if (heroMark && !reduceMotion) {
    let flareTimer = null;
    window.addEventListener('pointermove', () => {
      if (!document.body.classList.contains('site-launched')) return;
      heroMark.classList.add('pointer-active');
      window.clearTimeout(flareTimer);
      flareTimer = window.setTimeout(() => heroMark.classList.remove('pointer-active'), 95);
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
  // Constellation topology + distant depth parallax
  // All stellar anchors share the global cosmic motion. Lines are recalculated
  // from the rendered CENTER of each visible star so they never detach while
  // parallax is moving the field.
  // ---------------------------------------------------------------------------
  const constellationMap = document.getElementById('constellation-map');
  const constellationSvg = document.getElementById('constellation-lines');
  if (constellationMap && constellationSvg) {
    const coreEl = constellationMap.querySelector('.constellation-core');
    const nodes = [...constellationMap.querySelectorAll('.constellation-node')];
    const points = [coreEl, ...nodes].filter(Boolean);
    const pointData = new Map(points.map((el) => [el, {
      depth: Number(el.dataset.depth || .18),
      ox: 0,
      oy: 0,
    }]));

    const links = nodes.map((node, index) => ({
      fromEl: coreEl,
      toEl: node,
      delay: index * .12,
      node,
    }));

    const secondaryPairs = [[0,3],[0,5],[1,2],[2,4],[3,4],[1,5]];
    secondaryPairs.forEach(([a,b], index) => links.push({
      fromEl: nodes[a],
      toEl: nodes[b],
      delay: .5 + index * .09,
      secondary: true,
    }));

    links.forEach((link) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.style.setProperty('--delay', `${link.delay}s`);
      if (link.secondary) line.style.opacity = '.42';
      if (link.node) {
        const nodeIndex = nodes.indexOf(link.node);
        line.dataset.nodeIndex = String(nodeIndex);
        link.node.style.setProperty('--node-delay', String(nodeIndex));
        link.node.addEventListener('mouseenter', () => line.classList.add('active'));
        link.node.addEventListener('mouseleave', () => line.classList.remove('active'));
        link.node.addEventListener('focus', () => line.classList.add('active'));
        link.node.addEventListener('blur', () => line.classList.remove('active'));
      }
      link.line = line;
      constellationSvg.appendChild(line);
    });

    const stellarCenter = (el, mapRect) => {
      // Concept/chapter stars use their <i> as the luminous anchor. The core uses
      // the logo itself, whose center is the actual core-star center.
      const anchor = el.classList.contains('constellation-core')
        ? el.querySelector('img') || el
        : el.querySelector('i') || el;
      const rect = anchor.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - mapRect.left,
        y: rect.top + rect.height / 2 - mapRect.top,
      };
    };

    const updateConstellationLines = () => {
      const mapRect = constellationMap.getBoundingClientRect();
      if (!mapRect.width || !mapRect.height) return;
      const viewBox = constellationSvg.viewBox.baseVal;
      const sx = viewBox.width / mapRect.width;
      const sy = viewBox.height / mapRect.height;

      links.forEach((link) => {
        const a = stellarCenter(link.fromEl, mapRect);
        const b = stellarCenter(link.toEl, mapRect);
        link.line.setAttribute('x1', String(a.x * sx));
        link.line.setAttribute('y1', String(a.y * sy));
        link.line.setAttribute('x2', String(b.x * sx));
        link.line.setAttribute('y2', String(b.y * sy));
      });
    };

    constellationMotion = (px, py) => {
      pointData.forEach((data, el) => {
        // The constellation is embedded far behind the foreground. Each point
        // has its own depth, but all travel opposite the pointer with the stars.
        data.ox = -px * 34 * data.depth;
        data.oy = -py * 24 * data.depth;
        el.style.setProperty('--node-px', `${data.ox}px`);
        el.style.setProperty('--node-py', `${data.oy}px`);
      });

      // Measure after transforms are applied. rAF guarantees layout has the new
      // node positions before the line endpoints are read.
      requestAnimationFrame(updateConstellationLines);
    };

    constellationMotion(0, 0);
    window.addEventListener('resize', () => {
      constellationMotion?.(pointer.x, pointer.y);
      requestAnimationFrame(updateConstellationLines);
    }, { passive: true });
    window.addEventListener('scroll', updateConstellationLines, { passive: true });
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

  // ---------------------------------------------------------------------------
  // Ignition: click the distant star, synthesize a deep-space impact, resolve
  // the star into the hero mark, and start the supplied SVPRNOVA score.
  // ---------------------------------------------------------------------------
  const deepSpaceBoom = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -15;
    compressor.knee.value = 18;
    compressor.ratio.value = 10;
    compressor.attack.value = .002;
    compressor.release.value = .5;
    master.gain.setValueAtTime(.0001, now);
    master.gain.exponentialRampToValueAtTime(.92, now + .012);
    master.gain.exponentialRampToValueAtTime(.0001, now + 2.45);
    master.connect(compressor);
    compressor.connect(ctx.destination);

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(74, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 1.65);
    subGain.gain.setValueAtTime(.95, now);
    subGain.gain.exponentialRampToValueAtTime(.0001, now + 2.1);
    sub.connect(subGain);
    subGain.connect(master);
    sub.start(now);
    sub.stop(now + 2.2);

    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(132, now);
    body.frequency.exponentialRampToValueAtTime(38, now + .85);
    bodyGain.gain.setValueAtTime(.38, now);
    bodyGain.gain.exponentialRampToValueAtTime(.0001, now + 1.25);
    body.connect(bodyGain);
    bodyGain.connect(master);
    body.start(now);
    body.stop(now + 1.35);

    const length = Math.floor(ctx.sampleRate * 1.15);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 5);
    }
    const noise = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(720, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(90, now + .8);
    noiseGain.gain.setValueAtTime(.34, now);
    noiseGain.gain.exponentialRampToValueAtTime(.0001, now + 1.05);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(now);
    noise.stop(now + 1.1);

    window.setTimeout(() => ctx.close().catch(() => {}), 2800);
  };

  let launched = false;
  const launchSite = async () => {
    if (launched || !introStar || !intro) return;
    launched = true;

    const target = heroMark?.getBoundingClientRect();
    const source = introStar.getBoundingClientRect();
    if (target) {
      const tx = target.left + target.width / 2 - window.innerWidth / 2;
      const ty = target.top + target.height / 2 - window.innerHeight / 2;
      const scale = clamp(target.width / Math.max(1, source.width), .8, 1.8);
      introStar.style.setProperty('--launch-x', `${tx}px`);
      introStar.style.setProperty('--launch-y', `${ty}px`);
      introStar.style.setProperty('--launch-scale', String(scale));
    }

    deepSpaceBoom();
    userPaused = false;
    await playScore();
    intro.classList.add('is-igniting');

    window.setTimeout(() => {
      document.body.classList.remove('prelaunch');
      document.body.classList.add('site-launched');
      intro.classList.add('is-complete');
    }, reduceMotion ? 80 : 1120);

    window.setTimeout(() => intro.remove(), reduceMotion ? 180 : 2050);
  };

  introStar?.addEventListener('click', launchSite);

  // If audio is manually toggled later, the control still behaves normally.
  // We intentionally do not attempt audible autoplay before the ignition click.
  setSoundUI(false);
})();
