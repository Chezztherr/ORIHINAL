const episodeCards = document.querySelectorAll('.episode-card');
const episodeRow = document.getElementById('episodeRow');
const playerModal = document.getElementById('playerModal');
const modalPanel = document.querySelector('.modal-panel');
const modalClose = document.getElementById('playerClose');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalVideo = document.getElementById('modalVideo');
const modalVideoSource = document.getElementById('modalVideoSource');
const modalPlayButton = document.getElementById('modalPlayButton');
const modalOpenVideoButton = document.getElementById('modalOpenVideoButton');
const videoContainer = document.querySelector('.video-container');
const modalPreview = document.getElementById('modalPreview');
const modalPreviewVideo = document.getElementById('modalPreviewVideo');
const modalPreviewImage = document.getElementById('modalPreviewImage');
const teaserVideo = document.getElementById('teaserVideo');
const teaserMuteToggle = document.getElementById('teaserMuteToggle');
const quizOverlay = document.getElementById('quizOverlay');
const quizFeedback = document.getElementById('quizFeedback');
let teaserUserMuted = false;
let teaserAutoMuted = false;
const quizImage = document.querySelector('.quiz-visual img');
const quizOptions = Array.from(document.querySelectorAll('.quiz-option'));
const retryOverlay = document.getElementById('retryOverlay');
const retryButton = document.getElementById('retryButton');
const vcPlayPause = document.getElementById('vcPlayPause');
const vcSeek = document.getElementById('vcSeek');
const vcVolume = document.getElementById('vcVolume');
const vcVolumeIcon = document.querySelector('.vc-volume-icon');
const vcCurrent = document.getElementById('vcCurrent');
const vcDuration = document.getElementById('vcDuration');
const videoControls = document.getElementById('videoControls');
const videoWrapper = document.querySelector('.video-wrapper');
const modalFullscreenButton = document.getElementById('modalFullscreenButton');
const DEFAULT_VIDEO_VOLUME = 1;
let episodeVolume = DEFAULT_VIDEO_VOLUME;
let previousVolume = DEFAULT_VIDEO_VOLUME;
let controlsHideTimer = null;
const controlsHideDelay = 1800;
let fullscreenButtonHideTimer = null;
const fullscreenButtonHideDelay = 3000;
let fullscreenButtonInteractionActive = false;
let teaserStartTimeout = null;
let vcVolumeWrapper = null;
let _vcVolumeDragging = false;

// Locked-episode popup elements
const lockedPopup = document.getElementById('lockedPopup');
const lockedPopupClose = document.getElementById('lockedPopupClose');

function showLockedPopupForCard(card) {
  if (!lockedPopup) return;
  lockedPopup.classList.remove('hidden');
  lockedPopup.classList.add('locked-popup--visible');
  lockedPopup.setAttribute('aria-hidden', 'false');

  if (lockedPopupClose) lockedPopupClose.focus();
}

function hideLockedPopup() {
  if (!lockedPopup) return;
  lockedPopup.classList.remove('locked-popup--visible');
  lockedPopup.classList.add('hidden');
  lockedPopup.setAttribute('aria-hidden', 'true');
}

if (lockedPopupClose) {
  lockedPopupClose.addEventListener('click', () => {
    hideLockedPopup();
  });
}

// Close when clicking outside the popup
document.addEventListener('click', event => {
  if (!lockedPopup || lockedPopup.classList.contains('hidden')) return;
  const inside = lockedPopup.contains(event.target);
  const clickedCard = event.target.closest && event.target.closest('.episode-card');
  if (!inside && !clickedCard) {
    hideLockedPopup();
  }
});

document.addEventListener('keydown', event => {
  if ((event.key === 'Escape' || event.key === 'Esc') && lockedPopup && !lockedPopup.classList.contains('hidden')) {
    hideLockedPopup();
  }
});

function resetTeaserPlayback() {
  clearTimeout(teaserStartTimeout);
  teaserStartTimeout = null;
}

function scheduleTeaserPlayback(delayMs = 5000) {
  if (!teaserVideo) return;
  resetTeaserPlayback();
  teaserVideo.classList.remove('is-visible');
  teaserStartTimeout = window.setTimeout(() => {
    teaserVideo.currentTime = 0;
    teaserVideo.play().catch(() => {});
  }, delayMs);
}

function updateTeaserMuteIcon() {
  if (!teaserMuteToggle || !teaserVideo) return;
  teaserMuteToggle.textContent = teaserVideo.muted ? '🔇' : '🔊';
  teaserMuteToggle.setAttribute('aria-label', teaserVideo.muted ? 'Unmute teaser sound' : 'Mute teaser sound');
}

function setTeaserMuted(value, isAuto = false) {
  if (!teaserVideo) return;
  if (isAuto) {
    teaserAutoMuted = value;
  } else {
    teaserUserMuted = value;
  }
  teaserVideo.muted = teaserAutoMuted || teaserUserMuted;
  updateTeaserMuteIcon();
}

function pauseTeaserPlayback() {
  if (!teaserVideo) return;
  teaserVideo.pause();
  teaserVideo.classList.remove('is-visible');
}

function muteTeaserForEpisode() {
  teaserAutoMuted = true;
  if (teaserVideo) {
    teaserVideo.muted = true;
    teaserVideo.pause();
    teaserVideo.classList.remove('is-visible');
  }
  updateTeaserMuteIcon();
}

function restoreTeaserAfterEpisode() {
  teaserAutoMuted = false;
  if (teaserVideo) {
    teaserVideo.muted = teaserUserMuted;
    teaserVideo.currentTime = 0;
    teaserVideo.classList.remove('is-visible');
  }
  updateTeaserMuteIcon();
  scheduleTeaserPlayback(3000);
}

if (teaserMuteToggle && teaserVideo) {
  teaserMuteToggle.addEventListener('click', () => {
    if (teaserAutoMuted) {
      teaserVideo.muted = true;
      updateTeaserMuteIcon();
      return;
    }

    teaserUserMuted = !teaserUserMuted;
    teaserAutoMuted = false;
    teaserVideo.muted = teaserUserMuted;
    updateTeaserMuteIcon();
  });
}

