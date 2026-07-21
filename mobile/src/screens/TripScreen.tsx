import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CloudRain,
  CloudSun,
  Home,
  ListChecks,
  MapPin,
  PawPrint,
  Plus,
  Shirt,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { apiUrl, supabase } from "../lib/supabase";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Activity,
  type CalendarDay,
  type Outfit,
  type PackingCategory,
  type PackingItem,
  type TripWorkspaceItem,
  type Traveler,
  type Trip,
  type WeatherData,
} from "../types";

type WorkspaceTab = "packing" | "plan" | "outfits";

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function TripScreen() {
  const { id = "" } = useParams();
  const { session } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [workspaceItems, setWorkspaceItems] = useState<TripWorkspaceItem[]>([]);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("packing");
  const [aiUpdate, setAiUpdate] = useState<string[] | null>(null);
  const [newItem, setNewItem] = useState("");
  const [groceryDraft, setGroceryDraft] = useState("");
  const [arrivalDraft, setArrivalDraft] = useState("");
  const [newCategory, setNewCategory] = useState<PackingCategory>("miscellaneous");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrip = useCallback(async () => {
    const [
      tripResult,
      travelersResult,
      itemsResult,
      outfitsResult,
      calendarResult,
      activitiesResult,
      workspaceResult,
    ] = await Promise.all([
      supabase.from("trips").select("*").eq("id", id).single(),
      supabase.from("travelers").select("*").eq("trip_id", id).order("sort_order"),
      supabase.from("packing_items").select("*").eq("trip_id", id).order("sort_order"),
      supabase.from("outfits").select("*").eq("trip_id", id).order("trip_date"),
      supabase.from("calendar_days").select("*").eq("trip_id", id).order("trip_date"),
      supabase.from("activities").select("*").eq("trip_id", id).order("activity_name"),
      supabase
        .from("trip_workspace_items")
        .select("*")
        .eq("trip_id", id)
        .order("sort_order"),
    ]);
    setTrip((tripResult.data as Trip | null) ?? null);
    setTravelers((travelersResult.data ?? []) as Traveler[]);
    setItems((itemsResult.data ?? []) as PackingItem[]);
    setOutfits((outfitsResult.data ?? []) as Outfit[]);
    setCalendarDays((calendarResult.data ?? []) as CalendarDay[]);
    setActivities((activitiesResult.data ?? []) as Activity[]);
    setWorkspaceItems((workspaceResult.data ?? []) as TripWorkspaceItem[]);
    setError(
      tripResult.error?.message ??
        itemsResult.error?.message ??
        outfitsResult.error?.message ??
        calendarResult.error?.message ??
        activitiesResult.error?.message ??
        null
    );
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void loadTrip();
    const channel = supabase
      .channel(`mobile-packing-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "packing_items", filter: `trip_id=eq.${id}` },
        () => void loadTrip()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, loadTrip]);

  useEffect(() => {
    if (!session?.access_token || !id) return;
    let cancelled = false;
    void fetch(`${apiUrl}/api/mobile/trips/${id}/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          addedItems?: { name: string; reason: string }[];
        };
      })
      .then((result) => {
        if (cancelled || !result) return;
        const added = result.addedItems?.map((item) => item.name) ?? [];
        if (added.length > 0) {
          setAiUpdate(added);
          void loadTrip();
        }
      })
      .catch(() => {
        // The workspace remains usable offline; refresh again on the next visit.
      });
    return () => {
      cancelled = true;
    };
  }, [id, loadTrip, session?.access_token]);

  const packedCount = items.filter((item) => item.packed).length;
  const progress = items.length ? Math.round((packedCount / items.length) * 100) : 0;
  const sharedCount = items.filter((item) => item.shared).length;
  const groceryItems = workspaceItems.filter((item) => item.kind === "grocery");
  const arrivalItems = workspaceItems.filter((item) => item.kind === "arrival");
  const reminderItems = workspaceItems.filter((item) => item.kind === "reminder");
  const weather = trip?.weather_data as WeatherData | null;
  const travelersById = useMemo(
    () => Object.fromEntries(travelers.map((traveler) => [traveler.id, traveler.name])),
    [travelers]
  );

  const togglePacked = async (item: PackingItem) => {
    const next = !item.packed;
    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, packed: next } : candidate
      )
    );
    const { error: updateError } = await supabase
      .from("packing_items")
      .update({ packed: next })
      .eq("id", item.id);
    if (updateError) {
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id ? { ...candidate, packed: item.packed } : candidate
        )
      );
      setError(updateError.message);
    }
  };

  const addItem = async () => {
    const name = newItem.trim();
    if (!name) return;
    const { data, error: insertError } = await supabase
      .from("packing_items")
      .insert({
        trip_id: id,
        item_name: name,
        category: newCategory,
        quantity: 1,
        packed: false,
        shared: true,
        sort_order: items.length,
      })
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setItems((current) => [...current, data as PackingItem]);
    setNewItem("");
  };

  const addWorkspaceItem = async (
    kind: TripWorkspaceItem["kind"],
    title: string,
    clear: () => void
  ) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const { data, error: insertError } = await supabase
      .from("trip_workspace_items")
      .insert({
        trip_id: id,
        kind,
        title: trimmed,
        completed: false,
        sort_order: workspaceItems.filter((item) => item.kind === kind).length,
      })
      .select()
      .single();
    if (insertError) {
      setError(
        insertError.code === "42P01"
          ? "Run migration 011_trip_workspace_items.sql to enable groceries and arrival info."
          : insertError.message
      );
      return;
    }
    setWorkspaceItems((current) => [...current, data as TripWorkspaceItem]);
    clear();
  };

  const toggleWorkspaceItem = async (item: TripWorkspaceItem) => {
    const completed = !item.completed;
    setWorkspaceItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, completed } : candidate
      )
    );
    const { error: updateError } = await supabase
      .from("trip_workspace_items")
      .update({ completed })
      .eq("id", item.id);
    if (updateError) {
      setWorkspaceItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id ? { ...candidate, completed: item.completed } : candidate
        )
      );
      setError(updateError.message);
    }
  };

  if (loading) return <main className="screen empty-state">Loading packing list…</main>;
  if (!trip || error)
    return (
      <main className="screen">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} /> Trips
        </Link>
        <div className="error-card">{error ?? "Trip not found"}</div>
      </main>
    );

  return (
    <main className="screen">
      <Link to="/" className="back-link">
        <ArrowLeft size={18} /> Trips
      </Link>

      <section className="trip-workspace-hero">
        {trip.cover_image_url ? (
          <img src={trip.cover_image_url} alt="" />
        ) : (
          <div className="trip-workspace-hero-fallback">
            <MapPin size={34} />
          </div>
        )}
        <div className="trip-workspace-hero-overlay">
          <p>YOUR TRIP WORKSPACE</p>
          <h1>{trip.destination}</h1>
          <span>
            <CalendarDays size={13} />
            {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
          </span>
        </div>
        {weather?.daily?.[0] && (
          <span className="trip-hero-weather">
            <CloudSun size={17} />
            {Math.round(weather.daily[0].temp_high)}°
          </span>
        )}
      </section>

      <div className="trip-summary-grid">
        <div>
          <strong>{progress}%</strong>
          <small>Packed</small>
        </div>
        <div>
          <strong>{outfits.length}</strong>
          <small>Outfits</small>
        </div>
        <div>
          <strong>{calendarDays.length}</strong>
          <small>Days</small>
        </div>
        <div>
          <strong>{sharedCount}</strong>
          <small>Shared</small>
        </div>
      </div>

      <nav className="workspace-tabs" aria-label="Trip workspace sections">
        <button
          className={activeTab === "packing" ? "active" : ""}
          onClick={() => setActiveTab("packing")}
        >
          <ListChecks size={17} /> Packing
        </button>
        <button
          className={activeTab === "plan" ? "active" : ""}
          onClick={() => setActiveTab("plan")}
        >
          <CalendarDays size={17} /> Plan
        </button>
        <button
          className={activeTab === "outfits" ? "active" : ""}
          onClick={() => setActiveTab("outfits")}
        >
          <Shirt size={17} /> Outfits
        </button>
      </nav>

      {aiUpdate && aiUpdate.length > 0 && (
        <div className="mobile-ai-update">
          <span>
            <Sparkles size={16} />
          </span>
          <div>
            <strong>Your trip plan was updated</strong>
            <p>
              Added {aiUpdate.slice(0, 3).join(", ")}
              {aiUpdate.length > 3 ? ` and ${aiUpdate.length - 3} more` : ""}.
            </p>
          </div>
          <button onClick={() => setAiUpdate(null)} aria-label="Dismiss update">
            ×
          </button>
        </div>
      )}

      {activeTab === "packing" && (
        <>
          <div className="progress-track" aria-label={`${progress}% packed`}>
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>

          <section className="quick-add">
            <input
              value={newItem}
              onChange={(event) => setNewItem(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void addItem()}
              placeholder="Add an item"
            />
            <select
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value as PackingCategory)}
              aria-label="Category"
            >
              {CATEGORIES.map((category) => (
                <option value={category} key={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            <button className="icon-button primary-icon" onClick={() => void addItem()}>
              <Plus size={19} />
            </button>
          </section>

          {CATEGORIES.map((category) => {
            const categoryItems = items.filter((item) => item.category === category);
            if (!categoryItems.length) return null;
            return (
              <section className="checklist-section" key={category}>
                <h2>{CATEGORY_LABELS[category]}</h2>
                <div className="checklist">
                  {categoryItems.map((item) => (
                    <button
                      key={item.id}
                      className={`checklist-row ${item.parent_item_id ? "subitem" : ""}`}
                      onClick={() => void togglePacked(item)}
                    >
                      <span className={`checkbox ${item.packed ? "checked" : ""}`}>
                        {item.packed && <Check size={15} />}
                      </span>
                      <span className={item.packed ? "packed-label" : ""}>
                        {item.item_name}
                        {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                      </span>
                      <small>
                        {item.traveler_id ? travelersById[item.traveler_id] : "Shared"}
                      </small>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}

      {activeTab === "plan" && (
        <div className="workspace-panel-list">
          {weather?.daily?.length ? (
            <section className="workspace-panel">
              <div className="workspace-panel-heading">
                <CloudSun size={20} />
                <div>
                  <h2>Live weather</h2>
                  <p>{weather.location}</p>
                </div>
              </div>
              <div className="weather-days">
                {weather.daily.slice(0, 5).map((day) => (
                  <div key={day.date}>
                    <strong>{formatDate(day.date, { weekday: "short" }).split(",")[0]}</strong>
                    {day.rain_chance > 40 ? <CloudRain size={18} /> : <CloudSun size={18} />}
                    <span>{Math.round(day.temp_high)}°</span>
                    <small>{day.rain_chance}% rain</small>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activities.length > 0 && (
            <section className="workspace-panel">
              <div className="workspace-panel-heading">
                <MapPin size={20} />
                <div>
                  <h2>Activities</h2>
                  <p>What this trip is built around</p>
                </div>
              </div>
              <div className="activity-pills">
                {activities.map((activity) => (
                  <span key={activity.id}>{activity.activity_name}</span>
                ))}
              </div>
            </section>
          )}

          <section className="workspace-panel">
            <div className="workspace-panel-heading">
              <ShoppingCart size={20} />
              <div>
                <h2>Grocery list</h2>
                <p>
                  {groceryItems.filter((item) => item.completed).length} of {groceryItems.length}{" "}
                  picked up
                </p>
              </div>
            </div>
            <div className="workspace-quick-add">
              <input
                value={groceryDraft}
                onChange={(event) => setGroceryDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void addWorkspaceItem("grocery", groceryDraft, () => setGroceryDraft(""));
                  }
                }}
                placeholder="Add groceries"
              />
              <button
                onClick={() =>
                  void addWorkspaceItem("grocery", groceryDraft, () => setGroceryDraft(""))
                }
                aria-label="Add grocery item"
              >
                <Plus size={17} />
              </button>
            </div>
            {groceryItems.length > 0 && (
              <div className="workspace-checks">
                {groceryItems.map((item) => (
                  <button key={item.id} onClick={() => void toggleWorkspaceItem(item)}>
                    <span className={item.completed ? "complete" : ""}>
                      {item.completed && <Check size={12} />}
                    </span>
                    <strong className={item.completed ? "done" : ""}>{item.title}</strong>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="workspace-panel">
            <div className="workspace-panel-heading">
              <Home size={20} />
              <div>
                <h2>Arrival & check-in</h2>
                <p>Keep confirmations, door codes, and arrival details together</p>
              </div>
            </div>
            <div className="workspace-quick-add">
              <input
                value={arrivalDraft}
                onChange={(event) => setArrivalDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void addWorkspaceItem("arrival", arrivalDraft, () => setArrivalDraft(""));
                  }
                }}
                placeholder="Add check-in detail"
              />
              <button
                onClick={() =>
                  void addWorkspaceItem("arrival", arrivalDraft, () => setArrivalDraft(""))
                }
                aria-label="Add arrival detail"
              >
                <Plus size={17} />
              </button>
            </div>
            {arrivalItems.length > 0 && (
              <div className="arrival-list">
                {arrivalItems.map((item) => (
                  <article key={item.id}>
                    <strong>{item.title}</strong>
                    {item.details && <p>{item.details}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>

          {reminderItems.length > 0 && (
            <section className="workspace-panel">
              <div className="workspace-panel-heading">
                <Sparkles size={20} />
                <div>
                  <h2>Before-you-go reminders</h2>
                  <p>Shopping and departure tasks</p>
                </div>
              </div>
              <div className="workspace-checks">
                {reminderItems.map((item) => (
                  <button key={item.id} onClick={() => void toggleWorkspaceItem(item)}>
                    <span className={item.completed ? "complete" : ""}>
                      {item.completed && <Check size={12} />}
                    </span>
                    <strong className={item.completed ? "done" : ""}>{item.title}</strong>
                  </button>
                ))}
              </div>
            </section>
          )}

          {calendarDays.map((day) => (
            <section className="workspace-panel timeline-day" key={day.id}>
              <time>{formatDate(day.trip_date, { weekday: "short" })}</time>
              <div>
                <h2>{day.title}</h2>
                {day.weather_summary && <p>{day.weather_summary}</p>}
                {day.activities?.length > 0 && (
                  <div className="activity-pills">
                    {day.activities.map((activity) => (
                      <span key={activity}>{activity}</span>
                    ))}
                  </div>
                )}
                {day.notes && <p className="day-note">{day.notes}</p>}
              </div>
            </section>
          ))}

          <section className="workspace-panel">
            <div className="workspace-panel-heading">
              <Users size={20} />
              <div>
                <h2>Travelers & shared items</h2>
                <p>
                  {travelers.length} travelers · {sharedCount} shared packing items
                </p>
              </div>
            </div>
            <div className="activity-pills">
              {travelers.map((traveler) => (
                <span key={traveler.id}>
                  {traveler.traveler_type === "pet" ? <PawPrint size={12} /> : null}
                  {traveler.name}
                </span>
              ))}
            </div>
          </section>

          {trip.special_notes && (
            <section className="workspace-panel">
              <div className="workspace-panel-heading">
                <Sparkles size={20} />
                <div>
                  <h2>Trip details</h2>
                  <p>Arrival notes and destination preparation</p>
                </div>
              </div>
              <p className="workspace-notes">{trip.special_notes}</p>
            </section>
          )}
        </div>
      )}

      {activeTab === "outfits" && (
        <div className="workspace-panel-list">
          {outfits.length === 0 ? (
            <div className="empty-state">
              <Shirt size={32} />
              <h2>No outfits yet</h2>
              <p>Your AI outfit suggestions will appear here.</p>
            </div>
          ) : (
            outfits.map((outfit) => (
              <section className="workspace-panel outfit-card" key={outfit.id}>
                <div className="outfit-date">
                  <Shirt size={18} />
                  <span>{formatDate(outfit.trip_date, { weekday: "short" })}</span>
                  <small>{outfit.time_of_day.replace("_", " ")}</small>
                </div>
                <h2>{outfit.title}</h2>
                <p>{outfit.description}</p>
                {outfit.items?.length > 0 && (
                  <div className="activity-pills">
                    {outfit.items.map((item, index) => (
                      <span key={`${item.name}-${index}`}>{item.name}</span>
                    ))}
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      )}
    </main>
  );
}
