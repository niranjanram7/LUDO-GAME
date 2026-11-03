// Small, asset-free sound effects for Ludo. Audio starts only after a user gesture.
(() => {
  let context;
  let enabled = localStorage.getItem('ludo-sound') !== 'off';
  const music = new Audio('/audio/background-song.wav');
  music.loop = true;
  const savedVolume = Number(localStorage.getItem('ludo-music-volume'));
  music.volume = Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1 ? savedVolume : 0.35;
  let musicWanted = true;
  let musicMuted = localStorage.getItem('ludo-music-muted') === 'true';

  function syncMusic() {
    music.muted = musicMuted;
    if (!musicWanted) {
      music.pause();
      return;
    }
    music.play().catch(() => {});
  }

  // Retry after the first interaction in browsers that block autoplay.
  ['pointerdown', 'keydown', 'touchstart'].forEach(eventName => {
    window.addEventListener(eventName, syncMusic, { once: true, passive: true });
  });
  window.addEventListener('pageshow', syncMusic);

  function tone(frequency, duration, type = 'sine', volume = 0.08, delay = 0) {
    if (!enabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    context ||= new AudioContext();
    if (context.state === 'suspended') context.resume();
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  window.LudoAudio = {
    setMusicActive(active) {
      musicWanted = Boolean(active);
      syncMusic();
    },
    setMusicVolume(value) {
      music.volume = Math.max(0, Math.min(1, Number(value) || 0));
      localStorage.setItem('ludo-music-volume', String(music.volume));
    },
    setMusicMuted(value) {
      musicMuted = Boolean(value);
      localStorage.setItem('ludo-music-muted', String(musicMuted));
      syncMusic();
      return musicMuted;
    },
    isMusicMuted() { return musicMuted; },
    getMusicVolume() { return music.volume; },
    play(name) {
      if (name === 'roll') {
        tone(150, 0.12, 'triangle', 0.11);
        tone(82, 0.09, 'sine', 0.08, 0.025);
      } else if (name === 'dice-tick') {
        tone(240 + Math.random() * 110, 0.035, 'triangle', 0.055);
      } else if (name === 'move') {
        tone(420, 0.075, 'sine', 0.055);
      } else if (name === 'step') {
        tone(300 + Math.random() * 120, 0.06, 'triangle', 0.07);
      } else if (name === 'capture') {
        tone(190, 0.12, 'square', 0.045);
        tone(130, 0.16, 'triangle', 0.06, 0.09);
      } else if (name === 'finish') {
        [523, 659, 784, 1047].forEach((hz, i) => tone(hz, 0.17, 'triangle', 0.055, i * 0.1));
      }
    },
    setEnabled(value) {
      enabled = Boolean(value);
      localStorage.setItem('ludo-sound', enabled ? 'on' : 'off');
      return enabled;
    },
    isEnabled() { return enabled; }
  };

  const volumeControl = document.querySelector('#music-volume');
  const muteButton = document.querySelector('#music-mute');
  if (volumeControl && muteButton) {
    volumeControl.value = String(music.volume);
    const syncMuteButton = () => {
      muteButton.textContent = musicMuted ? 'Unmute music' : 'Mute music';
      muteButton.setAttribute('aria-pressed', String(musicMuted));
    };
    syncMuteButton();
    volumeControl.addEventListener('input', () => window.LudoAudio.setMusicVolume(volumeControl.value));
    muteButton.addEventListener('click', () => {
      window.LudoAudio.setMusicMuted(!musicMuted);
      syncMuteButton();
    });
  }
})();