if (teaserVideo) {
  teaserVideo.addEventListener('play', () => {
    teaserVideo.classList.add('is-visible');
  });
  teaserVideo.addEventListener('ended', () => {
    teaserVideo.classList.remove('is-visible');
    scheduleTeaserPlayback(20000);
  });
  teaserVideo.muted = false;
  teaserUserMuted = false;
  teaserAutoMuted = false;
  updateTeaserMuteIcon();
}

scheduleTeaserPlayback();
window.addEventListener('beforeunload', resetTeaserPlayback);

const episodePlaylists = {
  episode1: {
    id: 'episode1',
    segmentKey: 'Episode1video1.mp4',
    segments: [
      { src: 'assets/videos/Episode1video1.mp4', quizStage: 'stage1' },
      { src: 'assets/videos/Episode1video2.mp4', quizStage: 'stage2' },
      { src: 'assets/videos/Episode1video3.mp4', quizStage: 'stage3' },
      { src: 'assets/videos/Episode1video4.mp4', quizStage: 'none' }
    ]
  },
  episode2: {
    id: 'episode2',
    segmentKey: 'Episode2video1.mp4',
    segments: [
      { src: 'assets/videos/Episode2video1.mp4', quizStage: 'episode2' },
      { src: 'assets/videos/Episode2video2.mp4', quizStage: 'none' }
    ]
  },
  episode3: {
    id: 'episode3',
    segmentKey: 'Episode3video1.mp4',
    segments: [
      { src: 'assets/videos/Episode3video1.mp4', quizStage: 'episode3' },
      { src: 'assets/videos/Episode3video2.mp4', quizStage: 'episode3b' },
      { src: 'assets/videos/Episode3video3.mp4', quizStage: 'none' }
    ]
  },
  episode4: {
    id: 'episode4',
    segmentKey: 'Episode4video1.mp4',
    segments: [
      { src: 'assets/videos/Episode4video1.mp4', quizStage: 'episode4' },
      { src: 'assets/videos/Episode4video2.mp4', quizStage: 'none' }
    ]
  },
  episode5: {
    id: 'episode5',
    segmentKey: 'Episode5video1.mp4',
    segments: [
      { src: 'assets/videos/Episode5video1.mp4', quizStage: 'episode5' },
      { src: 'assets/videos/Episode5video2.mp4', quizStage: 'none' }
    ]
  }
};

const playbackState = {
  containerId: null,
  segmentIndex: 0,
  segmentDurations: [],
  totalDuration: 0,
  pendingStartTime: null,
  resumeAfterSegmentLoad: false
};

const episodeProgressState = {
  episode1: { unlocked: true, completed: false, passedQuestions: new Set(), failed: false },
  episode2: { unlocked: true, completed: false, passedQuestions: new Set(), failed: false },
  episode3: { unlocked: true, completed: false, passedQuestions: new Set(), failed: false },
  episode4: { unlocked: true, completed: false, passedQuestions: new Set(), failed: false },
  episode5: { unlocked: true, completed: false, passedQuestions: new Set(), failed: false }
};

const episodeRequirements = {
  episode1: ['stage1', 'stage2', 'stage3'],
  episode2: ['episode2'],
  episode3: ['episode3', 'episode3b'],
  episode4: [],
  episode5: ['episode5']
};

let activeEpisodeKey = 'episode1';
let activeEpisodeTitle = '';
let activeEpisodeDescription = '';
let activeEpisodeBg = '';
let activeEpisodeVideoSrc = '';

const hiddenMetaVideo = document.createElement('video');
hiddenMetaVideo.preload = 'metadata';
hiddenMetaVideo.style.position = 'absolute';
hiddenMetaVideo.style.width = '0';
hiddenMetaVideo.style.height = '0';
hiddenMetaVideo.style.opacity = '0';
hiddenMetaVideo.style.pointerEvents = 'none';
document.body.appendChild(hiddenMetaVideo);

function getEpisodeKeyFromVideoSrc(videoSrc) {
  if (!videoSrc) return null;
  if (videoSrc.includes('Episode1video')) return 'episode1';
  if (videoSrc.includes('Episode2video')) return 'episode2';
  if (videoSrc.includes('Episode3video')) return 'episode3';
  if (videoSrc.includes('Episode4')) return 'episode4';
  if (videoSrc.includes('Episode5')) return 'episode5';
  return null;
}

function getNextEpisodeKey(episodeKey) {
  const episodeOrder = ['episode1', 'episode2', 'episode3', 'episode4', 'episode5'];
  const currentIndex = episodeOrder.indexOf(episodeKey);
  return currentIndex >= 0 && currentIndex < episodeOrder.length - 1 ? episodeOrder[currentIndex + 1] : null;
}

function getRequiredQuestions(episodeKey) {
  return episodeRequirements[episodeKey] || [];
}

function isEpisodeUnlocked(episodeKey) {
  return Boolean(episodeProgressState[episodeKey]?.unlocked);
}

function getEpisodeProgress(episodeKey) {
  return episodeProgressState[episodeKey] || null;
}

function isEpisodeQuestionsComplete(episodeKey) {
  const progress = getEpisodeProgress(episodeKey);
  if (!progress) return true;
  if (progress.failed) return false;

  const requiredQuestions = getRequiredQuestions(episodeKey);
  return requiredQuestions.length === 0 || requiredQuestions.every(stage => progress.passedQuestions.has(stage));
}

function markEpisodeQuestionResult(episodeKey, stage, isCorrect) {
  const progress = getEpisodeProgress(episodeKey);
  if (!progress || !stage) return;

  if (!isCorrect) {
    progress.failed = true;
    return;
  }

  progress.passedQuestions.add(stage);
}

function resetEpisodeAttempt(episodeKey) {
  const progress = getEpisodeProgress(episodeKey);
  if (!progress) return;
  progress.passedQuestions.clear();
  progress.failed = false;
  progress.completed = false;
}

function showRetryOverlay(message = 'You didn’t pass the required score. Please try again.') {
  if (!retryOverlay) return;
  retryOverlay.classList.remove('hidden');
  const msg = retryOverlay.querySelector('.retry-message');
  if (msg) msg.textContent = message;
  if (modalVideo && !modalVideo.paused) {
    modalVideo.pause();
  }
  quizOverlay.classList.add('hidden');
}

