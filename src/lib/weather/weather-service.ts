import type { WeatherData, WeatherDay } from "@/lib/types";
import { addDays, eachDayOfInterval, format, parseISO } from "date-fns";

interface GeocodeResult {
  latitude: number;
  longitude: number;
  name: string;
}

interface GeocodeHit {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  country?: string;
}

/** Open-Meteo free forecast covers roughly the next 16 days. */
const FORECAST_HORIZON_DAYS = 16;
const CLIMATE_LOOKBACK_YEARS = 5;

/** Mapbox-style labels ("City, State") often fail Open-Meteo search — try fallbacks. */
function geocodeQueryCandidates(destination: string): string[] {
  const trimmed = destination.trim();
  if (!trimmed) return [];

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const candidates = [trimmed];
  if (parts.length >= 2) {
    // "Corpus Christi, United States" works; "Corpus Christi, Texas" often does not.
    candidates.push(`${parts[0]}, ${parts[parts.length - 1]}`);
    candidates.push(parts[0]);
  }

  return [...new Set(candidates)];
}

function scoreGeocodeHit(hit: GeocodeHit, destination: string): number {
  const haystack = destination.toLowerCase();
  let score = 0;
  if (hit.admin1 && haystack.includes(hit.admin1.toLowerCase())) score += 10;
  if (hit.country && haystack.includes(hit.country.toLowerCase())) score += 5;
  if (hit.country === "United States" && /\b(usa|u\.s\.a\.|united states)\b/i.test(destination)) {
    score += 3;
  }
  return score;
}

