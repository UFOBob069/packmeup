import Image from "next/image";
import {
  CalendarDays,
  CloudRain,
  CloudSun,
  Home,
  Luggage,
  MountainSnow,
  PawPrint,
  Shirt,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { ProgressRing } from "@/components/design/progress-ring";

const tiles = [
  {
    icon: Luggage,
    label: "Packing List",
    detail: "45 items",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shirt,
    label: "Outfits",
    detail: "12 looks",
    color: "bg-warm-sand/70 text-amber-800 dark:bg-warm-sand/15 dark:text-warm-sand",
  },
  {
    icon: CloudRain,
    label: "Weather",
    detail: "Rain Friday",
    color: "bg-sky-blue/20 text-sky-blue",
  },
  {
    icon: CalendarDays,
    label: "Calendar",
    detail: "3 events",
    color: "bg-weather-orange/15 text-weather-orange",
  },
  {
    icon: PawPrint,
    label: "Andre",
    detail: "Dog packing list",
    color: "bg-golf-green/10 text-golf-green",
  },
  {
    icon: Users,
    label: "Shared Items",
    detail: "3 invited",
    color: "bg-ocean-teal/15 text-ocean-teal",
  },
  {
    icon: ShoppingCart,
    label: "Grocery List",
    detail: "23 items",
    color: "bg-sun-yellow/25 text-amber-700 dark:text-sun-yellow",
  },
  {
    icon: MountainSnow,
    label: "Activities",
    detail: "Hiking, campfire",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Home,
    label: "Check-in Info",
    detail: "Cabin details",
    color: "bg-golf-green/10 text-golf-green",
  },
];

export function TripWorkspaceMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* Ambient glow */}
      <div className="absolute -inset-6 rounded-[2.5rem] bg-linear-to-br from-primary/25 via-sky-blue/15 to-warm-sand/40 blur-3xl" />

      <div className="animate-float relative overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-primary/10 animation-duration-[7s]">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-sun-yellow" />
          <div className="h-3 w-3 rounded-full bg-golf-green" />
        </div>

        {/* Cover photo header */}
        <div className="relative h-36 sm:h-40">
          <Image
            src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=85"
            alt="Misty Smoky Mountains ridgeline at sunrise"
            fill
            sizes="(max-width: 768px) 100vw, 576px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-transparent" />

          {/* Weather badge */}
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-2 pr-3.5 shadow-lg backdrop-blur">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sun-yellow/40">
              <CloudSun className="h-4 w-4 text-amber-600" />
            </span>
            <div>
              <p className="text-xs font-bold leading-none text-slate-900">82°</p>
              <p className="text-[9px] leading-tight text-slate-500">Partly cloudy</p>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <h3 className="text-display text-xl font-semibold text-white sm:text-2xl">
              Smoky Mountains Cabin
            </h3>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">
                <CalendarDays className="h-3 w-3" />
                July 12 – July 16
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">
                <Users className="h-3 w-3" />4
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {/* Packing progress row */}
          <div className="mb-3 flex items-center gap-3.5 rounded-2xl bg-primary/5 p-3">
            <ProgressRing value={91} size={52} strokeWidth={5} />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Packing progress</p>
              <p className="truncate text-xs text-muted-foreground">
                You&rsquo;re all set for an awesome trip!
              </p>
            </div>
            <span className="ml-auto shrink-0 rounded-full border bg-background px-3 py-1 text-[11px] font-semibold text-primary">
              View all
            </span>
          </div>

          {/* 3x3 tile grid */}
          <div className="grid grid-cols-3 gap-2">
            {tiles.map(({ icon: Icon, label, detail, color }) => (
              <div
                key={label}
                className="rounded-2xl border bg-background p-2.5 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 sm:p-3"
              >
                <div className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="truncate text-xs font-semibold leading-tight">{label}</p>
                <p className="truncate text-[10px] text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>

          {/* AI toast */}
          <div className="animate-toast-in mt-3 flex items-center gap-3 rounded-2xl bg-primary/8 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold">Forecast changed</p>
              <p className="truncate text-[11px] text-muted-foreground">
                We added a rain jacket and waterproof boots to your list.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
