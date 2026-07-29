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
  MessageCircle,
  MessagesSquare,
  PawPrint,
  Plus,
  Share2,
  ShoppingCart,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DayPlanSection } from "../components/DayPlanSection";
import { PackingHelpPanel } from "../components/PackingHelpPanel";
import { TripChatPanel } from "../components/TripChatPanel";
import { useAuth } from "../lib/auth";
import { buildShareLink, buildShareMessage, shareOrCopyText } from "../lib/share";
import { apiUrl, supabase } from "../lib/supabase";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Activity,
  type CalendarDay,
  type Outfit,
  type PackingCategory,
  type PackingItem,
  type TripMember,
  type TripWorkspaceItem,
  type Traveler,
  type Trip,
  type WeatherData,
} from "../types";

type WorkspaceTab = "packing" | "plan" | "chat" | "help";
type PackingFilter = "mine" | "shared" | "all";

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function TripScreen() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [workspaceItems, setWorkspaceItems] = useState<TripWorkspaceItem[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("packing");
  const [packingFilter, setPackingFilter] = useState<PackingFilter>("all");
  const [aiUpdate, setAiUpdate] = useState<string[] | null>(null);
  const [newItem, setNewItem] = useState("");
  const [addShared, setAddShared] = useState(false);
  const [groceryDraft, setGroceryDraft] = useState("");
  const [arrivalDraft, setArrivalDraft] = useState("");
  const [reminderDraft, setReminderDraft] = useState("");
  const [activityDraft, setActivityDraft] = useState("");
  const [newCategory, setNewCategory] = useState<PackingCategory>("miscellaneous");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadTrip = useCallback(async () => {
    const [
      tripResult,
      travelersResult,
      itemsResult,
      outfitsResult,
      calendarResult,
      activitiesResult,
      workspaceResult,
      membersResult,
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
      supabase.from("trip_members").select("*, profile:profiles(*)").eq("trip_id", id),
    ]);
    setTrip((tripResult.data as Trip | null) ?? null);
    setTravelers((travelersResult.data ?? []) as Traveler[]);
    setItems((itemsResult.data ?? []) as PackingItem[]);
    setOutfits((outfitsResult.data ?? []) as Outfit[]);
    setCalendarDays((calendarResult.data ?? []) as CalendarDay[]);
    setActivities((activitiesResult.data ?? []) as Activity[]);
    setWorkspaceItems((workspaceResult.data ?? []) as TripWorkspaceItem[]);
    setMembers((membersResult.data ?? []) as TripMember[]);
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
  const isOwner = Boolean(trip && session?.user?.id && trip.owner_id === session.user.id);
  const filteredItems = useMemo(() => {
    const topLevel = items.filter((item) => !item.parent_item_id);
    if (packingFilter === "shared") return topLevel.filter((item) => item.shared);
    if (packingFilter === "mine") {
      return topLevel.filter(
        (item) => !item.shared && (item.user_id === session?.user?.id || !item.user_id)
      );
    }
    return topLevel;
  }, [items, packingFilter, session?.user?.id]);
  const childrenByParent = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (!item.parent_item_id) return acc;
        if (!acc[item.parent_item_id]) acc[item.parent_item_id] = [];
        acc[item.parent_item_id].push(item);
        return acc;
      },
      {} as Record<string, PackingItem[]>
    );
  }, [items]);

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
    if (!name || !session?.user?.id) return;
    const shared = addShared;
    const { data, error: insertError } = await supabase
      .from("packing_items")
      .insert({
        trip_id: id,
        item_name: name,
        category: newCategory,
        quantity: 1,
        packed: false,
        shared,
        user_id: session.user.id,
        traveler_id: null,
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

  const removeItem = async (item: PackingItem) => {
    if (!window.confirm(`Remove "${item.item_name}"?`)) return;
    const { error: deleteError } = await supabase.from("packing_items").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setItems((current) =>
      current.filter((candidate) => candidate.id !== item.id && candidate.parent_item_id !== item.id)
    );
  };

  const saveItemNotes = async (item: PackingItem, notes: string) => {
    const trimmed = notes.trim() || null;
    if ((item.notes ?? null) === trimmed) return;
    const { error: updateError } = await supabase
      .from("packing_items")
      .update({ notes: trimmed })
      .eq("id", item.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, notes: trimmed } : candidate
      )
    );
  };

  const shareTrip = async () => {
    if (!trip?.share_token || !session?.user) return;
    const inviterName =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email?.split("@")[0] ||
      "A traveler";
    const shareLink = buildShareLink(trip.share_token);
    const message = buildShareMessage({
      inviterName: String(inviterName),
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      shareLink,
    });
    const result = await shareOrCopyText("Join this trip", message, shareLink);
    if (result === "copied") setStatusMessage("Invite message copied");
    if (result === "shared") setStatusMessage("Invite shared");
  };

  const deleteTrip = async () => {
    if (!trip || !isOwner) return;
    if (!window.confirm(`Delete packing list for ${trip.destination}?`)) return;
    const { error: deleteError } = await supabase.from("trips").delete().eq("id", trip.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    navigate("/", { replace: true });
  };

  const addActivity = async () => {
    const name = activityDraft.trim();
    if (!name) return;
    const { data, error: insertError } = await supabase
      .from("activities")
      .insert({ trip_id: id, activity_name: name })
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setActivities((current) => [...current, data as Activity]);
    setActivityDraft("");
  };

  const removeActivity = async (activity: Activity) => {
    const { error: deleteError } = await supabase.from("activities").delete().eq("id", activity.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setActivities((current) => current.filter((candidate) => candidate.id !== activity.id));
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
  if (!trip)
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

      <div className="trip-toolbar">
        <button type="button" className="secondary-button" onClick={() => void shareTrip()}>
          <Share2 size={15} />
          Share
        </button>
        {isOwner ? (
          <button type="button" className="secondary-button danger" onClick={() => void deleteTrip()}>
            <Trash2 size={15} />
            Delete
          </button>
        ) : null}
      </div>
      {statusMessage ? <p className="status-banner">{statusMessage}</p> : null}
      {error ? <div className="error-card">{error}</div> : null}

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
          <strong>{calendarDays.length || "—"}</strong>
          <small>Days</small>
        </div>
        <div>
          <strong>{outfits.length}</strong>
          <small>Plans</small>
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
          <CalendarDays size={17} /> By Day
        </button>
        <button
          className={activeTab === "chat" ? "active" : ""}
          onClick={() => setActiveTab("chat")}
        >
          <MessagesSquare size={17} /> Chat
        </button>
        <button
          className={activeTab === "help" ? "active" : ""}
          onClick={() => setActiveTab("help")}
        >
          <Sparkles size={17} /> Help
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

          <div className="filter-pills" role="tablist" aria-label="Packing filter">
            {(
              [
                ["all", "All"],
                ["mine", "Personal"],
                ["shared", "Shared"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={packingFilter === value ? "active" : ""}
                onClick={() => setPackingFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="day-plan-hint">
            Personal clothes stay private. Shared items are visible to everyone on the trip.
          </p>

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
            <label className="shared-toggle">
              <input
                type="checkbox"
                checked={addShared}
                onChange={(event) => setAddShared(event.target.checked)}
              />
              Shared
            </label>
            <button className="icon-button primary-icon" onClick={() => void addItem()}>
              <Plus size={19} />
            </button>
          </section>

          {CATEGORIES.map((category) => {
            const categoryItems = filteredItems.filter((item) => item.category === category);
            if (!categoryItems.length) return null;
            return (
              <section className="checklist-section" key={category}>
                <h2>{CATEGORY_LABELS[category]}</h2>
                <div className="checklist">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`checklist-card ${item.parent_item_id ? "subitem" : ""}`}
                    >
                      <button
                        type="button"
                        className="checklist-row"
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
                          {item.shared
                            ? "Shared"
                            : item.traveler_id
                              ? travelersById[item.traveler_id]
                              : "Personal"}
                        </small>
                      </button>
                      <input
                        className="note-input"
                        defaultValue={item.notes ?? ""}
                        placeholder="Add a note…"
                        onBlur={(event) => void saveItemNotes(item, event.target.value)}
                      />
                      {(childrenByParent[item.id] ?? []).map((child) => (
                        <div key={child.id} className="checklist-subrow">
                          <button type="button" onClick={() => void togglePacked(child)}>
                            <span className={`checkbox ${child.packed ? "checked" : ""}`}>
                              {child.packed && <Check size={12} />}
                            </span>
                            {child.item_name}
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Remove ${child.item_name}`}
                            onClick={() => void removeItem(child)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="remove-item"
                        onClick={() => void removeItem(item)}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
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

          <section className="workspace-panel">
            <div className="workspace-panel-heading">
              <MessageCircle size={20} />
              <div>
                <h2>Activities</h2>
                <p>Shared trip activities</p>
              </div>
            </div>
            <div className="inline-add">
              <input
                value={activityDraft}
                onChange={(event) => setActivityDraft(event.target.value)}
                placeholder="Golf, beach dinner…"
                onKeyDown={(event) => event.key === "Enter" && void addActivity()}
              />
              <button onClick={() => void addActivity()} aria-label="Add activity">
                <Plus size={17} />
              </button>
            </div>
            <div className="activity-pills editable">
              {activities.map((activity) => (
                <span key={activity.id}>
                  {activity.activity_name}
                  <button
                    type="button"
                    aria-label={`Remove ${activity.activity_name}`}
                    onClick={() => void removeActivity(activity)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>

          <section className="workspace-panel">
            <div className="workspace-panel-heading">
              <Sparkles size={20} />
              <div>
                <h2>Before-you-go reminders</h2>
                <p>Shopping and departure tasks</p>
              </div>
            </div>
            <div className="inline-add">
              <input
                value={reminderDraft}
                onChange={(event) => setReminderDraft(event.target.value)}
                placeholder="Buy sunscreen…"
                onKeyDown={(event) =>
                  event.key === "Enter" &&
                  void addWorkspaceItem("reminder", reminderDraft, () => setReminderDraft(""))
                }
              />
              <button
                onClick={() =>
                  void addWorkspaceItem("reminder", reminderDraft, () => setReminderDraft(""))
                }
                aria-label="Add reminder"
              >
                <Plus size={17} />
              </button>
            </div>
            {reminderItems.length > 0 && (
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
            )}
          </section>

          {session?.user?.id ? (
            <DayPlanSection
              tripId={id}
              userId={session.user.id}
              startDate={trip.start_date}
              endDate={trip.end_date}
              calendarDays={calendarDays}
              outfits={outfits}
              onChanged={loadTrip}
              onError={setError}
            />
          ) : null}

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

      {activeTab === "chat" && session?.user?.id ? (
        <TripChatPanel
          tripId={id}
          destination={trip.destination}
          currentUserId={session.user.id}
          members={
            members.length
              ? members
              : [
                  {
                    id: `owner-${trip.owner_id}`,
                    trip_id: id,
                    user_id: trip.owner_id,
                    role: "owner",
                    profile: {
                      id: trip.owner_id,
                      email: session.user.email ?? "",
                      name:
                        (session.user.user_metadata?.full_name as string | undefined) ??
                        session.user.email ??
                        "You",
                      avatar_url: null,
                    },
                  },
                ]
          }
          onInvite={() => void shareTrip()}
        />
      ) : null}

      {activeTab === "help" ? (
        <PackingHelpPanel tripId={id} onItemsChanged={loadTrip} />
      ) : null}
    </main>
  );
}
