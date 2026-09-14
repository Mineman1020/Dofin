export type ViewMode = 'welcome' | 'clock' | 'pomodoro';

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

  // Pomodoro Meter & Theme Customization
  themeId?: string; // 'sync' | preset id | 'custom'
  customBg?: string;
  customTextColor?: string;
  customWorkColor?: string;
  customShortBreakColor?: string;
  customLongBreakColor?: string;
  ringWidth?: number; // e.g. 4, 8, 12, 16
  enableGlow?: boolean;
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