function hideRetryOverlay() {
  if (!retryOverlay) return;
  retryOverlay.classList.add('hidden');
}

function retryCurrentEpisode() {
  hideRetryOverlay();
  resetEpisodeAttempt(activeEpisodeKey);
  if (activeEpisodeKey && activeEpisodeVideoSrc) {
    openPlayer(activeEpisodeTitle, activeEpisodeDescription, activeEpisodeVideoSrc, activeEpisodeBg, activeEpisodeKey, { allowLocked: true });
  }
}

function updateEpisodeCardStates() {
  episodeCards.forEach(card => {
    const episodeKey = card.dataset.episode;
    const unlocked = isEpisodeUnlocked(episodeKey);
    card.classList.toggle('is-locked', !unlocked);
    card.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
    card.style.cursor = unlocked ? 'pointer' : 'not-allowed';
  });
}

function resetQuizState() {
  quizOverlay.classList.add('hidden');
  quizOverlay.classList.remove('quiz-overlay--fullscreen');
  quizFeedback.textContent = '';
  quizFeedback.style.display = 'none';

  quizOptions.forEach(button => {
    button.disabled = false;
    button.classList.remove('is-correct', 'is-wrong');
    button.classList.add('is-hidden');
  });
}

function setQuizOption(button, label, text, answer, visible = true) {
  if (!button) return;
  button.dataset.answer = answer || '';

  if (label) {
    button.innerHTML = `<span class="quiz-option-label">${label}</span><span class="quiz-option-text">${text}</span>`;
  } else {
    button.textContent = text;
  }

  if (visible) {
    button.classList.remove('is-hidden');
  } else {
    button.classList.add('is-hidden');
  }
}

function setQuizStage(stage) {
  resetQuizState();

  if (stage === 'stage2') {
    quizImage.src = 'assets/images/Episode1QnA2.png';
    quizImage.alt = 'Episode 1 second quiz prompt';

    setQuizOption(quizOptions[0], 'A.', 'Republic Act 10175', '10175');
    setQuizOption(quizOptions[1], 'B.', 'Republic Act 8293', '8293');
    setQuizOption(quizOptions[2], 'C.', 'Republic Act 9003', '9003');
    return;
  }

  if (stage === 'stage3') {
    quizImage.src = 'assets/images/Episode1QnA3.png';
    quizImage.alt = 'Episode 1 third quiz prompt';

    setQuizOption(quizOptions[0], 'A.', 'Warning lamang', 'warning');
    setQuizOption(quizOptions[1], 'B.', 'Multa', 'multa');
    setQuizOption(quizOptions[2], 'C.', 'Multa at pagkakakulong', 'penalty');
    return;
  }

  if (stage === 'episode2') {
    quizImage.src = 'assets/images/Episode2QnA1.png';
    quizImage.alt = 'Episode 2 quiz prompt';

    setQuizOption(quizOptions[0], 'A.', 'OO', 'oo');
    setQuizOption(quizOptions[1], 'B.', 'HINDI', 'hindi');
    setQuizOption(quizOptions[2], null, '', '', false);
    return;
  }

  if (stage === 'episode3') {
    quizImage.src = 'assets/images/Episode3QnA1.png';
    quizImage.alt = 'Episode 3 first quiz prompt';

    setQuizOption(quizOptions[0], null, 'MYTH', 'myth');
    setQuizOption(quizOptions[1], null, 'FACT', 'fact');
    setQuizOption(quizOptions[2], null, '', '', false);
    return;
  }

  if (stage === 'episode3b') {
    quizImage.src = 'assets/images/Episode3QnA2.png';
    quizImage.alt = 'Episode 3 second quiz prompt';

    setQuizOption(quizOptions[0], null, 'MYTH', 'myth');
    setQuizOption(quizOptions[1], null, 'FACT', 'fact');
    setQuizOption(quizOptions[2], null, '', '', false);
    return;
  }

  if (stage === 'episode4') {
    quizImage.src = 'assets/images/Episode4QnA1.png';
    quizImage.alt = 'Episode 4 quiz prompt';

    setQuizOption(quizOptions[0], null, 'A. Legal ito dahil available naman ang kanta sa internet.', 'A');
    setQuizOption(quizOptions[1], null, 'B. Legal ito basta hindi kumikita ang radio station sa pagpapatugtog ng kanta.', 'B');
    setQuizOption(quizOptions[2], null, 'C. Maaaring maituring itong copyright infringement dahil gumagamit sila ng copyrighted music nang walang pahintulot o lisensya.', 'C');
    return;
  }

  if (stage === 'episode5') {
    quizImage.src = 'assets/images/Episode5QnA1.png';
    quizImage.alt = 'Episode 5 quiz prompt';

    setQuizOption(quizOptions[0], null, 'A. Legal ito dahil in-edit mo naman ang video.', 'A');
    setQuizOption(quizOptions[1], null, 'B. Legal ito basta lagyan mo ng "No Copyright Infringement Intended" sa caption.', 'B');
    setQuizOption(quizOptions[2], null, 'C. Maaaring copyright infringement ito dahil hindi iyo ang content at wala kang pahintulot mula sa may-ari.', 'C');
    return;
  }

  quizImage.src = 'assets/images/Episode1QnA1.png';
  quizImage.alt = 'Episode 1 quiz prompt';

  setQuizOption(quizOptions[0], 'A.', 'Legal', 'legal');
  setQuizOption(quizOptions[1], 'B.', 'Ilegal', 'illegal');
  setQuizOption(quizOptions[2], null, '', '', false);
}

function syncQuizOverlayFullscreen() {
  if (quizOverlay.classList.contains('hidden')) {
    return;
  }

  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
  // Keep overlay visible when the fullscreen element is either the video or the wrapper
  const shouldBeFixed = Boolean(
    fullscreenElement && (fullscreenElement === modalVideo || fullscreenElement === modalVideo.parentElement || fullscreenElement === videoWrapper)
  );
  quizOverlay.classList.toggle('quiz-overlay--fullscreen', shouldBeFixed);
}