async function searchGeocode(query: string): Promise<GeocodeHit[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`,
    { next: { revalidate: 86400 } }
  );
  const data = await res.json();
  if (!data.results?.length) return [];

  return data.results.map(
    (r: {
      latitude: number;
      longitude: number;
      name: string;
      admin1?: string;
      country?: string;
    }) => ({
      latitude: r.latitude,
      longitude: r.longitude,
      name: r.name + (r.admin1 ? `, ${r.admin1}` : "") + (r.country ? `, ${r.country}` : ""),
      admin1: r.admin1,
      country: r.country,
    })
  );
}

async function geocodeDestination(destination: string): Promise<GeocodeResult | null> {
  try {
    for (const query of geocodeQueryCandidates(destination)) {
      const hits = await searchGeocode(query);
      if (!hits.length) continue;

      const best = [...hits].sort(
        (a, b) => scoreGeocodeHit(b, destination) - scoreGeocodeHit(a, destination)
      )[0];

      return {
        latitude: best.latitude,
        longitude: best.longitude,
        name: best.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function maxForecastIso(): string {
  return format(addDays(new Date(), FORECAST_HORIZON_DAYS - 1), "yyyy-MM-dd");
}

function monthDayKey(isoDate: string): string {
  return isoDate.slice(5); // MM-DD
}

function weatherCodeToText(code: number | null | undefined): string {
  if (code == null || Number.isNaN(code)) return "Typical conditions";
  const map: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",
    95: "Thunderstorm",
  };
  return map[code] ?? "Variable conditions";
}

async function fetchForecastRange(
  geo: GeocodeResult,
  startDate: string,
  endDate: string
): Promise<WeatherDay[]> {
  if (startDate > endDate) return [];

  const params = new URLSearchParams({
    latitude: String(geo.latitude),
    longitude: String(geo.longitude),
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max",
    timezone: "auto",
    start_date: startDate,
    end_date: endDate,
    temperature_unit: "fahrenheit",
    windspeed_unit: "mph",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data?.daily?.time?.length) return [];

  return data.daily.time.flatMap((date: string, i: number) => {
    const high = data.daily.temperature_2m_max[i];
    const low = data.daily.temperature_2m_min[i];
    if (high == null || low == null) return [];
    return [
      {
        date,
        temp_high: Math.round(high),
        temp_low: Math.round(low),
        conditions: weatherCodeToText(data.daily.weathercode[i]),
        rain_chance: data.daily.precipitation_probability_max[i] ?? 0,
        wind_mph: Math.round(data.daily.windspeed_10m_max[i] ?? 0),
        source: "forecast" as const,
      },
    ];
  });
}

/** Typical highs/lows for calendar dates using recent years (Open-Meteo archive). */
async function fetchSeasonalAverages(
  geo: GeocodeResult,
  dates: string[]
): Promise<WeatherDay[]> {
  if (!dates.length) return [];

  const sorted = [...dates].sort();
  const firstMd = monthDayKey(sorted[0]);
  const lastMd = monthDayKey(sorted[sorted.length - 1]);
  const thisYear = new Date().getFullYear();

  const sums = new Map<
    string,
    { high: number; low: number; rain: number; wind: number; code: number; count: number }
  >();

  for (let yearsAgo = 1; yearsAgo <= CLIMATE_LOOKBACK_YEARS; yearsAgo++) {
    const year = thisYear - yearsAgo;
    const yearChunks: Array<{ start: string; end: string }> =
      firstMd <= lastMd
        ? [{ start: `${year}-${firstMd}`, end: `${year}-${lastMd}` }]
        : [
            { start: `${year}-${firstMd}`, end: `${year}-12-31` },
            { start: `${year}-01-01`, end: `${year}-${lastMd}` },
          ];

    for (const chunk of yearChunks) {
      try {
        const params = new URLSearchParams({
          latitude: String(geo.latitude),
          longitude: String(geo.longitude),
          daily:
            "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max",
          timezone: "auto",
          start_date: chunk.start,
          end_date: chunk.end,
          temperature_unit: "fahrenheit",
          windspeed_unit: "mph",
        });
        const res = await fetch(
          `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`,
          { next: { revalidate: 86400 } }
        );
        if (!res.ok) continue;
        const data = await res.json();
        if (!data?.daily?.time?.length) continue;

        data.daily.time.forEach((date: string, i: number) => {
          const high = data.daily.temperature_2m_max[i];
          const low = data.daily.temperature_2m_min[i];
          if (high == null || low == null) return;
          const key = monthDayKey(date);
          const precip = data.daily.precipitation_sum?.[i] ?? 0;
          const existing = sums.get(key) ?? {
            high: 0,
            low: 0,
            rain: 0,
            wind: 0,
            code: 0,
            count: 0,
          };
          sums.set(key, {
            high: existing.high + high,
            low: existing.low + low,
            rain: existing.rain + (precip > 0.1 ? 40 : 15),
            wind: existing.wind + (data.daily.windspeed_10m_max?.[i] ?? 0),
            code: data.daily.weathercode?.[i] ?? existing.code,
            count: existing.count + 1,
          });
        });
      } catch {
        // Try remaining years.
      }
    }
  }

  return dates.flatMap((date) => {
    const avg = sums.get(monthDayKey(date));
    if (!avg || avg.count === 0) return [];
    return [
      {
        date,
        temp_high: Math.round(avg.high / avg.count),
        temp_low: Math.round(avg.low / avg.count),
        conditions: `Typical · ${weatherCodeToText(avg.code)}`,
        rain_chance: Math.round(avg.rain / avg.count),
        wind_mph: Math.round(avg.wind / avg.count),
        source: "seasonal" as const,
      },
    ];
  });
}

export async function fetchWeather(
  destination: string,
  startDate: string,
  endDate: string
): Promise<WeatherData | null> {
  const geo = await geocodeDestination(destination);
  if (!geo) return buildFallbackWeather(destination, startDate, endDate);

  try {
    const tripDates = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    }).map((d) => format(d, "yyyy-MM-dd"));

    const forecastCeiling = maxForecastIso();
    const forecastable = tripDates.filter((date) => date <= forecastCeiling);
    const forecastDays = forecastable.length
      ? await fetchForecastRange(geo, forecastable[0], forecastable[forecastable.length - 1])
      : [];

    const forecastDates = new Set(forecastDays.map((d) => d.date));
    const seasonalDates = tripDates.filter((date) => !forecastDates.has(date));
    const seasonalDays = await fetchSeasonalAverages(geo, seasonalDates);
    const seasonalByDate = new Map(seasonalDays.map((d) => [d.date, d]));

    const daily: WeatherDay[] = tripDates.map((date) => {
      const forecast = forecastDays.find((d) => d.date === date);
      if (forecast) return forecast;
      const seasonal = seasonalByDate.get(date);
      if (seasonal) return seasonal;
      return {
        date,
        temp_high: 72,
        temp_low: 58,
        conditions: "Typical conditions",
        rain_chance: 20,
        wind_mph: 8,
        source: "fallback",
      };
    });

    return {
      location: geo.name,
      daily,
      fetched_at: new Date().toISOString(),
      units: "fahrenheit",
      model: "forecast+seasonal-v2",
    };
  } catch {
    return buildFallbackWeather(destination, startDate, endDate);
  }
}

export function buildFallbackWeather(
  destination: string,
  startDate: string,
  endDate: string
): WeatherData {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const daily: WeatherDay[] = [];
  let current = start;

  while (current <= end) {
    daily.push({
      date: format(current, "yyyy-MM-dd"),
      temp_high: 72,
      temp_low: 58,
      conditions: "Typical conditions",
      rain_chance: 20,
      wind_mph: 8,
      source: "fallback",
    });
    current = addDays(current, 1);
  }

  return {
    location: destination,
    daily,
    fetched_at: new Date().toISOString(),
    units: "fahrenheit",
    // Keep older model so ensureTripWeather retries until geocode/seasonal succeeds.
    model: "forecast+seasonal",
  };
}

export function getWeatherSummary(weather: WeatherData | null): string {
  if (!weather?.daily.length) return "Weather data unavailable";
  const avgHigh =
    weather.daily.reduce((s, d) => s + d.temp_high, 0) / weather.daily.length;
  const avgRain =
    weather.daily.reduce((s, d) => s + d.rain_chance, 0) / weather.daily.length;
  const hasSeasonal = weather.daily.some((d) => d.source === "seasonal");
  const conditions = weather.daily.find((d) => d.source === "forecast")?.conditions
    ?? weather.daily[0]?.conditions
    ?? "Variable";
  const prefix = hasSeasonal ? "Typical " : "";
  return `${prefix}${Math.round(avgHigh)}°F avg high, ${conditions.toLowerCase()}${avgRain > 40 ? ", pack rain gear" : ""}`;
}

export function getForecastHorizonDays() {
  return FORECAST_HORIZON_DAYS;
}
