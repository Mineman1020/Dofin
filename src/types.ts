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
  | 'poppins';

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
  | 'deep-abyss';

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

export interface PartyMember {
  id: string;
  userId: string;
  name: string;
  avatarColor: string;
  totalFocusMinutes: number;
  completedSessions: number;
  currentStatus: MemberStatus;
  lastActiveAt: string;
  joinedAt: string;
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
}
