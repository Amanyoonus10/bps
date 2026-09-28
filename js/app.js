/**
 * BPS Global Trading — Interactive Logistics Engine
 * Full World Route Canvas, Radar, Traditional RFQ System, Live Clock & Bilingual Switcher
 */

document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  initHeaderScroll();
  initHeroMiniMap();
  initFullLogisticsMap();
  initProductFilter();
  initProductCarousel();
  initIndustriesCarousel();
  initCargoCalculator();
  initTraditionalEnquiryForm();
  initLanguageSwitcher();
  initFaqFilters();
  initMobileNav();
  initMobileFloatingBar();
  initModalBackdrops();
});

/* ==========================================================================
   1. LIVE DUBAI GST TIME CLOCK
   ========================================================================== */
function initLiveClock() {
  const clockEl = document.getElementById('liveClockDisplay');
  const mobileClockEl = document.getElementById('mobileClockDisplay');
  if (!clockEl && !mobileClockEl) return;

  function update() {
    const now = new Date();
    const options = {
      timeZone: 'Asia/Dubai',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    const timeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
    const formatted = `DXB ${timeStr} GST`;
    if (clockEl) clockEl.textContent = formatted;
    if (mobileClockEl) mobileClockEl.textContent = formatted;
  }
  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   2. HERO 3D INTERACTIVE ROTATING GLOBE (DELIVERING ACROSS DUBAI • MENA • CIS)
   ========================================================================== */
function initHeroMiniMap() {
  const canvas = document.getElementById('heroMiniMapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;
  let R = 115; // globe radius

  function resize() {
    width = container.clientWidth || 380;
    height = container.clientHeight || 280;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(width, height) * 0.44;
  }
  resize();
  window.addEventListener('resize', resize);

  // Helper: Convert Lat/Lon (degrees) to 3D Cartesian coordinates on unit sphere
  function latLonToVec3(latDeg, lonDeg) {
    const lat = latDeg * Math.PI / 180;
    const lon = lonDeg * Math.PI / 180;
    return {
      x: Math.cos(lat) * Math.sin(lon),
      y: -Math.sin(lat),
      z: Math.cos(lat) * Math.cos(lon)
    };
  }

  // Major Global Logistics Hubs (Exact Geographic Coordinates)
  const DUBAI = { name: 'DUBAI (HUB)', lat: 25.2048, lon: 55.2708 };
  const dubaiVec = latLonToVec3(DUBAI.lat, DUBAI.lon);

  const DESTINATIONS = [
    { name: 'ROTTERDAM', lat: 51.92, lon: 4.48 },
    { name: 'BAKU / CIS', lat: 40.40, lon: 49.86 },
    { name: 'SHANGHAI', lat: 31.23, lon: 121.47 },
    { name: 'SINGAPORE', lat: 1.35, lon: 103.82 },
    { name: 'MUMBAI', lat: 19.07, lon: 72.87 },
    { name: 'MOMBASA', lat: -4.04, lon: 39.66 },
    { name: 'HOUSTON', lat: 29.76, lon: -95.36 },
    { name: 'SANTOS', lat: -23.96, lon: -46.33 }
  ].map(d => ({ ...d, vec: latLonToVec3(d.lat, d.lon) }));

  // Great-circle Spherical Linear Interpolation (slerp)
  function slerp(v0, v1, t) {
    let dot = v0.x * v1.x + v0.y * v1.y + v0.z * v1.z;
    dot = Math.max(-1, Math.min(1, dot));
    const omega = Math.acos(dot);
    if (omega < 0.001) return v0;
    const sinOmega = Math.sin(omega);
    const a = Math.sin((1 - t) * omega) / sinOmega;
    const b = Math.sin(t * omega) / sinOmega;
    return {
      x: a * v0.x + b * v1.x,
      y: a * v0.y + b * v1.y,
      z: a * v0.z + b * v1.z
    };
  }

  // Precompute Great-circle 3D arc trajectories
  const arcCurves = DESTINATIONS.map((dest, idx) => {
    const pts = [];
    const segments = 24;
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const v = slerp(dubaiVec, dest.vec, t);
      const alt = 1 + 0.18 * Math.sin(t * Math.PI);
      pts.push({
        x: v.x * alt,
        y: v.y * alt,
        z: v.z * alt
      });
    }
    return { dest, pts, idx };
  });

  // 3D Rotation helper
  function rotate3D(p, cosY, sinY, cosP, sinP) {
    // 1. Yaw around Y axis
    const x1 = p.x * cosY + p.z * sinY;
    const z1 = -p.x * sinY + p.z * cosY;
    // 2. Pitch around X axis
    const y2 = p.y * cosP - z1 * sinP;
    const z2 = p.y * sinP + z1 * cosP;
    return { x: x1, y: y2, z: z2 };
  }

  // Landmass Point Cloud Generator
  let globeDots = [];

  // Generate fallback land dots immediately so globe displays without waiting
  function generateFallbackDots() {
    const dots = [];
    const landCenters = [
      { lat: 48, lon: 15, r: 16 },      // Europe
      { lat: 56, lon: 50, r: 30 },      // CIS / Russia
      { lat: 24, lon: 47, r: 12 },      // Arabian Peninsula
      { lat: 25.2, lon: 55.3, r: 6 },   // UAE / Dubai Central Hub
      { lat: 20, lon: 78, r: 16 },      // South Asia / India
      { lat: 34, lon: 104, r: 24 },     // East Asia / China
      { lat: 4, lon: 108, r: 14 },      // Southeast Asia
      { lat: 5, lon: 20, r: 28 },       // Africa
      { lat: 40, lon: -100, r: 26 },    // North America
      { lat: -15, lon: -55, r: 22 },    // South America
      { lat: -25, lon: 135, r: 18 }     // Australia
    ];

    for (let lat = -80; lat <= 80; lat += 3.5) {
      const cosLat = Math.cos(lat * Math.PI / 180);
      const lonStep = 3.5 / Math.max(cosLat, 0.2);
      for (let lon = -180; lon < 180; lon += lonStep) {
        for (let i = 0; i < landCenters.length; i++) {
          const c = landCenters[i];
          const d = Math.hypot(lat - c.lat, (lon - c.lon) * cosLat);
          if (d < c.r) {
            dots.push(latLonToVec3(lat, lon));
            break;
          }
        }
      }
    }
    return dots;
  }
  globeDots = generateFallbackDots();

  // Load high-resolution authentic continent dot-matrix from hero-world-map.png
  // Calibrated to map projection: Prime Meridian at 578.88px, Equator at 326.92px, 3.1766 px/deg lon, 3.1703 px/deg lat
  const mapImg = new Image();
  mapImg.src = 'assets/img/hero-world-map.png';
  mapImg.onload = () => {
    try {
      const off = document.createElement('canvas');
      off.width = 120;
      off.height = 60;
      const octx = off.getContext('2d');
      octx.drawImage(mapImg, 0, 0, 120, 60);
      const imgData = octx.getImageData(0, 0, 120, 60).data;
      const sampledDots = [];
      for (let y = 0; y < 60; y++) {
        const yOrig = (y + 0.5) * 10;
        const latDeg = (326.92 - yOrig) / 3.1703;
        if (Math.abs(latDeg) > 83) continue;
        const latRad = latDeg * Math.PI / 180;
        const cosLat = Math.cos(latRad);
        const sinLat = Math.sin(latRad);

        for (let x = 0; x < 120; x++) {
          const idx = (y * 120 + x) * 4;
          const a = imgData[idx + 3];
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          if (a > 35 && (r > 30 || g > 30 || b > 30)) {
            const xOrig = (x + 0.5) * 10;
            const lonDeg = (xOrig - 578.88) / 3.1766;
            const lonRad = lonDeg * Math.PI / 180;
            sampledDots.push({
              x: cosLat * Math.sin(lonRad),
              y: -sinLat,
              z: cosLat * Math.cos(lonRad)
            });
          }
        }
      }
      if (sampledDots.length > 500) {
        globeDots = sampledDots;
      }
    } catch (e) {
      // Fallback dots already present
    }
  };

  // Precompute wireframe latitude/longitude rings
  const wireRings = [];
  [-45, 0, 45].forEach(latDeg => {
    const lat = latDeg * Math.PI / 180;
    const ring = [];
    for (let a = 0; a <= Math.PI * 2; a += Math.PI / 24) {
      ring.push({
        x: Math.cos(lat) * Math.sin(a),
        y: -Math.sin(lat),
        z: Math.cos(lat) * Math.cos(a)
      });
    }
    wireRings.push(ring);
  });
  [0, Math.PI / 2].forEach(lonAngle => {
    const meridian = [];
    for (let a = 0; a <= Math.PI * 2; a += Math.PI / 24) {
      meridian.push({
        x: Math.sin(a) * Math.cos(lonAngle),
        y: Math.cos(a),
        z: Math.sin(a) * Math.sin(lonAngle)
      });
    }
    wireRings.push(meridian);
  });

  // Butter-Smooth Physics & Pointer Damping
  let yaw = -0.965; // centered directly on Dubai / UAE (55.27°E)
  let pitch = 0.30; // elevated angle showcasing Dubai Hub, MENA, and global trade corridors
  let targetPitch = 0.30;
  const baseAutoSpeed = 0.0024;
  let targetYawVel = baseAutoSpeed;
  let yawVel = baseAutoSpeed;

  let dragVelX = 0;
  let dragVelY = 0;
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let mouseActive = false;

  // Track Mouse Pointer with Butter-Smooth Damping
  window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const dist = Math.hypot(dx, dy);
    mouseActive = dist < Math.max(window.innerWidth * 0.55, 600);

    if (isDragging) {
      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;
      yaw += deltaX * 0.007;
      pitch = Math.max(-0.65, Math.min(0.65, pitch - deltaY * 0.007));
      dragVelX = deltaX * 0.004;
      dragVelY = -deltaY * 0.004;
      targetPitch = pitch;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    } else if (mouseActive) {
      // Smooth normalized coordinates relative to center
      const normX = Math.max(-1.4, Math.min(1.4, dx / (window.innerWidth * 0.35)));
      const normY = Math.max(-1.4, Math.min(1.4, dy / (window.innerHeight * 0.35)));

      // Pitch smoothly targets pointer vertical position accurately with mouse pointer
      targetPitch = 0.22 - normY * 0.35;

      // Yaw velocity smoothly steered by pointer horizontal offset
      targetYawVel = baseAutoSpeed + normX * 0.010;
    } else {
      targetYawVel = baseAutoSpeed;
      targetPitch = 0.22;
    }
  }, { passive: true });

  // Dragging support on canvas
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    dragVelX = 0;
    dragVelY = 0;
    targetPitch = pitch;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch support for mobile devices
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
      dragVelX = 0;
      dragVelY = 0;
      targetPitch = pitch;
    }
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - lastMouseX;
      const deltaY = e.touches[0].clientY - lastMouseY;
      yaw += deltaX * 0.008;
      pitch = Math.max(-0.65, Math.min(0.65, pitch - deltaY * 0.008));
      dragVelX = deltaX * 0.005;
      dragVelY = -deltaY * 0.005;
      targetPitch = pitch;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  let animTime = 0;

  // Main Render Loop
  function render() {
    animTime += 0.016;

    // Smooth inertia and rotation update
    if (isDragging) {
      // Direct drag manipulation
    } else {
      // Momentum decay after drag release
      dragVelX *= 0.92;
      dragVelY *= 0.92;
      yaw += dragVelX;
      pitch = Math.max(-0.65, Math.min(0.65, pitch + dragVelY));

      // Damped exponential filter for seamless pointer following
      yawVel += (targetYawVel - yawVel) * 0.05;
      yaw += yawVel;
      pitch += (targetPitch - pitch) * 0.05;
    }

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    // 1. Atmosphere Glow behind the Globe
    const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R * 1.32);
    atmoGrad.addColorStop(0, 'rgba(0, 136, 255, 0.18)');
    atmoGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.08)');
    atmoGrad.addColorStop(1, 'rgba(0, 136, 255, 0)');
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.32, 0, Math.PI * 2);
    ctx.fill();

    // 2. Translucent Dark Glass Sphere Body
    const sphereGrad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
    sphereGrad.addColorStop(0, 'rgba(14, 28, 62, 0.55)');
    sphereGrad.addColorStop(0.7, 'rgba(5, 14, 32, 0.85)');
    sphereGrad.addColorStop(1, 'rgba(2, 6, 16, 0.95)');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // 3. Globe Edge Rim Ring
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Subtle Wireframe Latitude/Longitude Rings
    ctx.lineWidth = 0.8;
    wireRings.forEach(ring => {
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < ring.length; i++) {
        const rp = rotate3D(ring[i], cosY, sinY, cosP, sinP);
        if (rp.z > -0.15) {
          const sx = cx + rp.x * R;
          const sy = cy + rp.y * R;
          if (first) {
            ctx.moveTo(sx, sy);
            first = false;
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          first = true;
        }
      }
      ctx.strokeStyle = 'rgba(0, 136, 255, 0.12)';
      ctx.stroke();
    });

    // 5. Continent Dot-Matrix Point Cloud
    const dotCount = globeDots.length;
    for (let i = 0; i < dotCount; i++) {
      const p = rotate3D(globeDots[i], cosY, sinY, cosP, sinP);

      if (p.z > -0.18) {
        const sx = cx + p.x * R;
        const sy = cy + p.y * R;
        const alpha = Math.max(0.08, (p.z + 0.18) / 1.18);
        const dotRadius = p.z > 0 ? (1.15 + p.z * 0.75) : 0.9;

        // Luminous white country dots with depth-faded alpha
        ctx.fillStyle = p.z > 0
          ? `rgba(255, 255, 255, ${alpha * 0.95})`
          : `rgba(215, 230, 255, ${alpha * 0.35})`;

        ctx.beginPath();
        ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6. Precomputed 3D Trade Arcs
    const rotatedDubai = rotate3D(dubaiVec, cosY, sinY, cosP, sinP);

    arcCurves.forEach(arc => {
      ctx.beginPath();
      let started = false;
      const pts = arc.pts;

      for (let s = 0; s < pts.length; s++) {
        const rp = rotate3D(pts[s], cosY, sinY, cosP, sinP);
        if (rp.z > -0.1) {
          const sx = cx + rp.x * R;
          const sy = cy + rp.y * R;
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          started = false;
        }
      }

      ctx.strokeStyle = 'rgba(235, 175, 65, 0.45)';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Flowing Pulse Particle on Arc
      const particleT = (animTime * 0.45 + arc.idx * 0.125) % 1;
      const pv = slerp(dubaiVec, arc.dest.vec, particleT);
      const palt = 1 + 0.18 * Math.sin(particleT * Math.PI);
      const pRot = rotate3D({ x: pv.x * palt, y: pv.y * palt, z: pv.z * palt }, cosY, sinY, cosP, sinP);

      if (pRot.z > -0.05) {
        const px = cx + pRot.x * R;
        const py = cy + pRot.y * R;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFE082';
        ctx.shadowColor = '#FFD54F';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Destination Node
      const rDest = rotate3D(arc.dest.vec, cosY, sinY, cosP, sinP);
      if (rDest.z > 0.05) {
        const dx = cx + rDest.x * R;
        const dy = cy + rDest.y * R;

        ctx.beginPath();
        ctx.arc(dx, dy, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFB300';
        ctx.fill();
      }
    });

    // 7. Dubai Central Hub Pulse & Beacon
    if (rotatedDubai.z > -0.05) {
      const hx = cx + rotatedDubai.x * R;
      const hy = cy + rotatedDubai.y * R;

      // Concentric expanding pulse wave
      const pulseWave = (animTime * 1.5) % 1;
      const waveRadius = 6 + pulseWave * 16;
      const waveAlpha = 1 - pulseWave;

      ctx.beginPath();
      ctx.arc(hx, hy, waveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(37, 99, 235, ${waveAlpha * 0.85})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Secondary inner pulse wave
      const pulseWave2 = (animTime * 1.5 + 0.5) % 1;
      const waveRadius2 = 6 + pulseWave2 * 16;
      const waveAlpha2 = 1 - pulseWave2;

      ctx.beginPath();
      ctx.arc(hx, hy, waveRadius2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(59, 130, 246, ${waveAlpha2 * 0.6})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Core Glowing Beacon
      ctx.beginPath();
      ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#2563EB';
      ctx.shadowColor = '#3B82F6';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Center point
      ctx.beginPath();
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#E0F2FE';
      ctx.fill();

      // Dubai Callout Tag Pill
      const tagText = 'DUBAI (HUB)';
      ctx.font = '700 10.5px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(tagText).width;
      const pillW = tw + 14;
      const pillH = 18;
      const pillY = hy - 18;

      // Pin pointer notch pointing to Dubai beacon
      ctx.beginPath();
      ctx.moveTo(hx, hy - 7);
      ctx.lineTo(hx - 4, pillY + pillH / 2);
      ctx.lineTo(hx + 4, pillY + pillH / 2);
      ctx.closePath();
      ctx.fillStyle = '#2563EB';
      ctx.fill();

      // Pill container
      ctx.fillStyle = 'rgba(6, 12, 26, 0.92)';
      ctx.beginPath();
      ctx.roundRect(hx - pillW / 2, pillY - pillH / 2, pillW, pillH, 5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Pill text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(tagText, hx, pillY);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    requestAnimationFrame(render);
  }

  render();
}

/* ==========================================================================
   3. WHERE YOUR CARGO MOVES — FULL GLOBAL MAP CANVAS
   ========================================================================== */
function initFullLogisticsMap() {
  const canvas = document.getElementById('fullLogisticsMapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;
  const hintLabel = document.getElementById('mapHintLabel');

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  function resize() {
    width = container.clientWidth || 700;
    height = container.clientHeight || 480;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Dubai Hub location accurately aligned with global-reach-map.png (Dubai, UAE: 25.2°N, 55.3°E)
  const dubai = { 
    name: 'DUBAI (HUB)', 
    x: 0.478, 
    y: 0.413, 
    info: 'Regional Hub: Jebel Ali (AEJEA) • Regional Supply & Technical Fitting • 24/7 Operations' 
  };

  const regions = [
    { 
      name: 'EUROPE', 
      x: 0.28, 
      y: 0.24, 
      ports: 'Rotterdam, Antwerp, Valencia, Genoa', 
      transit: '14–18 Days', 
      mode: 'Direct Ocean Freight' 
    },
    { 
      name: 'RUSSIA & CIS', 
      x: 0.48, 
      y: 0.21, 
      ports: 'Baku, Tashkent, Almaty, Aktau', 
      transit: '5–8 Days', 
      mode: 'Multimodal Road & Rail' 
    },
    { 
      name: 'MIDDLE EAST', 
      x: 0.42, 
      y: 0.42, 
      ports: 'Jeddah, Dammam, Sohar, Alexandria', 
      transit: '24–48 Hours', 
      mode: 'Direct Overland Trucking' 
    },
    { 
      name: 'AFRICA', 
      x: 0.35, 
      y: 0.54, 
      ports: 'Mombasa, Dar es Salaam, Durban', 
      transit: '7–12 Days', 
      mode: 'Direct Ocean Freight' 
    },
    { 
      name: 'CHINA', 
      x: 0.58, 
      y: 0.34, 
      ports: 'Shanghai, Ningbo, Qingdao, Shenzhen', 
      transit: '12–16 Days', 
      mode: 'Direct Ocean Freight' 
    },
    { 
      name: 'ASIA PACIFIC', 
      x: 0.56, 
      y: 0.54, 
      ports: 'Singapore, Port Klang, Jakarta', 
      transit: '8–12 Days', 
      mode: 'Express Sea Corridor' 
    },
    { 
      name: 'NORTH AMERICA', 
      x: 0.84, 
      y: 0.30, 
      ports: 'Houston, New Orleans, Savannah', 
      transit: '22–26 Days', 
      mode: 'Direct Ocean Freight' 
    },
    { 
      name: 'SOUTH AMERICA', 
      x: 0.88, 
      y: 0.67, 
      ports: 'Santos, Buenos Aires, Callao', 
      transit: '24–28 Days', 
      mode: 'Direct Ocean Freight' 
    }
  ];

  let hoveredRegion = null;
  let hoveredDubai = false;

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const dx = width * dubai.x;
    const dy = height * dubai.y;

    if (Math.hypot(mx - dx, my - dy) < 22) {
      hoveredDubai = true;
      hoveredRegion = null;
      canvas.style.cursor = 'pointer';
      if (hintLabel) {
        hintLabel.innerHTML = `<strong>DUBAI CENTRAL STOCK:</strong> ${dubai.info}`;
      }
      return;
    } else {
      hoveredDubai = false;
    }

    let found = null;
    for (let i = 0; i < regions.length; i++) {
      const rx = width * regions[i].x;
      const ry = height * regions[i].y;
      if (Math.hypot(mx - rx, my - ry) < 24) {
        found = regions[i];
        break;
      }
    }

    hoveredRegion = found;
    canvas.style.cursor = found ? 'pointer' : 'default';

    if (hintLabel) {
      if (found) {
        hintLabel.innerHTML = `<strong>${found.name} CORRIDOR:</strong> ${found.ports} &bull; <span style="color:#38BDF8;">Transit: ${found.transit}</span> (${found.mode})`;
      } else {
        hintLabel.innerText = 'Hover any regional hub to view direct transit corridors & destinations';
      }
    }
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredRegion = null;
    hoveredDubai = false;
    canvas.style.cursor = 'default';
    if (hintLabel) {
      hintLabel.innerText = ('ontouchstart' in window || navigator.maxTouchPoints > 0)
        ? 'Tap any regional hub to view direct transit corridors & destinations'
        : 'Hover any regional hub to view direct transit corridors & destinations';
    }
  });

  // Touch support for Mobile / Tablets on World Logistics Map
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.touches[0].clientX - rect.left;
      const my = e.touches[0].clientY - rect.top;

      const dx = width * dubai.x;
      const dy = height * dubai.y;

      if (Math.hypot(mx - dx, my - dy) < 28) {
        hoveredDubai = true;
        hoveredRegion = null;
        if (hintLabel) {
          hintLabel.innerHTML = `<strong>DUBAI CENTRAL STOCK:</strong> ${dubai.info}`;
        }
        return;
      } else {
        hoveredDubai = false;
      }

      let found = null;
      for (let i = 0; i < regions.length; i++) {
        const rx = width * regions[i].x;
        const ry = height * regions[i].y;
        if (Math.hypot(mx - rx, my - ry) < 30) {
          found = regions[i];
          break;
        }
      }

      hoveredRegion = found;
      if (hintLabel) {
        if (found) {
          hintLabel.innerHTML = `<strong>${found.name} CORRIDOR:</strong> ${found.ports} &bull; <span style="color:#38BDF8;">Transit: ${found.transit}</span> (${found.mode})`;
        } else {
          hintLabel.innerText = 'Tap any regional hub to view direct transit corridors & destinations';
        }
      }
    }
  }, { passive: true });

  let animOffset = 0;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    animOffset += 0.007;

    const dx = width * dubai.x;
    const dy = height * dubai.y;

    // Curved golden rays radiating from DUBAI
    regions.forEach((r, idx) => {
      const rx = width * r.x;
      const ry = height * r.y;
      const isHovered = (hoveredRegion === r);

      const midX = (dx + rx) / 2;
      const midY = (dy + ry) / 2 - (isHovered ? 44 : 38);

      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.quadraticCurveTo(midX, midY, rx, ry);

      if (isHovered) {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3.2;
        ctx.shadowColor = '#0088FF';
        ctx.shadowBlur = 12;
      } else {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Flowing Pulse particle
      let t = (animOffset * (0.85 + idx * 0.14)) % 1;
      const px = (1 - t) * (1 - t) * dx + 2 * (1 - t) * t * midX + t * t * rx;
      const py = (1 - t) * (1 - t) * dy + 2 * (1 - t) * t * midY + t * t * ry;

      ctx.beginPath();
      ctx.arc(px, py, isHovered ? 4.2 : 3.2, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#FFFFFF' : '#93C5FD';
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Region node
      ctx.beginPath();
      ctx.arc(rx, ry, isHovered ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#38BDF8' : '#60A5FA';
      ctx.shadowColor = isHovered ? '#38BDF8' : '#2563EB';
      ctx.shadowBlur = isHovered ? 14 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isHovered) {
        ctx.beginPath();
        ctx.arc(rx, ry, 11, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Region label pill
      ctx.font = '700 11px "Space Grotesk", sans-serif';
      const textWidth = ctx.measureText(r.name).width;
      ctx.fillStyle = isHovered ? 'rgba(10, 24, 52, 0.95)' : 'rgba(4, 10, 24, 0.82)';
      ctx.beginPath();
      ctx.roundRect(rx - textWidth / 2 - 7, ry - 24, textWidth + 14, 18, 5);
      ctx.fill();

      ctx.strokeStyle = isHovered ? 'rgba(59, 130, 246, 0.7)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isHovered ? '#93C5FD' : '#F1F5F9';
      ctx.textAlign = 'center';
      ctx.fillText(r.name, rx, ry - 11);
    });

    // Central DUBAI Node & Radiant Hub Beacon
    ctx.beginPath();
    ctx.arc(dx, dy, hoveredDubai ? 9 : 7.5, 0, Math.PI * 2);
    ctx.fillStyle = '#2563EB';
    ctx.shadowColor = '#3B82F6';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glowing core
    ctx.beginPath();
    ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#E0F2FE';
    ctx.fill();

    // Radiating concentric pulse rings
    const ringR = 14 + Math.sin(Date.now() * 0.005) * 5;
    ctx.beginPath();
    ctx.arc(dx, dy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const ringR2 = 23 + Math.sin(Date.now() * 0.003) * 7;
    ctx.beginPath();
    ctx.arc(dx, dy, ringR2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Dubai text pill
    ctx.font = '800 12px "Space Grotesk", sans-serif';
    const dubaiWidth = ctx.measureText('DUBAI (HUB)').width;
    ctx.fillStyle = 'rgba(4, 10, 26, 0.92)';
    ctx.beginPath();
    ctx.roundRect(dx - dubaiWidth / 2 - 8, dy + 13, dubaiWidth + 16, 21, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#60A5FA';
    ctx.textAlign = 'center';
    ctx.fillText('DUBAI (HUB)', dx, dy + 28);

    requestAnimationFrame(draw);
  }
  draw();
}

/* ==========================================================================
   4. PRODUCT CATEGORY FILTER SYSTEM
   ========================================================================== */
function initProductFilter() {
  const filterBtns = document.querySelectorAll('.prod-filter-btn');
  const cards = document.querySelectorAll('.product-ref-card');
  const scrollContainer = document.getElementById('productsSideScroll');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      if (scrollContainer) {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      }
    });
  });
}

/* ==========================================================================
   4B. PRODUCT HORIZONTAL SIDE-SCROLL CAROUSEL
   ========================================================================== */
function initProductCarousel() {
  const scrollContainer = document.getElementById('productsSideScroll');
  const prevBtn = document.getElementById('prodScrollPrev');
  const nextBtn = document.getElementById('prodScrollNext');

  if (!scrollContainer) return;

  const scrollDistance = 354; // card width (330px) + gap (24px)

  function updateButtons() {
    if (!prevBtn || !nextBtn) return;
    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    prevBtn.style.opacity = scrollContainer.scrollLeft <= 10 ? '0.35' : '1';
    prevBtn.style.pointerEvents = scrollContainer.scrollLeft <= 10 ? 'none' : 'auto';
    nextBtn.style.opacity = scrollContainer.scrollLeft >= maxScroll - 10 ? '0.35' : '1';
    nextBtn.style.pointerEvents = scrollContainer.scrollLeft >= maxScroll - 10 ? 'none' : 'auto';
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      scrollContainer.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      scrollContainer.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    });
  }

  scrollContainer.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  setTimeout(updateButtons, 200);

  // Drag-to-scroll support for desktop
  let isDown = false;
  let startX;
  let scrollStartLeft;
  let hasMoved = false;

  scrollContainer.addEventListener('mousedown', (e) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    isDown = true;
    hasMoved = false;
    startX = e.pageX - scrollContainer.offsetLeft;
    scrollStartLeft = scrollContainer.scrollLeft;
    scrollContainer.style.cursor = 'grabbing';
    scrollContainer.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - scrollContainer.offsetLeft;
    const walk = (x - startX);
    if (Math.abs(walk) > 5) {
      hasMoved = true;
    }
    scrollContainer.scrollLeft = scrollStartLeft - walk;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    scrollContainer.style.cursor = '';
    scrollContainer.style.userSelect = '';
  });

  // Prevent card click if dragged
  scrollContainer.querySelectorAll('.product-ref-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (hasMoved) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  });
}

/* ==========================================================================
   4C. INDUSTRIES SERVED HORIZONTAL SCROLL
   ========================================================================== */
function initIndustriesCarousel() {
  const scrollTrack = document.getElementById('industriesScrollTrack');
  const prevBtn = document.getElementById('indScrollPrev');
  const nextBtn = document.getElementById('indScrollNext');

  if (!scrollTrack) return;

  const scrollDistance = 350;

  function updateButtons() {
    if (!prevBtn || !nextBtn) return;
    const maxScroll = scrollTrack.scrollWidth - scrollTrack.clientWidth;
    prevBtn.style.opacity = scrollTrack.scrollLeft <= 5 ? '0.35' : '1';
    prevBtn.style.pointerEvents = scrollTrack.scrollLeft <= 5 ? 'none' : 'auto';
    nextBtn.style.opacity = scrollTrack.scrollLeft >= maxScroll - 5 ? '0.35' : '1';
    nextBtn.style.pointerEvents = scrollTrack.scrollLeft >= maxScroll - 5 ? 'none' : 'auto';
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      scrollTrack.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      scrollTrack.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    });
  }

  scrollTrack.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  setTimeout(updateButtons, 200);

  // Mouse Drag Support
  let isDown = false;
  let startX;
  let scrollStartLeft;

  scrollTrack.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDown = true;
    startX = e.pageX - scrollTrack.offsetLeft;
    scrollStartLeft = scrollTrack.scrollLeft;
    scrollTrack.style.cursor = 'grabbing';
    scrollTrack.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - scrollTrack.offsetLeft;
    const walk = (x - startX);
    scrollTrack.scrollLeft = scrollStartLeft - walk;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    scrollTrack.style.cursor = '';
    scrollTrack.style.userSelect = '';
  });
}

