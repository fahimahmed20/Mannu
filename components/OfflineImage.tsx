"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

const FALLBACK = "/placeholder-species.svg";

export default function OfflineImage({ src, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK);
  return (
    <Image
      {...props}
      src={imgSrc}
      onError={() => setImgSrc(FALLBACK)}
    />
  );
}
