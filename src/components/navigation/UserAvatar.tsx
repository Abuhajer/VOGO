"use client";

import { useState } from "react";

type Props = {
  image: string | null | undefined;
  name: string;
  size?: "sm" | "md";
  className?: string;
};

export default function UserAvatar({ image, name, size = "md", className = "" }: Props) {
  const initial = name.charAt(0).toUpperCase();
  const [failed, setFailed] = useState(false);
  const sizeClass = size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm";
  const showImage = Boolean(image?.trim()) && !failed;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/35 bg-gold/10 font-serif text-gold ${sizeClass} ${className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image!}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initial
      )}
    </span>
  );
}
