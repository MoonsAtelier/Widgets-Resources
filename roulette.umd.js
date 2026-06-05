(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MoonsRoulette = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

const defaultSettings = {
  copies: 11,
  startCycle: 5,

  accelDuration: 2.6,
  fastDuration: 1.9,
  brakeDuration: 5.8,
  snapDuration: 0.55,

  maxSpeed: 4200,
  minFinalLoops: 4,

  centerScale: 1.13,
  edgeScale: 0.48,
  centerOpacity: 1,
  edgeOpacity: 0.22,

  depthRange: 470,

  arcEnabled: true,
  arcDropPx: 26,

  equalVisibleSpacing: true,
  visualGapPx: 24,

  showMultiplierFrom: 2,

  multiplierAffectsChance: true,
  minimumChanceWeight: 1,

  participantAddShiftDuration: 0.72,
  participantAddPopDuration: 0.42,
  participantAddSlideDuration: 0.56,
  participantAddSlideFromY: -96,
  participantAddSlideStagger: 0.022,
  participantBubbleSwapOutDuration: 0.18,
  participantBubbleSwapInDuration: 0.34,
  ticketBubbleAnimDuration: 0.42,

  showAnimExtraRange: 150,
  showCircleDuration: 0.52,
  showCircleStagger: 0.035,

  hideCircleDuration: 0.34,
  hideCircleStagger: 0.026,

  winnerRevealEnabled: true,
  winnerRevealScale: 1.72,
  winnerRevealLift: -22,
  winnerRevealHold: 5,
  winnerRevealRestoreDuration: 0.46,
  winnerLoserFadeDuration: 0.34,
  winnerLoserStagger: 0.018,

  winnerHidePointerAndBubble: true,
  winnerSelectorHideDuration: 0.32,
  winnerSelectorRestoreDuration: 0.4,

  confettiCount: 78,
  confettiDuration: 1.45,
  confettiSpreadX: 235,
  confettiSpreadY: 145,

  entranceCornerGifs: [
    {
      corner: "bottom-left",
      src: "https://res.cloudinary.com/dfth1anmt/image/upload/v1780685958/full_ver_qyhoit.gif",
      handSrc: "https://res.cloudinary.com/dfth1anmt/image/upload/v1780690936/Frame_16_uv17ds.png",
      flipX: true
    },
    {
      corner: "bottom-right",
      src: "https://res.cloudinary.com/dfth1anmt/image/upload/v1780685934/FULL_VER_NO_WATER_ms8dmo.gif",
      handSrc: "https://res.cloudinary.com/dfth1anmt/image/upload/v1780690770/Frame_17_w7oykm.png",
      flipX: false
    }
  ],
  entranceGifSize: 142,
  entranceGifSceneBleedX: 34,
  entranceGifSceneBleedY: 18,

  cornerHandsEnabled: true,
  cornerHandsRestoreAfterWinner: false,
  cornerHandHeight: 80,
  cornerHandTop: 1,
  cornerHandLeft: 6,
  cornerHandLeftByCorner: {
    "bottom-left": 45,
    "bottom-right": 6
  },
  cornerHandIntroScale: 0.2,
  cornerHandIntroDuration: 0.42,
  cornerHandIntroStagger: 0.06,
  cornerHandIntroY: 8,
  cornerHandIntroX: 8,
  cornerHandIntroRotation: 32,
  cornerHandOscillationEnabled: true,
  cornerHandOscillationPx: 3,
  cornerHandOscillationDuration: 1.05,

  tickSoundUrl: "https://res.cloudinary.com/dfth1anmt/video/upload/v1780588438/spin_uumocf.wav",
  tickVolume: 0.45,
  minTickInterval: 42,

  winnerSoundUrl: "https://res.cloudinary.com/dfth1anmt/video/upload/v1779214130/shine_fp3z2h.mp3",
  winnerSoundVolume: 0.65,

  twitchAvatarEnabled: true,
  twitchAvatarEndpoint: "https://decapi.me/twitch/avatar",
  twitchAvatarTimeoutMs: 4500,

  idleTopText: "!JOIN o “JOIN” Channel point reward",
  spinningTopText: "Spinning... picking a winner!",
  winnerTopText: winner => `WINNER: ${winner.name}`,

  defaultUserImage: name => {
    const cleanName = String(name || "?").trim();
    const letter = encodeURIComponent(cleanName[0] || "?");
    return `https://placehold.co/120x120/d9dde0/a8adb2?text=${letter}`;
  }
};

const defaultUsers = [
  { name: "JOCA", img: "https://placehold.co/120x120/d9dde0/a8adb2?text=J", tickets: 1 },
  { name: "SORU_NEVE", img: "https://placehold.co/120x120/d9dde0/a8adb2?text=S", tickets: 1 },
  { name: "YUPANCI", img: "https://placehold.co/120x120/d9dde0/a8adb2?text=Y", tickets: 1 },
  { name: "COMPl1CATED", img: "https://placehold.co/120x120/d9dde0/a8adb2?text=C", tickets: 1 },
  { name: "SLUNAB", img: "https://placehold.co/120x120/d9dde0/a8adb2?text=S", tickets: 1 },
  { name: "MUMOO", img: "https://placehold.co/120x120/d9dde0/a8adb2?text=M", tickets: 1 },
  { name: "NAHU", img: "https://placehold.co/120x120/d9dde0/a8adb2?text=N", tickets: 1 },
  { name: "MIJAS", img: "https://placehold.co/120x120/d9dde0/a8adb2?text=M", tickets: 1 }
];

function cloneUsers(users) {
  return users.map(user => ({ ...user }));
}

function init(options = {}) {
const doc = options.document || document;
const win = options.window || window;
const rouletteSettings = {
  ...defaultSettings,
  ...(options.settings || {})
};
const rouletteUsers = cloneUsers(options.users || defaultUsers);
const elements = options.elements || {};

function resolveElement(key, fallbackSelector) {
  const value = elements[key];

  if (typeof value === "string") return doc.querySelector(value);
  if (value) return value;

  return doc.querySelector(fallbackSelector);
}

const scene = resolveElement("scene", "#rouletteScene");
const track = resolveElement("track", "#rouletteTrack");
const topPill = resolveElement("topPill", "#topPill");
const selectorLayer = resolveElement("selectorLayer", "#selectorLayer");
const selectorPointer = resolveElement("selectorPointer", "#selectorPointer");
const selectorNameWrap = resolveElement("selectorNameWrap", ".selector-name-wrap");
const selectorName = resolveElement("selectorName", "#selectorName");
const spinButton = resolveElement("spinButton", "#spinButton");
const spinButtonText = spinButton ? spinButton.querySelector(".spin-button-text") : null;

const toggleButton = resolveElement("toggleButton", "#toggleButton");
const toggleButtonText = toggleButton ? toggleButton.querySelector(".toggle-button-text") : null;

const participantUI = {
  toast: resolveElement("toast", "#rouletteParticipantToast")
};

gsap.set(topPill, { xPercent: -50 });
gsap.set(selectorLayer, { xPercent: -50 });
gsap.set(selectorNameWrap, { xPercent: -50 });

gsap.set(selectorPointer, {
  xPercent: -50,
  yPercent: -50,
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  transformOrigin: "50% 50%"
});

gsap.set(scene, {
  autoAlpha: 0,
  pointerEvents: "none"
});

if (spinButton) {
  gsap.set(spinButton, {
    autoAlpha: 0,
    y: 22,
    scale: 0.82,
    pointerEvents: "none"
  });
}

if (toggleButton) {
  gsap.set(toggleButton, {
    autoAlpha: 1,
    y: 0,
    scale: 1
  });
}

let rouletteVisible = false;
let visibilityTween = null;
let winnerRevealTween = null;
let participantTween = null;
let confettiLayer = null;

const state = {
  distance: 0,
  speed: 0,
  freeSpin: false,
  spinning: false,
  revealing: false,
  loopWidth: 0,
  step: 0,
  avatarSize: 0,
  baseX: 0,
  currentName: "",
  currentCenterSlot: null,
  currentCenterAvatar: null,
  currentCenterIndex: null,
  lastTickAt: 0,
  participantNameSwapActive: false
};

const visualDataMap = new WeakMap();
const twitchAvatarRequests = new WeakMap();
const tickSoundPool = [];
let tickSoundPoolIndex = 0;
let winnerSound = null;
let api = null;
const entranceGifSlots = createEntranceGifLayer();

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function sanitizeTickets(value) {
  const tickets = Math.floor(Number(value));
  const min = rouletteSettings.minimumChanceWeight || 1;

  if (!Number.isFinite(tickets)) return min;

  return Math.max(min, tickets);
}

function getDefaultUserImage(name) {
  const fallback = rouletteSettings.defaultUserImage;

  if (typeof fallback === "function") {
    return fallback(name);
  }

  return String(fallback || "");
}

function resolveTwitchAvatarRequestUrl(name) {
  if (!rouletteSettings.twitchAvatarEnabled) return "";

  if (typeof rouletteSettings.twitchAvatarUrl === "function") {
    return rouletteSettings.twitchAvatarUrl(name);
  }

  const endpoint = String(rouletteSettings.twitchAvatarEndpoint || "").trim();

  if (!endpoint) return "";

  return `${endpoint.replace(/\/+$/, "")}/${encodeURIComponent(name)}`;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeAvatarResponse(value) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue || /\s/.test(cleanValue)) return "";

  return isHttpUrl(cleanValue) ? cleanValue : "";
}

function fetchTwitchAvatarUrl(name) {
  const requestUrl = resolveTwitchAvatarRequestUrl(name);

  if (!requestUrl || typeof win.fetch !== "function") {
    return Promise.resolve("");
  }

  const timeoutMs = Number(rouletteSettings.twitchAvatarTimeoutMs) || 0;
  const AbortControllerCtor = win.AbortController || (typeof AbortController !== "undefined" ? AbortController : null);
  const controller = timeoutMs > 0 && AbortControllerCtor ? new AbortControllerCtor() : null;
  const timeoutId = controller
    ? win.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  return win.fetch(requestUrl, controller ? { signal: controller.signal } : undefined)
    .then(response => {
      if (!response.ok) return "";
      return response.text();
    })
    .then(normalizeAvatarResponse)
    .catch(() => "")
    .then(avatarUrl => {
      if (timeoutId) win.clearTimeout(timeoutId);
      return avatarUrl;
    });
}

function setAvatarImageElement(img, user) {
  const fallbackImage = getDefaultUserImage(user.name);

  img.alt = user.name;
  img.draggable = false;
  img.onerror = () => {
    img.onerror = null;
    img.src = fallbackImage;
  };
  img.src = user.img || fallbackImage;
}

function refreshUserAvatarElements(user) {
  const targetName = normalizeName(user.name);

  [...track.querySelectorAll(".avatar-slot")].forEach(slot => {
    if (normalizeName(slot.dataset.name) !== targetName) return;

    const img = slot.querySelector("img");
    if (img) setAvatarImageElement(img, user);
  });
}

function requestTwitchAvatarForUser(user) {
  const requestName = user.name;
  const requestToken = {};

  twitchAvatarRequests.set(user, requestToken);

  fetchTwitchAvatarUrl(requestName).then(avatarUrl => {
    if (twitchAvatarRequests.get(user) !== requestToken) return;

    const index = findUserIndexByName(requestName);

    if (index < 0 || rouletteUsers[index] !== user || !avatarUrl) return;

    user.img = avatarUrl;
    refreshUserAvatarElements(user);
    syncParticipantUI(user.name);
  });
}

function getMultiplierNumber(multiplier) {
  if (!multiplier) return 1;

  const match = String(multiplier).match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 1;
}

function getUserTickets(user) {
  if (!user) return rouletteSettings.minimumChanceWeight || 1;

  if (Number.isFinite(Number(user.tickets))) {
    return sanitizeTickets(user.tickets);
  }

  if (user.multiplier) {
    return sanitizeTickets(getMultiplierNumber(user.multiplier));
  }

  return rouletteSettings.minimumChanceWeight || 1;
}

function getUserMultiplierLabel(user) {
  return `x${getUserTickets(user)}`;
}

function getMultiplierFontSize(label) {
  const length = String(label || "").length;

  if (length <= 2) return "12px";
  if (length === 3) return "10px";
  if (length === 4) return "8.5px";

  return "7.5px";
}

function getUserChanceWeight(user) {
  if (!rouletteSettings.multiplierAffectsChance) return 1;
  return getUserTickets(user);
}

function shouldShowMultiplier(userOrMultiplier) {
  const tickets = typeof userOrMultiplier === "object"
    ? getUserTickets(userOrMultiplier)
    : getMultiplierNumber(userOrMultiplier);

  return tickets >= rouletteSettings.showMultiplierFrom;
}

function updateUserDerivedFields(user) {
  user.name = String(user.name || "").trim();
  user.tickets = getUserTickets(user);
  user.multiplier = getUserMultiplierLabel(user);

  if (!user.img) {
    user.img = getDefaultUserImage(user.name);
  }

  return user;
}

function hydrateUsers() {
  rouletteUsers.forEach(updateUserDerivedFields);
}

function findUserIndexByName(name) {
  const target = normalizeName(name);
  return rouletteUsers.findIndex(user => normalizeName(user.name) === target);
}

function getTotalTickets() {
  return rouletteUsers.reduce((sum, user) => {
    return sum + getUserTickets(user);
  }, 0);
}

function getChanceTable() {
  const total = getTotalTickets();

  return rouletteUsers.map(user => {
    const tickets = getUserTickets(user);
    const chance = total > 0 ? tickets / total : 0;

    return {
      name: user.name,
      img: user.img,
      tickets,
      multiplier: getUserMultiplierLabel(user),
      chance,
      chancePercent: `${(chance * 100).toFixed(2)}%`
    };
  });
}

function createEntranceGifLayer() {
  const layer = doc.createElement("div");
  layer.className = "corner-gif-layer";
  layer.setAttribute("aria-hidden", "true");

  const slots = rouletteSettings.entranceCornerGifs.map((config, index) => {
    const slot = doc.createElement("div");
    slot.className = `corner-gif corner-gif--${config.corner}`;
    slot.dataset.corner = config.corner;
    slot.dataset.index = String(index);

    const img = doc.createElement("img");
    img.className = "corner-gif-image";
    img.src = config.src;
    img.alt = "";
    img.draggable = false;

    if (config.flipX) {
      img.classList.add("is-flipped-x");
    }

    if (rouletteSettings.cornerHandsEnabled !== false && config.handSrc) {
      const hand = doc.createElement("img");
      hand.className = "hand";
      hand.src = config.handSrc;
      hand.alt = "";
      hand.draggable = false;
      applyCornerHandBaseStyle(hand, config.corner);
      slot.appendChild(hand);
    }

    slot.appendChild(img);
    layer.appendChild(slot);

    return slot;
  });

  doc.body.appendChild(layer);

  return slots;
}

function getCornerHandLayout(corner) {
  const leftByCorner = rouletteSettings.cornerHandLeftByCorner || {};
  const hasCornerLeft = Object.prototype.hasOwnProperty.call(leftByCorner, corner);

  return {
    height: rouletteSettings.cornerHandHeight,
    top: rouletteSettings.cornerHandTop,
    left: hasCornerLeft ? leftByCorner[corner] : rouletteSettings.cornerHandLeft
  };
}

function applyCornerHandBaseStyle(hand, corner) {
  const layout = getCornerHandLayout(corner);

  Object.assign(hand.style, {
    height: `${layout.height}px`,
    top: `${layout.top}px`,
    left: `${layout.left}px`
  });
}

function syncEntranceGifAnchors() {
  const sceneRect = scene.getBoundingClientRect();
  const size = rouletteSettings.entranceGifSize || 142;
  const bleedX = rouletteSettings.entranceGifSceneBleedX || 0;
  const bleedY = rouletteSettings.entranceGifSceneBleedY || 0;

  entranceGifSlots.forEach(slot => {
    const corner = slot.dataset.corner || "";
    const isLeft = corner.includes("left");
    const left = isLeft
      ? sceneRect.left - bleedX
      : sceneRect.right - size + bleedX;
    const top = sceneRect.bottom - size + bleedY;

    gsap.set(slot, {
      left,
      top,
      right: "auto",
      bottom: "auto",
      width: size,
      height: size
    });
  });
}

function getEntranceGifVector(corner) {
  const isLeft = corner.includes("left");
  const isTop = corner.includes("top");

  return {
    x: isLeft ? -76 : 76,
    y: isTop ? -62 : 62,
    rotation: isLeft === isTop ? -16 : 16
  };
}

function prepareEntranceGifsForShow() {
  syncEntranceGifAnchors();
  setCornerHandsHidden();

  entranceGifSlots.forEach(slot => {
    const vector = getEntranceGifVector(slot.dataset.corner || "");

    gsap.killTweensOf(slot);
    gsap.set(slot, {
      autoAlpha: 0,
      x: vector.x,
      y: vector.y,
      scale: 0.56,
      rotation: vector.rotation
    });
  });
}

function addEntranceGifShowTweens(timeline, startTime = 0) {
  syncEntranceGifAnchors();

  entranceGifSlots.forEach((slot, index) => {
    const corner = slot.dataset.corner || "";
    const bobY = corner.includes("top") ? 5 : -5;
    const t = startTime + index * 0.055;

    timeline
      .to(
        slot,
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          duration: 0.58,
          ease: "back.out(2.35)"
        },
        t
      )
      .to(
        slot,
        {
          y: bobY,
          duration: 0.18,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut"
        },
        t + 0.44
      );
  });
}