function showQuizOverlay(stage = modalVideo.dataset.quizStage || 'stage1') {
  if (modalVideo.dataset.quizEnabled === 'true') {
    setQuizStage(stage);
    quizOverlay.classList.remove('hidden');
    syncQuizOverlayFullscreen();
  }
}

function resetControlsHideTimer() {
  if (!videoWrapper) return;
  // always show controls while there is activity
  videoWrapper.classList.remove('hide-controls');
  clearTimeout(controlsHideTimer);
  // only schedule hiding when the video is actually playing
  if (modalVideo && (modalVideo.paused || modalVideo.ended)) return;
  controlsHideTimer = window.setTimeout(() => {
    // hide controls after inactivity (applies both in fullscreen and modal)
    videoWrapper.classList.add('hide-controls');
  }, controlsHideDelay);
}

function openPlayer(title, description, videoSrc, bgSrc, episodeKey = null, options = {}) {
  const resolvedEpisodeKey = episodeKey || getEpisodeKeyFromVideoSrc(videoSrc);
  if (resolvedEpisodeKey && !options.allowLocked && !isEpisodeUnlocked(resolvedEpisodeKey)) {
    return false;
  }

  const progress = getEpisodeProgress(resolvedEpisodeKey);
  if (progress && (progress.completed || progress.failed || progress.passedQuestions.size > 0)) {
    resetEpisodeAttempt(resolvedEpisodeKey);
  }

  activeEpisodeKey = resolvedEpisodeKey || activeEpisodeKey;
  activeEpisodeTitle = title;
  activeEpisodeDescription = description;
  activeEpisodeBg = bgSrc;
  activeEpisodeVideoSrc = videoSrc;
  hideRetryOverlay();
  muteTeaserForEpisode();
  modalTitle.textContent = title;
  modalDescription.textContent = (resolvedEpisodeKey === 'episode4' || resolvedEpisodeKey === 'episode5')
    ? `${description}\n\nTo be continued...`
    : description;
  resetQuizState();

  modalPanel.style.backgroundImage = 'none';
  // Hide the preview image element so no broken image icon appears;
  // we only show the video teaser instead.
  if (modalPreviewImage) {
    modalPreviewImage.removeAttribute('src');
    modalPreviewImage.style.display = 'none';
    modalPreviewImage.alt = title;
  }

  modalPreview.classList.remove('hidden');
  videoContainer.classList.add('hidden');
  modalOpenVideoButton.classList.remove('hidden');
  modalOpenVideoButton.textContent = `PLAY ${title.split(':')[0].trim()}`;
  modalPlayButton.classList.add('hidden');

  if (videoSrc) {
    const playlist = getPlaylistByStartVideo(videoSrc);

    if (modalPreviewVideo) {
      modalPreviewVideo.pause();
      modalPreviewVideo.removeAttribute('src');
      modalPreviewVideo.load();
      modalPreviewVideo.style.display = 'none';
    }

    if (modalPreviewImage) {
      modalPreviewImage.src = bgSrc || '';
      modalPreviewImage.alt = title;
      modalPreviewImage.style.display = 'block';
    }

    if (playlist) {
      modalVideo.controls = false;
      modalVideo.setAttribute('playsinline', '');
      enterContainerMode(playlist.id);
    } else {
      modalVideoSource.src = videoSrc;
      const isEpisode1 = videoSrc.includes('Episode1video1.mp4');
      const isEpisode2 = videoSrc.includes('Episode2video1.mp4');
      const isEpisode3 = videoSrc.includes('Episode3video1.mp4');
      const isEpisode4 = videoSrc.includes('Episode4video1.mp4');
      modalVideo.dataset.quizEnabled = isEpisode1 || isEpisode2 || isEpisode3 || isEpisode4 ? 'true' : 'false';
      modalVideo.dataset.quizStage = isEpisode1 ? 'stage1' : isEpisode2 ? 'episode2' : isEpisode3 ? 'episode3' : isEpisode4 ? 'episode4' : 'none';
      modalVideo.load();
      modalVideo.controls = false;
      modalVideo.setAttribute('playsinline', '');
      modalVideo.pause();
      updateSeekInfo();
    }
  } else {
    modalVideoSource.src = '';
    modalVideo.dataset.quizEnabled = 'false';
    modalVideo.load();
    if (modalPreviewImage) {
      modalPreviewImage.style.display = 'block';
    }
    modalPreview.classList.remove('hidden');
    modalOpenVideoButton.classList.add('hidden');
    updateSeekInfo();
  }

  playerModal.classList.remove('hidden');
  document.body.classList.add('stop-scroll');
  resetControlsHideTimer();
}

function playVideo() {
  if (modalPreviewVideo) {
    modalPreviewVideo.pause();
  }
  modalPreview.classList.add('hidden');
  videoContainer.classList.remove('hidden');
  scheduleFullscreenButtonHide();
  modalVideo.volume = episodeVolume;
  if (vcVolume) {
    vcVolume.value = String(episodeVolume);
  }
  updateEpisodeVolumeIcon();
  modalVideo.play().catch(() => {});
  modalPlayButton.classList.add('hidden');
  modalOpenVideoButton.classList.add('hidden');
  muteTeaserForEpisode();
}

function pauseVideo() {
  modalVideo.pause();
  modalPlayButton.classList.remove('hidden');
}

function handleEpisodeCompletion() {
  const progress = getEpisodeProgress(activeEpisodeKey);
  if (!progress || progress.completed) {
    return;
  }

  if (progress.failed || !isEpisodeQuestionsComplete(activeEpisodeKey)) {
    exitFullscreenMode();
    showRetryOverlay();
    return;
  }

  progress.completed = true;

  const nextEpisodeKey = getNextEpisodeKey(activeEpisodeKey);
  if (!nextEpisodeKey) {
    return;
  }

  const nextProgress = getEpisodeProgress(nextEpisodeKey);
  if (nextProgress) {
    nextProgress.unlocked = true;
    updateEpisodeCardStates();
    exitFullscreenMode();
    openPlayer(
      document.querySelector(`[data-episode="${nextEpisodeKey}"]`)?.dataset.title || 'Next Episode',
      document.querySelector(`[data-episode="${nextEpisodeKey}"]`)?.dataset.description || 'Continue the journey.',
      document.querySelector(`[data-episode="${nextEpisodeKey}"]`)?.dataset.video || '',
      document.querySelector(`[data-episode="${nextEpisodeKey}"]`)?.dataset.bg || '',
      nextEpisodeKey,
      { allowLocked: true }
    );
  }
}

