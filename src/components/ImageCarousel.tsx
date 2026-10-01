"use client";

import { useState, type MouseEvent } from "react";
import { SafeImage } from "@/components/SafeImage";

type Props = {
  images: string[];
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Impede que o clique nas setas dispare o Link pai. */
  stopLinkNavigation?: boolean;
};

export function ImageCarousel({
  images,
  alt,
  className = "",
  sizes,
  priority,
  stopLinkNavigation = false,
}: Props) {
  const gallery = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const current = gallery[index] || gallery[0] || "";
  const hasMany = gallery.length > 1;

  function go(delta: number, event?: MouseEvent) {
    if (stopLinkNavigation) {
      event?.preventDefault();
      event?.stopPropagation();
    }
    if (!hasMany) return;
    setIndex((currentIndex) => {
      const next = currentIndex + delta;
      if (next < 0) return gallery.length - 1;
      if (next >= gallery.length) return 0;
      return next;
    });
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <SafeImage
        src={current}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
        priority={priority}
      />
      {hasMany ? (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            className="absolute left-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-espresso/55 text-sm text-foam backdrop-blur-sm hover:bg-espresso/75"
            onClick={(event) => go(-1, event)}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            className="absolute right-1 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-espresso/55 text-sm text-foam backdrop-blur-sm hover:bg-espresso/75"
            onClick={(event) => go(1, event)}
          >
            ›
          </button>
          <div className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {gallery.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                aria-label={`Ir para foto ${dotIndex + 1}`}
                className={`h-1.5 w-1.5 rounded-full ${
                  dotIndex === index ? "bg-foam" : "bg-foam/45"
                }`}
                onClick={(event) => {
                  if (stopLinkNavigation) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                  setIndex(dotIndex);
                }}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