function addEntranceGifHideTweens(timeline, startTime = 0) {
  syncEntranceGifAnchors();
  setCornerHandsHidden();

  entranceGifSlots.forEach((slot, index) => {
    const vector = getEntranceGifVector(slot.dataset.corner || "");

    timeline.to(
      slot,
      {
        autoAlpha: 0,
        x: vector.x,
        y: vector.y,
        scale: 0.56,
        rotation: vector.rotation,
        duration: 0.32,
        ease: "back.in(1.7)"
      },
      startTime + index * 0.03
    );
  });
}

function addEntranceGifWinnerHideTweens(timeline, startTime = 0) {
  syncEntranceGifAnchors();

  entranceGifSlots.forEach((slot, index) => {
    const vector = getEntranceGifVector(slot.dataset.corner || "");
    const hand = slot.querySelector("img.hand");
    const handMotion = getCornerHandMotion(slot.dataset.corner || "");
    const t = startTime + index * 0.035;

    timeline.to(
      slot,
      {
        autoAlpha: 0,
        x: vector.x * 0.45,
        y: vector.y * 0.45,
        scale: 0.72,
        rotation: vector.rotation * 0.65,
        duration: 0.28,
        ease: "back.in(1.8)"
      },
      t
    );

    if (hand) {
      gsap.killTweensOf(hand);
      timeline.to(
        hand,
        {
          autoAlpha: 0,
          x: handMotion.x,
          y: handMotion.y,
          scale: rouletteSettings.cornerHandIntroScale,
          rotation: handMotion.rotation,
          transformOrigin: handMotion.transformOrigin,
          duration: 0.2,
          ease: "back.in(1.7)"
        },
        t
      );
    }
  });
}

