import Link from "next/link";
import { ArrowRight, Sparkles, Users, CloudSun, Shirt, PawPrint, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/layout/header";
import { ProductMockup } from "@/components/design/product-mockup";
import { APP_NAME } from "@/lib/constants";

const features = [
  {
    icon: Sparkles,
    title: "AI packing lists",
    description: "Weather-aware lists tailored to your destination, activities, and travel style.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Users,
    title: "Pack together",
    description: "Invite partners and family. See live updates as everyone checks items off.",
    color: "bg-ocean-teal/15 text-ocean-teal",
  },
  {
    icon: Shirt,
    title: "Daily outfits",
    description: "Outfit plans for golf mornings, pool afternoons, and nice dinners.",
    color: "bg-warm-sand text-amber-800 dark:text-warm-sand",
  },
  {
    icon: CloudSun,
    title: "Weather-smart",
    description: "Real forecast data shapes what you pack — rain jackets, layers, sunscreen.",
    color: "bg-sky-blue/20 text-sky-blue",
  },
  {
    icon: PawPrint,
    title: "Pet travel",
    description: "Dedicated packing for your furry travel companions — food, leash, records.",
    color: "bg-golf-green/10 text-golf-green",
  },
  {
    icon: CheckCircle2,
    title: "Shared essentials",
    description: "AI consolidates duplicates. One sunscreen, not three.",
    color: "bg-sun-yellow/20 text-amber-700 dark:text-sun-yellow",
  },
];

const testimonials = [
  {
    quote: "We packed for Scottsdale in under 5 minutes. Andre's dog food was on the list before I remembered.",
    author: "David & Jen",
    trip: "Scottsdale Golf Weekend",
  },
];

export default function HomePage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="gradient-hero absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered travel packing
              </div>
              <h1 className="text-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Pack smarter
                <span className="block text-primary">together.</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                AI-powered packing lists, outfit plans, and shared travel checklists for couples,
                families, friend groups, and pets.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Button asChild size="lg" className="h-12 w-full rounded-full px-8 text-base sm:w-auto">
                  <Link href="/login">
                    Start packing free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 w-full rounded-full px-8 sm:w-auto"
                >
                  <Link href="/dashboard">Explore demo</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Free to start · No credit card · Ready in 60 seconds
              </p>
            </div>
            <div className="relative lg:pl-4">
              <ProductMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="border-y bg-muted/30 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-4 text-center text-sm text-muted-foreground sm:gap-12">
          <span>Weather-aware packing</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span>Real-time collaboration</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span>Outfit planning</span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span>Pet-friendly</span>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need before you go
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              One calm place to prepare — from first outfit to last charger.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-travel-sm"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-display font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-t bg-warm-sand/30 py-16 dark:bg-warm-sand/5">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-display text-xl font-medium leading-relaxed sm:text-2xl">
            &ldquo;{testimonials[0].quote}&rdquo;
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            — {testimonials[0].author}, {testimonials[0].trip}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground sm:px-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-display text-3xl font-semibold sm:text-4xl">
                Ready for your next adventure?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-primary-foreground/80">
                Create your first trip in under 60 seconds. Less stress, more excitement.
              </p>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="mt-8 h-12 rounded-full px-8 text-base text-foreground"
              >
                <Link href="/trips/new">Plan a trip</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {APP_NAME}. Pack smarter, travel lighter.
        </div>
      </footer>
    </MarketingShell>
  );
}
