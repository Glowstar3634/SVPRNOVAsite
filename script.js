(() => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileWebKit = Boolean(window.SVPR_RUNTIME?.mobileWebKit);
  const runtimeRoute = /\/join(?:\/|$)/.test(location.pathname) ? 'join'
    : /\/about(?:\/|$)/.test(location.pathname) ? 'about'
    : /\/chapters(?:\/|$)/.test(location.pathname) ? 'chapters'
    : /\/research(?:\/|$)/.test(location.pathname) ? 'research' : 'home';
  const runtimeRouteRoot = mobileWebKit ? document.getElementById(`${runtimeRoute}-view`) : document;
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
  const revealTargets = runtimeRouteRoot?.querySelectorAll('.reveal, .system-map, .constellation-map') || [];
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

  // iOS/iPadOS WebKit gets a stricter lifecycle for decorative CSS motion.
  // Pausing animations outside the viewport prevents Safari from retaining many
  // compositor surfaces for effects the visitor cannot currently see.
  if (mobileWebKit) {
    const liveSections = runtimeRouteRoot ? [...runtimeRouteRoot.querySelectorAll('section')] : [];
    if ('IntersectionObserver' in window) {
      const liveObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle('svpr-live', entry.isIntersecting));
      }, { rootMargin: '220px 0px', threshold: 0 });
      liveSections.forEach((section) => liveObserver.observe(section));
    } else {
      liveSections.forEach((section) => section.classList.add('svpr-live'));
    }
  }

  document.getElementById('year').textContent = String(new Date().getFullYear());

  // ---------------------------------------------------------------------------
  // Global starfield environment
  // One persistent field sits behind the whole document. Opaque technical
  // sections simply cover it, so cosmic sections feel like one continuous space.
  // ---------------------------------------------------------------------------
  const spaceCanvas = document.getElementById('space-canvas');
  const spaceCtx = spaceCanvas?.getContext('2d', { alpha: false });
  const homeRouteView = document.getElementById('home-view');
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const constrainedDevice = mobileWebKit || coarsePointer
    || window.matchMedia('(max-width: 760px)').matches
    || (Number(navigator.deviceMemory || 8) <= 4);
  const maxCanvasDpr = mobileWebKit ? 1 : (constrainedDevice ? 1.5 : 2);
  const starFrameInterval = mobileWebKit ? (1000 / 30) : (constrainedDevice ? (1000 / 45) : 0);
  let stars = [];
  let spaceWidth = 0;
  let spaceHeight = 0;
  let dpr = 1;
  let spaceFrame = 0;
  let resizeTimer = 0;
  let mobileSurfaceWidth = 0;
  let mobileSurfaceHeight = 0;
  let lastStarFrame = -Infinity;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let starTime = 0;
  const intro = document.getElementById('stellar-intro');
  const introStar = document.getElementById('intro-star');
  const heroMark = document.getElementById('hero-mark-wrap');
  const heroTitle = document.getElementById('hero-title-lockup');
  const heroContent = document.getElementById('hero-content');
  let constellationMotion = null;
  let constellationActive = false;

  const randomStar = () => {
    const warmth = Math.random() < 0.045;
    return {
      x: Math.random(),
      y: Math.random(),
      depth: 0.12 + Math.random() * 0.88,
      radius: 0.18 + Math.random() * 0.72,
      alpha: 0.22 + Math.random() * 0.78,
      phase: Math.random() * Math.PI * 2,
      warmth,
      fill: warmth ? '#ffeb7c' : '#fff',
      shadow: warmth ? 'rgba(255,201,1,.45)' : 'rgba(148,177,255,.55)',
    };
  };

  // Safari's 2D shadowBlur path is much more expensive than drawing a cached
  // glow sprite. These tiny prerendered stars preserve the same soft halo while
  // eliminating hundreds of blur operations per second on iOS.
  const makeStarGlow = (warm = false) => {
    if (!mobileWebKit) return null;
    const sprite = document.createElement('canvas');
    sprite.width = 32;
    sprite.height = 32;
    const ctx = sprite.getContext('2d');
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, warm ? 'rgba(255,250,224,1)' : 'rgba(255,255,255,1)');
    gradient.addColorStop(.12, warm ? 'rgba(255,201,1,.76)' : 'rgba(210,225,255,.82)');
    gradient.addColorStop(.38, warm ? 'rgba(255,201,1,.25)' : 'rgba(148,177,255,.3)');
    gradient.addColorStop(1, 'rgba(82,103,232,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return sprite;
  };
  const coolStarGlow = makeStarGlow(false);
  const warmStarGlow = makeStarGlow(true);

  const resetMobileSurface = () => {
    if (!mobileWebKit) return;
    mobileSurfaceWidth = Math.max(1, window.innerWidth);
    const screenHeight = Number(window.screen?.height || 0);
    // Use one stable surface tall enough for both Safari chrome states. Keeping
    // it fixed avoids allocating a fresh GPU buffer every time the URL bar moves.
    mobileSurfaceHeight = Math.max(
      1,
      window.innerHeight,
      screenHeight > 0 ? Math.min(screenHeight, window.innerHeight * 1.4) : 0
    );
  };

  const resizeSpace = (forceSurfaceReset = false) => {
    if (!spaceCanvas || !spaceCtx) return;
    if (mobileWebKit && (forceSurfaceReset || !mobileSurfaceWidth || Math.abs(window.innerWidth - mobileSurfaceWidth) > 64)) {
      resetMobileSurface();
    }
    const nextWidth = mobileWebKit ? mobileSurfaceWidth : Math.max(1, window.innerWidth);
    const nextHeight = mobileWebKit ? mobileSurfaceHeight : Math.max(1, window.innerHeight);
    const nextDpr = Math.min(window.devicePixelRatio || 1, maxCanvasDpr);
    const pixelWidth = Math.max(1, Math.round(nextWidth * nextDpr));
    const pixelHeight = Math.max(1, Math.round(nextHeight * nextDpr));

    if (spaceCanvas.width !== pixelWidth || spaceCanvas.height !== pixelHeight) {
      spaceCanvas.width = pixelWidth;
      spaceCanvas.height = pixelHeight;
    }
    dpr = nextDpr;
    spaceWidth = nextWidth;
    spaceHeight = nextHeight;
    spaceCanvas.style.width = `${spaceWidth}px`;
    spaceCanvas.style.height = `${spaceHeight}px`;
    spaceCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(clamp((spaceWidth * spaceHeight) / 4300, 165, mobileWebKit ? 310 : 390));
    stars = Array.from({ length: count }, randomStar);
  };

  const scheduleResizeSpace = () => {
    // Safari fires resize repeatedly while its address bar collapses/expands. A
    // pure height change should not rebuild the canvas backing store.
    if (mobileWebKit && mobileSurfaceWidth && Math.abs(window.innerWidth - mobileSurfaceWidth) <= 64) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeSpace(mobileWebKit);
      if (reduceMotion) drawSpace(performance.now());
    }, constrainedDevice ? 160 : 60);
  };

  const requestSpaceFrame = () => {
    if (reduceMotion || document.hidden || spaceFrame) return;
    spaceFrame = requestAnimationFrame(drawSpace);
  };

  const drawSpace = (time = 0) => {
    spaceFrame = 0;
    if (!spaceCtx || document.hidden) return;
    if (starFrameInterval && time - lastStarFrame < starFrameInterval) {
      requestSpaceFrame();
      return;
    }
    lastStarFrame = time;

    const delta = Math.min(32, time - starTime || 16);
    starTime = time;
    pointer.x += (pointer.tx - pointer.x) * (reduceMotion ? 1 : 0.052 * delta / 16);
    pointer.y += (pointer.ty - pointer.y) * (reduceMotion ? 1 : 0.052 * delta / 16);

    spaceCtx.globalAlpha = 1;
    spaceCtx.shadowBlur = 0;
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
      const radius = star.radius * (0.58 + star.depth * 0.62);
      spaceCtx.globalAlpha = star.alpha * twinkle;
      if (mobileWebKit) {
        const glow = star.warmth ? warmStarGlow : coolStarGlow;
        if (glow && radius > .58) {
          const size = 5.5 + star.depth * 7;
          spaceCtx.drawImage(glow, x - size / 2, y - size / 2, size, size);
        } else {
          const size = Math.max(.55, radius * 1.45);
          spaceCtx.fillStyle = star.fill;
          spaceCtx.fillRect(x - size / 2, y - size / 2, size, size);
        }
      } else {
        if (radius > 0.72) {
          spaceCtx.shadowBlur = 5 * star.depth;
          spaceCtx.shadowColor = star.shadow;
        } else {
          spaceCtx.shadowBlur = 0;
        }
        spaceCtx.beginPath();
        spaceCtx.arc(x, y, radius, 0, Math.PI * 2);
        spaceCtx.fillStyle = star.fill;
        spaceCtx.fill();
      }
    });
    spaceCtx.globalAlpha = 1;
    spaceCtx.shadowBlur = 0;

    if (!reduceMotion) {
      // The intro star is deliberately distant: it participates in the field,
      // but moves much less than the foreground layers.
      if (introStar && !intro?.classList.contains('is-igniting')) {
        introStar.style.setProperty('--intro-px', `${-pointer.x * 13}px`);
        introStar.style.setProperty('--intro-py', `${-pointer.y * 9}px`);
      }

      // Only the active homepage needs its foreground parallax updated. The same
      // DOM exists inside every static route fallback, but hidden routes should
      // not consume layout/compositing work.
      if (document.body.classList.contains('site-launched') && homeRouteView && !homeRouteView.hidden) {
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

      // The constellation's live DOM/SVG geometry is only updated while that
      // section is near the viewport. Its appearance is unchanged when visible.
      if (constellationMotion && constellationActive && homeRouteView && !homeRouteView.hidden) {
        constellationMotion(pointer.x, pointer.y);
      }
    }

    requestSpaceFrame();
  };

  if (spaceCanvas && spaceCtx) {
    resizeSpace();
    window.addEventListener('resize', scheduleResizeSpace, { passive: true });
    window.addEventListener('pointermove', (event) => {
      pointer.tx = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointer.ty = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (spaceFrame) cancelAnimationFrame(spaceFrame);
        spaceFrame = 0;
      } else if (reduceMotion) {
        drawSpace(performance.now());
      } else {
        starTime = performance.now();
        requestSpaceFrame();
      }
    });
    if (reduceMotion) drawSpace(0);
    else requestSpaceFrame();
  }

  // Pointer movement also modulates the resolved stellar flare.
  if (heroMark && !reduceMotion) {
    let flareTimer = null;
    window.addEventListener('pointermove', () => {
      if (!document.body.classList.contains('site-launched') || homeRouteView?.hidden) return;
      heroMark.classList.add('pointer-active');
      window.clearTimeout(flareTimer);
      flareTimer = window.setTimeout(() => heroMark.classList.remove('pointer-active'), 95);
    }, { passive: true });
  }


