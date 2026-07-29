import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  CloudSun,
  Link2,
  Luggage,
  MapPin,
  PawPrint,
  Plus,
  RefreshCw,
  Shirt,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import type { Trip } from "../types";

interface TripStats {
  packed: number;
  packing: number;
  outfits: number;
  days: number;
  shared: number;
  pets: number;
}

type StatsByTrip = Record<string, TripStats>;

function formatTripDates(trip: Trip) {
  const start = new Date(`${trip.start_date}T12:00:00`);
  const end = new Date(`${trip.end_date}T12:00:00`);
  return `${start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: start.getFullYear() === end.getFullYear() ? undefined : "numeric",
  })}`;
}

function getWeatherLabel(weather: unknown) {
  if (!weather || typeof weather !== "object") return null;
  const value = weather as Record<string, unknown>;
  const days = Array.isArray(value.days) ? value.days : [];
  const firstDay = days[0];
  if (firstDay && typeof firstDay === "object") {
    const day = firstDay as Record<string, unknown>;
    const temperature = day.temperature_high ?? day.temp_max ?? day.temperature;
    if (typeof temperature === "number") return `${Math.round(temperature)}°`;
  }
  const current = value.temperature ?? value.temp;
  return typeof current === "number" ? `${Math.round(current)}°` : null;
}