function addEntranceGifWinnerRestoreTweens(timeline, startTime = 0) {
  if (!rouletteVisible) return;

  syncEntranceGifAnchors();

  entranceGifSlots.forEach((slot, index) => {
    const vector = getEntranceGifVector(slot.dataset.corner || "");

    timeline.fromTo(
      slot,
      {
        autoAlpha: 0,
        x: vector.x * 0.45,
        y: vector.y * 0.45,
        scale: 0.72,
        rotation: vector.rotation * 0.65
      },
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.42,
        ease: "back.out(2.2)"
      },
      startTime + index * 0.055
    );
  });

  if (rouletteSettings.cornerHandsRestoreAfterWinner) {
    timeline.call(animateCornerHandsIn, null, startTime + 0.48);
  }
}

function getCornerHandMotion(corner) {
  const isLeft = corner.includes("left");
  const direction = isLeft ? -1 : 1;
  const introX = rouletteSettings.cornerHandIntroX * direction;
  const introRotation = rouletteSettings.cornerHandIntroRotation * direction;

  return {
    transformOrigin: isLeft ? "bottom left" : "bottom right",
    rotation: introRotation,
    x: introX,
    y: rouletteSettings.cornerHandIntroY
  };
}

function startCornerHandOscillation(hand) {
  if (rouletteSettings.cornerHandOscillationEnabled === false) return;

  const amplitude = Number(rouletteSettings.cornerHandOscillationPx) || 0;

  if (amplitude <= 0) return;

  gsap.killTweensOf(hand);
  gsap.set(hand, { x: -amplitude });
  gsap.to(hand, {
    x: amplitude,
    duration: rouletteSettings.cornerHandOscillationDuration,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
}

function setCornerHandsHidden() {
  entranceGifSlots.forEach(slot => {
    const hand = slot.querySelector("img.hand");
    if (!hand) return;

    const motion = getCornerHandMotion(slot.dataset.corner || "");

    gsap.killTweensOf(hand);
    gsap.set(hand, {
      autoAlpha: 0,
      x: motion.x,
      y: motion.y,
      scale: rouletteSettings.cornerHandIntroScale,
      rotation: motion.rotation,
      transformOrigin: motion.transformOrigin
    });
  });
}

function animateCornerHandsIn() {
  if (rouletteSettings.cornerHandsEnabled === false) return;

  syncEntranceGifAnchors();

  entranceGifSlots.forEach((slot, index) => {
    const hand = slot.querySelector("img.hand");
    if (!hand) return;

    const motion = getCornerHandMotion(slot.dataset.corner || "");

    gsap.killTweensOf(hand);
    gsap.fromTo(
      hand,
      {
        autoAlpha: 0,
        x: motion.x,
        y: motion.y,
        scale: rouletteSettings.cornerHandIntroScale,
        rotation: motion.rotation,
        transformOrigin: motion.transformOrigin
      },
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: rouletteSettings.cornerHandIntroDuration,
        delay: index * rouletteSettings.cornerHandIntroStagger,
        ease: "back.out(2.45)",
        onComplete: () => startCornerHandOscillation(hand)
      }
    );
  });
}

function createTickSoundPool() {
  tickSoundPool.length = 0;

  for (let i = 0; i < 8; i++) {
    const audio = new Audio(rouletteSettings.tickSoundUrl);
    audio.volume = rouletteSettings.tickVolume;
    audio.preload = "auto";
    tickSoundPool.push(audio);
  }
}

function unlockSounds() {
  tickSoundPool.forEach(audio => {
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
    }).catch(() => {});
  });
}

function playTickSound() {
  const now = performance.now();

  if (now - state.lastTickAt < rouletteSettings.minTickInterval) return;

  state.lastTickAt = now;

  const audio = tickSoundPool[tickSoundPoolIndex];
  tickSoundPoolIndex = (tickSoundPoolIndex + 1) % tickSoundPool.length;

  if (!audio) return;

  audio.currentTime = 0;
  audio.volume = rouletteSettings.tickVolume;
  audio.play().catch(() => {});
}

function createWinnerSound() {
  winnerSound = new Audio(rouletteSettings.winnerSoundUrl);
  winnerSound.volume = rouletteSettings.winnerSoundVolume;
  winnerSound.preload = "auto";
}

function unlockWinnerSound() {
  if (!winnerSound) return;

  winnerSound.play().then(() => {
    winnerSound.pause();
    winnerSound.currentTime = 0;
  }).catch(() => {});
}

function playWinnerSound() {
  if (!winnerSound) return;

  winnerSound.currentTime = 0;
  winnerSound.volume = rouletteSettings.winnerSoundVolume;
  winnerSound.play().catch(() => {});
}

function bumpPointer() {
  gsap.killTweensOf(selectorPointer);

  gsap.set(selectorPointer, {
    xPercent: -50,
    yPercent: -50,
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    transformOrigin: "50% 50%"
  });

  gsap.timeline()
    .to(selectorPointer, {
      rotation: -5,
      duration: 0.08,
      ease: "power2.out"
    })
    .to(selectorPointer, {
      rotation: 3,
      duration: 0.1,
      ease: "power2.out"
    })
    .to(selectorPointer, {
      rotation: 0,
      duration: 0.18,
      ease: "sine.out"
    });
}

function animateTopPillText(nextText) {
  gsap.killTweensOf(topPill);

  gsap.timeline()
    .to(topPill, {
      y: -18,
      scale: 0.72,
      rotation: -4,
      opacity: 0,
      duration: 0.18,
      ease: "back.in(2.4)"
    })
    .call(() => {
      topPill.textContent = nextText;
    })
    .fromTo(
      topPill,
      {
        y: 18,
        scale: 0.72,
        rotation: 4,
        opacity: 0
      },
      {
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 0.42,
        ease: "elastic.out(1, 0.55)"
      }
    );
}

