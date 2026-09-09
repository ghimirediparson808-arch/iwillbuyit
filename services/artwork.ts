import type { Colour, Design, Side, ColourVariant } from "@/types";
export const shirtColours: Colour[] = ["navy", "black", "cream"];
export const colourName = (c: Colour) => c[0].toUpperCase() + c.slice(1);
export function emptyVariants(): Record<Colour, ColourVariant> {
  return Object.fromEntries(
    shirtColours.map((c) => [c, { enabled: false, background: c }]),
  ) as Record<Colour, ColourVariant>;
}
/** Adapt old records without changing identity, order, files or previous garment assignments. */
export function migrateDesign(design: Design): Design {
  if (design.variants)
    return design.galleryCover || !design.defaultColour
      ? design
      : {
          ...design,
          galleryCover: { kind: "variant", colour: design.defaultColour },
        };
  const variants = emptyVariants();
  for (const c of shirtColours) {
    const old = design.artworkVariants;
    const source = old
      ? old.mode === "original"
        ? old.original || old.dark || old.light
        : c === "cream"
          ? old.dark
          : old.light
      : c === "cream"
        ? design.lightShirtAsset
        : design.darkShirtAsset;
    variants[c] = {
      enabled: (design.colours || shirtColours).includes(c) && !!source,
      background: c,
      front: source,
      // Previously the same source was deliberately used on both print sides.
      back: (design.sides || ["front", "back"]).includes("back")
        ? source
        : undefined,
    };
  }
  const enabled = shirtColours.filter((c) => variants[c].enabled);
  return {
    ...design,
    schemaVersion: 2,
    variants,
    colours: enabled,
    defaultColour: enabled.includes("navy") ? "navy" : enabled[0],
    galleryCover: design.galleryCover || {
      kind: "variant",
      colour: enabled.includes("navy") ? "navy" : enabled[0] || "navy",
    },
    sides: design.sides || ["front", "back"],
    sizes: design.sizes || ["S", "M", "L", "XL", "XXL"],
  };
}
export function printArtwork(
  design: Design,
  colour: Colour,
  side: Side = "front",
  visited: Colour[] = [],
): string {
  const d = design.variants ? design : migrateDesign(design);
  const v = d.variants?.[colour];
  if (!v?.enabled || visited.includes(colour)) return "";
  const reuse = side === "front" ? v.reuseFront : v.reuseBack;
  return reuse
    ? printArtwork(d, reuse, side, [...visited, colour])
    : v[side] || "";
}
export function availableColours(design: Design) {
  return shirtColours.filter((c) => !!printArtwork(design, c));
}
export function printSides(design: Design, colour: Colour): Side[] {
  return (design.sides || ["front", "back"]).filter(
    (s) => !!printArtwork(design, colour, s),
  );
}
export function displayArtwork(
  design: Design,
  colour?: Colour,
  side: Side = "front",
) {
  const d = design.variants ? design : migrateDesign(design);
  const selected = colour || d.defaultColour;
  if (!selected) return { source: "", tone: "cream" as Colour };
  return {
    source: printArtwork(d, selected, side),
    tone: d.variants?.[selected]?.background || selected,
  };
}
export function variantIdentity(design: Design, colour: Colour, side: Side) {
  return `${design.id}/${colour}/${side}`;
}
export function publicationErrors(design: Design) {
  const errors: string[] = [];
  if (design.galleryCover && !galleryArtwork(design))
    errors.push(
      "Choose an enabled Gallery Cover variant with artwork, or upload a transparent cover.",
    );
  if (!design.name.trim()) errors.push("Enter a design name.");
  if (!design.description.trim()) errors.push("Add a full description.");
  const enabled = shirtColours.filter((c) => design.variants?.[c]?.enabled);
  if (!enabled.length) errors.push("Enable at least one T-shirt colour.");
  if (!design.defaultColour || !enabled.includes(design.defaultColour))
    errors.push("Select an enabled default display colour before publishing.");
  for (const c of enabled) {
    if (!printArtwork(design, c))
      errors.push(
        `${colourName(c)}: upload front artwork or explicitly reuse artwork from another enabled colour.`,
      );
    if (!printSides(design, c).length)
      errors.push(
        `${colourName(c)}: provide artwork for at least one selected print side.`,
      );
    const v = design.variants![c];
    if (v.reuseBack && !printArtwork(design, c, "back"))
      errors.push(
        `${colourName(c)}: the reused back artwork is missing or forms a reuse loop.`,
      );
  }
  if (!design.sizes?.length) errors.push("Choose at least one size.");
  if (!design.sides?.length) errors.push("Choose at least one print side.");
  return errors;
}

// The gallery canvas is global; this source is an explicit editorial choice.
export function galleryArtwork(design: Design): string {
  const cover = design.galleryCover;
  if (cover?.kind === "upload") return cover.source;
  return printArtwork(
    design,
    cover?.kind === "variant" ? cover.colour : design.defaultColour || "navy",
    "front",
  );
}
