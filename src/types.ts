export type ViewMode = 'welcome' | 'clock' | 'pomodoro' | 'tasks' | 'stats';

export type IntroEffectId = 'chronos' | 'zen' | 'cyber' | 'minimal';

export type ClockFontFamily =
  | 'outfit'
  | 'jetbrains'
  | 'orbitron'
  | 'playfair'
  | 'bebas'
  | 'share-tech'
  | 'audiowide'
  | 'vt323'
  | 'space-grotesk'
  | 'cinzel'
  | 'montserrat'
  | 'courier'
  | 'poppins'
  | 'syne'
  | 'righteous'
  | 'silkscreen'
  | 'cormorant'
  | 'unbounded'
  | 'major-mono';

export type ClockDigitSize = 'medium' | 'large' | 'huge' | 'fill';

export type AmbientThemeId =
  | 'none'
  | 'beachside-sunset'
  | 'rainy-day'
  | 'rainy-window'
  | 'aurora'
  | 'starlight'
  | 'campfire'
  | 'cyber-horizon'
  | 'zen-mist'
  | 'golden-hour'
  | 'retro-crt'
  | 'sunbeam'
  | 'deep-abyss'
  | 'cherry-blossom'
  | 'neon-cyber-city'
  | 'autumn-glade'
  | 'emerald-enchanted'
  | 'desert-dusk';

export type AmbientSoundType =
  | 'none'
  | 'ocean-waves'
  | 'rain'
  | 'campfire'
  | 'cosmic-drone'
  | 'zen-stream';

export interface AmbientThemePreset {
  id: AmbientThemeId;
  name: string;
  tagline: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  secondaryColor: string;
  glowColor: string;
  recommendedFont: ClockFontFamily;
  isDark: boolean;
  soundType: AmbientSoundType;
  soundLabel: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  bgClass: string;
  bgStyle?: string;
  textColor: string;
  accentColor: string;
  secondaryColor: string;
  cardBg: string;
  isDark: boolean;
}

export type WallpaperMode = 'theme' | 'image' | 'slideshow' | 'video';

export type ClockStyle =
  | 'modern'
  | 'flip'
  | 'analog'
  | 'seven-segment'
  | 'neon-cyber'
  | 'arc-radial';

export type ClockColorMode = 'solid' | 'gradient' | 'custom-gradient';
export type MatchedBackgroundMode = 'off' | 'matched' | 'contrast';

export interface ElementLayoutSettings {
  x: number;
  y: number;
  scaleX: number; // Lateral width scale (0.4 to 2.5, default 1)
  scaleY: number; // Vertical height scale (0.4 to 2.5, default 1)
  rotation: number; // Rotation in degrees (-180 to 180, default 0)
}

export type BatteryWidgetStyle = 'pill' | 'gauge' | 'minimal' | 'cyber';
export type StopwatchWidgetStyle = 'compact' | 'ring' | 'card' | 'cyber';
export type WeatherWidgetStyle = 'pill' | 'card' | 'detailed' | 'minimal';
export type WidgetTheme = 'glass' | 'solid' | 'glow' | 'minimal';

export interface GradientPreset {
  id: string;
  name: string;
  gradient: string;
  preview: string;
}

export interface ClockSettings {
  themeId: string;
  customBg: string;
  customTextColor: string;
  customAccentColor: string;
  fontFamily: ClockFontFamily;
  digitSize: ClockDigitSize;
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  showAmPm: boolean;
  showDate: boolean;
  showDayOfWeek: boolean;
  showQuote: boolean;
  quoteText: string;
  tickSound: boolean;
  hourlyChime: boolean;
  brightness: number; // 20 to 100
  antiBurnIn: boolean;
  enableScrolling?: boolean; // Vertical scrolling enabled when screen is not full screen (default: true)
  // Ambient Immersive Modes
  ambientTheme?: AmbientThemeId;
  ambientSoundEnabled?: boolean;
  ambientSoundVolume?: number; // 0 to 100
  ambientParticles?: boolean;

  // Wallpaper Modes (Custom Image, Live MP4, Slideshow) & Depth Effect
  wallpaperMode?: WallpaperMode;
  wallpaperOpacity?: number; // Wallpaper dimmer / dark overlay: 0 to 80 (default 25%)
  wallpaperBlur?: number; // Wallpaper blur: 0 to 20 px (default 0)
  slideshowIntervalSeconds?: number; // Interval for slideshow: 10, 30, 60, 300, 900 (default 30)
  depthEffect?: boolean; // Multi-layer optical depth against wallpaper
  depthIntensity?: number; // 0 to 100
  customWallpaperName?: string;
  liveVideoName?: string;
  wallpaperTimestamp?: number;
  introEffect?: IntroEffectId;
  introSound?: boolean;
  shareStatsWithParty?: boolean; // When false, keeps detailed stats private in study parties (default: true)

  // Clock Design Style
  clockStyle?: ClockStyle;
  clockFaceTransparency?: number; // 0 to 100% background transparency for clock face (chronometer, cyberpunk HUD, etc.)

  // Freeform Layout & Drag Scaling
  customLayoutEnabled?: boolean;
  clockPosition?: { x: number; y: number };
  clockScale?: number; // 0.5 to 2.5 (default 1)
  clockScaleX?: number; // 0.4 to 2.5 (lateral size, default 1)
  clockScaleY?: number; // 0.4 to 2.5 (vertical size, default 1)
  clockRotation?: number; // -180 to 180 degrees (default 0)

