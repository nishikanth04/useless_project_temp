(function () {
  // Prevent duplicate overlays in iframes
  const isTopFrame = window.self === window.top;

  // Helper to collect all audio/video elements across document and shadow roots
  function getAllMediaElements(root = document) {
    let elements = Array.from(root.querySelectorAll('video, audio'));
    
    // Scan shadow roots (used by apps like Spotify)
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode.shadowRoot) {
        elements = elements.concat(getAllMediaElements(currentNode.shadowRoot));
      }
      currentNode = walker.nextNode();
    }
    return elements;
  }

  function applyVolume(volumeLevel) {
    const clamped = Math.min(1.0, Math.max(0.0, volumeLevel));
    const media = getAllMediaElements();
    media.forEach((el) => {
      el.volume = clamped;
    });
  }

  // Listen for broadcasted volume changes from background.js
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'APPLY_REMOTE_VOLUME') {
      applyVolume(msg.volume);
    }
  });

  // Only show the floating button UI in the top frame of a tab
  if (!isTopFrame || document.getElementById('voice-vol-overlay-root')) return;

  const container = document.createElement('div');
  container.id = 'voice-vol-overlay-root';
  container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;';

  const shadow = container.attachShadow({ mode: 'open' });
  const btn = document.createElement('button');
  btn.innerText = '🎙️ Vol Sync: OFF';
  btn.style.cssText = `
    padding: 10px 18px;
    background: #111827;
    color: #f9fafb;
    border: 2px solid #374151;
    border-radius: 9999px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  shadow.appendChild(btn);
  document.documentElement.appendChild(container);

  let isEnabled = false;
  let audioCtx = null;
  let micStream = null;
  let animFrameId = null;
  let smoothedVolume = 0.5;

  async function startAudioEngine() {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(micStream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);

    const pcmData = new Uint8Array(analyser.fftSize);

    function updateLoop() {
      if (!isEnabled) return;

      analyser.getByteTimeDomainData(pcmData);

      let sumSquares = 0.0;
      for (let i = 0; i < pcmData.length; i++) {
        const norm = (pcmData[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / pcmData.length);

      const noiseThreshold = 0.02;
      let target = 0;

      if (rms > noiseThreshold) {
        target = Math.min(1.0, (rms - noiseThreshold) * 6.0);
      }

      smoothedVolume = smoothedVolume * 0.8 + target * 0.2;

      // 1. Adjust media inside current tab
      applyVolume(smoothedVolume);

      // 2. Broadcast volume to background worker for all other tabs (Spotify, etc.)
      chrome.runtime.sendMessage({
        type: 'BROADCAST_VOLUME',
        volume: smoothedVolume
      });

      btn.innerText = `🎙️ Vol Sync: ${Math.round(smoothedVolume * 100)}%`;
      animFrameId = requestAnimationFrame(updateLoop);
    }

    updateLoop();
  }

  function stopAudioEngine() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (micStream) micStream.getTracks().forEach((track) => track.stop());
    if (audioCtx) audioCtx.close();

    // Reset volume everywhere back to 100%
    applyVolume(1.0);
    chrome.runtime.sendMessage({
      type: 'BROADCAST_VOLUME',
      volume: 1.0
    });
  }

  btn.addEventListener('click', async () => {
    isEnabled = !isEnabled;
    if (isEnabled) {
      btn.style.background = '#15803d';
      btn.style.borderColor = '#22c55e';
      await startAudioEngine();
    } else {
      btn.innerText = '🎙️ Vol Sync: OFF';
      btn.style.background = '#111827';
      btn.style.borderColor = '#374151';
      stopAudioEngine();
    }
  });
})();