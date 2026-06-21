import { ProgressRing } from "@/components/design/progress-ring";
import { TravelerAvatarGroup } from "@/components/design/traveler-avatar";
import { ActivityTag } from "@/components/design/activity-tag";
import { Sun, Share2, Shirt, Check } from "lucide-react";

export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg animate-float">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 via-sky-blue/10 to-warm-sand/30 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-travel">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-sun-yellow/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-golf-green/80" />
          </div>
          <div className="mx-auto rounded-md bg-background/80 px-3 py-0.5 text-[10px] text-muted-foreground">
            packmeup.app/trips/scottsdale
          </div>
        </div>

        <div className="p-5">
          {/* Trip header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Golf Weekend
              </p>
              <h3 className="text-display text-xl font-semibold">Scottsdale, Arizona</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Mar 14 – 18 · 4 days</p>
            </div>
            <ProgressRing value={68} size={56} strokeWidth={5} />
          </div>

          {/* Travelers */}
          <div className="mb-4 flex items-center justify-between rounded-xl bg-muted/50 p-3">
            <TravelerAvatarGroup
              travelers={[
                { name: "David", traveler_type: "adult" },
                { name: "Jen", traveler_type: "adult" },
                { name: "Andre", traveler_type: "pet" },
              ]}
              size="md"
            />
            <div className="flex gap-1">
              <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium">
                David
              </span>
              <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium">
                Jen
              </span>
              <span className="rounded-full bg-warm-sand/80 px-2 py-0.5 text-[10px] font-medium">
                Andre 🐾
              </span>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { icon: Share2, label: "Shared", value: "4 items" },
              { icon: Shirt, label: "Outfits", value: "6 planned" },
              { icon: Sun, label: "Weather", value: "95°F avg" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border bg-background p-2.5 text-center">
                <Icon className="mx-auto h-3.5 w-3.5 text-primary" />
                <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
                <p className="text-xs font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {/* Activities */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            <ActivityTag name="Golf" />
            <ActivityTag name="Pool" />
            <ActivityTag name="Nice Dinners" />
          </div>

          {/* Sample checklist items */}
          <div className="space-y-2 rounded-xl border bg-background p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Packing list
            </p>
            {[
              { name: "Golf Polo × 2", done: true, tag: "David" },
              { name: "Sunscreen SPF 50", done: false, tag: "Shared" },
              { name: "Dog Leash", done: true, tag: "Andre" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    item.done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {item.done && <Check className="h-2.5 w-2.5" />}
                </div>
                <span className={item.done ? "text-muted-foreground line-through" : "font-medium"}>
                  {item.name}
                </span>
                <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[9px]">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
