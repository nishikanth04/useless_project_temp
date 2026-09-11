// Intercept all Audio elements created by Spotify in memory
const originalAudio = window.Audio;
window._activeSpotifyAudioInstances = new Set();

window.Audio = function(...args) {
  const instance = new originalAudio(...args);
  window._activeSpotifyAudioInstances.add(instance);
  return instance;
};
window.Audio.prototype = originalAudio.prototype;

// Intercept HTMLMediaElement play calls
const originalPlay = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function() {
  window._activeSpotifyAudioInstances.add(this);
  return originalPlay.apply(this, arguments);
};

// Listen for volume dispatches sent from content.js
window.addEventListener('VOICE_SET_VOLUME_EVENT', (e) => {
  const volume = e.detail.volume;

  // 1. Force volume on all active Audio instances in memory
  window._activeSpotifyAudioInstances.forEach((audio) => {
    try {
      audio.volume = volume;
    } catch (_) {}
  });

  // 2. Adjust any standard DOM media elements
  document.querySelectorAll('audio, video').forEach((el) => {
    try {
      el.volume = volume;
    } catch (_) {}
  });

  // 3. Directly target Spotify's UI volume slider if available
  const slider = document.querySelector('[data-testid="volume-bar"] input[type="range"]');
  if (slider) {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeSetter.call(slider, volume);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  }
});