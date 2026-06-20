import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Renderer, Program, Mesh, Geometry } from 'ogl';
import html2canvas from 'html2canvas';

import '../Galaxy.css';
import '../ElectricBorder.css';
import '../ProfileCard.css';

const haptic = (type = 'light') => {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  const patterns = { light: [10], medium: [25], success: [10, 50, 10] };
  navigator.vibrate(patterns[type] || patterns.light);
};

const HeartBurst = ({ active }) => {
  if (!active) return null;
  return (
    <div className="heart-burst" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="heart-particle" style={{ '--i': i }} />
      ))}
    </div>
  );
};

class Triangle extends Geometry {
  constructor(gl) {
    super(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }
    });
  }
}

/* --- GALAXY COMPONENT --- */
const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;
varying vec2 vUv;

#define NUM_LAYER 2.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) { return abs(fract(x) * 2.0 - 1.0); }
float tris(float x) { float t = fract(x); return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0)); }
float trisn(float x) { float t = fract(x); return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0; }
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;
      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));
      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;
      float star = Star(gv - offset - pad, flareSize);
      vec3 color = base;
      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;
      col += star * size * color;
    }
  }
  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;
  vec2 mouseNorm = uMouse - vec2(0.5);
  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }
  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;
  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }
  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}`;

function Galaxy({ focal = [0.5, 0.5], rotation = [1.0, 0.0], starSpeed = 0.5, density = 1, hueShift = 140, disableAnimation = false, speed = 1.0, mouseInteraction = true, glowIntensity = 0.3, saturation = 0.0, mouseRepulsion = true, repulsionStrength = 2, twinkleIntensity = 0.3, rotationSpeed = 0.1, autoCenterRepulsion = 0, transparent = true, ...rest }) {
  const [activated, setActivated] = useState(false);
  const ctnDom = useRef(null);
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const smoothMousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMouseActive = useRef(0.0);
  const smoothMouseActive = useRef(0.0);

  useEffect(() => {
    let idleId;
    const activate = () => {
      setActivated(true);
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener('click', activate);
      window.removeEventListener('touchstart', activate);
      window.removeEventListener('mousemove', activate);
      if (idleId) {
        if ('cancelIdleCallback' in window) {
          window.cancelIdleCallback(idleId);
        } else {
          clearTimeout(idleId);
        }
      }
    };

    window.addEventListener('click', activate, { once: true });
    window.addEventListener('touchstart', activate, { once: true });
    window.addEventListener('mousemove', activate, { once: true });

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(activate, { timeout: 2000 });
    } else {
      idleId = setTimeout(activate, 2000);
    }

    return cleanup;
  }, []);

  useEffect(() => {
    if (!activated || !ctnDom.current) return;
    const ctn = ctnDom.current;
    const renderer = new Renderer({ alpha: transparent, premultipliedAlpha: false });
    const gl = renderer.gl;
    if (transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    } else {
      gl.clearColor(0, 0, 0, 1);
    }

    let program;
    function resize() {
      const scale = 1;
      renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
      if (program) {
        program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height];
      }
    }
    window.addEventListener('resize', resize, false);
    resize();

    const geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height] },
        uFocal: { value: new Float32Array(focal) },
        uRotation: { value: new Float32Array(rotation) },
        uStarSpeed: { value: starSpeed },
        uDensity: { value: density },
        uHueShift: { value: hueShift },
        uSpeed: { value: speed },
        uMouse: { value: new Float32Array([smoothMousePos.current.x, smoothMousePos.current.y]) },
        uGlowIntensity: { value: glowIntensity },
        uSaturation: { value: saturation },
        uMouseRepulsion: { value: mouseRepulsion },
        uTwinkleIntensity: { value: twinkleIntensity },
        uRotationSpeed: { value: rotationSpeed },
        uRepulsionStrength: { value: repulsionStrength },
        uMouseActiveFactor: { value: 0.0 },
        uAutoCenterRepulsion: { value: autoCenterRepulsion },
        uTransparent: { value: transparent }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    let animateId;
    function update(t) {
      animateId = requestAnimationFrame(update);
      if (!disableAnimation) {
        program.uniforms.uTime.value = t * 0.001;
        program.uniforms.uStarSpeed.value = (t * 0.001 * starSpeed) / 10.0;
      }

      const lerpFactor = 0.05;
      smoothMousePos.current.x += (targetMousePos.current.x - smoothMousePos.current.x) * lerpFactor;
      smoothMousePos.current.y += (targetMousePos.current.y - smoothMousePos.current.y) * lerpFactor;
      smoothMouseActive.current += (targetMouseActive.current - smoothMouseActive.current) * lerpFactor;
      program.uniforms.uMouse.value[0] = smoothMousePos.current.x;
      program.uniforms.uMouse.value[1] = smoothMousePos.current.y;
      program.uniforms.uMouseActiveFactor.value = smoothMouseActive.current;
      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    function handleMouseMove(e) {
      const rect = ctn.getBoundingClientRect();
      targetMousePos.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height
      };
      targetMouseActive.current = 1.0;
    }

    function handleMouseLeave() {
      targetMouseActive.current = 0.0;
    }

    if (mouseInteraction) {
      ctn.addEventListener('mousemove', handleMouseMove);
      ctn.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      if (mouseInteraction) {
        ctn.removeEventListener('mousemove', handleMouseMove);
        ctn.removeEventListener('mouseleave', handleMouseLeave);
      }
      ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [activated, focal, rotation, starSpeed, density, hueShift, disableAnimation, speed, mouseInteraction, glowIntensity, saturation, mouseRepulsion, twinkleIntensity, rotationSpeed, repulsionStrength, autoCenterRepulsion, transparent]);

  return <div ref={ctnDom} className="galaxy-container" {...rest} />;
}

/* --- ELECTRIC BORDER COMPONENT --- */
const ElectricBorder = ({ children, color = '#c5a059', speed = 1, chaos = 0.12, borderRadius = 6, className, style }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const mountedRef = useRef(true);

  const random = useCallback(x => (Math.sin(x * 12.9898) * 43758.5453) % 1, []);
  const noise2D = useCallback((x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const a = random(i + j * 57), b = random(i + 1 + j * 57), c = random(i + (j + 1) * 57), d = random(i + 1 + (j + 1) * 57);
    const ux = fx * fx * (3.0 - 2.0 * fx), uy = fy * fy * (3.0 - 2.0 * fy);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  }, [random]);

  const octavedNoise = useCallback((x, oct, lac, gn, bAmp, bFreq, time, seed, bFlat) => {
    let y = 0, amp = bAmp, freq = bFreq;
    for (let i = 0; i < oct; i++) {
      let oAmp = amp;
      if (i === 0) oAmp *= bFlat;
      y += oAmp * noise2D(freq * x + seed * 100, time * freq * 0.3);
      freq *= lac;
      amp *= gn;
    }
    return y;
  }, [noise2D]);

  const getCornerPoint = useCallback((cx, cy, radius, startAngle, arcLength, progress) => {
    const angle = startAngle + progress * arcLength;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  }, []);

  const getRoundedRectPoint = useCallback((t, left, top, width, height, radius) => {
    const sw = width - 2 * radius, sh = height - 2 * radius, ca = (Math.PI * radius) / 2, tp = 2 * sw + 2 * sh + 4 * ca, d = t * tp;
    let acc = 0;
    if (d <= acc + sw) return { x: left + radius + ((d - acc) / sw) * sw, y: top };
    acc += sw;
    if (d <= acc + ca) return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, (d - acc) / ca);
    acc += ca;
    if (d <= acc + sh) return { x: left + width, y: top + radius + ((d - acc) / sh) * sh };
    acc += sh;
    if (d <= acc + ca) return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, (d - acc) / ca);
    acc += ca;
    if (d <= acc + sw) return { x: left + width - radius - ((d - acc) / sw) * sw, y: top + height };
    acc += sw;
    if (d <= acc + ca) return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, (d - acc) / ca);
    acc += ca;
    if (d <= acc + sh) return { x: left, y: top + height - radius - ((d - acc) / sh) * sh };
    acc += sh;
    return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, (d - acc) / ca);
  }, [getCornerPoint]);

  useEffect(() => {
    mountedRef.current = true;
    const canvas = canvasRef.current, ctn = containerRef.current;
    if (!canvas || !ctn) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const rect = ctn.getBoundingClientRect(), width = rect.width + 120, height = rect.height + 120, dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      return { width, height };
    };
    let { width, height } = updateSize();

    const draw = ts => {
      if (!mountedRef.current) return;
      const dt = (ts - lastFrameTimeRef.current) / 1000;
      timeRef.current += dt * speed;
      lastFrameTimeRef.current = ts;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const left = 60, top = 60, bw = width - 120, bh = height - 120, rad = Math.min(borderRadius, Math.min(bw, bh) / 2), ap = 2 * (bw + bh) + 2 * Math.PI * rad, sc = Math.floor(ap / 2);
      ctx.beginPath();
      for (let i = 0; i <= sc; i++) {
        const p = i / sc, pt = getRoundedRectPoint(p, left, top, bw, bh, rad), xN = octavedNoise(p * 8, 10, 1.6, 0.7, chaos, 10, timeRef.current, 0, 0), yN = octavedNoise(p * 8, 10, 1.6, 0.7, chaos, 10, timeRef.current, 1, 0);
        if (i === 0) ctx.moveTo(pt.x + xN * 60, pt.y + yN * 60);
        else ctx.lineTo(pt.x + xN * 60, pt.y + yN * 60);
      }
      ctx.closePath();
      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => {
      if (!mountedRef.current) return;
      const sz = updateSize();
      width = sz.width;
      height = sz.height;
    });
    ro.observe(ctn);
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      mountedRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      ro.disconnect();
    };
  }, [color, speed, chaos, borderRadius, octavedNoise, getRoundedRectPoint]);

  return (
    <div ref={containerRef} className={`electric-border ${className ?? ''}`} style={{ '--electric-border-color': color, borderRadius, ...style }}>
      <div className="eb-canvas-container"><canvas ref={canvasRef} className="eb-canvas" /></div>
      <div className="eb-layers"><div className="eb-glow-1" /><div className="eb-glow-2" /><div className="eb-background-glow" /></div>
      <div className="eb-content">{children}</div>
    </div>
  );
};

/* --- WISDOM CARD COMPONENT --- */
const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v, pr = 3) => parseFloat(v.toFixed(pr));
const adjust = (v, f1, f2, t1, t2) => round(t1 + ((t2 - t1) * (v - f1)) / (f2 - f1));

const WisdomCard = React.forwardRef(({ card }, ref) => {
  const wrapRef = useRef(null);
  const shellRef = useRef(null);

  const showDonation = useMemo(() => {
    if (!card || !card.id) return false;
    let hash = 0;
    for (let i = 0; i < card.id.length; i++) {
      hash = (hash << 5) - hash + card.id.charCodeAt(i);
    }
    return Math.abs(hash) % 10 < 3; // 30% stable probability check
  }, [card]);

  const tiltEngineRef = useRef(null);
  if (!tiltEngineRef.current) {
    let rafId = null, running = false, lastTs = 0, curX = 0, curY = 0, tarX = 0, tarY = 0, initUntil = 0;
    const step = ts => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const tau = ts < initUntil ? 0.6 : 0.14, k = 1 - Math.exp(-dt / tau);
      curX += (tarX - curX) * k;
      curY += (tarY - curY) * k;

      const s = shellRef.current, w = wrapRef.current;
      if (s && w) {
        const wd = s.clientWidth || 1, h = s.clientHeight || 1, px = clamp((100 / wd) * curX), py = clamp((100 / h) * curY), cx = px - 50, cy = py - 50;
        const props = {
          '--pointer-x': `${px}%`,
          '--pointer-y': `${py}%`,
          '--background-x': `${adjust(px, 0, 100, 35, 65)}%`,
          '--background-y': `${adjust(py, 0, 100, 35, 65)}%`,
          '--pointer-from-center': `${clamp(Math.hypot(cy, cx) / 50, 0, 1)}`,
          '--pointer-from-top': `${py / 100}`,
          '--pointer-from-left': `${px / 100}`,
          '--rotate-x': `${round(-(cx / 5))}deg`,
          '--rotate-y': `${round(cy / 4)}deg`
        };
        for (const [k, v] of Object.entries(props)) w.style.setProperty(k, v);
      }
      if (Math.abs(tarX - curX) > 0.05 || Math.abs(tarY - curY) > 0.05 || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
      }
    };
    const start = () => { if (!running) { running = true; lastTs = 0; rafId = requestAnimationFrame(step); } };
    tiltEngineRef.current = {
      setImmediate(x, y) { curX = x; curY = y; },
      setTarget(x, y) { tarX = x; tarY = y; start(); },
      toCenter() { const s = shellRef.current; if (s) this.setTarget(s.clientWidth / 2, s.clientHeight / 2); },
      beginInitial(ms) { initUntil = performance.now() + ms; start(); },
      getCurrent() { return { x: curX, y: curY, tx: tarX, ty: tarY }; },
      cancel() { if (rafId) cancelAnimationFrame(rafId); running = false; }
    };
  }
  const tiltEngine = tiltEngineRef.current;

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const onEnter = e => { const r = shell.getBoundingClientRect(); tiltEngine.setTarget(e.clientX - r.left, e.clientY - r.top); };
    const onMove = e => { const r = shell.getBoundingClientRect(); tiltEngine.setTarget(e.clientX - r.left, e.clientY - r.top); };
    const onLeave = () => { tiltEngine.toCenter(); };
    shell.addEventListener('pointerenter', onEnter);
    shell.addEventListener('pointermove', onMove);
    shell.addEventListener('pointerleave', onLeave);

    tiltEngine.setImmediate(shell.clientWidth / 2, shell.clientHeight / 2);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(1200);

    return () => {
      shell.removeEventListener('pointerenter', onEnter);
      shell.removeEventListener('pointermove', onMove);
      shell.removeEventListener('pointerleave', onLeave);
      tiltEngine.cancel();
    };
  }, [tiltEngine]);

  return (
    <div ref={wrapRef} className="pc-card-wrapper">
      <div className="pc-behind" style={{ '--behind-glow-size': '70%' }} />
      <div ref={shellRef} className="pc-card-shell">
        <section className="pc-card" ref={ref}>
          <div className="pc-inside">
            <div className="pc-shine" /><div className="pc-glare" />
            <div className="pc-content">
              <span className="pc-wisdom-category">{card.categoria.replaceAll('_', ' ')}</span>
              <h2 className="pc-frase">“{card.frase}”</h2>
              <p className="pc-interpretacion">{card.interpretacion}</p>
              <div className="pc-practica">
                <label>Invitación hoy</label>
                <p>{card.practica_hoy}</p>
              </div>
              <div className="pc-card-footer">
                <img src="icons/enso-8bit.png" className="pc-card-logo" alt="Círculo Enso - Símbolo taoísta de presencia y vacío" />
              </div>
              {showDonation && (
                <div className="pc-donation-gentle">
                  <span>✧</span>
                  <a href={import.meta.env.VITE_DONATION_URL || 'https://buymeacoffee.com/herramente'} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     onClick={(e) => e.stopPropagation()}>
                    ¿Te ha servido esta reflexión? Invita un café al oráculo
                  </a>
                  <span>✧</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
});

WisdomCard.displayName = 'WisdomCard';

/* --- MAIN APP COMPONENT --- */
function App() {
  const [card, setCard] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('trozos_sabiduria_favorites') || '[]'));
  const [theme, setTheme] = useState(() => localStorage.getItem('ritual_theme') || 'dark');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(window.matchMedia('(display-mode: standalone)').matches);
  const [toasts, setToasts] = useState([]);
  const [donationCount, setDonationCount] = useState(() => {
    const val = localStorage.getItem('oraculoqi_donation_count');
    return val ? parseInt(val, 10) : 0;
  });
  const [donationDismissed, setDonationDismissed] = useState(false);
  const [cupPulse, setCupPulse] = useState(false);
  const [cardExiting, setCardExiting] = useState(false);
  const [exitDir, setExitDir] = useState('left');
  const [favBurst, setFavBurst] = useState(false);
  const cardRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const showToast = useCallback((msg) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      if (mountedRef.current) {
        setToasts(prev => prev.filter(t => t.id !== id));
      }
    }, 4000);
  }, []);

  useEffect(() => {
    window.showAppUpdateToast = () => {
      showToast("Nueva versión disponible. Por favor recarga para aplicar ✧");
    };
    return () => {
      delete window.showAppUpdateToast;
    };
  }, [showToast]);

  const pulseCup = useCallback(() => {
    setCupPulse(true);
    setTimeout(() => setCupPulse(false), 800);
  }, []);

  useEffect(() => {
    if (window.TAOISTA_DATASET) {
      const deck = window.TAOISTA_DATASET.cards, today = new Date().toISOString().split('T')[0];
      let hash = 0;
      for (let i = 0; i < today.length; i++) hash = ((hash << 5) - hash) + today.charCodeAt(i);
      setCard(deck[Math.abs(hash | 0) % deck.length]);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ritual_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('trozos_sabiduria_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const formattedDate = useMemo(() => new Date().toLocaleDateString(), []);

  useEffect(() => {
    if (showCodex) {
      document.title = "El Codex — Oráculo Taoísta";
    } else if (showInfo) {
      document.title = "Protocolo Erudito — Oráculo Taoísta";
    } else if (card) {
      document.title = `Sincronía: ${card.categoria.replaceAll('_', ' ')} — Oráculo Taoísta`;
    } else {
      document.title = "Oráculo Taoísta";
    }
  }, [card, showCodex, showInfo]);

  const lastActiveElement = useRef(null);
  const codexRef = useRef(null);
  const infoRef = useRef(null);

  useEffect(() => {
    if (showCodex || showInfo) {
      lastActiveElement.current = document.activeElement;
      setTimeout(() => {
        const modal = showCodex ? codexRef.current : infoRef.current;
        if (modal) {
          const closeBtn = modal.querySelector('.close-btn');
          if (closeBtn) closeBtn.focus();
        }
      }, 50);
    } else {
      if (lastActiveElement.current && typeof lastActiveElement.current.focus === 'function') {
        lastActiveElement.current.focus();
      }
    }
  }, [showCodex, showInfo]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCodex(false);
        setShowInfo(false);
        return;
      }
      if (e.key === 'Tab') {
        const modal = (showCodex && codexRef.current) || (showInfo && infoRef.current);
        if (!modal) return;
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length === 0) return;
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };
    if (showCodex || showInfo) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCodex, showInfo]);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!card) return;
    setFavorites(f => {
      const exists = f.find(x => x.id === card.id);
      if (exists) {
        haptic('light');
        showToast("Sabiduría retirada del Codex");
        return f.filter(x => x.id !== card.id);
      } else {
        haptic('success');
        setFavBurst(true);
        setTimeout(() => setFavBurst(false), 700);
        showToast("Sabiduría guardada en tu Codex 📖");
        pulseCup();
        return [...f, card];
      }
    });
  }, [card, showToast, pulseCup]);

  const refreshCard = useCallback((dir = 'left') => {
    if (!window.TAOISTA_DATASET) return;
    const deck = window.TAOISTA_DATASET.cards;
    if (deck.length === 0) return;

    haptic('medium');
    setExitDir(dir);
    setCardExiting(true);

    setTimeout(() => {
      let newCard;
      if (deck.length === 1) {
        newCard = deck[0];
      } else {
        do {
          newCard = deck[Math.floor(Math.random() * deck.length)];
        } while (card && newCard.id === card.id);
      }
      setCard(newCard);
      setDonationCount(prev => {
        const next = prev + 1;
        localStorage.setItem('oraculoqi_donation_count', next.toString());
        return next;
      });
      setDonationDismissed(false);
      setCardExiting(false);
    }, 300);
  }, [card]);

  const cycleTheme = useCallback(() => {
    haptic('light');
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 400);
    const themes = ['dark', 'light', 'sumi-e'];
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(next);
    showToast(`Tema: ${next === 'dark' ? 'Oscuro ◉' : next === 'light' ? 'Claro ○' : 'Sumi-e ∿'}`);
  }, [theme, showToast]);

  const shareCard = useCallback(async () => {
    if (!card) return;
    const cardElement = cardRef.current;
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true
      });

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) {
        throw new Error("No se pudo generar el blob de la imagen");
      }

      const file = new File([blob], 'oraculo-taoista.png', { type: 'image/png' });
      const data = {
        title: 'Oráculo Taoísta',
        text: `"${card.frase}"\n\n- Oráculo Taoísta`,
        files: [file]
      };

      if (navigator.canShare && navigator.canShare(data)) {
        await navigator.share(data);
        showToast("¡Sincronía compartida con éxito! ✧");
        pulseCup();
      } else {
        const link = document.createElement('a');
        link.download = 'oraculo-taoista.png';
        link.href = canvas.toDataURL();
        link.click();
        showToast("Imagen descargada con éxito ✧");
        pulseCup();
      }

    } catch (e) {
      console.error("Error al compartir imagen:", e);
      const dataText = {
        title: 'Oráculo Taoísta',
        text: `"${card.frase}"\n\n- Oráculo Taoísta`,
        url: window.location.href
      };
      try {
        if (navigator.share) {
          await navigator.share(dataText);
          showToast("Sincronía compartida (texto) ✧");
          pulseCup();
        } else {
          await navigator.clipboard.writeText(`${dataText.text}\n${dataText.url}`);
          showToast("No se pudo generar la imagen, pero el texto se ha copiado al portapapeles ✧");
          pulseCup();
        }
      } catch (err) {
        console.error(err);
        showToast("Error al compartir sincronía");
      }
    }
  }, [card, showToast, pulseCup]);

  const installApp = useCallback(async () => {
    if (!installPrompt || isInstalled) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt, isInstalled]);

  const openDonation = useCallback(() => {
    window.open(import.meta.env.VITE_DONATION_URL || "https://buymeacoffee.com/herramente", "_blank", "noopener,noreferrer");
  }, []);

  const handleReveal = () => {
    haptic('medium');
    setIsRevealed(true);
    setTimeout(() => {
      const cardEl = cardRef.current;
      if (cardEl) {
        cardEl.classList.add('reveal-flash');
        setTimeout(() => cardEl.classList.remove('reveal-flash'), 800);
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const handleTouchStart = useCallback((e) => {
    if (!e.touches[0]) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(deltaX) > 60 && deltaY < 100) {
      refreshCard(deltaX < 0 ? 'left' : 'right');
    }
  }, [refreshCard]);

  if (!card) return (
    <div className="app-container skeleton-loading">
      <div className="main-content">
        <header className="app-header">
          <div className="skeleton-avatar" />
          <div className="brand-info" style={{ alignItems: 'center', gap: '8px', display: 'flex', flexDirection: 'column' }}>
            <div className="skeleton-line" style={{ width: '180px', height: '2rem' }} />
            <div className="skeleton-line" style={{ width: '110px', height: '0.7rem', marginTop: '4px' }} />
          </div>
        </header>
        <div className="skeleton-card-wrap">
          <div className="skeleton-line" style={{ width: '32%', height: '0.65rem' }} />
          <div className="skeleton-line" style={{ width: '90%', height: '1.8rem', marginTop: '20px' }} />
          <div className="skeleton-line" style={{ width: '68%', height: '1.8rem', marginTop: '10px' }} />
          <div className="skeleton-line" style={{ width: '100%', height: '0.9rem', marginTop: '28px' }} />
          <div className="skeleton-line" style={{ width: '86%', height: '0.9rem', marginTop: '10px' }} />
          <div className="skeleton-line" style={{ width: '62%', height: '0.9rem', marginTop: '10px' }} />
          <div className="skeleton-practica">
            <div className="skeleton-line" style={{ width: '25%', height: '0.65rem' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '0.9rem', marginTop: '10px' }} />
            <div className="skeleton-line" style={{ width: '75%', height: '0.9rem', marginTop: '8px' }} />
          </div>
        </div>
      </div>
    </div>
  );

  const isFav = favorites.some(f => f.id === card.id);

  return (
    <div className="app-container">
      <Galaxy speed={0.4} density={theme === 'dark' ? 0.8 : 0.4} hueShift={theme === 'dark' ? 140 : 200} twinkleIntensity={0.4} />

      <main className="main-content">
        <header className="app-header">
          <img src="icons/enso-8bit.png" className="app-logo" alt="Círculo Enso - Símbolo taoísta de presencia y vacío" />
          <div className="brand-info">
            <h1 className="brand-title">Oráculo Taoísta</h1>
            <p className="sync-label">Sincronía · {formattedDate}</p>
          </div>
        </header>

        <div className="card-stage">
          {!isRevealed ? (
            <div 
              className="card-placeholder" 
              role="button" 
              tabIndex={0} 
              aria-label="Desvelar la carta del oráculo" 
              onClick={handleReveal}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleReveal()}
            >
              <ElectricBorder color="var(--ritual-red)" speed={0.6} chaos={0.08} borderRadius={12}>
                <div className="reveal-overlay"><span>Desvelar el Tao</span></div>
              </ElectricBorder>
            </div>
          ) : (
            <div
              className={`revealed-content${cardExiting ? ` exiting-${exitDir}` : ''}`}
              key={card.id}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <WisdomCard card={card} ref={cardRef} />
              
              {donationCount > 0 && donationCount % 5 === 0 && !donationDismissed ? (
                <div className="donation-invite">
                  <p>Si esta sabiduría resuena contigo y quieres ayudar a que siga fluyendo, considera invitarnos un café.</p>
                  <div className="donation-invite-buttons">
                    <a 
                      href={import.meta.env.VITE_DONATION_URL || "https://buymeacoffee.com/herramente"} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-donation-coffee"
                      onClick={() => setDonationDismissed(true)}
                    >
                      Invitar un café ☕
                    </a>
                    <button 
                      className="btn-donation-skip" 
                      onClick={() => setDonationDismissed(true)}
                    >
                      Seguir consultando
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn-refresh" onClick={() => refreshCard('left')}>Otra sincronía para hoy</button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Menu */}
      <div className={`floating-menu-container ${menuOpen ? 'active' : ''}`}>
        <button 
          className="menu-main-btn" 
          onClick={() => setMenuOpen(!menuOpen)} 
          aria-expanded={menuOpen} 
          aria-label="Menú de acciones" 
          title="Menú"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
        </button>
        <div className="menu-options">
          <div style={{ position: 'relative' }}>
            <HeartBurst active={favBurst} />
            <button className={`menu-opt-btn ${isFav ? 'is-fav' : ''}`} onClick={toggleFavorite} title="Favorito" aria-label="Guardar en favoritos" tabIndex={menuOpen ? 0 : -1}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            </button>
          </div>
          <button className="menu-opt-btn" onClick={shareCard} title="Compartir" aria-label="Compartir carta" tabIndex={menuOpen ? 0 : -1}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
          </button>
          <button className="menu-opt-btn" onClick={cycleTheme} title="Tema" aria-label="Cambiar tema" tabIndex={menuOpen ? 0 : -1}>
            {theme === 'dark' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
            {theme === 'light' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
            {theme === 'sumi-e' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}
          </button>
          <button className="menu-opt-btn" onClick={installApp} title={isInstalled ? 'Instalada' : 'Instalar app'} aria-label="Instalar aplicación" disabled={!installPrompt || isInstalled} tabIndex={menuOpen ? 0 : -1}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          </button>
          <button className="menu-opt-btn" onClick={() => setShowCodex(true)} title="Codex" aria-label="Abrir codex" tabIndex={menuOpen ? 0 : -1}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16.5a2.5 2.5 0 0 0-2.5-2.5H6.5A2.5 2.5 0 0 0 4 19.5z" /></svg>
          </button>
          <button className="menu-opt-btn" onClick={() => setShowInfo(true)} title="Info" aria-label="Ver información" tabIndex={menuOpen ? 0 : -1}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
          </button>
          <button className={`menu-opt-btn ${cupPulse ? 'donation-pulse' : ''}`} onClick={openDonation} title="Apoyar" aria-label="Donar" tabIndex={menuOpen ? 0 : -1}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
          </button>
        </div>
      </div>

      {/* Codex Modal */}
      {showCodex && (
        <div ref={codexRef} className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="codex-title" onClick={() => setShowCodex(false)}>
          <header className="modal-header" onClick={(e) => e.stopPropagation()}>
            <h2 id="codex-title" className="modal-title">El Codex</h2>
            <button className="close-btn" onClick={() => setShowCodex(false)} aria-label="Cerrar modal">&times;</button>
          </header>
          <div className="codex-list" onClick={(e) => e.stopPropagation()}>
            {favorites.length === 0 ? (
              <div className="codex-empty-state">
                <svg className="codex-empty-icon" width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <circle cx="36" cy="36" r="30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.35"/>
                  <path d="M36 18C36 18 24 30 24 39C24 45.627 29.373 51 36 51C42.627 51 48 45.627 48 39C48 30 36 18 36 18Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5"/>
                  <circle cx="36" cy="39" r="3.5" fill="currentColor" opacity="0.4"/>
                </svg>
                <h3 className="codex-empty-title">Tu Codex aguarda</h3>
                <p className="codex-empty-desc">Cuando una sincronía resuene contigo, guárdala pulsando el corazón en el menú flotante.</p>
                <button className="codex-empty-cta" onClick={() => setShowCodex(false)}>
                  Buscar mi primera sincronía
                </button>
              </div>
            ) : (
              favorites.map(f => (
                <div key={f.id} className="codex-item" onClick={() => { setCard(f); setShowCodex(false); setIsRevealed(true); }}>
                  <span className="codex-item-cat">{f.categoria.replaceAll('_', ' ')}</span>
                  <p className="codex-item-frase">"{f.frase}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfo && (
        <div ref={infoRef} className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="info-title" onClick={() => setShowInfo(false)}>
          <header className="modal-header" onClick={(e) => e.stopPropagation()}>
            <h2 id="info-title" className="modal-title">Protocolo Erudito</h2>
            <button className="close-btn" onClick={() => setShowInfo(false)} aria-label="Cerrar modal">&times;</button>
          </header>
          <div className="info-content" onClick={(e) => e.stopPropagation()}>
            <h3>Sobre el Conocimiento</h3>
            <p>El conocimiento interior no es neutral. A veces se explora como un paisaje. A veces se escucha como un ritual. En ambos casos, tiene consecuencias.</p>
            <h3>Créditos</h3>
            <p>Diseño y Concepto: Cosmología Visual de la Reflexión.</p>
            <p>Desarrollado para la contemplación diaria.</p>
            <p>Contacto y Sugerencias: <a href="mailto:miniappsminisoluciones@gmail.com" style={{color: 'var(--ritual-pink)'}}>miniappsminisoluciones@gmail.com</a></p>
            <div className="info-modal-version">Oráculo Taoísta v1.2.0</div>
            <div className="support-section">
              <p>Si este oráculo te ha servido de guía, considera apoyar el mantenimiento de este espacio de calma.</p>
              <a href={import.meta.env.VITE_DONATION_URL || "https://buymeacoffee.com/herramente"} target="_blank" rel="noopener noreferrer" className="support-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                Invitar un Café
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Toasts Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast-notification">
            <span>✧</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
