import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ChevronRight, MapPin, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Trip } from "../types";

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

export function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("trips")
      .select("*")
      .order("start_date", { ascending: false });
    setTrips((data ?? []) as Trip[]);
    setError(queryError?.message ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  return (
    <main className="screen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">Your adventures</p>
          <h1>Packing lists</h1>
        </div>
        <button className="icon-button" onClick={() => void loadTrips()} aria-label="Refresh">
          <RefreshCw size={19} />
        </button>
      </div>

      <Link to="/new" className="primary-button new-trip-button">
        <Plus size={18} />
        Start a new trip
      </Link>

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
        <div className="card-list">
          {trips.map((trip) => (
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
      )}
    </main>
  );
}
