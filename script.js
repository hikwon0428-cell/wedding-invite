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

function normalizeAccountValue(rawValue) {
  if (!rawValue) return "";
  const digitsOnly = rawValue.replace(/\D/g, "");
  if (digitsOnly.length > 0) return digitsOnly;
  return rawValue.replace(/-/g, "");
}

document.querySelectorAll(".copy-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const rawValue = button.getAttribute("data-copy");
    if (!rawValue) return;

    const shouldNormalize = button.classList.contains("account-copy");
    const value = shouldNormalize ? normalizeAccountValue(rawValue) : rawValue;
    if (value) copyText(value);
  });
});

document.querySelectorAll(".account-card .account-list").forEach((list) => {
  list.setAttribute("hidden", "");
});

document.querySelectorAll(".account-toggle").forEach((toggle) => {
  toggle.textContent = "...";
  toggle.setAttribute("aria-expanded", "false");

  toggle.addEventListener("click", () => {
    const card = toggle.closest(".account-card");
    if (!card) return;

    const targetList = card.querySelector(".account-list");
    if (!targetList) return;

    const shouldOpen = targetList.hasAttribute("hidden");
    if (shouldOpen) {
      targetList.removeAttribute("hidden");
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = "X";
    } else {
      targetList.setAttribute("hidden", "");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "...";
    }
  });
});

/** 더헤윰 웨딩홀 (전남 순천시 순천만길 71 / 오천동 일대) — 네이버 지도 검색 결과와 맞춘 WGS84 */
const HEYUM_WEDDING_LAT = 34.919585;
const HEYUM_WEDDING_LNG = 127.497563;

function initNaverMap() {
  const mapElement = document.getElementById("naver-map");
  if (!mapElement) return;
  if (!window.naver || !window.naver.maps) return;

  const fallbackCenter = new window.naver.maps.LatLng(HEYUM_WEDDING_LAT, HEYUM_WEDDING_LNG);
  const map = new window.naver.maps.Map(mapElement, {
    center: fallbackCenter,
    zoom: 17,
  });

  const query = "더헤윰웨딩컨벤션 전라남도 순천시 오천동 389";
  const geocoder = window.naver.maps.Service;
  if (!geocoder || typeof geocoder.geocode !== "function") return;

  geocoder.geocode({ query }, (status, response) => {
    if (status !== window.naver.maps.Service.Status.OK) return;
    const first = response?.v2?.addresses?.[0];
    if (!first) return;

    const lat = Number(first.y);
    const lng = Number(first.x);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const position = new window.naver.maps.LatLng(lat, lng);
    map.setCenter(position);
  });
}

function initIntroSequence() {
  const introCover = document.querySelector(".intro-cover");
  if (!introCover) return;
  document.body.classList.add("intro-lock");
  const words = Array.from(document.querySelectorAll(".intro-word"));
  if (words.length === 0) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    words.forEach((word) => word.classList.add("is-visible"));
    window.setTimeout(() => {
      document.body.classList.add("intro-pass");
      introCover.classList.add("is-hidden");
      document.body.classList.remove("intro-lock");
    }, 900);
    return;
  }

  const startDelay = 500;
  const revealDelays = [0, 800, 1600, 2800];
  words.forEach((word, index) => {
    const revealAt = startDelay + (revealDelays[index] ?? revealDelays[revealDelays.length - 1]);
    window.setTimeout(() => word.classList.add("is-visible"), revealAt);
  });

  const lastRevealAt = startDelay + revealDelays[revealDelays.length - 1];
  const totalDuration = lastRevealAt + 1700;
  window.setTimeout(() => {
    document.body.classList.add("intro-pass");
    introCover.classList.add("is-hidden");
    document.body.classList.remove("intro-lock");
  }, totalDuration);
}

function initGallery() {
  const grid = document.getElementById("gallery-grid");
  const moreButton = document.getElementById("gallery-more");
  const modal = document.getElementById("gallery-modal");
  const modalImage = document.getElementById("gallery-modal-image");
  const closeButton = document.getElementById("gallery-modal-close");
  const prevButton = document.getElementById("gallery-modal-prev");
  const nextButton = document.getElementById("gallery-modal-next");

  if (!grid || !moreButton || !modal || !modalImage || !closeButton || !prevButton || !nextButton) {
    return;
  }

  const fallbackSources = [
    "./images/KakaoTalk_20260407_153823551.jpg",
    "./images/KakaoTalk_20260407_153823551-removebg-preview.png",
  ];
  const images = Array.from({ length: 24 }, (_value, index) => ({
    src: `./images/gallery-${String(index + 1).padStart(2, "0")}.jpg`,
    fallback: fallbackSources[index % fallbackSources.length],
  }));

  let expanded = false;
  let currentIndex = 0;

  function createImageElement(source, fallback, alt) {
    const img = document.createElement("img");
    img.src = source;
    img.alt = alt;
    img.loading = "lazy";
    img.draggable = false;
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied === "true") return;
      img.dataset.fallbackApplied = "true";
      img.src = fallback;
    });
    return img;
  }

  function renderGrid() {
    const visibleCount = expanded ? images.length : 9;
    grid.innerHTML = "";

    images.slice(0, visibleCount).forEach((image, index) => {
      const itemButton = document.createElement("button");
      itemButton.type = "button";
      itemButton.className = "gallery-item";
      itemButton.setAttribute("aria-label", `갤러리 사진 ${index + 1}`);
      itemButton.appendChild(
        createImageElement(image.src, image.fallback, `갤러리 사진 ${index + 1}`)
      );
      itemButton.addEventListener("click", () => openModal(index));
      grid.appendChild(itemButton);
    });

    moreButton.setAttribute("aria-expanded", String(expanded));
    moreButton.hidden = images.length <= 9;
  }

  function updateModalImage() {
    const image = images[currentIndex];
    modalImage.src = image.src;
    modalImage.alt = `갤러리 확대 이미지 ${currentIndex + 1}`;
    modalImage.dataset.fallback = image.fallback;
  }

  modalImage.addEventListener("error", () => {
    const fallback = modalImage.dataset.fallback;
    if (!fallback || modalImage.dataset.fallbackApplied === "true") return;
    modalImage.dataset.fallbackApplied = "true";
    modalImage.src = fallback;
  });

  function openModal(index) {
    currentIndex = index;
    modalImage.dataset.fallbackApplied = "false";
    updateModalImage();
    modal.hidden = false;
    document.body.classList.add("gallery-modal-open");
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("gallery-modal-open");
  }

  function move(step) {
    currentIndex = (currentIndex + step + images.length) % images.length;
    modalImage.dataset.fallbackApplied = "false";
    updateModalImage();
  }

  moreButton.addEventListener("click", () => {
    expanded = !expanded;
    renderGrid();
  });
  closeButton.addEventListener("click", closeModal);
  prevButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  window.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") closeModal();
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  });

  renderGrid();
}

