"use client";
import placement from "@/data/mockup-layout.json";
import type { Colour, Side, View, Design } from "@/types";
import { printArtwork } from "@/services/artwork";
import { useAsset } from "@/lib/hooks";
export function Mockup({
  design,
  colour = "navy",
  side = "front",
  view = "product",
}: {
  design?: Design;
  colour?: Colour;
  side?: Side;
  view?: View;
}) {
  const rule = placement[view][side];
  const art = useAsset(design ? printArtwork(design, colour) : undefined);
  return (
    <div className={`mockup mockup-${view}`}>
      <img
        className="blank-shirt"
        src={`/assets/mockups/${view}/${side}/${colour}.webp`}
        alt={`${colour} T-shirt, ${side}${view === "model" ? ", worn by a model" : ""}`}
      />
      {art && (
        <img
          className="print-art"
          src={art}
          alt={`${design?.name} print`}
          style={{
            left: `${rule.xPercent}%`,
            top: `${rule.yPercent}%`,
            width: `${rule.widthPercent}%`,
            height: `${rule.heightPercent}%`,
            mixBlendMode:
              !design?.artworkVariants && colour === "cream"
                ? "multiply"
                : "normal",
          }}
        />
      )}
    </div>
  );
}