function togglePlayPause() {
  if (modalVideo.paused || modalVideo.ended) {
    modalVideo.play();
  } else {
    modalVideo.pause();
  }
}

function formatTime(s) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function getPlaylistByStartVideo(videoSrc) {
  return Object.values(episodePlaylists).find(playlist => playlist.segments[0].src === videoSrc);
}

function getPlaylistByVideoSrc(videoSrc) {
  return Object.values(episodePlaylists).find(playlist => playlist.segments.some(segment => segment.src === videoSrc));
}

function isContainerActive() {
  return playbackState.containerId !== null;
}

function getContainerElapsedBeforeSegment(index) {
  return playbackState.segmentDurations.slice(0, index).reduce((sum, value) => sum + value, 0);
}

function getContainerPositionFromTime(time) {
  let elapsed = 0;
  for (let index = 0; index < playbackState.segmentDurations.length; index++) {
    const duration = playbackState.segmentDurations[index] || 0;
    if (time <= elapsed + duration || index === playbackState.segmentDurations.length - 1) {
      return { segmentIndex: index, localTime: Math.min(time - elapsed, duration) };
    }
    elapsed += duration;
  }
  return { segmentIndex: playbackState.segmentDurations.length - 1, localTime: 0 };
}

function updateSeekInfo() {
  if (isContainerActive() && playbackState.totalDuration > 0) {
    vcSeek.max = playbackState.totalDuration;
    vcDuration.textContent = formatTime(playbackState.totalDuration);
    if (vcSeek.value > playbackState.totalDuration) {
      vcSeek.value = playbackState.totalDuration;
    }
    return;
  }
  const dur = modalVideo.duration || 0;
  vcSeek.max = dur;
  vcDuration.textContent = formatTime(dur);
}

function updateEpisodeVolume(value) {
  if (!modalVideo) return;
  const volume = Math.min(1, Math.max(0, value));
  if (volume > 0) {
    previousVolume = volume;
  }
  episodeVolume = volume;
  modalVideo.volume = volume;
  modalVideo.muted = volume === 0;
  if (vcVolume) {
    vcVolume.value = String(volume);
    vcVolume.style.setProperty('--volume-level', String(volume));
  }
  updateEpisodeVolumeIcon();
}

function updateEpisodeVolumeIcon() {
  if (!vcVolumeIcon || !modalVideo) return;
  const isMuted = modalVideo.muted || episodeVolume === 0;
  vcVolumeIcon.textContent = isMuted ? '🔇' : '🔊';
  vcVolumeIcon.setAttribute('aria-label', isMuted ? 'Unmute episode audio' : 'Mute episode audio');
}

function toggleEpisodeMute() {
  if (!modalVideo) return;
  const isMuting = !modalVideo.muted;
  if (isMuting) {
    previousVolume = episodeVolume > 0 ? episodeVolume : previousVolume || DEFAULT_VIDEO_VOLUME;
    updateEpisodeVolume(0);
    modalVideo.muted = true;
  } else {
    const restoreVolume = previousVolume || DEFAULT_VIDEO_VOLUME;
    updateEpisodeVolume(restoreVolume);
    modalVideo.muted = false;
  }
}

function loadMetadataDuration(src) {
  return new Promise(resolve => {
    const onLoaded = () => {
      cleanup();
      resolve(hiddenMetaVideo.duration || 0);
    };
    const onError = () => {
      cleanup();
      resolve(0);
    };
    const cleanup = () => {
      hiddenMetaVideo.removeEventListener('loadedmetadata', onLoaded);
      hiddenMetaVideo.removeEventListener('error', onError);
    };
    hiddenMetaVideo.src = src;
    hiddenMetaVideo.load();
    hiddenMetaVideo.addEventListener('loadedmetadata', onLoaded);
    hiddenMetaVideo.addEventListener('error', onError);
  });
}

async function preloadContainerDurations(containerId) {
  const playlist = episodePlaylists[containerId];
  if (!playlist) return;
  const durations = [];
  for (const segment of playlist.segments) {
    const duration = await loadMetadataDuration(segment.src);
    durations.push(duration);
  }
  playbackState.segmentDurations = durations;
  playbackState.totalDuration = durations.reduce((sum, value) => sum + value, 0);
  updateSeekInfo();
}

function setContainerSegment(index, startTime = 0, playAfterLoad = false) {
  const playlist = episodePlaylists[playbackState.containerId];
  if (!playlist || !playlist.segments[index]) return;
  const segment = playlist.segments[index];

  playbackState.segmentIndex = index;
  playbackState.pendingStartTime = startTime;
  playbackState.resumeAfterSegmentLoad = playAfterLoad;

  modalVideoSource.src = segment.src;
  modalVideo.dataset.container = playlist.id;
  modalVideo.dataset.segmentIndex = index;
  modalVideo.dataset.quizEnabled = segment.quizStage === 'none' ? 'false' : 'true';
  modalVideo.dataset.quizStage = segment.quizStage;
  modalVideo.load();
  modalVideo.controls = false;
  modalVideo.setAttribute('playsinline', '');
  modalPlayButton.classList.add('hidden');
}

function enterContainerMode(containerId) {
  playbackState.containerId = containerId;
  playbackState.segmentIndex = 0;
  playbackState.segmentDurations = [];
  playbackState.totalDuration = 0;
  playbackState.pendingStartTime = 0;
  playbackState.resumeAfterSegmentLoad = false;
  preloadContainerDurations(containerId);
  setContainerSegment(0, 0, false);
}

function exitContainerMode() {
  playbackState.containerId = null;
  playbackState.segmentIndex = 0;
  playbackState.segmentDurations = [];
  playbackState.totalDuration = 0;
  playbackState.pendingStartTime = null;
  playbackState.resumeAfterSegmentLoad = false;
  modalVideo.removeAttribute('data-container');
  modalVideo.removeAttribute('data-segment-index');
}

