import React, { memo, useEffect, useState, useRef } from 'react';
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  Maximize2,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { WeatherWidgetStyle, WidgetTheme } from '../../types';
import { WidgetAdjustmentDots } from './WidgetAdjustmentDots';
import { calculateWidgetSnap, SnapState } from '../../utils/widgetSnapping';

interface WeatherWidgetProps {
  style?: WeatherWidgetStyle;
  theme?: WidgetTheme;
  isCustomLayout?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  accentColor?: string;
  isLight?: boolean;
  location?: string;
  latitude?: number;
  longitude?: number;
  unit?: 'celsius' | 'fahrenheit';
  onSnapChange?: (snap: SnapState) => void;
}

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  cityName: string;
  country?: string;
  lastUpdated: number;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = memo(
  ({
    style = 'pill',
    theme = 'glass',
    isCustomLayout = false,
    position,
    onPositionChange,
    scale = 1,
    onScaleChange,
    accentColor = '#38bdf8',
    isLight = false,
    location = 'San Francisco, CA',
    latitude = 37.7749,
    longitude = -122.4194,
    unit = 'fahrenheit',
    onSnapChange,
  }) => {
    const [weather, setWeather] = useState<WeatherData>({
      temperature: unit === 'fahrenheit' ? 68 : 20,
      feelsLike: unit === 'fahrenheit' ? 67 : 19,
      humidity: 55,
      windSpeed: 12,
      weatherCode: 1,
      isDay: true,
      cityName: location.split(',')[0].trim() || 'San Francisco',
      country: 'USA',
      lastUpdated: Date.now(),
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const dragBasePosRef = useRef<{ baseX: number; baseY: number; width: number; height: number }>({
      baseX: 0,
      baseY: 0,
      width: 0,
      height: 0,
    });

    const widgetRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [resizeStart, setResizeStart] = useState<{ startDist: number; startScale: number }>({
      startDist: 0,
      startScale: 1,
    });
    const rafRef = useRef<number | null>(null);

    const widgetScale = Math.max(0.5, Math.min(2.5, scale));

    // Corner Drag-to-Resize Handler
    const handleResizeMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      if (!widgetRef.current) return;
      const rect = widgetRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dist = Math.hypot(clientX - centerX, clientY - centerY);
      setResizeStart({
        startDist: Math.max(10, dist),
        startScale: widgetScale,
      });
    };

    useEffect(() => {
      if (!isResizing) return;
      const onMove = (e: MouseEvent | TouchEvent) => {
        if (!widgetRef.current) return;
        const rect = widgetRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const dist = Math.hypot(clientX - centerX, clientY - centerY);
        const ratio = dist / resizeStart.startDist;
        const newScale = Math.max(0.5, Math.min(2.5, +(resizeStart.startScale * ratio).toFixed(2)));

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          onScaleChange?.(newScale);
        });
      };
      const onEnd = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setIsResizing(false);
      };
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onMove, { passive: true });
      window.addEventListener('touchend', onEnd);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
      };
    }, [isResizing, resizeStart, onScaleChange]);

    // Fetch Weather Data from Open-Meteo
    useEffect(() => {
      let isCancelled = false;

      const fetchWeatherData = async () => {
        setIsLoading(true);
        try {
          let targetLat = latitude;
          let targetLon = longitude;
          let resolvedCity = location.split(',')[0].trim() || 'San Francisco';
          let resolvedCountry = '';

          // If location is specified and different or coordinates are default, try geocoding
          if (location && location.trim().length > 1) {
            try {
              const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                  location.trim()
                )}&count=1&language=en&format=json`
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.results && geoData.results.length > 0) {
                  const first = geoData.results[0];
                  targetLat = first.latitude;
                  targetLon = first.longitude;
                  resolvedCity = first.name;
                  resolvedCountry = first.admin1 || first.country || '';
                }
              }
            } catch (geoErr) {
              console.warn('Geocoding fallback:', geoErr);
            }
          }

          const tempUnitParam = unit === 'celsius' ? 'celsius' : 'fahrenheit';
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&temperature_unit=${tempUnitParam}&wind_speed_unit=kmh`;

          const res = await fetch(weatherUrl);
          if (!res.ok) throw new Error(`Weather fetch status: ${res.status}`);
          const data = await res.json();

          if (!isCancelled && data.current) {
            setWeather({
              temperature: Math.round(data.current.temperature_2m),
              feelsLike: Math.round(data.current.apparent_temperature ?? data.current.temperature_2m),
              humidity: Math.round(data.current.relative_humidity_2m ?? 50),
              windSpeed: Math.round(data.current.wind_speed_10m ?? 10),
              weatherCode: data.current.weather_code ?? 0,
              isDay: Boolean(data.current.is_day ?? 1),
              cityName: resolvedCity,
              country: resolvedCountry,
              lastUpdated: Date.now(),
            });
          }
        } catch (err) {
          console.warn('Weather fetch fallback:', err);
          // Set clean mock update so UI is never empty
          if (!isCancelled) {
            setWeather((prev) => ({
              ...prev,
              cityName: location.split(',')[0].trim() || prev.cityName,
              temperature: unit === 'fahrenheit' ? 68 : 20,
              feelsLike: unit === 'fahrenheit' ? 67 : 19,
              lastUpdated: Date.now(),
            }));
          }
        } finally {
          if (!isCancelled) setIsLoading(false);
        }
      };

      fetchWeatherData();
      // Auto-refresh weather every 15 minutes
      const interval = setInterval(fetchWeatherData, 15 * 60 * 1000);
      return () => {
        isCancelled = true;
        clearInterval(interval);
      };
    }, [location, latitude, longitude, unit]);

    // Drag handling when in Custom Layout Edit mode
    const handleMouseDown = (e: React.MouseEvent) => {
      if (!isCustomLayout) return;
      e.stopPropagation();
      setIsDragging(true);
      const curX = position?.x || 0;
      const curY = position?.y || 0;
      setDragStart({
        x: e.clientX - curX,
        y: e.clientY - curY,
      });
      if (widgetRef.current) {
        const rect = widgetRef.current.getBoundingClientRect();
        dragBasePosRef.current = {
          baseX: rect.left - curX,
          baseY: rect.top - curY,
          width: rect.width,
          height: rect.height,
        };
      }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (!isCustomLayout || !e.touches[0]) return;
      e.stopPropagation();
      setIsDragging(true);
      const curX = position?.x || 0;
      const curY = position?.y || 0;
      setDragStart({
        x: e.touches[0].clientX - curX,
        y: e.touches[0].clientY - curY,
      });
      if (widgetRef.current) {
        const rect = widgetRef.current.getBoundingClientRect();
        dragBasePosRef.current = {
          baseX: rect.left - curX,
          baseY: rect.top - curY,
          width: rect.width,
          height: rect.height,
        };
      }
    };

    useEffect(() => {
      if (!isDragging) return;

      const onMouseMove = (e: MouseEvent) => {
        const { nextX, nextY, snap } = calculateWidgetSnap(
          e.clientX,
          e.clientY,
          dragStart,
          dragBasePosRef.current
        );
        onSnapChange?.(snap);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          onPositionChange?.({ x: nextX, y: nextY });
        });
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!e.touches[0]) return;
        const { nextX, nextY, snap } = calculateWidgetSnap(
          e.touches[0].clientX,
          e.touches[0].clientY,
          dragStart,
          dragBasePosRef.current
        );
        onSnapChange?.(snap);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          onPositionChange?.({ x: nextX, y: nextY });
        });
      };

      const onEnd = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setIsDragging(false);
        onSnapChange?.({ snapXCenter: false, snapYCenter: false, corner: null });
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onEnd);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onEnd);
      };
    }, [isDragging, dragStart, onPositionChange, onSnapChange]);

    // Condition interpretation based on WMO code
    const getWeatherCondition = (code: number, isDay: boolean) => {
      if (code === 0) {
        return {
          label: 'Clear Sky',
          icon: isDay ? (
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-300" />
          ),
          accent: isDay ? '#f59e0b' : '#818cf8',
        };
      }
      if (code === 1 || code === 2) {
        return {
          label: 'Partly Cloudy',
          icon: isDay ? (
            <CloudSun className="w-4 h-4 text-amber-300" />
          ) : (
            <CloudMoon className="w-4 h-4 text-indigo-200" />
          ),
          accent: '#38bdf8',
        };
      }
      if (code === 3) {
        return {
          label: 'Overcast',
          icon: <Cloud className="w-4 h-4 text-neutral-300" />,
          accent: '#94a3b8',
        };
      }
      if (code === 45 || code === 48) {
        return {
          label: 'Misty Fog',
          icon: <CloudFog className="w-4 h-4 text-neutral-300" />,
          accent: '#94a3b8',
        };
      }
      if (code >= 51 && code <= 57) {
        return {
          label: 'Light Drizzle',
          icon: <CloudDrizzle className="w-4 h-4 text-sky-400" />,
          accent: '#38bdf8',
        };
      }
      if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
        return {
          label: 'Rain Showers',
          icon: <CloudRain className="w-4 h-4 text-blue-400" />,
          accent: '#60a5fa',
        };
      }
      if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
        return {
          label: 'Snow Flurries',
          icon: <CloudSnow className="w-4 h-4 text-sky-200" />,
          accent: '#bae6fd',
        };
      }
      if (code >= 95) {
        return {
          label: 'Thunderstorm',
          icon: <CloudLightning className="w-4 h-4 text-amber-400 animate-pulse" />,
          accent: '#fbbf24',
        };
      }
      return {
        label: 'Mild Weather',
        icon: isDay ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-300" />,
        accent: '#38bdf8',
      };
    };

    const condition = getWeatherCondition(weather.weatherCode, weather.isDay);
    const tempUnitSymbol = unit === 'celsius' ? '°C' : '°F';

    // Base container class & themes - NO hover:scale or rising effect
    const baseContainerClass = `select-none ${
      isCustomLayout
        ? 'cursor-grab active:cursor-grabbing border-2 border-dashed border-amber-400/80 z-30'
        : 'z-10'
    }`;

    const getThemeClass = () => {
      switch (theme) {
        case 'glass':
          return isLight
            ? 'bg-white/80 backdrop-blur-xl border border-neutral-300/80 text-neutral-900 shadow-md shadow-neutral-900/5'
            : 'bg-black/45 backdrop-blur-xl border border-white/15 text-white shadow-xl shadow-black/40';
        case 'solid':
          return isLight
            ? 'bg-neutral-100 border border-neutral-300 text-neutral-900 shadow-md'
            : 'bg-neutral-900 border border-neutral-800 text-white shadow-xl';
        case 'glow':
          return isLight
            ? 'bg-white/90 border border-sky-400/40 text-neutral-900 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
            : 'bg-neutral-950/80 border border-sky-400/50 text-white shadow-[0_0_25px_rgba(56,189,248,0.3)]';
        case 'minimal':
          return isLight
            ? 'bg-transparent text-neutral-900 border-none'
            : 'bg-transparent text-white border-none';
        default:
          return 'bg-black/40 backdrop-blur-xl border border-white/10 text-white';
      }
    };

    const themeClass = getThemeClass();

    return (
      <div
        ref={widgetRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          transform: `translate3d(${position?.x || 0}px, ${position?.y || 0}px, 0) scale(${widgetScale})`,
          transformOrigin: 'center center',
          transition: isDragging || isResizing ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: isDragging || isResizing ? 'transform' : 'auto',
          touchAction: isCustomLayout ? 'none' : 'auto',
        }}
        className={`relative inline-block ${baseContainerClass}`}
      >
        {/* Visual Badge when in Layout Mode */}
        {isCustomLayout && (
          <>
            <div className="absolute -top-3 -left-2 px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md pointer-events-none z-30 font-mono">
              <MapPin className="w-2.5 h-2.5" />
              <span>Weather</span>
            </div>
            {/* 8 Adjustment Dots (4 corners, 4 edges) */}
            <WidgetAdjustmentDots onResizeStart={handleResizeMouseDown} />
          </>
        )}

        {/* STYLE 1: PILL CAPSULE (Default) */}
        {style === 'pill' && (
          <div
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-2.5 ${themeClass} font-sans`}
          >
            <div className="flex items-center justify-center shrink-0">
              {condition.icon}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-sm font-bold tracking-tight">
                {weather.temperature}
                {tempUnitSymbol}
              </span>
            </div>
            <div className="h-3 w-px bg-current opacity-20" />
            <div className="flex items-center gap-1 text-xs truncate max-w-[140px]">
              <span className="font-medium truncate opacity-90">{weather.cityName}</span>
              <span className="text-[10px] opacity-60 hidden sm:inline">• {condition.label}</span>
            </div>
          </div>
        )}

        {/* STYLE 2: GLASS CARD */}
        {style === 'card' && (
          <div
            className={`p-3.5 rounded-2xl min-w-[190px] flex flex-col gap-2 ${themeClass} font-sans`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold opacity-90 truncate max-w-[130px]">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{weather.cityName}</span>
              </div>
              <span className="text-[10px] opacity-60 font-mono">
                {condition.label}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 shrink-0">
                  {condition.icon}
                </div>
                <div>
                  <span className="font-mono text-2xl font-black tracking-tight leading-none block">
                    {weather.temperature}
                    {tempUnitSymbol}
                  </span>
                  <span className="text-[10px] opacity-60 block mt-0.5">
                    Feels like {weather.feelsLike}
                    {tempUnitSymbol}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-current/10 text-[10px] opacity-70">
              <span className="flex items-center gap-1">
                <Droplets className="w-2.5 h-2.5 text-sky-400" />
                <span>{weather.humidity}% hum</span>
              </span>
              <span className="flex items-center gap-1">
                <Wind className="w-2.5 h-2.5 text-emerald-400" />
                <span>{weather.windSpeed} km/h</span>
              </span>
            </div>
          </div>
        )}

        {/* STYLE 3: DETAILED FORECAST */}
        {style === 'detailed' && (
          <div
            className={`p-4 rounded-2xl min-w-[220px] flex flex-col gap-2.5 ${themeClass} font-sans`}
          >
            <div className="flex items-center justify-between border-b border-current/10 pb-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-xs font-bold tracking-tight">{weather.cityName}</span>
                {weather.country && (
                  <span className="text-[10px] opacity-60 truncate max-w-[70px]">
                    ({weather.country})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isLoading ? (
                  <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
                ) : (
                  condition.icon
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-black font-mono tracking-tight block">
                  {weather.temperature}
                  {tempUnitSymbol}
                </span>
                <span className="text-xs font-medium opacity-80 block mt-0.5">
                  {condition.label}
                </span>
              </div>
              <div className="text-right text-[11px] opacity-75 space-y-0.5">
                <div className="flex items-center justify-end gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" />
                  <span>Feels: {weather.feelsLike}{tempUnitSymbol}</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Droplets className="w-3 h-3 text-sky-400" />
                  <span>Hum: {weather.humidity}%</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Wind className="w-3 h-3 text-emerald-400" />
                  <span>Wind: {weather.windSpeed} km/h</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STYLE 4: MINIMAL BADGE */}
        {style === 'minimal' && (
          <div
            className={`px-3 py-1 rounded-xl flex items-center gap-2 ${themeClass} font-sans`}
          >
            {condition.icon}
            <span className="font-mono text-xs font-bold">
              {weather.temperature}
              {tempUnitSymbol}
            </span>
            <span className="text-[11px] opacity-75 font-medium truncate max-w-[100px]">
              {weather.cityName}
            </span>
          </div>
        )}
      </div>
    );
  }
);
