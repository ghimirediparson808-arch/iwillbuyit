import type { Colour, Design } from "@/types";
/** Legacy asset names describe the garment, not the ink. Never swap launch records. */
export function printArtwork(design: Design, colour: Colour) {
  const variants = design.artworkVariants;
  if (!variants)
    return colour === "cream" ? design.lightShirtAsset : design.darkShirtAsset;
  if (variants.mode === "original")
    return variants.original || variants.dark || variants.light || "";
  return (colour === "cream" ? variants.dark : variants.light) || "";
}
export function displayArtwork(design: Design) {
  const v = design.artworkVariants;
  if (!v) return { source: design.thumbnail, tone: "cream" as const };
  return {
    source: v.dark || v.original || v.light || design.thumbnail,
    tone:
      !v.dark && !!v.light && v.mode !== "original"
        ? ("navy" as const)
        : ("cream" as const),
  };
}