function getNextContainerSegmentIndex() {
  return playbackState.segmentIndex + 1;
}

function loadNextContainerSegment(playAfterLoad = true) {
  const nextIndex = getNextContainerSegmentIndex();
  const playlist = episodePlaylists[playbackState.containerId];
  if (!playlist || nextIndex >= playlist.segments.length) return;
  setContainerSegment(nextIndex, 0, playAfterLoad);
}

function closePlayer() {
  clearFullscreenButtonHideTimer();
  fullscreenButtonInteractionActive = false;
  modalFullscreenButton.classList.remove('is-idle');
  modalFullscreenButton.setAttribute('aria-hidden', 'false');
  playerModal.classList.add('hidden');
  document.body.classList.remove('stop-scroll');
  resetQuizState();
  modalVideo.pause();
  modalVideo.currentTime = 0;
  modalVideoSource.src = '';
  modalVideo.dataset.quizEnabled = 'false';
  modalVideo.load();
  restoreTeaserAfterEpisode();
  if (modalPreviewVideo) {
    modalPreviewVideo.pause();
    modalPreviewVideo.currentTime = 0;
    modalPreviewVideo.src = '';
  }
  if (modalPreviewImage) {
    modalPreviewImage.removeAttribute('src');
    modalPreviewImage.style.display = 'none';
  }
  modalPlayButton.classList.add('hidden');
  modalOpenVideoButton.classList.add('hidden');
  modalPreview.classList.remove('hidden');
  videoContainer.classList.add('hidden');
  modalPanel.style.backgroundImage = 'none';
  exitContainerMode();
}

// Seek handling
vcSeek.addEventListener('input', () => {
  const value = parseFloat(vcSeek.value);
  if (isNaN(value) || !isFinite(value)) return;

  if (isContainerActive() && playbackState.totalDuration > 0) {
    resetQuizState();
    const position = getContainerPositionFromTime(Math.min(value, playbackState.totalDuration));
    if (position.segmentIndex === playbackState.segmentIndex) {
      modalVideo.currentTime = position.localTime;
    } else {
      const wantsPlay = !modalVideo.paused && !modalVideo.ended;
      setContainerSegment(position.segmentIndex, position.localTime, wantsPlay);
    }
    return;
  }

  if (isFinite(modalVideo.duration)) {
    modalVideo.currentTime = value;
  }
});

vcVolumeWrapper = document.querySelector('.vc-volume');
if (vcVolume) {
  vcVolume.addEventListener('input', () => {
    const volume = parseFloat(vcVolume.value);
    if (!isNaN(volume) && isFinite(volume)) {
      updateEpisodeVolume(volume);
    }
  });
}

if (vcVolumeIcon) {
  vcVolumeIcon.addEventListener('click', event => {
    event.stopPropagation();
    toggleEpisodeMute();
  });
}

// Play/pause button
vcPlayPause.addEventListener('click', togglePlayPause);

// Sync UI with video events
modalVideo.addEventListener('loadedmetadata', () => {
  updateSeekInfo();
  if (isContainerActive()) {
    const pendingTime = playbackState.pendingStartTime;
    if (pendingTime !== null && pendingTime !== undefined) {
      modalVideo.currentTime = Math.min(pendingTime, modalVideo.duration || 0);
      playbackState.pendingStartTime = 0;
    }
    if (playbackState.resumeAfterSegmentLoad) {
      playbackState.resumeAfterSegmentLoad = false;
      modalVideo.play().catch(() => {});
    }
  }
});

modalVideo.addEventListener('timeupdate', () => {
  const currentLocal = modalVideo.currentTime || 0;
  const currentGlobal = isContainerActive()
    ? getContainerElapsedBeforeSegment(playbackState.segmentIndex) + currentLocal
    : currentLocal;
  vcSeek.value = currentGlobal;
  vcCurrent.textContent = formatTime(currentGlobal);
  // update play/pause icon
  vcPlayPause.textContent = modalVideo.paused ? '▶' : '▌▌';
});

modalVideo.addEventListener('play', () => {
  modalPlayButton.classList.add('hidden');
  vcPlayPause.textContent = '▌▌';
});

modalVideo.addEventListener('pause', () => {
  modalPlayButton.classList.remove('hidden');
  vcPlayPause.textContent = '▶';
});

// Clicking the overlay play button should toggle play too
modalPlayButton.addEventListener('click', () => {
  togglePlayPause();
});

function playContinuationVideo(videoFile = 'assets/videos/Episode1video2.mp4', nextQuizStage = 'none') {
  modalVideoSource.src = videoFile;
  modalVideo.dataset.quizEnabled = nextQuizStage === 'none' ? 'false' : 'true';
  modalVideo.dataset.quizStage = nextQuizStage;
  modalVideo.load();
  modalVideo.currentTime = 0;
  modalPlayButton.classList.add('hidden');
  modalVideo.play().catch(() => {});
}

