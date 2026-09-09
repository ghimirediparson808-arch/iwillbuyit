"use client";
import { useEffect, useState } from "react";
import { FilePenLine, Search, ShieldCheck } from "lucide-react";
import { Eyebrow } from "@/components/site/Decorations";
import { UploadField } from "@/components/UploadField";
import {
  ColourControl,
  Segmented,
  Quantity,
} from "@/components/design-preview/Controls";
import { newRequest, repository } from "@/services/repository";
import { saveUpload } from "@/services/uploads";
import type { Colour, Side } from "@/types";
export function Customize() {
  const [colour, setColour] = useState<Colour>("navy");
  const [side, setSide] = useState<Side | "both">("front");
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <main id="main" className="customize-main">
      <section className="custom-intro" id="how-it-works">
        <Eyebrow>YOUR IDEA • OUR PRINT</Eyebrow>
        <h1>
          Customize <br />
          Your Design
        </h1>
        <p>
          Tell us what you want to wear. Upload a reference or describe your
          idea, and we’ll review it with you.
        </p>
        <ol className="process-steps">
          <li>
            <span className="step-icon">
              <FilePenLine />
            </span>
            <div>
              <strong>1. Share your idea</strong>
              <p>Upload a reference or tell us your concept in detail.</p>
            </div>
          </li>
          <li>
            <span className="step-icon">
              <Search />
            </span>
            <div>
              <strong>2. We review it</strong>
              <p>
                Our team will go through your request and suggest any
                improvements if needed.
              </p>
            </div>
          </li>
          <li>
            <span className="step-icon">
              <img src="/assets/svg/whatsapp-outline.svg" alt="" />
            </span>
            <div>
              <strong>3. Confirm on WhatsApp</strong>
              <p>
                We’ll create your request and continue the conversation on
                WhatsApp.
              </p>
            </div>
          </li>
        </ol>
        <p className="privacy-note">
          <ShieldCheck />
          Your uploads stay on this device.
        </p>
      </section>
      <section className="custom-form panel">
        {success ? (
          <div className="request-success" role="status">
            <ShieldCheck />
            <h2>We’ve received your idea.</h2>
            <p>
              Your request <strong>{success}</strong> is saved. We’ll review
              your artwork and confirm the details with you.
            </p>
            <button
              className="button"
              onClick={() => {
                setSuccess("");
                setFile(null);
              }}
            >
              Create another request
            </button>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              const values = new FormData(e.currentTarget);
              const phone = String(values.get("phone"));
              if (phone.replace(/\D/g, "").length < 7) {
                setError("Enter a valid WhatsApp number.");
                return;
              }
              if (!String(values.get("description")).trim() && !file) {
                setError("Describe your idea or upload a reference image.");
                return;
              }
              setBusy(true);
              try {
                const uploadId = file ? await saveUpload(file) : undefined;
                const request = newRequest({
                  name: String(values.get("name")).trim(),
                  phone,
                  email: String(values.get("email")),
                  neededBy: String(values.get("neededBy")),
                  description:
                    String(values.get("description")).trim() ||
                    "Please use my uploaded reference.",
                  colour,
                  side,
                  size,
                  quantity,
                  uploadId,
                  uploadName: file?.name,
                });
                repository.createRequest(request);
                setSuccess(request.id);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="field-grid">
              <label className="field">
                Your name
                <input
                  required
                  minLength={2}
                  name="name"
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </label>
              <label className="field">
                WhatsApp number
                <input
                  required
                  type="tel"
                  name="phone"
                  placeholder="+977 98XXXXXXXX"
                  autoComplete="tel"
                />
              </label>
              <label className="field">
                Email (optional)
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              <label className="field">
                Needed by (optional)
                <input
                  type="date"
                  name="neededBy"
                  min={new Date().toLocaleDateString("en-CA")}
                />
              </label>
              <label className="field full">
                Describe your design
                <textarea
                  name="description"
                  placeholder="Colours, text, style, placement, references..."
                />
              </label>
              <div className="full">
                <UploadField onFile={setFile} preview={preview} />
              </div>
            </div>
            <div className="custom-options">
              <div>
                <span className="group-label">T-shirt colour</span>
                <ColourControl value={colour} onChange={setColour} />
              </div>
              <div>
                <span className="group-label">Print side</span>
                <Segmented
                  label="Print side"
                  value={side}
                  onChange={setSide}
                  options={[
                    { value: "front", label: "Front" },
                    { value: "back", label: "Back" },
                    { value: "both", label: "Both" },
                  ]}
                />
              </div>
              <div>
                <span className="group-label">Size</span>
                <Segmented
                  label="Size"
                  value={size}
                  onChange={setSize}
                  options={["S", "M", "L", "XL", "XXL"].map((value) => ({
                    value,
                    label: value,
                  }))}
                />
              </div>
              <div>
                <span className="group-label">Quantity</span>
                <Quantity value={quantity} onChange={setQuantity} />
              </div>
            </div>
            <label className="check-label consent">
              <input type="checkbox" required defaultChecked />I agree to be
              contacted about this request.
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button submit-request"
              type="submit"
              disabled={busy}
            >
              {busy ? "Saving your request…" : "Submit Custom Request"}
            </button>
            <p className="form-footer">
              We’ll create a request ID and continue with you on WhatsApp.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
