import { NextResponse } from "next/server";
import { ODOO_API_KEY, isOdooConfigured } from "@/lib/odoo/config";
import { callJson2 } from "@/lib/odoo/json2";
import { readDownloadToken } from "@/lib/checkout/signing";

/**
 * Hands over the file attached to a product — Bernaum's remix-link PDF —
 * to someone who has completed a checkout.
 *
 * The attachment is private in Odoo, so this route fetches it with the
 * server-side key and streams it. Access is decided by the signed token the
 * checkout issues (see src/lib/checkout/signing.ts): it names the order and
 * the attachment, expires, and cannot be edited to point somewhere else
 * without breaking its signature. No session, nothing stored.
 */
export async function GET(request: Request) {
  // Authorise before anything else. Checking configuration first would
  // answer a forged token with "not configured", which is both the wrong
  // status and a hint about the deployment.
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const claim = readDownloadToken(token);
  if (!claim) {
    return NextResponse.json(
      { error: "That download link is invalid or has expired. Order it again to get a new one." },
      { status: 403 }
    );
  }

  if (!isOdooConfigured) {
    return NextResponse.json({ error: "Odoo is not configured" }, { status: 503 });
  }

  try {
    const [file] = await callJson2<
      Array<{ id: number; name: string; mimetype: string; datas: string | false }>
    >(
      "ir.attachment",
      "read",
      { ids: [claim.attachmentId], fields: ["id", "name", "mimetype", "datas"] },
      ODOO_API_KEY
    );

    if (!file?.datas) {
      return NextResponse.json({ error: "That file is no longer available" }, { status: 404 });
    }

    const bytes = Buffer.from(file.datas, "base64");
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": file.mimetype || "application/octet-stream",
        "Content-Length": String(bytes.length),
        "Content-Disposition": `attachment; filename="${file.name.replace(/"/g, "")}"`,
        // Signed, per-order, and expiring: never cache it anywhere shared.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.warn("[odoo] download failed:", err);
    return NextResponse.json({ error: "Could not fetch that file" }, { status: 502 });
  }
}
