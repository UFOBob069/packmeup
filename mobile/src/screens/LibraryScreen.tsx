import { useCallback, useEffect, useState } from "react";
import { Backpack, Plus, Trash2, Users } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type GearItem,
  type GroupMember,
  type PackingCategory,
  type TravelerType,
} from "../types";

interface LibraryScreenProps {
  kind: "gear" | "group";
}

type PetSpecies = "dog" | "cat" | "other";
type PetSize = "small" | "medium" | "large";

export function LibraryScreen({ kind }: LibraryScreenProps) {
  const { session } = useAuth();
  const [gear, setGear] = useState<GearItem[]>([]);
  const [group, setGroup] = useState<GroupMember[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PackingCategory>("clothing");
  const [travelerType, setTravelerType] = useState<TravelerType>("adult");
  const [petSpecies, setPetSpecies] = useState<PetSpecies>("dog");
  const [petSize, setPetSize] = useState<PetSize>("medium");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const table = kind === "gear" ? "gear_items" : "group_members";
    const orderColumn = kind === "gear" ? "item_name" : "name";
    const { data, error: queryError } = await supabase
      .from(table)
      .select("*")
      .order(orderColumn);
    if (kind === "gear") setGear((data ?? []) as GearItem[]);
    else setGroup((data ?? []) as GroupMember[]);
    setError(queryError?.message ?? null);
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed || !session) return;
    const { error: insertError } =
      kind === "gear"
        ? await supabase
            .from("gear_items")
            .insert({ user_id: session.user.id, item_name: trimmed, category })
        : await supabase.from("group_members").insert({
            user_id: session.user.id,
            name: trimmed,
            traveler_type: travelerType,
            pet_species: travelerType === "pet" ? petSpecies : null,
            pet_size: travelerType === "pet" ? petSize : null,
          });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setName("");
    setTravelerType("adult");
    await load();
  };

  const remove = async (id: string) => {
    const table = kind === "gear" ? "gear_items" : "group_members";
    const { error: deleteError } = await supabase.from(table).delete().eq("id", id);
    if (deleteError) setError(deleteError.message);
    else await load();
  };

  const entries =
    kind === "gear"
      ? gear.map((item) => ({
          id: item.id,
          name: item.item_name,
          detail: CATEGORY_LABELS[item.category],
        }))
      : group.map((member) => ({
          id: member.id,
          name: member.name,
          detail:
            member.traveler_type === "pet"
              ? `pet · ${member.pet_species ?? "dog"}/${member.pet_size ?? "medium"}`
              : member.traveler_type,
        }));

  return (
    <main className="screen">
      <div className="screen-heading">
        <div>
          <p className="eyebrow">{kind === "gear" ? "Reusable packing items" : "Your travel crew"}</p>
          <h1>{kind === "gear" ? "My Gear" : "My Group"}</h1>
        </div>
        {kind === "gear" ? <Backpack size={28} /> : <Users size={28} />}
      </div>

      <section className="quick-add library-add">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && void add()}
          placeholder={kind === "gear" ? "Add gear" : travelerType === "pet" ? "Pet name" : "Add a person"}
        />
        {kind === "gear" ? (
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as PackingCategory)}
          >
            {CATEGORIES.map((item) => (
              <option value={item} key={item}>
                {CATEGORY_LABELS[item]}
              </option>
            ))}
          </select>
        ) : (
          <>
            <select
              value={travelerType}
              onChange={(event) => setTravelerType(event.target.value as TravelerType)}
            >
              <option value="adult">Adult</option>
              <option value="child">Child</option>
              <option value="infant">Infant</option>
              <option value="pet">Pet</option>
            </select>
            {travelerType === "pet" && (
              <>
                <select
                  value={petSpecies}
                  onChange={(event) => setPetSpecies(event.target.value as PetSpecies)}
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={petSize}
                  onChange={(event) => setPetSize(event.target.value as PetSize)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </>
            )}
          </>
        )}
        <button className="icon-button primary-icon" onClick={() => void add()}>
          <Plus size={19} />
        </button>
      </section>

      {error && <div className="error-card">{error}</div>}
      {entries.length === 0 ? (
        <div className="empty-state">
          {kind === "gear" ? <Backpack size={34} /> : <Users size={34} />}
          <h2>{kind === "gear" ? "No saved gear" : "No group members"}</h2>
          <p>Items added here will be ready for future trips.</p>
        </div>
      ) : (
        <div className="library-list">
          {entries.map((entry) => (
            <div className="library-row" key={entry.id}>
              <div>
                <strong>{entry.name}</strong>
                <small>{entry.detail}</small>
              </div>
              <button className="icon-button danger-icon" onClick={() => void remove(entry.id)}>
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