function showParticipantToast(message) {
  if (!participantUI.toast) return;

  participantUI.toast.textContent = message;

  gsap.killTweensOf(participantUI.toast);

  gsap.fromTo(
    participantUI.toast,
    {
      autoAlpha: 0,
      y: 12,
      scale: 0.9
    },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.24,
      ease: "back.out(2)",
      onComplete: () => {
        gsap.to(participantUI.toast, {
          autoAlpha: 0,
          y: -8,
          scale: 0.94,
          duration: 0.22,
          delay: 1.1,
          ease: "sine.in"
        });
      }
    }
  );
}

function setToggleButtonState(text, disabled) {
  if (!toggleButton || !toggleButtonText) return;

  toggleButtonText.textContent = text;
  toggleButton.classList.toggle("is-disabled", disabled);
}

function setButtonState(text, disabled) {
  if (!spinButton || !spinButtonText) return;

  spinButtonText.textContent = text;
  spinButton.classList.toggle("is-disabled", disabled);
}

function wrapPositive(value) {
  if (!state.loopWidth) return 0;
  return ((value % state.loopWidth) + state.loopWidth) % state.loopWidth;
}

function buildRoulette(centerIndex = null) {
  hydrateUsers();

  track.innerHTML = "";

  for (let copy = 0; copy < rouletteSettings.copies; copy++) {
    rouletteUsers.forEach((user, index) => {
      const slot = document.createElement("div");
      slot.className = "avatar-slot";
      slot.dataset.index = index;
      slot.dataset.name = user.name;
      slot.dataset.multiplier = getUserMultiplierLabel(user);
      slot.dataset.tickets = String(getUserTickets(user));

      const avatar = document.createElement("div");
      avatar.className = "avatar";

      const imageWrap = document.createElement("div");
      imageWrap.className = "avatar-image-wrap";

      const img = document.createElement("img");
      setAvatarImageElement(img, user);

      imageWrap.appendChild(img);
      avatar.appendChild(imageWrap);

      if (shouldShowMultiplier(user)) {
        const multiplierLabel = getUserMultiplierLabel(user);
        const multi = document.createElement("div");
        multi.className = "avatar-multi";
        multi.style.setProperty("--multi-font-size", getMultiplierFontSize(multiplierLabel));
        multi.textContent = multiplierLabel;
        avatar.appendChild(multi);
      }

      slot.appendChild(avatar);
      track.appendChild(slot);
    });
  }

  measureRoulette();

  if (Number.isFinite(centerIndex)) {
    const safeIndex = Math.max(0, Math.min(rouletteUsers.length - 1, centerIndex));
    state.distance = getDistanceForIndex(safeIndex);
  } else {
    setInitialPosition();
  }

  renderRoulette();
  syncParticipantUI();
}

function measureRoulette() {
  const slots = [...track.querySelectorAll(".avatar-slot")];
  const first = slots[0];
  const second = slots[1];

  if (!first || !second) {
    throw new Error("Roulette needs at least 2 users.");
  }

  state.avatarSize = first.offsetWidth;
  state.step = second.offsetLeft - first.offsetLeft;
  state.loopWidth = rouletteUsers.length * state.step;
  state.baseX = -state.loopWidth * rouletteSettings.startCycle;
}

function setInitialPosition() {
  const preferredIndex = Math.floor(rouletteUsers.length / 2);
  state.distance = getDistanceForIndex(preferredIndex);
}

function getDistanceForIndex(index) {
  const sceneCenter = scene.clientWidth / 2;
  const itemCenter = index * state.step + state.avatarSize / 2;
  return wrapPositive(itemCenter - sceneCenter);
}

function getSlotBaseData() {
  const sceneRect = scene.getBoundingClientRect();
  const sceneCenter = sceneRect.left + sceneRect.width / 2;
  const slots = [...track.querySelectorAll(".avatar-slot")];

  return slots
    .map(slot => {
      const rect = slot.getBoundingClientRect();
      const rawCenter = rect.left + rect.width / 2;
      const rawDistance = rawCenter - sceneCenter;
      const normalized = Math.min(Math.abs(rawDistance) / rouletteSettings.depthRange, 1);

      const scale = gsap.utils.interpolate(
        rouletteSettings.centerScale,
        rouletteSettings.edgeScale,
        normalized
      );

      const opacity = gsap.utils.interpolate(
        rouletteSettings.centerOpacity,
        rouletteSettings.edgeOpacity,
        normalized
      );

      const radius = (state.avatarSize * scale) / 2;

      const arcY = rouletteSettings.arcEnabled
        ? normalized * rouletteSettings.arcDropPx
        : 0;

      return {
        slot,
        avatar: slot.querySelector(".avatar"),
        rawCenter,
        rawDistance,
        normalized,
        scale,
        opacity,
        radius,
        arcY,
        visualCenter: rawCenter,
        visualDistance: rawDistance,
        spacingX: 0
      };
    })
    .sort((a, b) => a.rawCenter - b.rawCenter);
}

function computeVisualLayout() {
  const items = getSlotBaseData();

  if (!items.length) return items;

  if (!rouletteSettings.equalVisibleSpacing) {
    items.forEach(item => {
      item.visualCenter = item.rawCenter;
      item.visualDistance = item.rawDistance;
      item.spacingX = 0;
      visualDataMap.set(item.slot, item);
    });

    return items;
  }

  const sceneRect = scene.getBoundingClientRect();
  const sceneCenter = sceneRect.left + sceneRect.width / 2;

  let anchorIndex = 0;
  let closestDistance = Infinity;

  items.forEach((item, index) => {
    const distance = Math.abs(item.rawCenter - sceneCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      anchorIndex = index;
    }
  });

  items[anchorIndex].visualCenter = items[anchorIndex].rawCenter;

  for (let i = anchorIndex + 1; i < items.length; i++) {
    const prev = items[i - 1];

    items[i].visualCenter =
      prev.visualCenter +
      prev.radius +
      items[i].radius +
      rouletteSettings.visualGapPx;
  }

  for (let i = anchorIndex - 1; i >= 0; i--) {
    const next = items[i + 1];

    items[i].visualCenter =
      next.visualCenter -
      next.radius -
      items[i].radius -
      rouletteSettings.visualGapPx;
  }

  items.forEach(item => {
    item.spacingX = item.visualCenter - item.rawCenter;
    item.visualDistance = item.visualCenter - sceneCenter;
    visualDataMap.set(item.slot, item);
  });

  return items;
}

function getVisibleLayoutItems(sortMode = "center-out") {
  const items = computeVisualLayout();
  const sceneRect = scene.getBoundingClientRect();
  const minX = sceneRect.left - rouletteSettings.showAnimExtraRange;
  const maxX = sceneRect.right + rouletteSettings.showAnimExtraRange;

  const visible = items.filter(item => {
    return item.visualCenter >= minX && item.visualCenter <= maxX;
  });

  visible.sort((a, b) => {
    const da = Math.abs(a.visualDistance);
    const db = Math.abs(b.visualDistance);

    if (sortMode === "edge-in") return db - da;
    return da - db;
  });

  return visible;
}

function getVisibleSlotsByName(name) {
  const target = normalizeName(name);
  const sceneRect = scene.getBoundingClientRect();

  return [...track.querySelectorAll(".avatar-slot")].filter(slot => {
    const data = visualDataMap.get(slot);

    return normalizeName(slot.dataset.name) === target &&
      data &&
      data.visualCenter >= sceneRect.left - rouletteSettings.showAnimExtraRange &&
      data.visualCenter <= sceneRect.right + rouletteSettings.showAnimExtraRange;
  });
}

function getCenteredDistanceFromSlot(slot) {
  const data = visualDataMap.get(slot);
  if (!data) return state.distance;
  return state.distance + data.visualDistance;
}

function renderRoulette() {
  const wrappedDistance = wrapPositive(state.distance);

  gsap.set(track, {
    x: state.baseX - wrappedDistance
  });

  updateDepthAndCurrentUser();
}

