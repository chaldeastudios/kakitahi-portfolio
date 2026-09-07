/**
 * Icons transcribed from the Framer project.
 *
 * ArrowRight / ArrowLeft: the project uses a nested icon component with
 * props for colour and a stroke weight of 1.5, drawn in an 18x17 box.
 * QuoteIcon: taken verbatim from the Testimonials component's SVG node
 * (nodeId SCI9sRCMr).
 */

export function ArrowRight({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="18" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowLeft({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowRightLarge({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Verbatim from the Testimonials component (nodeId SCI9sRCMr). */
export function QuoteIcon({ color = "black" }: { color?: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M13.3334 9.3335L10.6667 14.6668H14.6667V22.6668H6.66669V14.6668L9.33335 9.3335H13.3334ZM24 9.3335L21.3334 14.6668H25.3334V22.6668H17.3334V14.6668L20 9.3335H24Z"
        fill={color}
      />
    </svg>
  );
}

/** Clock face shown immediately before the timezone readout in the Header. */
export function ClockIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <path
        d="M12 7v5l3 2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Arrow-up-right, 18x19, used by the project detail page's Live Link row. */
export function ArrowUpRight({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="18" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 17 17 7M7 7h10v10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
