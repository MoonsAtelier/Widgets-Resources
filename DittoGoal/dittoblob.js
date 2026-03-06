(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define(["gsap"], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory(require("gsap"));
  } else {
    root.BlobBorder = factory(root.gsap);
  }
})(typeof self !== "undefined" ? self : this, function (gsap) {

  if (!gsap) {
    throw new Error("BlobBorder requires GSAP");
  }

  const DEFAULTS = {
    color: "#FFF",
    minBlobs: 100,
    density: 50,
    minSize: 16,
    maxSize: 48,
    speed: 0.05,
    pulseMin: 0.9,
    pulseMax: 1.15,
    pulseSpeedMin: 1.2,
    pulseSpeedMax: 2.2,
    edgeOffset: 20,
    borderRadius: 24,
    showFPS: false
  }

  function create(instanceContainer, configOverride = {}) {

    const bubble =
      typeof instanceContainer === "string"
        ? document.querySelector(instanceContainer)
        : instanceContainer

    if (!bubble) {
      throw new Error("BlobBorder: container not found")
    }

    const blobsLayer = bubble.querySelector("#blobs") || bubble.querySelector(".blobs")

    if (!blobsLayer) {
      throw new Error("BlobBorder: blobs layer not found")
    }

    const CONFIG = Object.assign({}, DEFAULTS, configOverride)

    const rand = (a, b) => a + Math.random() * (b - a)

    let blobs = []

    let pathPts = []
    let segLen = []
    let segNx = []
    let segNy = []
    let cumLen = []
    let pathLength = 0

    let _w = 0
    let _h = 0
    let resizeRAF = 0

    let fpsBox = null
    let fpsFrames = 0
    let fpsLast = performance.now()

    if (CONFIG.showFPS) {
      fpsBox = document.createElement("div")
      fpsBox.style.position = "fixed"
      fpsBox.style.top = "8px"
      fpsBox.style.left = "8px"
      fpsBox.style.padding = "4px 8px"
      fpsBox.style.background = "rgba(0,0,0,.6)"
      fpsBox.style.color = "#fff"
      fpsBox.style.fontSize = "12px"
      fpsBox.style.fontFamily = "monospace"
      fpsBox.style.zIndex = "9999"
      fpsBox.style.borderRadius = "6px"
      fpsBox.textContent = "FPS: 0"
      document.body.appendChild(fpsBox)
    }

    function buildPath(w, h, r) {

      pathPts.length = 0
      segLen.length = 0
      segNx.length = 0
      segNy.length = 0
      cumLen.length = 0
      pathLength = 0

      function add(x, y) {
        pathPts.push({ x, y })
      }

      const seg = 40

      for (let i = 0; i <= seg; i++) {
        const a = Math.PI + (Math.PI / 2) * (i / seg)
        add(r + r * Math.cos(a), r + r * Math.sin(a))
      }

      for (let i = 0; i <= seg; i++) {
        const a = -Math.PI / 2 + (Math.PI / 2) * (i / seg)
        add(w - r + r * Math.cos(a), r + r * Math.sin(a))
      }

      for (let i = 0; i <= seg; i++) {
        const a = 0 + (Math.PI / 2) * (i / seg)
        add(w - r + r * Math.cos(a), h - r + r * Math.sin(a))
      }

      for (let i = 0; i <= seg; i++) {
        const a = Math.PI / 2 + (Math.PI / 2) * (i / seg)
        add(r + r * Math.cos(a), h - r + r * Math.sin(a))
      }

      const n = pathPts.length
      cumLen.push(0)

      for (let i = 1; i < n; i++) {

        const a = pathPts[i - 1]
        const b = pathPts[i]

        const dx = b.x - a.x
        const dy = b.y - a.y

        const L = Math.hypot(dx, dy) || 1e-9

        pathLength += L
        segLen.push(L)

        const nx = dy
        const ny = -dx
        const nLen = Math.hypot(nx, ny) || 1e-9

        segNx.push(nx / nLen)
        segNy.push(ny / nLen)

        cumLen.push(pathLength)
      }
    }

    function getPoint(t, out) {

      t = ((t % 1) + 1) % 1
      const target = t * pathLength

      let lo = 0
      let hi = cumLen.length - 1

      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (cumLen[mid] < target) lo = mid + 1
        else hi = mid
      }

      let i = lo
      if (i <= 0) i = 1
      if (i >= pathPts.length) i = pathPts.length - 1

      const segIndex = i - 1
      const startDist = cumLen[segIndex]
      const L = segLen[segIndex] || 1e-9
      const k = (target - startDist) / L

      const a = pathPts[segIndex]
      const b = pathPts[segIndex + 1]

      out.x = a.x + (b.x - a.x) * k
      out.y = a.y + (b.y - a.y) * k
      out.nx = segNx[segIndex]
      out.ny = segNy[segIndex]

      return out
    }

    function getBubbleSize() {

      const rect = bubble.getBoundingClientRect()

      const scaleX = rect.width / bubble.offsetWidth || 1
      const scaleY = rect.height / bubble.offsetHeight || 1

      const w = rect.width / scaleX
      const h = rect.height / scaleY

      return { w, h }
    }

    function build() {

      const size = getBubbleSize()
      const w = size.w
      const h = size.h

      if (w <= 0 || h <= 0) return

      _w = w
      _h = h

      buildPath(w, h, CONFIG.borderRadius)

      if (blobs.length) return

      let count = Math.floor((w + h) * 2 / CONFIG.density)
      if (count < CONFIG.minBlobs) count = CONFIG.minBlobs

      const frag = document.createDocumentFragment()

      for (let i = 0; i < count; i++) {

        const size = rand(CONFIG.minSize, CONFIG.maxSize)

        const blob = document.createElement("div")
        blob.className = "blob"

        blob.style.width = size + "px"
        blob.style.height = size + "px"
        blob.style.background = CONFIG.color

        frag.appendChild(blob)

        const setX = gsap.quickSetter(blob, "x", "px")
        const setY = gsap.quickSetter(blob, "y", "px")

        gsap.set(blob, { xPercent: -50, yPercent: -50 })

        gsap.to(blob, {
          scale: rand(CONFIG.pulseMin, CONFIG.pulseMax),
          duration: rand(CONFIG.pulseSpeedMin, CONFIG.pulseSpeedMax),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        })

        blobs.push({
          el: blob,
          offset: i / count,
          size,
          setX,
          setY
        })
      }

      blobsLayer.appendChild(frag)
    }

    const _p = { x: 0, y: 0, nx: 0, ny: 0 }

    function tick() {

      const t = performance.now() * 0.0001

      for (let i = 0; i < blobs.length; i++) {

        const b = blobs[i]

        const p = (b.offset + t * CONFIG.speed) % 1

        getPoint(p, _p)

        const offset = b.size * 0.5 - CONFIG.edgeOffset

        const cx = _p.x + _p.nx * offset
        const cy = _p.y + _p.ny * offset

        b.setX(cx)
        b.setY(cy)
      }

      if (CONFIG.showFPS) {
        fpsFrames++
        const now = performance.now()

        if (now - fpsLast >= 1000) {
          fpsBox.textContent = "FPS: " + fpsFrames
          fpsFrames = 0
          fpsLast = now
        }
      }
    }

    gsap.ticker.add(tick)

    function rebuildPathOnly() {

      const size = getBubbleSize()
      const w = size.w
      const h = size.h

      if (w <= 0 || h <= 0) return

      if (w === _w && h === _h) return

      _w = w
      _h = h

      buildPath(w, h, CONFIG.borderRadius)
    }

    function handleResize() {
      cancelAnimationFrame(resizeRAF)
      resizeRAF = requestAnimationFrame(rebuildPathOnly)
    }

    function waitForBubbleVisible() {

      const check = () => {

        const rect = bubble.getBoundingClientRect()

        if (rect.width > 0 && rect.height > 0) {
          build()
          new ResizeObserver(handleResize).observe(bubble)
          return
        }

        requestAnimationFrame(check)
      }

      check()
    }

    waitForBubbleVisible()

    return {
      destroy() {
        gsap.ticker.remove(tick)
        blobs.forEach(b => b.el.remove())
        blobs.length = 0
      }
    }
  }

  return {
    init: create
  }

});