function updateDepthAndCurrentUser() {
  const items = computeVisualLayout();

  let closestItem = null;
  let closestDistance = Infinity;

  items.forEach(item => {
    const isParticipantEntering = item.slot.dataset.participantEntering === "true";

    if (isParticipantEntering) {
      gsap.set(item.slot, {
        zIndex: Math.round(1000 - Math.abs(item.visualDistance))
      });
    } else {
      gsap.set(item.slot, {
        y: item.arcY,
        opacity: item.opacity,
        zIndex: Math.round(1000 - Math.abs(item.visualDistance))
      });
    }

    gsap.set(item.avatar, {
      x: item.spacingX,
      scale: item.scale
    });

    const distanceToCenter = Math.abs(item.visualDistance);

    if (distanceToCenter < closestDistance) {
      closestDistance = distanceToCenter;
      closestItem = item;
    }
  });

  if (!closestItem) return;

  const closestSlot = closestItem.slot;
  const closestAvatar = closestItem.avatar;

  if (state.currentCenterAvatar && state.currentCenterAvatar !== closestAvatar) {
    state.currentCenterAvatar.classList.remove("is-center");
  }

  state.currentCenterSlot = closestSlot;
  state.currentCenterAvatar = closestAvatar;
  state.currentCenterAvatar.classList.add("is-center");

  const nextName = closestSlot.dataset.name;
  const nextIndex = Number(closestSlot.dataset.index);

  if (nextIndex !== state.currentCenterIndex) {
    state.currentCenterIndex = nextIndex;

    if (state.spinning) {
      bumpPointer();
      playTickSound();
    }
  }

  if (nextName !== state.currentName) {
    state.currentName = nextName;

    if (!state.participantNameSwapActive) {
      selectorName.textContent = nextName;

      if (!state.spinning || state.speed < 1200) {
        gsap.fromTo(
          selectorName,
          { scale: 0.88 },
          { scale: 1, duration: 0.18, ease: "back.out(2)" }
        );
      }
    }
  }
}

function canEditParticipants() {
  const busyVisibility = visibilityTween && visibilityTween.isActive && visibilityTween.isActive();

  return !state.spinning && !state.revealing && !busyVisibility;
}

function hideSelectorBubbleForParticipantAdd() {
  state.participantNameSwapActive = true;

  if (!selectorNameWrap) return;

  gsap.killTweensOf(selectorNameWrap);
  gsap.killTweensOf(selectorName);

  gsap.to(selectorNameWrap, {
    autoAlpha: 0,
    y: -12,
    scale: 0.72,
    rotation: -3,
    duration: rouletteSettings.participantBubbleSwapOutDuration,
    ease: "back.in(1.9)"
  });
}

function showSelectorBubbleForParticipantAdd(name) {
  selectorName.textContent = name;
  state.currentName = name;
  state.participantNameSwapActive = false;

  if (!selectorNameWrap) return;

  gsap.killTweensOf(selectorNameWrap);
  gsap.killTweensOf(selectorName);

  gsap.fromTo(
    selectorNameWrap,
    {
      xPercent: -50,
      autoAlpha: 0,
      y: 14,
      scale: 0.72,
      rotation: 3
    },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      rotation: 0,
      duration: rouletteSettings.participantBubbleSwapInDuration,
      ease: "back.out(2.35)"
    }
  );

  gsap.fromTo(
    selectorName,
    { scale: 0.84 },
    { scale: 1, duration: 0.24, ease: "back.out(2.2)" }
  );
}

function prepareAddedUserDrop(name) {
  renderRoulette();

  const slots = getVisibleSlotsByName(name);

  slots.forEach((slot, index) => {
    const data = visualDataMap.get(slot);
    const avatar = slot.querySelector(".avatar");

    if (!data || !avatar) return;

    slot.dataset.participantEntering = "true";

    gsap.killTweensOf(slot);
    gsap.killTweensOf(avatar);

    gsap.set(slot, {
      opacity: 0,
      y: data.arcY + rouletteSettings.participantAddSlideFromY,
      zIndex: 2600 - index
    });

    gsap.set(avatar, {
      x: data.spacingX,
      scale: Math.max(0.26, data.scale * 0.76),
      rotation: -7
    });
  });

  return slots;
}

function animateAddedUser(name, preparedSlots = []) {
  if (!rouletteVisible) {
    showSelectorBubbleForParticipantAdd(name);
    return null;
  }

  renderRoulette();

  const slots = preparedSlots.length ? preparedSlots : getVisibleSlotsByName(name);

  if (!slots.length) {
    showSelectorBubbleForParticipantAdd(name);
    return null;
  }

  const timeline = gsap.timeline({
    onComplete: () => {
      slots.forEach(slot => {
        delete slot.dataset.participantEntering;
      });

      showSelectorBubbleForParticipantAdd(name);
      renderRoulette();
    }
  });

  slots.forEach((slot, index) => {
    const data = visualDataMap.get(slot);
    const avatar = slot.querySelector(".avatar");

    if (!data || !avatar) return;

    const delay = index * rouletteSettings.participantAddSlideStagger;

    timeline.fromTo(
      slot,
      {
        opacity: 0,
        y: data.arcY + rouletteSettings.participantAddSlideFromY
      },
      {
        opacity: data.opacity,
        y: data.arcY + 8,
        duration: rouletteSettings.participantAddSlideDuration * 0.72,
        ease: "power3.out"
      },
      delay
    );

    timeline.to(
      slot,
      {
        y: data.arcY,
        duration: rouletteSettings.participantAddSlideDuration * 0.28,
        ease: "back.out(2.4)"
      },
      delay + rouletteSettings.participantAddSlideDuration * 0.62
    );

    timeline.fromTo(
      avatar,
      {
        x: data.spacingX,
        scale: Math.max(0.26, data.scale * 0.76),
        rotation: -7
      },
      {
        x: data.spacingX,
        scale: data.scale,
        rotation: 0,
        duration: rouletteSettings.participantAddPopDuration,
        ease: "back.out(2.45)"
      },
      delay + 0.04
    );
  });

  return timeline;
}

function animateTicketBubble(name) {
  if (!rouletteVisible) return;

  renderRoulette();

  getVisibleSlotsByName(name).forEach((slot, index) => {
    const data = visualDataMap.get(slot);
    const avatar = slot.querySelector(".avatar");
    const bubble = slot.querySelector(".avatar-multi");

    if (avatar && data) {
      gsap.fromTo(
        avatar,
        { scale: data.scale * 0.94 },
        {
          scale: data.scale,
          duration: 0.3,
          delay: index * 0.012,
          ease: "back.out(2.2)"
        }
      );
    }

    if (!bubble) return;

    gsap.killTweensOf(bubble);

    gsap.fromTo(
      bubble,
      {
        autoAlpha: 0,
        scale: 0.18,
        rotation: -18
      },
      {
        autoAlpha: 1,
        scale: 1,
        rotation: 0,
        duration: rouletteSettings.ticketBubbleAnimDuration,
        delay: index * 0.012,
        ease: "back.out(3)"
      }
    );
  });
}

function syncParticipantUI(preferredName = "") {
  if (typeof options.onParticipantsChange === "function" && api) {
    options.onParticipantsChange(api, preferredName);
  }
}

function centerAddedUserWithShift(newIndex, name) {
  const previousIndex = Math.max(0, newIndex - 1);

  buildRoulette(previousIndex);

  if (!rouletteVisible) {
    buildRoulette(newIndex);
    return;
  }

  const enteringSlots = prepareAddedUserDrop(name);
  const targetDistance = getDistanceForIndex(newIndex);

  hideSelectorBubbleForParticipantAdd();

  if (participantTween) participantTween.kill();

  participantTween = gsap.to(state, {
    distance: targetDistance,
    duration: rouletteSettings.participantAddShiftDuration,
    ease: "power3.out",
    onUpdate: renderRoulette,
    onComplete: () => {
      state.distance = wrapPositive(state.distance);
      renderRoulette();
      animateAddedUser(name, enteringSlots);
    }
  });
}

function refreshAfterTicketChange(name) {
  const centerIndex = Number.isFinite(state.currentCenterIndex)
    ? state.currentCenterIndex
    : Math.floor(rouletteUsers.length / 2);

  buildRoulette(centerIndex);
  animateTicketBubble(name);
}

