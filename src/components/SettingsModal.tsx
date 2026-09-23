import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Palette,
  Timer,
  Volume2,
  Sliders,
  Type,
  Eye,
  Sun,
  Moon,
  RotateCcw,
  Sparkles,
  Check,
  Play,
  Upload,
  Music,
  Shield,
  User,
  Music2,
  Circle,
  Headphones,
  Flame,
  CloudRain,
  Zap,
  Image as ImageIcon,
  Film,
  Layers,
  HardDrive,
  BatteryCharging,
  SlidersHorizontal,
  Trash2,
  RefreshCw,
  Wand2,
} from 'lucide-react';
import {
  ClockSettings,
  PomodoroSettings,
  ClockFontFamily,
  ClockDigitSize,
  SoundAlertChoice,
  AmbientThemeId,
  WallpaperMode,
} from '../types';
import {
  THEME_PRESETS,
  FONT_OPTIONS,
  SOUND_ALERT_OPTIONS,
  SAMPLE_QUOTES,
  POMODORO_THEME_PRESETS,
  AMBIENT_THEMES,
  getResolvedPomodoroTheme,
  getMaxPomodoroFontSize,
} from '../utils/constants';
import {
  triggerSoundAlert,
  playHourlyChime,
  playTickSound,
} from '../utils/audio';
import { AmbientBackground } from './AmbientBackground';
import {
  saveWallpaperItem,
  getWallpaperItem,
  removeWallpaperItem,
  getStorageUsage,
} from '../utils/wallpaperStorage';
import { processImageFile, isSupportedImageFile } from '../utils/imageProcessor';
import { generateSubjectMask } from '../utils/subjectSegmenter';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clockSettings: ClockSettings;
  onUpdateClockSettings: (settings: Partial<ClockSettings>) => void;
  pomodoroSettings: PomodoroSettings;
  onUpdatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
  userName: string;
  onOpenNameModal: () => void;
  onResetDefaults: () => void;
  onReplayIntro?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

