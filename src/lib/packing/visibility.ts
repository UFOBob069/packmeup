import type { Outfit, PackingItem } from "@/lib/types";

/** Personal checklist lines + shared group items (sunscreen, first aid, etc.). */
export function isVisiblePackingItem(
  item: Pick<PackingItem, "shared" | "user_id">,
  viewerUserId: string
): boolean {
  return item.shared || item.user_id === viewerUserId;
}

/** By Day what-to-wear / personal events — not shared across members. */
export function isVisibleOutfit(
  outfit: Pick<Outfit, "user_id">,
  viewerUserId: string
): boolean {
  return outfit.user_id === viewerUserId;
}