function handleQuizAnswer(event) {
  const selectedButton = event.currentTarget;
  const selectedAnswer = selectedButton.dataset.answer;

  quizOptions.forEach(button => {
    button.disabled = true;
  });

  let isCorrectAnswer = false;
  if (modalVideo.dataset.quizStage === 'stage2') {
    if (selectedAnswer === '8293') {
      selectedButton.classList.add('is-correct');
      isCorrectAnswer = true;
    } else {
      selectedButton.classList.add('is-wrong');
      const correctButton = quizOptions.find(button => button.dataset.answer === '8293');
      if (correctButton) {
        correctButton.classList.add('is-correct');
      }
    }
  } else if (modalVideo.dataset.quizStage === 'stage3') {
    if (selectedAnswer === 'penalty') {
      selectedButton.classList.add('is-correct');
      isCorrectAnswer = true;
    } else {
      selectedButton.classList.add('is-wrong');
      const correctButton = quizOptions.find(button => button.dataset.answer === 'penalty');
      if (correctButton) {
        correctButton.classList.add('is-correct');
      }
    }
  } else if (modalVideo.dataset.quizStage === 'episode3') {
    if (selectedAnswer === 'myth') {
      selectedButton.classList.add('is-correct');
      isCorrectAnswer = true;
    } else {
      selectedButton.classList.add('is-wrong');
      const correctButton = quizOptions.find(button => button.dataset.answer === 'myth');
      if (correctButton) {
        correctButton.classList.add('is-correct');
      }
    }
  } else if (modalVideo.dataset.quizStage === 'episode3b') {
    if (selectedAnswer === 'myth') {
      selectedButton.classList.add('is-correct');
      isCorrectAnswer = true;
    } else {
      selectedButton.classList.add('is-wrong');
      const correctButton = quizOptions.find(button => button.dataset.answer === 'myth');
      if (correctButton) {
        correctButton.classList.add('is-correct');
      }
    }
  } else if (modalVideo.dataset.quizStage === 'episode2') {
    if (selectedAnswer === 'hindi') {
      selectedButton.classList.add('is-correct');
      isCorrectAnswer = true;
    } else {
      selectedButton.classList.add('is-wrong');
      const correctButton = quizOptions.find(button => button.dataset.answer === 'hindi');
      if (correctButton) {
        correctButton.classList.add('is-correct');
      }
    }
  } else if (modalVideo.dataset.quizStage === 'episode4') {
    if (selectedAnswer === 'C') {
      selectedButton.classList.add('is-correct');
      isCorrectAnswer = true;
    } else {
      selectedButton.classList.add('is-wrong');
      const correctButton = quizOptions.find(button => button.dataset.answer === 'C');
      if (correctButton) {
        correctButton.classList.add('is-correct');
      }
    }
  } else if (modalVideo.dataset.quizStage === 'episode5') {
    if (selectedAnswer === 'C') {
      selectedButton.classList.add('is-correct');
      isCorrectAnswer = true;
    } else {
      selectedButton.classList.add('is-wrong');
      const correctButton = quizOptions.find(button => button.dataset.answer === 'C');
      if (correctButton) {
        correctButton.classList.add('is-correct');
      }
    }
  } else if (selectedAnswer === 'illegal') {
    selectedButton.classList.add('is-correct');
    isCorrectAnswer = true;
  } else {
    selectedButton.classList.add('is-wrong');
    const correctButton = quizOptions.find(button => button.dataset.answer === 'illegal');
    if (correctButton) {
      correctButton.classList.add('is-correct');
    }
  }

  markEpisodeQuestionResult(activeEpisodeKey, modalVideo.dataset.quizStage || '', isCorrectAnswer);

  window.setTimeout(() => {
    quizOverlay.classList.add('hidden');
    quizOverlay.classList.remove('quiz-overlay--fullscreen');

    if (isContainerActive()) {
      const nextIndex = getNextContainerSegmentIndex();
      const playlist = episodePlaylists[playbackState.containerId];
      if (playlist && nextIndex < playlist.segments.length) {
        loadNextContainerSegment(true);
      } else {
        handleEpisodeCompletion();
      }
      return;
    }

    if (modalVideo.dataset.quizStage === 'episode3' || modalVideo.dataset.quizStage === 'episode3b') {
      loadNextContainerSegment(true);
      return;
    }

    if (modalVideo.dataset.quizStage === 'episode2') {
      playContinuationVideo('assets/videos/Episode2video2.mp4', 'none');
      return;
    }

    if (modalVideo.dataset.quizStage === 'episode4') {
      if (activeEpisodeKey === 'episode4') {
        playContinuationVideo('assets/videos/Episode4video2.mp4', 'none');
        return;
      }
      handleEpisodeCompletion();
      return;
    }

    if (modalVideo.dataset.quizStage === 'stage1') {
      playContinuationVideo('assets/videos/Episode1video2.mp4', 'stage2');
    } else if (modalVideo.dataset.quizStage === 'stage2') {
      playContinuationVideo('assets/videos/Episode1video3.mp4', 'stage3');
    } else {
      playContinuationVideo('assets/videos/Episode1video4.mp4', 'none');
    }
  }, 900);
}

updateEpisodeCardStates();

episodeCards.forEach(card => {
  card.addEventListener('click', () => {
    const title = card.dataset.title;
    const description = card.dataset.description;
    const videoSrc = card.dataset.video;
    const bgSrc = card.dataset.bg;
    const episodeKey = card.dataset.episode;
    const opened = openPlayer(title, description, videoSrc, bgSrc, episodeKey);
    if (opened === false) {
      // show locked-episode popup anchored to the clicked card
      showLockedPopupForCard(card);
      return;
    }
  });
});

const mobilePlayButton = document.getElementById('mobilePlayButton');
const mobileMoreButton = document.getElementById('mobileMoreButton');
const mobileViewAll = document.getElementById('mobileViewAll');

if (mobilePlayButton && episodeCards.length > 0) {
  mobilePlayButton.addEventListener('click', () => episodeCards[0].click());
}

if (mobileMoreButton && episodeRow) {
  mobileMoreButton.addEventListener('click', () => {
    episodeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

if (mobileViewAll && episodeRow) {
  mobileViewAll.addEventListener('click', () => {
    const expanded = episodeRow.classList.toggle('is-expanded');
    mobileViewAll.setAttribute('aria-expanded', String(expanded));
    mobileViewAll.firstChild.textContent = expanded ? 'Show Less ' : 'View All ';
  });
}

if (episodeRow) {
  episodeRow.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      episodeRow.scrollBy({ left: event.deltaY, behavior: 'smooth' });
    }
  }, { passive: false });
}

modalPlayButton.addEventListener('click', playVideo);
modalOpenVideoButton.addEventListener('click', event => {
  event.stopPropagation();
  playVideo();
});
if (retryButton) {
  retryButton.addEventListener('click', retryCurrentEpisode);
}
if (modalClose) {
  modalClose.addEventListener('click', event => {
    event.stopPropagation();
    closePlayer();
  });
}
playerModal.addEventListener('click', event => {
  if (event.target === playerModal) {
    closePlayer();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' || event.key === 'Esc') {
    if (playerModal && !playerModal.classList.contains('hidden')) {
      closePlayer();
    }
  }
});

function pauseEpisodeAndRestoreTeaser() {
  if (!modalVideo.paused) {
    modalVideo.pause();
    restoreTeaserAfterEpisode();
  }
}