/* ==========================================================================
   5. PRODUCT DETAIL MODAL DIALOGS
   ========================================================================== */
const PRODUCTS_DATA = {
  industrial: {
    title: 'Industrial Flexitanks',
    tagline: 'Multi-layer bags that turn a standard 20ft container into a bulk liquid carrier.',
    capacity: 'Capacity: 16,000 – 26,000 Litres',
    image: 'assets/img/product-industrial.jpg',
    specs: [
      { label: 'Layer Architecture', val: '3x Virgin PE layers (125-150µ) + High-Tensile Tubular Woven PP' },
      { label: 'Discharge Valve', val: '3-inch High-Flow Camlock Ball or Butterfly Valve (Safety Lock)' },
      { label: 'Bulkhead Bracing', val: 'Corrugated steel frame with 5x structural steel square tubes' },
      { label: 'Target Cargoes', val: 'Base Oils, Lubricants, Chemicals, Rubber Latex, Glycerine' },
      { label: 'Max Fill Temp', val: '60°C continuous flow' },
      { label: 'Approvals', val: 'ISO 9001:2015, COA PAS 1008:2016, Lloyds Rail Impact Certified' }
    ]
  },
  foodgrade: {
    title: 'Dairy & Edible Oil Flexitanks',
    tagline: 'Food-quality EU & FDA compliant flexitanks purpose-built for milk, oils and molasses.',
    capacity: 'Capacity: 18,000 – 24,000 Litres',
    image: 'assets/img/product-foodgrade.jpg',
    specs: [
      { label: 'Purity Standard', val: '100% Virgin Food-Contact Polymer, Sterile Cleanroom Extrusion' },
      { label: 'Discharge Valve', val: 'Sanitary Food-Grade 3" Butterfly Valve with Tamper Seal & Dust Cap' },
      { label: 'Approvals', val: 'FDA 21 CFR 177.1520, EU No 10/2011, Kosher, Halal, HACCP' },
      { label: 'Target Cargoes', val: 'Palm Oil, Sunflower, Olive Oil, Liquid Milk, Dairy Blends, Molasses' },
      { label: 'Nitrogen Port', val: 'Optional aseptic nitrogen purge & blanket port' },
      { label: 'Migration Limits', val: 'Zero phthalates, zero heavy metals, zero plasticizer leech' }
    ]
  },
  wine: {
    title: 'Wine Flexitanks',
    tagline: 'Thermally protected, flavour-safe transport engineered specifically for bulk wine voyages.',
    capacity: 'Capacity: Up to 24,000 Litres',
    image: 'assets/img/product-foodgrade.jpg',
    specs: [
      { label: 'Barrier Film', val: '5-Layer EVOH Gas Barrier (<0.1 cm³/m²·24h oxygen transmission rate)' },
      { label: 'Thermal Shield', val: 'Multi-layer bubble foil thermal container blanket included' },
      { label: 'Taste Neutrality', val: 'Zero aroma scalping, zero migration, preserves vintage bouquet' },
      { label: 'Target Cargoes', val: 'Bulk Red & White Wine, Cider, Fruit Juice Concentrates' },
      { label: 'Discharge Valve', val: 'Food-grade stainless steel/composite bottom discharge' },
      { label: 'Approvals', val: 'OIV Compliant, EU Food Grade, FDA Compliant, Japan Food Research Lab' }
    ]
  },
  bitumen: {
    title: 'Bitumen Flexitanks',
    tagline: 'Engineered for the safe bulk transport of hot bitumen and asphalt cargo.',
    capacity: 'Capacity: 20,000 – 22,000 Litres (~20–22 MT)',
    image: 'assets/img/product-bitumen.jpg',
    specs: [
      { label: 'Filling Temp', val: 'High-temperature polymer compound rated up to 130°C–150°C' },
      { label: 'Heating System', val: 'Integrated multi-loop steam or hot water heater pad system' },
      { label: 'Structural Rating', val: 'Heavy-duty steel bulkhead containment preventing expansion' },
      { label: 'Target Cargoes', val: 'Paving Bitumen (60/70, 80/100), Asphalt, Paraffin Wax, Tar' },
      { label: 'Discharge Valve', val: 'High-temperature composite 3-inch ball valve' },
      { label: 'Approvals', val: 'COA Structural Dynamic Stress Approved, High-Temp Material Safety' }
    ]
  },
  reefer: {
    title: 'Reefer Flexitanks',
    tagline: 'Trailer-specific solutions for climate-dependent liquid cargo by road and sea.',
    capacity: 'Capacity: 16,000 – 24,000 Litres',
    image: 'assets/img/product-reefer.jpg',
    specs: [
      { label: 'Airflow Profile', val: 'Low-profile contouring allowing unimpeded cooling circulation' },
      { label: 'Anti-Surge', val: 'Internal wave-damping baffles suppressing road transit sloshing' },
      { label: 'Temperature Scope', val: '-10°C to +25°C chilled or heated continuous flow' },
      { label: 'Target Cargoes', val: 'Chilled Milk, Juices, Liquid Pharmaceuticals, Specialty Resins' },
      { label: 'Container Types', val: 'Refrigerated 40ft/20ft containers and highway chassis trailers' },
      { label: 'Approvals', val: 'ATP Container Compatible, ISO 22000, FDA Compliant' }
    ]
  },
  ibc: {
    title: 'IBC & Container Liners',
    tagline: 'Liners and folding paper IBCs for grains, powders and granular bulk cargo.',
    capacity: 'Capacity: 1,000L Paper IBC & Full 20ft/40ft Liners',
    image: 'assets/img/product-ibc-liners.jpg',
    specs: [
      { label: 'Paper IBC', val: 'Collapsible 1,000L heavy-duty kraft with aseptic liner cassette' },
      { label: 'Dry Bulk Liners', val: 'Full-containment 20ft/40ft liners with pneumatic blow spouts' },
      { label: 'Target Cargoes', val: 'Sugar, Starch, Grains, Polymer Pellets, Animal Feed, Minerals' },
      { label: 'Loading Spouts', val: 'Top pneumatic filling and bottom gravity discharge chutes' },
      { label: 'Approvals', val: 'ISO 9001:2015, FDA Food Grade Liner Compliant' }
    ]
  },
  dunnage: {
    title: 'Dunnage Bags & Heater Pads',
    tagline: 'Cargo protection and heating accessories that safeguard transit integrity.',
    capacity: 'Transit Protection & Heating Suite',
    image: 'assets/img/product-dunnage.jpg',
    specs: [
      { label: 'Air Dunnage Bags', val: 'Level 1 to Level 4 AAR Approved Polywoven Kraft air cushions' },
      { label: 'Heater Pads', val: 'Up to 3.5 m² surface area, steam/hot water rapid viscosity reduction' },
      { label: 'Discharge Benefit', val: 'Prevents load shifting and cuts cold-climate discharge time by 75%' },
      { label: 'Approvals', val: 'Association of American Railroads (AAR) Certified, High-Pressure Tested' }
    ]
  }
};

