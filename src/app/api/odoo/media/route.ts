import { NextResponse } from "next/server";
import { ODOO_API_KEY, isOdooConfigured } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";

/**
 * Image proxy for Odoo binaries.
 *
 * Odoo serves /web/image/<model>/<id>/<field> to the public only for
 * records published on its own website. These products are not — they are
 * catalogue records the site reads over the API — so their eCommerce Media
 * would 404 if the browser asked Odoo directly. This route asks instead,
 * with the server-side read key, and streams the bytes back. The key never
 * leaves the server and the browser sees an ordinary image URL.
 *
 * Locked to an allow-list of model/field pairs: a proxy that will fetch any
 * binary field of any model on request is an open door to every attachment
 * in the database. Only product imagery is reachable here — the one file
 * that is meant to be handed out goes through /api/download, which requires
 * a signed token from a completed checkout.
 */

const ALLOWED: Record<string, string[]> = {
  "product.image": ["image_1920", "image_1024", "image_512", "image_256", "image_128"],
  "product.template": ["image_1920", "image_1024", "image_512", "image_256", "image_128"],
  "product.product": ["image_1920", "image_1024", "image_512", "image_256", "image_128"],
};

/** Sniff the type from the magic bytes; Odoo does not hand one back here. */
function contentTypeOf(buf: Buffer): string {
  if (buf.length > 12 && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return "image/png";
  if (buf.toString("ascii", 0, 4) === "GIF8") return "image/gif";
  if (buf.toString("ascii", 0, 5) === "<?xml" || buf.toString("ascii", 0, 4) === "<svg")
    return "image/svg+xml";
  return "application/octet-stream";
}

export async function GET(request: Request) {
  // Allow-list first, for the same reason the download route authorises
  // first: a request for something off the list is refused as such, whether
  // or not this deployment has a connection to refuse it with.
  const url = new URL(request.url);
  const model = url.searchParams.get("model") ?? "";
  const field = url.searchParams.get("field") ?? "image_1920";
  const id = Number(url.searchParams.get("id"));

  if (!ALLOWED[model]?.includes(field) || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Not a permitted image" }, { status: 400 });
  }

  if (!isOdooConfigured) {
    return NextResponse.json({ error: "Odoo is not configured" }, { status: 503 });
  }

  try {
    const [record] = await callJson2<Array<Record<string, string | false>>>(
      model,
      "read",
      { ids: [id], fields: [field] },
      ODOO_API_KEY
    );

    const base64 = record?.[field];
    if (!base64 || typeof base64 !== "string") {
      return NextResponse.json({ error: "No image on that record" }, { status: 404 });
    }

    const bytes = Buffer.from(base64, "base64");
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentTypeOf(bytes),
        "Content-Length": String(bytes.length),
        // Odoo image ids are stable and the bytes behind one rarely change;
        // a long public cache keeps this off the request path in practice.
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.warn("[odoo] media proxy failed:", err);
    return NextResponse.json({ error: "Could not fetch that image" }, { status: 502 });
  }
}
