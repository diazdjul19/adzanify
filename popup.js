document.addEventListener("DOMContentLoaded", () => {
  const locationText = document.getElementById("location-text");
  const nextPrayerName = document.getElementById("next-prayer-name");
  const countdownEl = document.getElementById("countdown");
  const prayerListEl = document.getElementById("prayer-list");
  const currentDateEl = document.getElementById("current-date");
  const settingsBtn = document.getElementById("settings-btn");
  const settingsPanel = document.getElementById("settings-panel");
  const closeSettingsBtn = document.getElementById("close-settings");
  const languageSelect = document.getElementById("language-select");
  const soundSelect = document.getElementById("sound-select");
  const themeSelect = document.getElementById("theme-select");
  const previewSoundBtn = document.getElementById("preview-sound-btn");
  const stopSoundBtn = document.getElementById("stop-sound-btn");

  // State
  let prayers = {}; // Stores API names (Fajr, Dhuhr, etc.)
  let nextPrayer = null; // Stores next prayer info
  let countdownInterval = null;
  let currentLanguage = "id"; // Default to Indonesian

  // Translations
  const translations = {
    en: {
      detecting: "Detecting...",
      settings: "Settings",
      language: "Language",
      sound: "Notification Sound",
      theme: "Theme",
      nextPrayer: "Next Prayer",
      prayers: {
        Fajr: "Fajr",
        Dhuhr: "Dhuhr",
        Asr: "Asr",
        Maghrib: "Maghrib",
        Isha: "Isha",
      },
      dateFormat: "en-US",
    },
    id: {
      detecting: "Mendeteksi...",
      settings: "Pengaturan",
      language: "Bahasa",
      sound: "Suara Notifikasi",
      theme: "Tema",
      nextPrayer: "Sholat Berikutnya",
      prayers: {
        Fajr: "Subuh",
        Dhuhr: "Dzuhur",
        Asr: "Ashar",
        Maghrib: "Magrib",
        Isha: "Isya",
      },
      dateFormat: "id-ID",
    },
    ar: {
      detecting: "جار الكشف...",
      settings: "الإعدادات",
      language: "اللغة",
      sound: "صوت الإشعار",
      theme: "المظهر",
      nextPrayer: "الصلاة التالية",
      prayers: {
        Fajr: "الفجر",
        Dhuhr: "الظهر",
        Asr: "العصر",
        Maghrib: "المغرب",
        Isha: "العشاء",
      },
      dateFormat: "ar-SA",
    },
  };

  // Ordered list of prayer names (API keys) for display - FILTERED
  const orderedApiPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  // Initialize
  init();

  function init() {
    loadSettings();
    updateDate();
    getLocation();
    setupEventListeners();
  }

  function setupEventListeners() {
    settingsBtn.addEventListener("click", () => {
      settingsPanel.classList.remove("hidden");
    });

    closeSettingsBtn.addEventListener("click", () => {
      settingsPanel.classList.add("hidden");
    });

    languageSelect.addEventListener("change", (e) => {
      setLanguage(e.target.value);
    });

    soundSelect.addEventListener("change", (e) => {
      setSound(e.target.value);
    });

    themeSelect.addEventListener("change", (e) => {
      setTheme(e.target.value);
    });

    previewSoundBtn.addEventListener("click", () => {
      previewSound();
    });

    stopSoundBtn.addEventListener("click", () => {
      stopSound();
    });
  }

  function loadSettings() {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get(["language", "sound", "theme"], (result) => {
        // Language
        if (result.language) {
          setLanguage(result.language);
        } else {
          setLanguage("id"); // Default
        }

        // Sound
        if (result.sound) {
          soundSelect.value = result.sound;
        } else {
          soundSelect.value = "adhan";
        }

        // Theme
        if (result.theme) {
          setTheme(result.theme);
        } else {
          setTheme("adzanify"); // Default
        }
      });
    } else {
      console.warn("chrome.storage not available, using default settings");
      setLanguage("id");
      setTheme("adzanify");
    }
  }

  function setLanguage(lang) {
    currentLanguage = lang;
    languageSelect.value = lang;

    // RTL Support
    if (lang === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }

    // Update DOM elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    // Update dynamic content
    updateDate();
    if (Object.keys(prayers).length > 0) {
      renderPrayerList();
      updateNextPrayer();
    }

    // Save preference
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ language: lang });
    }
  }

  function setSound(sound) {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ sound: sound });
    }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeSelect.value = theme;

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ theme: theme });
    }
  }

  function previewSound() {
    const sound = soundSelect.value;
    if (sound === "silent") return;

    let source = "sounds/beeps.mp3"; // Default fallback
    if (sound === "adhan") {
      // Preview with default adzan (not Fajr-specific)
      source = "sounds/adzan-default.mp3";
    } else if (sound === "default") {
      source = "sounds/beeps.mp3";
    }

    // Use runtime.sendMessage to ask background/offscreen to play
    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.sendMessage
    ) {
      chrome.runtime.sendMessage({
        type: "PLAY_SOUND",
        source: source,
        prayerName: null, // Preview doesn't need prayer-specific logic
      });
    } else {
      console.error("Chrome runtime not available");
    }
  }

  function stopSound() {
    // Send message to background/offscreen to stop audio
    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.sendMessage
    ) {
      chrome.runtime.sendMessage({
        type: "STOP_SOUND",
      });
    } else {
      console.error("Chrome runtime not available");
    }
  }

  function updateDate() {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const locale = translations[currentLanguage].dateFormat;
    currentDateEl.textContent = new Date().toLocaleDateString(locale, options);
  }

  async function getReverseGeocode(lat, lon) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=id`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Adzanify Chrome Extension (Prayer Time Reminder)",
        },
      });

      const data = await response.json();

      if (data && data.address) {
        // Priority: suburb (district) → city_district → city → state
        const location =
          data.address.suburb ||
          data.address.city_district ||
          data.address.city ||
          data.address.state ||
          data.address.country ||
          `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

        return location;
      }

      // Fallback to coordinates if no address found
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      // Fallback to coordinates on error
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
  }

  function getLocation() {
    if (!navigator.geolocation) {
      locationText.textContent = "Not supported";
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Get prayer times first
        getPrayerTimes(latitude, longitude);

        // Then get human-readable location
        const locationName = await getReverseGeocode(latitude, longitude);
        locationText.textContent = locationName;
      },
      (error) => {
        console.error("Error getting location:", error);
        locationText.textContent = "Location denied";
        // Fallback to Jakarta
        getPrayerTimes(-6.2088, 106.8456);
        locationText.textContent = "Jakarta (Default)";
      }
    );
  }

  async function getPrayerTimes(lat, long) {
    try {
      const date = new Date();
      const method = 2; // ISNA
      const url = `https://api.aladhan.com/v1/timings/${date.getDate()}-${
        date.getMonth() + 1
      }-${date.getFullYear()}?latitude=${lat}&longitude=${long}&method=${method}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 200) {
        prayers = data.data.timings;
        renderPrayerList();
        updateNextPrayer();

        if (
          typeof chrome !== "undefined" &&
          chrome.storage &&
          chrome.storage.local
        ) {
          chrome.storage.local.set({
            prayers: prayers,
            location: { lat, long },
            lastUpdated: Date.now(),
          });
        }
      } else {
        locationText.textContent = "API Error";
      }
    } catch (error) {
      console.error("Network error:", error);
      locationText.textContent = "Network Error";
    }
  }

  function renderPrayerList() {
    prayerListEl.innerHTML = "";

    orderedApiPrayers.forEach((apiName) => {
      const time = prayers[apiName];
      if (!time) return;

      const displayName = translations[currentLanguage].prayers[apiName];

      const div = document.createElement("div");
      div.className = "prayer-item";
      div.innerHTML = `
                <span class="prayer-name">${displayName}</span>
                <span class="prayer-time">${time}</span>
            `;

      div.dataset.apiName = apiName; // Use API name for stable reference
      prayerListEl.appendChild(div);
    });
  }

  function updateNextPrayer() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let foundNext = false;
    let nextPrayerApiName = "";

    // Reset styles
    document.querySelectorAll(".prayer-item").forEach((el) => {
      el.classList.remove("active", "passed");
    });

    for (const apiName of orderedApiPrayers) {
      const timeStr = prayers[apiName];
      if (!timeStr) continue;

      const [hours, minutes] = timeStr.split(":").map(Number);
      const prayerTime = hours * 60 + minutes;

      const el = document.querySelector(
        `.prayer-item[data-api-name="${apiName}"]`
      );

      if (prayerTime < currentTime) {
        if (el) el.classList.add("passed");
      } else {
        if (!foundNext) {
          foundNext = true;
          nextPrayerApiName = apiName;
          nextPrayer = { apiName, hours, minutes };
          if (el) el.classList.add("active");
        }
      }
    }

    // If no prayer left today, next is Fajr (Subuh) tomorrow
    if (!foundNext) {
      nextPrayerApiName = "Fajr";
      const timeStr = prayers["Fajr"];
      const [hours, minutes] = timeStr.split(":").map(Number);
      nextPrayer = { apiName: "Fajr", hours: hours + 24, minutes };

      const el = document.querySelector(`.prayer-item[data-api-name="Fajr"]`);
      if (el) el.classList.add("active");
    }

    // Update display name
    nextPrayerName.textContent =
      translations[currentLanguage].prayers[nextPrayerApiName];
    startCountdown();
  }

  function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    function tick() {
      const now = new Date();
      const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();
      const nowSeconds = now.getSeconds();

      let targetTotalMinutes = nextPrayer.hours * 60 + nextPrayer.minutes;

      let diffMinutes = targetTotalMinutes - nowTotalMinutes;
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
      }

      let totalSecondsDiff = diffMinutes * 60 - nowSeconds;

      if (totalSecondsDiff <= 0) {
        updateNextPrayer();
        return;
      }

      const h = Math.floor(totalSecondsDiff / 3600);
      const m = Math.floor((totalSecondsDiff % 3600) / 60);
      const s = totalSecondsDiff % 60;

      countdownEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    }

    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  function pad(num) {
    return num.toString().padStart(2, "0");
  }
});
