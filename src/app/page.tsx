import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  Sparkles,
  Star,
  Users,
  CloudSun,
  PawPrint,
  Luggage,
  CalendarDays,
  CalendarCheck,
  MapPin,
  Check,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/brand-mark";
import { MarketingShell } from "@/components/layout/shells";
import { TripWorkspaceMockup } from "@/components/design/trip-workspace-mockup";
import { TravelerAvatarGroup } from "@/components/design/traveler-avatar";
import { APP_NAME } from "@/lib/constants";

const BRAND = APP_NAME.replace(".com", "");

const beforeChaos = [
  "Google Weather",
  "Notes app",
  "Calendar",
  "Email",
  "Group chats",
  "Pet reminders",
  "Shopping list",
  "Saved places",
  "Flight app",
  "Spreadsheets",
  "…and more",
];

const aiMoments = [
  {
    trigger: "Forecast changed.",
    intro: "Rain is coming Friday.",
    items: ["Rain jacket", "Waterproof boots"],
    more: "+2 more items",
    photo:
      "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=400&q=80",
    photoAlt: "Rain falling on an umbrella",
  },
  {
    trigger: "You added Andre.",
    intro: "We packed for your pup.",
    items: ["Dog food", "Leash", "Medication"],
    more: "+2 more items",
    photo:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=400&q=80",
    photoAlt: "A brown dachshund puppy",
  },
  {
    trigger: "Golf tee time added.",
    intro: "Saturday at 8:30 AM.",
    items: ["Golf shoes", "Cooling towel", "Extra glove"],
    more: "+1 more item",
    photo:
      "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=400&q=80",
    photoAlt: "A golf ball on a green course",
  },
];

const pillars = [
  {
    icon: Luggage,
    title: "Smart Packing",
    description: "AI packing lists based on your destination, trip type, activities, and more.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: CloudSun,
    title: "Live Weather",
    description: "Real-time forecasts that update your packing and plans automatically.",
    color: "bg-sky-blue/20 text-sky-blue",
  },
  {
    icon: CalendarDays,
    title: "Trip Calendar",
    description: "All your events, reservations, and activities in one beautiful timeline.",
    color: "bg-weather-orange/15 text-weather-orange",
  },
  {
    icon: Users,
    title: "Shared Lists",
    description: "Everyone sees what matters, checks off items, and stays on the same page.",
    color: "bg-ocean-teal/15 text-ocean-teal",
  },
  {
    icon: PawPrint,
    title: "Pets",
    description: "Custom packing lists and reminders for your furry travel companions.",
    color: "bg-golf-green/10 text-golf-green",
  },
  {
    icon: MapPin,
    title: "Destination Prep",
    description: "Arrival info, local tips, documents, and everything you need for a smooth trip.",
    color: "bg-sun-yellow/25 text-amber-700 dark:text-sun-yellow",
  },
];

const partnerValue = [
  "Personalized trip preparation for every guest",
  "Higher post-booking engagement",
  "White-label experience",
  "AI-powered recommendations",
  "Works with your existing booking flow",
];

const testimonial = {
  quote:
    "We packed for Scottsdale in under 5 minutes. Andre's dog food was on the list before I remembered.",
  author: "David S.",
  trip: "Scottsdale Golf Weekend",
};