// ---------------------------------------------------------------------------
// Spectrum generative network visual (shared with /research)
// ---------------------------------------------------------------------------
const spectrumCanvas = document.getElementById('spectrum-canvas');
if (!mobileWebKit || runtimeRoute === 'home') window.SVPRSpectrum?.mount(spectrumCanvas);

// ---------------------------------------------------------------------------
// Constellation topology + distant depth parallax
  // All stellar anchors share the global cosmic motion. Lines are recalculated
  // from the rendered CENTER of each visible star so they never detach while
  // parallax is moving the field.
  // ---------------------------------------------------------------------------
  const constellationMap = document.getElementById('constellation-map');
  const constellationSvg = document.getElementById('constellation-lines');
  if (constellationMap && constellationSvg && (!mobileWebKit || runtimeRoute === 'home')) {
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

    let constellationLineFrame = 0;
    const constellationUsable = () => constellationActive
      && homeRouteView
      && !homeRouteView.hidden
      && constellationMap.offsetParent !== null;

    const updateConstellationLines = () => {
      constellationLineFrame = 0;
      if (!constellationUsable()) return;
      const mapRect = constellationMap.getBoundingClientRect();
      if (!mapRect.width || !mapRect.height) return;
      const viewBox = constellationSvg.viewBox.baseVal;
      if (!viewBox.width || !viewBox.height) return;
      const sx = viewBox.width / mapRect.width;
      const sy = viewBox.height / mapRect.height;

      links.forEach((link) => {
        const a = stellarCenter(link.fromEl, mapRect);
        const b = stellarCenter(link.toEl, mapRect);
        const coords = [a.x * sx, a.y * sy, b.x * sx, b.y * sy];
        if (!coords.every(Number.isFinite)) return;
        link.line.setAttribute('x1', String(coords[0]));
        link.line.setAttribute('y1', String(coords[1]));
        link.line.setAttribute('x2', String(coords[2]));
        link.line.setAttribute('y2', String(coords[3]));
      });
    };

    const scheduleConstellationLines = () => {
      if (!constellationUsable() || constellationLineFrame) return;
      constellationLineFrame = requestAnimationFrame(updateConstellationLines);
    };

    constellationMotion = (px, py) => {
      if (!constellationUsable()) return;
      pointData.forEach((data, el) => {
        // The constellation is embedded far behind the foreground. Each point
        // has its own depth, but all travel opposite the pointer with the stars.
        data.ox = -px * 34 * data.depth;
        data.oy = -py * 24 * data.depth;
        el.style.setProperty('--node-px', `${data.ox}px`);
        el.style.setProperty('--node-py', `${data.oy}px`);
      });

      // Coalesce all geometry reads into one frame after transforms land.
      scheduleConstellationLines();
    };

    if ('IntersectionObserver' in window) {
      const constellationObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        constellationActive = Boolean(entry?.isIntersecting);
        if (constellationActive) {
          constellationMotion(pointer.x, pointer.y);
          scheduleConstellationLines();
        }
      }, { rootMargin: '180px 0px', threshold: 0 });
      constellationObserver.observe(constellationMap);
    } else {
      constellationActive = true;
      constellationMotion(0, 0);
    }

    window.addEventListener('resize', () => {
      if (!constellationUsable()) return;
      constellationMotion(pointer.x, pointer.y);
      scheduleConstellationLines();
    }, { passive: true });
    window.addEventListener('svpr:routechange', () => {
      if (!homeRouteView?.hidden && constellationActive) {
        constellationMotion(pointer.x, pointer.y);
        scheduleConstellationLines();
      }
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
    // Do not overlap Safari's largest visual allocation spike with MP3 decoder
    // startup. The score still begins as part of ignition, just after the blast.
    if (mobileWebKit) window.setTimeout(() => { if (!userPaused) void playScore(); }, 760);
    else void playScore();
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
