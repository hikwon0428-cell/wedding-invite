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

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const petalCanvas = document.getElementById("petal-canvas");

if (petalCanvas && !prefersReducedMotion) {
  const ctx = petalCanvas.getContext("2d");
  const petals = [];
  const PETAL_COUNT = 28;
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
      size: randomRange(8, 15),
      speedY: randomRange(0.45, 1.1),
      speedX: randomRange(-0.3, 0.3),
      swing: randomRange(0.4, 1.4),
      swingSpeed: randomRange(0.006, 0.02),
      angle: randomRange(0, Math.PI * 2),
      rotation: randomRange(0, Math.PI * 2),
      rotationSpeed: randomRange(-0.012, 0.012),
      opacity: randomRange(0.55, 0.9),
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    };
  }

  function drawPetal(petal) {
    ctx.save();
    ctx.translate(petal.x, petal.y);
    ctx.rotate(petal.rotation);
    const [r, g, b] = petal.color;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${petal.opacity})`;
    ctx.strokeStyle = "rgba(188, 166, 220, 0.35)";
    ctx.lineWidth = 1;
    ctx.shadowColor = "rgba(203, 182, 235, 0.28)";
    ctx.shadowBlur = 4;
    ctx.beginPath();
    // Draw a pointed petal shape instead of a simple oval.
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