function initGuestbook() {
  const form = document.getElementById("guestbook-form");
  const nameInput = document.getElementById("guestbook-name");
  const messageInput = document.getElementById("guestbook-message");
  const list = document.getElementById("guestbook-list");
  const pagination = document.getElementById("guestbook-pagination");
  const fab = document.getElementById("guestbook-fab");
  const modal = document.getElementById("guestbook-modal");
  const modalClose = document.getElementById("guestbook-modal-close");
  if (!form || !nameInput || !messageInput || !list || !pagination || !fab || !modal || !modalClose) return;

  const storageKey = "wedding_guestbook_entries_v1";

  function readEntries() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function saveEntries(entries) {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }

  function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
  }

  const pageSize = 6;
  let currentPage = 1;

  function render(entries) {
    list.innerHTML = "";
    pagination.innerHTML = "";
    if (entries.length === 0) return;

    const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (currentPage - 1) * pageSize;
    const visibleEntries = entries.slice(start, start + pageSize);

    visibleEntries.forEach((entry) => {
      const item = document.createElement("li");
      item.className = "guestbook-item";

      const head = document.createElement("div");
      head.className = "guestbook-item-head";

      const name = document.createElement("strong");
      name.className = "guestbook-item-name";
      name.textContent = entry.name;

      const date = document.createElement("span");
      date.className = "guestbook-item-date";
      date.textContent = formatDate(entry.createdAt);

      const message = document.createElement("p");
      message.className = "guestbook-item-message";
      message.textContent = entry.message;

      head.appendChild(name);
      head.appendChild(date);
      item.appendChild(head);
      item.appendChild(message);
      list.appendChild(item);
    });

    if (totalPages <= 1) return;

    for (let page = 1; page <= totalPages; page += 1) {
      const pageButton = document.createElement("button");
      pageButton.type = "button";
      pageButton.className = "guestbook-page-btn";
      if (page === currentPage) pageButton.classList.add("is-active");
      pageButton.textContent = String(page);
      pageButton.setAttribute("aria-label", `방명록 ${page}페이지`);
      pageButton.addEventListener("click", () => {
        currentPage = page;
        render(entries);
      });
      pagination.appendChild(pageButton);
    }
  }

  let entries = readEntries();
  render(entries);

  function openModal() {
    modal.hidden = false;
    document.body.classList.add("guestbook-modal-open");
    nameInput.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("guestbook-modal-open");
  }

  fab.addEventListener("click", openModal);
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    if (!name || !message) return;

    const entry = {
      name: name.slice(0, 12),
      message: message.slice(0, 120),
      createdAt: new Date().toISOString(),
    };

    entries = [entry, ...entries].slice(0, 30);
    currentPage = 1;
    saveEntries(entries);
    render(entries);
    form.reset();
    closeModal();
    showToast("방명록이 등록되었습니다.");
  });
}

updateCountdown();
setInterval(updateCountdown, 1000);

window.addEventListener("load", initNaverMap);
window.addEventListener("load", initIntroSequence);
window.addEventListener("load", initGallery);
window.addEventListener("load", initGuestbook);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealSections = document.querySelectorAll(".reveal");

if (revealSections.length > 0) {
  if (reducedMotion) {
    revealSections.forEach((section) => section.classList.add("is-visible"));
  } else if (!("IntersectionObserver" in window)) {
    const revealByScroll = () => {
      revealSections.forEach((section) => {
        if (section.classList.contains("is-visible")) return;
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.86) {
          section.classList.add("is-visible");
        }
      });
    };

    revealByScroll();
    window.addEventListener("scroll", revealByScroll, { passive: true });
    window.addEventListener("touchmove", revealByScroll, { passive: true });
    window.addEventListener("resize", revealByScroll);
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealSections.forEach((section) => observer.observe(section));

    // Mobile browsers may delay observer callbacks on drag; do one immediate check.
    requestAnimationFrame(() => {
      revealSections.forEach((section) => {
        if (section.classList.contains("is-visible")) return;
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.9) {
          section.classList.add("is-visible");
          observer.unobserve(section);
        }
      });
    });
  }
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