modalVideo.addEventListener('ended', () => {
  if (modalVideo.dataset.quizEnabled === 'true') {
    showQuizOverlay(modalVideo.dataset.quizStage || 'stage1');
    return;
  }

  if (isContainerActive()) {
    const nextIndex = getNextContainerSegmentIndex();
    const playlist = episodePlaylists[playbackState.containerId];
    if (playlist && nextIndex < playlist.segments.length) {
      loadNextContainerSegment(true);
      return;
    }
  }

  handleEpisodeCompletion();
});

modalVideo.addEventListener('play', () => {
  resetQuizState();
});

quizOptions.forEach(button => {
  button.addEventListener('click', handleQuizAnswer);
});

document.addEventListener('fullscreenchange', syncQuizOverlayFullscreen);
document.addEventListener('webkitfullscreenchange', syncQuizOverlayFullscreen);

// Ensure video controls remain hidden and video fills the fullscreen container
document.addEventListener('fullscreenchange', () => {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (fsEl && (fsEl === videoWrapper || fsEl === modalVideo || fsEl === modalVideo.parentElement)) {
    // make sure native controls are off and video uses contain fit
    modalVideo.controls = false;
    modalVideo.style.objectFit = 'contain';
  } else {
    modalVideo.style.objectFit = '';
  }
});

function updateFullscreenIcon() {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (!modalFullscreenButton) return;
  modalFullscreenButton.textContent = fsEl ? '⤡' : '⤢';
  modalFullscreenButton.setAttribute('aria-label', fsEl ? 'Exit fullscreen' : 'Enter fullscreen');
}

function toggleFullscreen() {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fsEl) {
    enterVideoFullscreen();
  } else {
    exitFullscreenMode();
  }
}

async function enterVideoFullscreen() {
  if (!videoWrapper) return;

  const requestFullscreen = videoWrapper.requestFullscreen || videoWrapper.webkitRequestFullscreen;
  if (!requestFullscreen) {
    console.error('Fullscreen is not supported by this browser.');
    return;
  }

  try {
    await requestFullscreen.call(videoWrapper);
  } catch (error) {
    console.error('Unable to enter fullscreen video mode.', error);
    return;
  }
}

function exitFullscreenMode() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

if (modalFullscreenButton) {
  modalFullscreenButton.addEventListener('click', toggleFullscreen);
  updateFullscreenIcon();
}

function isMobileVideoViewport() {
  return window.matchMedia(
    '(max-width: 680px), (max-height: 500px) and (min-width: 681px), (pointer: coarse)'
  ).matches;
}

function clearFullscreenButtonHideTimer() {
  clearTimeout(fullscreenButtonHideTimer);
  fullscreenButtonHideTimer = null;
}

function scheduleFullscreenButtonHide() {
  if (!modalFullscreenButton || !videoWrapper) return;

  clearFullscreenButtonHideTimer();
  modalFullscreenButton.classList.remove('is-idle');
  modalFullscreenButton.setAttribute('aria-hidden', 'false');

  if (
    !isMobileVideoViewport() ||
    playerModal.classList.contains('hidden') ||
    videoContainer.classList.contains('hidden')
  ) {
    return;
  }

  if (fullscreenButtonInteractionActive) return;

  fullscreenButtonHideTimer = window.setTimeout(() => {
    if (fullscreenButtonInteractionActive) {
      fullscreenButtonHideTimer = null;
      return;
    }

    if (videoWrapper.contains(document.activeElement)) {
      scheduleFullscreenButtonHide();
      return;
    }

    modalFullscreenButton.classList.add('is-idle');
    modalFullscreenButton.setAttribute('aria-hidden', 'true');
    fullscreenButtonHideTimer = null;
  }, fullscreenButtonHideDelay);
}

function beginFullscreenButtonInteraction() {
  fullscreenButtonInteractionActive = true;
  clearFullscreenButtonHideTimer();
  modalFullscreenButton.classList.remove('is-idle');
  modalFullscreenButton.setAttribute('aria-hidden', 'false');
}

function endFullscreenButtonInteraction() {
  fullscreenButtonInteractionActive = false;
  scheduleFullscreenButtonHide();
}

if (videoWrapper) {
  ['pointerdown', 'touchstart'].forEach(eventName => {
    videoWrapper.addEventListener(eventName, beginFullscreenButtonInteraction, { passive: eventName.startsWith('touch') });
  });

  ['pointermove', 'touchmove', 'click', 'keydown', 'input', 'focusin', 'focusout'].forEach(eventName => {
    videoWrapper.addEventListener(eventName, scheduleFullscreenButtonHide, { passive: eventName.startsWith('touch') });
  });
}

['pointerup', 'pointercancel', 'touchend', 'touchcancel'].forEach(eventName => {
  document.addEventListener(eventName, endFullscreenButtonInteraction, { passive: eventName.startsWith('touch') });
});

document.addEventListener('fullscreenchange', () => {
  updateFullscreenIcon();
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    resetControlsHideTimer();
  } else if (videoWrapper) {
    videoWrapper.classList.remove('hide-controls');
    clearTimeout(controlsHideTimer);
  }
});

document.addEventListener('webkitfullscreenchange', () => {
  updateFullscreenIcon();
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    resetControlsHideTimer();
  } else if (videoWrapper) {
    videoWrapper.classList.remove('hide-controls');
    clearTimeout(controlsHideTimer);
  }
});

if (videoWrapper) {
  videoWrapper.addEventListener('mousemove', resetControlsHideTimer);
  videoWrapper.addEventListener('mouseleave', () => {
    // when the pointer leaves the video area and the video is playing,
    // hide controls shortly after to avoid overlapping UI
    if (modalVideo && !modalVideo.paused && !modalVideo.ended) {
      clearTimeout(controlsHideTimer);
      controlsHideTimer = window.setTimeout(() => {
        videoWrapper.classList.add('hide-controls');
      }, 600);
    }
  });
}

if (modalVideo) {
  modalVideo.addEventListener('play', resetControlsHideTimer);
  modalVideo.addEventListener('pause', () => {
    if (videoWrapper) {
      videoWrapper.classList.remove('hide-controls');
      clearTimeout(controlsHideTimer);
    }
  });
}
