import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { TravelerAvatar } from "@/components/design/traveler-avatar";
import type { PackingItem, Traveler } from "@/lib/types";

interface ActivityFeedProps {
  items: PackingItem[];
  travelers: Traveler[];
  className?: string;
}

export function CollaborationFeed({ items, travelers, className }: ActivityFeedProps) {
  const recentPacked = items
    .filter((i) => i.packed)
    .slice(-5)
    .reverse();

  const unpackedByTraveler = travelers.map((t) => {
    const tItems = items.filter((i) => i.traveler_id === t.id && !i.packed);
    return { traveler: t, count: tItems.length, first: tItems[0] };
  });

  const activities = [
    ...recentPacked.map((item) => {
      const traveler = travelers.find((t) => t.id === item.traveler_id);
      return {
        id: item.id,
        type: "packed" as const,
        name: traveler?.name ?? "Someone",
        travelerType: traveler?.traveler_type ?? "adult",
        index: travelers.findIndex((t) => t.id === item.traveler_id),
        item: item.item_name,
        time: item.updated_at,
      };
    }),
    ...unpackedByTraveler
      .filter((u) => u.count > 0 && u.traveler.traveler_type === "pet")
      .map((u) => ({
        id: `pet-${u.traveler.id}`,
        type: "pending" as const,
        name: u.traveler.name,
        travelerType: u.traveler.traveler_type,
        index: travelers.findIndex((t) => t.id === u.traveler.id),
        item: u.first?.item_name ?? "essentials",
        time: null,
      })),
  ].slice(0, 6);

  if (activities.length === 0) return null;

  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-travel-sm", className)}>
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Packing activity
      </p>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <TravelerAvatar
              name={activity.name}
              type={activity.travelerType as "adult" | "pet"}
              index={activity.index}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {activity.type === "packed" ? (
                  <>
                    <span className="font-medium">{activity.name}</span> packed{" "}
                    <span className="text-muted-foreground">{activity.item.toLowerCase()}</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">{activity.name}&apos;s</span>{" "}
                    <span className="text-weather-orange">{activity.item.toLowerCase()}</span> hasn&apos;t
                    been packed yet
                  </>
                )}
              </p>
              {activity.time && (
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                </p>
              )}
            </div>
            <div
              className={cn(
                "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                activity.type === "packed" ? "bg-golf-green" : "bg-weather-orange animate-pulse"
              )}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