type TabKey = 'clock' | 'pomodoro' | 'general';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  clockSettings,
  onUpdateClockSettings,
  pomodoroSettings,
  onUpdatePomodoroSettings,
  userName,
  onOpenNameModal,
  onResetDefaults,
  onReplayIntro,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('clock');
  const [activeSoundPreviewPhase, setActiveSoundPreviewPhase] = useState<string | null>(null);
  const [previewPomoPhase, setPreviewPomoPhase] = useState<'work' | 'shortBreak' | 'longBreak'>('work');

  const fileInputWorkRef = useRef<HTMLInputElement | null>(null);
  const fileInputBreakRef = useRef<HTMLInputElement | null>(null);
  const fileInputLongBreakRef = useRef<HTMLInputElement | null>(null);

  // Standby Wallpaper & High-Capacity Offline Storage State
  const [storageInfo, setStorageInfo] = useState<{
    usedBytes: number;
    formattedUsed: string;
    quotaFormatted: string;
    isHighCapacity: boolean;
  } | null>(null);
  const [wallpaperLoading, setWallpaperLoading] = useState<boolean>(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [slideshowCount, setSlideshowCount] = useState<number>(0);
  const [hasCustomVideo, setHasCustomVideo] = useState<boolean>(false);
  const [hasSingleImage, setHasSingleImage] = useState<boolean>(false);
  const [hasDepthMask, setHasDepthMask] = useState<boolean>(false);
  const [depthMaskPreviewUrl, setDepthMaskPreviewUrl] = useState<string | null>(null);
  const [isAutoSegmenting, setIsAutoSegmenting] = useState<boolean>(false);
  const [segmentSensitivity, setSegmentSensitivity] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [previewWallpaperUrl, setPreviewWallpaperUrl] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState<boolean>(false);

  const fileInputSingleRef = useRef<HTMLInputElement | null>(null);
  const fileInputSlideshowRef = useRef<HTMLInputElement | null>(null);
  const fileInputVideoRef = useRef<HTMLInputElement | null>(null);
  const fileInputDepthMaskRef = useRef<HTMLInputElement | null>(null);

  const refreshStorageStats = async () => {
    try {
      const stats = await getStorageUsage();
      setStorageInfo(stats);

      const single = await getWallpaperItem('single-image');
      setHasSingleImage(!!single);
      if (single && single.data) {
        if (typeof single.data === 'string') {
          setPreviewWallpaperUrl(single.data);
        } else if (single.data instanceof Blob) {
          setPreviewWallpaperUrl(URL.createObjectURL(single.data as Blob));
        }
      } else {
        setPreviewWallpaperUrl(null);
      }

      const slides = await getWallpaperItem('slideshow-images');
      if (slides && Array.isArray(slides.data)) {
        setSlideshowCount(slides.data.length);
      } else {
        setSlideshowCount(0);
      }

      const video = await getWallpaperItem('live-video');
      setHasCustomVideo(!!video);

      const depth = await getWallpaperItem('depth-mask');
      setHasDepthMask(!!depth);
      if (depth && depth.data) {
        if (typeof depth.data === 'string') {
          setDepthMaskPreviewUrl(depth.data);
        } else if (depth.data instanceof Blob) {
          setDepthMaskPreviewUrl(URL.createObjectURL(depth.data as Blob));
        }
      } else {
        setDepthMaskPreviewUrl(null);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStorageStats();
    }
  }, [isOpen]);

  const handleAutoExtractSubjectMask = async (sensitivity = segmentSensitivity) => {
    let sourceDataUrl = previewWallpaperUrl;
    if (!sourceDataUrl) {
      const item = await getWallpaperItem('single-image');
      if (item && item.data) {
        if (typeof item.data === 'string') {
          sourceDataUrl = item.data;
        } else if (item.data instanceof Blob) {
          sourceDataUrl = URL.createObjectURL(item.data as Blob);
        }
      }
    }

    if (!sourceDataUrl) {
      setUploadStatusMsg('Please select or upload a wallpaper photo first.');
      setTimeout(() => setUploadStatusMsg(null), 3000);
      return;
    }

    setIsAutoSegmenting(true);
    setWallpaperLoading(true);
    setUploadStatusMsg('Analyzing photo & detecting main subject...');

    try {
      const maskDataUrl = await generateSubjectMask(sourceDataUrl, {
        sensitivity,
        onProgress: (status) => setUploadStatusMsg(status),
      });

      await saveWallpaperItem('depth-mask', maskDataUrl, 'auto-detected-subject.png');
      setHasDepthMask(true);
      setDepthMaskPreviewUrl(maskDataUrl);
      onUpdateClockSettings({
        depthEffect: true,
        wallpaperTimestamp: Date.now(),
      });
      await refreshStorageStats();
      setUploadStatusMsg('✨ Main subject extracted automatically!');
      setTimeout(() => setUploadStatusMsg(null), 3500);
    } catch (err) {
      console.error('Failed auto subject masking:', err);
      setUploadStatusMsg('Could not auto-extract subject from this image.');
      setTimeout(() => setUploadStatusMsg(null), 3500);
    } finally {
      setIsAutoSegmenting(false);
      setWallpaperLoading(false);
    }
  };

  const handleToggleDepthEffect = async (enable: boolean) => {
    onUpdateClockSettings({ depthEffect: enable });
    if (enable && !hasDepthMask) {
      await handleAutoExtractSubjectMask();
    }
  };

  const handleSingleImageFileProcess = async (file: File) => {
    if (!isSupportedImageFile(file)) {
      setUploadStatusMsg(`Unsupported file type: ${file.name}. Please upload JPG, PNG, WEBP, AVIF, GIF, BMP, or SVG.`);
      setTimeout(() => setUploadStatusMsg(null), 4000);
      return;
    }

    setWallpaperLoading(true);
    setUploadStatusMsg(`Optimizing photo "${file.name}"...`);
    try {
      const processed = await processImageFile(file);
      setUploadStatusMsg(`Saving ${processed.format} (${(processed.sizeBytes / (1024 * 1024)).toFixed(1)} MB)...`);
      await saveWallpaperItem('single-image', processed.dataUrl, file.name);
      setPreviewWallpaperUrl(processed.dataUrl);
      setHasSingleImage(true);

      // If depth effect is enabled, automatically extract subject from newly uploaded photo!
      if (clockSettings.depthEffect) {
        try {
          setUploadStatusMsg('Auto-detecting subject for Depth Effect...');
          const maskDataUrl = await generateSubjectMask(processed.dataUrl, {
            sensitivity: segmentSensitivity,
          });
          await saveWallpaperItem('depth-mask', maskDataUrl, 'auto-detected-subject.png');
          setHasDepthMask(true);
          setDepthMaskPreviewUrl(maskDataUrl);
        } catch (e) {
          console.warn('Auto depth mask generation skipped:', e);
        }
      }

      onUpdateClockSettings({
        wallpaperMode: 'image',
        customWallpaperName: file.name,
        wallpaperTimestamp: Date.now(),
      });
      await refreshStorageStats();
      setWallpaperLoading(false);
      setUploadStatusMsg(`Wallpaper "${file.name}" applied successfully!`);
      setTimeout(() => setUploadStatusMsg(null), 3500);
    } catch (err) {
      console.error('Failed to save photo wallpaper:', err);
      setWallpaperLoading(false);
      setUploadStatusMsg('Failed to process image. Please try another image.');
      setTimeout(() => setUploadStatusMsg(null), 4000);
    }
  };

  const handleSingleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await handleSingleImageFileProcess(file);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleSlideshowUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setWallpaperLoading(true);
    setUploadStatusMsg(`Processing ${files.length} wallpapers...`);
    try {
      const urls: string[] = [];
      const fileList: File[] = Array.from(files);
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        setUploadStatusMsg(`Optimizing photo ${i + 1} of ${fileList.length} (${f.name})...`);
        const processed = await processImageFile(f);
        urls.push(processed.dataUrl);
      }
      await saveWallpaperItem('slideshow-images', urls, `${fileList.length} photos`);
      setSlideshowCount(urls.length);
      onUpdateClockSettings({
        wallpaperMode: 'slideshow',
        wallpaperTimestamp: Date.now(),
      });
      await refreshStorageStats();
      setWallpaperLoading(false);
      setUploadStatusMsg(`Added ${urls.length} photos to slideshow!`);
      setTimeout(() => setUploadStatusMsg(null), 3500);
    } catch (err) {
      console.error('Failed to process slideshow files:', err);
      setWallpaperLoading(false);
      setUploadStatusMsg('Failed to process slideshow files.');
      setTimeout(() => setUploadStatusMsg(null), 4000);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleLiveVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWallpaperLoading(true);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadStatusMsg(`Saving live MP4 (${sizeMb} MB) to offline storage...`);
    try {
      await saveWallpaperItem('live-video', file, file.name);
      onUpdateClockSettings({
        wallpaperMode: 'video',
        liveVideoName: file.name,
      });
      await refreshStorageStats();
      setWallpaperLoading(false);
      setUploadStatusMsg(`Live video "${file.name}" ready!`);
      setTimeout(() => setUploadStatusMsg(null), 3500);
    } catch {
      setWallpaperLoading(false);
      setUploadStatusMsg('Failed to save live video.');
    }
  };

  const handleDepthMaskUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWallpaperLoading(true);
    setUploadStatusMsg('Saving foreground mask cutout...');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await saveWallpaperItem('depth-mask', dataUrl, file.name);
        onUpdateClockSettings({
          depthEffect: true,
        });
        await refreshStorageStats();
        setWallpaperLoading(false);
        setUploadStatusMsg('Depth effect foreground mask active!');
        setTimeout(() => setUploadStatusMsg(null), 3500);
      };
      reader.readAsDataURL(file);
    } catch {
      setWallpaperLoading(false);
      setUploadStatusMsg('Failed to save depth mask.');
    }
  };

  const handleClearWallpaper = async (type: 'single-image' | 'slideshow-images' | 'live-video' | 'depth-mask') => {
    await removeWallpaperItem(type);
    if (type === 'single-image') {
      setPreviewWallpaperUrl(null);
      onUpdateClockSettings({
        customWallpaperName: undefined,
        wallpaperMode: 'theme',
      });
    } else if (type === 'slideshow-images') {
      onUpdateClockSettings({
        wallpaperMode: 'theme',
      });
    } else if (type === 'live-video') {
      onUpdateClockSettings({
        liveVideoName: undefined,
        wallpaperMode: 'theme',
      });
    } else if (type === 'depth-mask') {
      setDepthMaskPreviewUrl(null);
      setHasDepthMask(false);
      onUpdateClockSettings({
        depthEffect: false,
      });
    }
    await refreshStorageStats();
  };

  if (!isOpen) return null;

  const currentTheme =
    THEME_PRESETS.find((t) => t.id === clockSettings.themeId) || THEME_PRESETS[0];

  const selectedFont =
    FONT_OPTIONS.find((f) => f.id === clockSettings.fontFamily) || FONT_OPTIONS[0];

  const selectedPomoFont =
    FONT_OPTIONS.find((f) => f.id === (pomodoroSettings.fontFamily || 'outfit')) || FONT_OPTIONS[0];

  const resolvedPomoTheme = getResolvedPomodoroTheme(pomodoroSettings, clockSettings, isDarkMode);

  const activePomoColor =
    previewPomoPhase === 'work'
      ? resolvedPomoTheme.workColor
      : previewPomoPhase === 'shortBreak'
      ? resolvedPomoTheme.shortBreakColor
      : resolvedPomoTheme.longBreakColor;

  const activePomoMinutes =
    previewPomoPhase === 'work'
      ? pomodoroSettings.workMinutes
      : previewPomoPhase === 'shortBreak'
      ? pomodoroSettings.shortBreakMinutes
      : pomodoroSettings.longBreakMinutes;

  const currentPomoCircle = pomodoroSettings.circleSize || 320;
  const currentPomoRingWidth = pomodoroSettings.ringWidth || 8;
  // Dynamically calculate the maximum allowable font size so digits never collide with or merge into the ring stroke
  const maxSafePomoFontSize = getMaxPomodoroFontSize(currentPomoCircle, currentPomoRingWidth);
  const effectivePomoFontSize =
    pomodoroSettings.timerFontSize && pomodoroSettings.timerFontSize > 0
      ? Math.min(pomodoroSettings.timerFontSize, maxSafePomoFontSize)
      : 0;

  const handlePomoCircleChange = (newSize: number) => {
    const newMaxSafe = getMaxPomodoroFontSize(newSize, currentPomoRingWidth);
    const currentFont = pomodoroSettings.timerFontSize || 0;
    if (currentFont > newMaxSafe) {
      // Automatically constrain font size down to the new safe boundary
      onUpdatePomodoroSettings({ circleSize: newSize, timerFontSize: newMaxSafe });
    } else {
      onUpdatePomodoroSettings({ circleSize: newSize });
    }
  };

  const ensureHex = (color: string | undefined, fallback: string): string => {
    if (!color) return fallback;
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
    if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    return fallback;
  };

  // Resolve custom colors
  const activeAmbientTheme =
    AMBIENT_THEMES.find((a) => a.id === (clockSettings.ambientTheme || 'none')) || AMBIENT_THEMES[0];
  const isAmbientActive = activeAmbientTheme && activeAmbientTheme.id !== 'none';

  const activePomoAmbientTheme =
    AMBIENT_THEMES.find((a) => a.id === (pomodoroSettings.ambientTheme || 'none')) || AMBIENT_THEMES[0];
  const isPomoAmbientActive = activePomoAmbientTheme && activePomoAmbientTheme.id !== 'none';

  const activeBg = isAmbientActive
    ? activeAmbientTheme.bgGradient
    : clockSettings.themeId === 'custom' && clockSettings.customBg
    ? clockSettings.customBg
    : currentTheme.bgClass.includes('bg-[')
    ? currentTheme.bgClass.replace('bg-[', '').replace(']', '')
    : currentTheme.id === 'oled-black'
    ? '#000000'
    : currentTheme.isDark
    ? '#0f111a'
    : '#f7f5f0';

  const activeTextColor = isAmbientActive
    ? activeAmbientTheme.textColor
    : clockSettings.themeId === 'custom' && clockSettings.customTextColor
    ? clockSettings.customTextColor
    : currentTheme.textColor;

  const activeAccentColor = isAmbientActive
    ? activeAmbientTheme.accentColor
    : clockSettings.themeId === 'custom' && clockSettings.customAccentColor
    ? clockSettings.customAccentColor
    : currentTheme.accentColor;

  // Handle custom audio file uploads
  const handleAudioUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'work' | 'break' | 'longBreak'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'work') {
        onUpdatePomodoroSettings({
          workSound: 'custom',
          customWorkSoundData: dataUrl,
          customWorkSoundName: file.name,
        });
        triggerSoundAlert('custom', dataUrl);
      } else if (type === 'break') {
        onUpdatePomodoroSettings({
          shortBreakSound: 'custom',
          customBreakSoundData: dataUrl,
          customBreakSoundName: file.name,
        });
        triggerSoundAlert('custom', dataUrl);
      } else {
        onUpdatePomodoroSettings({
          longBreakSound: 'custom',
          customLongBreakSoundData: dataUrl,
          customLongBreakSoundName: file.name,
        });
        triggerSoundAlert('custom', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="settings-modal-container"
        className="w-full max-w-5xl xl:max-w-6xl max-h-[92vh] bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header with Dark Mode Toggle */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-900/95">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Desk Clock Settings
              </h2>
              <p className="text-[11px] text-neutral-400">
                Live preview & customizable clocks, sounds, and intervals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Dark Mode Toggle */}
            <button
              id="settings-dark-mode-toggle"
              onClick={onToggleDarkMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-800/80 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors cursor-pointer"
              title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              id="settings-close-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-6 pt-2">
          <button
            id="tab-clock-btn"
            onClick={() => setActiveTab('clock')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'clock'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Clock & Appearance</span>
          </button>
          <button
            id="tab-pomodoro-btn"
            onClick={() => setActiveTab('pomodoro')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'pomodoro'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Pomodoro & Sound Alerts</span>
          </button>
          <button
            id="tab-general-btn"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio & Profile</span>
          </button>
        </div>

        {/* LIVE REAL-TIME PREVIEW CONTAINER */}
        <div className="px-6 pt-4 pb-3 bg-neutral-950/60 border-b border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Visual Preview (Updates Instantly)</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {activeTab === 'clock'
                ? isAmbientActive
                  ? `Ambient: ${activeAmbientTheme.name} • Font: ${selectedFont.name}`
                  : `Theme: ${currentTheme.name} • Font: ${selectedFont.name}`
                : activeTab === 'pomodoro'
                ? `Theme: ${POMODORO_THEME_PRESETS.find((p) => p.id === (pomodoroSettings.themeId || 'classic-tomato'))?.name || 'Custom'} • Font: ${selectedPomoFont.name}`
                : `Profile: ${userName || 'Friend'}`}
            </span>
          </div>

          <div
            id="settings-live-preview-box"
            className="w-full rounded-2xl p-4 transition-all duration-300 border border-neutral-700/80 shadow-inner flex flex-col items-center justify-center text-center overflow-hidden min-h-[110px] relative"
            style={{
              backgroundColor: activeTab === 'pomodoro' ? resolvedPomoTheme.bg : isAmbientActive ? undefined : activeBg,
              background:
                activeTab === 'clock' && isAmbientActive && (!clockSettings.wallpaperMode || clockSettings.wallpaperMode === 'theme')
                  ? activeAmbientTheme.bgGradient
                  : undefined,
              color: activeTab === 'pomodoro' ? resolvedPomoTheme.textColor : activeTextColor,
              filter: activeTab === 'clock' ? `brightness(${clockSettings.brightness}%)` : 'none',
            }}
          >
            {/* Custom Photo Wallpaper Preview Image */}
            {activeTab === 'clock' && clockSettings.wallpaperMode === 'image' && previewWallpaperUrl && (
              <img
                src={previewWallpaperUrl}
                alt="Wallpaper preview"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-2xl z-0"
                style={{
                  filter: clockSettings.wallpaperBlur ? `blur(${clockSettings.wallpaperBlur}px)` : undefined,
                }}
              />
            )}

            {/* Wallpaper Dimmer Overlay for Preview */}
            {activeTab === 'clock' && clockSettings.wallpaperMode === 'image' && previewWallpaperUrl && (
              <div
                className="absolute inset-0 bg-black pointer-events-none rounded-2xl z-[1]"
                style={{ opacity: (clockSettings.wallpaperOpacity ?? 25) / 100 }}
              />
            )}

            {/* Ambient Background layer in preview */}
            {activeTab === 'clock' && isAmbientActive && (!clockSettings.wallpaperMode || clockSettings.wallpaperMode === 'theme') && (
              <AmbientBackground
                ambientTheme={clockSettings.ambientTheme}
                particles={clockSettings.ambientParticles !== false}
                className="rounded-2xl"
              />
            )}

            {activeTab === 'clock' ? (
              <div className="relative z-10 w-full flex flex-col items-center">
                {(clockSettings.showDayOfWeek || clockSettings.showDate) && (
                  <div className="text-[11px] tracking-wider uppercase opacity-75 mb-1 font-sans">
                    {clockSettings.showDayOfWeek && <span>Thursday </span>}
                    {clockSettings.showDayOfWeek && clockSettings.showDate && <span>• </span>}
                    {clockSettings.showDate && <span>September 10, 2026</span>}
                  </div>
                )}
                <div
                  className="text-3xl sm:text-4xl tracking-wider flex items-baseline justify-center transition-all duration-200"
                  style={{
                    fontFamily: selectedFont.cssFamily,
                    color: activeTextColor,
                    textShadow: isAmbientActive
                      ? `0 0 20px ${activeAmbientTheme.glowColor}`
                      : 'none',
                  }}
                >
                  <span>10:45</span>
                  {clockSettings.showSeconds && (
                    <span className="text-xl opacity-75 ml-1" style={{ color: activeAccentColor }}>
                      :22
                    </span>
                  )}
                  {clockSettings.showAmPm && clockSettings.timeFormat === '12h' && (
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-current ml-2"
                      style={{ color: activeAccentColor }}
                    >
                      AM
                    </span>
                  )}
                </div>
                {clockSettings.showQuote && clockSettings.quoteText && (
                  <div className="text-[11px] opacity-75 italic mt-1 max-w-sm truncate font-sans">
                    &ldquo;{clockSettings.quoteText}&rdquo;
                  </div>
                )}
              </div>
            ) : activeTab === 'pomodoro' ? (
              <div className="w-full flex flex-col items-center gap-3">
                {/* Interactive Phase Preview Switcher */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/25 border border-white/10">
                  <button
                    id="preview-pomo-phase-work"
                    type="button"
                    onClick={() => setPreviewPomoPhase('work')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      previewPomoPhase === 'work'
                        ? 'text-white shadow-sm font-bold scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={
                      previewPomoPhase === 'work'
                        ? { backgroundColor: resolvedPomoTheme.workColor }
                        : {}
                    }
                  >
                    Focus ({pomodoroSettings.workMinutes}m)
                  </button>
                  <button
                    id="preview-pomo-phase-short"
                    type="button"
                    onClick={() => setPreviewPomoPhase('shortBreak')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      previewPomoPhase === 'shortBreak'
                        ? 'text-white shadow-sm font-bold scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={
                      previewPomoPhase === 'shortBreak'
                        ? { backgroundColor: resolvedPomoTheme.shortBreakColor }
                        : {}
                    }
                  >
                    Short Break ({pomodoroSettings.shortBreakMinutes}m)
                  </button>
                  <button
                    id="preview-pomo-phase-long"
                    type="button"
                    onClick={() => setPreviewPomoPhase('longBreak')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      previewPomoPhase === 'longBreak'
                        ? 'text-white shadow-sm font-bold scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={
                      previewPomoPhase === 'longBreak'
                        ? { backgroundColor: resolvedPomoTheme.longBreakColor }
                        : {}
                    }
                  >
                    Long Break ({pomodoroSettings.longBreakMinutes}m)
                  </button>
                </div>

                {/* Pomodoro Meter & Details Row */}
                <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8">
                  {/* Miniature Meter */}
                  <div className="relative w-[92px] h-[92px] flex items-center justify-center shrink-0">
                    <svg
                      width={92}
                      height={92}
                      viewBox="0 0 92 92"
                      className="transform -rotate-90 w-full h-full"
                    >
                      {/* Background track */}
                      <circle
                        cx={46}
                        cy={46}
                        r={37}
                        stroke={
                          resolvedPomoTheme.isDark
                            ? 'rgba(255, 255, 255, 0.14)'
                            : 'rgba(0, 0, 0, 0.1)'
                        }
                        strokeWidth={Math.max(3, Math.min(10, Math.round((pomodoroSettings.ringWidth || 8) * 0.7)))}
                        fill="transparent"
                      />
                      {/* Progress circle */}
                      <circle
                        cx={46}
                        cy={46}
                        r={37}
                        stroke={activePomoColor}
                        strokeWidth={Math.max(3, Math.min(10, Math.round((pomodoroSettings.ringWidth || 8) * 0.7)))}
                        strokeDasharray={232.48}
                        strokeDashoffset={232.48 * 0.3}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-300"
                        style={{
                          filter: resolvedPomoTheme.enableGlow
                            ? `drop-shadow(0 0 8px ${activePomoColor}90)`
                            : 'none',
                        }}
                      />
                    </svg>

                    {/* Digits and phase badge */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 pointer-events-none select-none">
                      <span
                        className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full border mb-0.5"
                        style={{
                          borderColor: `${activePomoColor}50`,
                          backgroundColor: `${activePomoColor}20`,
                          color: activePomoColor,
                        }}
                      >
                        {previewPomoPhase === 'work' ? 'FOCUS' : previewPomoPhase === 'shortBreak' ? 'SHORT' : 'LONG'}
                      </span>
                      <span
                        className="text-lg font-bold leading-none tracking-tight"
                        style={{
                          fontFamily: selectedPomoFont.cssFamily,
                          color: resolvedPomoTheme.textColor,
                        }}
                      >
                        {String(activePomoMinutes).padStart(2, '0')}:00
                      </span>
                    </div>
                  </div>

                  {/* Meter Specs Badges */}
                  <div className="flex flex-col items-start gap-1.5 text-left text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] opacity-75 font-sans">Active Color:</span>
                      <div className="flex items-center gap-1 font-mono text-[11px] font-bold">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20 inline-block shadow-sm"
                          style={{ backgroundColor: activePomoColor }}
                        />
                        <span className="uppercase">{activePomoColor}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] opacity-80">
                      <span className="px-2 py-0.5 rounded-md bg-black/20 border border-white/10 font-mono">
                        Ring: {pomodoroSettings.ringWidth || 8}px
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-black/20 border border-white/10 font-mono">
                        {pomodoroSettings.enableGlow !== false ? 'Glow: ON' : 'Glow: OFF'}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-60 italic">
                      Click phases above to preview each color
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="text-left font-sans">
                  <span className="text-xs opacity-75 block">Profile & Audio Setup</span>
                  <span className="text-base font-bold">{userName || 'Friend'}</span>
                </div>
                <div className="h-6 w-px bg-neutral-700" />
                <button
                  type="button"
                  onClick={() => playHourlyChime()}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Test Audio Chime</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: CLOCK & APPEARANCE */}
          {activeTab === 'clock' && (
            <div className="space-y-6">
              {/* AMBIENT THEMES SECTION */}
              <div className="space-y-4 p-4 rounded-2xl bg-neutral-950/80 border border-amber-500/20 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>Ambient Atmospheres & Moods</span>
                    </label>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Transform your desk clock with living procedural atmospheres and calming soundscapes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      id="ambient-theme-none-btn"
                      onClick={() =>
                        onUpdateClockSettings({
                          ambientTheme: 'none',
                          ambientSoundEnabled: false,
                        })
                      }
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        clockSettings.ambientTheme === 'none' || !clockSettings.ambientTheme
                          ? 'border-neutral-500 bg-neutral-800 text-white font-semibold'
                          : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      Minimal Clean (Off)
                    </button>
                  </div>
                </div>

                {/* Ambient Themes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 max-h-[380px] overflow-y-auto pr-1">
                  {AMBIENT_THEMES.filter((t) => t.id !== 'none').map((ambient) => {
                    const isSelected = (clockSettings.ambientTheme || 'none') === ambient.id;
                    return (
                      <button
                        key={ambient.id}
                        id={`ambient-theme-card-${ambient.id}`}
                        type="button"
                        onClick={() => {
                          onUpdateClockSettings({
                            ambientTheme: ambient.id,
                            ...(ambient.soundType && ambient.soundType !== 'none'
                              ? { ambientSoundEnabled: clockSettings.ambientSoundEnabled }
                              : {}),
                          });
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[90px] cursor-pointer group ${
                          isSelected
                            ? 'border-sky-400 bg-sky-500/15 ring-2 ring-sky-400/30 shadow-md'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div
                            className="w-7 h-7 rounded-lg border border-neutral-700 relative overflow-hidden shadow-inner flex-shrink-0"
                            style={{ background: ambient.bgGradient }}
                          >
                            <span
                              className="absolute inset-0 m-auto w-2 h-2 rounded-full"
                              style={{ backgroundColor: ambient.accentColor }}
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            {ambient.soundType && ambient.soundType !== 'none' && (
                              <span
                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-0.5"
                                title={`Includes audio: ${ambient.soundLabel}`}
                              >
                                <Headphones className="w-2.5 h-2.5" />
                                <span>Audio</span>
                              </span>
                            )}
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-sky-400 text-neutral-950 flex items-center justify-center flex-shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-neutral-100 block group-hover:text-sky-300 transition-colors">
                            {ambient.name}
                          </span>
                          <span className="text-[11px] text-neutral-400 line-clamp-1 block mt-0.5">
                            {ambient.tagline}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Ambient Sound & Particle Options */}
                {isAmbientActive && (
                  <div className="mt-3 pt-3 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Audio soundscape toggle & volume */}
                    {activeAmbientTheme.soundType && activeAmbientTheme.soundType !== 'none' ? (
                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-200 flex items-center gap-1.5">
                            <Headphones className="w-3.5 h-3.5 text-sky-400" />
                            <span>Ambient Soundscape</span>
                          </span>
                          <button
                            type="button"
                            id="ambient-sound-toggle-btn"
                            onClick={() =>
                              onUpdateClockSettings({
                                ambientSoundEnabled: !clockSettings.ambientSoundEnabled,
                              })
                            }
                            className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase cursor-pointer ${
                              clockSettings.ambientSoundEnabled
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                                : 'bg-neutral-800 text-neutral-400 hover:text-neutral-300'
                            }`}
                          >
                            {clockSettings.ambientSoundEnabled ? 'Active' : 'Muted'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>{activeAmbientTheme.soundLabel}</span>
                          <span className="font-mono">{clockSettings.ambientSoundVolume ?? 35}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={clockSettings.ambientSoundVolume ?? 35}
                          onChange={(e) =>
                            onUpdateClockSettings({
                              ambientSoundVolume: Number(e.target.value),
                              ambientSoundEnabled: true,
                            })
                          }
                          className="w-full accent-sky-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center text-xs text-neutral-400">
                        <span>This atmosphere is visually ambient without background noise.</span>
                      </div>
                    )}

                    {/* Particle motion toggle */}
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-medium text-neutral-200 block">
                          Visual Particles & Atmosphere
                        </span>
                        <span className="text-[11px] text-neutral-400 block mt-0.5">
                          Render animated background embers, stars, and rain
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800">
                        <span className="text-xs text-neutral-400">Floating Particles</span>
                        <button
                          type="button"
                          id="ambient-particles-toggle"
                          onClick={() =>
                            onUpdateClockSettings({
                              ambientParticles: clockSettings.ambientParticles === false ? true : false,
                            })
                          }
                          className={`text-[10px] px-2.5 py-1 rounded font-mono uppercase cursor-pointer ${
                            clockSettings.ambientParticles !== false
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {clockSettings.ambientParticles !== false ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Standard Color Theme Presets</span>
                  </label>
                  {isAmbientActive && (
                    <span className="text-[10px] text-amber-400/90 font-mono">
                      (Ambient theme active)
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {THEME_PRESETS.map((theme) => {
                    const isSelected = clockSettings.themeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        id={`theme-btn-${theme.id}`}
                        onClick={() => {
                          onUpdateClockSettings({
                            themeId: theme.id,
                            ...(theme.id !== 'custom'
                              ? {
                                  customBg: '',
                                  customTextColor: theme.textColor,
                                  customAccentColor: theme.accentColor,
                                }
                              : {}),
                          });
                          if (theme.isDark !== undefined && theme.isDark !== isDarkMode) {
                            onToggleDarkMode();
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-20 cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div
                            className="w-5 h-5 rounded-full border border-neutral-700 flex items-center justify-center"
                            style={{
                              backgroundColor:
                                theme.id === 'custom'
                                  ? clockSettings.customBg || '#111'
                                  : theme.bgClass.includes('bg-[')
                                  ? theme.bgClass.replace('bg-[', '').replace(']', '')
                                  : theme.id === 'oled-black'
                                  ? '#000000'
                                  : theme.isDark
                                  ? '#0f111a'
                                  : '#f7f5f0',
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  theme.id === 'custom'
                                    ? clockSettings.customTextColor || '#fff'
                                    : theme.textColor,
                              }}
                            />
                          </div>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-neutral-200 truncate">
                          {theme.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  Fine-tune Colors (Real-Time Palette)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="custom-bg-picker"
                        value={ensureHex(clockSettings.customBg || activeBg, '#0f111a')}
                        onChange={(e) =>
                          onUpdateClockSettings({
                            themeId: 'custom',
                            customBg: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-neutral-300 uppercase truncate">
                        {clockSettings.customBg || currentTheme.name}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">
                      Digits Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="custom-text-picker"
                        value={ensureHex(clockSettings.customTextColor || activeTextColor, '#ffffff')}
                        onChange={(e) =>
                          onUpdateClockSettings({
                            themeId: 'custom',
                            customTextColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-neutral-300 uppercase truncate">
                        {clockSettings.customTextColor || currentTheme.textColor}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="custom-accent-picker"
                        value={ensureHex(clockSettings.customAccentColor || activeAccentColor, '#f59e0b')}
                        onChange={(e) =>
                          onUpdateClockSettings({
                            themeId: 'custom',
                            customAccentColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-neutral-300 uppercase truncate">
                        {clockSettings.customAccentColor || currentTheme.accentColor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extended Typography & Font Picker (13 Fonts) */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-amber-400" />
                  <span>Clock Digit Fonts ({FONT_OPTIONS.length} Distinct Styles)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {FONT_OPTIONS.map((font) => {
                    const isSelected = clockSettings.fontFamily === font.id;
                    return (
                      <button
                        key={font.id}
                        id={`font-btn-${font.id}`}
                        onClick={() => onUpdateClockSettings({ fontFamily: font.id })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/10 text-white shadow-sm'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40 text-neutral-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-neutral-400 font-sans truncate">
                            {font.name}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                        </div>
                        <span
                          className="text-base tracking-wider block truncate"
                          style={{ fontFamily: font.cssFamily }}
                        >
                          {font.sample}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Digit Size & Scale */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Digit Size On Screen</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['medium', 'large', 'huge', 'fill'] as ClockDigitSize[]).map((size) => {
                    const isSelected = clockSettings.digitSize === size;
                    return (
                      <button
                        key={size}
                        id={`size-btn-${size}`}
                        onClick={() => onUpdateClockSettings({ digitSize: size })}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40 text-neutral-400'
                        }`}
                      >
                        {size === 'fill' ? 'Fill View' : size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* What to see on screen */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>What to See on Screen</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Seconds */}
                  <label
                    id="toggle-seconds-label"
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-medium text-neutral-200 block">
                        Seconds Counter
                      </span>
                      <span className="text-[11px] text-neutral-500">Display active seconds</span>
                    </div>
                    <input
                      type="checkbox"
                      id="toggle-seconds"
                      checked={clockSettings.showSeconds}
                      onChange={(e) => onUpdateClockSettings({ showSeconds: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700"
                    />
                  </label>

                  {/* 12h / 24h format */}
                  <label
                    id="toggle-format-label"
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-medium text-neutral-200 block">
                        24-Hour Military Format
                      </span>
                      <span className="text-[11px] text-neutral-500">Toggle 12h vs 24h</span>
                    </div>
                    <input
                      type="checkbox"
                      id="toggle-format"
                      checked={clockSettings.timeFormat === '24h'}
                      onChange={(e) =>
                        onUpdateClockSettings({ timeFormat: e.target.checked ? '24h' : '12h' })
                      }
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700"
                    />
                  </label>

                  {/* AM/PM */}
                  <label
                    id="toggle-ampm-label"
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-medium text-neutral-200 block">
                        AM / PM Indicator
                      </span>
                      <span className="text-[11px] text-neutral-500">(Active in 12h mode)</span>
                    </div>
                    <input
                      type="checkbox"
                      id="toggle-ampm"
                      checked={clockSettings.showAmPm}
                      onChange={(e) => onUpdateClockSettings({ showAmPm: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700"
                    />
                  </label>

                  {/* Day of Week */}
                  <label
                    id="toggle-day-label"
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-medium text-neutral-200 block">Day of Week</span>
                      <span className="text-[11px] text-neutral-500">e.g., Thursday, Monday</span>
                    </div>
                    <input
                      type="checkbox"
                      id="toggle-day"
                      checked={clockSettings.showDayOfWeek}
                      onChange={(e) => onUpdateClockSettings({ showDayOfWeek: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700"
                    />
                  </label>

                  {/* Full Date */}
                  <label
                    id="toggle-date-label"
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-medium text-neutral-200 block">
                        Full Calendar Date
                      </span>
                      <span className="text-[11px] text-neutral-500">e.g., September 10, 2026</span>
                    </div>
                    <input
                      type="checkbox"
                      id="toggle-date"
                      checked={clockSettings.showDate}
                      onChange={(e) => onUpdateClockSettings({ showDate: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700"
                    />
                  </label>

                  {/* Focus Mantra */}
                  <label
                    id="toggle-quote-label"
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-medium text-neutral-200 block">
                        Focus Mantra / Quote
                      </span>
                      <span className="text-[11px] text-neutral-500">Customizable inspiration</span>
                    </div>
                    <input
                      type="checkbox"
                      id="toggle-quote"
                      checked={clockSettings.showQuote}
                      onChange={(e) => onUpdateClockSettings({ showQuote: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700"
                    />
                  </label>
                </div>

                {/* Custom Quote text input */}
                {clockSettings.showQuote && (
                  <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="quote-text-input" className="text-xs text-neutral-300 font-medium">
                        Customize Desk Mantra / Goal:
                      </label>
                      <button
                        id="random-quote-btn"
                        type="button"
                        onClick={() => {
                          const rand =
                            SAMPLE_QUOTES[Math.floor(Math.random() * SAMPLE_QUOTES.length)];
                          onUpdateClockSettings({ quoteText: rand });
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Shuffle</span>
                      </button>
                    </div>
                    <input
                      id="quote-text-input"
                      type="text"
                      value={clockSettings.quoteText}
                      onChange={(e) => onUpdateClockSettings({ quoteText: e.target.value })}
                      maxLength={90}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                      placeholder="Enter a motivational note or intention..."
                    />
                  </div>
                )}
              </div>

              {/* Brightness Dimmer */}
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Screen Brightness Dimmer</span>
                  </span>
                  <span className="font-mono text-amber-400">{clockSettings.brightness}%</span>
                </div>
                <input
                  id="brightness-slider"
                  type="range"
                  min={20}
                  max={100}
                  step={5}
                  value={clockSettings.brightness}
                  onChange={(e) =>
                    onUpdateClockSettings({ brightness: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* STANDBY MODE & iOS 26 VISUAL CUSTOMIZATION SUITE */}
              <div className="space-y-5 p-4 rounded-2xl bg-neutral-950 border border-sky-500/25 shadow-xl">
                {/* Header & Storage Capacity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        <SlidersHorizontal className="w-4 h-4" />
                      </span>
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                        Standby Clock & iOS 26 Customization
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
                        iOS 26 Style
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Desk standby display with elongated typography, liquid glass refractions, custom wallpapers, slideshows, and live MP4 loops.
                    </p>
                  </div>

                  {/* High Capacity Storage Indicator */}
                  <div className="flex items-center gap-2 self-start sm:self-auto bg-neutral-900/90 px-3 py-1.5 rounded-xl border border-neutral-800 text-right">
                    <HardDrive className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <div className="text-left">
                      <div className="text-[10px] text-neutral-400 leading-tight">
                        Offline Storage Quota
                      </div>
                      <div className="text-xs font-mono font-semibold text-sky-300">
                        {storageInfo ? `${storageInfo.formattedUsed} used of ${storageInfo.quotaFormatted}` : 'IndexedDB Active (500MB+)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Message Notification */}
                {uploadStatusMsg && (
                  <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-xs text-sky-200 flex items-center gap-2 animate-fadeIn">
                    <Sparkles className="w-4 h-4 text-sky-400 shrink-0 animate-spin" />
                    <span>{uploadStatusMsg}</span>
                  </div>
                )}

                {/* 1. STANDBY WALLPAPER ENGINE (Image, Slideshow & Live MP4) */}
                <div className="space-y-4 p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                      <span>Standby Wallpaper Engine</span>
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">High-Res & Video</span>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'theme', label: 'Theme Preset', icon: Palette },
                      { id: 'image', label: 'Single Photo', icon: ImageIcon },
                      { id: 'slideshow', label: 'Photo Slideshow', icon: Layers },
                      { id: 'video', label: 'Live Video (MP4)', icon: Film },
                    ].map((tab) => {
                      const isCurrent =
                        (clockSettings.wallpaperMode ?? 'theme') === tab.id;
                      const IconComponent = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => onUpdateClockSettings({ wallpaperMode: tab.id as WallpaperMode })}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer ${
                            isCurrent
                              ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-bold'
                              : 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mode-Specific Uploader: Single Photo */}
                  {clockSettings.wallpaperMode === 'image' && (
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-white block">Custom Photo Wallpaper</span>
                          <span className="text-[11px] text-neutral-400">
                            Upload your personal photo to display with the standby clock.
                          </span>
                        </div>
                        {hasSingleImage && (
                          <button
                            type="button"
                            onClick={() => handleClearWallpaper('single-image')}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Drag & Drop / Click Zone */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingPhoto(true);
                        }}
                        onDragLeave={() => setIsDraggingPhoto(false)}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setIsDraggingPhoto(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            await handleSingleImageFileProcess(file);
                          }
                        }}
                        onClick={() => fileInputSingleRef.current?.click()}
                        className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2.5 ${
                          isDraggingPhoto
                            ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
                            : hasSingleImage
                            ? 'border-neutral-700 hover:border-sky-500/60 bg-neutral-900/50 hover:bg-neutral-900/80'
                            : 'border-neutral-800 hover:border-sky-500/50 bg-neutral-900/30 hover:bg-neutral-900/60'
                        }`}
                      >
                        <input
                          ref={fileInputSingleRef}
                          type="file"
                          accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.svg,.jfif,.pjpeg,.heic,.heif,.JPG,.JPEG,.PNG"
                          className="hidden"
                          onChange={handleSingleImageUpload}
                        />

                        {hasSingleImage && previewWallpaperUrl ? (
                          <div className="w-full flex items-center gap-3 text-left">
                            <img
                              src={previewWallpaperUrl}
                              alt="Loaded Wallpaper"
                              className="w-14 h-14 rounded-lg object-cover border border-neutral-700 shadow-md shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-white truncate">
                                {clockSettings.customWallpaperName || 'Current Photo Wallpaper'}
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Active on standby screen • Click or drop new photo to replace
                              </p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  ✓ Ready
                                </span>
                                <span className="text-[10px] text-sky-400 hover:underline">
                                  Change Photo...
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                              <Upload className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">
                                Drop your image here, or <span className="text-sky-400 underline">browse</span>
                              </p>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                High-res photos are automatically optimized for instant display
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Format Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mr-1">
                          Supported Formats:
                        </span>
                        {['JPG / JPEG', 'PNG', 'WebP', 'AVIF', 'GIF', 'BMP', 'SVG', 'HEIC'].map((fmt) => (
                          <span
                            key={fmt}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400"
                          >
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mode-Specific Uploader: Photo Slideshow */}
                  {clockSettings.wallpaperMode === 'slideshow' && (
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-white block">Multi-Photo Slideshow</span>
                          <span className="text-[11px] text-neutral-400">
                            Select multiple images to rotate as living standby backgrounds.
                          </span>
                        </div>
                        {slideshowCount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearWallpaper('slideshow-images')}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Clear Playlist</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          ref={fileInputSlideshowRef}
                          type="file"
                          accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.svg,.jfif,.pjpeg,.heic,.heif,.JPG,.JPEG,.PNG"
                          multiple
                          className="hidden"
                          onChange={handleSlideshowUpload}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputSlideshowRef.current?.click()}
                          disabled={wallpaperLoading}
                          className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Multiple Photos</span>
                        </button>
                        <span className="text-xs font-mono text-sky-400">
                          {slideshowCount > 0 ? `${slideshowCount} photos in playlist` : 'No photos selected'}
                        </span>
                      </div>

                      {/* Slideshow Interval Slider */}
                      <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-300 font-medium">Slideshow Change Interval</span>
                          <span className="font-mono text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded">
                            {clockSettings.slideshowIntervalSeconds ?? 30}s
                          </span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={120}
                          step={5}
                          value={clockSettings.slideshowIntervalSeconds ?? 30}
                          onChange={(e) =>
                            onUpdateClockSettings({
                              slideshowIntervalSeconds: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Mode-Specific Uploader: Live MP4 Video */}
                  {clockSettings.wallpaperMode === 'video' && (
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-white block">Live MP4 Video Wallpaper</span>
                          <span className="text-[11px] text-neutral-400">
                            Set an MP4 video clip to loop smoothly underneath the standby clock.
                          </span>
                        </div>
                        {hasCustomVideo && (
                          <button
                            type="button"
                            onClick={() => handleClearWallpaper('live-video')}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Video</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          ref={fileInputVideoRef}
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={handleLiveVideoUpload}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputVideoRef.current?.click()}
                          disabled={wallpaperLoading}
                          className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{hasCustomVideo ? 'Change MP4 Video' : 'Upload MP4 Video'}</span>
                        </button>
                        {clockSettings.liveVideoName && (
                          <span className="text-xs font-mono text-neutral-400 truncate max-w-xs">
                            {clockSettings.liveVideoName}
                          </span>
                        )}
                      </div>

                      {/* Battery Optimization Indicator */}
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-300">
                        <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          Battery Saver Active: Video and slideshow automatically halt when the browser tab is hidden or minimized.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Wallpaper Dimmer Overlay & Blur (Available for Image, Slideshow & Video) */}
                  {clockSettings.wallpaperMode && clockSettings.wallpaperMode !== 'theme' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-300">Readability Dimmer Overlay</span>
                          <span className="font-mono text-sky-400">{clockSettings.wallpaperOpacity ?? 25}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={80}
                          step={5}
                          value={clockSettings.wallpaperOpacity ?? 25}
                          onChange={(e) =>
                            onUpdateClockSettings({ wallpaperOpacity: parseInt(e.target.value, 10) })
                          }
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-300">Background Gaussian Blur</span>
                          <span className="font-mono text-sky-400">{clockSettings.wallpaperBlur ?? 0}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          step={1}
                          value={clockSettings.wallpaperBlur ?? 0}
                          onChange={(e) =>
                            onUpdateClockSettings({ wallpaperBlur: parseInt(e.target.value, 10) })
                          }
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. STANDBY DEPTH EFFECT (SPATIAL LAYERING BEHIND SUBJECT) */}
                <div className="space-y-3.5 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-sky-400" />
                        <span>Depth Effect (Spatial Layering)</span>
                      </span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        Places clock numbers physically behind your photo's foreground subject.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!clockSettings.depthEffect}
                        onChange={(e) => handleToggleDepthEffect(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>

                  {clockSettings.depthEffect && (
                    <div className="space-y-3.5 pt-2 border-t border-neutral-800">
                      {/* Automated Subject Masking Panel */}
                      <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/90 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                              <Wand2 className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-neutral-200 block">
                                Automatic Subject Masking
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                The app automatically identifies and cuts out the main subject
                              </span>
                            </div>
                          </div>
                          {hasDepthMask && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                              Active Cutout
                            </span>
                          )}
                        </div>

                        {/* Preview or Extraction Button */}
                        {depthMaskPreviewUrl ? (
                          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                            {/* Mask Thumbnail with Checkerboard background */}
                            <div
                              className="w-14 h-14 rounded-lg border border-neutral-700 overflow-hidden relative flex-shrink-0 bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:8px_8px] bg-neutral-950"
                              title="Extracted subject foreground cutout"
                            >
                              <img
                                src={depthMaskPreviewUrl}
                                alt="Detected Subject Cutout"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-neutral-200 truncate">
                                Main Subject Cutout Ready
                              </p>
                              <p className="text-[10px] text-neutral-400 mt-0.5">
                                Clock digits are positioned behind this extracted layer.
                              </p>

                              {/* Sensitivity Selector */}
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[10px] text-neutral-400">Detail:</span>
                                {(['low', 'balanced', 'high'] as const).map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                      setSegmentSensitivity(s);
                                      handleAutoExtractSubjectMask(s);
                                    }}
                                    disabled={isAutoSegmenting}
                                    className={`text-[10px] px-2 py-0.5 rounded capitalize transition-colors ${
                                      segmentSensitivity === s
                                        ? 'bg-sky-500/30 text-sky-300 border border-sky-500/50'
                                        : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAutoExtractSubjectMask()}
                                disabled={isAutoSegmenting}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                                title="Re-detect subject with current wallpaper"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isAutoSegmenting ? 'animate-spin' : ''}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleClearWallpaper('depth-mask')}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-900/40 text-neutral-400 hover:text-rose-400 transition-colors"
                                title="Remove depth mask"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => handleAutoExtractSubjectMask()}
                              disabled={isAutoSegmenting}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                            >
                              {isAutoSegmenting ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Analyzing Photo & Segmenting Subject...</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-3.5 h-3.5" />
                                  <span>Auto-Detect & Mask Main Subject</span>
                                </>
                              )}
                            </button>
                            <p className="text-[10px] text-neutral-400 text-center">
                              No manual cutout needed. The web app isolates the person, pet, or object automatically.
                            </p>
                          </div>
                        )}

                        {/* Optional Manual PNG Override */}
                        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px]">
                          <span className="text-neutral-500">Optional: Use custom edited PNG</span>
                          <input
                            ref={fileInputDepthMaskRef}
                            type="file"
                            accept="image/png,image/webp"
                            className="hidden"
                            onChange={handleDepthMaskUpload}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputDepthMaskRef.current?.click()}
                            className="text-neutral-400 hover:text-neutral-200 underline text-[10px] cursor-pointer"
                          >
                            Upload custom file
                          </button>
                        </div>
                      </div>

                      {/* Depth Intensity */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-300">Spatial Depth Drop-Shadow</span>
                          <span className="font-mono text-sky-400">{clockSettings.depthIntensity ?? 60}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          step={5}
                          value={clockSettings.depthIntensity ?? 60}
                          onChange={(e) =>
                            onUpdateClockSettings({ depthIntensity: parseInt(e.target.value, 10) })
                          }
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POMODORO & SOUND ALERTS */}
          {activeTab === 'pomodoro' && (
            <div className="space-y-6">
              {/* SECTION 0: POMODORO AMBIENT THEMES & BACKGROUNDS */}
              <div className="space-y-3 p-4 rounded-2xl bg-neutral-950/80 border border-amber-500/20 shadow-lg">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Pomodoro Ambient Themes & Backgrounds</span>
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                    {AMBIENT_THEMES.length - 1} Atmospheres
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>Pomodoro Focus Atmospheres & Themes</span>
                    </label>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Surround your study sessions with dynamic ambient procedural themes and calming soundscapes.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="pomo-ambient-theme-none-btn"
                    onClick={() =>
                      onUpdatePomodoroSettings({
                        ambientTheme: 'none',
                        ambientSoundEnabled: false,
                      })
                    }
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer self-start sm:self-auto ${
                      pomodoroSettings.ambientTheme === 'none' || !pomodoroSettings.ambientTheme
                        ? 'border-neutral-500 bg-neutral-800 text-white font-semibold'
                        : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Minimal Clean (Off)
                  </button>
                </div>

                {/* Ambient Themes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 max-h-[380px] overflow-y-auto pr-1">
                  {AMBIENT_THEMES.filter((t) => t.id !== 'none').map((ambient) => {
                    const isSelected = (pomodoroSettings.ambientTheme || 'none') === ambient.id;
                    return (
                      <button
                        key={ambient.id}
                        id={`pomo-ambient-card-${ambient.id}`}
                        type="button"
                        onClick={() => {
                          onUpdatePomodoroSettings({
                            ambientTheme: ambient.id,
                            ...(ambient.soundType && ambient.soundType !== 'none'
                              ? { ambientSoundEnabled: pomodoroSettings.ambientSoundEnabled }
                              : {}),
                          });
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[90px] cursor-pointer group ${
                          isSelected
                            ? 'border-sky-400 bg-sky-500/15 ring-2 ring-sky-400/30 shadow-md'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div
                            className="w-7 h-7 rounded-lg border border-neutral-700 relative overflow-hidden shadow-inner flex-shrink-0"
                            style={{ background: ambient.bgGradient }}
                          >
                            <span
                              className="absolute inset-0 m-auto w-2 h-2 rounded-full"
                              style={{ backgroundColor: ambient.accentColor }}
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            {ambient.soundType && ambient.soundType !== 'none' && (
                              <span
                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-0.5"
                                title={`Includes audio: ${ambient.soundLabel}`}
                              >
                                <Headphones className="w-2.5 h-2.5" />
                                <span>Audio</span>
                              </span>
                            )}
                            {isSelected && (
                              <span className="w-4 h-4 rounded-full bg-sky-400 text-neutral-950 flex items-center justify-center flex-shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-neutral-100 block group-hover:text-sky-300 transition-colors">
                            {ambient.name}
                          </span>
                          <span className="text-[11px] text-neutral-400 line-clamp-1 block mt-0.5">
                            {ambient.tagline}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Ambient Sound & Particle Options */}
                {isPomoAmbientActive && (
                  <div className="mt-3 pt-3 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Audio soundscape toggle & volume */}
                    {activePomoAmbientTheme.soundType && activePomoAmbientTheme.soundType !== 'none' ? (
                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-200 flex items-center gap-1.5">
                            <Headphones className="w-3.5 h-3.5 text-sky-400" />
                            <span>Ambient Soundscape</span>
                          </span>
                          <button
                            type="button"
                            id="pomo-ambient-sound-toggle-btn"
                            onClick={() =>
                              onUpdatePomodoroSettings({
                                ambientSoundEnabled: !pomodoroSettings.ambientSoundEnabled,
                              })
                            }
                            className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase cursor-pointer ${
                              pomodoroSettings.ambientSoundEnabled
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                                : 'bg-neutral-800 text-neutral-400 hover:text-neutral-300'
                            }`}
                          >
                            {pomodoroSettings.ambientSoundEnabled ? 'Active' : 'Muted'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span>{activePomoAmbientTheme.soundLabel}</span>
                          <span className="font-mono">{pomodoroSettings.ambientSoundVolume ?? 35}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={pomodoroSettings.ambientSoundVolume ?? 35}
                          onChange={(e) =>
                            onUpdatePomodoroSettings({
                              ambientSoundVolume: parseInt(e.target.value, 10),
                              ambientSoundEnabled: true,
                            })
                          }
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 flex items-center gap-2 text-neutral-400 text-xs">
                        <span>Pure visual atmosphere without audio</span>
                      </div>
                    )}

                    {/* Particle motion toggle */}
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-neutral-200 block">
                          Atmospheric Motion
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          Wave motion, rain droplets & visual effects
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        id="pomo-ambient-particles-toggle"
                        checked={pomodoroSettings.ambientParticles !== false}
                        onChange={(e) =>
                          onUpdatePomodoroSettings({ ambientParticles: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 1: POMODORO COLOR THEMES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pomodoro Theme Presets</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdatePomodoroSettings({
                        themeId: 'classic-tomato',
                        customBg: '#0a0a0a',
                        customTextColor: '#ffffff',
                        customWorkColor: '#ef4444',
                        customShortBreakColor: '#0284c7',
                        customLongBreakColor: '#10b981',
                        ringWidth: 8,
                        enableGlow: true,
                      });
                    }}
                    className="text-[11px] text-neutral-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Pomodoro Theme</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {POMODORO_THEME_PRESETS.map((preset) => {
                    const isSelected = (pomodoroSettings.themeId || 'classic-tomato') === preset.id;
                    return (
                      <button
                        key={preset.id}
                        id={`pomo-theme-btn-${preset.id}`}
                        type="button"
                        onClick={() => {
                          onUpdatePomodoroSettings({
                            themeId: preset.id,
                            customBg: preset.bgColor,
                            customTextColor: preset.textColor,
                            customWorkColor: preset.workColor,
                            customShortBreakColor: preset.shortBreakColor,
                            customLongBreakColor: preset.longBreakColor,
                          });
                          if (preset.isDark !== undefined && preset.isDark !== isDarkMode) {
                            onToggleDarkMode();
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/20 bg-neutral-900 shadow-md'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-semibold text-neutral-200 truncate">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2">
                          <span>{preset.isDark ? 'Dark Theme' : 'Light Theme'}</span>
                          {preset.id === 'sync' && (
                            <span className="text-amber-400 font-medium">Clock Sync</span>
                          )}
                        </div>

                        {/* Phase color preview indicators */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-800/60">
                          <span className="text-[10px] text-neutral-400 font-mono">Colors:</span>
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            title="Focus color"
                            style={{ backgroundColor: preset.workColor }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            title="Short Break color"
                            style={{ backgroundColor: preset.shortBreakColor }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            title="Long Break color"
                            style={{ backgroundColor: preset.longBreakColor }}
                          />
                          {preset.id === 'sync' && (
                            <span className="text-[10px] text-amber-400/80 italic ml-1">
                              (Auto syncs)
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: POMODORO METER & PROGRESS RING STYLING */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Meter & Progress Ring Styling</span>
                </span>

                {/* Ring Width Selection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400 font-medium">Progress Ring Stroke Width</span>
                    <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                      {pomodoroSettings.ringWidth || 8}px
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Thin (4px)', width: 4 },
                      { label: 'Standard (8px)', width: 8 },
                      { label: 'Bold (12px)', width: 12 },
                      { label: 'Thick (16px)', width: 16 },
                    ].map((item) => {
                      const isCurrent = (pomodoroSettings.ringWidth || 8) === item.width;
                      return (
                        <button
                          key={item.width}
                          id={`ring-width-btn-${item.width}`}
                          type="button"
                          onClick={() => onUpdatePomodoroSettings({ ringWidth: item.width })}
                          className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all cursor-pointer text-center ${
                            isCurrent
                              ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-sm'
                              : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Glow Effect Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                  <div>
                    <span className="text-xs font-semibold text-neutral-200 block">
                      Ambient Radiant Ring Glow
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      Casts dynamic luminous glow & background aura matching active phase
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="pomo-glow-toggle"
                      type="checkbox"
                      checked={pomodoroSettings.enableGlow !== false}
                      onChange={(e) =>
                        onUpdatePomodoroSettings({ enableGlow: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              {/* SECTION 3: FINE-TUNE POMODORO PALETTE (CUSTOM COLOR PICKERS) */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                    Fine-tune Pomodoro Palette (Hex & Color Pickers)
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Mode: {pomodoroSettings.themeId || 'classic-tomato'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Focus Color */}
                  <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                    <label className="text-xs text-neutral-400 block mb-1.5 flex items-center justify-between">
                      <span>Focus Session Color</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: resolvedPomoTheme.workColor }} />
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="custom-pomo-work-picker"
                        value={ensureHex(pomodoroSettings.customWorkColor || resolvedPomoTheme.workColor, '#ef4444')}
                        onChange={(e) =>
                          onUpdatePomodoroSettings({
                            themeId: 'custom',
                            customWorkColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-neutral-200 uppercase">
                        {pomodoroSettings.customWorkColor || resolvedPomoTheme.workColor}
                      </span>
                    </div>
                  </div>

                  {/* Short Break Color */}
                  <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                    <label className="text-xs text-neutral-400 block mb-1.5 flex items-center justify-between">
                      <span>Short Break Color</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: resolvedPomoTheme.shortBreakColor }} />
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="custom-pomo-short-picker"
                        value={ensureHex(pomodoroSettings.customShortBreakColor || resolvedPomoTheme.shortBreakColor, '#0284c7')}
                        onChange={(e) =>
                          onUpdatePomodoroSettings({
                            themeId: 'custom',
                            customShortBreakColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-neutral-200 uppercase">
                        {pomodoroSettings.customShortBreakColor || resolvedPomoTheme.shortBreakColor}
                      </span>
                    </div>
                  </div>

                  {/* Long Break Color */}
                  <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                    <label className="text-xs text-neutral-400 block mb-1.5 flex items-center justify-between">
                      <span>Long Break Color</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: resolvedPomoTheme.longBreakColor }} />
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="custom-pomo-long-picker"
                        value={ensureHex(pomodoroSettings.customLongBreakColor || resolvedPomoTheme.longBreakColor, '#10b981')}
                        onChange={(e) =>
                          onUpdatePomodoroSettings({
                            themeId: 'custom',
                            customLongBreakColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-neutral-200 uppercase">
                        {pomodoroSettings.customLongBreakColor || resolvedPomoTheme.longBreakColor}
                      </span>
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                    <label className="text-xs text-neutral-400 block mb-1.5 flex items-center justify-between">
                      <span>Canvas Background</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: resolvedPomoTheme.bg }} />
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="custom-pomo-bg-picker"
                        value={ensureHex(pomodoroSettings.customBg || resolvedPomoTheme.bg, '#0a0a0a')}
                        onChange={(e) =>
                          onUpdatePomodoroSettings({
                            themeId: 'custom',
                            customBg: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-neutral-200 uppercase">
                        {pomodoroSettings.customBg || resolvedPomoTheme.bg}
                      </span>
                    </div>
                  </div>

                  {/* Text & Digits Color */}
                  <div className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800">
                    <label className="text-xs text-neutral-400 block mb-1.5 flex items-center justify-between">
                      <span>Digits & Text Color</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: resolvedPomoTheme.textColor }} />
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="custom-pomo-text-picker"
                        value={ensureHex(pomodoroSettings.customTextColor || resolvedPomoTheme.textColor, '#ffffff')}
                        onChange={(e) =>
                          onUpdatePomodoroSettings({
                            themeId: 'custom',
                            customTextColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-neutral-200 uppercase">
                        {pomodoroSettings.customTextColor || resolvedPomoTheme.textColor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pomodoro Appearance: Font & Circle Size */}
              <div className="space-y-4">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pomodoro Timer Appearance</span>
                </span>

                {/* Pomodoro Font Selection */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-amber-400" />
                    <span>Timer Number Font</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FONT_OPTIONS.map((font) => {
                      const isSelected =
                        (pomodoroSettings.fontFamily || 'outfit') === font.id;
                      return (
                        <button
                          key={font.id}
                          id={`pomo-font-btn-${font.id}`}
                          onClick={() => onUpdatePomodoroSettings({ fontFamily: font.id })}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500/10 text-white shadow-sm'
                              : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40 text-neutral-300'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-neutral-400 font-sans truncate">
                              {font.name}
                            </span>
                            {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                          </div>
                          <span
                            className="text-base tracking-wider block truncate"
                            style={{ fontFamily: font.cssFamily }}
                          >
                            25:00
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Circle Size Customization */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <label htmlFor="pomo-circle-size-slider" className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Circle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pomodoro Timer Size (Circle)</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {pomodoroSettings.circleSize || 320}px
                    </span>
                  </div>

                  <input
                    id="pomo-circle-size-slider"
                    type="range"
                    min={220}
                    max={850}
                    step={10}
                    value={currentPomoCircle}
                    onChange={(e) => handlePomoCircleChange(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[
                      { label: 'Compact', size: 240 },
                      { label: 'Standard', size: 320 },
                      { label: 'Large', size: 440 },
                      { label: 'Huge', size: 580 },
                      { label: 'Massive', size: 740 },
                    ].map((preset) => {
                      const isCurrent = currentPomoCircle === preset.size;
                      return (
                        <button
                          key={preset.size}
                          id={`circle-size-${preset.label.toLowerCase()}`}
                          type="button"
                          onClick={() => handlePomoCircleChange(preset.size)}
                          className={`py-1.5 px-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer text-center truncate ${
                            isCurrent
                              ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-bold'
                              : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Timer Digit Font Size Customization (Dynamically limited with respect to ring size) */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <label htmlFor="pomo-font-size-slider" className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pomodoro Timer Font Size</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                        Max: {maxSafePomoFontSize}px
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {effectivePomoFontSize > 0
                          ? `${effectivePomoFontSize}px`
                          : 'Auto (Proportional)'}
                      </span>
                    </div>
                  </div>

                  <input
                    id="pomo-font-size-slider"
                    type="range"
                    min={0}
                    max={maxSafePomoFontSize}
                    step={1}
                    value={effectivePomoFontSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdatePomodoroSettings({ timerFontSize: Math.min(val, maxSafePomoFontSize) });
                    }}
                    className="w-full accent-amber-400 cursor-pointer"
                  />

                  {/* Font Size Presets: Tailored to current ring safe limit */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[
                      { label: 'Auto', size: 0 },
                      {
                        label: 'Compact',
                        size: Math.min(maxSafePomoFontSize, Math.max(30, Math.round(maxSafePomoFontSize * 0.55))),
                      },
                      {
                        label: 'Balanced',
                        size: Math.min(maxSafePomoFontSize, Math.max(36, Math.round(maxSafePomoFontSize * 0.72))),
                      },
                      {
                        label: 'Large',
                        size: Math.min(maxSafePomoFontSize, Math.max(42, Math.round(maxSafePomoFontSize * 0.88))),
                      },
                      { label: 'Max Safe', size: maxSafePomoFontSize },
                    ].map((preset) => {
                      const isCurrent = effectivePomoFontSize === preset.size;
                      return (
                        <button
                          key={preset.label}
                          id={`pomo-font-size-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                          type="button"
                          onClick={() => onUpdatePomodoroSettings({ timerFontSize: preset.size })}
                          className={`py-1 px-1 rounded-lg border text-xs font-medium transition-all cursor-pointer text-center truncate ${
                            isCurrent
                              ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-bold'
                              : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          <div className="truncate">{preset.label}</div>
                          {preset.size > 0 && (
                            <div className="text-[10px] opacity-75 font-mono">{preset.size}px</div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-tight">
                    Font size is dynamically capped to {maxSafePomoFontSize}px for this {currentPomoCircle}px ring to prevent the timer numbers from merging into the ring stroke.
                  </p>
                </div>
              </div>

              {/* Durations */}
              <div className="space-y-4">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  Interval Durations
                </span>

                {/* Work Duration */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="work-duration-slider" className="text-xs font-semibold text-neutral-200">
                      Work / Focus Duration
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {pomodoroSettings.workMinutes} minutes
                    </span>
                  </div>
                  <input
                    id="work-duration-slider"
                    type="range"
                    min={1}
                    max={90}
                    step={1}
                    value={pomodoroSettings.workMinutes}
                    onChange={(e) =>
                      onUpdatePomodoroSettings({ workMinutes: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Short Break */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="short-break-slider" className="text-xs font-semibold text-neutral-200">
                      Short Break Duration
                    </label>
                    <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {pomodoroSettings.shortBreakMinutes} minutes
                    </span>
                  </div>
                  <input
                    id="short-break-slider"
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={pomodoroSettings.shortBreakMinutes}
                    onChange={(e) =>
                      onUpdatePomodoroSettings({
                        shortBreakMinutes: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                {/* Long Break */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="long-break-slider" className="text-xs font-semibold text-neutral-200">
                      Long Break Duration
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {pomodoroSettings.longBreakMinutes} minutes
                    </span>
                  </div>
                  <input
                    id="long-break-slider"
                    type="range"
                    min={5}
                    max={60}
                    step={5}
                    value={pomodoroSettings.longBreakMinutes}
                    onChange={(e) =>
                      onUpdatePomodoroSettings({ longBreakMinutes: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* AUTO-START AUTOMATION OPTIONS */}
              <div className="space-y-3 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Auto-Start Session Automation</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">Continuous Flow</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Automatically transition and launch the next interval without waiting for manual start clicks.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Auto Start Focus Sessions */}
                  <div
                    onClick={() =>
                      onUpdatePomodoroSettings({
                        autoStartPomodoros: !pomodoroSettings.autoStartPomodoros,
                      })
                    }
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${
                      pomodoroSettings.autoStartPomodoros
                        ? 'border-amber-400/60 bg-amber-500/10 text-white'
                        : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-200">Auto-Start Focus</span>
                      <input
                        type="checkbox"
                        id="auto-start-focus-toggle"
                        checked={!!pomodoroSettings.autoStartPomodoros}
                        onChange={(e) =>
                          onUpdatePomodoroSettings({ autoStartPomodoros: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <span className="text-[11px] text-neutral-400 leading-tight">
                      Automatically starts focus session when a break finishes.
                    </span>
                  </div>

                  {/* Auto Start Short Breaks */}
                  <div
                    onClick={() =>
                      onUpdatePomodoroSettings({
                        autoStartBreaks: !pomodoroSettings.autoStartBreaks,
                      })
                    }
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${
                      pomodoroSettings.autoStartBreaks
                        ? 'border-sky-400/60 bg-sky-500/10 text-white'
                        : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-200">Auto-Start Breaks</span>
                      <input
                        type="checkbox"
                        id="auto-start-breaks-toggle"
                        checked={!!pomodoroSettings.autoStartBreaks}
                        onChange={(e) =>
                          onUpdatePomodoroSettings({ autoStartBreaks: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 border-neutral-700 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <span className="text-[11px] text-neutral-400 leading-tight">
                      Automatically begins short break when focus session ends.
                    </span>
                  </div>

                  {/* Auto Start Long Breaks */}
                  <div
                    onClick={() =>
                      onUpdatePomodoroSettings({
                        autoStartLongBreaks: !pomodoroSettings.autoStartLongBreaks,
                      })
                    }
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${
                      pomodoroSettings.autoStartLongBreaks
                        ? 'border-emerald-400/60 bg-emerald-500/10 text-white'
                        : 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-200">Auto Long Breaks</span>
                      <input
                        type="checkbox"
                        id="auto-start-long-breaks-toggle"
                        checked={!!pomodoroSettings.autoStartLongBreaks}
                        onChange={(e) =>
                          onUpdatePomodoroSettings({ autoStartLongBreaks: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-neutral-700 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <span className="text-[11px] text-neutral-400 leading-tight">
                      Automatically begins long break after completing cycle rounds.
                    </span>
                  </div>
                </div>
              </div>

              {/* SOUND ALERTS CUSTOMIZATION & UPLOAD */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sound Alerts for Each Phase</span>
                  </span>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-neutral-400">Enable Sound Alerts</span>
                    <input
                      type="checkbox"
                      checked={pomodoroSettings.soundAlerts}
                      onChange={(e) =>
                        onUpdatePomodoroSettings({ soundAlerts: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700"
                    />
                  </label>
                </div>

                {/* Phase 1: Work Session End Sound */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-amber-400 block">
                        Work Session End Sound
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Plays when work session finishes
                      </span>
                    </div>
                    <button
                      id="test-work-sound-btn"
                      onClick={() =>
                        triggerSoundAlert(
                          pomodoroSettings.workSound,
                          pomodoroSettings.customWorkSoundData
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Play className="w-3 h-3 text-amber-400" />
                      <span>Test Sound</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SOUND_ALERT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        id={`work-sound-${opt.id}`}
                        onClick={() => {
                          if (opt.id === 'custom') {
                            fileInputWorkRef.current?.click();
                          } else {
                            onUpdatePomodoroSettings({ workSound: opt.id });
                            triggerSoundAlert(opt.id);
                          }
                        }}
                        className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          pomodoroSettings.workSound === opt.id
                            ? 'border-amber-400 bg-amber-500/10 text-white'
                            : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <span className="font-medium block truncate">{opt.name}</span>
                        {opt.id === 'custom' && pomodoroSettings.customWorkSoundName && (
                          <span className="text-[10px] text-amber-400 truncate block">
                            {pomodoroSettings.customWorkSoundName}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <input
                    type="file"
                    ref={fileInputWorkRef}
                    onChange={(e) => handleAudioUpload(e, 'work')}
                    accept="audio/*"
                    className="hidden"
                  />
                </div>

                {/* Phase 2: Short Break End Sound */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-sky-400 block">
                        Short Break End Sound
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Plays when short break is over
                      </span>
                    </div>
                    <button
                      id="test-break-sound-btn"
                      onClick={() =>
                        triggerSoundAlert(
                          pomodoroSettings.shortBreakSound,
                          pomodoroSettings.customBreakSoundData
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Play className="w-3 h-3 text-sky-400" />
                      <span>Test Sound</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SOUND_ALERT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        id={`break-sound-${opt.id}`}
                        onClick={() => {
                          if (opt.id === 'custom') {
                            fileInputBreakRef.current?.click();
                          } else {
                            onUpdatePomodoroSettings({ shortBreakSound: opt.id });
                            triggerSoundAlert(opt.id);
                          }
                        }}
                        className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          pomodoroSettings.shortBreakSound === opt.id
                            ? 'border-sky-400 bg-sky-500/10 text-white'
                            : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <span className="font-medium block truncate">{opt.name}</span>
                        {opt.id === 'custom' && pomodoroSettings.customBreakSoundName && (
                          <span className="text-[10px] text-sky-400 truncate block">
                            {pomodoroSettings.customBreakSoundName}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <input
                    type="file"
                    ref={fileInputBreakRef}
                    onChange={(e) => handleAudioUpload(e, 'break')}
                    accept="audio/*"
                    className="hidden"
                  />
                </div>

                {/* Phase 3: Long Break End Sound */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-emerald-400 block">
                        Long Break End Sound
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Plays when long break is finished
                      </span>
                    </div>
                    <button
                      id="test-long-break-sound-btn"
                      onClick={() =>
                        triggerSoundAlert(
                          pomodoroSettings.longBreakSound,
                          pomodoroSettings.customLongBreakSoundData
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span>Test Sound</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SOUND_ALERT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        id={`long-break-sound-${opt.id}`}
                        onClick={() => {
                          if (opt.id === 'custom') {
                            fileInputLongBreakRef.current?.click();
                          } else {
                            onUpdatePomodoroSettings({ longBreakSound: opt.id });
                            triggerSoundAlert(opt.id);
                          }
                        }}
                        className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          pomodoroSettings.longBreakSound === opt.id
                            ? 'border-emerald-400 bg-emerald-500/10 text-white'
                            : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <span className="font-medium block truncate">{opt.name}</span>
                        {opt.id === 'custom' && pomodoroSettings.customLongBreakSoundName && (
                          <span className="text-[10px] text-emerald-400 truncate block">
                            {pomodoroSettings.customLongBreakSoundName}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <input
                    type="file"
                    ref={fileInputLongBreakRef}
                    onChange={(e) => handleAudioUpload(e, 'longBreak')}
                    accept="audio/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIO & PROFILE */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 block">Current User Name</span>
                    <span className="text-sm font-semibold text-white">
                      {userName || 'Anonymous'}
                    </span>
                  </div>
                </div>
                <button
                  id="change-name-btn"
                  onClick={() => {
                    onClose();
                    onOpenNameModal();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 cursor-pointer transition-colors"
                >
                  Change Name
                </button>
              </div>

              {/* Ambient Sounds */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Clock Audio & Chimes</span>
                </label>

                {/* Hourly Chime */}
                <label
                  id="toggle-hourly-chime-label"
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
                >
                  <div>
                    <span className="text-xs font-medium text-neutral-200 block">
                      Hourly Desk Chime
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Gentle bell tone on the hour (:00)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-hourly-chime"
                    checked={clockSettings.hourlyChime}
                    onChange={(e) => onUpdateClockSettings({ hourlyChime: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700"
                  />
                </label>

                {/* Tick Sound */}
                <label
                  id="toggle-tick-sound-label"
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
                >
                  <div>
                    <span className="text-xs font-medium text-neutral-200 block">
                      Mechanical Clock Tick
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Subtle wooden click per second (focus sound)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-tick-sound"
                    checked={clockSettings.tickSound}
                    onChange={(e) => onUpdateClockSettings({ tickSound: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700"
                  />
                </label>
              </div>

              {/* Display Care */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Display Care</span>
                </label>
                <label
                  id="toggle-antiburnin-label"
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
                >
                  <div>
                    <span className="text-xs font-medium text-neutral-200 block">
                      Anti Burn-in Micro-drift
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Shifts digits periodically to protect laptop screens
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-antiburnin"
                    checked={clockSettings.antiBurnIn}
                    onChange={(e) => onUpdateClockSettings({ antiBurnIn: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-neutral-700"
                  />
                </label>
              </div>

              {/* Startup Reveal Replay */}
              {onReplayIntro && (
                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-neutral-200 block">
                      Startup Intro
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      Experience the smooth logo zoom-in reveal
                    </span>
                  </div>
                  <button
                    type="button"
                    id="replay-startup-intro-btn"
                    onClick={onReplayIntro}
                    className="apple-hover flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Replay Intro</span>
                  </button>
                </div>
              )}

              {/* Reset to defaults */}
              <div className="pt-4 border-t border-neutral-800 flex justify-end">
                <button
                  id="reset-defaults-btn"
                  onClick={() => {
                    if (window.confirm('Reset all clock and pomodoro settings to defaults?')) {
                      onResetDefaults();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Settings to Defaults</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-900/95 flex justify-between items-center">
          <span className="text-[11px] text-neutral-500">
            Changes are saved automatically to your device
          </span>
          <button
            id="settings-done-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