const PRODUCTS_DATA_AR = {
  industrial: {
    title: 'فليكسي تانك للأغراض الصناعية',
    tagline: 'مصمم خصيصاً للمواد الكيميائية السائلة غير الخطرة والزيوت الأساسية.',
    capacity: 'السعة: 14,000 – 24,000 لتر',
    image: 'assets/img/product-industrial.jpg',
    specs: [
      { label: 'هندسة الطبقات', val: '3 طبقات بولي إيثيلين نقي (125-150 ميكرون) + غلاف بولي بروبيلين محاك عالي المتانة' },
      { label: 'صمام التفريغ', val: 'صمام كروي أو فراشة كاملوك 3 بوصة عالي التدفق (مع قفل أمان)' },
      { label: 'دعم الحاجز الفولاذي', val: 'إطار فولاذي مموج مع 5 عوارض فولاذية هيكلية مربعة' },
      { label: 'السوائل المستهدفة', val: 'الزيوت الأساسية، مواد التشحيم، الكيماويات الصناعية، الجلسرين، اللاتكس' },
      { label: 'أقصى حرارة تعبئة', val: '60°C تدفق مستمر' },
      { label: 'الاعتمادات', val: 'ISO 9001:2015, COA PAS 1008:2016, اختبار صدمات السكك الحديدية معتمد' }
    ]
  },
  foodgrade: {
    title: 'فليكسي تانك الزيوت والألبان الغذائية',
    tagline: 'مطابق للمواصفات الغذائية للاتحاد الأوروبي وFDA مخصص للزيوت النباتية والألبان.',
    capacity: 'السعة: 18,000 – 24,000 لتر',
    image: 'assets/img/product-foodgrade.jpg',
    specs: [
      { label: 'معيار النقاء', val: 'بوليمر نقي 100% ملامس للأغذية، تصنيع في غرف معقمة' },
      { label: 'صمام التفريغ', val: 'صمام فراشة صحي 3 بوصة مع ختم ضد العبث وغطاء حماية من الأتربة' },
      { label: 'الاعتمادات', val: 'FDA 21 CFR 177.1520, EU No 10/2011, كوشر، حلال، HACCP' },
      { label: 'السوائل المستهدفة', val: 'زيت النخيل، زيت عباد الشمس، زيت الزيتون، الحليب السائل، الجلوكوز' },
      { label: 'منفذ النيتروجين', val: 'منفذ حقن نيتروجين معقم اختياري لحماية السائل من الأكسدة' },
      { label: 'حدود الانتقال الكيميائي', val: 'خالٍ تماماً من الفثالات والمعادن الثقيلة والملدنات الضارة' }
    ]
  },
  wine: {
    title: 'فليكسي تانك المشروبات والعصائر الفاخرة',
    tagline: 'حماية حرارية متقدمة وغشاء عازل للأكسجين للحفاظ التام على نكهات المشروبات.',
    capacity: 'السعة: حتى 24,000 لتر',
    image: 'assets/img/product-foodgrade.jpg',
    specs: [
      { label: 'الغشاء العازل', val: 'طبقة عازلة EVOH خماسية الطبقات (نفاذية أكسجين <0.1 سم³/م²·24 ساعة)' },
      { label: 'الدرع الحراري', val: 'بطانية عزل حراري متعددة الطبقات من رقائق الألمنيوم والفقاعات مشمولة' },
      { label: 'حيادية المذاق', val: 'انعدام تام لنفاذ الروائح أو فقدان النكهات العطرية للبضائع الفاخرة' },
      { label: 'السوائل المستهدفة', val: 'العصائر المركزة، مشروبات الفواكه، المشروبات السائبة' },
      { label: 'صمام التفريغ', val: 'صمام تفريغ سفلي من الفولاذ المقاوم للصدأ ومواد صحية معتمدة' },
      { label: 'الاعتمادات', val: 'معتمد من OIV، مطابق للأغذية في الاتحاد الأوروبي وFDA' }
    ]
  },
  bitumen: {
    title: 'فليكسي تانك البيتومين والأسفلت الساخن',
    tagline: 'مصمم لتحمل ونقل الأسفلت والبيتومين السائل بدرجات حرارة عالية بأمان.',
    capacity: 'السعة: 20,000 – 22,000 لتر (~20–22 طن متري)',
    image: 'assets/img/product-bitumen.jpg',
    specs: [
      { label: 'حرارة التعبئة', val: 'مركب بوليمري فائق التحمل لدرجات حرارة حتى 130°C–150°C' },
      { label: 'نظام التسخين', val: 'وسادة تسخين متطورة مدمجة تعمل بالبخار أو الماء الساخن لتسهيل التفريغ' },
      { label: 'القوة الهيكلية', val: 'حاجز فولاذي ثقيل مدعم لمنع أي تمدد أو إجهاد جانبي للحاوية' },
      { label: 'السوائل المستهدفة', val: 'بيتومين الطرق (60/70, 80/100)، الأسفلت السائل، الشمع البرافيني' },
      { label: 'صمام التفريغ', val: 'صمام كروي 3 بوصة مركب ومقاوم للحرارة العالية' },
      { label: 'الاعتمادات', val: 'معتمد ضد الإجهاد الديناميكي COA، سلامة المواد الحرارية' }
    ]
  },
  reefer: {
    title: 'فليكسي تانك الحاويات والشاحنات المبردة',
    tagline: 'حلول مخصصة للمقطورات والحاويات المبردة لنقل السوائل الحساسة للحرارة.',
    capacity: 'السعة: 16,000 – 24,000 لتر',
    image: 'assets/img/product-reefer.jpg',
    specs: [
      { label: 'تدفق الهواء', val: 'تصميم منخفض الارتفاع يتيح دوران هواء التبريد بدون أي عوائق' },
      { label: 'مقاومة التموج', val: 'حواجز تخميد داخلية تحد من حركة السائل أثناء النقل البري' },
      { label: 'نطاق درجات الحرارة', val: 'من -10°C حتى +25°C تدفق مستمر ومراقب' },
      { label: 'السوائل المستهدفة', val: 'الحليب المبرد، العصائر الطازجة، المستحضرات الدوائية السائلة' },
      { label: 'أنواع الحاويات', val: 'حاويات مبردة 20 و40 قدماً وشاحنات التبريد البرية' },
      { label: 'الاعتمادات', val: 'متوافق مع حاويات ATP، ISO 22000، معتمد من FDA' }
    ]
  },
  ibc: {
    title: 'بطانات حاويات IBC والحاويات الجافة',
    tagline: 'بطانات صحية لحاويات IBC وحاويات البضائع الجافة والسائبة.',
    capacity: 'السعة: 1,000 لتر لحاويات IBC وبطانات كاملة 20/40 قدماً',
    image: 'assets/img/product-ibc-liners.jpg',
    specs: [
      { label: 'حاويات IBC', val: 'كيس بطانة معقم سعة 1,000 لتر للحاويات الورقية والبلاستيكية القابلة للطي' },
      { label: 'بطانات البضائع الجافة', val: 'بطانات تغليف كاملة للحاويات مع فوهات نفخ هوائي' },
      { label: 'البضائع المستهدفة', val: 'السكر، النشا، الحبوب، حبيبات البلاستيك، الأعلاف، المعادن' },
      { label: 'فوهات التحميل', val: 'فوهة علوية للتحميل الهوائي ومزراب سفلي للتفريغ بالجاذبية' },
      { label: 'الاعتمادات', val: 'ISO 9001:2015، متوافق مع الدرجة الغذائية FDA' }
    ]
  },
  dunnage: {
    title: 'وسائد التثبيت الهوائية ووسائد التسخين',
    tagline: 'عتاد حماية البضائع وأنظمة التسخين الحراري لتأمين الرحلات البحرية.',
    capacity: 'مجموعة شاملة لحماية البضائع وتسهيل التفريغ',
    image: 'assets/img/product-dunnage.jpg',
    specs: [
      { label: 'أكياس التثبيت الهوائية', val: 'وسائد هوائية ورقية وبولي بروبيلين معتمدة من المستوى 1 إلى 4 AAR' },
      { label: 'وسائد التسخين', val: 'مساحة سطحية حتى 3.5 م² لتقليل اللزوجة سريعاً بالبخار والماء الساخن' },
      { label: 'فائدة التفريغ', val: 'تمنع تحرك الحمولة وتخفض زمن تفريغ السوائل الباردة بنسبة 75%' },
      { label: 'الاعتمادات', val: 'شهادة جمعية السكك الحديدية الأمريكية (AAR)، اختبارات ضغط عالية' }
    ]
  }
};