function addUser(name, options = {}) {
  if (!canEditParticipants()) {
    showParticipantToast("Wait until the animation finishes");
    return null;
  }

  const cleanName = String(name || "").trim();

  if (!cleanName) {
    showParticipantToast("Write a valid name");
    return null;
  }

  const existingIndex = findUserIndexByName(cleanName);

  if (existingIndex >= 0) {
    return addTickets(cleanName, options.tickets || options.amount || 1);
  }

  const currentIndex = Number.isFinite(state.currentCenterIndex)
    ? state.currentCenterIndex
    : Math.floor(rouletteUsers.length / 2);

  const insertIndex = Math.min(rouletteUsers.length, currentIndex + 1);
  const explicitImage = String(options.img || "").trim();

  const user = updateUserDerivedFields({
    name: cleanName,
    img: explicitImage || getDefaultUserImage(cleanName),
    tickets: sanitizeTickets(options.tickets || options.amount || 1)
  });

  rouletteUsers.splice(insertIndex, 0, user);

  centerAddedUserWithShift(insertIndex, cleanName);
  syncParticipantUI(cleanName);
  showParticipantToast(`${cleanName} joined · ${getUserMultiplierLabel(user)}`);

  if (!explicitImage && options.twitchAvatar !== false) {
    requestTwitchAvatarForUser(user);
  }

  return user;
}

function addTickets(name, amount = 1) {
  if (!canEditParticipants()) {
    showParticipantToast("Wait until the animation finishes");
    return null;
  }

  const cleanName = String(name || "").trim();

  if (!cleanName) {
    showParticipantToast("Choose a user");
    return null;
  }

  const index = findUserIndexByName(cleanName);

  if (index < 0) {
    return addUser(cleanName, { tickets: amount });
  }

  const user = rouletteUsers[index];

  user.tickets = getUserTickets(user) + sanitizeTickets(amount);
  updateUserDerivedFields(user);

  refreshAfterTicketChange(user.name);
  syncParticipantUI(user.name);
  showParticipantToast(`${user.name} now has ${getUserTickets(user)} tickets`);

  return user;
}

function addTicket(name) {
  return addTickets(name, 1);
}

function setTickets(name, amount = 1) {
  if (!canEditParticipants()) {
    showParticipantToast("Wait until the animation finishes");
    return null;
  }

  const index = findUserIndexByName(name);

  if (index < 0) {
    return addUser(name, { tickets: amount });
  }

  const user = rouletteUsers[index];

  user.tickets = sanitizeTickets(amount);
  updateUserDerivedFields(user);

  refreshAfterTicketChange(user.name);
  syncParticipantUI(user.name);
  showParticipantToast(`${user.name} set to ${getUserTickets(user)} tickets`);

  return user;
}

function removeUser(name) {
  if (!canEditParticipants()) {
    showParticipantToast("Wait until the animation finishes");
    return false;
  }

  if (rouletteUsers.length <= 2) {
    showParticipantToast("Keep at least 2 users");
    return false;
  }

  const index = findUserIndexByName(name);

  if (index < 0) {
    showParticipantToast("User not found");
    return false;
  }

  const [removed] = rouletteUsers.splice(index, 1);
  const centerIndex = Math.min(index, rouletteUsers.length - 1);

  buildRoulette(centerIndex);
  syncParticipantUI();
  showParticipantToast(`${removed.name} removed`);

  return true;
}

function prepareShowAnimation() {
  gsap.set(scene, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    rotation: 0,
    pointerEvents: "none"
  });

  renderRoulette();

  const visibleItems = getVisibleLayoutItems("center-out");

  visibleItems.forEach(item => {
    const side = item.visualDistance === 0 ? 0 : Math.sign(item.visualDistance);

    gsap.set(item.slot, {
      opacity: 0,
      y: item.arcY + 12
    });

    gsap.set(item.avatar, {
      x: item.spacingX - item.visualDistance,
      scale: 0.05,
      rotation: side * 14
    });
  });

  gsap.set(topPill, {
    xPercent: -50,
    autoAlpha: 0,
    y: -16,
    scale: 0.68,
    rotation: -4
  });

  gsap.set(selectorPointer, {
    xPercent: -50,
    yPercent: -50,
    autoAlpha: 0,
    x: 0,
    y: -12,
    scale: 0.45,
    rotation: -12
  });

  gsap.set(selectorNameWrap, {
    xPercent: -50,
    autoAlpha: 0,
    y: 12,
    scale: 0.7
  });

  if (spinButton) {
    gsap.set(spinButton, {
      autoAlpha: 0,
      y: 22,
      scale: 0.82,
      pointerEvents: "none"
    });
  }

  prepareEntranceGifsForShow();

  return visibleItems;
}

function showRoulette() {
  if (rouletteVisible || state.spinning || state.revealing) return;

  rouletteVisible = true;

  if (visibilityTween) visibilityTween.kill();

  const visibleItems = prepareShowAnimation();

  setToggleButtonState("HIDE", true);

  visibilityTween = gsap.timeline({
    onComplete: () => {
      renderRoulette();

      if (spinButton) {
        gsap.set(spinButton, {
          pointerEvents: "auto"
        });
      }

      gsap.set(scene, {
        pointerEvents: "auto"
      });

      setToggleButtonState("HIDE", false);
    }
  });

  visibleItems.forEach((item, index) => {
    const t = index === 0
      ? 0
      : 0.08 + index * rouletteSettings.showCircleStagger;

    visibilityTween
      .to(
        item.slot,
        {
          opacity: item.opacity,
          y: item.arcY,
          duration: 0.24,
          ease: "sine.out"
        },
        t
      )
      .to(
        item.avatar,
        {
          x: item.spacingX,
          scale: item.scale,
          rotation: 0,
          duration: rouletteSettings.showCircleDuration,
          ease: "back.out(2.15)"
        },
        t
      );
  });

  addEntranceGifShowTweens(visibilityTween, 0.06);

  const uiStart = 0.24 + visibleItems.length * rouletteSettings.showCircleStagger;

  visibilityTween
    .to(
      topPill,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.42,
        ease: "elastic.out(1, 0.55)"
      },
      uiStart
    )
    .to(
      selectorPointer,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.38,
        ease: "back.out(2.3)"
      },
      uiStart + 0.08
    )
    .to(
      selectorNameWrap,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.34,
        ease: "back.out(2.1)"
      },
      uiStart + 0.16
    );

  if (spinButton) {
    visibilityTween.to(
      spinButton,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.34,
        ease: "back.out(1.9)"
      },
      uiStart + 0.26
    );
  }
}

function hideRoulette() {
  if (!rouletteVisible || state.spinning || state.revealing) return;

  rouletteVisible = false;

  if (visibilityTween) visibilityTween.kill();
  if (winnerRevealTween) winnerRevealTween.kill();
  if (participantTween) participantTween.kill();

  renderRoulette();

  const visibleItems = getVisibleLayoutItems("edge-in");

  setToggleButtonState("SHOW", true);

  visibilityTween = gsap.timeline({
    onComplete: () => {
      gsap.set(scene, {
        autoAlpha: 0,
        pointerEvents: "none"
      });

      if (spinButton) {
        gsap.set(spinButton, {
          autoAlpha: 0,
          pointerEvents: "none"
        });
      }

      topPill.textContent = rouletteSettings.idleTopText;
      setButtonState("SPIN", false);
      setToggleButtonState("SHOW", false);

      clearWinnerConfetti();
      renderRoulette();
    }
  });

  if (spinButton) {
    visibilityTween.to(
      spinButton,
      {
        autoAlpha: 0,
        y: 22,
        scale: 0.82,
        duration: 0.22,
        ease: "back.in(1.7)"
      },
      0
    );
  }

  visibilityTween
    .to(
      selectorNameWrap,
      {
        autoAlpha: 0,
        y: 12,
        scale: 0.7,
        duration: 0.22,
        ease: "back.in(1.7)"
      },
      0.02
    )
    .to(
      selectorPointer,
      {
        autoAlpha: 0,
        y: -12,
        scale: 0.45,
        rotation: 12,
        duration: 0.24,
        ease: "back.in(1.8)"
      },
      0.06
    )
    .to(
      topPill,
      {
        autoAlpha: 0,
        y: -16,
        scale: 0.68,
        rotation: -4,
        duration: 0.22,
        ease: "back.in(1.8)"
      },
      0.1
    );

  addEntranceGifHideTweens(visibilityTween, 0.08);

  visibleItems.forEach((item, index) => {
    const side = item.visualDistance === 0 ? 0 : Math.sign(item.visualDistance);
    const t = 0.18 + index * rouletteSettings.hideCircleStagger;

    visibilityTween
      .to(
        item.avatar,
        {
          x: item.spacingX - item.visualDistance,
          scale: 0.05,
          rotation: side * 14,
          duration: rouletteSettings.hideCircleDuration,
          ease: "back.in(1.6)"
        },
        t
      )
      .to(
        item.slot,
        {
          opacity: 0,
          y: item.arcY + 12,
          duration: 0.2,
          ease: "sine.in"
        },
        t + 0.04
      );
  });
}

