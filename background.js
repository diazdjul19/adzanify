// Background service worker

// Initialize alarms on browser/system startup
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started, initializing alarms...");
  initializeAlarms();
});

// Initialize alarms when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Azanify Extension Installed");
  initializeAlarms();
});

// Load prayer times from storage and schedule alarms
async function initializeAlarms() {
  const data = await chrome.storage.local.get(["prayers"]);
  if (data.prayers) {
    console.log("Prayer times found in storage, scheduling alarms...");
    scheduleAlarms(data.prayers);
  } else {
    console.log("No prayer times found in storage yet");
  }
}

// Listen for updates from popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.prayers) {
    const prayers = changes.prayers.newValue;
    scheduleAlarms(prayers);
  }
});

function scheduleAlarms(prayers) {
  chrome.alarms.clearAll();

  const now = new Date();
  const orderedPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  orderedPrayers.forEach((name) => {
    const timeStr = prayers[name];
    if (!timeStr) return;

    const [hours, minutes] = timeStr.split(":").map(Number);
    const prayerDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );

    if (prayerDate > now) {
      chrome.alarms.create(name, {
        when: prayerDate.getTime(),
      });
      console.log(`Scheduled ${name} at ${prayerDate.toLocaleTimeString()}`);
    }
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  showNotification(alarm.name);
  playSound(null, alarm.name); // Pass prayer name
});

function showNotification(prayerName) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "Waktunya Sholat",
    message: `Saatnya sholat ${prayerName} telah tiba.`,
    priority: 2,
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PLAY_SOUND") {
    playSound(request.source, request.prayerName);
  } else if (request.type === "STOP_SOUND") {
    stopSound();
  }
});

async function playSound(sourceOverride, prayerName) {
  const settings = await chrome.storage.local.get(["sound"]);
  const sound = settings.sound || "default";

  if (sound === "silent" && !sourceOverride) return;

  await createOffscreenDocument();

  let source = "beep"; // Default fallback

  // If sourceOverride is provided (from preview), use it
  if (sourceOverride) {
    source = sourceOverride;
  } else {
    // Determine sound based on prayer time and settings
    if (sound === "adhan") {
      // Use different adzan for Fajr (Subuh)
      if (prayerName === "Fajr") {
        source = "sounds/adzan-subuh.mp3";
      } else {
        source = "sounds/adzan-default.mp3";
      }
    } else if (sound === "beep") {
      source = "sounds/beeps.mp3";
    } else {
      // default sound
      if (prayerName === "Fajr") {
        source = "sounds/adzan-subuh.mp3";
      } else {
        source = "sounds/adzan-default.mp3";
      }
    }
  }

  chrome.runtime.sendMessage({
    type: "PLAY_SOUND",
    source: source,
  });
}

async function stopSound() {
  await createOffscreenDocument();

  chrome.runtime.sendMessage({
    type: "STOP_SOUND",
  });
}

async function createOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: ["offscreen.html"],
  });

  if (existingContexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Notification sound for prayer times",
  });
}
