"use client";
import Link from "next/link";
import { useEffect } from "react";
import { PencilLine, Shirt, MessageCircle } from "lucide-react";
export function scrollToHowItWorks() {
  const heading = document.getElementById("how-it-works-heading");
  const section = document.getElementById("how-it-works");
  section?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });
  heading?.focus({ preventScroll: true });
}
export function HowItWorks() {
  useEffect(() => {
    const scroll = () => {
      if (location.hash === "#how-it-works")
        void document.fonts.ready.then(scrollToHowItWorks);
    };
    scroll();
    window.addEventListener("hashchange", scroll);
    return () => window.removeEventListener("hashchange", scroll);
  }, []);
  return (
    <section
      id="how-it-works"
      className="home-process"
      aria-labelledby="how-it-works-heading"
    >
      <p className="process-eyebrow">YOUR DESIGN. YOUR COLOUR. YOUR PRINT.</p>
      <h2 id="how-it-works-heading" tabIndex={-1}>
        How It Works
      </h2>
      <div className="home-process-grid">
        <article>
          <PencilLine aria-hidden="true" />
          <span>01</span>
          <h3>Choose or share a design</h3>
          <p>
            Find artwork in our gallery or share your own idea. Make it
            something you’ll love to wear.
          </p>
          <Link href="/designs">Explore designs →</Link>
        </article>
        <article>
          <Shirt aria-hidden="true" />
          <span>02</span>
          <h3>Preview it on your T-shirt</h3>
          <p>
            Choose an available colour, check the print and try the model
            preview before sending your request.
          </p>
          <Link href="/customize">Share your idea →</Link>
        </article>
        <article>
          <MessageCircle aria-hidden="true" />
          <span>03</span>
          <h3>Confirm through WhatsApp</h3>
          <p>
            Send your request. We’ll review the artwork, confirm the price and
            agree on the details with you.
          </p>
          <Link href="/customize">Start a request →</Link>
        </article>
      </div>
    </section>
  );
}
