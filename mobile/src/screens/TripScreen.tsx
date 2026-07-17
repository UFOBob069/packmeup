import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type PackingCategory,
  type PackingItem,
  type Traveler,
  type Trip,
} from "../types";

export function TripScreen() {
  const { id = "" } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState<PackingCategory>("miscellaneous");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrip = useCallback(async () => {
    const [tripResult, travelersResult, itemsResult] = await Promise.all([
      supabase.from("trips").select("*").eq("id", id).single(),
      supabase.from("travelers").select("*").eq("trip_id", id).order("sort_order"),
      supabase.from("packing_items").select("*").eq("trip_id", id).order("sort_order"),
    ]);
    setTrip((tripResult.data as Trip | null) ?? null);
    setTravelers((travelersResult.data ?? []) as Traveler[]);
    setItems((itemsResult.data ?? []) as PackingItem[]);
    setError(tripResult.error?.message ?? itemsResult.error?.message ?? null);
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

  const packedCount = items.filter((item) => item.packed).length;
  const progress = items.length ? Math.round((packedCount / items.length) * 100) : 0;
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
      <div className="trip-title">
        <p className="eyebrow">Packing for</p>
        <h1>{trip.destination}</h1>
        <p>{packedCount} of {items.length} packed</p>
      </div>

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
    </main>
  );
}
