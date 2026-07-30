import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { apiUrl, supabase } from "../lib/supabase";
import type { GroupMember, TravelerType } from "../types";

type PetSpecies = "dog" | "cat" | "other";
type PetSize = "small" | "medium" | "large";

interface DraftTraveler {
  name: string;
  traveler_type: TravelerType;
  pet_species?: PetSpecies;
  pet_size?: PetSize;
}

export function NewTripScreen() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelers, setTravelers] = useState<DraftTraveler[]>([]);
  const [travelerDraft, setTravelerDraft] = useState("");
  const [draftType, setDraftType] = useState<TravelerType>("adult");
  const [draftSpecies, setDraftSpecies] = useState<PetSpecies>("dog");
  const [draftSize, setDraftSize] = useState<PetSize>("medium");
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
      if (name) {
        setTravelers([{ name, traveler_type: "adult" }]);
      }
    });
  }, []);

  const selected = useMemo(
    () => new Set(travelers.map((traveler) => traveler.name.toLowerCase())),
    [travelers]
  );

  const addTraveler = (input: DraftTraveler) => {
    const trimmed = input.name.trim();
    if (!trimmed || selected.has(trimmed.toLowerCase())) return;
    setTravelers((current) => [
      ...current,
      {
        name: trimmed,
        traveler_type: input.traveler_type,
        pet_species: input.traveler_type === "pet" ? input.pet_species ?? "dog" : undefined,
        pet_size: input.traveler_type === "pet" ? input.pet_size ?? "medium" : undefined,
      },
    ]);
    setTravelerDraft("");
    setDraftType("adult");
  };

  const toggleGroupMember = (member: GroupMember) => {
    if (selected.has(member.name.toLowerCase())) {
      setTravelers((current) =>
        current.filter((traveler) => traveler.name.toLowerCase() !== member.name.toLowerCase())
      );
      return;
    }
    addTraveler({
      name: member.name,
      traveler_type: member.traveler_type,
      pet_species: member.pet_species ?? undefined,
      pet_size: member.pet_size ?? undefined,
    });
  };

  const createTrip = async () => {
    if (!session || !destination.trim() || !startDate || !endDate || !travelers.length) {
      setError("Add a destination, dates, and at least one traveler.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
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
          travelers: travelers.map((traveler) => ({
            name: traveler.name,
            traveler_type: traveler.traveler_type,
            pet_species: traveler.traveler_type === "pet" ? traveler.pet_species : undefined,
            pet_size: traveler.traveler_type === "pet" ? traveler.pet_size : undefined,
          })),
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

      const result = (await response.json().catch(() => ({}))) as {
        tripId?: string;
        error?: string;
        openaiConfigured?: boolean;
      };
      if (!response.ok || !result.tripId) {
        setError(result.error ?? `Could not create the trip (${response.status}).`);
        setLoading(false);
        return;
      }
      navigate(`/trips/${result.tripId}`, { replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Network error talking to PackForVacation. Check your connection and try again."
      );
      setLoading(false);
    }
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
                  onClick={() => toggleGroupMember(member)}
                >
                  {member.traveler_type === "pet" ? "🐾 " : ""}
                  {member.name}
                </button>
              ))}
            </div>
          )}
          <div className="traveler-draft">
            <div className="inline-input">
              <input
                value={travelerDraft}
                onChange={(event) => setTravelerDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTraveler({
                      name: travelerDraft,
                      traveler_type: draftType,
                      pet_species: draftSpecies,
                      pet_size: draftSize,
                    });
                  }
                }}
                placeholder={draftType === "pet" ? "Pet name" : "Add a person"}
              />
              <button
                type="button"
                onClick={() =>
                  addTraveler({
                    name: travelerDraft,
                    traveler_type: draftType,
                    pet_species: draftSpecies,
                    pet_size: draftSize,
                  })
                }
              >
                Add
              </button>
            </div>
            <div className="form-grid traveler-type-grid">
              <label>
                Type
                <select
                  value={draftType}
                  onChange={(event) => setDraftType(event.target.value as TravelerType)}
                >
                  <option value="adult">Adult</option>
                  <option value="child">Child</option>
                  <option value="infant">Infant</option>
                  <option value="pet">Pet</option>
                </select>
              </label>
              {draftType === "pet" && (
                <>
                  <label>
                    Species
                    <select
                      value={draftSpecies}
                      onChange={(event) => setDraftSpecies(event.target.value as PetSpecies)}
                    >
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label>
                    Size
                    <select
                      value={draftSize}
                      onChange={(event) => setDraftSize(event.target.value as PetSize)}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </label>
                </>
              )}
            </div>
          </div>
          <div className="pill-list">
            {travelers.map((traveler) => (
              <button
                type="button"
                className="selected-name"
                key={traveler.name}
                onClick={() =>
                  setTravelers((current) =>
                    current.filter((item) => item.name !== traveler.name)
                  )
                }
              >
                {traveler.traveler_type === "pet" ? "🐾 " : ""}
                {traveler.name}
                {traveler.traveler_type === "pet" && traveler.pet_species
                  ? ` · ${traveler.pet_species}/${traveler.pet_size ?? "medium"}`
                  : ""}{" "}
                ×
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
