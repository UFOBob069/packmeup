import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { apiUrl, supabase } from "../lib/supabase";
import type { GroupMember } from "../types";

export function NewTripScreen() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelerNames, setTravelerNames] = useState<string[]>([]);
  const [travelerDraft, setTravelerDraft] = useState("");
  const [activities, setActivities] = useState("");
  const [notes, setNotes] = useState("");
  const [group, setGroup] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      supabase.from("group_members").select("*").order("name"),
      supabase.from("profiles").select("name").single(),
    ]).then(([groupResult, profileResult]) => {
      setGroup((groupResult.data ?? []) as GroupMember[]);
      const name = profileResult.data?.name?.split(" ")[0];
      if (name) setTravelerNames([name]);
    });
  }, []);

  const selected = useMemo(
    () => new Set(travelerNames.map((name) => name.toLowerCase())),
    [travelerNames]
  );

  const addTraveler = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || selected.has(trimmed.toLowerCase())) return;
    setTravelerNames((current) => [...current, trimmed]);
    setTravelerDraft("");
  };

  const createTrip = async () => {
    if (!session || !destination.trim() || !startDate || !endDate || !travelerNames.length) {
      setError("Add a destination, dates, and at least one traveler.");
      return;
    }

    setLoading(true);
    setError(null);
    const response = await fetch(`${apiUrl}/api/mobile/trips`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
        travelers: travelerNames.map((name) => {
          const saved = group.find((member) => member.name.toLowerCase() === name.toLowerCase());
          return {
            name,
            traveler_type: saved?.traveler_type ?? "adult",
            pet_species: saved?.pet_species ?? undefined,
            pet_size: saved?.pet_size ?? undefined,
          };
        }),
        travel_type: "checked_bag",
        laundry_access: "limited",
        style_preference: "casual",
        style_preferences: ["casual"],
        packing_mode: "standard",
        activities: activities
          .split(",")
          .map((activity) => activity.trim())
          .filter(Boolean),
        special_notes: notes.trim(),
      }),
    });

    const result = (await response.json()) as { tripId?: string; error?: string };
    if (!response.ok || !result.tripId) {
      setError(result.error ?? "Could not create the trip.");
      setLoading(false);
      return;
    }
    navigate(`/trips/${result.tripId}`, { replace: true });
  };

  return (
    <main className="screen">
      <Link to="/" className="back-link">
        <ArrowLeft size={18} /> Trips
      </Link>
      <div className="screen-heading">
        <div>
          <p className="eyebrow">
            <Sparkles size={14} /> AI packing list
          </p>
          <h1>Start a trip</h1>
        </div>
      </div>

      <div className="form-card">
        <label>
          Destination
          <input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="San Diego, California"
          />
        </label>
        <div className="form-grid">
          <label>
            Departure
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label>
            Return
            <input
              type="date"
              min={startDate}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>
        <fieldset>
          <legend>Travelers</legend>
          {group.length > 0 && (
            <div className="pill-list">
              {group.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  className={`choice-pill ${selected.has(member.name.toLowerCase()) ? "selected" : ""}`}
                  onClick={() =>
                    selected.has(member.name.toLowerCase())
                      ? setTravelerNames((current) =>
                          current.filter((name) => name.toLowerCase() !== member.name.toLowerCase())
                        )
                      : addTraveler(member.name)
                  }
                >
                  {member.traveler_type === "pet" ? "🐾 " : ""}
                  {member.name}
                </button>
              ))}
            </div>
          )}
          <div className="inline-input">
            <input
              value={travelerDraft}
              onChange={(event) => setTravelerDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTraveler(travelerDraft);
                }
              }}
              placeholder="Add a person"
            />
            <button type="button" onClick={() => addTraveler(travelerDraft)}>
              Add
            </button>
          </div>
          <div className="pill-list">
            {travelerNames.map((name) => (
              <button
                type="button"
                className="selected-name"
                key={name}
                onClick={() => setTravelerNames((current) => current.filter((item) => item !== name))}
              >
                {name} ×
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Activities
          <input
            value={activities}
            onChange={(event) => setActivities(event.target.value)}
            placeholder="Beach, hiking, dinner"
          />
        </label>
        <label>
          Anything else?
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Wedding on Saturday, packing light…"
          />
        </label>
      </div>

      {error && <div className="error-card">{error}</div>}
      <button className="primary-button generate-button" onClick={() => void createTrip()} disabled={loading}>
        <Sparkles size={18} />
        {loading ? "Building your list…" : "Build my packing list"}
      </button>
    </main>
  );
}
