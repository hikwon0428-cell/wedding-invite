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
  list.classList.remove("is-open");
  list.setAttribute("aria-hidden", "true");
});

const ACCOUNT_TOGGLE_CLOSED = "···";
const ACCOUNT_TOGGLE_OPEN = "×";

document.querySelectorAll(".account-toggle").forEach((toggle) => {
  toggle.textContent = ACCOUNT_TOGGLE_CLOSED;
  toggle.setAttribute("aria-expanded", "false");

  toggle.addEventListener("click", () => {
    const card = toggle.closest(".account-card");
    if (!card) return;

    const targetList = card.querySelector(".account-list");
    if (!targetList) return;

    const shouldOpen = targetList.hasAttribute("hidden");
    if (shouldOpen) {
      targetList.removeAttribute("hidden");
      // Force layout once so opening transition starts reliably from collapsed state.
      void targetList.offsetHeight;
      targetList.classList.add("is-open");
      targetList.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = ACCOUNT_TOGGLE_OPEN;
    } else {
      targetList.classList.remove("is-open");
      targetList.setAttribute("aria-hidden", "true");
      const handleTransitionEnd = (event) => {
        if (event.propertyName !== "max-height") return;
        targetList.setAttribute("hidden", "");
        targetList.removeEventListener("transitionend", handleTransitionEnd);
      };
      targetList.addEventListener("transitionend", handleTransitionEnd);
      window.setTimeout(() => {
        if (!targetList.classList.contains("is-open")) {
          targetList.setAttribute("hidden", "");
        }
      }, 420);
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = ACCOUNT_TOGGLE_CLOSED;
    }
  });
});

/** 더헤윰 웨딩홀 (전남 순천시 순천만길 71) 고정 좌표 */
const HEYUM_WEDDING_LAT = 34.922515;
const HEYUM_WEDDING_LNG = 127.496668;

function initNaverMap() {
  const mapElement = document.getElementById("naver-map");
  if (!mapElement) return;
  if (!window.naver || !window.naver.maps) return;

  const fallbackCenter = new window.naver.maps.LatLng(HEYUM_WEDDING_LAT, HEYUM_WEDDING_LNG);
  const map = new window.naver.maps.Map(mapElement, {
    center: fallbackCenter,
    zoom: 17,
  });

  const weddingMarkerSvg =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">' +
        '<path d="M17 43c-4.4-6.6-13-14.7-13-24.3C4 10.2 9.8 4 17 4s13 6.2 13 14.7C30 28.3 21.4 36.4 17 43z" fill="#f4a3c4"/>' +
        '<path d="M17 40.2c-3.8-5.6-11.3-12.8-11.3-21.5C5.7 11.4 10.7 6 17 6s11.3 5.4 11.3 12.7c0 8.7-7.5 15.9-11.3 21.5z" fill="#f7b9d3"/>' +
        '<path d="M17 24.8c-4-2.6-7.2-4.7-7.2-8.4 0-2.2 1.7-4 3.9-4 1.4 0 2.6.7 3.3 1.8.7-1.1 1.9-1.8 3.3-1.8 2.2 0 3.9 1.8 3.9 4 0 3.7-3.2 5.8-7.2 8.4z" fill="#ffffff"/>' +
      "</svg>"
    );

  new window.naver.maps.Marker({
    position: fallbackCenter,
    map,
    title: "더헤윰 웨딩홀",
    icon: {
      url: weddingMarkerSvg,
      size: new window.naver.maps.Size(34, 44),
      scaledSize: new window.naver.maps.Size(34, 44),
      origin: new window.naver.maps.Point(0, 0),
      anchor: new window.naver.maps.Point(17, 44),
    },
    zIndex: 1000,
  });
}

function initHeroFixedBackground() {
  const hero = document.getElementById("hero-section");
  const bg = document.getElementById("hero-bg-fixed");
  if (!hero || !bg) return;

  let scrollRaf = 0;
  const update = () => {
    const rect = hero.getBoundingClientRect();
    if (rect.bottom <= 1) {
      bg.classList.add("is-past");
    } else {
      bg.classList.remove("is-past");
    }
  };

  const scheduleUpdate = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      update();
    });
  };

  update();
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", update);
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
  const thankModal = document.getElementById("guestbook-thank-modal");
  const thankClose = document.getElementById("guestbook-thank-close");
  if (
    !form ||
    !nameInput ||
    !messageInput ||
    !list ||
    !pagination ||
    !fab ||
    !modal ||
    !modalClose ||
    !thankModal ||
    !thankClose
  ) {
    return;
  }

  const storageKey = "wedding_guestbook_entries_v1";
  const pageSize = 6;
  let currentPage = 1;
  let entries = [];

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

  function render(items) {
    list.innerHTML = "";
    pagination.innerHTML = "";
    if (items.length === 0) return;

    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (currentPage - 1) * pageSize;
    const visibleEntries = items.slice(start, start + pageSize);

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

  function hasFirebaseConfig(config) {
    if (!config || typeof config !== "object") return false;
    const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
    return requiredKeys.every((key) => typeof config[key] === "string" && config[key].trim().length > 0);
  }

  function initRemoteGuestbook() {
    if (!window.firebase) return null;
    const config = window.WEDDING_FIREBASE_CONFIG;
    if (!hasFirebaseConfig(config)) return null;

    const app = window.firebase.apps.length
      ? window.firebase.app()
      : window.firebase.initializeApp(config);
    const db = app.firestore();
    const collectionRef = db.collection("guestbookEntries");
    return collectionRef;
  }

  const remoteCollection = initRemoteGuestbook();

  entries = readEntries();
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

  function openThankModal() {
    thankModal.hidden = false;
    document.body.classList.add("guestbook-thank-open");
    thankClose.focus();
  }

  function closeThankModal() {
    thankModal.hidden = true;
    document.body.classList.remove("guestbook-thank-open");
  }

  fab.addEventListener("click", openModal);
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  thankClose.addEventListener("click", closeThankModal);
  thankModal.addEventListener("click", (event) => {
    if (event.target === thankModal) closeThankModal();
  });

  window.addEventListener("keydown", (event) => {
    if (thankModal.hidden) return;
    if (event.key === "Escape") closeThankModal();
  });

  function applyEntries(nextEntries) {
    entries = nextEntries;
    render(entries);
  }

  if (remoteCollection) {
    remoteCollection
      .orderBy("createdAt", "desc")
      .limit(50)
      .onSnapshot((snapshot) => {
        const remoteEntries = snapshot.docs.map((doc) => {
          const data = doc.data() || {};
          const timestamp = data.createdAt?.toDate?.();
          return {
            name: String(data.name || "").slice(0, 12),
            message: String(data.message || "").slice(0, 120),
            createdAt: timestamp ? timestamp.toISOString() : new Date().toISOString(),
          };
        });
        applyEntries(remoteEntries);
      });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    if (!name || !message) return;

    const entry = {
      name: name.slice(0, 12),
      message: message.slice(0, 120),
      createdAt: new Date().toISOString(),
    };

    currentPage = 1;

    if (remoteCollection) {
      try {
        await remoteCollection.add({
          name: entry.name,
          message: entry.message,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        });
      } catch (_error) {
        showToast("등록에 실패했습니다.");
        return;
      }
    } else {
      entries = [entry, ...entries].slice(0, 30);
      saveEntries(entries);
      render(entries);
    }

    form.reset();
    closeModal();
    openThankModal();
  });
}