window.openProductModal = function(id) {
  const isAr = currentAppLang === 'ar';
  const data = isAr ? (PRODUCTS_DATA_AR[id] || PRODUCTS_DATA[id]) : PRODUCTS_DATA[id];
  if (!data) return;

  const modal = document.getElementById('productDetailModal');
  document.getElementById('modalTitle').textContent = data.title;
  document.getElementById('modalTagline').textContent = data.tagline;
  document.getElementById('modalCapacity').textContent = data.capacity;
  document.getElementById('modalImg').src = data.image;

  const specsTitle = document.getElementById('modalSpecsTitle');
  if (specsTitle) {
    specsTitle.textContent = isAr ? 'مصفوفة الهندسة والمواصفات الفنية' : 'Technical Engineering Matrix';
  }

  const btnConfigure = document.getElementById('modalBtnConfigure');
  if (btnConfigure) {
    btnConfigure.textContent = isAr ? 'تخصيص هذا الفليكسي تانك' : 'Configure This Flexitank';
  }

  const btnChat = document.getElementById('modalBtnChat');
  if (btnChat) {
    btnChat.textContent = isAr ? 'محادثة مسؤول التوزيع بدبي' : 'Chat with Dubai Stockist';
  }

  const specsBody = document.getElementById('modalSpecsBody');
  specsBody.innerHTML = '';
  data.specs.forEach(s => {
    const item = document.createElement('div');
    item.style.background = '#070E20';
    item.style.padding = '12px 16px';
    item.style.borderRadius = '6px';
    item.style.border = '1px solid rgba(255,255,255,0.08)';
    item.innerHTML = `<span style="color:var(--text-gray-muted); display:block; font-size:0.75rem; text-transform:uppercase; font-weight:600;">${s.label}</span><strong style="color:#fff; font-size:0.875rem;">${s.val}</strong>`;
    specsBody.appendChild(item);
  });

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeProductModal = function() {
  const modal = document.getElementById('productDetailModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
};

/* ==========================================================================
   6. CERTIFICATION MODALS
   ========================================================================== */
const CERTS_DATA = {
  iso9001: { name: 'ISO 9001:2015', auth: 'Quality Management Systems', scope: 'Manufacturing consistency, defect prevention, and rigorous quality audit tracking from virgin resin to valve sealing.' },
  iso14001: { name: 'ISO 14001:2015', auth: 'Environmental Management Systems', scope: 'Sustainable manufacturing practices, waste reduction, and carbon efficiency across all operations.' },
  iso22000: { name: 'ISO 22000:2018', auth: 'Food Safety Management Systems', scope: 'Certified food supply chain hygiene, cleanroom fabrication, and contamination safeguards for bulk liquids.' },
  haccp: { name: 'HACCP Certified', auth: 'Hazard Analysis Critical Control Point', scope: 'Systematic preventive approach to food safety across biological and chemical hazards.' },
  fda: { name: 'FDA 21 CFR 177.1520', auth: 'US Food & Drug Administration', scope: 'Certified direct food contact compliant for olefin polymers and bulk consumable liquids.' },
  eufood: { name: 'EU Food Grade (10/2011)', auth: 'European Commission Migration Standard', scope: 'Verified specific migration limits (SML) for virgin food-contact flexitank liners.' },
  sgs: { name: 'SGS Approval', auth: 'Société Générale de Surveillance', scope: 'Independent third-party laboratory verification of physical and chemical integrity.' },
  kosher: { name: 'Kosher Certificate', auth: 'Rabbinical Council Audit', scope: 'Approved for kosher liquid transportation under strict rabbinical cleanliness supervision.' },
  halal: { name: 'Halal Certificate', auth: 'Islamic Chamber of Commerce & Halal Services', scope: 'Strict compliance with Islamic dietary packaging guidelines.' },
  heavymetal: { name: 'Heavy-Metal-Free', auth: 'RoHS / European Standard Verified', scope: 'Zero lead, cadmium, mercury, or hexavalent chromium in polymer formulation.' },
  phthalate: { name: 'Phthalate-Free Certificate', auth: 'REACH Compliance Certification', scope: 'Zero toxic plasticizers, guaranteeing non-leaching transport for sensitive cargoes.' },
  coa: { name: 'COA Rail Impact Test', auth: 'Container Owners Association / Lloyds Register', scope: 'Subjected to brutal dynamic rail impact testing exceeding international transport shocks.' },
  pas1008: { name: 'PAS 1008:2016 Compliant', auth: 'British Standards Institution (BSI)', scope: 'Governs design, material qualification, and performance tests for single-use flexitanks.' },
  wca: { name: 'World Cargo Alliance (WCA)', auth: 'WCAworld Global Membership', scope: 'Active member of world leading independent freight and logistics network.' }
};

const CERTS_DATA_AR = {
  iso9001: { name: 'ISO 9001:2015', auth: 'نظم إدارة الجودة', scope: 'ضمان اتساق عمليات التصنيع، ومنع العيوب، والتتبع الدقيق لتدقيق الجودة من حبيبات الراتنج الخام حتى إحكام الصمامات.' },
  iso14001: { name: 'ISO 14001:2015', auth: 'نظم الإدارة البيئية', scope: 'ممارسات تصنيع مستدامة، وتقليل النفايات الصناعية، ورفع كفاءة استهلاك الكربون عبر جميع العمليات.' },
  iso22000: { name: 'ISO 22000:2018', auth: 'نظم إدارة سلامة الغذاء', scope: 'معايير نظافة معتمدة لسلاسل التوريد الغذائي، وتصنيع في غرف معقمة، وضمانات لمنع تلوث السوائل السائبة.' },
  haccp: { name: 'شهادة HACCP', auth: 'تحليل المخاطر ونقاط التحكم الحرجة', scope: 'نهج وقائي منهجي لسلامة الأغذية يشمل المخاطر البيولوجية والكيميائية والفيزيائية.' },
  fda: { name: 'FDA 21 CFR 177.1520', auth: 'إدارة الغذاء والدواء الأمريكية', scope: 'اعتماد رسمي للملامسة المباشرة للأغذية لبوليمرات الأوليفين والمواد الاستهلاكية السائبة.' },
  eufood: { name: 'المعايير الغذائية الأوروبية (10/2011)', auth: 'معيار المفوضية الأوروبية لانتقال المواد', scope: 'توثيق واختبار حدود الانتقال النوعي (SML) لبطانات الفليكسي تانك الملامسة للأغذية.' },
  sgs: { name: 'اعتماد SGS العالمي', auth: 'الشركة العامة للمراقبة (SGS)', scope: 'فحوصات مخبرية مستقلة من طرف ثالث للتحقق من السلامة الفيزيائية والكيميائية للمنتجات.' },
  kosher: { name: 'شهادة كوشر (Kosher)', auth: 'تدقيق المجلس الحاخامي', scope: 'معتمد لنقل السوائل وفقاً لاشتراطات النظافة والإشراف الصارمة.' },
  halal: { name: 'شهادة حلال (Halal)', auth: 'الغرفة الإسلامية للتجارة وخدمات الحلال', scope: 'التزام تام بإرشادات التغليف والنقاء المتوافقة مع الشريعة الإسلامية.' },
  heavymetal: { name: 'خالٍ من المعادن الثقيلة', auth: 'معتمد وفقاً لمعايير RoHS الأوروبية', scope: 'انعدام تام للرصاص والكادميوم والزئبق والكروم سداسي التكافؤ في تركيب البوليمر.' },
  phthalate: { name: 'خالٍ من الفثالات والملدنات', auth: 'شهادة الامتثال لمعايير REACH', scope: 'صفر ملدنات سامة، مما يضمن نقلاً آمناً بدون أي ترشيح كيميائي للبضائع الحساسة.' },
  coa: { name: 'اختبار صدمات القطارات COA', auth: 'جمعية ملاك الحاويات / سجل لويدز', scope: 'خضع لاختبارات صدمات السكك الحديدية الديناميكية العنيفة متجاوزاً قوى الصدم الدولية.' },
  pas1008: { name: 'مطابق لمعيار PAS 1008:2016', auth: 'المعهد البريطاني للمعايير (BSI)', scope: 'يحكم معايير التصميم وتأهيل المواد واختبارات الأداء للفليكسي تانك أحادي الاستخدام.' },
  wca: { name: 'تحالف الشحن العالمي (WCA)', auth: 'عضوية WCAworld العالمية', scope: 'عضو نشط في أكبر شبكة مستقلة لخدمات الشحن واللوجستيات في العالم.' }
};

window.openCertModal = function(code) {
  const isAr = currentAppLang === 'ar';
  const data = isAr ? (CERTS_DATA_AR[code] || CERTS_DATA[code]) : CERTS_DATA[code];
  if (!data) return;

  const modal = document.getElementById('certDetailModal');
  document.getElementById('certTitle').textContent = data.name;
  document.getElementById('certAuth').textContent = data.auth;
  document.getElementById('certScope').textContent = data.scope;

  const certBadge = document.getElementById('certBadge');
  if (certBadge) {
    certBadge.textContent = isAr ? 'معيار معتمد وموثق' : 'VERIFIED STANDARD';
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeCertModal = function() {
  const modal = document.getElementById('certDetailModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProductModal();
    closeCertModal();
  }
});

function initModalBackdrops() {
  const prodModal = document.getElementById('productDetailModal');
  if (prodModal) {
    prodModal.addEventListener('click', (e) => {
      if (e.target === prodModal) closeProductModal();
    });
  }
  const certModal = document.getElementById('certDetailModal');
  if (certModal) {
    certModal.addEventListener('click', (e) => {
      if (e.target === certModal) closeCertModal();
    });
  }
}

/* ==========================================================================
   7. CARGO CALCULATOR ENGINE
   ========================================================================== */
function initCargoCalculator() {
  const cargoSelect = document.getElementById('calcCargoSelect');
  const volumeSlider = document.getElementById('calcVolumeSlider');
  const volumeDisplay = document.getElementById('calcVolumeDisplay');
  const volumeSub = document.getElementById('calcVolumeSub');
  const routeSelect = document.getElementById('calcRouteSelect');
  const presetBtns = document.querySelectorAll('.calc-preset-btn');

  const resContainers = document.getElementById('resContainers');
  const resFlexitank = document.getElementById('resFlexitank');
  const resValve = document.getElementById('resValve');
  const resHeating = document.getElementById('resHeating');

  const btnWhatsApp = document.getElementById('calcWhatsAppBtn');
  const btnEmail = document.getElementById('calcEmailBtn');

  if (!cargoSelect || !volumeSlider) return;

  function update() {
    const isAr = currentAppLang === 'ar';
    const volume = parseInt(volumeSlider.value, 10);
    volumeDisplay.textContent = isAr ? `${volume.toLocaleString()} لتر` : `${volume.toLocaleString()} L`;

    const cargo = cargoSelect.value;
    const capacityPerTank = cargo === 'bitumen' ? 20000 : 24000;
    const containers = Math.ceil(volume / capacityPerTank);

    if (volumeSub) {
      volumeSub.textContent = isAr ? `${containers} حاوية` : `${containers} FCL`;
    }

    resContainers.textContent = isAr ? `${containers} × حاوية 20 قدم` : `${containers} x 20ft FCL`;

    // Dynamic slider track fill with luxury blue gradient
    const min = parseInt(volumeSlider.min, 10) || 20000;
    const max = parseInt(volumeSlider.max, 10) || 480000;
    const pct = ((volume - min) / (max - min)) * 100;
    volumeSlider.style.background = `linear-gradient(to right, #1D4ED8 0%, #3B82F6 ${pct}%, rgba(255, 255, 255, 0.12) ${pct}%, rgba(255, 255, 255, 0.12) 100%)`;

    // Sync preset buttons active state
    presetBtns.forEach(btn => {
      const btnVol = parseInt(btn.getAttribute('data-vol'), 10);
      if (btnVol === volume) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    let model = isAr ? 'فليكسي تانك صناعي متعدد الطبقات (24K)' : 'BPS Industrial Multi-Layer (24K)';
    let valve = isAr ? 'صمام كروي كاملوك 3 بوصة' : '3" Camlock Ball Valve';
    let heating = isAr ? 'غير مطلوب' : 'Not Required';

    if (cargo === 'edible' || cargo === 'dairy') {
      model = isAr ? 'فليكسي تانك غذائي معقم EVOH (24K)' : 'BPS Food-Grade Aseptic EVOH (24K)';
      valve = isAr ? 'صمام فراشة صحي 3 بوصة' : '3" Sanitary Butterfly Valve';
    } else if (cargo === 'wine') {
      model = isAr ? 'فليكسي تانك النبيذ EVOH + بطانية عزل' : 'BPS Wine-Shield EVOH + Thermal Wrap';
      valve = isAr ? 'صمام صحي من الفولاذ المقاوم للصدأ' : 'Sanitary Stainless Steel Valve';
    } else if (cargo === 'bitumen') {
      model = isAr ? 'فليكسي تانك البيتومين 130°C حراري (20K)' : 'BPS Bitumen High-Heat 130°C Rated (20K)';
      valve = isAr ? 'صمام مركب مقاوم للحرارة العالية' : 'High-Temp Composite Valve';
      heating = isAr ? 'مطلوب نظام وسائد تسخين بالبخار' : 'Steam Heater Pad System Required';
    } else if (cargo === 'chemical') {
      model = isAr ? 'فليكسي تانك الكيماويات عالي التحمل (24K)' : 'BPS Heavy Chemical Multi-Ply (24K)';
      valve = isAr ? 'صمام كاملوك مقاوم للمواد الكيميائية' : 'Chemical-Resistant Camlock';
    }

    resFlexitank.textContent = model;
    resValve.textContent = valve;
    resHeating.textContent = heating;

    // WhatsApp formatting
    const cargoText = cargoSelect.options[cargoSelect.selectedIndex].text;
    const routeText = routeSelect.options[routeSelect.selectedIndex].text;
    const waText = encodeURIComponent(
      isAr 
        ? `مرحباً بي بي إس جلوبال تريدينج،\n\nأرغب في الحصول على عرض أسعار:\n• نوع السائل: ${cargoText}\n• الحجم الإجمالي: ${volume.toLocaleString()} لتر (~${containers} حاوية)\n• مسار الشحن: ${routeText}\n• طراز الفليكسي تانك: ${model}\n• الصمام: ${valve}\n• نظام التسخين: ${heating}\n\nيرجى تأكيد توفر المخزون في دبي.`
        : `Hello BPS Global Trading,\n\nI need a quote:\n• Cargo: ${cargoText}\n• Total Volume: ${volume.toLocaleString()} L (~${containers} Containers)\n• Trade Route: ${routeText}\n• Flexitank Model: ${model}\n• Valve: ${valve}\n• Heating: ${heating}\n\nPlease confirm stock in Dubai.`
    );
    btnWhatsApp.href = `https://wa.me/971506718052?text=${waText}`;

    // Email formatting
    const emailSubject = encodeURIComponent(
      isAr 
        ? `طلب تسعير BPS: ${volume.toLocaleString()} لتر ${cargoText}`
        : `BPS Quote Request: ${volume.toLocaleString()}L ${cargoText}`
    );
    const emailBody = encodeURIComponent(
      isAr
        ? `السادة فريق مبيعات بي بي إس جلوبال تريدينج المحترمون،\n\nيرجى تزويدنا بعرض أسعار لشحنة السوائل السائبة التالية:\n\nنوع السائل: ${cargoText}\nالحجم التقديري: ${volume.toLocaleString()} لتر\nعدد الحاويات المطلوبة: ${containers} حاوية 20 قدم\nمسار الشحن: ${routeText}\n\nاسم الشركة:\nمسؤول التواصل:\nرقم الهاتف:\n\nشاكرين ومقدرين تعاونكم.`
        : `Dear BPS Global Trading Sales Team,\n\nPlease provide a quote for the following bulk liquid shipment:\n\nCargo Type: ${cargoText}\nEstimated Volume: ${volume.toLocaleString()} Litres\nRequired 20ft Containers: ${containers} FCL\nTrade Route: ${routeText}\n\nCompany Name:\nContact Person:\nPhone Number:\n\nThank you.`
    );
    btnEmail.href = `mailto:sales@bpsglobaltrading.com?subject=${emailSubject}&body=${emailBody}`;
  }

  // Quick Preset Clicks
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const vol = btn.getAttribute('data-vol');
      if (vol) {
        volumeSlider.value = vol;
        update();
      }
    });
  });

  cargoSelect.addEventListener('change', update);
  volumeSlider.addEventListener('input', update);
  routeSelect.addEventListener('change', update);

  update();
}

/* ==========================================================================
   8. FAQ CATEGORY FILTERING
   ========================================================================== */
function initFaqFilters() {
  const filterBtns = document.querySelectorAll('.faq-filter-btn');
  const faqCards = document.querySelectorAll('.faq-card');

  if (!filterBtns.length || !faqCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      faqCards.forEach(card => {
        const cat = card.getAttribute('data-cat');
        if (filterValue === 'all' || cat === filterValue) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   9. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const drawer = document.getElementById('mobileNavDrawer');
  const overlay = document.getElementById('mobileNavOverlay');
  const closeBtn = document.getElementById('mobileNavClose');
  const navLinks = drawer.querySelectorAll('.mobile-nav-item, .mobile-drawer-quote-btn, .mobile-wa-btn');

  if (!toggleBtn || !drawer) return;

  function openDrawer() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  navLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/* ==========================================================================
   10. MOBILE FLOATING ACTION DOCK
   ========================================================================== */
function initMobileFloatingBar() {
  const bar = document.getElementById('mobileFloatingBar');
  if (!bar) return;

  function handleScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollY > 280) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-item-link');

  function onScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Header compact glass elevation on scroll
    if (header) {
      if (scrollY > 25) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // Scroll spy for navigation
    let currentId = '';
    const scrollPos = scrollY + 140;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    if (currentId) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${currentId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ==========================================================================
   11. BILINGUAL LANGUAGE SWITCHER (ENGLISH / ARABIC WITH RTL SUPPORT)
   ========================================================================== */
const BPS_I18N = {
  en: {
    dir: 'ltr',
    brandSub: 'Bulk Liquid Packaging & Logistics',
    navBrandTitle: 'BPS Global Trading',
    navBrandSub: 'Bulk Liquid Packaging & Logistics',
    liveClockDisplay: 'DXB GST (UTC+4)',
    navHome: 'Home',
    navAbout: 'About Us',
    navProducts: 'Products',
    navServices: 'Services & Process',
    navRfq: 'RFQ & Calculator',
    navGlobal: 'Global Reach',
    navFaq: 'FAQ',
    navContact: 'Contact',
    btnRfqDesk: 'RFQ Desk',

    // Hero & Hero Widget
    heroEyebrow: 'BPS GLOBAL TRADING — DIRECT MANUFACTURER & INSTALLATION',
    heroHeadline: 'Bulk liquids,<br><span class="hero-orange-glow">moved with precision.</span>',
    heroDesc: 'We manufacture high-integrity flexitank bags and accessories, providing certified on-site container installation services across major global trade corridors.',
    btnHeroRfq: 'Request Quote & Installation',
    btnHeroExplore: 'Explore Manufactured Range',
    btnHeroWa: 'WhatsApp Desk',
    widgetEyebrow: 'GLOBAL LOGISTICS NETWORK',
    widgetMainTitle: 'CONNECTING TRADE LANES<br>& 60+ COUNTRIES',
    widgetLivePill: 'TRADE CORRIDORS',
    telemLabel1: 'Cargo Standard:',
    telemVal1: 'Non-Hazardous Liquids',
    telemLabel2: 'Logistics Desk:',
    telemVal2: 'Fast RFQ & Support',

    // Stats Strip
    statDesc1: 'Countries<br>Supplied Worldwide',
    statDesc2: 'Years of Manufacturing<br>Leadership',
    statDesc3: 'Manufacturer of Bags<br>& Accessories',
    statDesc4: 'Certified Container<br>Installation Service',

    // Products Section
    prodEyebrow: 'ENGINEERED BULK PACKAGING RANGE',
    prodHeading: 'Direct Factory Flexitank Systems',
    prodFilterAll: 'All Solutions',
    prodFilterInd: 'Industrial & Chemical',
    prodFilterFood: 'Food & Beverage',
    prodFilterSpec: 'High-Temp & Specialty',

    // 7 Product Cards
    prodBadge1: 'HEAVY INDUSTRIAL',
    prodTitle1: 'Industrial Grade Flexitanks',
    prodTagline1: 'Engineered for Non-Hazardous Bulk Chemicals & Oils',
    prodDesc1: 'Multi-layer co-extruded polyethylene flexitank with high-tensile polypropylene outer jacket. Designed to fit standard 20ft shipping containers for base oils, lubricants, plasticizers, and process fluids.',
    prodCap1: 'Capacity: 14,000L – 24,000L',
    prodLink1: 'Technical Matrix & Options →',

    prodBadge2: 'FOOD & PHARMA GRADE',
    prodTitle2: 'Food-Grade Flexitanks',
    prodTagline2: 'FDA & ISO 22000 Certified for Edible Cargo',
    prodDesc2: 'Cleanroom manufactured with virgin food-grade polyethylene resins. Zero organoleptic migration, certified kosher and halal compatible. Ideal for sunflower, palm, olive oils, and glucose.',
    prodCap2: 'Capacity: 16,000L – 24,000L',
    prodLink2: 'Food Safety Protocols →',

    prodBadge3: 'OXYGEN SENSITIVE',
    prodTitle3: 'EVOH High-Barrier Flexitanks',
    prodTagline3: 'Advanced EVOH Gas Barrier Membrane',
    prodDesc3: 'Incorporates specialized ethylene-vinyl alcohol (EVOH) copolymer layers with ultra-low oxygen transmission rates (<0.5 cc/m²·day). Prevents oxidation and flavor deterioration for bulk wine, juices, and specialty oils.',
    prodCap3: 'Capacity: 18,000L – 24,000L',
    prodLink3: 'Gas Barrier Specs →',

    prodBadge4: 'EXTREME HEAT RATED',
    prodTitle4: 'High-Temperature Bitumen Flexitanks',
    prodTagline4: 'Thermal Stability up to 130°C Loading',
    prodDesc4: 'Heavy-gauge reinforced polymer construction engineered to withstand high-temperature filling of liquid asphalt, penetration grade bitumen, and paraffin wax. Complete with integrated steam/hot-water heating pads.',
    prodCap4: 'Capacity: 20,000L – 22,000L',
    prodLink4: 'Bitumen Thermal System →',

    prodBadge5: 'TRUCK / TRAILER COMPATIBLE',
    prodTitle5: 'Trailer & Truck Flexitanks (T-Flex)',
    prodTagline5: 'Convert Standard Curtainsiders & Box Trailers',
    prodDesc5: 'Turn standard 13.6m curtainside trailers and box trucks into intermodal bulk liquid haulers. Reduces deadhead empty runs and transforms road freight economics across GCC and Middle East overland corridors.',
    prodCap5: 'Capacity: 18,000L – 24,000L',
    prodLink5: 'Road Haulage Configuration →',

    prodBadge6: 'PALLETIZED INTERMODAL',
    prodTitle6: 'Liquid IBC Liner Bags',
    prodTagline6: 'Hygienic Liners for Rigid & Collapsible IBCs',
    prodDesc6: 'Aseptic and standard liquid liner bags fitting 1,000-liter intermediate bulk containers, plastic totes, and folding steel IBCs. Eliminates container cleaning and cross-contamination risks entirely.',
    prodCap6: 'Capacity: 1,000L – 1,200L',
    prodLink6: 'IBC Liner Technical Guide →',

    prodBadge7: 'BPS MANUFACTURED ACCESSORIES',
    prodTitle7: 'Bulkheads, Heating Pads & Accessories',
    prodTagline7: 'Factory-Engineered Hardware for Zero-Risk Transit',
    prodDesc7: 'High-strength structural steel bulkheads, automatic air release vents, thermal heating pads for steam/hot water, and multi-layer thermal foil insulation blankets. Manufactured in-house under strict ISO 9001 compliance.',
    prodCap7: 'Full Hardware Range',
    prodLink7: 'Accessory Specifications →',
    prodBtnAll: 'Explore Manufactured Hardware & Accessories →',

    // Global Reach
    reachEyebrow: 'OPERATIONAL FOOTPRINT & TRADE CORRIDORS',
    reachTitle: 'Connecting Global Chemical & Commodity Corridors',
    reachDesc: 'From manufacturing facilities in India to regional coordination from Dubai and Jebel Ali, BPS delivers flexible container packaging solutions across 60+ countries on five continents.',
    reachSubdesc: 'Our logistics desk in Dubai ensures seamless port-to-port technical support, emergency installation crews, and inventory replenishment across Middle East, Mediterranean, Asian, and African maritime hubs.',
    reachMetricNum1: '60+',
    reachMetricLbl1: 'Countries Supplied',
    reachMetricNum2: '100%',
    reachMetricLbl2: 'Pressure Proof Testing',
    reachMetricNum3: '25+',
    reachMetricLbl3: 'Years Manufacturing',
    reachBtnText: 'Request Route Quotation',
    mapHudStatus: 'ACTIVE DISPATCH',
    mapHudCount: '60+ Global Hubs',
    mapStatusLabel: 'Coordinated Supply & Fitting from Dubai',

    // About Us
    aboutCleanEyebrow: 'ABOUT BPS GLOBAL TRADING',
    aboutCleanHeadline: 'Pioneering bulk liquid logistics with precision, safety, and scale.',
    aboutLead: 'BPS Global Trading is a premier international distributor and logistics solutions provider for containerized bulk liquid transport. Operating through a strategic presence in Dubai and partnered directly with certified manufacturing facilities in India, we supply high-integrity flexitank systems to chemical producers, agribusiness giants, and freight forwarders across 60+ countries.',
    aboutP2: 'Unlike conventional trading intermediaries, we control our entire value chain: from multi-layer polymer extrusion and cleanroom fabrication to structural bulkhead engineering, on-site container inspection, and destination technical support.',
    aboutFeatTitle1: 'Cleanroom Manufacturing',
    aboutFeatDesc1: 'Fabricated in ISO 22000 cleanroom environments using 100% virgin food-grade resins.',
    aboutFeatTitle2: 'On-Site Installation Crews',
    aboutFeatDesc2: 'Certified technical teams deploy at your loading terminal to inspect, fit, and secure containers.',
    aboutFeatTitle3: 'Custom Layer Engineering',
    aboutFeatDesc3: 'Tailored polymer formulations with EVOH barriers for oxygen-sensitive or reactive liquids.',
    aboutFeatTitle4: 'Jebel Ali Regional Hub',
    aboutFeatDesc4: 'Strategically positioned inventory and rapid response dispatch for Middle East and worldwide trade.',
    aboutBtnQuote: 'Consult Our Engineering Desk',
    aboutDarkTitle1: 'Direct Manufacturer Advantage',
    aboutDarkDesc1: 'Direct from production lines to your loading dock—eliminating unnecessary middleman markups.',
    aboutDarkTitle2: '9-Point Container Pre-Inspection',
    aboutDarkDesc2: 'Every container undergoes rigorous wall, floor, corner-post, and door-lock structural validation.',
    aboutDarkTitle3: 'Zero Residual Cargo Evacuation',
    aboutDarkDesc3: 'Fluted bottom-valve designs minimize heel, recovering >99.6% of your valuable bulk cargo.',
    aboutDarkTitle4: 'Complete Global Traceability',
    aboutDarkDesc4: 'Each flexitank bears unique serial identification linked to resin batch QA records.',

    // Why BPS
    whyBpsLabel: 'WHY INDUSTRY LEADERS TRUST BPS GLOBAL',
    whyTitle1: 'Complete Quality Control',
    whyDesc1: 'From virgin resin pellet inspection to 3D impact testing, every flexitank meets strict COA guidelines.',
    whyTitle2: 'Turnkey Installation Services',
    whyDesc2: "Don't risk improper fitting. Our certified mobile crews inspect containers and install flexitanks on-site.",
    whyTitle3: 'Cost Efficiency & Payload Max',
    whyDesc3: 'Up to 40% more payload than 55-gal drums and 15% more than standard IBCs, with zero empty return freight.',
    whyTitle4: 'Strategic Dubai Logistics',
    whyDesc4: 'Operating from Dubai gives our partners rapid dispatch, trade financing stability, and multi-hub agility.',

    // Industries We Serve
    industriesBarTitle: 'COMMODITIES & LIQUIDS EXPERTISE',
    indCrop1: 'Base Oils & Lubes',
    indCrop2: 'Edible & Palm Oils',
    indCrop3: 'Liquid Chemicals',
    indCrop4: 'Wine & Beverages',
    indCrop5: 'Liquid Bitumen',
    indCrop6: 'Biodiesel & Feedstock',
    indCrop7: 'Glycerin & Glycol',
    indCrop8: 'Liquid Fertilizers',
    indCrop9: 'Wax & Paraffins',
    indCrop10: 'Food Concentrates',
    indCrop11: 'Detergents & Surfactants',

    // Certifications & Sustainability
    certsHeading: 'International Standards & Quality Assurances',
    certsDesc: 'Every BPS flexitank system complies with stringent international maritime, rail, and food safety standards.',
    sustHeading: 'Sustainable Logistics: 100% Recyclable Polymers',
    sustDesc: 'Compared to rigid steel drums and intermediate bulk containers (IBCs), BPS flexitanks cut empty container repositioning emissions and minimize carbon footprints by up to 35% per metric ton of bulk liquid transported.',
    sustPoint1: '100% Recyclable virgin PE and PP materials',
    sustPoint2: 'Zero return freight emissions (one-way transit model)',
    sustPoint3: 'Up to 40% payload increase vs standard 200L drums',
    sustPoint4: 'Zero washwater discharge — eliminates environmental runoff',
    sustLeafTagText: 'ECO EFFICIENCY',

    // Services & Process
    servicesHeading: 'Comprehensive Bulk Packaging Services',
    servicesDesc: 'From container pre-inspection and fitting to technical advisory and cargo recovery, BPS delivers end-to-end operational support.',
    svcTitle1: 'Turnkey Container Fitting',
    svcTitle2: 'Technical Route Advisory',
    svcTitle3: 'High-Temp Discharge Support',
    svcTitle4: 'Custom OEM Engineering',
    svcTitle5: 'Emergency Spill Prevention',
    svcTitle6: 'Multi-Modal Intermodal Solutions',
    processHeading: 'Standard 6-Step Fitting & Transit Workflow',
    processDesc: 'Every container fitted by BPS follows our certified 6-step SOP to guarantee cargo safety from origin to destination.',
    stepLabel1: '9-Point Container Inspection',
    stepLabel2: 'Protective Lining Placement',
    stepLabel3: 'Flexitank Positioning',
    stepLabel4: 'Bulkhead Steel Securing',
    stepLabel5: 'Controlled Loading Protocol',
    stepLabel6: 'Seal & Container Dispatch',

    // Traditional RFQ Form
    enqHeaderEyebrow: 'TRADITIONAL RFQ & CARGO ENQUIRY',
    enqHeaderHeadline: 'Flexitank Cargo Enquiry & Quotation',
    enqHeaderSubtitle: 'Submit your port-to-port parameters, cargo properties, and technical flexitank specifications for a prompt formal proposal from our logistics engineering desk.',
    labelModeTraditional: 'Traditional Enquiry Form',
    labelModeEstimator: 'Quick Estimator',
    legendContact: 'Shipper & Contact Information',
    lblFullName: 'Full Name / Contact Person',
    lblCompany: 'Company / Organization',
    lblEmail: 'Corporate Email',
    lblPhone: 'Phone / WhatsApp Number',
    legendRoute: 'Trade Corridor & Sailing Schedule',
    lblPortFrom: 'From Country / Port of Loading',
    lblPortTo: 'To Country / Port of Discharge',
    lblSailingDate: 'Estimated Date of Sailing / Readiness',
    lblEstVolume: 'Estimated Volume / Containers',
    legendCargo: 'Type of Cargo (Liquid Commodity)',
    lblCargoType: 'Liquid Commodity',
    lblDensity: 'Specific Gravity / Density',
    lblLoadingTemp: 'Loading Temp (°C)',
    legendSpecs: 'Technical Flexitank Engineering',
    lblValveType: 'Type of Valve Fixing',
    lblLayers: 'Number of Layers',
    lblBulkhead: 'Bulkhead Securing',
    legendAddons: 'Manufactured Accessories & Installation Services',
    txtHeatPadTitle: 'Heating Pad (Manufactured by BPS)',
    txtHeatPadDesc: 'For high-viscosity discharge (wax, palm oil, heavy syrups).',
    txtVentTitle: 'Automatic Air Release Valve (BPS Made)',
    txtVentDesc: 'Automatic pressure release for fermenting / outgassing liquids.',
    txtThermalTitle: 'Thermal Container Insulation Liner (BPS Made)',
    txtThermalDesc: 'Protects temperature-critical cargo across cold / desert routes.',
    txtPaperTitle: 'Floor & Wall Protection Kraft Paper',
    txtPaperDesc: 'Heavy corrugated kraft paper protecting container interior.',
    txtFittingTitle: 'On-Site Technical Fitting & Installation Service',
    txtFittingDesc: 'Certified BPS technical teams dispatched to inspect and fit containers.',
    txtInsuranceTitle: 'Marine Cargo Insurance',
    txtInsuranceDesc: 'Tailored ocean bulk liquid cargo insurance policy.',
    legendNotes: 'Special Instructions & Handling Notes',
    rfqBadge: 'CARGO SPECIFICATION SUMMARY',
    rfqTitle: 'RFQ Manifest',
    lblSummRoute: 'Route:',
    lblSummSailing: 'Sailing Date:',
    lblSummCargo: 'Cargo Type:',
    lblSummVolume: 'Containers:',
    lblSummValve: 'Valve Fixing:',
    lblSummLayers: 'Layers:',
    lblSummBulkhead: 'Bulkhead:',
    lblSummAddons: 'Accessories:',
    txtSubmitEnquiry: 'Submit Official Enquiry',
    txtWaEnquiry: 'Send via WhatsApp Desk',
    txtEmailEnquiry: 'Request Email RFQ',
    modalSuccessTitle: 'Enquiry Submitted Successfully',
    modalSuccessDesc: 'Thank you for your bulk liquid cargo enquiry. Our logistics engineering team has received your technical parameters and will prepare a certified quotation within 2 business hours.',
    btnModalSuccessClose: 'Return to Overview',

    // Quick Estimator
    lblCalcStep1: 'Select Cargo Commodity',
    lblCalcStep2: 'Destination Trade Corridor',
    lblCalcStep3: 'Total Cargo Volume',
    lblCalcPresets: 'Presets:',
    lblCalcResTag: 'OPTIMIZED ESTIMATE',
    lblCalcSpec1: 'Flexitank Model:',
    lblCalcSpec2: 'Discharge Valve:',
    lblCalcSpec3: 'Heating System:',
    lblCalcBtnWa: 'Instant WhatsApp Quote',
    lblCalcBtnEmail: 'Request Official Email RFQ',

    // FAQ (Sidebar & 10 Questions)
    faqEyebrow: 'FREQUENTLY ASKED QUESTIONS',
    faqTitle: 'Technical & Operational Guidance',
    faqTabAll: 'All Questions',
    faqTabTech: 'Technical & Specs',
    faqTabFood: 'Food & Wine',
    faqTabSafety: 'Safety & Compliance',
    faqTabSpecs: 'Manufacturing & Services',
    faqSupportTitle: 'Need a Technical Consultation?',
    faqSupportDesc: 'Our container logistics team in Dubai can evaluate your liquid compatibility, calculate heating pad wattage, and dispatch on-site fitting crews.',
    faqBtnWhatsApp: 'WhatsApp Logistics Desk',
    faqBtnContact: 'Contact Engineering',

    faqCat1: 'CONTAINER COMPATIBILITY',
    faqQ1: 'What containers are compatible with BPS flexitanks?',
    faqA1: 'BPS flexitanks are engineered specifically for standard 20-foot dry van ocean containers rated for 30,000 kg gross mass or higher. The container must meet the Container Owners Association (COA) criteria: under 5 years old, free of interior structural damage, corrugated steel side walls without excessive bowing, clean hardwood floorboards without protruding nails or splinters, and fully operational locking gear on both cargo doors. Our technical teams perform a comprehensive 9-point pre-fit inspection on every container before installation.',

    faqCat2: 'VALVE ENGINEERING',
    faqQ2: 'What valve sizes and discharge mechanisms are offered?',
    faqA2: 'We supply 2-inch and 3-inch high-flow integrated ball and butterfly valves fitted with quick-connect male Camlock adapters (MIL-C-27487 / A-A-59326 standard) and secure secondary safety locking pins. Valve bodies are molded from food-grade glass-filled polypropylene or chemical-resistant fluoropolymer resins with Teflon (PTFE) or Viton sealing gaskets to ensure zero dripping, zero vacuum cavitation, and seamless connection to commercial centrifugal or positive displacement cargo pumps.',

    faqCat3: 'QUALITY & COA',
    faqQ3: 'What certifications and impact tests back your flexitanks?',
    faqA3: 'All BPS flexitank systems comply with ISO 9001:2015 (Quality), ISO 14001:2015 (Environmental), and ISO 22000:2018 / HACCP (Food Safety). Every design variant has passed rigorous Container Owners Association (COA) dynamic rail impact testing at verified test facilities—exceeding 2.6G longitudinal deceleration forces without seam failure, valve leakage, or bulkhead distortion. They also comply with PAS 1008:2016 and U.S. FDA 21 CFR 177.1520 direct food contact regulations.',

    faqCat4: 'OXYGEN BARRIER',
    faqQ4: 'How do EVOH barrier layers prevent wine and juice oxidation?',
    faqA4: 'Our premium wine and beverage flexitanks incorporate a specialized co-extruded ethylene-vinyl alcohol (EVOH) copolymer film sandwiched between virgin polyethylene layers. EVOH provides an exceptional barrier against gas permeation, keeping oxygen transmission rates (OTR) under 0.5 cc/m²·24h at 23°C / 65% RH. This effectively halts oxidation, prevents volatile aroma loss, shields cargo from external cross-odor contamination, and preserves vintage organoleptic profiles across voyages exceeding 45 days at sea.',

    faqCat5: 'FOOD SAFETY',
    faqQ5: 'Are your flexitanks food-grade, Halal, and Kosher certified?',
    faqA5: 'Yes. Our food-grade flexitanks are manufactured in positive-pressure cleanroom facilities following strict Good Manufacturing Practice (GMP) protocols. We use 100% virgin, unplasticized, heavy-metal-free resins compliant with FDA 21 CFR 177.1520 and EU Regulation 10/2011 for direct aqueous, acidic, and fatty food contact. Every production batch is certified Kosher and Halal by accredited supervisory authorities, and each bag is individually sanitized, sealed, and traceable by unique serial number.',

    faqCat6: 'INSTALLATION SERVICES',
    faqQ6: 'Can BPS provide professional on-site container fitting and technical installation?',
    faqA6: 'Yes. We don’t just manufacture the packaging—we deploy certified mobile fitting crews directly to your terminal, refinery, factory, or depot. Our technicians handle container selection verification, cardboard/corrugated liner roll-out, flexitank positioning, bulkhead steel bracing alignment, and valve stabilization. We also oversee the initial loading pump calibration to ensure correct filling speed, air bleeding, and ullage management.',

    faqCat7: 'BULKHEAD ENGINEERING',
    faqQ7: 'What bulkhead securing systems do you manufacture?',
    faqA7: 'We engineer and fabricate one-piece structural corrugated steel bulkheads as well as modular tubular steel beam systems with integrated composite honeycomb retention boards. Both configurations lock rigidly into the container’s corner post slots without welding or puncturing the container walls. Engineered to withstand over 30 metric tons of dynamic hydraulic surge during sea-state rolling, pitching, and harsh rail braking.',

    faqCat8: 'THERMAL DISCHARGE',
    faqQ8: 'How do you handle viscous or high-temperature liquids like bitumen and palm oil?',
    faqA8: 'For liquids that solidify or gain high viscosity during oceanic transit (palm oil, tallow, fatty acids, paraffin wax), we supply factory-fitted low-profile steam or hot water heating pads placed beneath the flexitank. Connected to your boiler or mobile steam generator at discharge, they liquefy cargo in 4–8 hours without hot spots or scorching. For liquid asphalt and penetration bitumen, we manufacture specialized high-temperature flexitanks capable of continuous filling up to 130°C.',

    faqCat9: 'LOGISTICS & SUPPLY',
    faqQ9: 'How are stock dispatches coordinated from Dubai and Jebel Ali?',
    faqA9: 'Our commercial and regional operations desk in Dubai maintains buffer stocks of popular 24,000L industrial, food-grade, and heating pad configurations in key logistical hubs including Jebel Ali Free Zone. This enables fast dispatch to shippers across the UAE, Saudi Arabia, Oman, Bahrain, Kuwait, Egypt, and wider MENA/CIS corridors within 24 to 48 hours, supported by full export shipping documentation and certificate of analysis packages.',

    faqCat10: 'MANUFACTURING & INSTALLATION',
    faqQ10: 'Do you manufacture the flexitank bags and accessories, and provide installation services?',
    faqA10: 'Yes, absolutely. We manufacture all flexitank bags and accompanying accessories in-house—including structural steel bulkheads, thermal heating pads, multi-layer foil insulation liners, and automatic air release vents—at our dedicated production facilities (BPS Flexitanks Private Limited in Cochin, India). In addition to direct factory supply, our certified technical teams provide turnkey on-site container 9-point inspection, bulkhead fitting, and flexitank installation services at your depot or terminal to guarantee 100% leak-free maritime transit.',

    // Footer & Final CTA
    footerEyebrow: 'PARTNER WITH BPS GLOBAL',
    footerCtaHeadline: 'Your Trusted Partner in<br><span class="footer-headline-gradient" id="footerCtaHeadlineGrad">Bulk Liquid Transport.</span>',
    footerCtaHeadlineGrad: 'Bulk Liquid Transport.',
    footerCtaDesc: 'Whether you’re shipping industrial base oils, specialty chemicals, certified food-grade edible oils, high-temp bitumen, or bulk wine, BPS delivers precision-engineered flexitanks, on-site technical fitting, and guaranteed manufacturer warranty.',
    footerBtnQuote: 'GET A QUOTE',
    footerBtnContact: 'CONTACT BPS',
    footerBtnWa: 'WhatsApp Desk',
    footerCardBadge: 'DUBAI REGIONAL OFFICE & LOGISTICS DESK',
    contactEntityAddress: 'Bin Dasmal Building, Al Quoz Industrial First<br>P.O. Box 282559, Dubai – United Arab Emirates',
    contactEntityPhoneTitle: 'Direct Operations & 24/7 WhatsApp',
    contactEntityEmailTitle: 'Commercial & RFQ Correspondence',
    footerStockStatus: 'Coordinated Regional Supply & Technical Fitting from Jebel Ali & Dubai',
    footerCopyright: '© 2026 <strong>BPS Global Trading</strong>. All rights reserved.',
    footerAccreditation: 'Manufacturer of Flexitank Bags & Accessories • Turnkey On-Site Installation Services • ISO 9001 · 14001 · 22000 Certified',

    // Mobile Floating Dock & Modals
    waFloatSpan: 'WhatsApp Desk',
    rfqFloatSpan: 'Instant Quote',
    modalSpecsTitle: 'Technical Engineering Matrix',
    modalBtnConfigure: 'Configure This Flexitank',
    modalBtnChat: 'Chat with Dubai Stockist',
    certBadge: 'VERIFIED STANDARD'
  },

  ar: {
    dir: 'rtl',
    brandSub: 'تغليف ولوجستيات السوائل السائبة',
    navBrandTitle: 'بي بي إس جلوبال تريدينج',
    navBrandSub: 'تغليف ولوجستيات السوائل السائبة',
    liveClockDisplay: 'دبي GST (UTC+4)',
    navHome: 'الرئيسية',
    navAbout: 'من نحن',
    navProducts: 'المنتجات',
    navServices: 'الخدمات والعمليات',
    navRfq: 'طلب عرض أسعار',
    navGlobal: 'شبكتنا العالمية',
    navFaq: 'الأسئلة الشائعة',
    navContact: 'اتصل بنا',
    btnRfqDesk: 'مكتب التسعير',

    // Hero & Hero Widget
    heroEyebrow: 'بي بي إس جلوبال تريدينج — تصنيع مباشر وخدمات تركيب معتمدة',
    heroHeadline: 'نقل السوائل السائبة<br><span class="hero-orange-glow">بدقة واحترافية متناهية.</span>',
    heroDesc: 'نقوم بتصنيع أكياس الفليكسي تانك وجميع الملحقات، مع تقديم خدمات تركيب وتجهيز الحاويات في الموقع بموثوقية تامة عبر أكثر من 60 دولة.',
    btnHeroRfq: 'طلب عرض أسعار وتركيب',
    btnHeroExplore: 'استكشف منتجاتنا المصنعة',
    btnHeroWa: 'مكتب واتساب',
    widgetEyebrow: 'شبكة لوجستية عالمية',
    widgetMainTitle: 'ربط ممرات الشحن<br>وأكثر من 60 دولة',
    widgetLivePill: 'ممرات الشحن المباشرة',
    telemLabel1: 'معايير البضائع:',
    telemVal1: 'سوائل سائبة غير خطرة',
    telemLabel2: 'المكتب اللوجستي:',
    telemVal2: 'تسعير سريع ودعم فني',

    // Stats Strip
    statDesc1: 'دولة يتم التوريد إليها<br>حول العالم',
    statDesc2: 'عاماً من الريادة<br>والتفوق الصناعي',
    statDesc3: 'تصنيع مباشر للأكياس<br>وكافة الملحقات',
    statDesc4: 'خدمات تركيب وتجهيز<br>الحاويات المعتمدة',

    // Products Section
    prodEyebrow: 'مجموعة حلول تغليف السوائل السائبة الهندسية',
    prodHeading: 'أنظمة فليكسي تانك من المصنع مباشرة',
    prodFilterAll: 'جميع الحلول',
    prodFilterInd: 'صناعي وكيميائي',
    prodFilterFood: 'أغذية ومشروبات',
    prodFilterSpec: 'حرارة عالية وتطبيقات خاصة',

    // 7 Product Cards
    prodBadge1: 'صناعي ثقيل',
    prodTitle1: 'فليكسي تانك للأغراض الصناعية',
    prodTagline1: 'مصمم للمواد الكيميائية والزيوت غير الخطرة',
    prodDesc1: 'فليكسي تانك متعدد الطبقات من البولي إيثيلين مع غلاف خارجي من البولي بروبيلين عالي المتانة. مصمم خصيصاً ليناسب حاويات الشحن قياسية 20 قدماً للزيوت الأساسية ومواد التشحيم والمذيبات والمواد الكيميائية غير الخطرة.',
    prodCap1: 'السعة: 14,000 – 24,000 لتر',
    prodLink1: 'المصفوفة والمواصفات الفنية ←',

    prodBadge2: 'درجة غذائية ودوائية معتمدة',
    prodTitle2: 'فليكسي تانك للمواد الغذائية',
    prodTagline2: 'معتمد من إدارة الغذاء والدواء وISO 22000 للزيوت والأغذية',
    prodDesc2: 'يتم تصنيعه داخل غرف بيئة معقمة باستخدام راتنجات بولي إيثيلين نقية 100%. بدون أي تأثير على الرائحة أو الطعم، متوافق مع اشتراطات حلال وحاصل على شهادات الجودة الغذائية. مثالي لزيوت عباد الشمس والنخيل والزيتون والجلوكوز.',
    prodCap2: 'السعة: 16,000 – 24,000 لتر',
    prodLink2: 'بروتوكولات السلامة الغذائية ←',

    prodBadge3: 'حساس للأكسجين',
    prodTitle3: 'فليكسي تانك EVOH عالي العزل',
    prodTagline3: 'غشاء متطور بتقنية EVOH لمنع نفاذ الأكسجين',
    prodDesc3: 'مدمج بطبقات متطورة من بوليمر EVOH مع معدل نفاذية أكسجين شبه منعدم (<0.5 سم³/م²·يوم). يحمي من الأكسدة وتغير النكهة لنقل النبيذ والمشروبات السائبة وعصائر الفواكه والزيوت الحساسة.',
    prodCap3: 'السعة: 18,000 – 24,000 لتر',
    prodLink3: 'مواصفات عزل الغازات ←',

    prodBadge4: 'مقاوم للحرارة القصوى',
    prodTitle4: 'فليكسي تانك البيتومين والأسفلت',
    prodTagline4: 'ثبات حراري حتى درجة حرارة تحميل 130°C',
    prodDesc4: 'تصميم بوليمري مدعم بسماكة عالية مصمم خصيصاً لتحمل تعبئة الأسفلت السائل والبيتومين والشمع البرافيني بدرجات حرارة عالية. مزود بوسائد تسخين بالبخار والماء الساخن لتسهيل التفريغ السريع.',
    prodCap4: 'السعة: 20,000 – 22,000 لتر',
    prodLink4: 'أنظمة البيتومين الحرارية ←',

    prodBadge5: 'متوافق مع الشاحنات والمقطورات',
    prodTitle5: 'فليكسي تانك الشاحنات والمقطورات (T-Flex)',
    prodTagline5: 'تحويل شاحنات الستائر والصناديق لنقل السوائل',
    prodDesc5: 'تحويل مقطورات الستائر والشاحنات الصندوقية العادية بطول 13.6 متراً إلى ناقلات سوائل سائبة فورية. يقضي على رحلات العودة الفارغة ويوفر تكاليف النقل البري في دول الخليج والشرق الأوسط.',
    prodCap5: 'السعة: 18,000 – 24,000 لتر',
    prodLink5: 'تكوين النقل البري ←',

    prodBadge6: 'مناولة بالمنصات والرافعات',
    prodTitle6: 'أكياس بطانات حاويات IBC السائلة',
    prodTagline6: 'بطانات صحية لحاويات IBC الصلبة والقابلة للطي',
    prodDesc6: 'أكياس بطانات معقمة وقياسية تناسب حاويات IBC سعة 1,000 لتر والصناديق الفولاذية القابلة للطي. تلغي الحاجة لغسيل الحاويات وتمنع مخاطر التلوث التبادلي تماماً.',
    prodCap6: 'السعة: 1,000 – 1,200 لتر',
    prodLink6: 'دليل بطانات IBC الفني ←',

    prodBadge7: 'ملحقات وأنظمة مصنعة بمعرفة BPS',
    prodTitle7: 'الحواجز الفولاذية ووسائد التسخين والملحقات',
    prodTagline7: 'عتاد هندسي مصنعي لنقل آمن بنسبة 100%',
    prodDesc7: 'حواجز هيكلية فولاذية فائقة القوة، صمامات تنفيس ضغط أوتوماتيكية، وسائد تسخين بالبخار والماء الساخن، وبطانات عزل حراري متعددة الطبقات. يتم تصنيعها داخلياً تحت معايير ISO 9001 الصارمة.',
    prodCap7: 'تشكيلة متكاملة من العتاد',
    prodLink7: 'مواصفات الملحقات الفنية ←',
    prodBtnAll: 'استكشف تشكيلة العتاد والملحقات المصنعة ←',

    // Global Reach
    reachEyebrow: 'الانتشار التشغيلي وممرات التجارة العالمية',
    reachTitle: 'ربط ممرات الكيماويات والسلع العالمية',
    reachDesc: 'من مرافق التصنيع في الهند إلى التنسيق الإقليمي من دبي وجبل علي، تقدم بي بي إس حلول تغليف الحاويات المرنة عبر أكثر من 60 دولة في خمس قارات.',
    reachSubdesc: 'يضمن مكتبنا اللوجستي في دبي دعماً فنياً سلساً من ميناء إلى ميناء، وفرق تركيب فنية للطوارئ، وإمداد مستمر للمخزون عبر موانئ الشرق الأوسط والبحر الأبيض المتوسط وآسيا وإفريقيا.',
    reachMetricNum1: '60+',
    reachMetricLbl1: 'دولة يتم التوريد إليها',
    reachMetricNum2: '100%',
    reachMetricLbl2: 'اختبار ضغط معتمد',
    reachMetricNum3: '25+',
    reachMetricLbl3: 'عاماً من الخبرة الصناعية',
    reachBtnText: 'طلب تسعير مسار الشحن',
    mapHudStatus: 'عمليات التوزيع نشطة',
    mapHudCount: 'أكثر من 60 مركزاً عالمياً',
    mapStatusLabel: 'تنسيق التوريد والتركيب الفني من دبي',

    // About Us
    aboutCleanEyebrow: 'عن بي بي إس جلوبال تريدينج',
    aboutCleanHeadline: 'ريادة لوجستيات السوائل السائبة بالدقة والأمان والتوسع العالمي.',
    aboutLead: 'تعتبر بي بي إس جلوبال تريدينج مزوداً رائداً لحلول ولوجستيات نقل السوائل السائبة بالحاويات دولياً. ومن خلال مقرنا الإقليمي الاستراتيجي في دبي والشراكة المباشرة مع مصانعنا المعتمدة في الهند، نورد أنظمة فليكسي تانك فائقة الجودة لشركات الكيماويات وكبرى شركات الزراعة والأغذية ووكلاء الشحن في أكثر من 60 دولة.',
    aboutP2: 'بخلاف الوسطاء التجاريين التقليديين، نحن نتحكم في كامل سلسلة القيمة: بدءاً من بثق البوليمر متعدد الطبقات والتصنيع في غرف معقمة وحتى هندسة الحواجز الفولاذية، وفحص الحاويات الميداني، ودعم التفريغ في موانئ الوصول.',
    aboutFeatTitle1: 'تصنيع بغرف معقمة',
    aboutFeatDesc1: 'تصنيع فائق الدقة داخل بيئات معقمة حاصلة على ISO 22000 باستخدام خامات غذائية نقية 100%.',
    aboutFeatTitle2: 'فرق تركيب وتجهيز ميدانية',
    aboutFeatDesc2: 'فرق فنية معتمدة تنتقل إلى موقعك لفحص الحاوية وتركيب الفليكسي تانك وتأمينه بدقة متناهية.',
    aboutFeatTitle3: 'هندسة طبقات مخصصة',
    aboutFeatDesc3: 'تركيبات بوليمر مخصصة مع طبقات EVOH لحماية السوائل الحساسة للأكسجين أو التفاعل.',
    aboutFeatTitle4: 'مركز جبل علي ودبي الإقليمي',
    aboutFeatDesc4: 'مخزون استراتيجي وجاهزية فورية للتوزيع السريع لخدمة تجارة الشرق الأوسط والعالم.',
    aboutBtnQuote: 'استشر فريقنا الهندسي اللوجستي',
    aboutDarkTitle1: 'ميزة التصنيع المباشر',
    aboutDarkDesc1: 'مباشرة من خطوط الإنتاج إلى رصيف التحميل لديك، مما يلغي هوامش الوسطاء الإضافية.',
    aboutDarkTitle2: 'فحص الحاويات المسبق عبر 9 نقاط',
    aboutDarkDesc2: 'تخضع كل حاوية لفحص هيكلي صارم يشمل الجدران والأرضيات والأعمدة ومزاليج الأبواب قبل التعبئة.',
    aboutDarkTitle3: 'تفريغ كامل بدون أي رواسب',
    aboutDarkDesc3: 'تصميم صمام سفلي انسيابي يقلل البقايا، مما يضمن استعادة أكثر من 99.6% من بضائعك الثمينة.',
    aboutDarkTitle4: 'تتبع كامل لمسار الإنتاج',
    aboutDarkDesc4: 'يحمل كل فليكسي تانك رقماً تسلسلياً فريداً مرتبطاً بسجلات فحص جودة المادة الخام.',

    // Why BPS
    whyBpsLabel: 'لماذا يثق كبار المصنعين في BPS GLOBAL',
    whyTitle1: 'رقابة جودة شاملة',
    whyDesc1: 'من فحص حبيبات الراتنج النقية وحتى اختبارات الصدمات ثلاثية الأبعاد، كل فليكسي تانك يلبي معايير COA الصارمة.',
    whyTitle2: 'خدمات تركيب وتجهيز متكاملة',
    whyDesc2: 'لا تخاطر بالتركيب الخاطئ. فرقنا الفنية المعتمدة تفحص الحاويات وتركب الفليكسي تانك في موقعك باحترافية.',
    whyTitle3: 'كفاءة التكاليف وأعلى حمولة',
    whyDesc3: 'حمولة تزيد حتى 40% مقارنة بالبراميل و15% مقارنة بحاويات IBC، مع انعدام تكاليف شحن الإرجاع الفارغ.',
    whyTitle4: 'موقع لوجستي استراتيجي في دبي',
    whyDesc4: 'يوفر موقعنا في دبي لشركائنا سرعة التوريد، واستقراراً تمويلياً، ومرونة فائقة عبر كافة الموانئ.',

    // Industries We Serve
    industriesBarTitle: 'خبراتنا في نقل السوائل والسلع',
    indCrop1: 'الزيوت الأساسية وزيوت المحركات',
    indCrop2: 'الزيوت النباتية وزيت النخيل',
    indCrop3: 'الكيماويات الصناعية السائلة',
    indCrop4: 'العصائر والمشروبات السائبة',
    indCrop5: 'البيتومين والأسفلت السائل',
    indCrop6: 'الوقود الحيوي والمواد الأولية',
    indCrop7: 'الجلسرين والجلايكول',
    indCrop8: 'الأسمدة الزراعية السائلة',
    indCrop9: 'الشمع وشمع البرافين',
    indCrop10: 'مركزات الفواكه والأغذية',
    indCrop11: 'المنظفات والمواد الخافضة للتوتر',

    // Certifications & Sustainability
    certsHeading: 'المعايير الدولية واعتمادات الجودة',
    certsDesc: 'تلبي جميع أنظمة فليكسي تانك بي بي إس أعلى معايير النقل البحري والسكك الحديدية وسلامة الغذاء الدولية.',
    sustHeading: 'لوجستيات مستدامة: بوليمرات قابلة لإعادة التدوير 100%',
    sustDesc: 'بالمقارنة مع البراميل الفولاذية وحاويات IBC الصلبة، تقلل فليكسي تانك BPS انبعاثات نقل الحاويات الفارغة وتخفض البصمة الكربونية بنسبة تصل إلى 35% لكل طن متري من السوائل المنقولة.',
    sustPoint1: 'مواد بولي إيثيلين وبولي بروبيلين نقية وقابلة لإعادة التدوير بنسبة 100%',
    sustPoint2: 'انعدام انبعاثات شحن العودة بفضل نظام الرحلة الواحدة',
    sustPoint3: 'زيادة الحمولة حتى 40% مقارنة بالبراميل القياسية سعة 200 لتر',
    sustPoint4: 'استهلاك منعدم لمياه الغسيل مما يمنع التلوث البيئي الناتج عن التنظيف',
    sustLeafTagText: 'كفاءة بيئية مستدامة',

    // Services & Process
    servicesHeading: 'خدمات متكاملة لتغليف ونقل السوائل السائبة',
    servicesDesc: 'من فحص الحاوية المسبق والتركيب وحتى الاستشارات الفنية وتفريغ البضائع، تقدم BPS دعماً تشغيلياً متكاملاً.',
    svcTitle1: 'تجهيز وتركيب متكامل للحاويات',
    svcTitle2: 'استشارات المسارات الفنية للشحن',
    svcTitle3: 'دعم تفريغ السوائل عالية الحرارة',
    svcTitle4: 'تصنيع وتخصيص هندسي OEM',
    svcTitle5: 'بروتوكولات الوقاية من التسرب',
    svcTitle6: 'حلول النقل متعدد الوسائط',
    processHeading: 'مراحل التركيب والشحن القياسية المكونة من 6 خطوات',
    processDesc: 'تخضع كل حاوية يتم تجهيزها بواسطة BPS لإجراءات تشغيل قياسية معتمدة من 6 خطوات لضمان سلامة البضائع من التحميل حتى الوصول.',
    stepLabel1: 'فحص الحاوية عبر 9 نقاط',
    stepLabel2: 'فرش بطانة الحماية المقواة',
    stepLabel3: 'وضع وتثبيت الفليكسي تانك',
    stepLabel4: 'تثبيت الحاجز الفولاذي المقاوم',
    stepLabel5: 'بروتوكول التحميل المراقب',
    stepLabel6: 'إحكام الإغلاق والإرسال للوجهة',

    // Traditional RFQ Form
    enqHeaderEyebrow: 'طلب تسعير رسمي واستفسار شحن السوائل',
    enqHeaderHeadline: 'استفسار عرض أسعار فليكسي تانك والشحن البحري',
    enqHeaderSubtitle: 'أدخل بيانات الموانئ، وخصائص السائل المنقول، والمواصفات الفنية المطلوبة للحصول على عرض أسعار رسمي فوري من فريقنا الهندسي اللوجستي.',
    labelModeTraditional: 'نموذج الاستفسار الرسمي',
    labelModeEstimator: 'الحاسبة التقديرية',
    legendContact: 'بيانات الشاحن والتواصل',
    lblFullName: 'الاسم الكامل / مسؤول الاتصال',
    lblCompany: 'اسم الشركة / المؤسسة',
    lblEmail: 'البريد الإلكتروني المهني',
    lblPhone: 'رقم الهاتف / الواتساب',
    legendRoute: 'مسار الرحلة والجدول الزمني',
    lblPortFrom: 'من بلد / ميناء التحميل',
    lblPortTo: 'إلى بلد / ميناء الوصول',
    lblSailingDate: 'تاريخ الإبحار التقديري / الجاهزية',
    lblEstVolume: 'حجم الشحنة / عدد الحاويات',
    legendCargo: 'نوع السائل (البضاعة المشحونة)',
    lblCargoType: 'نوع السائل المنقول',
    lblDensity: 'الكثافة النوعية / اللزوجة',
    lblLoadingTemp: 'درجة حرارة التحميل (°C)',
    legendSpecs: 'المواصفات الفنية للفليكسي تانك',
    lblValveType: 'نوع صمام التثبيت',
    lblLayers: 'عدد الطبقات العازلة',
    lblBulkhead: 'نوع الحاجز الخلفي (Bulkhead)',
    legendAddons: 'المتطلبات الإضافية والملحقات المصنعة',
    txtHeatPadTitle: 'وسادة تسخين (بخار / ماء ساخن)',
    txtHeatPadDesc: 'لتفريغ السوائل عالية اللزوجة (الشمع، زيت النخيل، القطران).',
    txtVentTitle: 'صمام تنفيس هواء أوتوماتيكي',
    txtVentDesc: 'تنفيس ضغط الغازات أوتوماتيكياً للسوائل المتخمرة والمتطايرة.',
    txtThermalTitle: 'بطانة عزل حراري للحاوية',
    txtThermalDesc: 'حماية البضائع الحساسة لدرجة الحرارة في الرحلات الباردة أو الصحراوية.',
    txtPaperTitle: 'ورق كرافت مقوى لحماية الأرضية والجدران',
    txtPaperDesc: 'ورق كرافت مموج عالي التحمل لحماية الجدار الداخلي للحاوية.',
    txtFittingTitle: 'خدمة التركيب الفني الميداني بالمستودع',
    txtFittingDesc: 'فريق فني معتمد لتركيب وتجهيز الفليكسي تانك في مستودع الحاويات.',
    txtInsuranceTitle: 'تأمين بحري على البضائع السائبة',
    txtInsuranceDesc: 'وثيقة تأمين بحري شاملة ومخصصة لشحنات السوائل السائبة.',
    legendNotes: 'تعليمات خاصة وملاحظات الشحن',
    rfqBadge: 'ملخص مواصفات الشحنة',
    rfqTitle: 'بيان طلب التسعير',
    lblSummRoute: 'المسار:',
    lblSummSailing: 'تاريخ الإبحار:',
    lblSummCargo: 'نوع السائل:',
    lblSummVolume: 'الحاويات:',
    lblSummValve: 'نوع الصمام:',
    lblSummLayers: 'الطبقات:',
    lblSummBulkhead: 'نوع الحاجز:',
    lblSummAddons: 'الملحقات:',
    txtSubmitEnquiry: 'إرسال طلب التسعير الرسمي',
    txtWaEnquiry: 'إرسال عبر مكتب الواتساب',
    txtEmailEnquiry: 'طلب عرض سعر بالبريد',
    modalSuccessTitle: 'تم إرسال طلب التسعير بنجاح',
    modalSuccessDesc: 'شكراً لاستفسارك بخصوص نقل السوائل السائبة. استلم فريقنا الهندسي اللوجستي معاييرك الفنية وسيقوم بإعداد عرض أسعار رسمي معتمد خلال ساعتي عمل.',
    btnModalSuccessClose: 'العودة للصفحة الرئيسية',

    // Quick Estimator
    lblCalcStep1: 'اختر نوع السائل المنقول',
    lblCalcStep2: 'المسار والوجهة التجارية',
    lblCalcStep3: 'حجم الشحنة الإجمالي',
    lblCalcPresets: 'الخيارات السريعة:',
    lblCalcResTag: 'المواصفة اللوجستية المحسوبة',
    lblCalcSpec1: 'طراز الفليكسي تانك:',
    lblCalcSpec2: 'صمام التفريغ:',
    lblCalcSpec3: 'نظام التسخين:',
    lblCalcBtnWa: 'طلب تسعير فوري عبر واتساب',
    lblCalcBtnEmail: 'طلب تسعير رسمي بالبريد',

    // FAQ (Sidebar & 10 Questions)
    faqEyebrow: 'الأسئلة الأكثر شيوعاً',
    faqTitle: 'إرشادات فنية وتشغيلية شاملة',
    faqTabAll: 'جميع الأسئلة',
    faqTabTech: 'المواصفات الفنية',
    faqTabFood: 'الأغذية والمشروبات',
    faqTabSafety: 'الأمان والامتثال',
    faqTabSpecs: 'التصنيع والخدمات',
    faqSupportTitle: 'هل تحتاج إلى استشارة فنية مخصصة؟',
    faqSupportDesc: 'يمكن لفريقنا اللوجستي بدبي تقييم توافق السائل، وحساب طاقة وسائد التسخين، وتوفير فرق تركيب معتمدة في موقعك.',
    faqBtnWhatsApp: 'مكتب واتساب اللوجستي',
    faqBtnContact: 'التواصل مع الفريق الهندسي',

    faqCat1: 'توافق الحاويات',
    faqQ1: 'ما هي الحاويات المتوافقة مع فليكسي تانك بي بي إس؟',
    faqA1: 'تم تصميم وتصنيع فليكسي تانك بي بي إس خصيصاً ليتناسب مع حاويات الشحن الجاف القياسية 20 قدماً المصنفة لوزن إجمالي 30,000 كجم أو أكثر. يجب أن تلبي الحاوية معايير جمعية ملاك الحاويات (COA): ألا يتجاوز عمرها 5 سنوات، وأن تكون خالية من الأضرار الهيكلية، وجدرانها الفولاذية المموجة سليمة، وأرضيتها الخشبية خالية من المسامير أو الشظايا، مع عمل أقفال ومزاليج الأبواب بكفاءة تامة. وتقوم فرقنا الفنية المعتمدة بإجراء فحص مسبق دقيق مكون من 9 نقاط لكل حاوية قبل بدء التركيب.',

    faqCat2: 'هندسة الصمامات',
    faqQ2: 'ما هي مقاسات الصمامات وآليات التفريغ المتوفرة؟',
    faqA2: 'نوفر صمامات فراشة وكرات مدمجة عالية التدفق بمقاسات 2 بوصة و3 بوصة، مزودة بوصلات كاملوك سريعة الربط (وفقاً للمعيار العسكري MIL-C-27487) وقفل أمان ثانوي محكم. تصنع أجسام الصمامات من مادة البولي بروبيلين المقوى بالألياف الزجاجية أو البوليمرات الفلورية المقاومة للمواد الكيميائية مع حشيات إحكام من التفلون أو الفيتون لمنع التسرب والتجويف، مع اتصال سلس بمضخات التفريغ الصناعية.',

    faqCat3: 'الجودة واختبارات COA',
    faqQ3: 'ما هي الشهادات واختبارات الصدمات المعتمدة لأنظمتكم؟',
    faqA3: 'تلتزم جميع أنظمة بي بي إس بشهادات الجودة الدولية ISO 9001:2015، والبيئة ISO 14001:2015، وسلامة الغذاء ISO 22000:2018 ونظام HACCP. كما اجتازت كافة طرازاتنا اختبارات الصدمات الديناميكية الصارمة المعتمدة من جمعية ملاك الحاويات (COA) بقوة تباطؤ طولي تتجاوز 2.6G دون أي تمزق في اللحام أو تسريب في الصمام أو انحناء في الحواجز، بالإضافة لامتثالها لمعايير PAS 1008:2016 ولوائح إدارة الغذاء والدواء الأمريكية FDA.',

    faqCat4: 'عزل الأكسجين والغازات',
    faqQ4: 'كيف تمنع طبقات EVOH عزل الأكسجين وتلف العصائر والمشروبات؟',
    faqA4: 'تحتوي أكياس فليكسي تانك المشروبات والعصائر الفاخرة لدينا على طبقة داخلية متطورة من بوليمر كحول الإيثيلين فينيل (EVOH) المعثور عليه بين طبقات البولي إيثيلين النقي. يوفر EVOH حاجزاً استثنائياً يمنع نفاذية الغازات، حيث يحافظ على معدل انتقال الأكسجين (OTR) أقل من 0.5 سم³/م² خلال 24 ساعة، مما يمنع الأكسدة وفقدان النكهات العطرية، ويحمي الشحنة من الروائح الخارجية طوال الرحلات البحرية التي تتجاوز 45 يوماً.',

    faqCat5: 'السلامة الغذائية',
    faqQ5: 'هل الفليكسي تانك معتمد للأغذية وحاصل على شهادات حلال وكوشر؟',
    faqA5: 'نعم بالتأكيد. يتم تصنيع فليكسي تانك المواد الغذائية في غرف نظيفة فائقة التعقيم تحت ضغط إيجابي وفقاً لممارسات التصنيع الجيد (GMP). نستخدم خامات بولي إيثيلين نقية 100% خالية من المعادن الثقيلة والملدنات الضارة، متوافقة مع لوائح FDA وEU للاتصال المباشر بالمواد الغذائية الدهنية والحمضية، وحاصلة على اعتمادات حلال وكوشر رسمية، مع ترقيم تسلسلي فريد لكل كيس.',

    faqCat6: 'خدمات التركيب الميداني',
    faqQ6: 'هل تقدم BPS خدمات فحص وتجهيز الحاويات والتركيب الميداني؟',
    faqA6: 'نعم بكل تأكيد. نحن لا نكتفي بتصنيع الأكياس والملحقات، بل نرسل فرق تركيب فنية معتمدة مباشرة إلى محطتك أو مصنعك أو مستودعك. يتولى الفنيون فحص الحاوية، وفرش البطانات الكرتونية المقواة، وتثبيت الفليكسي تانك، وتركيب الحواجز الفولاذية، وضبط الصمامات، والإشراف على أولى خطوات التعبئة لضمان سرعة الضخ الآمنة وتصريف الهواء بكفاءة.',

    faqCat7: 'الحواجز الفولاذية',
    faqQ7: 'ما هي أنواع الحواجز الهيكلية التي تصنعونها؟',
    faqA7: 'نقوم بهندسة وتصنيع حواجز فولاذية مموجة متكاملة قطعة واحدة، بالإضافة إلى أنظمة العوارض الأنبوبية الفولاذية مع ألواح خلايا النحل المركبة فائقة الصلابة. تُثبت الحواجز بدقة في تجاويف أعمدة الحاوية دون الحاجة إلى لحام أو ثقب الجدران، وتتحمل قوى اندفاع هيدروليكي تتجاوز 30 طناً مترياً أثناء أمواج البحر العاتية أو فرملة قطارات الشحن.',

    faqCat8: 'التفريغ والتسخين الحراري',
    faqQ8: 'كيف يتم التعامل مع السوائل اللزجة أو عالية الحرارة مثل البيتومين وزيت النخيل؟',
    faqA8: 'للسوائل التي تتجمد أو ترتفع لزوجتها أثناء الرحلات البحرية (زيت النخيل، الشحوم، الأحماض الدهنية، الشمع)، نوفر وسائد تسخين بالبخار أو الماء الساخن مصنعة لدينا وتوضع أسفل الفليكسي تانك. يتم توصيلها بمولد البخار عند ميناء الوصول لإعادة تسييل الشحنة خلال 4 إلى 8 ساعات دون احتراق السائل. كما نصنع فليكسي تانك خاص للبيتومين يتحمل درجات حرارة تحميل مستمرة حتى 130°C.',

    faqCat9: 'الإمداد والعمليات الإقليمية',
    faqQ9: 'كيف يتم تنسيق شحن وتوزيع المخزون من دبي وميناء جبل علي؟',
    faqA9: 'يحتفظ مكتبنا التجاري واللوجستي الإقليمي بدبي بمخزون استراتيجي دائم من فليكسي تانك 24,000 لتر الصناعي والغذائي ووسائد التسخين في مراكز لوجستية حيوية تشمل منطقة جبل علي الحرة. ويتيح ذلك شحناً سريعاً وفورياً للعملاء في الإمارات، والسعودية، وعُمان، والبحرين، والكويت، ومصر، وممرات الشرق الأوسط خلال 24 إلى 48 ساعة، مع توفير كافة مستندات التصدير وشهادات التحليل.',

    faqCat10: 'التصنيع والخدمات',
    faqQ10: 'هل تقومون بتصنيع أكياس الفليكسي تانك والملحقات وتقديم خدمات التركيب؟',
    faqA10: 'نعم، بكل تأكيد. نحن نصنع جميع أكياس الفليكسي تانك وكافة الملحقات المرافقة داخلياً—بما في ذلك الحواجز الهيكلية الفولاذية، ووسائد التسخين الحرارية، وبطانات العزل الحراري متعددة الطبقات، وصمامات تنفيس الضغط الأوتوماتيكية—في مصانعنا المتخصصة (BPS Flexitanks Private Limited في كوتشين، الهند). وإلى جانب التوريد المباشر من المصنع، تقدم فرقنا الفنية المعتمدة خدمات فحص الحاويات عبر 9 نقاط، وتثبيت الحواجز، وتركيب الفليكسي تانك في مستودعك لضمان رحلة بحرية آمنة 100% وخالية من أي تسريب.',

    // Footer & Final CTA
    footerEyebrow: 'شراكة متميزة مع BPS GLOBAL',
    footerCtaHeadline: 'شريكك الموثوق في<br><span class="footer-headline-gradient" id="footerCtaHeadlineGrad">نقل وتغليف السوائل السائبة.</span>',
    footerCtaHeadlineGrad: 'نقل وتغليف السوائل السائبة.',
    footerCtaDesc: 'سواء كنت تشحن الزيوت الأساسية الصناعية، أو الكيماويات المتخصصة، أو الزيوت الغذائية المعتمدة، أو البيتومين عالي الحرارة، أو المشروبات السائبة، توفر BPS فليكسي تانك فائق الهندسة، وخدمات تركيب ميدانية، وضماناً مصنعياً معتمداً.',
    footerBtnQuote: 'طلب عرض أسعار',
    footerBtnContact: 'تواصل مع BPS',
    footerBtnWa: 'مكتب واتساب',
    footerCardBadge: 'المكتب الإقليمي ومكتب الخدمات اللوجستية بدبي',
    contactEntityAddress: 'مبنى بن دسمال، القوز الصناعية الأولى<br>ص.ب 282559، دبي – الإمارات العربية المتحدة',
    contactEntityPhoneTitle: 'العمليات المباشرة وواتساب 24/7',
    contactEntityEmailTitle: 'المراسلات التجارية وطلبات الأسعار',
    footerStockStatus: 'تنسيق التوريد الإقليمي والتركيب الفني الميداني من جبل علي ودبي',
    footerCopyright: '© 2026 <strong>بي بي إس جلوبال تريدينج (BPS Global Trading)</strong>. جميع الحقوق محفوظة.',
    footerAccreditation: 'تصنيع أكياس الفليكسي تانك والملحقات • خدمات تركيب وتجهيز الحاويات في الموقع • حاصل على شهادات ISO 9001 · 14001 · 22000',

    // Mobile Floating Dock & Modals
    waFloatSpan: 'مكتب واتساب',
    rfqFloatSpan: 'طلب تسعير فوري',
    modalSpecsTitle: 'مصفوفة الهندسة والمواصفات الفنية',
    modalBtnConfigure: 'تخصيص هذا الفليكسي تانك',
    modalBtnChat: 'محادثة مسؤول التوزيع بدبي',
    certBadge: 'معيار معتمد وموثق'
  }
};

let currentAppLang = 'en';

function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'ar') lang = 'en';
  currentAppLang = lang;
  try {
    localStorage.setItem('bps_language', lang);
  } catch (e) {}

  const t = BPS_I18N[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = t.dir;

  // Toggle active button states on header and mobile switcher
  const btnEn = document.getElementById('btnLangEn');
  const btnAr = document.getElementById('btnLangAr');
  const btnMobEn = document.getElementById('btnLangMobileEn');
  const btnMobAr = document.getElementById('btnLangMobileAr');

  if (btnEn) btnEn.classList.toggle('active', lang === 'en');
  if (btnAr) btnAr.classList.toggle('active', lang === 'ar');
  if (btnMobEn) btnMobEn.classList.toggle('active', lang === 'en');
  if (btnMobAr) btnMobAr.classList.toggle('active', lang === 'ar');

  // Update elements by ID (text / HTML)
  const mapIds = [
    // Header & Brand
    'navBrandTitle', 'navBrandSub', 'liveClockDisplay',
    // Hero & Hero Widget
    'heroEyebrow', 'heroHeadline', 'heroDesc',
    'widgetEyebrow', 'widgetMainTitle', 'widgetLivePill',
    'telemLabel1', 'telemVal1', 'telemLabel2', 'telemVal2',
    // Stats Strip
    'statDesc1', 'statDesc2', 'statDesc3', 'statDesc4',
    // Products Section
    'prodEyebrow', 'prodHeading',
    'prodFilterAll', 'prodFilterInd', 'prodFilterFood', 'prodFilterSpec',
    'prodBadge1', 'prodTitle1', 'prodTagline1', 'prodDesc1', 'prodCap1', 'prodLink1',
    'prodBadge2', 'prodTitle2', 'prodTagline2', 'prodDesc2', 'prodCap2', 'prodLink2',
    'prodBadge3', 'prodTitle3', 'prodTagline3', 'prodDesc3', 'prodCap3', 'prodLink3',
    'prodBadge4', 'prodTitle4', 'prodTagline4', 'prodDesc4', 'prodCap4', 'prodLink4',
    'prodBadge5', 'prodTitle5', 'prodTagline5', 'prodDesc5', 'prodCap5', 'prodLink5',
    'prodBadge6', 'prodTitle6', 'prodTagline6', 'prodDesc6', 'prodCap6', 'prodLink6',
    'prodBadge7', 'prodTitle7', 'prodTagline7', 'prodDesc7', 'prodCap7', 'prodLink7',
    'prodBtnAll',
    // Global Reach
    'reachEyebrow', 'reachTitle', 'reachDesc', 'reachSubdesc',
    'reachMetricNum1', 'reachMetricLbl1', 'reachMetricNum2', 'reachMetricLbl2', 'reachMetricNum3', 'reachMetricLbl3',
    'reachBtnText', 'mapHudStatus', 'mapHudCount', 'mapStatusLabel',
    // About Us
    'aboutCleanEyebrow', 'aboutCleanHeadline', 'aboutLead', 'aboutP2',
    'aboutFeatTitle1', 'aboutFeatDesc1', 'aboutFeatTitle2', 'aboutFeatDesc2',
    'aboutFeatTitle3', 'aboutFeatDesc3', 'aboutFeatTitle4', 'aboutFeatDesc4',
    'aboutBtnQuote',
    'aboutDarkTitle1', 'aboutDarkDesc1', 'aboutDarkTitle2', 'aboutDarkDesc2',
    'aboutDarkTitle3', 'aboutDarkDesc3', 'aboutDarkTitle4', 'aboutDarkDesc4',
    // Why BPS
    'whyBpsLabel',
    'whyTitle1', 'whyDesc1', 'whyTitle2', 'whyDesc2',
    'whyTitle3', 'whyDesc3', 'whyTitle4', 'whyDesc4',
    // Industries We Serve
    'industriesBarTitle',
    'indCrop1', 'indCrop2', 'indCrop3', 'indCrop4', 'indCrop5', 'indCrop6',
    'indCrop7', 'indCrop8', 'indCrop9', 'indCrop10', 'indCrop11',
    // Certifications & Sustainability
    'certsHeading', 'certsDesc', 'sustHeading', 'sustDesc',
    'sustPoint1', 'sustPoint2', 'sustPoint3', 'sustPoint4', 'sustLeafTagText',
    // Services & Process
    'servicesHeading', 'servicesDesc',
    'svcTitle1', 'svcTitle2', 'svcTitle3', 'svcTitle4', 'svcTitle5', 'svcTitle6',
    'processHeading', 'processDesc',
    'stepLabel1', 'stepLabel2', 'stepLabel3', 'stepLabel4', 'stepLabel5', 'stepLabel6',
    // Traditional RFQ Form
    'enqHeaderEyebrow', 'enqHeaderHeadline', 'enqHeaderSubtitle',
    'labelModeTraditional', 'labelModeEstimator',
    'legendContact', 'lblFullName', 'lblCompany', 'lblEmail', 'lblPhone',
    'legendRoute', 'lblPortFrom', 'lblPortTo', 'lblSailingDate', 'lblEstVolume',
    'legendCargo', 'lblCargoType', 'lblDensity', 'lblLoadingTemp',
    'legendSpecs', 'lblValveType', 'lblLayers', 'lblBulkhead',
    'legendAddons', 'txtHeatPadTitle', 'txtHeatPadDesc', 'txtVentTitle', 'txtVentDesc',
    'txtThermalTitle', 'txtThermalDesc', 'txtPaperTitle', 'txtPaperDesc',
    'txtFittingTitle', 'txtFittingDesc', 'txtInsuranceTitle', 'txtInsuranceDesc',
    'legendNotes', 'rfqBadge', 'rfqTitle',
    'lblSummRoute', 'lblSummSailing', 'lblSummCargo', 'lblSummVolume', 'lblSummValve', 'lblSummLayers', 'lblSummBulkhead', 'lblSummAddons',
    'txtSubmitEnquiry', 'txtWaEnquiry', 'txtEmailEnquiry',
    'modalSuccessTitle', 'modalSuccessDesc', 'btnModalSuccessClose',
    // Quick Estimator
    'lblCalcStep1', 'lblCalcStep2', 'lblCalcStep3', 'lblCalcPresets', 'lblCalcResTag',
    'lblCalcSpec1', 'lblCalcSpec2', 'lblCalcSpec3', 'lblCalcBtnWa', 'lblCalcBtnEmail',
    // FAQ (Sidebar & 10 Questions)
    'faqEyebrow', 'faqTitle',
    'faqTabAll', 'faqTabTech', 'faqTabFood', 'faqTabSafety', 'faqTabSpecs',
    'faqSupportTitle', 'faqSupportDesc', 'faqBtnWhatsApp', 'faqBtnContact',
    'faqCat1', 'faqQ1', 'faqA1',
    'faqCat2', 'faqQ2', 'faqA2',
    'faqCat3', 'faqQ3', 'faqA3',
    'faqCat4', 'faqQ4', 'faqA4',
    'faqCat5', 'faqQ5', 'faqA5',
    'faqCat6', 'faqQ6', 'faqA6',
    'faqCat7', 'faqQ7', 'faqA7',
    'faqCat8', 'faqQ8', 'faqA8',
    'faqCat9', 'faqQ9', 'faqA9',
    'faqCat10', 'faqQ10', 'faqA10',
    // Footer & Final CTA
    'footerEyebrow', 'footerCtaHeadline', 'footerCtaHeadlineGrad', 'footerCtaDesc',
    'footerBtnQuote', 'footerBtnContact', 'footerBtnWa',
    'footerCardBadge', 'contactEntityAddress', 'contactEntityPhoneTitle', 'contactEntityEmailTitle',
    'footerStockStatus', 'footerCopyright', 'footerAccreditation',
    // Mobile Dock & Modals
    'waFloatSpan', 'rfqFloatSpan',
    'modalSpecsTitle', 'modalBtnConfigure', 'modalBtnChat', 'certBadge'
  ];

  mapIds.forEach(id => {
    const el = document.getElementById(id);
    if (el && t[id] !== undefined) {
      if (typeof t[id] === 'string' && t[id].includes('<') && t[id].includes('>')) {
        el.innerHTML = t[id];
      } else {
        el.textContent = t[id];
      }
    }
  });

  // Hero CTA buttons (spans)
  const heroBtnProductsSpan = document.querySelector('#heroBtnProducts span');
  if (heroBtnProductsSpan) heroBtnProductsSpan.textContent = t.btnHeroExplore;
  const heroBtnQuoteSpan = document.querySelector('#heroBtnQuote span');
  if (heroBtnQuoteSpan) heroBtnQuoteSpan.textContent = t.btnHeroRfq;

  // Header and Drawer brand subtexts
  document.querySelectorAll('.brand-sub').forEach(el => {
    el.textContent = t.brandSub;
  });

  // Navigation Links Translation
  const navMap = {
    home: t.navHome,
    about: t.navAbout,
    products: t.navProducts,
    services: t.navServices,
    global: t.navGlobal,
    faq: t.navFaq,
    contact: t.navContact
  };

  document.querySelectorAll('[data-nav]').forEach(el => {
    const key = el.getAttribute('data-nav');
    if (navMap[key]) {
      const span = el.querySelector('span') || el;
      span.textContent = navMap[key];
    }
  });

  // Form input placeholders
  const placeholders = {
    enqName: lang === 'ar' ? 'مثال: م. طارق منصور' : 'e.g. Capt. Tariq Mansoor',
    enqCompany: lang === 'ar' ? 'مثال: شركة بتروكيماويات الخليج' : 'e.g. Petrochem International',
    enqEmail: 'procurement@company.com',
    enqPhone: '+971 50 123 4567',
    enqDensity: lang === 'ar' ? 'مثال: 0.89 جم/سم³ أو 32 cSt' : 'e.g. 0.89 g/cm³ or 32 cSt',
    enqTemp: lang === 'ar' ? 'مثال: درجة حرارة الجو 25°C / 60°C' : 'e.g. Ambient 25°C / 60°C',
    enqNotes: lang === 'ar' ? 'أدخل أي ملاحظات خاصة بتفريغ الشحنة، متطلبات المضخات، موقع مستودع الحاويات، أو الجدول الزمني المطلوب...' : 'Enter special chemical handling notes, pump discharge specifications, container depot location, or target voyage timeline...'
  };

  Object.entries(placeholders).forEach(([id, ph]) => {
    const input = document.getElementById(id);
    if (input) input.placeholder = ph;
  });

  // Refresh Calculator output
  const calcSlider = document.getElementById('calcVolumeSlider');
  if (calcSlider) {
    calcSlider.dispatchEvent(new Event('input'));
  }

  // Live summary sync
  if (typeof updateTraditionalSummary === 'function') {
    updateTraditionalSummary();
  }
}

function initLanguageSwitcher() {
  const btnEn = document.getElementById('btnLangEn');
  const btnAr = document.getElementById('btnLangAr');
  const btnMobEn = document.getElementById('btnLangMobileEn');
  const btnMobAr = document.getElementById('btnLangMobileAr');

  if (btnEn) btnEn.addEventListener('click', () => setLanguage('en'));
  if (btnAr) btnAr.addEventListener('click', () => setLanguage('ar'));
  if (btnMobEn) btnMobEn.addEventListener('click', () => setLanguage('en'));
  if (btnMobAr) btnMobAr.addEventListener('click', () => setLanguage('ar'));

  let savedLang = 'en';
  try {
    savedLang = localStorage.getItem('bps_language') || 'en';
  } catch (e) {}
  setLanguage(savedLang);
}

/* ==========================================================================
   12. TRADITIONAL ENQUIRY FORM CONTROLLER
   ========================================================================== */
function initTraditionalEnquiryForm() {
  const btnModeTrad = document.getElementById('btnModeTraditional');
  const btnModeEst = document.getElementById('btnModeEstimator');
  const wrapTrad = document.getElementById('traditionalEnquiryWrap');
  const wrapEst = document.getElementById('quickEstimatorWrap');

  if (btnModeTrad && btnModeEst && wrapTrad && wrapEst) {
    btnModeTrad.addEventListener('click', () => {
      btnModeTrad.classList.add('active');
      btnModeEst.classList.remove('active');
      wrapTrad.style.display = 'block';
      wrapEst.style.display = 'none';
    });

    btnModeEst.addEventListener('click', () => {
      btnModeEst.classList.add('active');
      btnModeTrad.classList.remove('active');
      wrapTrad.style.display = 'none';
      wrapEst.style.display = 'block';
    });
  }

  // Pre-fill sailing date with +7 days from now
  const enqDate = document.getElementById('enqDate');
  if (enqDate && !enqDate.value) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    enqDate.value = d.toISOString().split('T')[0];
    enqDate.min = new Date().toISOString().split('T')[0];
  }

  // Listen to all inputs to update summary and WhatsApp links
  const form = document.getElementById('traditionalEnquiryForm');
  if (form) {
    form.addEventListener('input', updateTraditionalSummary);
    form.addEventListener('change', updateTraditionalSummary);
  }

  updateTraditionalSummary();
}

function updateTraditionalSummary() {
  const portFrom = document.getElementById('enqPortFrom')?.value || 'Jebel Ali (AEJEA), UAE';
  const portTo = document.getElementById('enqPortTo')?.value || 'Port of Rotterdam (NLRTM), Netherlands';
  const sailingDate = document.getElementById('enqDate')?.value || 'Upon Request';
  const volume = document.getElementById('enqVolume')?.value || '1 Container (20ft FCL)';
  const cargo = document.getElementById('enqCargo')?.value || 'Base Oils & Lubricants';
  const density = document.getElementById('enqDensity')?.value || '';
  const temp = document.getElementById('enqTemp')?.value || '';
  const valve = document.getElementById('enqValve')?.value || '3" Bottom Camlock Ball Valve';
  const layers = document.getElementById('enqLayers')?.value || '4-Layer Food Grade PE';
  const bulkhead = document.getElementById('enqBulkhead')?.value || 'Steel Bulkhead (5-6 Galvanized Bars)';
  const name = document.getElementById('enqName')?.value || '';
  const company = document.getElementById('enqCompany')?.value || '';
  const email = document.getElementById('enqEmail')?.value || '';
  const phone = document.getElementById('enqPhone')?.value || '';
  const notes = document.getElementById('enqNotes')?.value || '';

  // Collect checked accessories
  const accessories = [];
  if (document.getElementById('chkHeatingPad')?.checked) accessories.push('Heating Pad');
  if (document.getElementById('chkAirVent')?.checked) accessories.push('Air Ventilation');
  if (document.getElementById('chkThermalLiner')?.checked) accessories.push('Thermal Liner');
  if (document.getElementById('chkPaperLining')?.checked) accessories.push('Floor/Wall Paper');
  if (document.getElementById('chkFitting')?.checked) accessories.push('On-Site Fitting');
  if (document.getElementById('chkInsurance')?.checked) accessories.push('Cargo Insurance');

  // Simplify port names for summary
  function cleanPort(p) {
    return p.split('(')[0].trim() || p;
  }
  const cleanFrom = cleanPort(portFrom);
  const cleanTo = cleanPort(portTo);

  // Clean valve name (bulletproof against backslashes or truncated quotes)
  let cleanValve = valve.replace(/\\/g, '').split('(')[0].trim();
  if (cleanValve.includes('3"') && cleanValve.includes('Butterfly')) {
    cleanValve = '3" Camlock Butterfly';
  } else if (cleanValve.includes('3"')) {
    cleanValve = '3" Camlock Ball Valve';
  } else if (cleanValve.includes('Dual')) {
    cleanValve = 'Dual Top/Bottom Valve';
  } else if (cleanValve.includes('2"')) {
    cleanValve = '2" Camlock Valve';
  } else if (cleanValve.includes('Sanitary')) {
    cleanValve = 'Sanitary SS Valve';
  } else if (cleanValve.includes('Custom')) {
    cleanValve = 'Custom Valve Spec';
  }

  // Clean layers description
  let cleanLayers = layers.split('+')[0].split('(')[0].trim();
  if (cleanLayers.includes('4-Layer')) cleanLayers = '4-Layer Food Grade PE';
  else if (cleanLayers.includes('3-Layer')) cleanLayers = '3-Layer Heavy-Duty PE';
  else if (cleanLayers.includes('5-Layer') || cleanLayers.includes('EVOH')) cleanLayers = '5-Layer EVOH Barrier';
  else if (cleanLayers.includes('Bitumen') || cleanLayers.includes('High-Temp')) cleanLayers = 'High-Temp Bitumen (130°C)';
  else if (cleanLayers.includes('Custom') || cleanLayers.includes('Specialized')) cleanLayers = 'Custom Multi-Layer Spec';

  // Clean bulkhead description
  let cleanBulkhead = 'Steel Bulkhead (5-6 Bars)';
  if (bulkhead.includes('Paper')) cleanBulkhead = 'Corrugated Bulkhead';
  else if (bulkhead.includes('One-Piece') || bulkhead.includes('Frame')) cleanBulkhead = 'One-Piece Quick-Fit Frame';

  // Calculate volume & capacity metrics
  let capacityText = '24,000 L (~24.0 MT)';
  let unitsBadge = '1 x 20ft FCL';
  let meterPct = 25;

  if (volume.includes('1 Container')) {
    unitsBadge = '1 x 20ft FCL';
    capacityText = cargo.includes('Bitumen') ? '20,000 L (~20.0 MT)' : '24,000 L (~24.0 MT)';
    meterPct = 25;
  } else if (volume.includes('2 to 5')) {
    unitsBadge = '2–5 Containers';
    capacityText = '48,000 – 120,000 L';
    meterPct = 45;
  } else if (volume.includes('6 to 10')) {
    unitsBadge = '6–10 Containers';
    capacityText = '144,000 – 240,000 L';
    meterPct = 65;
  } else if (volume.includes('11 to 20')) {
    unitsBadge = '11–20 Containers';
    capacityText = '264,000 – 480,000 L';
    meterPct = 85;
  } else if (volume.includes('20+')) {
    unitsBadge = '20+ Fleet Containers';
    capacityText = '480,000+ L (Annual)';
    meterPct = 100;
  }

  // Update Summary Card Elements
  const summRoute = document.getElementById('summRoute');
  const summSailing = document.getElementById('summSailing');
  const summCargo = document.getElementById('summCargo');
  const summVolume = document.getElementById('summVolume');
  const summValve = document.getElementById('summValve');
  const summLayers = document.getElementById('summLayers');
  const summBulkhead = document.getElementById('summBulkhead');
  const summAddons = document.getElementById('summAddons');
  const summContainersBadge = document.getElementById('summContainersBadge');
  const summCapacityVal = document.getElementById('summCapacityVal');
  const summPayloadFill = document.getElementById('summPayloadFill');

  if (summRoute) summRoute.textContent = `${cleanFrom} → ${cleanTo}`;
  if (summSailing) summSailing.textContent = sailingDate || 'Upon Request';
  if (summCargo) summCargo.textContent = cargo;
  if (summVolume) summVolume.textContent = unitsBadge;
  if (summValve) summValve.textContent = cleanValve;
  if (summLayers) summLayers.textContent = cleanLayers;
  if (summBulkhead) summBulkhead.textContent = cleanBulkhead;
  if (summAddons) summAddons.textContent = accessories.length > 0 ? accessories.join(', ') : 'Standard Protection';
  if (summContainersBadge) summContainersBadge.textContent = unitsBadge;
  if (summCapacityVal) summCapacityVal.textContent = capacityText;
  if (summPayloadFill) summPayloadFill.style.width = `${meterPct}%`;

  // Build WhatsApp pre-filled text
  const waBtn = document.getElementById('btnEnquiryWhatsApp');
  if (waBtn) {
    const waText = 
`*BPS Global Trading — Bulk Liquid Cargo RFQ*
━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Route:* ${cleanFrom} ➔ ${cleanTo}
📅 *Est. Sailing Date:* ${sailingDate}
📦 *Cargo Commodity:* ${cargo} ${density ? `(${density})` : ''} ${temp ? `[${temp}]` : ''}
🚢 *Volume / Units:* ${volume} [${capacityText}]
🔧 *Flexitank Valve:* ${cleanValve}
🛡️ *Layers:* ${cleanLayers}
🧱 *Bulkhead:* ${cleanBulkhead}
➕ *Accessories:* ${accessories.length > 0 ? accessories.join(', ') : 'Standard'}
━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Shipper:* ${name || 'Prospective Client'} ${company ? `(${company})` : ''}
📞 *Contact:* ${phone || 'Pending'} | ${email || 'Pending'}
📝 *Special Notes:* ${notes || 'Standard maritime handling requested.'}`;

    waBtn.href = `https://wa.me/971506718052?text=${encodeURIComponent(waText)}`;
  }

  // Build Email RFQ mailto link
  const emailBtn = document.getElementById('btnEnquiryEmail');
  if (emailBtn) {
    const subject = encodeURIComponent(`BPS Global Trading RFQ: ${cargo} (${cleanFrom} to ${cleanTo})`);
    const body = encodeURIComponent(
`Dear BPS Global Trading Logistics Desk,

Please provide an official quotation for the following bulk liquid flexitank shipment:

ROUTE & SCHEDULE:
- Origin Port: ${portFrom}
- Discharge Port: ${portTo}
- Estimated Sailing / Readiness Date: ${sailingDate}
- Estimated Volume / Containers: ${volume}

CARGO SPECIFICATION:
- Liquid Commodity: ${cargo}
- Specific Gravity / Density: ${density || 'N/A'}
- Loading Temperature: ${temp || 'Ambient'}

TECHNICAL FLEXITANK REQUIREMENTS:
- Type of Valve Fixing: ${valve}
- Number of Layers: ${layers}
- Bulkhead: ${bulkhead}
- Additional Accessories: ${accessories.join(', ') || 'Standard'}

SHIPPER & CONTACT:
- Full Name: ${name || 'N/A'}
- Company: ${company || 'N/A'}
- Phone / WhatsApp: ${phone || 'N/A'}
- Corporate Email: ${email || 'N/A'}

SPECIAL INSTRUCTIONS / NOTES:
${notes || 'Standard non-hazardous handling.'}

Looking forward to your swift response.

Best regards,
${name || 'Shipper'}
${company || ''}`
    );
    emailBtn.href = `mailto:sales@bpsglobaltrading.com?subject=${subject}&body=${body}`;
  }
}

function handleEnquirySubmit(event) {
  if (event) event.preventDefault();

  const rfqNumber = `RFQ-2026-BPS-${Math.floor(1000 + Math.random() * 9000)}`;
  const refEl = document.getElementById('modalSuccessRef');
  if (refEl) refEl.textContent = rfqNumber;

  const modal = document.getElementById('enquirySuccessModal');
  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
  }

  return false;
}

function closeEnquiryModal() {
  const modal = document.getElementById('enquirySuccessModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
}

// Expose globals for inline HTML handlers
window.handleEnquirySubmit = handleEnquirySubmit;
window.closeEnquiryModal = closeEnquiryModal;
window.setLanguage = setLanguage;



