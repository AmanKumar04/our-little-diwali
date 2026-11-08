(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const copy = window.DiwaliPersonalization;

  // A quiet, original score and small sound effects are synthesized locally.
  // Nothing is fetched, and the AudioContext is first created after the opening click.
  let audioContext;
  let masterGain;
  let musicGain;
  let effectsGain;
  let musicTimer;
  let musicEnabled = false;
  let soundEnabled = true;
  let audioStarted = false;
  let melodyStep = 0;
  let toastTimer;
  let sparkTimer;
  let sparkActive = false;
  let eatenCount = 0;
  let litDiyas = 0;
  let letterUnlocked = false;

  function applyPersonalization() {
    $('#intro-eyebrow').textContent = copy.intro.eyebrow;
    copy.intro.lines.forEach((line, index) => {
      $(`#intro-line-${['one', 'two', 'three'][index]}`).textContent = line;
    });
    $('#intro-welcome').textContent = copy.intro.welcome;
    $('#intro-button-label').textContent = copy.intro.button;
    $('#intro-note').textContent = copy.intro.note;

    $('#greeting-eyebrow').textContent = copy.greeting.eyebrow;
    $('#greeting-title').textContent = copy.greeting.title;
    const greetingMessage = $('#greeting-message');
    copy.greeting.paragraphs.forEach((paragraph) => {
      const element = document.createElement('p');
      element.textContent = paragraph;
      greetingMessage.append(element);
    });
    $('#greeting-handwritten').textContent = copy.greeting.handwritten;
    $('#greeting-button-label').textContent = copy.greeting.button;

    $('#mithai-eyebrow').textContent = copy.sweets.eyebrow;
    $('#mithai-title').textContent = copy.sweets.title;
    $('#mithai-subtitle').textContent = copy.sweets.subtitle;
    $('#sweet-counter-label').textContent = copy.sweets.counterLabel;
    $('#sweet-footer-copy').textContent = copy.sweets.footer;
    $$('.sweet-card').forEach((card) => {
      $('.sweet-message', card).textContent = copy.sweets.reactions[card.dataset.sweet];
    });

    $('#celebration-eyebrow').textContent = copy.celebration.eyebrow;
    $('#celebration-title').textContent = copy.celebration.title;
    $('#celebration-subtitle').textContent = copy.celebration.subtitle;
    $('#celebration-caption-copy').textContent = copy.celebration.defaultCaption;

    $('#memory-title').textContent = copy.story.title;
    const timeline = $('#memory-timeline');
    copy.story.milestones.forEach((milestone) => {
      const item = document.createElement('li');
      const date = document.createElement('span');
      const detail = document.createElement('p');
      date.className = 'memory-date';
      date.textContent = milestone.date;
      detail.textContent = milestone.detail;
      item.append(date, detail);
      timeline.append(item);
    });

    $('#letter-unlock-title').textContent = copy.hiddenLetter.teaser;
    $('#letter-unlock-button-label').textContent = copy.hiddenLetter.openButton;
    $('#love-letter-eyebrow').textContent = copy.hiddenLetter.eyebrow;
    $('#love-letter-heading').textContent = copy.hiddenLetter.title;
    const personalLetter = $('#personal-letter-copy');
    const greeting = document.createElement('p');
    greeting.className = 'letter-salutation';
    greeting.textContent = copy.hiddenLetter.greeting;
    personalLetter.append(greeting);
    copy.hiddenLetter.paragraphs.forEach((paragraph) => {
      const element = document.createElement('p');
      element.textContent = paragraph;
      personalLetter.append(element);
    });
    const signoff = document.createElement('p');
    signoff.className = 'personal-letter-signoff';
    const signoffLine = document.createElement('span');
    const signature = document.createElement('strong');
    signoffLine.textContent = copy.hiddenLetter.signoff;
    signature.textContent = copy.hiddenLetter.signature;
    signoff.append(signoffLine, signature);
    personalLetter.append(signoff);

    $('#ending-eyebrow').textContent = copy.ending.eyebrow;
    $('#ending-title').textContent = copy.ending.title;
    $('#ending-paragraph-one').textContent = copy.ending.paragraphs[0];
    $('#ending-paragraph-two').textContent = copy.ending.paragraphs[1];
    $('#ending-paragraph-three').textContent = copy.ending.paragraphs[2];
    $('#ending-signoff').textContent = copy.ending.signoff;
    $('#ending-signature').textContent = copy.ending.signature;
    $('#ending-art-label').textContent = copy.ending.artLabel;
    $('#footer-copy').textContent = copy.footer.copy;
    $('#footer-tagline').textContent = copy.footer.tagline;
  }
  applyPersonalization();

  function ensureAudio() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      audioContext = new AudioContextClass();
      masterGain = audioContext.createGain();
      musicGain = audioContext.createGain();
      effectsGain = audioContext.createGain();
      masterGain.gain.value = 0.48;
      musicGain.gain.value = 0.19;
      effectsGain.gain.value = 0.58;
      musicGain.connect(masterGain);
      effectsGain.connect(masterGain);
      masterGain.connect(audioContext.destination);
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    audioStarted = true;
    return true;
  }

  function tone(frequency, start, duration, volume, wave = 'sine', destination = effectsGain, slide = null) {
    if (!audioContext || !destination) return;
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(slide, 1), start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), start + Math.min(.045, duration / 3));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .025);
  }

  function noiseBurst(start, duration, volume, destination = effectsGain) {
    if (!audioContext || !destination) return;
    const sampleCount = Math.max(1, Math.floor(audioContext.sampleRate * duration));
    const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) {
      const fade = 1 - i / sampleCount;
      data[i] = (Math.random() * 2 - 1) * fade * fade;
    }
    const source = audioContext.createBufferSource();
    const envelope = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2600;
    source.buffer = buffer;
    envelope.gain.setValueAtTime(volume, start);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(destination);
    source.start(start);
  }

  function playClick() {
    if (!soundEnabled || !ensureAudio()) return;
    const now = audioContext.currentTime;
    tone(740, now, .075, .035, 'sine');
  }

  function playSparkle() {
    if (!soundEnabled || !ensureAudio()) return;
    const now = audioContext.currentTime;
    tone(2600 + Math.random() * 500, now, .075, .055, 'sine', effectsGain, 1550);
    tone(1650 + Math.random() * 400, now + .045, .12, .035, 'triangle', effectsGain, 950);
    noiseBurst(now, .11, .026);
  }

  function playFirework() {
    if (!soundEnabled || !ensureAudio()) return;
    const now = audioContext.currentTime;
    tone(210, now, .33, .13, 'sawtooth', effectsGain, 590);
    noiseBurst(now + .29, .55, .12);
    tone(520, now + .31, .5, .09, 'sine', effectsGain, 185);
    tone(780, now + .34, .34, .045, 'triangle', effectsGain, 340);
  }

  function playDiya() {
    if (!soundEnabled || !ensureAudio()) return;
    const now = audioContext.currentTime;
    tone(880, now, .48, .065, 'sine', effectsGain, 660);
    tone(1320, now + .04, .55, .034, 'sine', effectsGain, 990);
  }

  const chords = [
    [261.63, 329.63, 392.00, 493.88],
    [220.00, 261.63, 329.63, 392.00],
    [174.61, 220.00, 261.63, 349.23],
    [196.00, 246.94, 293.66, 392.00],
  ];
  const melody = [523.25, 587.33, 659.25, 587.33, 493.88, 392, 440, 493.88, 523.25, 659.25, 587.33, 493.88, 440, 392, 329.63, 392];

  function playMusicBar() {
    if (!audioContext || !musicGain || !musicEnabled) return;
    const now = audioContext.currentTime + .08;
    const chord = chords[Math.floor(melodyStep / 4) % chords.length];
    chord.forEach((frequency, index) => tone(frequency, now, 3.9, index === 0 ? .025 : .013, 'sine', musicGain));
    const note = melody[melodyStep % melody.length];
    tone(note, now + .04, 1.25, .029, 'triangle', musicGain);
    tone(note * 2, now + .055, .8, .009, 'sine', musicGain);
    melodyStep += 1;
  }

  function setMusic(enabled) {
    musicEnabled = enabled;
    const button = $('#music-toggle');
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Turn music off' : 'Turn music on');
    $('.control-label', button).textContent = enabled ? 'Music on' : 'Music off';
    if (!ensureAudio()) {
      musicEnabled = false;
      button.setAttribute('aria-pressed', 'false');
      $('.control-label', button).textContent = 'Music unavailable';
      return;
    }
    if (enabled) {
      playMusicBar();
      window.clearInterval(musicTimer);
      musicTimer = window.setInterval(playMusicBar, 3600);
    } else {
      window.clearInterval(musicTimer);
    }
  }

  function setSound(enabled) {
    soundEnabled = enabled;
    const button = $('#sound-toggle');
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Turn sound effects off' : 'Turn sound effects on');
    $('.control-label', button).textContent = enabled ? 'Sound on' : 'Sound off';
    if (enabled) playClick();
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2300);
  }

  function scrollToTarget(selector) {
    const target = $(selector);
    if (target) target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function addStars(container, count, className = 'star') {
    if (!container) return;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
      const star = document.createElement('i');
      star.className = className;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * -4}s`;
      if (className === 'star') star.style.opacity = `${.35 + Math.random() * .65}`;
      fragment.append(star);
    }
    container.append(fragment);
  }
  addStars($('.starfield'), 78);
  addStars($('.ending-stars'), 52);

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .16 });
  $$('[data-reveal]').forEach((element) => revealObserver.observe(element));

  const chapters = $$('.chapter-dot');
  const chapterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      chapters.forEach((link) => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    });
  }, { threshold: .45 });
  $$('main .scene').forEach((scene) => chapterObserver.observe(scene));

  $('#open-surprise').addEventListener('click', () => {
    playClick();
    setMusic(true);
    scrollToTarget('#greeting');
  });

  $('#music-toggle').addEventListener('click', () => {
    playClick();
    setMusic(!musicEnabled);
  });
  $('#sound-toggle').addEventListener('click', () => setSound(!soundEnabled));
  $$('[data-scroll]').forEach((button) => button.addEventListener('click', () => {
    playClick();
    scrollToTarget(button.dataset.scroll);
  }));

  $$('.sweet-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (card.disabled) return;
      playClick();
      card.classList.add('eaten');
      card.disabled = true;
      card.setAttribute('aria-label', `${card.dataset.sweet} enjoyed`);
      eatenCount += 1;
      $('#sweet-count').textContent = String(eatenCount);
      if (eatenCount === 8) showToast(copy.sweets.allEaten);
      updateLetterUnlock();
    });
  });

  const sparklerArt = $('#sparkler-art');
  const sparkContainer = $('.spark-particles', sparklerArt);
  function emitSpark() {
    if (!sparkActive) return;
    for (let index = 0; index < 5; index += 1) {
      const particle = document.createElement('i');
      particle.style.setProperty('--x', `${Math.round(Math.random() * 90 - 45)}px`);
      particle.style.setProperty('--y', `${Math.round(Math.random() * 80 - 54)}px`);
      sparkContainer.append(particle);
      particle.addEventListener('animationend', () => particle.remove(), { once: true });
    }
    if (Math.random() > .55) playSparkle();
  }
  function setSparkler(active) {
    sparkActive = active;
    sparklerArt.classList.toggle('is-lit', active);
    $('#sparkler-toggle').setAttribute('aria-pressed', String(active));
    $('#sparkler-toggle').querySelector('span').textContent = active ? 'Put out the sparkler' : 'Light the sparkler';
    window.clearInterval(sparkTimer);
    if (active) {
      emitSpark();
      sparkTimer = window.setInterval(emitSpark, 165);
      $('#celebration-caption-copy').textContent = copy.celebration.sparkler;
    }
  }
  $('#sparkler-toggle').addEventListener('click', () => {
    playClick();
    setSparkler(!sparkActive);
  });

  const burstColors = ['#ffd77a', '#ef9cb1', '#91d4db', '#bba5ed', '#ff9e6b', '#f7e5b2'];
  function launchBurst(x, y, scale = 1) {
    const layer = $('#firework-layer');
    const particleCount = 24;
    const color = burstColors[Math.floor(Math.random() * burstColors.length)];
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < particleCount; index += 1) {
      const particle = document.createElement('i');
      const angle = (Math.PI * 2 * index) / particleCount;
      const distance = (55 + Math.random() * 55) * scale;
      particle.className = 'firework-burst';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      particle.style.setProperty('--burst', color);
      particle.style.background = color;
      particle.style.animationDelay = `${Math.random() * .12}s`;
      particle.addEventListener('animationend', () => particle.remove(), { once: true });
      fragment.append(particle);
    }
    layer.append(fragment);
  }
  $('#fireworks-trigger').addEventListener('click', () => {
    playClick();
    const sectionRect = $('#celebration').getBoundingClientRect();
    const cardRect = $('.fireworks-card').getBoundingClientRect();
    const x = Math.min(sectionRect.width - 40, Math.max(40, cardRect.left + cardRect.width / 2 - sectionRect.left));
    const y = Math.max(115, cardRect.top + 34 - sectionRect.top);
    launchBurst(x, y, 1);
    window.setTimeout(() => launchBurst(Math.max(35, x - 105), Math.max(130, y - 54), .72), 130);
    window.setTimeout(() => launchBurst(Math.min(sectionRect.width - 40, x + 105), Math.max(135, y - 24), .8), 280);
    playFirework();
    $('#celebration-caption-copy').textContent = copy.celebration.fireworks;
  });

  function setDiyas(count) {
    litDiyas = count;
    $$('[data-diya]').forEach((diya, index) => diya.classList.toggle('is-lit', index < count));
    $('#celebration').classList.toggle('is-bright', count > 0);
    const button = $('#diya-trigger');
    if (count === 0) button.querySelector('span').textContent = 'Light the diyas';
    else if (count < 3) button.querySelector('span').textContent = 'Light the next diya';
    else button.querySelector('span').textContent = 'Dim the diyas';
    updateLetterUnlock();
  }
  $('#diya-trigger').addEventListener('click', () => {
    playClick();
    if (litDiyas === 3) {
      setDiyas(0);
      $('#celebration-caption-copy').textContent = copy.celebration.defaultCaption;
      return;
    }
    setDiyas(litDiyas + 1);
    playDiya();
    $('#celebration-caption-copy').textContent = litDiyas === 3
      ? copy.celebration.allDiyas
      : copy.celebration.diya;
  });

  function updateLetterUnlock() {
    if (letterUnlocked || eatenCount < copy.hiddenLetter.unlockAfterSweets || litDiyas < copy.hiddenLetter.unlockAfterDiyas) return;
    letterUnlocked = true;
    const unlock = $('#letter-unlock');
    unlock.hidden = false;
    window.requestAnimationFrame(() => unlock.classList.add('is-unlocked'));
  }

  const personalLetterDialog = $('#love-letter');
  $('#open-personal-letter').addEventListener('click', () => {
    playClick();
    if (typeof personalLetterDialog.showModal === 'function') personalLetterDialog.showModal();
    else personalLetterDialog.setAttribute('open', '');
  });
  $('#close-personal-letter').addEventListener('click', () => {
    playClick();
    if (typeof personalLetterDialog.close === 'function') personalLetterDialog.close();
    else personalLetterDialog.removeAttribute('open');
  });
  personalLetterDialog.addEventListener('click', (event) => {
    if (event.target !== personalLetterDialog) return;
    if (typeof personalLetterDialog.close === 'function') personalLetterDialog.close();
    else personalLetterDialog.removeAttribute('open');
  });

  function resetCelebration() {
    setSparkler(false);
    setDiyas(0);
    $('#firework-layer').replaceChildren();
    $('#celebration-caption-copy').textContent = copy.celebration.defaultCaption;
    $$('.sweet-card').forEach((card) => {
      card.disabled = false;
      card.classList.remove('eaten');
      card.setAttribute('aria-label', `Eat a ${card.dataset.sweet}`);
    });
    eatenCount = 0;
    $('#sweet-count').textContent = '0';
    letterUnlocked = false;
    const unlock = $('#letter-unlock');
    unlock.hidden = true;
    unlock.classList.remove('is-unlocked');
    if (personalLetterDialog.open && typeof personalLetterDialog.close === 'function') personalLetterDialog.close();
    setMusic(false);
    chapters[0].classList.add('is-active');
  }
  $('#celebrate-again').addEventListener('click', () => {
    playClick();
    resetCelebration();
    scrollToTarget('#welcome');
  });

  // Reveal the closing note in a gentle line-by-line cadence as it enters view.
  const letter = $('#letter-body');
  const letterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('reveal-copy');
      observer.unobserve(entry.target);
    });
  }, { threshold: .25 });
  letterObserver.observe(letter);

  $('#reveal-last-note').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const note = $('#last-note-copy');
    if (!note.hidden) return;
    note.hidden = false;
    note.classList.add('is-revealed');
    button.setAttribute('aria-expanded', 'true');
  });

  // iOS/Safari can suspend audio after changing tabs. Resume only while the visitor has opted in.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && musicEnabled && audioContext?.state === 'suspended') audioContext.resume();
  });
})();