export default function HomePage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="gradient-hero absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12">
            <div className="text-center lg:text-left">
              <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AI trip preparation, reimagined
              </div>
              <h1 className="animate-fade-up animate-delay-100 text-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Prepare for
                <span className="block text-primary">every trip.</span>
              </h1>
              <p className="animate-fade-up animate-delay-200 mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Everything you need before you leave — AI packing lists, weather, shared
                planning, pets, schedules, and more. All in one place.
              </p>
              <div className="animate-fade-up animate-delay-300 mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Button asChild size="lg" className="h-12 w-full rounded-full px-8 text-base sm:w-auto">
                  <Link href="/trips/new">
                    Generate My Trip Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 w-full rounded-full px-8 text-base sm:w-auto"
                >
                  <Link href="/login">See Example Trip</Link>
                </Button>
              </div>
              <div className="animate-fade-up animate-delay-500 mt-6 flex items-center justify-center gap-3 lg:justify-start">
                <TravelerAvatarGroup
                  travelers={[
                    { name: "David", traveler_type: "adult" },
                    { name: "Jen", traveler_type: "adult" },
                    { name: "Maya", traveler_type: "adult" },
                    { name: "Sam", traveler_type: "adult" },
                  ]}
                  size="sm"
                />
                <div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-sun-yellow text-sun-yellow" />
                    ))}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Trusted by travelers everywhere
                  </p>
                </div>
              </div>
            </div>
            <div className="animate-fade-up animate-delay-200 relative">
              <TripWorkspaceMockup />
            </div>
          </div>
        </div>
      </section>

      {/* One-sentence company statement */}
      <section className="border-y bg-muted/30 py-10">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-display text-lg font-medium leading-relaxed text-foreground/90 sm:text-xl">
            {BRAND} creates a personalized travel workspace for every trip — bringing together
            packing, weather, schedules, shared planning, pets, activities, and
            destination-specific recommendations in one place.
          </p>
        </div>
      </section>

      {/* Transformation: before / after */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[2fr_3fr]">
            <div className="text-center lg:text-left">
              <h2 className="text-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Booking a trip shouldn&rsquo;t feel like juggling.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Today, preparing for a trip is scattered across a dozen apps. Tomorrow, it&rsquo;s
                waiting for you in one place.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              {/* Before */}
              <div className="w-full rounded-3xl border border-dashed bg-muted/30 p-5 sm:flex-1">
                <div className="flex flex-wrap justify-center gap-2">
                  {beforeChaos.map((item, i) => (
                    <span
                      key={item}
                      className={`rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm ${
                        i % 3 === 0 ? "-rotate-2" : i % 3 === 1 ? "rotate-1" : "-rotate-1"
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <ArrowDown className="h-4.5 w-4.5 sm:hidden" />
                <ArrowRight className="hidden h-4.5 w-4.5 sm:block" />
              </span>

              {/* After */}
              <div className="relative w-full overflow-hidden rounded-3xl border bg-sky-blue/15 p-7 text-center shadow-travel sm:flex-1 dark:bg-sky-blue/10">
                <div className="mx-auto mb-3 w-fit">
                  <BrandMark size={48} />
                </div>
                <p className="text-display text-lg font-semibold">{BRAND}</p>
                <p className="mt-1 text-sm text-muted-foreground">Everything in one place.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI you can see */}
      <section className="border-t bg-muted/20 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-display text-3xl font-semibold tracking-tight sm:text-4xl">
              AI that actually does something.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {BRAND} watches your trip and updates the plan for you — no prompting required.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {aiMoments.map(({ trigger, intro, items, more, photo, photoAlt }) => (
              <div
                key={trigger}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-travel-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-display text-lg font-semibold">{trigger}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{intro}</p>
                  </div>
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border shadow-sm">
                    <Image
                      src={photo}
                      alt={photoAlt}
                      fill
                      sizes="64px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  We added:
                </p>
                <ul className="mt-2 space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm font-medium">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-medium text-primary">{more}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Everything before departure */}
      <section id="features" className="border-t py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-display text-3xl font-semibold tracking-tight sm:text-4xl">
              One place for everything before you leave.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Six parts of one system — each trip brings them together automatically.
            </p>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {pillars.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="rounded-2xl border bg-card p-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-travel-sm"
              >
                <div
                  className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-display text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-t bg-warm-sand/30 py-16 dark:bg-warm-sand/5">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="text-display text-6xl font-bold leading-none text-primary/30">
            &ldquo;
          </span>
          <p className="text-display -mt-4 text-xl font-medium leading-relaxed sm:text-2xl">
            We packed for Scottsdale in under 5 minutes. Andre&rsquo;s dog food was on the list
            before I remembered.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            — {testimonial.author}, {testimonial.trip}
          </p>
        </div>
      </section>

      {/* Travel brands */}
      <section id="for-travel-brands" className="border-t py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                For travel brands
              </p>
              <h2 className="text-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Travel companies lose the traveler after booking.
                <span className="block text-primary">{BRAND} keeps helping until departure.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Turn every booking into a personalized AI trip preparation experience — increase
                engagement, build loyalty, and create happier travelers.
              </p>
              <Button asChild size="lg" className="mt-8 h-12 rounded-full px-8 text-base">
                <a href="mailto:partners@packforvacation.com">
                  Partner With Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border bg-card p-7 sm:p-8">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  What you get
                </p>
                <ul className="mt-4 space-y-3">
                  {partnerValue.map((name) => (
                    <li key={name} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium">{name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Flow diagram */}
              <div className="flex items-center justify-between gap-2 px-2">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border bg-card text-primary shadow-sm">
                    <CalendarCheck className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-semibold">Booking</p>
                </div>
                <div className="h-px flex-1 border-t border-dashed" />
                <div className="flex flex-col items-center gap-2 text-center">
                  <BrandMark size={56} />
                  <div>
                    <p className="text-xs font-semibold">{BRAND}</p>
                    <p className="max-w-36 text-[10px] text-muted-foreground">
                      Keeps travelers engaged until departure
                    </p>
                  </div>
                </div>
                <div className="h-px flex-1 border-t border-dashed" />
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border bg-card text-destructive shadow-sm">
                    <Heart className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-semibold">Happy Traveler</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision closer */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-10 text-primary-foreground sm:px-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
              <BrandMark size={64} className="shrink-0 ring-2 ring-white/25" />
              <div className="flex-1">
                <h2 className="text-display text-2xl font-semibold sm:text-3xl">
                  Booking is just the beginning.
                </h2>
                <p className="mt-2 max-w-xl leading-relaxed text-primary-foreground/85">
                  Most travel apps help you book. {BRAND} helps you prepare. Because the best
                  trips start before you leave home.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-12 shrink-0 rounded-full px-8 text-base text-foreground"
              >
                <Link href="/trips/new">
                  Start Preparing Your Trip
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:gap-6 sm:px-6">
          <span>
            © {new Date().getFullYear()} {APP_NAME}. The best trips start before you leave home.
          </span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/support" className="hover:text-foreground">
            Support
          </Link>
        </div>
      </footer>
    </MarketingShell>
  );
}
