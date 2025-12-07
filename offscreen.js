// Keep track of currently playing audio
let currentAudio = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PLAY_SOUND") {
    playSound(msg.source);
    sendResponse({ status: "playing" });
  } else if (msg.type === "STOP_SOUND") {
    stopSound();
    sendResponse({ status: "stopped" });
  }
});

function stopSound() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

function playSound(source) {
  // Stop any currently playing audio first
  stopSound();

  // All sources now come with full paths
  currentAudio = new Audio(source);
  currentAudio.play().catch((err) => console.error("Audio play error:", err));

  // Clean up reference when audio ends
  currentAudio.addEventListener("ended", () => {
    currentAudio = null;
  });
}

function playBeep() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

  oscillator.start();

  // Beep-beep pattern
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.00001,
    audioCtx.currentTime + 0.5
  );

  oscillator.stop(audioCtx.currentTime + 0.5);
}