export function TripsScreen() {
  const { session } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<StatsByTrip>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("trips")
      .select("*")
      .order("start_date", { ascending: true });
    const nextTrips = (data ?? []) as Trip[];
    setTrips(nextTrips);

    if (queryError || nextTrips.length === 0) {
      setStats({});
      setError(queryError?.message ?? null);
      setLoading(false);
      return;
    }

    const tripIds = nextTrips.map((trip) => trip.id);
    const [packingResult, outfitsResult, calendarResult, travelersResult] = await Promise.all([
      supabase.from("packing_items").select("trip_id, packed, shared").in("trip_id", tripIds),
      supabase.from("outfits").select("trip_id").in("trip_id", tripIds),
      supabase.from("calendar_days").select("trip_id").in("trip_id", tripIds),
      supabase.from("travelers").select("trip_id, traveler_type").in("trip_id", tripIds),
    ]);

    const nextStats = Object.fromEntries(
      tripIds.map((id) => [
        id,
        { packed: 0, packing: 0, outfits: 0, days: 0, shared: 0, pets: 0 },
      ])
    ) as StatsByTrip;
    for (const item of packingResult.data ?? []) {
      const tripStats = nextStats[item.trip_id];
      if (!tripStats) continue;
      tripStats.packing += 1;
      if (item.packed) tripStats.packed += 1;
      if (item.shared) tripStats.shared += 1;
    }
    for (const outfit of outfitsResult.data ?? []) nextStats[outfit.trip_id]!.outfits += 1;
    for (const day of calendarResult.data ?? []) nextStats[day.trip_id]!.days += 1;
    for (const traveler of travelersResult.data ?? []) {
      if (traveler.traveler_type === "pet") nextStats[traveler.trip_id]!.pets += 1;
    }
    setStats(nextStats);
    setError(
      packingResult.error?.message ??
        outfitsResult.error?.message ??
        calendarResult.error?.message ??
        travelersResult.error?.message ??
        null
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const featuredTrip = trips[0];
  const otherTrips = trips.slice(1);
  const featuredStats = featuredTrip ? stats[featuredTrip.id] : undefined;
  const progress =
    featuredStats?.packing && featuredStats.packing > 0
      ? Math.round((featuredStats.packed / featuredStats.packing) * 100)
      : 0;
  const firstName =
    session?.user.user_metadata?.full_name?.split(" ")[0] ??
    session?.user.user_metadata?.name?.split(" ")[0] ??
    "Traveler";

  return (
    <main className="screen home-screen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">
            <Sparkles size={14} /> Everything before departure
          </p>
          <h1>Welcome, {firstName}</h1>
        </div>
        <button className="icon-button" onClick={() => void loadTrips()} aria-label="Refresh">
          <RefreshCw size={19} />
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading your trips…</div>
      ) : error ? (
        <div className="error-card">{error}</div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <MapPin size={34} />
          <h2>No trips yet</h2>
          <p>Start a trip and we’ll build your packing list.</p>
        </div>
      ) : (
        <>
          {featuredTrip && (
            <Link to={`/trips/${featuredTrip.id}`} className="featured-trip">
              <div className="featured-cover">
                {featuredTrip.cover_image_url ? (
                  <img src={featuredTrip.cover_image_url} alt="" />
                ) : (
                  <div className="featured-cover-fallback">
                    <MapPin size={34} />
                  </div>
                )}
                <div className="featured-cover-overlay">
                  <div>
                    <span className="featured-kicker">Your next trip</span>
                    <h2>{featuredTrip.destination}</h2>
                    <p>
                      <CalendarDays size={13} />
                      {formatTripDates(featuredTrip)}
                    </p>
                  </div>
                  {getWeatherLabel(featuredTrip.weather_data) && (
                    <span className="featured-weather">
                      <CloudSun size={17} />
                      {getWeatherLabel(featuredTrip.weather_data)}
                    </span>
                  )}
                </div>
              </div>

              <div className="featured-progress">
                <span>{progress}%</span>
                <div>
                  <strong>Packing progress</strong>
                  <small>
                    {featuredStats?.packed ?? 0} of {featuredStats?.packing ?? 0} packed
                  </small>
                </div>
                <ChevronRight size={20} />
              </div>

              <div className="workspace-stats">
                <div>
                  <Luggage size={17} />
                  <strong>{featuredStats?.packing ?? 0}</strong>
                  <small>Items</small>
                </div>
                <div>
                  <Shirt size={17} />
                  <strong>{featuredStats?.outfits ?? 0}</strong>
                  <small>Outfits</small>
                </div>
                <div>
                  <CalendarDays size={17} />
                  <strong>{featuredStats?.days ?? 0}</strong>
                  <small>Days</small>
                </div>
                <div>
                  <Users size={17} />
                  <strong>{featuredStats?.shared ?? 0}</strong>
                  <small>Shared</small>
                </div>
                {Boolean(featuredStats?.pets) && (
                  <div>
                    <PawPrint size={17} />
                    <strong>{featuredStats?.pets}</strong>
                    <small>Pets</small>
                  </div>
                )}
              </div>
            </Link>
          )}

          <div className="home-actions">
            <Link to="/new" className="primary-button new-trip-button">
              <Plus size={18} />
              Generate a new trip plan
            </Link>
            <Link to="/join" className="secondary-button join-trip-button">
              <Link2 size={16} />
              Join a trip
            </Link>
          </div>

          {otherTrips.length > 0 && (
            <section className="past-trips">
              <h2>More trips</h2>
              <div className="card-list">
                {otherTrips.map((trip) => (
                  <Link to={`/trips/${trip.id}`} className="trip-card" key={trip.id}>
                    {trip.cover_image_url ? (
                      <img src={trip.cover_image_url} alt="" className="trip-image" />
                    ) : (
                      <div className="trip-image trip-image-fallback">
                        <MapPin size={28} />
                      </div>
                    )}
                    <div className="trip-card-content">
                      <h2>{trip.destination}</h2>
                      <p>
                        <CalendarDays size={14} />
                        {formatTripDates(trip)}
                      </p>
                    </div>
                    <ChevronRight size={20} className="muted-icon" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {!loading && trips.length === 0 && (
        <div className="home-actions">
          <Link to="/new" className="primary-button new-trip-button">
            <Plus size={18} />
            Generate my trip plan
          </Link>
          <Link to="/join" className="secondary-button join-trip-button">
            <Link2 size={16} />
            Join a trip
          </Link>
        </div>
      )}
    </main>
  );
}
