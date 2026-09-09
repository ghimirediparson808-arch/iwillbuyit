"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useAsset, useDesigns, useSettings } from "@/lib/hooks";
import { Mockup } from "./Mockup";
import { ColourControl, Quantity, Segmented } from "./Controls";
import { Eyebrow } from "@/components/site/Decorations";
import { Modal } from "@/components/Modal";
import { newRequest, repository, whatsappUrl } from "@/services/repository";
import {
  displayArtwork,
  availableColours,
  printSides,
  variantIdentity,
} from "@/services/artwork";
import type { Colour, Side, View } from "@/types";
export function DesignDetail({ slug }: { slug: string }) {
  const settings = useSettings();
  const designs = useDesigns();
  const design = designs.find((d) => d.slug === slug);
  const [colour, setColour] = useState<Colour>("navy");
  const [side, setSide] = useState<Side>("front");
  const [view, setView] = useState<View>("product");
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [modal, setModal] = useState<"zoom" | "size" | "request" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [success, setSuccess] = useState("");
  const [requestId, setRequestId] = useState("");
  const [error, setError] = useState("");
  const display = design ? displayArtwork(design, colour, side) : undefined;
  const art = useAsset(display?.source);
  const allowedColours = design ? availableColours(design) : [];
  const allowedSides = design ? printSides(design, colour) : [];
  const [restored, setRestored] = useState("");
  useEffect(() => {
    if (!design?.id || restored === design.id) return;
    const value = repository.selections(design.id);
    setColour(
      value.colour && availableColours(design).includes(value.colour)
        ? value.colour
        : design.defaultColour || "navy",
    );
    setRequestId(value.lastRequestId || "");
    setSide(value.side || "front");
    setView(value.view || "product");
    setSize(value.size || "M");
    setQuantity(Math.max(1, Math.min(99, value.quantity || 1)));
    setRestored(design.id);
  }, [design, restored]);
  useEffect(() => {
    if (!design || restored !== design.id) return;
    if (
      !availableColours(design).includes(colour) ||
      !printSides(design, colour).includes(side) ||
      (design.sizes?.length && !design.sizes.includes(size))
    )
      return;
    try {
      repository.saveSelection(design.id, {
        colour,
        side,
        view,
        size,
        quantity,
        lastRequestId: requestId,
      });
    } catch {
      /* Selections stay usable when browser preferences cannot be saved. */
    }
  }, [design, restored, colour, side, view, size, quantity, requestId]);
  useEffect(() => {
    if (!design || restored !== design.id) return;
    if (!availableColours(design).includes(colour) && design.defaultColour)
      setColour(design.defaultColour);
    const sides = printSides(design, colour);
    if (!sides.includes(side) && sides.length) setSide(sides[0]);
    if (design.sizes?.length && !design.sizes.includes(size))
      setSize(design.sizes[0]);
  }, [design, restored, colour, side, size]);
  if (!design)
    return (
      <main id="main" className="empty-state">
        <h1>Design not found</h1>
        <p>This design may be a draft or may no longer be available.</p>
        <Link className="button" href="/designs">
          Explore Designs
        </Link>
      </main>
    );
  const message = `Hi I WILL BUY IT! I’d like to order ${design.name} (${design.id}), colour: ${colour}, print side: ${side}, view: ${view}, size: ${size}, quantity: ${quantity}, variant: ${variantIdentity(design, colour, side)}. Please confirm availability and price.${requestId ? ` Request ID: ${requestId}.` : ""}`;
  return (
    <main id="main" className="detail-main">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/designs">Design Gallery</Link>
        <span>/</span>
        <strong>{design.name}</strong>
      </nav>
      <div className="detail-grid">
        <section className={`original-art panel ${expanded ? "expanded" : ""}`}>
          <button
            className="original-toggle"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            <img
              className={
                design.variants
                  ? "artwork-surface artwork-" + display?.tone
                  : undefined
              }
              src={art || "/assets/placeholders/design-placeholder.svg"}
              alt=""
            />
            <span>
              <Eyebrow>ORIGINAL ARTWORK</Eyebrow>
              <span>Design {design.id}</span>
            </span>
            <ChevronDown />
          </button>
          <div className="original-content">
            <Eyebrow>ORIGINAL ARTWORK</Eyebrow>
            <div
              className={`original-image ${design.variants ? "artwork-surface artwork-" + display?.tone : ""}`}
            >
              <img
                src={art || "/assets/placeholders/design-placeholder.svg"}
                alt={`${design.name}, original artwork`}
              />
            </div>
            <p>Design {design.id}</p>
          </div>
        </section>
        <section
          className="preview-panel panel"
          aria-label="Live T-shirt preview"
        >
          <Segmented
            label="Preview view"
            value={view}
            onChange={setView}
            options={[
              { value: "product", label: "T-shirt" },
              { value: "model", label: "Try on Model" },
            ]}
          />
          <div className="large-mockup">
            <Mockup
              design={design}
              colour={colour}
              side={side}
              view={view}
              artworkUrl={art}
            />
          </div>
          <div className="preview-bottom">
            <Segmented
              label="Preview side"
              value={side}
              onChange={setSide}
              options={allowedSides.map((s) => ({
                value: s,
                label: s === "front" ? "Front" : "Back",
              }))}
            />
            <button
              className="icon-button zoom"
              aria-label="Enlarge preview"
              onClick={() => setModal("zoom")}
            >
              <Search />
            </button>
          </div>
        </section>
        <section className="detail-info panel">
          <div className="detail-title">
            <h1>{design.name}</h1>
            <span className="badge">
              {design.available === false ? "UNAVAILABLE" : "AVAILABLE"}
            </span>
            <p>{design.description}</p>
          </div>
          <div className="detail-controls">
            <div className="colour-group">
              <span className="group-label">T-shirt colour</span>
              <ColourControl
                value={colour}
                onChange={setColour}
                allowed={allowedColours}
              />
            </div>
            <div className="size-group">
              <span className="group-label">Choose size</span>
              <div className="size-line">
                <Segmented
                  label="Shirt size"
                  value={size}
                  onChange={setSize}
                  options={(design.sizes || ["S", "M", "L", "XL", "XXL"]).map(
                    (s) => ({ value: s, label: s }),
                  )}
                />
                <button className="text-link" onClick={() => setModal("size")}>
                  Size guide
                </button>
              </div>
            </div>
            <div className="quantity-group">
              <span className="group-label">Quantity</span>
              <Quantity value={quantity} onChange={setQuantity} />
            </div>
            <div className="side-group">
              <span className="group-label">Print side</span>
              <Segmented
                label="Print side"
                value={side}
                onChange={setSide}
                options={allowedSides.map((s) => ({
                  value: s,
                  label: s === "front" ? "Front" : "Back",
                }))}
              />
            </div>
            <div className="detail-actions">
              <p>Price confirmed after your request.</p>
              <button
                className="button"
                disabled={
                  design.available === false ||
                  !allowedColours.includes(colour) ||
                  !allowedSides.includes(side)
                }
                onClick={() => {
                  setSuccess("");
                  setModal("request");
                }}
              >
                Request This Design
              </button>
              {design.available === false ||
              !allowedColours.includes(colour) ||
              !allowedSides.includes(side) ? (
                <button className="button secondary" disabled>
                  <img src="/assets/svg/whatsapp-outline.svg" alt="" />
                  Order on WhatsApp
                </button>
              ) : (
                <a
                  className="button secondary"
                  href={whatsappUrl(message, settings.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img src="/assets/svg/whatsapp-outline.svg" alt="" />
                  Order on WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      </div>
      {modal === "zoom" && (
        <Modal
          title={`${design.name} — ${colour}, ${side}`}
          onClose={() => setModal(null)}
        >
          <Mockup
            design={design}
            colour={colour}
            side={side}
            view={view}
            artworkUrl={art}
          />
        </Modal>
      )}
      {modal === "size" && (
        <Modal title="Size guide" onClose={() => setModal(null)}>
          <p>
            Our unisex T-shirts come in S, M, L, XL and XXL. Choose your usual
            size for a relaxed fit, or size up for an oversized look.
          </p>
          <p className="size-note">
            Tell us your preferred fit with your request. We’ll confirm the
            garment’s exact measurements before your order is placed.
          </p>
        </Modal>
      )}
      {modal === "request" && (
        <Modal
          title={success ? "Request received" : "Request this design"}
          onClose={() => setModal(null)}
        >
          {success ? (
            <div className="success" role="status">
              Your request {success} is saved. We’ll review your selected design
              and confirm the price.
              <Link className="button" href="/designs">
                Browse more designs
              </Link>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                const values = new FormData(e.currentTarget);
                const phone = String(values.get("phone"));
                if (phone.replace(/\D/g, "").length < 7) {
                  setError("Enter a valid contact number.");
                  return;
                }
                try {
                  const request = newRequest({
                    name: String(values.get("name")).trim(),
                    phone,
                    description: message,
                    colour,
                    side,
                    view,
                    size,
                    quantity,
                    designId: design.id,
                    variantId: variantIdentity(design, colour, side),
                    variantArtwork: display?.source,
                    previewBackground: display?.tone,
                  });
                  repository.createRequest(request);
                  setSuccess(request.id);
                  setRequestId(request.id);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <p>
                {design.name} · {colour} · {side} · {size} · {quantity}{" "}
                {quantity === 1 ? "shirt" : "shirts"}
              </p>
              <label className="field">
                Your name
                <input required name="name" minLength={2} autoComplete="name" />
              </label>
              <label className="field">
                WhatsApp number
                <input required name="phone" type="tel" autoComplete="tel" />
              </label>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button className="button" type="submit">
                Submit request
              </button>
            </form>
          )}
        </Modal>
      )}
    </main>
  );
}
