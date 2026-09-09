"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, Moon, Sun, X } from "lucide-react";
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const value = localStorage.getItem("iwbi-theme") === "dark";
    setDark(value);
    document.documentElement.dataset.theme = value ? "dark" : "light";
  }, []);
  function theme() {
    const value = !dark;
    setDark(value);
    localStorage.setItem("iwbi-theme", value ? "dark" : "light");
    document.documentElement.dataset.theme = value ? "dark" : "light";
  }
  return (
    <header
      className={`site-header ${path === "/customize" ? "custom-header" : ""} ${path === "/designs" ? "gallery-header" : ""} ${path.startsWith("/designs/") ? "detail-header" : ""}`}
    >
      <Link href="/" className="brand" aria-label="I WILL BUY IT home">
        <img
          src="/assets/brand/logo-navbar.webp"
          alt="I WILL BUY IT"
          width="160"
          height="160"
        />
      </Link>
      <nav
        aria-label="Main navigation"
        className={open ? "nav-links expanded" : "nav-links"}
      >
        {[
          ["/", "Home"],
          ["/designs", "Design Gallery"],
          ["/customize", "Customize"],
          ["/customize#how-it-works", "How It Works"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={
              (href === "/" ? path === "/" : path.startsWith(href))
                ? "active"
                : ""
            }
          >
            {label}
          </Link>
        ))}
        <button className="mobile-theme" onClick={theme}>
          {dark ? "Light theme" : "Dark theme"}
        </button>
      </nav>
      <div className="nav-actions">
        <Link
          className="icon-button nav-search"
          href="/designs?search=1"
          aria-label="Search designs"
        >
          <Search />
        </Link>
        <button
          className="icon-button theme-button"
          onClick={theme}
          aria-label={dark ? "Use light theme" : "Use dark theme"}
        >
          {dark ? <Sun /> : <Moon fill="currentColor" />}
        </button>
        <Link className="button nav-cta" href="/designs">
          Explore Designs
        </Link>
        <button
          className="icon-button menu-button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
