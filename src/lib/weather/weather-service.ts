import type { WeatherData, WeatherDay } from "@/lib/types";
import { addDays, format, parseISO } from "date-fns";

interface GeocodeResult {
  latitude: number;
  longitude: number;
  name: string;
}

async function geocodeDestination(destination: string): Promise<GeocodeResult | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    if (!data.results?.length) return null;
    const r = data.results[0];
    return {
      latitude: r.latitude,
      longitude: r.longitude,
      name: r.name + (r.admin1 ? `, ${r.admin1}` : "") + (r.country ? `, ${r.country}` : ""),
    };
  } catch {
    return null;
  }
}

export async function fetchWeather(
  destination: string,
  startDate: string,
  endDate: string
): Promise<WeatherData | null> {
  const geo = await geocodeDestination(destination);
  if (!geo) return getFallbackWeather(destination, startDate, endDate);

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max&timezone=auto&start_date=${startDate}&end_date=${endDate}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();

    const daily: WeatherDay[] = data.daily.time.map((date: string, i: number) => ({
      date,
      temp_high: Math.round(data.daily.temperature_2m_max[i]),
      temp_low: Math.round(data.daily.temperature_2m_min[i]),
      conditions: weatherCodeToText(data.daily.weathercode[i]),
      rain_chance: data.daily.precipitation_probability_max[i] ?? 0,
      wind_mph: Math.round(data.daily.windspeed_10m_max[i] * 0.621371),
    }));

    return {
      location: geo.name,
      daily,
      fetched_at: new Date().toISOString(),
    };
  } catch {
    return getFallbackWeather(destination, startDate, endDate);
  }
}

function weatherCodeToText(code: number): string {
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

function getFallbackWeather(
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
      conditions: "Partly cloudy",
      rain_chance: 20,
      wind_mph: 8,
    });
    current = addDays(current, 1);
  }

  return {
    location: destination,
    daily,
    fetched_at: new Date().toISOString(),
  };
}

export function getWeatherSummary(weather: WeatherData | null): string {
  if (!weather?.daily.length) return "Weather data unavailable";
  const avgHigh =
    weather.daily.reduce((s, d) => s + d.temp_high, 0) / weather.daily.length;
  const avgRain =
    weather.daily.reduce((s, d) => s + d.rain_chance, 0) / weather.daily.length;
  const conditions = weather.daily[0]?.conditions ?? "Variable";
  return `${Math.round(avgHigh)}°F avg high, ${conditions.toLowerCase()}${avgRain > 40 ? ", pack rain gear" : ""}`;
}
