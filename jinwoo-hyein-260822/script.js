const targetDate = new Date("2026-08-22T13:00:00+09:00");
// 같은 파일명으로 사진만 교체했을 때 강력 새로고침 없이 반영되도록 버전을 올립니다.
const ASSET_VERSION = "20260521";
const JPEG_IMAGE_NUMBERS = new Set([2, 3, 6, 9, 11, 15, 17, 18, 19, 20, 21, 25]);

function assetUrl(path) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}v=${ASSET_VERSION}`;
}

function imageFilePath(num) {
  const ext = JPEG_IMAGE_NUMBERS.has(num) ? "jpeg" : "jpg";
  return assetUrl(`./images/${num}.${ext}`);
}

function hasFirebaseConfig(config) {
  if (!config || typeof config !== "object") return false;
  const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
  return requiredKeys.every((key) => typeof config[key] === "string" && config[key].trim().length > 0);
}

function getFirestoreCollection(collectionName) {
  if (!window.firebase) return null;
  const config = window.WEDDING_FIREBASE_CONFIG;
  if (!hasFirebaseConfig(config)) return null;

  const app = window.firebase.apps.length
    ? window.firebase.app()
    : window.firebase.initializeApp(config);
  return app.firestore().collection(collectionName);
}

const SHUTTLE_SCHEDULE_LABELS = {
  "station-1140": "순천역 출발 · 11시 40분",
  "station-1250": "순천역 출발 · 12시 50분",
  "venue-1400": "더헤윰 출발 · 14시",
  "venue-1500": "더헤윰 출발 · 15시",
};

const SHUTTLE_PICKUP_LABELS = {
  "suncheon-station": "순천역",
  "suncheon-terminal": "순천터미널",
  venue: "더헤윰",
};

const SHUTTLE_DROP_LABELS = {
  "suncheon-station": "순천역",
  "suncheon-terminal": "순천터미널",
};

const SHUTTLE_VENUE_DEPARTURES = new Set(["venue-1400", "venue-1500"]);

const RSVP_SIDE_LABELS = {
  groom: "신랑측",
  bride: "신부측",
};

const RSVP_ATTENDANCE_LABELS = {
  attending: "참석 가능",
  not_attending: "참석 불가",
};

const RSVP_THANK_MESSAGES = {
  attending:
    "저희의 소중한 날에<br />함께해 주셔서 감사합니다.<br />예식 날 반가운 마음으로 뵙겠습니다.",
  not_attending:
    "따뜻한 마음으로 저희의 시작을<br /> 축복해 주셔서 감사합니다.<br />보내주신 마음 소중히 간직하겠습니다.",
};

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

function showToast(message, options = {}) {
  if (!toast) return;
  const center = Boolean(options.center);
  toast.textContent = message;
  toast.classList.toggle("toast--center", center);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.remove("toast--center");
  }, 1500);
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
  const heroImg = bg.querySelector(".hero-bg-fixed__img");
  const heroSrc = heroImg?.getAttribute("src") ?? "";

  const update = () => {
    const rect = hero.getBoundingClientRect();
    if (rect.bottom <= 1) {
      bg.classList.add("is-past");
      if (heroImg && heroImg.getAttribute("src")) {
        heroImg.dataset.heroSrc = heroImg.getAttribute("src");
        heroImg.removeAttribute("src");
      }
    } else {
      bg.classList.remove("is-past");
      if (heroImg && !heroImg.getAttribute("src") && (heroImg.dataset.heroSrc || heroSrc)) {
        heroImg.src = heroImg.dataset.heroSrc || heroSrc;
      }
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

  const images = Array.from({ length: 21 }, (_value, index) => ({
    src: imageFilePath(index + 4),
    fallback: assetUrl("./images/1.jpg"),
  }));

  let expanded = false;
  let currentIndex = 0;

  function createImageElement(source, fallback, alt) {
    const img = document.createElement("img");
    img.dataset.src = source;
    img.dataset.fallback = fallback;
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied === "true") return;
      img.dataset.fallbackApplied = "true";
      img.src = fallback;
    });
    return img;
  }

  const imageObserver =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const img = entry.target;
              if (!(img instanceof HTMLImageElement) || img.src) return;
              img.src = img.dataset.src ?? "";
              imageObserver.unobserve(img);
            });
          },
          { rootMargin: "120px 0px" }
        )
      : null;

  function loadGalleryImage(img) {
    if (img.src || !img.dataset.src) return;
    img.src = img.dataset.src;
    imageObserver?.unobserve(img);
  }

  function appendGridItem(image, index) {
    const itemButton = document.createElement("button");
    itemButton.type = "button";
    itemButton.className = "gallery-item";
    itemButton.setAttribute("aria-label", `갤러리 사진 ${index + 1}`);
    const img = createImageElement(image.src, image.fallback, `갤러리 사진 ${index + 1}`);
    itemButton.appendChild(img);
    itemButton.addEventListener("click", () => openModal(index));
    grid.appendChild(itemButton);
    if (imageObserver) {
      imageObserver.observe(img);
    } else {
      loadGalleryImage(img);
    }
  }

  function renderGrid() {
    const visibleCount = expanded ? images.length : 9;
    const existingCount = grid.children.length;

    if (existingCount > visibleCount) {
      while (grid.children.length > visibleCount) {
        grid.lastElementChild?.remove();
      }
    } else if (existingCount < visibleCount) {
      images.slice(existingCount, visibleCount).forEach((image, offset) => {
        appendGridItem(image, existingCount + offset);
      });
    } else if (existingCount === 0) {
      images.slice(0, visibleCount).forEach((image, index) => {
        appendGridItem(image, index);
      });
    }

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

  function preventModalZoom(event) {
    event.preventDefault();
  }

  function onModalTouchMove(event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }

  function onModalImageTouchEnd(event) {
    const now = Date.now();
    const sinceLastTap = now - Number(modalImage.dataset.lastTap || 0);
    if (sinceLastTap > 0 && sinceLastTap < 320) {
      event.preventDefault();
    }
    modalImage.dataset.lastTap = String(now);
  }

  ["gesturestart", "gesturechange", "gestureend"].forEach((type) => {
    modal.addEventListener(type, preventModalZoom, { passive: false });
  });
  modal.addEventListener("touchmove", onModalTouchMove, { passive: false });
  modal.addEventListener("wheel", (event) => {
    if (event.ctrlKey) event.preventDefault();
  }, { passive: false });
  modalImage.addEventListener("dblclick", preventModalZoom);
  modalImage.addEventListener("touchend", onModalImageTouchEnd, { passive: false });

  window.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") closeModal();
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  });

  renderGrid();
}

function normalizePhoneNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return "";
  return digits;
}

function formatPhoneNumber(digits) {
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

function getSelectLabel(select) {
  if (!select || select.selectedIndex < 0) return "";
  return select.options[select.selectedIndex]?.text || "";
}

function createInlineShuttleController() {
  const tripInputs = Array.from(document.querySelectorAll('#rsvp-shuttle-details input[name="shuttle-trip"]'));
  const roundTimes = document.getElementById("shuttle-times-round");
  const stationTimeSelect = document.getElementById("shuttle-station-time");
  const venueTimeSelect = document.getElementById("shuttle-venue-time");
  const onewayTimes = document.getElementById("shuttle-times-oneway");
  const onewayTimeSelect = document.getElementById("shuttle-oneway-time");
  const pickupSelect = document.getElementById("shuttle-pickup");
  const pickupField = document.getElementById("shuttle-pickup-field");
  const pickupLabelEl = document.getElementById("shuttle-pickup-label");
  const dropSelect = document.getElementById("shuttle-drop");
  const dropField = document.getElementById("shuttle-drop-field");

  if (
    tripInputs.length === 0 ||
    !roundTimes ||
    !stationTimeSelect ||
    !venueTimeSelect ||
    !onewayTimes ||
    !onewayTimeSelect ||
    !pickupSelect ||
    !pickupField ||
    !dropSelect ||
    !dropField
  ) {
    return null;
  }

  let shuttleRequired = false;

  function getTripType() {
    const checked = document.querySelector('#rsvp-shuttle-details input[name="shuttle-trip"]:checked');
    return checked?.value || "round";
  }

  function isRoundTrip() {
    return getTripType() === "round";
  }

  function updatePickupLabel() {
    if (!pickupLabelEl) return;
    pickupLabelEl.textContent = isRoundTrip() ? "픽업 장소" : "픽업/드롭 장소";
  }

  function updatePickupField() {
    updatePickupLabel();

    if (!shuttleRequired) {
      pickupField.hidden = false;
      pickupSelect.required = false;
      dropField.hidden = false;
      dropSelect.required = false;
      return;
    }

    if (isRoundTrip()) {
      pickupField.hidden = false;
      pickupSelect.required = true;
      dropField.hidden = false;
      dropSelect.required = true;
      return;
    }

    dropField.hidden = true;
    dropSelect.required = false;

    const scheduleId = onewayTimeSelect.value;
    const isVenueDeparture = SHUTTLE_VENUE_DEPARTURES.has(scheduleId);
    pickupField.hidden = isVenueDeparture;
    pickupSelect.required = !isVenueDeparture;
    if (isVenueDeparture) {
      pickupSelect.value = "";
    }
  }

  function updateTripTypeUI() {
    const round = isRoundTrip();
    roundTimes.hidden = !round;
    onewayTimes.hidden = round;
    stationTimeSelect.required = shuttleRequired && round;
    venueTimeSelect.required = shuttleRequired && round;
    dropSelect.required = shuttleRequired && round;
    onewayTimeSelect.required = shuttleRequired && !round;

    if (round) {
      onewayTimeSelect.value = "";
    } else {
      stationTimeSelect.value = "";
      venueTimeSelect.value = "";
      dropSelect.value = "";
    }

    updatePickupField();
  }

  function setShuttleRequired(required) {
    shuttleRequired = required;
    updateTripTypeUI();
  }

  function buildSchedulePayload() {
    if (isRoundTrip()) {
      const stationId = stationTimeSelect.value;
      const venueId = venueTimeSelect.value;
      if (!stationId || !venueId) {
        return null;
      }

      const stationLabel = getSelectLabel(stationTimeSelect);
      const venueLabel = getSelectLabel(venueTimeSelect);
      const dropId = dropSelect.value;
      const dropLabel = SHUTTLE_DROP_LABELS[dropId] || "";
      if (!dropId) {
        return null;
      }
      return {
        tripType: "round",
        scheduleId: `${stationId},${venueId}`,
        scheduleStationId: stationId,
        scheduleVenueId: venueId,
        scheduleLabel: `왕복 · ${stationLabel} / ${dropLabel} · ${venueLabel}`,
        dropId,
        dropLabel,
        needsPickup: true,
      };
    }

    const scheduleId = onewayTimeSelect.value;
    if (!scheduleId) {
      return null;
    }

    const isVenueDeparture = SHUTTLE_VENUE_DEPARTURES.has(scheduleId);
    return {
      tripType: "oneway",
      scheduleId,
      scheduleStationId: isVenueDeparture ? "" : scheduleId,
      scheduleVenueId: isVenueDeparture ? scheduleId : "",
      scheduleLabel: `편도 · ${getSelectLabel(onewayTimeSelect)}`,
      needsPickup: !isVenueDeparture,
    };
  }

  function resetShuttleFields() {
    const roundInput = document.querySelector('#rsvp-shuttle-details input[name="shuttle-trip"][value="round"]');
    if (roundInput) roundInput.checked = true;
    stationTimeSelect.value = "";
    venueTimeSelect.value = "";
    onewayTimeSelect.value = "";
    pickupSelect.value = "";
    dropSelect.value = "";
    setShuttleRequired(false);
  }

  tripInputs.forEach((input) => {
    input.addEventListener("change", updateTripTypeUI);
  });
  stationTimeSelect.addEventListener("change", updatePickupField);
  onewayTimeSelect.addEventListener("change", updatePickupField);
  updateTripTypeUI();

  return {
    buildSchedulePayload,
    resetShuttleFields,
    setShuttleRequired,
    updateTripTypeUI,
  };
}

async function submitShuttleReservation(name, phoneDigits) {
  const shuttle = createInlineShuttleController();
  if (!shuttle) {
    showToast("셔틀 신청 정보를 확인할 수 없습니다.");
    return false;
  }

  const schedule = shuttle.buildSchedulePayload();
  if (!schedule) {
    showToast("셔틀 이용 정보를 확인해 주세요.");
    return false;
  }

    let pickupId = "venue";
    let pickupLabel = SHUTTLE_PICKUP_LABELS.venue;
    let dropId = schedule.dropId || "";
    let dropLabel = schedule.dropLabel || "";

    const pickupSelectEl = document.getElementById("shuttle-pickup");
    if (schedule.needsPickup) {
      pickupId = pickupSelectEl?.value || "";
      pickupLabel = SHUTTLE_PICKUP_LABELS[pickupId] || "";
      if (!pickupId) {
        showToast(
          schedule.tripType === "round" ? "픽업 장소를 선택해 주세요." : "픽업/드롭 장소를 선택해 주세요."
        );
        return false;
      }
    }

    const entry = {
      name,
      phone: phoneDigits,
      phoneDisplay: formatPhoneNumber(phoneDigits),
      tripType: schedule.tripType,
      scheduleId: schedule.scheduleId,
      scheduleStationId: schedule.scheduleStationId || "",
      scheduleVenueId: schedule.scheduleVenueId || "",
      scheduleLabel: schedule.scheduleLabel,
      pickupId,
      pickupLabel,
      dropId,
      dropLabel,
      createdAt: new Date().toISOString(),
    };

  const remoteCollection = getFirestoreCollection("shuttleReservations");
  const storageKey = "wedding_shuttle_reservations_v1";

  if (remoteCollection) {
    try {
      await remoteCollection.add({
        name: entry.name,
        phone: entry.phone,
        phoneDisplay: entry.phoneDisplay,
        tripType: entry.tripType,
        scheduleId: entry.scheduleId,
        scheduleStationId: entry.scheduleStationId,
        scheduleVenueId: entry.scheduleVenueId,
        scheduleLabel: entry.scheduleLabel,
          pickupId: entry.pickupId,
          pickupLabel: entry.pickupLabel,
          dropId: entry.dropId,
          dropLabel: entry.dropLabel,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error("Shuttle save failed:", error);
        showToast("셔틀 신청에 실패했습니다. (Firebase 규칙 확인)");
        return false;
      }
    } else {
      try {
        const raw = localStorage.getItem(storageKey);
        const entries = raw ? JSON.parse(raw) : [];
        const nextEntries = Array.isArray(entries) ? entries : [];
        nextEntries.unshift(entry);
        localStorage.setItem(storageKey, JSON.stringify(nextEntries.slice(0, 100)));
      } catch (error) {
        console.error("Shuttle local save failed:", error);
        showToast("셔틀 신청에 실패했습니다.");
        return false;
      }
    }

    return true;
}

function initRsvp() {
  const form = document.getElementById("rsvp-form");
  const nameInput = document.getElementById("rsvp-name");
  const phoneInput = document.getElementById("rsvp-phone");
  const sideInputs = Array.from(form?.querySelectorAll('input[name="rsvp-side"]') || []);
  const attendanceInputs = Array.from(form?.querySelectorAll('input[name="rsvp-attendance"]') || []);
  const guestCountField = document.getElementById("rsvp-guest-count-field");
  const guestCountSelect = document.getElementById("rsvp-guest-count");
  const noteInput = document.getElementById("rsvp-note");
  const shuttleWrap = document.getElementById("rsvp-shuttle-wrap");
  const shuttleRequest = document.getElementById("rsvp-shuttle-request");
  const shuttleDetails = document.getElementById("rsvp-shuttle-details");
  const shuttleController = createInlineShuttleController();
  const fab = document.getElementById("rsvp-fab");
  const modal = document.getElementById("rsvp-modal");
  const modalClose = document.getElementById("rsvp-modal-close");
  const thankModal = document.getElementById("rsvp-thank-modal");
  const thankClose = document.getElementById("rsvp-thank-close");
  const thankMessage = document.getElementById("rsvp-thank-message");
  if (
    !form ||
    !nameInput ||
    !phoneInput ||
    sideInputs.length === 0 ||
    attendanceInputs.length === 0 ||
    !guestCountField ||
    !guestCountSelect ||
    !noteInput ||
    !shuttleWrap ||
    !shuttleRequest ||
    !shuttleDetails ||
    !shuttleController ||
    !fab ||
    !modal ||
    !modalClose ||
    !thankModal ||
    !thankClose ||
    !thankMessage
  ) {
    return;
  }

  const remoteCollection = getFirestoreCollection("rsvpResponses");
  const storageKey = "wedding_rsvp_responses_v1";

  function getSide() {
    return form.querySelector('input[name="rsvp-side"]:checked')?.value || "";
  }

  function getAttendance() {
    return form.querySelector('input[name="rsvp-attendance"]:checked')?.value || "attending";
  }

  function isAttending() {
    return getAttendance() === "attending";
  }

  function resetGuestCountSelect() {
    guestCountSelect.value = "";
  }

  function resizeNoteField() {
    noteInput.style.height = "auto";
    noteInput.style.height = `${noteInput.scrollHeight}px`;
  }

  function updateShuttleVisibility() {
    const checked = shuttleRequest.checked;
    shuttleDetails.hidden = !checked;
    shuttleController.setShuttleRequired(checked);
  }

  function updateAttendanceFields() {
    const attending = isAttending();
    guestCountField.hidden = !attending;
    guestCountSelect.required = attending;
    shuttleWrap.hidden = !attending;
    if (!attending) {
      resetGuestCountSelect();
      shuttleRequest.checked = false;
      updateShuttleVisibility();
    }
  }

  function openModal() {
    modal.hidden = false;
    document.body.classList.add("rsvp-modal-open");
    resizeNoteField();
    nameInput.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("rsvp-modal-open");
  }

  function openThankModal(attendance) {
    const message = RSVP_THANK_MESSAGES[attendance] || RSVP_THANK_MESSAGES.attending;
    thankMessage.innerHTML = message;
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

  shuttleRequest.addEventListener("change", updateShuttleVisibility);
  noteInput.addEventListener("input", resizeNoteField);

  thankClose.addEventListener("click", closeThankModal);
  thankModal.addEventListener("click", (event) => {
    if (event.target === thankModal) closeThankModal();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!thankModal.hidden) {
      closeThankModal();
      return;
    }
    if (modal.hidden) return;
    closeModal();
  });

  attendanceInputs.forEach((input) => {
    input.addEventListener("change", updateAttendanceFields);
  });
  updateAttendanceFields();
  updateShuttleVisibility();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim().slice(0, 12);
    const phoneDigits = normalizePhoneNumber(phoneInput.value);
    const side = getSide();
    const sideLabel = RSVP_SIDE_LABELS[side] || "";
    const attendance = getAttendance();
    const attendanceLabel = RSVP_ATTENDANCE_LABELS[attendance] || "";
    const guestCount = isAttending()
      ? guestCountSelect.value === ""
        ? null
        : Number(guestCountSelect.value)
      : 0;
    const guestCountLabel = isAttending()
      ? guestCount === 0
        ? "없음"
        : guestCount === null
          ? ""
          : `${guestCount}명`
      : "";

    if (!name || !phoneDigits || !sideLabel || !attendanceLabel) {
      showToast("입력 정보를 확인해 주세요.");
      return;
    }

    if (isAttending() && guestCount === null) {
      showToast("동행 인원을 선택해 주세요.");
      return;
    }

    if (isAttending() && (!Number.isFinite(guestCount) || guestCount < 0)) {
      showToast("동행 인원을 확인해 주세요.");
      return;
    }

    const note = noteInput.value.trim().slice(0, 200);

    const entry = {
      name,
      phone: phoneDigits,
      phoneDisplay: formatPhoneNumber(phoneDigits),
      side,
      sideLabel,
      attendance,
      attendanceLabel,
      guestCount,
      guestCountLabel,
      note,
      createdAt: new Date().toISOString(),
    };

    const wantsShuttle = isAttending() && shuttleRequest.checked;

    if (remoteCollection) {
      try {
        await remoteCollection.add({
          name: entry.name,
          phone: entry.phone,
          phoneDisplay: entry.phoneDisplay,
          side: entry.side,
          sideLabel: entry.sideLabel,
          attendance: entry.attendance,
          attendanceLabel: entry.attendanceLabel,
          guestCount: entry.guestCount,
          guestCountLabel: entry.guestCountLabel,
          note: entry.note,
          shuttleRequested: wantsShuttle,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error("RSVP save failed:", error);
        showToast("전달에 실패했습니다. (Firebase 규칙 확인)");
        return;
      }
    } else {
      try {
        const raw = localStorage.getItem(storageKey);
        const entries = raw ? JSON.parse(raw) : [];
        const nextEntries = Array.isArray(entries) ? entries : [];
        nextEntries.unshift({ ...entry, shuttleRequested: wantsShuttle });
        localStorage.setItem(storageKey, JSON.stringify(nextEntries.slice(0, 100)));
      } catch (error) {
        console.error("RSVP local save failed:", error);
        showToast("전달에 실패했습니다.");
        return;
      }
    }

    if (wantsShuttle) {
      const shuttleSaved = await submitShuttleReservation(name, phoneDigits);
      if (!shuttleSaved) {
        return;
      }
    }

    form.reset();
    const attendingInput = form.querySelector('input[name="rsvp-attendance"][value="attending"]');
    if (attendingInput) attendingInput.checked = true;
    sideInputs.forEach((input) => {
      input.checked = false;
    });
    resetGuestCountSelect();
    resizeNoteField();
    shuttleController.resetShuttleFields();
    shuttleRequest.checked = false;
    updateShuttleVisibility();
    updateAttendanceFields();
    const submittedAttendance = attendance;
    closeModal();
    openThankModal(submittedAttendance);
  });
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

  const remoteCollection = getFirestoreCollection("guestbookEntries");

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
      .onSnapshot(
        (snapshot) => {
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
          saveEntries(remoteEntries);
        },
        (error) => {
          console.error("Guestbook listen failed:", error);
          entries = readEntries();
          render(entries);
        }
      );
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

function initPreventPageZoom() {
  let lastTouchEnd = 0;

  document.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  ["gesturestart", "gesturechange", "gestureend"].forEach((type) => {
    document.addEventListener(type, (event) => {
      event.preventDefault();
    });
  });

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
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
          "input, textarea, select, [contenteditable='true'], #naver-map, .gallery-modal, .guestbook-modal, .guestbook-thank-modal, #rsvp-thank-modal, #rsvp-modal"
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
  const appKey = "e00da8de3678ba5eb6930824151e418e";
  const templateId = 132617;

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

      if (kakao.Share && typeof kakao.Share.sendCustom === "function") {
        // 개발자 콘솔(템플릿 132617)에 저장한 제목·본문·이미지·버튼을 그대로 사용합니다.
        // templateArgs는 콘솔에 ${KEY} 형태로 열어둔 항목이 있을 때만, 키 이름이 정확히 일치해야 합니다.
        kakao.Share.sendCustom({
          templateId,
        });
        return;
      }

      await copyText(shareUrl);
      showToast("공유 기능을 찾지 못해 링크를 복사했어요.");
    } catch (error) {
      console.error("카카오 공유 오류:", error);
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
window.addEventListener("load", initRsvp);
window.addEventListener("load", initGuestbook);
window.addEventListener("load", initPreventPageZoom);
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

