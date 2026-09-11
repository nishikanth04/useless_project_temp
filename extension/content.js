(function () {
  const isTopFrame = window.self === window.top;
  if (!isTopFrame || document.getElementById('voice-vol-overlay-root')) return;

  // 1. Build Floating UI Overlay
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
    user-select: none;
  `;
  shadow.appendChild(btn);
  document.documentElement.appendChild(container);

  let isEnabled = false;
  let isHost = false;
  let audioCtx = null;
  let micStream = null;
  let animFrameId = null;
  let smoothedVolume = 0.5;
  let recognition = null;

  // Silence Prank Variables
  let silenceStartTime = null;
  let isJumpscareActive = false;
  const SILENCE_TIMEOUT_MS = 10000; // 10 seconds threshold

  function speakMalayalamPrank() {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Phonetic rendering targeting Indian regional TTS models
    const utterance = new SpeechSynthesisUtterance("ninte vaayil naakk ille?");
    utterance.pitch = 1.25;
    utterance.rate = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const regionalVoice = voices.find(v => v.lang.includes('ml') || v.lang.includes('IN'));
    if (regionalVoice) {
      utterance.voice = regionalVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  function triggerJumpscare() {
    isJumpscareActive = true;
    updateButtonUI(true, 'NINTE VAYIL NAKK ILLE?!');

    // Spike active media to 100%
    applyVolume(1.0);
    try {
      chrome.runtime.sendMessage({ type: 'BROADCAST_VOLUME', volume: 1.0 });
    } catch (_) {}

    // Speak the prank phrase
    speakMalayalamPrank();

    // Reset after 2.5 seconds
    setTimeout(() => {
      isJumpscareActive = false;
      silenceStartTime = Date.now();
      applyVolume(0.1);
    }, 2500);
  }

  function updateButtonUI(active, text = null) {
    if (active) {
      btn.style.background = '#15803d';
      btn.style.borderColor = '#22c55e';
      btn.innerText = text || '🎙️ Vol Sync: ON';
    } else {
      btn.style.background = '#111827';
      btn.style.borderColor = '#374151';
      btn.innerText = '🎙️ Vol Sync: OFF';
    }
  }

  function applyVolume(volumeLevel) {
    const clamped = Math.min(1.0, Math.max(0.0, volumeLevel));

    // Custom event bridge for Spotify wrapper
    window.dispatchEvent(
      new CustomEvent('VOICE_SET_VOLUME_EVENT', {
        detail: { volume: clamped }
      })
    );

    // Standard HTML5 media element fallback
    document.querySelectorAll('video, audio').forEach((el) => {
      try {
        el.volume = clamped;
      } catch (_) {}
    });
  }

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognition) {
      try { recognition.abort(); } catch (_) {}
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim().toLowerCase();

        // Voice Command: "open youtube" -> Opens LinkedIn
        if (transcript.includes('open youtube')) {
          chrome.runtime.sendMessage({ type: 'OPEN_LINKEDIN' });
          recognition.abort();
          break;
        }

         if (transcript.includes('open linkedlin')) {
          chrome.runtime.sendMessage({ type: 'OPEN_GEMINI' });
          recognition.abort();
          break;
        }
         if (transcript.includes('i want to study')) {
          chrome.runtime.sendMessage({ type: 'OPEN_INSTAGRAM' });
          recognition.abort();
          break;
        }
         if (transcript.includes('open instagram')) {
          chrome.runtime.sendMessage({ type: 'OPEN_KTU' });
          recognition.abort();
          break;
        }// Voice Command: "open wikipedia" -> Opens Instagram
     
      }
    };

    recognition.onend = () => {
      if (isHost && isEnabled && recognition) {
        try { recognition.start(); } catch (_) {}
      }
    };

    try {
      recognition.start();
    } catch (_) {}
  }

  async function startAudioEngine() {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("[VoiceSync] Mic permission error:", err);
      alert("Please allow microphone permissions to use Voice Sync.");
      stopAudioEngine();
      return;
    }

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(micStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      const pcmData = new Uint8Array(analyser.fftSize);
      silenceStartTime = Date.now();

      function updateLoop() {
        if (!isEnabled || !isHost) return;

        analyser.getByteTimeDomainData(pcmData);

        // Root Mean Square (RMS) calculation
        let sumSquares = 0.0;
        for (let i = 0; i < pcmData.length; i++) {
          const norm = (pcmData[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / pcmData.length);

        const noiseThreshold = 0.025;
        let target = 0;

        // 10-Second Silence Evaluation
        if (rms > noiseThreshold) {
          silenceStartTime = Date.now();
          target = Math.min(1.0, (rms - noiseThreshold) * 6.0);
        } else {
          if (!isJumpscareActive && silenceStartTime && (Date.now() - silenceStartTime >= SILENCE_TIMEOUT_MS)) {
            triggerJumpscare();
          }
        }

        // Apply progressive smoothing if not locked by jumpscare
        if (!isJumpscareActive) {
          smoothedVolume = smoothedVolume * 0.8 + target * 0.2;
          applyVolume(smoothedVolume);

          try {
            chrome.runtime.sendMessage({
              type: 'BROADCAST_VOLUME',
              volume: smoothedVolume
            });
          } catch (_) {}

          updateButtonUI(true, `🎙️ Vol Sync: ${Math.round(smoothedVolume * 100)}%`);
        }

        animFrameId = requestAnimationFrame(updateLoop);
      }

      updateLoop();
      initSpeechRecognition();
    } catch (err) {
      console.error("[VoiceSync] Audio loop error:", err);
      stopAudioEngine();
    }
  }

  function stopAudioEngine() {
    isEnabled = false;
    isHost = false;
    isJumpscareActive = false;
    silenceStartTime = null;

    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      micStream = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
    if (recognition) {
      try { recognition.abort(); } catch (_) {}
      recognition = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    applyVolume(1.0);
    try {
      chrome.runtime.sendMessage({ type: 'BROADCAST_VOLUME', volume: 1.0 });
    } catch (_) {}

    updateButtonUI(false);
  }

  // 2. Button Activation Event
  btn.addEventListener('click', async () => {
    isEnabled = !isEnabled;

    if (isEnabled) {
      isHost = true;
      updateButtonUI(true, '🎙️ Connecting...');
      try {
        chrome.runtime.sendMessage({ type: 'TOGGLE_GLOBAL_STATE', enabled: true });
      } catch (_) {}
      await startAudioEngine();
    } else {
      try {
        chrome.runtime.sendMessage({ type: 'TOGGLE_GLOBAL_STATE', enabled: false });
      } catch (_) {}
      stopAudioEngine();
    }
  });

  // 3. Tab Sync IPC Listeners
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'APPLY_REMOTE_VOLUME' && !isHost) {
      applyVolume(msg.volume);
    }
    if (msg.type === 'STATE_CHANGED') {
      if (!msg.enabled) {
        stopAudioEngine();
      } else if (!isHost) {
        isEnabled = true;
        updateButtonUI(true, '🎙️ Vol Sync: ON');
      }
    }
  });

  // 4. Restore Cross-Tab State
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['isSyncActive'], (res) => {
      if (res && res.isSyncActive && !isEnabled) {
        isEnabled = true;
        updateButtonUI(true, '🎙️ Vol Sync: ON');
      }
    });
  }
})();