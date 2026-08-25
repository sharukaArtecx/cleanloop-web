"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useInView
 * --------------------------------------------------------------------------
 * Minimal IntersectionObserver hook. Fires once (unobserves itself after the
 * first match) so sections don't re-animate every time they scroll back into
 * view — that read as jittery/spammy in testing on the other Allure pages,
 * so baking in the one-shot behavior here by default.
 */
export function useInView({ threshold = 0.2, rootMargin = "0px 0px -10% 0px" } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // Respect prefers-reduced-motion by just marking it "in view" immediately
    // instead of animating in on scroll.
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, inView];
}

/**
 * Reveal
 * --------------------------------------------------------------------------
 * Wraps a section/child, fading + sliding it up once it scrolls into view.
 * `delay` is in ms and staggers siblings (e.g. role cards) without needing a
 * parent-level stagger orchestrator.
 */
export default function Reveal({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();

  return (
    <div
      ref={ref}
      className={`${inView ? "animate-fade-up" : "opacity-0"} ${className}`}
      style={{ animationDelay: inView ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}