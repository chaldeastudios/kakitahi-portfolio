"use client";

import { useState } from "react";

/**
 * ProjectVideos — the "Videos3" stack on the project detail page
 * (GsBvva0lJ): a vertical, centred stack holding
 *
 *   Video (QB7YEGWN0)       srcType Upload, loop, controls, muted,
 *                           objectFit cover, poster enabled, volume 25,
 *                           playing false
 *   YouTubePlayer (Cl39FDuHH) aspectRatio 16:9, borderRadius 0,
 *                           autoplay false, loop false, captions off,
 *                           overlayOpacity 0.3, accentColor white,
 *                           custom play icon, centred, 60px
 *
 * The YouTube half is a facade: it shows the thumbnail with the design's
 * dark overlay and 60px play mark, and only loads the real iframe once
 * the viewer clicks. Nothing is requested from YouTube until then.
 *
 * Both fields are optional in the CMS (Shelt carries no upload), so each
 * renders only when its value is present.
 */
export default function ProjectVideos({
  video,
  youtubeUrl,
  title,
}: {
  video: string | null;
  youtubeUrl: string | null;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (!video && !youtubeUrl) return null;

  const id = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;

  return (
    <section className="flex w-full flex-col items-center justify-center overflow-hidden">
      {video && (
        <video
          className="w-full object-cover"
          src={video}
          loop
          muted
          controls
          playsInline
          preload="metadata"
        />
      )}

      {id && (
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
              title={`${title} — video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play the ${title} video`}
              className="absolute inset-0 block h-full w-full overflow-hidden bg-black bg-cover bg-center"
              style={{
                backgroundImage: `url("https://i.ytimg.com/vi/${id}/maxresdefault.jpg")`,
              }}
            >
              {/* overlayOpacity 0.3 */}
              <span
                aria-hidden="true"
                className="absolute inset-0 block bg-black"
                style={{ opacity: 0.3 }}
              />
              {/* custom play icon, centred, 60px, accent white */}
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ width: 60, height: 60 }}
              >
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <path d="M22 16 L46 30 L22 44 Z" fill="rgb(255,255,255)" />
                </svg>
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}
