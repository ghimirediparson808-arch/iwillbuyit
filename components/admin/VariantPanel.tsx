"use client";
import { UploadField } from "@/components/UploadField";
import { Mockup } from "@/components/design-preview/Mockup";
import { useAsset } from "@/lib/hooks";
import { colourName, displayArtwork, shirtColours } from "@/services/artwork";
import type { Colour, ColourVariant, Design, Side } from "@/types";
export function VariantPanel({
  design,
  colour,
  update,
  upload,
  pending,
  selectDefault,
}: {
  design: Design;
  colour: Colour;
  update: (patch: Partial<ColourVariant>) => void;
  upload: (side: Side, file: File | null) => void;
  pending: (key: string, value: boolean) => void;
  selectDefault: () => void;
}) {
  const variant = design.variants![colour];
  const title = colourName(colour);
  const display = displayArtwork(design, colour);
  const original = useAsset(display.source);
  return (
    <section
      className={`variant-panel ${variant.enabled ? "enabled" : ""}`}
      aria-label={`${title} variant`}
    >
      <div className="variant-heading">
        <label className="check-label">
          <input
            type="checkbox"
            checked={variant.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            aria-label={`Enable ${title}`}
          />
          <span className={`swatch ${colour}`} />
          {title}
        </label>
        <span className="variant-caption">
          {variant.enabled ? "Enabled" : "Not available"}
        </span>
      </div>
      {variant.enabled && (
        <div className="variant-body">
          <div className="variant-config">
            {(
              [
                "front",
                ...(design.sides?.includes("back") ? ["back"] : []),
              ] as Side[]
            ).map((side) => {
              const reuseKey = side === "front" ? "reuseFront" : "reuseBack";
              return (
                <div className="variant-file" key={side}>
                  <h3>
                    {side === "front"
                      ? "Front artwork"
                      : "Back artwork · optional"}
                  </h3>
                  <label className="field">
                    {title} {side} artwork source
                    <select
                      value={variant[reuseKey] || "own"}
                      onChange={(e) =>
                        update({
                          [reuseKey]:
                            e.target.value === "own"
                              ? undefined
                              : e.target.value,
                        })
                      }
                    >
                      <option value="own">Upload artwork for {title}</option>
                      {shirtColours
                        .filter(
                          (c) => c !== colour && design.variants?.[c]?.enabled,
                        )
                        .map((c) => (
                          <option key={c} value={c}>
                            Reuse {colourName(c)} {side} artwork
                          </option>
                        ))}
                      {variant[reuseKey] &&
                        !design.variants?.[variant[reuseKey]!]?.enabled && (
                          <option value={variant[reuseKey]}>
                            Source colour disabled — choose another
                          </option>
                        )}
                    </select>
                  </label>
                  {!variant[reuseKey] ? (
                    <UploadField
                      transparent
                      label={`${title} ${side} artwork`}
                      onValidating={(v) => pending(`${colour}-${side}`, v)}
                      onFile={(file) => upload(side, file)}
                    />
                  ) : (
                    <p className="variant-help">
                      Uses the same stored file. Choose “Upload artwork” to
                      replace only this colour.
                    </p>
                  )}
                  {variant[side] && !variant[reuseKey] && (
                    <div className="assigned-file">
                      <span>Artwork assigned</span>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => upload(side, null)}
                        aria-label={`Remove ${title} ${side} artwork`}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <label className="field">
              {title} preview background
              <select
                value={variant.background}
                onChange={(e) =>
                  update({ background: e.target.value as Colour })
                }
              >
                {shirtColours.map((c) => (
                  <option key={c} value={c}>
                    {colourName(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="check-label default-variant">
              <input
                type="radio"
                name="default-colour"
                checked={design.defaultColour === colour}
                onChange={selectDefault}
              />
              Default display colour: {title}
            </label>
          </div>
          <div className="variant-live">
            <div
              className={`variant-original artwork-surface artwork-${display.tone}`}
            >
              {original ? (
                <img src={original} alt={`${title} original artwork`} />
              ) : (
                <span>Upload or reuse artwork</span>
              )}
            </div>
            <Mockup design={design} colour={colour} />
            <span>Live {title} preview</span>
          </div>
        </div>
      )}
    </section>
  );
}