function initSmoothWheelScroll() {
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;
  if (!isFinePointer) return;

  let currentY = window.scrollY;
  let targetY = window.scrollY;
  let rafId = 0;

  function maxScrollY() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function startLoop() {
    if (rafId) return;
    const tick = () => {
      const delta = targetY - currentY;
      // Immediate response + gentle inertia tail (no initial "bounce")
      currentY += delta * 0.14;
      if (Math.abs(delta) < 0.4) {
        currentY = targetY;
      }
      window.scrollTo(0, currentY);

      if (currentY !== targetY) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener(
    "wheel",
    (event) => {
      // Let native scrolling work in text inputs / map / modals.
      const el = event.target;
      if (!(el instanceof Element)) return;
      if (
        el.closest(
          "input, textarea, [contenteditable='true'], #naver-map, .gallery-modal, .guestbook-modal, .guestbook-thank-modal"
        )
      ) {
        return;
      }

      event.preventDefault();

      const base = Math.abs(event.deltaY);
      const step = Math.sign(event.deltaY) * Math.min(300, Math.max(55, base * 0.72));
      // Sync with actual position to avoid jump/twitch.
      currentY = window.scrollY;
      targetY = Math.min(maxScrollY(), Math.max(0, targetY + step));
      startLoop();
    },
    { passive: false }
  );

  window.addEventListener(
    "scroll",
    () => {
      if (!rafId) {
        currentY = window.scrollY;
        targetY = window.scrollY;
      }
    },
    { passive: true }
  );
}

function initKakaoShareButton() {
  const shareButton = document.getElementById("kakao-share-btn");
  if (!shareButton) return;

  const shareUrl = window.location.href;
  const imageUrl = new URL("./images/og-share-1200x630.jpg", shareUrl).href;
  const appKey = "e00da8de3678ba5eb6930824151e418e";
  const templateId = 1442810;

  shareButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const kakao = window.Kakao;
    if (!kakao) {
      await copyText(shareUrl);
      showToast("카카오 SDK를 찾지 못해 링크를 복사했어요.");
      return;
    }

    try {
      if (!kakao.isInitialized()) {
        kakao.init(appKey);
      }

      const payload = {
        objectType: "feed",
        content: {
          title: "진우 · 혜인 결혼합니다",
          description: "2026. 08. 22 SAT 1:00 PM · THE HEYUM",
          imageUrl,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: "청첩장 보러가기",
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      };

      if (kakao.Share && typeof kakao.Share.sendCustom === "function") {
        kakao.Share.sendCustom({ templateId });
        return;
      }
      if (kakao.Link && typeof kakao.Link.sendCustom === "function") {
        kakao.Link.sendCustom({ templateId });
        return;
      }

      // Fallback: if custom template API is unavailable, use default feed share.
      if (kakao.Share && typeof kakao.Share.sendDefault === "function") {
        kakao.Share.sendDefault(payload);
        return;
      }
      if (kakao.Link && typeof kakao.Link.sendDefault === "function") {
        kakao.Link.sendDefault(payload);
        return;
      }

      await copyText(shareUrl);
      showToast("공유 기능을 찾지 못해 링크를 복사했어요.");
    } catch (_error) {
      await copyText(shareUrl);
      showToast("공유 중 오류가 있어 링크를 복사했어요.");
    }
  });
}

updateCountdown();
setInterval(updateCountdown, 1000);

window.addEventListener("load", initNaverMap);
window.addEventListener("load", initIntroSequence);
window.addEventListener("load", initHeroFixedBackground);
window.addEventListener("load", initGallery);
window.addEventListener("load", initGuestbook);
window.addEventListener("load", initSmoothWheelScroll);
window.addEventListener("load", initKakaoShareButton);

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

