"use client";

import { useEffect, useState } from "react";

/**
 * TimezoneClock — transcribed from the project's code component
 * Workshop/SimpleTimezoneClock.tsx (codeFileId OatEk91).
 *
 * The Header instance uses: timezone America/New_York, use24Hour false,
 * leadingZero false, showDayOfWeek false, showSeconds false, separator ":",
 * textCase normal, textColor rgb(0, 0, 0).
 *
 * Digits render in fixed 0.6em cells and AM/PM in a 2em cell so the clock
 * does not reflow as the time ticks — same as the original.
 */
export default function TimezoneClock({
  timezone = "America/New_York",
  use24Hour = false,
  showSeconds = false,
  leadingZero = false,
  separator = ":",
  textColor = "rgb(0, 0, 0)",
}: {
  timezone?: string;
  use24Hour?: boolean;
  showSeconds?: boolean;
  leadingZero?: boolean;
  separator?: string;
  textColor?: string;
}) {
  const [segments, setSegments] = useState<
    Array<{ type: string; content: string }>
  >([]);

  useEffect(() => {
    const update = () => {
      try {
        const now = new Date();
        const effective =
          timezone === "My Location"
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : timezone;

        const formatted = new Intl.DateTimeFormat("en-US", {
          timeZone: effective,
          hour: "2-digit",
          minute: "2-digit",
          ...(showSeconds && { second: "2-digit" }),
          hour12: !use24Hour,
        }).format(now);

        let processed = formatted;
        if (!use24Hour && !leadingZero) processed = formatted.replace(/^0/, "");
        const custom = processed.replace(/:/g, separator);

        const next: Array<{ type: string; content: string }> = [];
        const withoutAmPm = custom.replace(/\s?(AM|PM|am|pm)$/i, "");
        const ampm = custom.match(/\s?(AM|PM|am|pm)$/i);

        for (const char of withoutAmPm) {
          next.push({ type: /\d/.test(char) ? "digit" : "separator", content: char });
        }
        if (ampm) {
          next.push({ type: "space", content: " " });
          next.push({ type: "ampm", content: ampm[1] });
        }
        setSegments(next);
      } catch {
        setSegments([]);
      }
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timezone, use24Hour, showSeconds, leadingZero, separator]);

  return (
    <span
      className="t-body-s relative inline-block w-max min-w-max"
      style={{ color: textColor }}
      suppressHydrationWarning
    >
      {segments.map((s, i) => {
        if (s.type === "digit") {
          return (
            <span key={i} className="inline-block text-center" style={{ width: "0.6em" }}>
              {s.content}
            </span>
          );
        }
        if (s.type === "ampm") {
          return (
            <span key={i} className="inline-block text-left" style={{ width: "2em" }}>
              {s.content}
            </span>
          );
        }
        return <span key={i}>{s.content}</span>;
      })}
    </span>
  );
}
