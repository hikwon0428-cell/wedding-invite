const targetDate = new Date("2026-08-22T13:00:00+09:00");

const dayEl = document.getElementById("days");
const hourEl = document.getElementById("hours");
const minEl = document.getElementById("minutes");
const secEl = document.getElementById("seconds");

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    dayEl.textContent = "00";
    hourEl.textContent = "00";
    minEl.textContent = "00";
    secEl.textContent = "00";
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  dayEl.textContent = pad(days);
  hourEl.textContent = pad(hours);
  minEl.textContent = pad(minutes);
  secEl.textContent = pad(seconds);
}

const toast = document.getElementById("toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1500);
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    showToast("계좌번호가 복사되었습니다.");
  } catch (_error) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showToast("계좌번호가 복사되었습니다.");
  }
}

document.querySelectorAll(".copy-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.getAttribute("data-copy");
    if (value) copyText(value);
  });
});

updateCountdown();
setInterval(updateCountdown, 1000);

const openingStage = document.getElementById("opening-stage");
const openingImage = openingStage ? openingStage.querySelector("img") : null;
const heroPhoto = document.querySelector(".hero-photo");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (openingStage && openingImage && heroPhoto && !reducedMotion) {
  let collapsed = false;
  const initialScrollY = window.scrollY;

  function collapseOpeningPhoto() {
    if (collapsed) return;
    collapsed = true;

    const startRect = openingImage.getBoundingClientRect();
    const endRect = heroPhoto.getBoundingClientRect();
    const startCenterX = startRect.left + startRect.width / 2;
    const startCenterY = startRect.top + startRect.height / 2;
    const endCenterX = endRect.left + endRect.width / 2;
    const endCenterY = endRect.top + endRect.height / 2;
    const moveX = endCenterX - startCenterX;
    const moveY = endCenterY - startCenterY;
    const scale = Math.min(endRect.width / startRect.width, endRect.height / startRect.height);

    openingImage.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;
    openingImage.style.opacity = "0";
    openingStage.classList.add("done");

    setTimeout(() => {
      openingStage.style.display = "none";
    }, 500);
  }

  function onScrollOrResize() {
    if (window.scrollY - initialScrollY > 10) collapseOpeningPhoto();
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("wheel", collapseOpeningPhoto, { passive: true, once: true });
  window.addEventListener("touchmove", collapseOpeningPhoto, { passive: true, once: true });
} else if (openingStage) {
  openingStage.style.display = "none";
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const petalCanvas = document.getElementById("petal-canvas");

if (petalCanvas && !prefersReducedMotion) {
  const ctx = petalCanvas.getContext("2d");
  const petals = [];
  const PETAL_COUNT = 28;
  const petalImage = new Image();
  let petalImageLoaded = false;
  const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
  const PETAL_COLORS = [
    [255, 255, 255], // white
    [248, 242, 255], // very light lavender
    [235, 222, 252], // light purple
  ];
  let width = 0;
  let height = 0;
  let animationId = 0;

  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  petalImage.src = "./images/KakaoTalk_20260407_153823551-removebg-preview.png";
  petalImage.onload = () => {
    petalImageLoaded = true;
  };
  petalImage.onerror = () => {
    petalImageLoaded = false;
  };

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    petalCanvas.width = Math.floor(width * dpr);
    petalCanvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createPetal(initial = false) {
    return {
      x: randomRange(0, width),
      y: initial ? randomRange(0, height) : randomRange(-80, -20),
      size: randomRange(14, 24),
      speedY: randomRange(0.45, 1.1),
      speedX: randomRange(-0.3, 0.3),
      swing: randomRange(0.4, 1.4),
      swingSpeed: randomRange(0.006, 0.02),
      angle: randomRange(0, Math.PI * 2),
      rotation: randomRange(0, Math.PI * 2),
      rotationSpeed: randomRange(-0.012, 0.012),
      opacity: isMobileViewport ? randomRange(0.85, 1) : randomRange(0.72, 0.96),
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    };
  }

  function drawPetal(petal) {
    ctx.save();
    ctx.translate(petal.x, petal.y);
    ctx.rotate(petal.rotation);
    if (petalImageLoaded) {
      const aspect = petalImage.naturalWidth / petalImage.naturalHeight;
      const base = petal.size * 2.4;
      let width = base;
      let height = base;

      // Keep original image ratio to avoid vertical/horizontal squashing.
      if (aspect >= 1) {
        height = base / aspect;
      } else {
        width = base * aspect;
      }

      ctx.globalAlpha = petal.opacity;
      ctx.filter = isMobileViewport
        ? "brightness(1.15) contrast(1.12) saturate(1.15)"
        : "brightness(1.08) contrast(1.05) saturate(1.08)";
      ctx.shadowColor = "rgba(146, 110, 194, 0.36)";
      ctx.shadowBlur = isMobileViewport ? 8 : 5;
      ctx.drawImage(petalImage, -width / 2, -height / 2, width, height);
      ctx.filter = "none";
    } else {
      const [r, g, b] = petal.color;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${petal.opacity})`;
      ctx.strokeStyle = "rgba(188, 166, 220, 0.35)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "rgba(203, 182, 235, 0.28)";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      // Fallback vector petal when image is unavailable.
      ctx.moveTo(0, -petal.size);
      ctx.bezierCurveTo(
        petal.size * 0.85,
        -petal.size * 0.5,
        petal.size * 0.7,
        petal.size * 0.75,
        0,
        petal.size
      );
      ctx.bezierCurveTo(
        -petal.size * 0.7,
        petal.size * 0.75,
        -petal.size * 0.85,
        -petal.size * 0.5,
        0,
        -petal.size
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    petals.forEach((petal, index) => {
      petal.y += petal.speedY;
      petal.x += petal.speedX + Math.sin(petal.angle) * petal.swing * 0.2;
      petal.angle += petal.swingSpeed;
      petal.rotation += petal.rotationSpeed;

      if (petal.y > height + 20 || petal.x < -40 || petal.x > width + 40) {
        petals[index] = createPetal(false);
        return;
      }

      drawPetal(petal);
    });

    animationId = requestAnimationFrame(animate);
  }

  resizeCanvas();
  for (let i = 0; i < PETAL_COUNT; i += 1) petals.push(createPetal(true));
  animate();

  window.addEventListener("resize", () => {
    cancelAnimationFrame(animationId);
    resizeCanvas();
    for (let i = 0; i < petals.length; i += 1) {
      petals[i].x = randomRange(0, width);
      petals[i].y = randomRange(0, height);
    }
    animate();
  });
}