function toggleRouletteVisibility() {
  if (rouletteVisible) {
    hideRoulette();
  } else {
    showRoulette();
  }
}

function getScenePointFromElement(element) {
  const sceneRect = scene.getBoundingClientRect();
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2 - sceneRect.left,
    y: rect.top + rect.height / 2 - sceneRect.top
  };
}

function ensureConfettiLayer() {
  if (confettiLayer) return confettiLayer;

  confettiLayer = document.createElement("div");
  confettiLayer.className = "winner-confetti-layer";

  Object.assign(confettiLayer.style, {
    position: "absolute",
    inset: "0",
    zIndex: "90",
    pointerEvents: "none",
    overflow: "visible"
  });

  scene.appendChild(confettiLayer);

  return confettiLayer;
}

function clearWinnerConfetti() {
  if (!confettiLayer) return;
  confettiLayer.innerHTML = "";
}

function createWinnerBurstRing(x, y) {
  const ring = document.createElement("div");

  Object.assign(ring.style, {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    width: "118px",
    height: "118px",
    marginLeft: "-59px",
    marginTop: "-59px",
    borderRadius: "50%",
    border: "5px solid rgba(220, 236, 255, 0.95)",
    boxShadow: "0 0 0 4px rgba(45, 126, 225, 0.8), 0 0 22px rgba(45, 126, 225, 0.85)",
    pointerEvents: "none"
  });

  ensureConfettiLayer().appendChild(ring);

  gsap.fromTo(
    ring,
    {
      scale: 0.25,
      autoAlpha: 0.95
    },
    {
      scale: 2.05,
      autoAlpha: 0,
      duration: 0.78,
      ease: "power2.out",
      onComplete: () => ring.remove()
    }
  );
}

function launchWinnerConfetti(originElement) {
  clearWinnerConfetti();

  const layer = ensureConfettiLayer();
  const origin = getScenePointFromElement(originElement);
  const colors = ["#ffffff", "#dcecff", "#2d7ee1", "#2575ce", "#1358a6"];
  const shapes = ["circle", "square", "spark"];

  createWinnerBurstRing(origin.x, origin.y);

  for (let i = 0; i < rouletteSettings.confettiCount; i++) {
    const piece = document.createElement("div");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = gsap.utils.random(5, 10, 1);
    const angle = gsap.utils.random(-Math.PI, 0);
    const distanceX = Math.cos(angle) * gsap.utils.random(60, rouletteSettings.confettiSpreadX);
    const distanceY = Math.sin(angle) * gsap.utils.random(40, rouletteSettings.confettiSpreadY) - gsap.utils.random(10, 50);
    const fall = gsap.utils.random(35, 105);

    Object.assign(piece.style, {
      position: "absolute",
      left: `${origin.x}px`,
      top: `${origin.y}px`,
      width: `${size}px`,
      height: `${size}px`,
      background: color,
      pointerEvents: "none",
      transformOrigin: "center",
      boxShadow: "0 2px 0 rgba(0,0,0,0.18)"
    });

    if (shape === "circle") {
      piece.style.borderRadius = "50%";
    }

    if (shape === "spark") {
      piece.style.width = `${size + 2}px`;
      piece.style.height = `${size + 2}px`;
      piece.style.background = "transparent";
      piece.style.boxShadow = "none";
      piece.textContent = "✦";
      piece.style.color = color;
      piece.style.fontSize = `${size + 8}px`;
      piece.style.fontWeight = "900";
      piece.style.lineHeight = "1";
    }

    layer.appendChild(piece);

    gsap.fromTo(
      piece,
      {
        x: 0,
        y: 0,
        scale: gsap.utils.random(0.55, 1.15),
        rotation: gsap.utils.random(-120, 120),
        autoAlpha: 1
      },
      {
        x: distanceX,
        y: distanceY + fall,
        scale: gsap.utils.random(0.25, 0.85),
        rotation: `+=${gsap.utils.random(180, 720)}`,
        autoAlpha: 0,
        duration: gsap.utils.random(rouletteSettings.confettiDuration * 0.75, rouletteSettings.confettiDuration * 1.2),
        ease: "power2.out",
        delay: gsap.utils.random(0, 0.18),
        onComplete: () => piece.remove()
      }
    );
  }
}

function playWinnerReveal(winnerSlot, winner) {
  if (!rouletteSettings.winnerRevealEnabled || !winnerSlot) {
    finishWinnerReveal(winner);
    return;
  }

  if (winnerRevealTween) winnerRevealTween.kill();

  state.revealing = true;

  const winnerData = visualDataMap.get(winnerSlot);
  const winnerAvatar = winnerSlot.querySelector(".avatar");
  const winnerMulti = winnerSlot.querySelector(".avatar-multi");
  const visibleItems = getVisibleLayoutItems("center-out");
  const loserItems = visibleItems.filter(item => item.slot !== winnerSlot);

  setButtonState("WINNER", true);
  setToggleButtonState("HIDE", true);

  selectorName.textContent = winner.name;
  animateTopPillText(rouletteSettings.winnerTopText(winner));

  if (winnerMulti) {
    gsap.fromTo(
      winnerMulti,
      { scale: 1 },
      {
        scale: 1.22,
        duration: 0.18,
        yoyo: true,
        repeat: 1,
        ease: "back.out(2.4)"
      }
    );
  }

  launchWinnerConfetti(winnerAvatar);
  playWinnerSound();

  winnerRevealTween = gsap.timeline({
    onComplete: () => {
      finishWinnerReveal(winner);
    }
  });

  addEntranceGifWinnerHideTweens(winnerRevealTween, 0);

  loserItems.forEach((item, index) => {
    const side = item.visualDistance === 0 ? 0 : Math.sign(item.visualDistance);
    const awayX = side * gsap.utils.random(42, 86);

    winnerRevealTween
      .to(
        item.avatar,
        {
          x: item.spacingX + awayX,
          scale: Math.max(0.18, item.scale * 0.35),
          rotation: side * gsap.utils.random(10, 20),
          duration: rouletteSettings.winnerLoserFadeDuration,
          ease: "back.in(1.55)"
        },
        index * rouletteSettings.winnerLoserStagger
      )
      .to(
        item.slot,
        {
          opacity: 0,
          y: item.arcY + gsap.utils.random(12, 28),
          duration: rouletteSettings.winnerLoserFadeDuration * 0.8,
          ease: "sine.in"
        },
        index * rouletteSettings.winnerLoserStagger + 0.05
      );
  });

  const winnerStart = 0.12;

  winnerRevealTween
    .set(
      winnerSlot,
      {
        opacity: 1,
        zIndex: 3000
      },
      winnerStart
    );

  if (rouletteSettings.winnerHidePointerAndBubble) {
    winnerRevealTween
      .to(
        selectorPointer,
        {
          autoAlpha: 0,
          y: -18,
          scale: 0.42,
          rotation: -14,
          duration: rouletteSettings.winnerSelectorHideDuration,
          ease: "back.in(2.35)"
        },
        winnerStart
      )
      .to(
        selectorNameWrap,
        {
          autoAlpha: 0,
          y: 24,
          scale: 0.48,
          rotation: 3,
          duration: rouletteSettings.winnerSelectorHideDuration,
          ease: "back.in(2.35)"
        },
        winnerStart + 0.03
      );
  }

  winnerRevealTween
    .to(
      winnerAvatar,
      {
        x: winnerData ? winnerData.spacingX : 0,
        y: rouletteSettings.winnerRevealLift,
        scale: rouletteSettings.winnerRevealScale,
        rotation: 0,
        duration: 0.48,
        ease: "back.out(2.45)"
      },
      winnerStart + 0.08
    )
    .to(
      winnerAvatar,
      {
        scale: rouletteSettings.winnerRevealScale * 0.94,
        duration: 0.22,
        ease: "sine.out"
      },
      winnerStart + 0.68
    )
    .to(
      winnerAvatar,
      {
        scale: rouletteSettings.winnerRevealScale,
        duration: 0.22,
        ease: "sine.out"
      },
      winnerStart + 0.9
    )
    .to(
      {},
      {
        duration: rouletteSettings.winnerRevealHold
      }
    );
}

