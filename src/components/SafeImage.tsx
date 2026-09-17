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
