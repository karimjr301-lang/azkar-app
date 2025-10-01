document.addEventListener('DOMContentLoaded', () => {

    // --- التحقق من وجود بيانات الأذكار ---
    if (typeof morningPrayers === 'undefined' || typeof eveningPrayers === 'undefined' || !Array.isArray(morningPrayers) || !Array.isArray(eveningPrayers)) { console.error("FATAL: Prayer data variables not found."); return; }
    if (morningPrayers.length === 0 && eveningPrayers.length === 0) { console.warn("Prayer data arrays are empty."); }

    // --- عناصر DOM الرئيسية ---
    const homeContainer = document.getElementById('home');
    const prayerTemplateContainer = document.getElementById('prayer-template-container');
    const menuPage = document.getElementById('menu-page');
    const readingModePage = document.getElementById('reading-mode-page');
    const allPageContainers = document.querySelectorAll('.page-container');
    const templateAudio = document.getElementById('template-audio');
    const templateTitle = document.getElementById('template-title');
    const templateText = document.getElementById('template-text');
    const fadelCollapsible = document.getElementById('fadel-collapsible');
    const fadelToggle = document.getElementById('fadel-collapsible-toggle');
    const templateHomeButtonTop = document.getElementById('template-home-button-top');
    const menuToggleButton = document.getElementById('menu-toggle-button');
    const closeMenuButton = document.getElementById('close-menu-button');
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const readingModeToggleButton = document.getElementById('reading-mode-toggle-button');
    const readingModeTitle = document.getElementById('reading-mode-title');
    const readingModeContentArea = document.getElementById('reading-mode-content-area');
    const nextDhikrButton = document.getElementById('next-dhikr-button');
    const prevDhikrButton = document.getElementById('prev-dhikr-button');
    const readingScrollDownButton = document.getElementById('reading-scroll-down-button');
    const readingScrollUpButton = document.getElementById('reading-scroll-up-button');
    const readingIndexButton = document.getElementById('reading-index-button');
    const indexModalOverlay = document.getElementById('reading-index-modal-overlay');
    const closeIndexModalButton = document.getElementById('close-index-modal-button');
    const backToTopButton = document.getElementById('back-to-top-button');
    const changeTextColorButton = document.getElementById('change-text-color-button');
    const supportUsButton = document.getElementById('support-us-button');
    const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
    const serenityModeCheckbox = document.getElementById('serenity-mode-checkbox');
    const serenityVideoBg = document.getElementById('serenity-video-bg');
    const serenityControlsOverlay = document.getElementById('serenity-controls-overlay');
    const zenModeToggleButton = document.getElementById('zen-mode-toggle-button');
    const exitSerenityModeButton = document.getElementById('exit-serenity-mode-button');
    const toggleControlsButton = document.getElementById('toggle-controls-button');
    const controlsHandle = document.getElementById('controls-handle');
    const floatingPlayPauseButton = document.getElementById('floating-play-pause-button');
    
    // --- عناصر المشغل المخصص ---
    const customPlayPauseButton = document.getElementById('custom-play-pause-button');
    const playIcon = customPlayPauseButton?.querySelector('.icon-play');
    const pauseIcon = customPlayPauseButton?.querySelector('.icon-pause');
    const timelineSlider = document.getElementById('timeline-slider');
    const currentTimeDisplay = document.getElementById('current-time-display');
    const durationDisplay = document.getElementById('duration-display');
    const customMuteButton = document.getElementById('custom-mute-button');
    const volumeHighIcon = customMuteButton?.querySelector('.icon-volume-high');
    const volumeOffIcon = customMuteButton?.querySelector('.icon-volume-off');
    const volumeSlider = document.getElementById('volume-slider');

    // --- تعريف المتغيرات العامة في بداية الملف لتجنب خطأ Uncaught ReferenceError ---
    let isSequentialPlayActive = false;
    const SERENITY_VIDEOS = { morning: 'video/0001.mp4', evening: 'video/0001.mp4' };
    let touchStartY = 0, touchEndY = 0, touchStartX = 0, touchEndX = 0;
    const swipeThreshold = 50;
    let currentVisiblePageId = 'home', lastVisitedPageId = 'home';
    let isSwipeHandled = false, isAutoplayEnabled = false;
    const THEMES = ['original', 'xd1', 'xd2', 'xd3', 'xd4'];
    const STATIC_THEME_IMAGES = { xd1: 'images/XD1.jpg', xd2: 'images/XD2.jpg', xd3: 'images/XD3.jpg', xd4: 'images/XD4.jpg' };
    let currentTheme = 'original', isReadingModeActive = false, readingModeTheme = 'light';
    let currentPrayerData = null, manualCounterValue = 0, autoplayTimeoutId = null;
    let currentRepetitionTarget = 0, currentRepetitionCounter = 0;
    let currentRepetitionAudioSrc = '', initialAudioSrc = '';
    let isRepeatingAudio = false;
    const FONT_SIZE_STEP = 0.1, MIN_FONT_SIZE_MULTIPLIER = 0.7, MAX_FONT_SIZE_MULTIPLIER = 1.6;
    const FONT_SIZE_VARIABLES = ['--font-size-prayer-text', '--font-size-fadel-text', '--font-size-intro-text', '--font-size-reading-dhikr', '--font-size-reading-fadel', '--font-size-reading-intro'];
    let currentFontSizeMultiplier = 1, defaultFontSizes = {};
    const TEXT_COLOR_OPTIONS = ['default', '#FFFFE0', '#90EE90', '#ADD8E6', '#FFB6C1', '#FFD700', '#FFA07A'];
    let currentTextColorIndex = 0;
    let isSerenityModeActive = false, isZenModeActive = false;
    let isSeeking = false; // Flag to prevent timeupdate conflicts while user is dragging slider


    // =======================================================
    // ====      وظائف المشغل الصوتي المخصص (START)      ====
    // =======================================================
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function togglePlayPause() {
        if (templateAudio.paused || templateAudio.ended) {
            templateAudio.play().catch(e => console.error("Error playing audio:", e));
        } else {
            templateAudio.pause();
        }
    }
    
    function updatePlayPauseIcon() {
        const isPaused = templateAudio.paused;
        if (playIcon) playIcon.classList.toggle('hidden', !isPaused);
        if (pauseIcon) pauseIcon.classList.toggle('hidden', isPaused);
        
        const floatingPlayIcon = floatingPlayPauseButton?.querySelector('.icon-play-floating');
        const floatingPauseIcon = floatingPlayPauseButton?.querySelector('.icon-pause-floating');
        if (floatingPlayIcon) floatingPlayIcon.style.display = isPaused ? 'block' : 'none';
        if (floatingPauseIcon) floatingPauseIcon.style.display = isPaused ? 'none' : 'block';
    }
    
    function handleMetadataLoaded() {
        if (durationDisplay) durationDisplay.textContent = formatTime(templateAudio.duration);
        if (timelineSlider) timelineSlider.max = templateAudio.duration;
    }

    function handleTimeUpdate() {
        if (isSeeking) return; // Don't update if user is actively seeking
        if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(templateAudio.currentTime);
        if (timelineSlider) timelineSlider.value = templateAudio.currentTime;
    }

    function handleTimelineChange() {
        templateAudio.currentTime = timelineSlider.value;
    }
    
    function toggleMute() {
        templateAudio.muted = !templateAudio.muted;
    }

    function updateMuteIcon() {
        if (!volumeHighIcon || !volumeOffIcon) return;
        const isMuted = templateAudio.muted;
        volumeHighIcon.classList.toggle('hidden', isMuted);
        volumeOffIcon.classList.toggle('hidden', !isMuted);
        if (volumeSlider) {
             volumeSlider.value = isMuted ? 0 : templateAudio.volume;
        }
    }
    
    function handleVolumeChange() {
        templateAudio.volume = volumeSlider.value;
        if (templateAudio.volume > 0) {
            templateAudio.muted = false;
        }
    }
    
    function handleVolumePropertyChange() {
        // This handles both volume and muted changes
        if (volumeSlider) volumeSlider.value = templateAudio.muted ? 0 : templateAudio.volume;
        updateMuteIcon();
    }
    
    function initializeCustomPlayerListeners() {
        if (customPlayPauseButton) customPlayPauseButton.addEventListener('click', togglePlayPause);
        if (floatingPlayPauseButton) floatingPlayPauseButton.addEventListener('click', togglePlayPause);
        if (templateAudio) {
            templateAudio.addEventListener('play', updatePlayPauseIcon);
            templateAudio.addEventListener('pause', updatePlayPauseIcon);
            templateAudio.addEventListener('loadedmetadata', handleMetadataLoaded);
            templateAudio.addEventListener('timeupdate', handleTimeUpdate);
            templateAudio.addEventListener('volumechange', handleVolumePropertyChange);
        }
        if (timelineSlider) {
            timelineSlider.addEventListener('input', handleTimelineChange);
            timelineSlider.addEventListener('mousedown', () => isSeeking = true);
            timelineSlider.addEventListener('mouseup', () => isSeeking = false);
            timelineSlider.addEventListener('touchstart', () => isSeeking = true);
            timelineSlider.addEventListener('touchend', () => isSeeking = false);
        }
        if (customMuteButton) customMuteButton.addEventListener('click', toggleMute);
        if (volumeSlider) volumeSlider.addEventListener('input', handleVolumeChange);
    }

    // =======================================================
    // ====       وظائف المشغل الصوتي المخصص (END)       ====
    // =======================================================


    // --- Functions for Serenity Mode ---
    function applyZenMode() {
        const body = document.body;
        const eyeIcon = zenModeToggleButton?.querySelector('.icon-eye');
        const eyeSlashIcon = zenModeToggleButton?.querySelector('.icon-eye-slash');
        if (!body || !eyeIcon || !eyeSlashIcon) return;
        if (isZenModeActive) {
            body.classList.add('zen-mode-active');
            eyeIcon.style.display = 'inline-block';
            eyeSlashIcon.style.display = 'none';
        } else {
            body.classList.remove('zen-mode-active');
            eyeIcon.style.display = 'none';
            eyeSlashIcon.style.display = 'inline-block';
        }
    }
    function toggleZenMode() { if (!isSerenityModeActive) return; isZenModeActive = !isZenModeActive; applyZenMode(); }
    function handleExitSerenityMode() {
        isSerenityModeActive = false;
        if (serenityModeCheckbox) serenityModeCheckbox.checked = false;
        localStorage.setItem('isSerenityModeActive', 'false');
        if (isSequentialPlayActive) { isSequentialPlayActive = false; updateSequentialPlayButtonVisuals(); }
        applySerenityMode();
    }
    function updateSequentialPlayButtonVisuals() {
        const sequentialPlayToggleButton = document.getElementById('sequential-play-toggle-button');
        if (!sequentialPlayToggleButton) return;
        const playIcon = sequentialPlayToggleButton.querySelector('.icon-sequential-play');
        const stopIcon = sequentialPlayToggleButton.querySelector('.icon-sequential-stop');
        if (isSequentialPlayActive) {
            playIcon.style.display = 'none';
            stopIcon.style.display = 'inline-block';
            sequentialPlayToggleButton.classList.add('active');
        } else {
            playIcon.style.display = 'inline-block';
            stopIcon.style.display = 'none';
            sequentialPlayToggleButton.classList.remove('active');
        }
    }
    function toggleSequentialPlay() {
        if (!isSerenityModeActive) return;
        isSequentialPlayActive = !isSequentialPlayActive;
        updateSequentialPlayButtonVisuals();
        if (isSequentialPlayActive && templateAudio.paused) {
            if (currentPrayerData?.audio || currentPrayerData?.repeatAudio) {
                if (templateAudio.ended) handleAudioEnd();
                else templateAudio.play().catch(e => console.warn("Sequential play start error:", e));
            } else { handleAudioEnd(); }
        }
    }
    
    function applySerenityMode() {
        const body = document.body;
        const prayerPage = document.getElementById('prayer-template-container');
        if (!body || !prayerPage || !serenityVideoBg) return;

        if (serenityModeCheckbox) serenityModeCheckbox.checked = isSerenityModeActive;

        if (isSerenityModeActive) {
            body.classList.add('serenity-mode-active');
            prayerPage.style.backgroundImage = 'none';
            serenityControlsOverlay.classList.remove('hidden');
            applyZenMode();
            updateSequentialPlayButtonVisuals();

            let videoSrc = '';
            if (currentPrayerData && currentPrayerData.type === 'morning') {
                videoSrc = SERENITY_VIDEOS.morning;
            } else if (currentPrayerData && currentPrayerData.type === 'evening') {
                videoSrc = SERENITY_VIDEOS.evening;
            }
            
            if (videoSrc) {
                body.classList.add('serenity-video-active');
                if (!serenityVideoBg.currentSrc || !serenityVideoBg.currentSrc.includes(videoSrc)) {
                    serenityVideoBg.innerHTML = `<source src="${videoSrc}" type="video/mp4">`;
                    serenityVideoBg.load();
                }
                serenityVideoBg.play().catch(e => console.warn("Video autoplay failed:", e));
                serenityVideoBg.classList.remove('hidden');
                serenityVideoBg.classList.add('visible');
            } else {
                body.classList.remove('serenity-video-active');
                if (!serenityVideoBg.paused) serenityVideoBg.pause();
                serenityVideoBg.classList.remove('visible');
                serenityVideoBg.classList.add('hidden');
            }
        } else {
            body.classList.remove('serenity-mode-active', 'serenity-video-active', 'zen-mode-active');
            serenityControlsOverlay.classList.add('hidden');
            if (!serenityVideoBg.paused) serenityVideoBg.pause();
            serenityVideoBg.classList.remove('visible');
            serenityVideoBg.classList.add('hidden');
            applyThemeToVisiblePage();
        }
    }

    function loadSerenitySettings() { isSerenityModeActive = localStorage.getItem('isSerenityModeActive') === 'true'; if (serenityModeCheckbox) serenityModeCheckbox.checked = isSerenityModeActive; }
    
    // --- General UI and Helper Functions ---
    function openIndexModal() { if (!indexModalOverlay) return; if (readingModePage.classList.contains('dark-theme')) { indexModalOverlay.classList.add('dark-theme'); } else { indexModalOverlay.classList.remove('dark-theme'); } indexModalOverlay.classList.remove('hidden'); }
    function closeIndexModal() { if (!indexModalOverlay) return; indexModalOverlay.classList.add('hidden'); }
    function populateIndex(prayerArray) { const indexListContainer = document.getElementById('reading-index-list'); if (!indexListContainer) return; indexListContainer.innerHTML = ''; prayerArray.forEach((prayer) => { const displayIndex = prayer.index + 1; const link = document.createElement('a'); link.href = `#dhikr-item-${prayer.index}`; link.className = 'index-link'; link.textContent = `ذكر ${displayIndex}`; link.addEventListener('click', (e) => { e.preventDefault(); const targetId = e.currentTarget.getAttribute('href').substring(1); const targetElement = document.getElementById(targetId); if (targetElement) { targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' }); } closeIndexModal(); }); indexListContainer.appendChild(link); }); }
    function handleScrollForBackToTop() { if (!readingModePage || !backToTopButton) return; if (readingModePage.scrollTop > 300) { backToTopButton.classList.remove('hidden'); } else { backToTopButton.classList.add('hidden'); } }
    function applyReadingModeTheme() { const readingThemeLabel = document.getElementById('reading-theme-label'); if (!readingModePage || !themeToggleCheckbox || !readingThemeLabel) return; if (readingModeTheme === 'dark') { readingModePage.classList.add('dark-theme'); themeToggleCheckbox.checked = true; readingThemeLabel.textContent = 'فاتح'; } else { readingModePage.classList.remove('dark-theme'); themeToggleCheckbox.checked = false; readingThemeLabel.textContent = 'داكن'; } }
    function loadReadingModeTheme() { const savedTheme = localStorage.getItem('readingModeTheme'); readingModeTheme = (savedTheme === 'dark') ? 'dark' : 'light'; }
    function saveReadingModeTheme() { localStorage.setItem('readingModeTheme', readingModeTheme); }
    function loadThemeSetting() { const savedTheme = localStorage.getItem('selectedTheme'); currentTheme = (savedTheme && THEMES.includes(savedTheme)) ? savedTheme : 'original'; updateThemeButtonVisuals(); applyThemeToVisiblePage(); }
    function saveThemeSetting() { localStorage.setItem('selectedTheme', currentTheme); }
    function updateThemeButtonVisuals() { const paletteIcon = themeToggleButton?.querySelector('.icon-palette'); const imageIcon = themeToggleButton?.querySelector('.icon-image'); if (paletteIcon && imageIcon && themeToggleButton) { const isOriginal = currentTheme === 'original'; paletteIcon.style.display = isOriginal ? 'inline-block' : 'none'; imageIcon.style.display = isOriginal ? 'none' : 'inline-block'; } }
    function applyThemeToVisiblePage() { if (isSerenityModeActive) return; const visiblePage = document.querySelector('.page-container.prayer-page.visible'); if (!visiblePage || visiblePage.id === 'home' || visiblePage.id === 'menu-page' || visiblePage.id === 'reading-mode-page' || !currentPrayerData) { if(prayerTemplateContainer) prayerTemplateContainer.style.backgroundImage = 'none'; return; } let backgroundImagePath = ''; const originalImagePath = currentPrayerData.image; if (currentTheme === 'original') { backgroundImagePath = originalImagePath; } else if (STATIC_THEME_IMAGES[currentTheme]) { backgroundImagePath = STATIC_THEME_IMAGES[currentTheme]; } else { backgroundImagePath = originalImagePath; } if (backgroundImagePath) { visiblePage.style.backgroundImage = `url('${backgroundImagePath}')`; } else { visiblePage.style.backgroundImage = 'none'; } }
    function loadAutoplaySetting() { const savedSetting = localStorage.getItem('autoplayEnabled'); isAutoplayEnabled = (savedSetting === null) ? false : (savedSetting === 'true'); }
    function saveAutoplaySetting() { localStorage.setItem('autoplayEnabled', isAutoplayEnabled); }
    function getDefaultFontSizes() { const rootStyles = getComputedStyle(document.documentElement); FONT_SIZE_VARIABLES.forEach(variable => { const value = rootStyles.getPropertyValue(variable).trim(); const numericValue = parseFloat(value); if (!isNaN(numericValue)) { defaultFontSizes[variable] = numericValue; } else { defaultFontSizes[variable] = 1; } }); }
    function applyFontSize() { if (Object.keys(defaultFontSizes).length === 0) return; const root = document.documentElement; FONT_SIZE_VARIABLES.forEach(variable => { const defaultSize = defaultFontSizes[variable]; if (typeof defaultSize === 'number') { const newSize = defaultSize * currentFontSizeMultiplier; root.style.setProperty(variable, `${newSize.toFixed(2)}rem`); } }); updateFontSizeButtonsState(); }
    function updateFontSizeButtonsState() { document.querySelectorAll('[data-font-action="decrease"]').forEach(btn => btn.disabled = currentFontSizeMultiplier <= MIN_FONT_SIZE_MULTIPLIER); document.querySelectorAll('[data-font-action="increase"]').forEach(btn => btn.disabled = currentFontSizeMultiplier >= MAX_FONT_SIZE_MULTIPLIER); }
    function loadFontSizeSetting() { const savedMultiplier = localStorage.getItem('fontSizeMultiplier'); if (savedMultiplier !== null) { const multiplier = parseFloat(savedMultiplier); if (!isNaN(multiplier) && multiplier >= MIN_FONT_SIZE_MULTIPLIER && multiplier <= MAX_FONT_SIZE_MULTIPLIER) { currentFontSizeMultiplier = multiplier; } } setTimeout(() => { if (Object.keys(defaultFontSizes).length === 0) { getDefaultFontSizes(); } applyFontSize(); }, 100); }
    function saveFontSizeSetting() { localStorage.setItem('fontSizeMultiplier', currentFontSizeMultiplier.toString()); }
    function handleIncreaseFont() { if (currentFontSizeMultiplier < MAX_FONT_SIZE_MULTIPLIER) { currentFontSizeMultiplier = Math.min(MAX_FONT_SIZE_MULTIPLIER, currentFontSizeMultiplier + FONT_SIZE_STEP); applyFontSize(); saveFontSizeSetting(); } }
    function handleDecreaseFont() { if (currentFontSizeMultiplier > MIN_FONT_SIZE_MULTIPLIER) { currentFontSizeMultiplier = Math.max(MIN_FONT_SIZE_MULTIPLIER, currentFontSizeMultiplier - FONT_SIZE_STEP); applyFontSize(); saveFontSizeSetting(); } }
    function applyTextColor() { const root = document.documentElement; const selectedColorOption = TEXT_COLOR_OPTIONS[currentTextColorIndex]; if (selectedColorOption === 'default') { root.style.removeProperty('--dynamic-text-color'); } else { root.style.setProperty('--dynamic-text-color', selectedColorOption); } }
    function loadTextColorSetting() { const savedIndex = localStorage.getItem('textColorIndex'); if (savedIndex !== null) { const index = parseInt(savedIndex, 10); if (!isNaN(index) && index >= 0 && index < TEXT_COLOR_OPTIONS.length) { currentTextColorIndex = index; } } setTimeout(() => { applyTextColor(); }, 150); }
    function saveTextColorSetting() { localStorage.setItem('textColorIndex', currentTextColorIndex.toString()); }
    function handleChangeTextColor() { currentTextColorIndex = (currentTextColorIndex + 1) % TEXT_COLOR_OPTIONS.length; applyTextColor(); saveTextColorSetting(); }
    function resetRepetitionState() { const countersContainer = document.getElementById('counters-container'); const autoRepetitionWrapper = document.getElementById('auto-repetition-counter'); const autoRepetitionCountSpan = document.getElementById('auto-repetition-count'); const manualCounterWrapper = document.getElementById('manual-counter'); const manualCountDisplay = document.getElementById('manual-count-display'); const manualCounterButton = document.getElementById('manual-counter-button'); const resetCounterWrapper = document.getElementById('reset-counter'); if (autoplayTimeoutId) { clearTimeout(autoplayTimeoutId); autoplayTimeoutId = null; } templateAudio.onended = null; templateAudio.oncanplaythrough = null; if (!templateAudio.paused) { templateAudio.pause(); } templateAudio.src = ''; templateAudio.load(); currentRepetitionTarget = 0; currentRepetitionCounter = 0; currentRepetitionAudioSrc = ''; initialAudioSrc = ''; isRepeatingAudio = false; if (autoRepetitionWrapper) autoRepetitionWrapper.classList.add('hidden'); if (autoRepetitionCountSpan) autoRepetitionCountSpan.textContent = '0'; manualCounterValue = 0; if (manualCounterWrapper) manualCounterWrapper.classList.add('hidden'); if (manualCountDisplay) manualCountDisplay.textContent = '0'; if (manualCounterButton) manualCounterButton.classList.remove('clicked-effect'); if (resetCounterWrapper) resetCounterWrapper.classList.add('hidden'); if(countersContainer) countersContainer.classList.add('hidden'); }
    function updateAutoRepetitionDisplay() { const autoRepetitionCountSpan = document.getElementById('auto-repetition-count'); const autoRepetitionWrapper = document.getElementById('auto-repetition-counter'); if (autoRepetitionCountSpan) { autoRepetitionCountSpan.textContent = Math.max(0, currentRepetitionCounter); } if (autoRepetitionWrapper) { autoRepetitionWrapper.classList.toggle('completed', currentRepetitionTarget > 0 && currentRepetitionCounter <= 0); autoRepetitionWrapper.classList.toggle('hidden', currentRepetitionTarget <= 0); } updateCountersContainerVisibility(); }
    function setupAutoRepetitionDisplay(targetCount) { currentRepetitionCounter = targetCount; currentRepetitionTarget = targetCount; updateAutoRepetitionDisplay(); }
    function updateCountersContainerVisibility() { const countersContainer = document.getElementById('counters-container'); const autoRepetitionWrapper = document.getElementById('auto-repetition-counter'); const manualCounterWrapper = document.getElementById('manual-counter'); const resetCounterWrapper = document.getElementById('reset-counter'); if (countersContainer) { const shouldShowCounters = currentRepetitionTarget > 0; countersContainer.classList.toggle('hidden', !shouldShowCounters); if (autoRepetitionWrapper) autoRepetitionWrapper.classList.toggle('hidden', !shouldShowCounters); if (manualCounterWrapper) manualCounterWrapper.classList.toggle('hidden', !shouldShowCounters); if (resetCounterWrapper) resetCounterWrapper.classList.toggle('hidden', !shouldShowCounters); } }
    
    function handleAudioEnd() {
        if (autoplayTimeoutId) { clearTimeout(autoplayTimeoutId); }
        if (!currentPrayerData) return;
    
        const currentFullSrc = templateAudio.currentSrc ? new URL(templateAudio.currentSrc, window.location.href).toString() : null;
        const initialFullSrc = initialAudioSrc ? new URL(initialAudioSrc, window.location.href).toString() : null;
        const repeatFullSrc = currentRepetitionAudioSrc ? new URL(currentRepetitionAudioSrc, window.location.href).toString() : null;
        
        // تم التعديل هنا: فحص إذا كان الصوت الحالي هو المقدمة ووجود صوت تكرار
        if (currentPrayerData.hasAdvancedRepetition && currentFullSrc === initialFullSrc && repeatFullSrc) {
            // تشغيل صوت الذكر الرئيسي لمرة واحدة
            templateAudio.src = repeatFullSrc;
            templateAudio.load();
            templateAudio.play().catch(e => console.warn("Autoplay error on main prayer audio:", e));
            // إلغاء دالة onended لمنع التكرار التلقائي
            templateAudio.onended = null;
            return;
        }

        if (isSequentialPlayActive) {
            // تم حذف الجزء القديم الذي كان يتعامل مع التشغيل المتسلسل بشكل خاطئ
            setTimeout(() => {
                const nextBtn = document.getElementById('next-dhikr-button');
                if (nextBtn && !nextBtn.disabled) {
                    nextBtn.click();
                } else {
                    isSequentialPlayActive = false;
                    updateSequentialPlayButtonVisuals();
                }
            }, 1500);
            return; 
        }
    }

    function handleManualCounterClick() { const manualCounterButton = document.getElementById('manual-counter-button'); const manualCountDisplay = document.getElementById('manual-count-display'); if (!manualCounterButton || !manualCountDisplay || !currentPrayerData) return; manualCounterValue++; manualCountDisplay.textContent = manualCounterValue; manualCounterButton.classList.add('clicked-effect'); setTimeout(() => { manualCounterButton.classList.remove('clicked-effect'); }, 200); let audioToPlaySrc = ''; if (currentPrayerData.hasAdvancedRepetition && currentPrayerData.repeatAudio) { audioToPlaySrc = currentPrayerData.repeatAudio; } else if (currentPrayerData.audio) { audioToPlaySrc = currentPrayerData.audio; } if (audioToPlaySrc) { try { let targetFullSrc = new URL(audioToPlaySrc, window.location.href).toString(); if (!templateAudio.src || new URL(templateAudio.src, window.location.href).toString() !== targetFullSrc) { templateAudio.src = targetFullSrc; templateAudio.load(); } else { templateAudio.currentTime = 0; } templateAudio.play().catch(e => console.warn("Manual play error:", e)); } catch (error) { console.error("Manual audio error:", error); } } }
    function handleResetCountersClick() { const manualCountDisplay = document.getElementById('manual-count-display'); if (!currentPrayerData || currentRepetitionTarget <= 0) { return; } if (!templateAudio.paused) { templateAudio.pause(); } templateAudio.onended = null; templateAudio.oncanplaythrough = null; isRepeatingAudio = false; let sourceToReload = ""; let fullSourceToReload = ""; if (currentPrayerData.hasAdvancedRepetition && currentPrayerData.initialAudio) { sourceToReload = currentPrayerData.initialAudio; fullSourceToReload = new URL(sourceToReload, window.location.href).toString(); templateAudio.onended = handleAudioEnd; } else if (currentPrayerData.audio && currentPrayerData.repetitionCount > 0) { sourceToReload = currentPrayerData.audio; fullSourceToReload = new URL(sourceToReload, window.location.href).toString(); isRepeatingAudio = true; templateAudio.onended = handleAudioEnd; } let currentFullSrc = templateAudio.src ? new URL(templateAudio.src, window.location.href).toString() : null; if (fullSourceToReload && currentFullSrc !== fullSourceToReload) { templateAudio.src = fullSourceToReload; templateAudio.load(); } else if (fullSourceToReload) { templateAudio.currentTime = 0; } else { templateAudio.src = ''; templateAudio.load(); } manualCounterValue = 0; if (manualCountDisplay) manualCountDisplay.textContent = '0'; currentRepetitionCounter = currentRepetitionTarget; updateAutoRepetitionDisplay(); }
    function enterReadingMode(prayerType) { const prayerNavButtonsContainer = document.getElementById('prayer-nav-buttons-container'); const readingNavButtonsContainer = document.getElementById('reading-nav-buttons-container'); if (typeof morningPrayers === 'undefined' || typeof eveningPrayers === 'undefined' || !readingModePage || !readingModeTitle || !readingModeContentArea) return; isReadingModeActive = true; resetRepetitionState(); if (prayerNavButtonsContainer) prayerNavButtonsContainer.classList.add('hidden'); const prayerArray = (prayerType === 'morning') ? morningPrayers : eveningPrayers; const titleText = (prayerType === 'morning') ? "أذكار الصباح" : "أذكار المساء"; readingModeTitle.textContent = `${titleText} - وضع القراءة`; readingModeContentArea.innerHTML = ''; const flexWrapper = document.createElement('div'); flexWrapper.className = 'reading-mode-flex-wrapper'; const leftOrnament = document.createElement('div'); leftOrnament.className = 'reading-mode-side-ornament ornament-left'; const rightOrnament = document.createElement('div'); rightOrnament.className = 'reading-mode-side-ornament ornament-right'; const mainContent = document.createElement('div'); mainContent.className = 'reading-mode-main-content'; const firstPrayer = prayerArray.length > 0 ? prayerArray.find(p => p.index === 0) || prayerArray[0] : null; if (firstPrayer && firstPrayer.intro) { const introDiv = document.createElement('div'); introDiv.className = 'reading-mode-dhikr-item intro-reading-item'; const introP = document.createElement('p'); introP.className = 'reading-dhikr-text intro-text-reading'; introP.innerHTML = firstPrayer.intro; introDiv.appendChild(introP); mainContent.appendChild(introDiv); const introDivider = document.createElement('div'); introDivider.className = 'reading-mode-divider'; mainContent.appendChild(introDivider); } prayerArray.forEach((prayer) => { const itemDiv = document.createElement('div'); itemDiv.className = 'reading-mode-dhikr-item'; itemDiv.id = `dhikr-item-${prayer.index}`; const titleH3 = document.createElement('h3'); const displayIndex = prayer.index + 1; titleH3.textContent = `${titleText} - الذكر ${displayIndex}`; itemDiv.appendChild(titleH3); const textP = document.createElement('p'); textP.className = 'reading-dhikr-text'; let cleanText = prayer.text.replace(/<span class='repetition-indicator'>.*?<\/span><br>/i, ''); if (prayer.repetitionCount && prayer.repetitionCount > 1) { textP.innerHTML = `<span class='repetition-indicator'>(${prayer.repetitionCount} مرات)</span><br>${cleanText}`; } else { textP.innerHTML = cleanText; } itemDiv.appendChild(textP); if (prayer.repetitionCount && prayer.repetitionCount > 1) { const counterContainer = document.createElement('div'); counterContainer.className = 'reading-counter-container'; const manualCounterButton = document.createElement('button'); manualCounterButton.className = 'reading-manual-counter'; manualCounterButton.setAttribute('aria-label', 'زيادة العد اليدوي'); const countSpan = document.createElement('span'); countSpan.textContent = '0'; manualCounterButton.appendChild(countSpan); const resetButton = document.createElement('button'); resetButton.className = 'reading-reset-button'; resetButton.setAttribute('aria-label', 'إعادة تعيين العداد'); const resetIcon = document.createElement('img'); resetIcon.src = 'images/undo.png'; resetIcon.alt = 'إعادة تعيين'; resetIcon.className = 'icon'; resetIcon.setAttribute('loading', 'lazy'); resetButton.appendChild(resetIcon); manualCounterButton.addEventListener('click', () => { let currentCount = parseInt(countSpan.textContent, 10); currentCount++; countSpan.textContent = currentCount; }); resetButton.addEventListener('click', () => { countSpan.textContent = '0'; }); counterContainer.appendChild(manualCounterButton); counterContainer.appendChild(resetButton); itemDiv.appendChild(counterContainer); } if (prayer.fadel && prayer.fadel.trim()) { const fadelCollapsible = document.createElement('div'); fadelCollapsible.className = 'reading-fadel-collapsible'; const toggleButton = document.createElement('button'); toggleButton.className = 'reading-fadel-toggle'; toggleButton.setAttribute('aria-expanded', 'false'); toggleButton.innerHTML = ` <img src="images/star.png" alt="فضل الذكر" class="fadel-icon icon" loading="lazy"> <span class="fadel-toggle-text">فضل الذكر ومصدره</span> <img src="images/chevron-down.png" alt="سهم" class="fadel-chevron icon" loading="lazy"> `; const fadelContent = document.createElement('div'); fadelContent.className = 'reading-fadel-content'; const fadelP = document.createElement('p'); fadelP.innerHTML = prayer.fadel.replace(/\n/g, '<br>'); fadelContent.appendChild(fadelP); toggleButton.addEventListener('click', () => { const isActive = fadelCollapsible.classList.toggle('active'); toggleButton.setAttribute('aria-expanded', isActive); const content = toggleButton.nextElementSibling; if(isActive) { content.style.maxHeight = content.scrollHeight + 'px'; content.style.marginTop = '10px'; content.style.padding = '15px'; } else { content.style.maxHeight = null; content.style.marginTop = null; content.style.padding = '0 15px'; } }); fadelCollapsible.appendChild(toggleButton); fadelCollapsible.appendChild(fadelContent); itemDiv.appendChild(fadelCollapsible); } mainContent.appendChild(itemDiv); if (prayer.index < prayerArray.length - 1) { const divider = document.createElement('div'); divider.className = 'reading-mode-divider'; mainContent.appendChild(divider); } }); flexWrapper.appendChild(rightOrnament); flexWrapper.appendChild(mainContent); flexWrapper.appendChild(leftOrnament); readingModeContentArea.appendChild(flexWrapper); allPageContainers.forEach(container => { container.classList.toggle('visible', container === readingModePage); container.classList.toggle('hidden', container !== readingModePage); }); currentVisiblePageId = 'reading-mode-page'; readingModePage.scrollTop = 0; if (readingNavButtonsContainer) readingNavButtonsContainer.classList.remove('hidden'); if(readingScrollUpButton) readingScrollUpButton.disabled = true; if(readingScrollDownButton) readingModePage.scrollHeight <= readingModePage.clientHeight; applyReadingModeTheme(); applyFontSize(); populateIndex(prayerArray); if(backToTopButton) backToTopButton.classList.add('hidden'); }
    function exitReadingMode() { if (!readingModePage) return; isReadingModeActive = false; readingModePage.classList.add('hidden'); readingModePage.classList.remove('visible'); if (document.getElementById('reading-nav-buttons-container')) document.getElementById('reading-nav-buttons-container').classList.add('hidden'); if (backToTopButton) backToTopButton.classList.add('hidden'); showPage(lastVisitedPageId || 'home'); }
    function showPage(pageId) {
        const prayerNavButtonsContainer = document.getElementById('prayer-nav-buttons-container');
        const readingNavButtonsContainer = document.getElementById('reading-nav-buttons-container');
        const currentPageIdBeforeSwitch = currentVisiblePageId;
        if (!pageId.startsWith('home') && !pageId.startsWith('menu') && !pageId.startsWith('reading') && (typeof morningPrayers === 'undefined' || typeof eveningPrayers === 'undefined')) { return; }
        const comingFromPrayerPage = !currentPageIdBeforeSwitch.startsWith('home') && !currentPageIdBeforeSwitch.startsWith('menu') && !currentPageIdBeforeSwitch.startsWith('reading');
        const goingToPrayerPage = !pageId.startsWith('home') && !pageId.startsWith('menu') && !pageId.startsWith('reading');
        const isSwitchingToMenu = pageId === 'menu-page';
        let resetNeeded = false;
        if (!isReadingModeActive && !isSwitchingToMenu) {
            if (comingFromPrayerPage && !goingToPrayerPage) {
                resetNeeded = true;
            } else if (!comingFromPrayerPage && goingToPrayerPage) {
                resetNeeded = true;
            } else if (comingFromPrayerPage && goingToPrayerPage) {
                const currentType = currentPageIdBeforeSwitch.split('-')[0];
                const targetType = pageId.split('-')[0];
                if (currentType !== targetType) {
                    resetNeeded = true;
                }
            }
        }
        if (resetNeeded) {
            resetRepetitionState();
        }
        if (fadelCollapsible && fadelCollapsible.classList.contains('active')) {
            fadelCollapsible.classList.remove('active');
            if (fadelToggle) fadelToggle.setAttribute('aria-expanded', 'false');
        }
        if (prayerNavButtonsContainer) prayerNavButtonsContainer.classList.add('hidden');
        if (readingNavButtonsContainer) readingNavButtonsContainer.classList.add('hidden');
        let targetPageElement = null;
        const isTargetHomePage = (pageId === 'home');
        const isTargetMenuPage = (pageId === 'menu-page');
        const isTargetReadingPage = (pageId === 'reading-mode-page');
        if ((isTargetMenuPage || isTargetReadingPage) && !currentPageIdBeforeSwitch.startsWith('menu') && !currentPageIdBeforeSwitch.startsWith('reading')) {
            lastVisitedPageId = currentPageIdBeforeSwitch;
        }
        if (isTargetHomePage) {
            targetPageElement = homeContainer;
            isReadingModeActive = false;
            currentPrayerData = null;
            if (prayerTemplateContainer) {
                prayerTemplateContainer.style.backgroundImage = 'none';
            }
        } else if (isTargetMenuPage) {
            targetPageElement = menuPage;
            isReadingModeActive = false;
            currentPrayerData = null;
            closeAllAccordionItems();
            const menuContent = menuPage.querySelector('.menu-content-wrapper');
            if (menuContent) menuContent.scrollTop = 0;
        } else if (isTargetReadingPage) {
            targetPageElement = readingModePage;
            isReadingModeActive = true;
            if (readingNavButtonsContainer) readingNavButtonsContainer.classList.remove('hidden');
            if (readingScrollUpButton) readingScrollUpButton.disabled = (readingModePage.scrollTop <= 0);
            if (readingScrollDownButton) readingScrollDownButton.disabled = (readingModePage.scrollHeight <= readingModePage.clientHeight);
            applyFontSize();
            applyReadingModeTheme();
        } else {
            isReadingModeActive = false;
            targetPageElement = prayerTemplateContainer;
            updateThemeButtonVisuals();
            updateFontSizeButtonsState();
            const parts = pageId.split('-');
            if (parts.length < 2) {
                showPage('home');
                return;
            }
            const type = parts[0];
            const index = parseInt(parts[1], 10);
            if (isNaN(index) || (type !== 'morning' && type !== 'evening')) {
                showPage('home');
                return;
            }
            const prayerDataArray = (type === 'morning') ? morningPrayers : eveningPrayers;
            const newPrayerData = prayerDataArray.find(p => p.index === index && p.type === type);
            if (!newPrayerData) {
                showPage('home');
                return;
            }
            if (currentPrayerData !== newPrayerData) {
                resetRepetitionState();
                currentPrayerData = newPrayerData;
            }
            const totalPrayers = prayerDataArray.length;
            templateTitle.textContent = `${currentPrayerData.title} (${index + 1}/${totalPrayers})`;
            templateText.innerHTML = currentPrayerData.text;
            const fadelTextParagraph = document.getElementById('template-fadel-text-content');
            if (fadelCollapsible && fadelTextParagraph) {
                if (currentPrayerData.fadel && currentPrayerData.fadel.trim()) {
                    fadelTextParagraph.innerHTML = currentPrayerData.fadel.replace(/\n/g, '<br>');
                    fadelCollapsible.style.display = 'block';
                } else {
                    fadelTextParagraph.innerHTML = '';
                    fadelCollapsible.style.display = 'none';
                }
            }
            
            let audioSrcToLoad = "";
            let repetitionTarget = currentPrayerData.repetitionCount || 0;
            initialAudioSrc = '';
            currentRepetitionAudioSrc = '';
            templateAudio.onended = handleAudioEnd; 
            templateAudio.oncanplaythrough = null;

            if (currentPrayerData.hasAdvancedRepetition && currentPrayerData.initialAudio && currentPrayerData.repeatAudio && repetitionTarget > 0) {
                initialAudioSrc = currentPrayerData.initialAudio;
                currentRepetitionAudioSrc = currentPrayerData.repeatAudio;
                audioSrcToLoad = initialAudioSrc;
                setupAutoRepetitionDisplay(isSequentialPlayActive ? 0 : repetitionTarget);
                isRepeatingAudio = false;
            } else if (repetitionTarget > 0 && currentPrayerData.audio) {
                audioSrcToLoad = currentPrayerData.audio;
                currentRepetitionAudioSrc = audioSrcToLoad;
                initialAudioSrc = audioSrcToLoad;
                setupAutoRepetitionDisplay(isSequentialPlayActive ? 0 : repetitionTarget);
                isRepeatingAudio = true;
            } else {
                audioSrcToLoad = currentPrayerData.audio || "";
                setupAutoRepetitionDisplay(0);
                isRepeatingAudio = false;
            }

            updateCountersContainerVisibility();
            const manualCountDisplay = document.getElementById('manual-count-display');
            if(manualCountDisplay) manualCountDisplay.textContent = '0';
            if (audioSrcToLoad) {
                const fullAudioSrc = new URL(audioSrcToLoad, window.location.href).toString();
                const currentFullSrc = templateAudio.src ? new URL(templateAudio.src, window.location.href).toString() : null;
                if (!currentFullSrc || currentFullSrc !== fullAudioSrc) {
                    templateAudio.src = fullAudioSrc;
                    templateAudio.load();
                } else {
                    templateAudio.currentTime = 0;
                }
                // تم التعديل هنا لتشغيل الصوت تلقائيًا في وضع الاستماع
                if ((isSequentialPlayActive || !isReadingModeActive) && templateAudio.readyState < 4) {
                    if (autoplayTimeoutId) {
                        clearTimeout(autoplayTimeoutId);
                    }
                    templateAudio.oncanplaythrough = () => {
                        if (currentVisiblePageId === pageId && templateAudio.src === fullAudioSrc && templateAudio.paused) {
                            templateAudio.play().catch(e => console.warn(`Autoplay error (canplaythrough):`, e));
                        }
                        templateAudio.oncanplaythrough = null;
                    };
                    autoplayTimeoutId = setTimeout(() => {
                        if (templateAudio.paused && currentVisiblePageId === pageId && templateAudio.src === fullAudioSrc && templateAudio.readyState >= 3) {
                            templateAudio.play().catch(e => console.warn(`Autoplay fallback error:`, e));
                        }
                        autoplayTimeoutId = null;
                    }, 500);
                } else if ((isAutoplayEnabled || isSequentialPlayActive) && templateAudio.readyState >= 3 && templateAudio.paused) {
                    templateAudio.play().catch(e => console.warn(`Autoplay direct error:`, e));
                } else if (!isAutoplayEnabled && !isSequentialPlayActive && !templateAudio.paused) {
                    templateAudio.pause();
                    templateAudio.currentTime = 0;
                } else if (!isAutoplayEnabled && !isSequentialPlayActive) {
                    templateAudio.currentTime = 0;
                }
            } else {
                templateAudio.src = '';
                templateAudio.load();
                if (isSequentialPlayActive) { 
                    handleAudioEnd();
                }
            }
            const currentIndexInArray = prayerDataArray.findIndex(p => p.index === index && p.type === type);
            const prevPrayer = currentIndexInArray > 0 ? prayerDataArray[currentIndexInArray - 1] : null;
            const nextPrayer = currentIndexInArray < prayerDataArray.length - 1 ? prayerDataArray[currentIndexInArray + 1] : null;
            if (prayerNavButtonsContainer && prevDhikrButton && nextDhikrButton) {
                prayerNavButtonsContainer.classList.remove('hidden');
                prevDhikrButton.disabled = (currentIndexInArray === 0);
                if (prevPrayer) {
                    const prevPageTarget = `${prevPrayer.type}-${prevPrayer.index}`;
                    prevDhikrButton.onclick = () => showPage(prevPageTarget);
                } else {
                    prevDhikrButton.onclick = null;
                }
                nextDhikrButton.disabled = !nextPrayer;
                if (nextPrayer) {
                    const nextPageTarget = `${nextPrayer.type}-${nextPrayer.index}`;
                    nextDhikrButton.onclick = () => showPage(nextPageTarget);
                } else {
                    nextDhikrButton.onclick = null;
                }
            }
            
            const prayerIntroControls = document.querySelector('.prayer-intro-controls');
            const serenityToggleContainer = document.querySelector('.serenity-toggle-container');
            const firstPrayer = prayerDataArray.length > 0 ? prayerDataArray.find(p => p.index === 0) || prayerDataArray[0] : null;
            
            if (prayerIntroControls) {
                prayerIntroControls.style.display = (currentPrayerData.index === firstPrayer?.index) ? 'flex' : 'none';
            }
            if (serenityToggleContainer) {
                serenityToggleContainer.style.display = 'flex';
            }

            const templateIntroWrapper = document.getElementById('template-intro-wrapper');
            if (templateIntroWrapper) {
                const isExpanded = document.getElementById('intro-collapsible-toggle')?.getAttribute('aria-expanded') === 'true';
                templateIntroWrapper.style.display = isExpanded ? 'block' : 'none';
            }
            const templateAuthorWrapper = document.getElementById('template-author-wrapper');
            if(templateAuthorWrapper) templateAuthorWrapper.style.display = 'none';
            requestAnimationFrame(() => {
                const visiblePrayerPage = document.querySelector('.page-container.prayer-page.visible');
                if (visiblePrayerPage && visiblePrayerPage.id === 'prayer-template-container') {
                    visiblePrayerPage.scrollTop = 0;
                }
            });
            applyFontSize();
            applyTextColor();
            applySerenityMode();
        }
        
        const isTargetPrayerPage = (targetPageElement === prayerTemplateContainer);
        if (serenityControlsOverlay) {
            serenityControlsOverlay.classList.toggle('hidden', !isTargetPrayerPage || !isSerenityModeActive);
        }

        if (targetPageElement) {
            allPageContainers.forEach(container => {
                if (container && container.classList) {
                    container.classList.toggle('visible', container === targetPageElement);
                    container.classList.toggle('hidden', container !== targetPageElement);
                }
            });
            currentVisiblePageId = targetPageElement.id === 'prayer-template-container' ? pageId : targetPageElement.id;
            if (!isTargetHomePage && !isTargetMenuPage && !isTargetReadingPage) {
                applyThemeToVisiblePage();
            }
        } else {
            if (!isTargetHomePage && !isTargetMenuPage && !isTargetReadingPage) {
                showPage('home');
            }
        }
    }
    
    function closeAllAccordionItems(exceptThisHeader = null) {
        accordionHeaders.forEach(header => {
            if (header !== exceptThisHeader) {
                header.classList.remove('active');
                header.setAttribute('aria-expanded', 'false');
                const content = header.nextElementSibling;
                if (content && content.classList.contains('accordion-content')) {
                    content.style.maxHeight = null;
                }
            }
        });
    }

    function handleTouchStart(e) { if (isReadingModeActive || currentVisiblePageId === 'menu-page' || e.touches.length > 1) { isSwipeHandled = true; return; } const targetElement = e.target; if (targetElement.closest('button, a, .custom-audio-player, .counters-container, .theme-toggle-switch, p')) { isSwipeHandled = true; return; } touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; touchEndY = touchStartY; isSwipeHandled = false; }
    function handleTouchMove(e) { if (isSwipeHandled) return; touchEndX = e.changedTouches[0].screenX; touchEndY = e.changedTouches[0].screenY; }
    function handleTouchEnd(e) { if (isSwipeHandled || touchStartY === 0) { touchStartY = 0; touchEndY = 0; touchStartX = 0; touchEndX = 0; return; } handleVerticalSwipe(); touchStartY = 0; touchEndY = 0; touchStartX = 0; touchEndX = 0; }
    function handleVerticalSwipe() { if (isReadingModeActive) return; const currentPageElement = document.querySelector('.page-container.visible.prayer-page'); if (!currentPageElement) return; const deltaY = touchEndY - touchStartY; const deltaX = touchEndX - touchStartX; if (Math.abs(deltaY) < swipeThreshold || Math.abs(deltaY) < Math.abs(deltaX)) { return; } isSwipeHandled = true; if (deltaY < 0) { if (nextDhikrButton && !nextDhikrButton.disabled) { nextDhikrButton.click(); } } else { if (prevDhikrButton && !prevDhikrButton.disabled) { prevDhikrButton.click(); } } }
    
    function initializeApp() {
        loadAutoplaySetting(); loadThemeSetting(); loadReadingModeTheme(); getDefaultFontSizes(); loadFontSizeSetting(); loadTextColorSetting(); loadSerenitySettings();
        initializeCustomPlayerListeners();
    
        document.querySelectorAll('.home-action-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const targetButton = event.currentTarget;
                const sectionTarget = targetButton.dataset.section;
                if (sectionTarget) {
                    isSerenityModeActive = false; isSequentialPlayActive = false;
                    if (serenityModeCheckbox) serenityModeCheckbox.checked = false;
                    localStorage.setItem('isSerenityModeActive', 'false');
                    showPage(sectionTarget); return;
                }
                const readingModeTarget = targetButton.dataset.readingMode;
                if (readingModeTarget) { enterReadingMode(readingModeTarget); return; }
                const serenityModeTarget = targetButton.dataset.serenityMode;
                if (serenityModeTarget) {
                    isSerenityModeActive = true; isZenModeActive = true; isSequentialPlayActive = true;
                    if (serenityModeCheckbox) serenityModeCheckbox.checked = true;
                    localStorage.setItem('isSerenityModeActive', 'true');
                    showPage(`${serenityModeTarget}-0`); return;
                }
            });
        });

        if (templateHomeButtonTop) { templateHomeButtonTop.addEventListener('click', (e) => { const target = e.currentTarget.dataset.section; if (target) showPage(target); }); }
        if (menuToggleButton) { menuToggleButton.addEventListener('click', () => showPage('menu-page')); }
        if (closeMenuButton) { closeMenuButton.addEventListener('click', () => showPage(lastVisitedPageId || 'home')); }
        if (themeToggleButton) { themeToggleButton.addEventListener('click', () => { const currentIndex = THEMES.indexOf(currentTheme); const nextIndex = (currentIndex + 1) % THEMES.length; currentTheme = THEMES[nextIndex]; saveThemeSetting(); updateThemeButtonVisuals(); applyThemeToVisiblePage(); }); }
        if (document.getElementById('manual-counter-button')) { document.getElementById('manual-counter-button').addEventListener('click', handleManualCounterClick); }
        if (document.getElementById('reset-counters-button')) { document.getElementById('reset-counters-button').addEventListener('click', handleResetCountersClick); }
        if (readingModeToggleButton) { readingModeToggleButton.addEventListener('click', () => { let prayerType = null; if (currentPrayerData && currentVisiblePageId.startsWith(currentPrayerData.type)) { prayerType = currentPrayerData.type; } else { prayerType = (lastVisitedPageId.startsWith('morning-') || !lastVisitedPageId.startsWith('evening-')) ? 'morning' : 'evening'; } enterReadingMode(prayerType); }); }
        const readingHomeButton = document.getElementById('reading-home-button');
        if (readingHomeButton) { readingHomeButton.addEventListener('click', exitReadingMode); }
        if (fadelToggle) { fadelToggle.addEventListener('click', () => { fadelCollapsible.classList.toggle('active'); fadelToggle.setAttribute('aria-expanded', fadelCollapsible.classList.contains('active')); }); }
        const introCollapsibleToggle = document.getElementById('intro-collapsible-toggle');
        const introWrapper = document.getElementById('template-intro-wrapper');
        if (introCollapsibleToggle && introWrapper) { introCollapsibleToggle.addEventListener('click', () => { const isExpanded = introCollapsibleToggle.getAttribute('aria-expanded') === 'true'; if (isExpanded) { introWrapper.style.display = 'none'; introCollapsibleToggle.setAttribute('aria-expanded', 'false'); } else { introWrapper.style.display = 'block'; introCollapsibleToggle.setAttribute('aria-expanded', 'true'); } }); }
        if (readingScrollDownButton) { readingScrollDownButton.addEventListener('click', () => { if (readingModePage.classList.contains('visible')) { readingModePage.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' }); } }); }
        if (readingScrollUpButton) { readingScrollUpButton.addEventListener('click', () => { if (readingModePage.classList.contains('visible')) { readingModePage.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' }); } }); }
        if (readingModePage && readingScrollUpButton && readingScrollDownButton) { readingModePage.addEventListener('scroll', () => { const tolerance = 5; const isAtTop = readingModePage.scrollTop <= tolerance; const isAtBottom = (readingModePage.scrollHeight - readingModePage.scrollTop - readingModePage.clientHeight) < tolerance; readingScrollUpButton.disabled = isAtTop; readingScrollDownButton.disabled = isAtBottom; handleScrollForBackToTop(); }, { passive: true }); }
        document.querySelectorAll('[data-font-action]').forEach(button => { const action = button.dataset.fontAction; if (action === 'increase') { button.addEventListener('click', handleIncreaseFont); } else if (action === 'decrease') { button.addEventListener('click', handleDecreaseFont); } });
        if (changeTextColorButton) { changeTextColorButton.addEventListener('click', handleChangeTextColor); }
        if (themeToggleCheckbox) { themeToggleCheckbox.addEventListener('change', () => { readingModeTheme = themeToggleCheckbox.checked ? 'dark' : 'light'; applyReadingModeTheme(); saveReadingModeTheme(); }); }
        if (prayerTemplateContainer) { prayerTemplateContainer.addEventListener('touchstart', handleTouchStart, { passive: true }); prayerTemplateContainer.addEventListener('touchmove', handleTouchMove, { passive: true }); prayerTemplateContainer.addEventListener('touchend', handleTouchEnd, { passive: true }); }
        
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                if (!content || !content.classList.contains('accordion-content')) return;
                const isActive = header.classList.contains('active');
                closeAllAccordionItems();
                if (!isActive) {
                    header.classList.add('active');
                    header.setAttribute('aria-expanded', 'true');
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            });
        });

        if (readingIndexButton) { readingIndexButton.addEventListener('click', openIndexModal); }
        if (closeIndexModalButton) { closeIndexModalButton.addEventListener('click', closeIndexModal); }
        if (indexModalOverlay) { indexModalOverlay.addEventListener('click', (e) => { if (e.target === indexModalOverlay) { closeIndexModal(); } }); }
        if (backToTopButton) { backToTopButton.addEventListener('click', () => { if (readingModePage) { readingModePage.scrollTo({ top: 0, behavior: 'smooth' }); } }); }
        
        if (supportUsButton) {
            supportUsButton.addEventListener('click', () => {
                showPage('menu-page');
                setTimeout(() => {
                    closeAllAccordionItems();
                    const supportHeader = document.getElementById('support-accordion-header');
                    const supportContent = supportHeader ? supportHeader.nextElementSibling : null;
                    if (supportHeader && supportContent) {
                        supportHeader.classList.add('active');
                        supportHeader.setAttribute('aria-expanded', 'true');
                        supportContent.style.maxHeight = supportContent.scrollHeight + "px";
                    }
                }, 150);
            });
        }
        
        function setSerenityMode(isActive) {
            isSerenityModeActive = isActive;
            localStorage.setItem('isSerenityModeActive', isSerenityModeActive.toString());
            if (isSerenityModeActive) { isZenModeActive = false; }
            applySerenityMode();
        }

        if (serenityModeCheckbox) { 
            serenityModeCheckbox.addEventListener('change', () => {
                setSerenityMode(serenityModeCheckbox.checked);
            });
        }
        
        if (zenModeToggleButton) { zenModeToggleButton.addEventListener('click', toggleZenMode); }
        if (exitSerenityModeButton) { exitSerenityModeButton.addEventListener('click', handleExitSerenityMode); }
        
        // --- Logic for Draggable and Collapsible Controls ---
        if (toggleControlsButton) {
            toggleControlsButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent drag from starting
                serenityControlsOverlay.classList.toggle('collapsed');
            });
        }

        let isDragging = false;
        let offsetX, offsetY;

        const startDrag = (e) => {
            isDragging = true;
            serenityControlsOverlay.style.transition = 'none'; // Disable transitions while dragging
            
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;

            offsetX = clientX - serenityControlsOverlay.offsetLeft;
            offsetY = clientY - serenityControlsOverlay.offsetTop;

            document.addEventListener('mousemove', onDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
        };

        const onDrag = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;

            let newLeft = clientX - offsetX;
            let newTop = clientY - offsetY;

            // Constrain to viewport
            const rect = serenityControlsOverlay.getBoundingClientRect();
            const parentRect = document.body.getBoundingClientRect();

            newLeft = Math.max(0, Math.min(newLeft, parentRect.width - rect.width));
            newTop = Math.max(0, Math.min(newTop, parentRect.height - rect.height));

            serenityControlsOverlay.style.left = `${newLeft}px`;
            serenityControlsOverlay.style.top = `${newTop}px`;
        };

        const endDrag = () => {
            isDragging = false;
            serenityControlsOverlay.style.transition = ''; // Re-enable transitions
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('touchmove', onDrag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);
        };

        if (controlsHandle) {
            controlsHandle.addEventListener('mousedown', startDrag);
            controlsHandle.addEventListener('touchstart', startDrag, { passive: false });
        }

        showPage('home');
    }
    
    initializeApp();
});