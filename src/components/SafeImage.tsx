"use client";

import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

function Placeholder({
  alt,
  fill,
  width,
  height,
  className,
}: Omit<Props, "src" | "sizes" | "priority">) {
  if (fill) {
    return (
      <div
        role="img"
        aria-label={alt || "Sem foto"}
        className={`absolute inset-0 flex items-center justify-center bg-cappuccino/35 text-xs uppercase tracking-[0.14em] text-espresso/45 ${className || ""}`}
      >
        Sem foto
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt || "Sem foto"}
      style={{ width, height }}
      className={`flex items-center justify-center bg-cappuccino/35 text-xs uppercase tracking-[0.14em] text-espresso/45 ${className || ""}`}
    >
      Sem foto
    </div>
  );
}

export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority,
}: Props) {
  if (!src?.trim()) {
    return (
      <Placeholder
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  const isLocal = src.startsWith("/");
  const isKnownRemote = src.includes("images.unsplash.com");

  if (isLocal || isKnownRemote) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={className}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`absolute inset-0 h-full w-full ${className || ""}`} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}
