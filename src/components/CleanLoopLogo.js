"use client";

/**
 * CleanLoopLogo
 * --------------------------------------------------------------------------
 * The mark is a single open loop — not a closed circle — because the product's
 * whole thesis is a route that keeps moving, not a sealed cycle. The gap in
 * the loop is "closed" by a small arrowhead re-entering it, and a solid dot
 * marks the loop's one fixed stop (its "resident" origin point). Same two
 * ideas the hero RouteMap uses, just compressed down to icon scale so the
 * logo and the hero diagram read as the same visual system.
 *
 * Props:
 *  - variant: "lockup" (mark + wordmark, default) | "mark" (icon only)
 *  - tone:    "dark"  -> wordmark in loop-50, for use on the dark hero/footer
 *             "light" -> wordmark in loop-900, for use on paper sections
 *  - size:    px height of the mark. Wordmark scales relative to it.
 */
export default function CleanLoopLogo({
  variant = "lockup",
  tone = "light",
  size = 32,
  className = "",
}) {
  const wordmarkColor = tone === "dark" ? "#F6F5EE" : "#10160F";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        role="img"
        aria-label="CleanLoop"
      >
        <defs>
          {/* Green -> amber sweep: the loop "travels" from ops-green into
              signal-amber, the same direction the hero's vehicle marker moves. */}
          <linearGradient id="cl-mark-grad" x1="4" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#24513B" />
            <stop offset="1" stopColor="#E2A33B" />
          </linearGradient>
        </defs>

        {/* The open loop. Drawn as one continuous arc (not a full circle) with
            a ~46° gap on the lower-right, which the arrowhead re-enters. */}
        <path
          d="M20 5.5
             A14.5 14.5 0 1 1 8.2 28.4"
          stroke="url(#cl-mark-grad)"
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Arrowhead: closes the gap, gives the loop a direction of travel. */}
        <path
          d="M8.2 28.4 L6.6 21.7 L13 24.6 Z"
          fill="#E2A33B"
        />

        {/* Fixed stop marker at the top of the loop. */}
        <circle cx="20" cy="5.5" r="3.1" fill="#10160F" />
        <circle cx="20" cy="5.5" r="1.35" fill="#F6F5EE" />
      </svg>

      {variant === "lockup" && (
        <span
          className="font-display text-[1.35rem] font-bold leading-none tracking-tight"
          style={{ color: wordmarkColor }}
        >
          Clean<span style={{ color: "#E2A33B" }}>Loop</span>
        </span>
      )}
    </span>
  );
}