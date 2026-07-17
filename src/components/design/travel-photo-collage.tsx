import Image from "next/image";
import { MapPin, Sparkles } from "lucide-react";

const photos = [
  {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=85",
    alt: "Turquoise water and a tropical beach",
    className: "left-0 top-8 h-52 w-[58%] -rotate-2 sm:h-60",
  },
  {
    src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=85",
    alt: "A mountain lake surrounded by peaks",
    className: "right-0 top-0 h-44 w-[38%] rotate-3 sm:h-52",
  },
  {
    src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1000&q=85",
    alt: "A colorful city skyline",
    className: "bottom-2 left-6 h-44 w-[42%] rotate-2 sm:h-52",
  },
  {
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=85",
    alt: "An open road through a desert landscape",
    className: "bottom-8 right-2 h-56 w-[50%] -rotate-2 sm:h-64",
  },
];

export function TravelPhotoCollage() {
  return (
    <div className="relative mx-auto h-[410px] w-full max-w-xl sm:h-[470px]">
      <div className="absolute inset-10 rounded-full bg-primary/10 blur-3xl" />
      {photos.map((photo) => (
        <div
          key={photo.src}
          className={`absolute overflow-hidden rounded-3xl border-4 border-background shadow-xl ${photo.className}`}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 768px) 50vw, 300px"
            className="object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
      ))}

      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background/95 px-5 py-4 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          One list. Every adventure.
        </div>
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          Ready wherever you go
        </p>
      </div>

      <a
        href="https://unsplash.com"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 text-[10px] text-muted-foreground/70 hover:text-muted-foreground"
      >
        Travel photos via Unsplash
      </a>
    </div>
  );
}