  // Individual Element Adjustments (Date, Focus Mantra, AM/PM tag)
  dateLayout?: ElementLayoutSettings;
  mantraLayout?: ElementLayoutSettings;
  ampmLayout?: ElementLayoutSettings;

  // Color Mixes & Gradients & Matched Background
  colorMode?: ClockColorMode;
  gradientPresetId?: string;
  customGradientStart?: string;
  customGradientEnd?: string;
  customGradientAngle?: number; // 0 to 360 deg
  matchedBackground?: MatchedBackgroundMode; // 'off' | 'matched' | 'contrast'

  // Widgets
  showBatteryWidget?: boolean;
  batteryWidgetStyle?: BatteryWidgetStyle;
  batteryWidgetPosition?: { x: number; y: number };
  batteryWidgetScale?: number; // 0.5 to 2.5 (default 1)

  showStopwatchWidget?: boolean;
  stopwatchWidgetStyle?: StopwatchWidgetStyle;
  stopwatchWidgetPosition?: { x: number; y: number };
  stopwatchWidgetScale?: number; // 0.5 to 2.5 (default 1)

  showWeatherWidget?: boolean;
  weatherLocation?: string;
  weatherLatitude?: number;
  weatherLongitude?: number;
  weatherUnit?: 'celsius' | 'fahrenheit';
  weatherWidgetStyle?: WeatherWidgetStyle;
  weatherWidgetPosition?: { x: number; y: number };
  weatherWidgetScale?: number; // 0.5 to 2.5 (default 1)

  widgetTheme?: WidgetTheme;
  widgetEditMode?: boolean; // Mode to drag & resize widgets
}

export type SoundAlertChoice =
  | 'zen-bell'
  | 'digital-beep'
  | 'gentle-marimba'
  | 'crystal-harp'
  | 'classic-alarm'
  | 'custom';

export interface PomodoroThemePreset {
  id: string;
  name: string;
  bgClass: string;
  bgColor: string;
  textColor: string;
  workColor: string;
  shortBreakColor: string;
  longBreakColor: string;
  cardBg: string;
  isDark: boolean;
}

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartLongBreaks?: boolean;
  autoStartPomodoros: boolean;
  soundAlerts: boolean;
  tickSound: boolean;
  workSound: SoundAlertChoice;
  shortBreakSound: SoundAlertChoice;
  longBreakSound: SoundAlertChoice;
  customWorkSoundData?: string;
  customBreakSoundData?: string;
  customLongBreakSoundData?: string;
  customWorkSoundName?: string;
  customBreakSoundName?: string;
  customLongBreakSoundName?: string;
  fontFamily?: ClockFontFamily;
  circleSize?: number;
  timerFontSize?: number; // Custom font size for pomodoro timer numbers
  verticalOffset?: number; // Upward/downward adjustment for pomodoro circle (in px, negative = moved upward)

  // Pomodoro Meter & Theme Customization
  themeId?: string; // 'sync' | preset id | 'custom'
  customBg?: string;
  customTextColor?: string;
  customWorkColor?: string;
  customShortBreakColor?: string;
  customLongBreakColor?: string;
  ringWidth?: number; // e.g. 4, 8, 12, 16
  enableGlow?: boolean;
  idleMinimalMode?: boolean; // When idle for 30s while running: hide taskbar, controls, and expand into glowing edge rectangle (default: true)

  // Ambient atmosphere settings for Pomodoro
  ambientTheme?: AmbientThemeId;
  ambientSoundEnabled?: boolean;
  ambientSoundVolume?: number; // 0 to 100
  ambientParticles?: boolean;
  ambientPhaseSync?: boolean; // Synchronize ambient colors subtly with work/break phases
}

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroTask {
  id: string;
  title: string;
  description?: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  createdAt: number;
  completedAt?: number;
}

export type PartyPurpose = 'study' | 'work' | 'coding' | 'reading' | 'creative' | 'general';

export type MemberStatus = 'focusing' | 'break' | 'idle';

export interface MemberStatsSnapshot {
  todayFocusMinutes: number;
  allTimeFocusMinutes: number;
  previousFocusMinutes: number;
  weeklyFocusMinutes: number;
  currentStreak: number;
  tasksCompleted: number;
  completedPomodoros: number;
}

export interface PartyMember {
  id: string;
  userId: string;
  name: string;
  avatarColor: string;
  dailyFocusMinutes?: number;
  lastFocusDate?: string; // YYYY-MM-DD
  totalFocusMinutes: number; // All-time cumulative minutes
  completedSessions: number;
  currentStatus: MemberStatus;
  lastActiveAt: string;
  joinedAt: string;
  shareStats?: boolean; // When false, other members see a private profile message
  statsSnapshot?: MemberStatsSnapshot;
}

export interface Party {
  id: string;
  code: string;
  name: string;
  description: string;
  purpose: PartyPurpose;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  memberCount: number;
}

export interface PartyMessage {
  id: string;
  partyId: string;
  senderId: string;
  senderName: string;
  senderAvatarColor?: string;
  text: string;
  createdAt: string;
  isEncrypted?: boolean;
}
