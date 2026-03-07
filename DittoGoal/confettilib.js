(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.PrettyConfetti = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;

  const DEFAULTS = {
    autoStart: false,
    autoResize: true,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    zIndex: 12,
    pointerEvents: "none",
    clearAlpha: 1,
    layout: {
      width: "100%",
      height: "100%"
    },
    colors: [
      "#FFD166",
      "#FF6B6B",
      "#7BDFF2",
      "#B2F7EF",
      "#CDB4DB",
      "#A0C4FF",
      "#CAFFBF",
      "#FFC6FF"
    ],
    customShapes: {},
    emitters: [
      {
        id: "left",
        x: 0.16,
        y: 0.82,
        angle: -78,
        spread: 22,
        power: [10, 18],
        rate: 0,
        burst: 90,
        burstJitter: 0.35,
        life: [60, 120],
        gravity: 0.26,
        drag: 0.992,
        sway: [0.02, 0.08],
        wobbleSpeed: [0.08, 0.22],
        spin: [-0.25, 0.25],
        tilt: [-0.2, 0.2],
        size: [8, 18],
        opacity: [0.88, 1],
        shapes: ["rect", "streamer", "circle"],
        colors: null,
        enabled: true
      },
      {
        id: "right",
        x: 0.84,
        y: 0.82,
        angle: -102,
        spread: 22,
        power: [10, 18],
        rate: 0,
        burst: 90,
        burstJitter: 0.35,
        life: [60, 120],
        gravity: 0.26,
        drag: 0.992,
        sway: [0.02, 0.08],
        wobbleSpeed: [0.08, 0.22],
        spin: [-0.25, 0.25],
        tilt: [-0.2, 0.2],
        size: [8, 18],
        opacity: [0.88, 1],
        shapes: ["rect", "streamer", "circle"],
        colors: null,
        enabled: true
      }
    ],
    partyMode: {
      enabled: false,
      interval: 320,
      burstMin: 18,
      burstMax: 40,
      alternateEmitters: true,
      randomizeAngle: 6,
      randomizePower: 0.12
    }
  };

  function isObj(v) {
    return v && typeof v === "object" && !Array.isArray(v);
  }

  function deepMerge(target, source) {
    const out = Array.isArray(target) ? target.slice() : Object.assign({}, target);
    if (!isObj(source) && !Array.isArray(source)) return out;

    Object.keys(source).forEach(function (key) {
      const a = out[key];
      const b = source[key];

      if (Array.isArray(b)) {
        out[key] = b.slice();
      } else if (isObj(b)) {
        out[key] = deepMerge(isObj(a) ? a : {}, b);
      } else {
        out[key] = b;
      }
    });

    return out;
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function irand(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function rangeVal(v) {
    return Array.isArray(v) ? rand(v[0], v[1]) : v;
  }

  function normalizeAngle(deg) {
    return deg * DEG;
  }

  function resolveCoord(value, total) {
    if (typeof value === "string" && value.indexOf("%") > -1) {
      return (parseFloat(value) / 100) * total;
    }
    if (typeof value === "number" && value >= 0 && value <= 1) {
      return value * total;
    }
    return +value || 0;
  }

  function createCanvas() {
    const el = document.createElement("canvas");
    const ctx = el.getContext("2d", { alpha: true });
    return { el, ctx };
  }

  function svgToImage(svgString) {
    return new Promise(function (resolve, reject) {
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function (err) {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }

  async function rasterizeSVG(svgString, size, color) {
    const safeSVG = String(svgString).replace(/\{\{\s*color\s*\}\}/g, color || "#fff");
    const img = await svgToImage(safeSVG);
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const x = c.getContext("2d");
    x.clearRect(0, 0, size, size);

    const ratio = Math.min(size / img.width, size / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const dx = (size - w) * 0.5;
    const dy = (size - h) * 0.5;

    x.drawImage(img, dx, dy, w, h);
    return c;
  }

  function makeOffscreenRect(color) {
    const c = document.createElement("canvas");
    c.width = 36;
    c.height = 24;
    const x = c.getContext("2d");

    x.save();
    x.fillStyle = color;
    x.beginPath();
    x.roundRect(2, 2, 32, 20, 4);
    x.fill();

    const g1 = x.createLinearGradient(0, 0, 0, 24);
    g1.addColorStop(0, "rgba(255,255,255,.32)");
    g1.addColorStop(0.45, "rgba(255,255,255,.08)");
    g1.addColorStop(1, "rgba(0,0,0,.18)");
    x.fillStyle = g1;
    x.beginPath();
    x.roundRect(2, 2, 32, 20, 4);
    x.fill();

    x.restore();
    return c;
  }

  function makeOffscreenCircle(color) {
    const c = document.createElement("canvas");
    c.width = 28;
    c.height = 28;
    const x = c.getContext("2d");

    x.save();
    x.fillStyle = color;
    x.beginPath();
    x.arc(14, 14, 11, 0, TAU);
    x.fill();

    const g = x.createRadialGradient(9, 8, 1, 14, 14, 12);
    g.addColorStop(0, "rgba(255,255,255,.35)");
    g.addColorStop(0.55, "rgba(255,255,255,.06)");
    g.addColorStop(1, "rgba(0,0,0,.15)");
    x.fillStyle = g;
    x.beginPath();
    x.arc(14, 14, 11, 0, TAU);
    x.fill();

    x.restore();
    return c;
  }

  function makeOffscreenStreamer(color) {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 14;
    const x = c.getContext("2d");

    x.save();
    x.fillStyle = color;
    x.beginPath();
    x.roundRect(2, 3, 60, 8, 8);
    x.fill();

    const g = x.createLinearGradient(0, 0, 0, 14);
    g.addColorStop(0, "rgba(255,255,255,.3)");
    g.addColorStop(1, "rgba(0,0,0,.16)");
    x.fillStyle = g;
    x.beginPath();
    x.roundRect(2, 3, 60, 8, 8);
    x.fill();

    x.restore();
    return c;
  }

  class PrettyConfettiEngine {
    constructor(container, options) {
      if (!container || !(container instanceof Element)) {
        throw new Error("PrettyConfetti: container inválido.");
      }

      this.container = container;
      this.options = deepMerge(DEFAULTS, options || {});
      this.emitters = [];
      this.particles = [];
      this.assets = new Map();
      this.customAssetCache = new Map();
      this.running = false;
      this.destroyed = false;
      this.partyTimer = 0;
      this.partyIndex = 0;
      this.lastTime = 0;
      this.resizeRaf = 0;

      const pair = createCanvas();
      this.canvas = pair.el;
      this.ctx = pair.ctx;

      this._boundTick = this.tick.bind(this);
      this._boundResize = this.handleResize.bind(this);

      this.setupDOM();
      this.setEmitters(this.options.emitters);

      if (this.options.autoResize) {
        window.addEventListener("resize", this._boundResize, { passive: true });
      }

      this.handleResize();

      if (this.options.autoStart || this.options.partyMode.enabled) {
        this.start();
      }
    }

    setupDOM() {
      const s = this.canvas.style;
      s.position = "absolute";
      s.inset = "0";
      s.width = "100%";
      s.height = "100%";
      s.pointerEvents = this.options.pointerEvents;
      s.zIndex = String(this.options.zIndex);

      const cs = getComputedStyle(this.container);
      if (cs.position === "static") {
        this.container.style.position = "relative";
      }

      this.container.appendChild(this.canvas);
    }

    handleResize() {
      cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = requestAnimationFrame(() => {
        const rect = this.container.getBoundingClientRect();
        this.width = Math.max(1, Math.round(rect.width));
        this.height = Math.max(1, Math.round(rect.height));
        this.dpr = this.options.pixelRatio || 1;

        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      });
    }

    setOptions(next) {
      this.options = deepMerge(this.options, next || {});
      if (next && next.emitters) this.setEmitters(next.emitters);
      if (next && next.pixelRatio) this.handleResize();
      return this;
    }

    setEmitters(list) {
      this.emitters = (list || []).map((emitter, i) => {
        const base = deepMerge(DEFAULTS.emitters[0], emitter || {});
        if (!base.id) base.id = "emitter-" + i;
        return base;
      });
      return this;
    }

    async getShapeAsset(shape, color, baseSize) {
      const key = shape + "|" + color + "|" + baseSize;
      if (this.assets.has(key)) return this.assets.get(key);

      let asset = null;

      if (shape === "rect") {
        asset = makeOffscreenRect(color);
      } else if (shape === "circle") {
        asset = makeOffscreenCircle(color);
      } else if (shape === "streamer") {
        asset = makeOffscreenStreamer(color);
      } else if (this.options.customShapes && this.options.customShapes[shape]) {
        asset = await rasterizeSVG(this.options.customShapes[shape], Math.max(32, baseSize * 3), color);
      }

      if (!asset) {
        asset = makeOffscreenRect(color);
      }

      this.assets.set(key, asset);
      return asset;
    }

    resolveEmitterPosition(emitter) {
      return {
        x: resolveCoord(emitter.x, this.width),
        y: resolveCoord(emitter.y, this.height)
      };
    }

    async makeParticle(emitter, burstScale) {
      const color = pick(emitter.colors || this.options.colors);
      const shape = pick(emitter.shapes || ["rect"]);
      const size = Math.max(4, rangeVal(emitter.size));
      const angle = normalizeAngle(emitter.angle + rand(-emitter.spread, emitter.spread));
      const power = rangeVal(emitter.power) * (burstScale || 1);
      const pos = this.resolveEmitterPosition(emitter);
      const life = Math.max(20, rangeVal(emitter.life));
      const opacity = clamp(rangeVal(emitter.opacity), 0, 1);

      const asset = await this.getShapeAsset(shape, color, Math.ceil(size));

      const particle = {
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        ax: 0,
        ay: 0,
        size: size,
        width: shape === "streamer" ? size * rand(1.6, 2.8) : size,
        height: shape === "streamer" ? size * rand(0.35, 0.6) : size * rand(0.85, 1.25),
        rotation: rand(0, TAU),
        rotationSpeed: rangeVal(emitter.spin),
        tilt: rangeVal(emitter.tilt),
        tiltDir: Math.random() > 0.5 ? 1 : -1,
        gravity: emitter.gravity,
        drag: emitter.drag,
        sway: rangeVal(emitter.sway),
        wobble: rand(0, TAU),
        wobbleSpeed: rangeVal(emitter.wobbleSpeed),
        opacity: opacity,
        maxLife: life,
        life: life,
        shape: shape,
        color: color,
        asset: asset
      };

      return particle;
    }

    async emit(emitterLike, amount, opts) {
      const emitter = deepMerge(DEFAULTS.emitters[0], emitterLike || {});
      const count = Math.max(1, amount | 0);
      const burstScale = opts && opts.burstScale ? opts.burstScale : 1;

      const batch = [];
      for (let i = 0; i < count; i++) {
        batch.push(this.makeParticle(emitter, burstScale));
      }

      const created = await Promise.all(batch);
      for (let i = 0; i < created.length; i++) {
        this.particles.push(created[i]);
      }

      if (!this.running) this.start();
      return created;
    }

    async fire(target, overrides) {
      let emitter = null;

      if (typeof target === "string") {
        emitter = this.emitters.find(e => e.id === target) || this.emitters[0];
      } else if (typeof target === "number") {
        emitter = this.emitters[target] || this.emitters[0];
      } else if (isObj(target)) {
        emitter = deepMerge(this.emitters[0] || DEFAULTS.emitters[0], target);
      } else {
        emitter = this.emitters[0] || DEFAULTS.emitters[0];
      }

      const finalEmitter = deepMerge(emitter, overrides || {});
      const burst = Math.max(1, Math.round(rangeVal(finalEmitter.burst) * rand(1 - finalEmitter.burstJitter, 1 + finalEmitter.burstJitter)));

      return this.emit(finalEmitter, burst);
    }

    async partyBurst() {
      if (!this.emitters.length) return;

      const pm = this.options.partyMode;
      let emitter = null;

      if (pm.alternateEmitters) {
        emitter = this.emitters[this.partyIndex % this.emitters.length];
        this.partyIndex++;
      } else {
        emitter = pick(this.emitters);
      }

      if (!emitter || emitter.enabled === false) return;

      const burst = irand(pm.burstMin, pm.burstMax);
      const angleJitter = rand(-pm.randomizeAngle, pm.randomizeAngle);
      const powerScale = rand(1 - pm.randomizePower, 1 + pm.randomizePower);

      const tweaked = deepMerge(emitter, {
        angle: emitter.angle + angleJitter,
        burst: burst
      });

      await this.emit(tweaked, burst, { burstScale: powerScale });
    }

    stepParticles(dt) {
      const w = this.width;
      const h = this.height;
      const alive = [];

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];

        p.life -= dt * 60;
        if (p.life <= 0) continue;

        p.wobble += p.wobbleSpeed * dt * 60;
        p.vx += Math.sin(p.wobble) * p.sway;
        p.vy += p.gravity * dt * 60;
        p.vx *= Math.pow(p.drag, dt * 60);
        p.vy *= Math.pow(p.drag, dt * 20);

        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        p.rotation += p.rotationSpeed * dt * 60;
        p.tilt += 0.04 * p.tiltDir * dt * 60;

        const fadeIn = clamp((p.maxLife - p.life) / 10, 0, 1);
        const fadeOut = clamp(p.life / 22, 0, 1);
        p.renderAlpha = p.opacity * Math.min(fadeIn, fadeOut);

        if (p.x < -150 || p.x > w + 150 || p.y > h + 180) continue;

        alive.push(p);
      }

      this.particles = alive;
    }

    renderParticle(p) {
      const ctx = this.ctx;
      const flip = Math.cos(p.tilt * 3.6 + p.wobble);
      const squash = 0.45 + Math.abs(flip) * 0.55;
      const shine = 0.6 + Math.abs(flip) * 0.4;

      ctx.save();
      ctx.globalAlpha = p.renderAlpha;

      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.shape === "streamer") {
        ctx.scale(1, squash);
      } else {
        ctx.scale(squash, 1);
      }

      const dw = p.width;
      const dh = p.height;

      ctx.drawImage(p.asset, -dw * 0.5, -dh * 0.5, dw, dh);

      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = p.renderAlpha * 0.18 * shine;
      ctx.fillStyle = "#fff";

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(-dw * 0.1, -dh * 0.15, Math.max(1.5, dw * 0.14), 0, TAU);
        ctx.fill();
      } else {
        ctx.fillRect(-dw * 0.28, -dh * 0.26, dw * 0.22, dh * 0.16);
      }

      ctx.restore();
    }

    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      for (let i = 0; i < this.particles.length; i++) {
        this.renderParticle(this.particles[i]);
      }
    }

    tick(now) {
      if (!this.running || this.destroyed) return;

      if (!this.lastTime) this.lastTime = now;
      const dt = Math.min(0.033, Math.max(0.008, (now - this.lastTime) / 1000));
      this.lastTime = now;

      if (this.options.partyMode.enabled) {
        this.partyTimer += dt * 1000;
        if (this.partyTimer >= this.options.partyMode.interval) {
          this.partyTimer = 0;
          this.partyBurst();
        }
      }

      for (let i = 0; i < this.emitters.length; i++) {
        const em = this.emitters[i];
        if (!em || em.enabled === false || !em.rate) continue;

        em._acc = (em._acc || 0) + em.rate * dt;
        const spawn = em._acc | 0;

        if (spawn > 0) {
          em._acc -= spawn;
          this.emit(em, spawn);
        }
      }

      this.stepParticles(dt);
      this.render();

      if (this.particles.length === 0 && !this.options.partyMode.enabled && !this.hasContinuousEmitters()) {
        this.running = false;
        this.lastTime = 0;
        return;
      }

      requestAnimationFrame(this._boundTick);
    }

    hasContinuousEmitters() {
      for (let i = 0; i < this.emitters.length; i++) {
        if (this.emitters[i] && this.emitters[i].enabled !== false && this.emitters[i].rate > 0) {
          return true;
        }
      }
      return false;
    }

    start() {
      if (this.running || this.destroyed) return this;
      this.running = true;
      this.lastTime = 0;
      requestAnimationFrame(this._boundTick);
      return this;
    }

    stop() {
      this.running = false;
      return this;
    }

    clear() {
      this.particles.length = 0;
      this.ctx.clearRect(0, 0, this.width, this.height);
      return this;
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.running = false;
      cancelAnimationFrame(this.resizeRaf);
      window.removeEventListener("resize", this._boundResize);
      this.particles.length = 0;
      this.assets.clear();
      this.customAssetCache.clear();
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
    }
  }

  function init(container, options) {
    return new PrettyConfettiEngine(container, options);
  }

  return {
    init: init,
    version: "0.1.0"
  };
});
