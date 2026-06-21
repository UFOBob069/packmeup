import Link from "next/link";
import { ArrowRight, Luggage, Sparkles, Users, CloudSun, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { APP_NAME } from "@/lib/constants";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Lists",
    description: "Smart packing lists tailored to your destination, weather, and activities.",
  },
  {
    icon: Users,
    title: "Collaborate Together",
    description: "Invite travel partners and pack together in real-time.",
  },
  {
    icon: CloudSun,
    title: "Weather-Aware",
    description: "Automatic weather integration for smarter clothing recommendations.",
  },
  {
    icon: CheckCircle2,
    title: "Interactive Checklists",
    description: "Track progress per traveler with shared and personal items.",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-32">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm backdrop-blur">
                <Sparkles className="h-4 w-4 text-primary" />
                AI-powered travel packing
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Pack smarter.
                <br />
                <span className="text-primary">Travel lighter.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                {APP_NAME} helps individuals, couples, families, and pet owners create smart
                packing lists, outfit plans, and collaborative checklists — in under 60 seconds.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/login">
                    Start Packing Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/dashboard">View Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Everything you need to pack</h2>
              <p className="mt-2 text-muted-foreground">
                From golf weekends to family beach trips — we&apos;ve got you covered.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-8 sm:p-12">
              <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Luggage className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">Ready for your next adventure?</h2>
                  <p className="mt-2 text-muted-foreground">
                    Create your first trip in under 60 seconds. No more packing stress.
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link href="/trips/new">Plan a Trip</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. Pack smarter, travel lighter.
        </div>
      </footer>
    </>
  );
}