function finishWinnerReveal(winner) {
  const visibleItems = getVisibleLayoutItems("center-out");

  winnerRevealTween = gsap.timeline({
    onComplete: () => {
      state.revealing = false;

      clearWinnerConfetti();
      renderRoulette();

      gsap.set(selectorPointer, {
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: 0,
        autoAlpha: 1,
        scale: 1,
        rotation: 0
      });

      gsap.set(selectorNameWrap, {
        xPercent: -50,
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotation: 0
      });

      selectorName.textContent = winner.name;

      animateTopPillText(rouletteSettings.idleTopText);

      setButtonState("SPIN", false);
      setToggleButtonState("HIDE", false);
      syncParticipantUI(winner.name);
    }
  });

  visibleItems.forEach((item, index) => {
    winnerRevealTween
      .to(
        item.slot,
        {
          opacity: item.opacity,
          y: item.arcY,
          duration: rouletteSettings.winnerRevealRestoreDuration,
          ease: "sine.out"
        },
        index * 0.01
      )
      .to(
        item.avatar,
        {
          x: item.spacingX,
          y: 0,
          scale: item.scale,
          rotation: 0,
          duration: rouletteSettings.winnerRevealRestoreDuration,
          ease: "back.out(1.85)"
        },
        index * 0.01
      );
  });

  addEntranceGifWinnerRestoreTweens(winnerRevealTween, 0.14);

  if (rouletteSettings.winnerHidePointerAndBubble) {
    winnerRevealTween
      .fromTo(
        selectorPointer,
        {
          xPercent: -50,
          yPercent: -50,
          autoAlpha: 0,
          x: 0,
          y: -18,
          scale: 0.42,
          rotation: -12
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotation: 0,
          duration: rouletteSettings.winnerSelectorRestoreDuration,
          ease: "back.out(2.25)"
        },
        0.12
      )
      .fromTo(
        selectorNameWrap,
        {
          xPercent: -50,
          autoAlpha: 0,
          y: 24,
          scale: 0.48,
          rotation: 3
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotation: 0,
          duration: rouletteSettings.winnerSelectorRestoreDuration,
          ease: "back.out(2.25)"
        },
        0.2
      );
  } else {
    winnerRevealTween
      .to(
        selectorPointer,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotation: 0,
          duration: 0.28,
          ease: "sine.out"
        },
        0
      )
      .to(
        selectorNameWrap,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: "back.out(1.8)"
        },
        0
      );
  }
}

function tickerUpdate(time, deltaTime) {
  if (!state.freeSpin) return;

  const dt = Math.min(deltaTime / 1000, 0.04);
  state.distance += state.speed * dt;

  renderRoulette();
}

function pickWinnerIndex() {
  const pool = rouletteUsers.map((user, index) => ({
    index,
    weight: getUserChanceWeight(user)
  }));

  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);

  let roll = Math.random() * totalWeight;

  for (const item of pool) {
    roll -= item.weight;

    if (roll <= 0) {
      return item.index;
    }
  }

  return pool[pool.length - 1].index;
}

function getFinalDistanceForWinner(winnerIndex) {
  const sceneCenter = scene.clientWidth / 2;
  const itemCenter = winnerIndex * state.step + state.avatarSize / 2;

  const currentMod = wrapPositive(state.distance);
  const targetMod = wrapPositive(itemCenter - sceneCenter);
  const distanceToTarget = wrapPositive(targetMod - currentMod);

  const idealBrakeDistance = (state.speed * rouletteSettings.brakeDuration) / 4;

  const neededLoops = Math.ceil(
    Math.max(0, idealBrakeDistance - distanceToTarget) / state.loopWidth
  );

  const finalLoops = Math.max(rouletteSettings.minFinalLoops, neededLoops);

  return state.distance + distanceToTarget + finalLoops * state.loopWidth;
}

function startSpin() {
  if (state.spinning || state.revealing || !rouletteVisible) return;

  unlockSounds();
  unlockWinnerSound();

  clearWinnerConfetti();

  state.spinning = true;
  state.freeSpin = true;
  state.speed = 0;
  state.lastTickAt = 0;

  setButtonState("SPINNING", true);
  setToggleButtonState("HIDE", true);
  animateTopPillText(rouletteSettings.spinningTopText);
  animateCornerHandsIn();

  gsap.killTweensOf(state);

  gsap.timeline()
    .to(state, {
      speed: rouletteSettings.maxSpeed,
      duration: rouletteSettings.accelDuration,
      ease: "power3.in"
    })
    .to(state, {
      speed: rouletteSettings.maxSpeed,
      duration: rouletteSettings.fastDuration,
      ease: "none"
    })
    .call(startBrakeToWinner);
}

function startBrakeToWinner() {
  const winnerIndex = pickWinnerIndex();
  const winner = rouletteUsers[winnerIndex];
  const finalDistance = getFinalDistanceForWinner(winnerIndex);

  state.freeSpin = false;

  gsap.to(state, {
    distance: finalDistance,
    duration: rouletteSettings.brakeDuration,
    ease: "power4.out",
    onUpdate: renderRoulette,
    onComplete: () => {
      snapWinnerToCenter(winnerIndex, winner);
    }
  });
}

function snapWinnerToCenter(winnerIndex, winner) {
  renderRoulette();

  const centeredSlot = [...track.querySelectorAll(".avatar-slot")]
    .filter(slot => Number(slot.dataset.index) === winnerIndex)
    .sort((a, b) => {
      const aData = visualDataMap.get(a);
      const bData = visualDataMap.get(b);

      const aDistance = aData ? Math.abs(aData.visualDistance) : Infinity;
      const bDistance = bData ? Math.abs(bData.visualDistance) : Infinity;

      return aDistance - bDistance;
    })[0];

  if (!centeredSlot) {
    finishSpin(winner, null);
    return;
  }

  const correctedDistance = getCenteredDistanceFromSlot(centeredSlot);

  gsap.to(state, {
    distance: correctedDistance,
    duration: rouletteSettings.snapDuration,
    ease: "sine.out",
    onUpdate: renderRoulette,
    onComplete: () => {
      state.distance = wrapPositive(state.distance);
      renderRoulette();
      finishSpin(winner, centeredSlot);
    }
  });
}

function finishSpin(winner, winnerSlot) {
  state.speed = 0;
  state.spinning = false;
  state.freeSpin = false;

  selectorName.textContent = winner.name;

  if (rouletteSettings.winnerRevealEnabled && winnerSlot) {
    playWinnerReveal(winnerSlot, winner);
    return;
  }

  animateTopPillText(rouletteSettings.winnerTopText(winner));

  gsap.fromTo(
    selectorLayer,
    { scale: 1 },
    {
      scale: 1.08,
      duration: 0.16,
      yoyo: true,
      repeat: 1,
      ease: "power2.out"
    }
  );

  gsap.fromTo(
    selectorName,
    { scale: 0.9 },
    {
      scale: 1,
      duration: 0.28,
      ease: "back.out(2.4)"
    }
  );

  setButtonState("SPIN", false);
  setToggleButtonState("HIDE", false);
  syncParticipantUI(winner.name);
}

api = {
  users: rouletteUsers,
  settings: rouletteSettings,

  spin: startSpin,
  show: showRoulette,
  hide: hideRoulette,
  toggle: toggleRouletteVisibility,
  rebuild: buildRoulette,

  addUser,
  addTicket,
  addTickets,
  setTickets,
  removeUser,

  getTotalTickets,
  getChanceTable,
  getCurrentName: () => state.currentName,
  isVisible: () => rouletteVisible,
  isSpinning: () => state.spinning,
  isRevealing: () => state.revealing,
  syncParticipantUI,

  confetti: () => {
    const avatar = state.currentCenterAvatar || doc.querySelector(".avatar");
    if (avatar) launchWinnerConfetti(avatar);
  },

  winnerSound: playWinnerSound,

  destroy: () => {
    gsap.ticker.remove(tickerUpdate);
    win.removeEventListener("resize", handleResize);
    clearWinnerConfetti();
  }
};

function handleResize() {
  if (state.spinning || state.revealing) return;

  measureRoulette();
  renderRoulette();
  syncEntranceGifAnchors();
}

hydrateUsers();
createTickSoundPool();
createWinnerSound();
buildRoulette();

gsap.ticker.add(tickerUpdate);
win.addEventListener("resize", handleResize);

if (options.exposeGlobal !== false) {
  win.fakeRoulette = api;
}

return api;
}

return {
  init,
  defaultSettings,
  defaultUsers: cloneUsers(defaultUsers)
};
});
