import PageTemplate from "@/components/layout/PageTemplate";
import { runAllChecks } from "@/lib/odoo/status";

/**
 * /status — Odoo connection diagnostics. Not part of the Framer design
 * (no equivalent page exists there); a plain, functional page for
 * confirming the live Odoo connection, in the site's own type and colour
 * tokens rather than borrowed styling. Same checks as the validated
 * chaldeastudios/kilele_coffee reference's /status page.
 *
 * Every check below runs live, on every request — nothing here is cached.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Odoo status — Isaiah Kakitahi",
  robots: { index: false, follow: false },
};

export default async function StatusPage() {
  const checks = await runAllChecks();
  const allOk = checks.every((c) => c.ok);

  return (
    <PageTemplate ground="white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-20">
        <div className="flex flex-col gap-3">
          <h1 className="t-h3">Odoo connection diagnostics</h1>
          <p className="t-body">
            Every check below runs live, right now, against the real Odoo
            instance. Nothing here is cached.
          </p>
          <p className="t-body-s">
            Overall:{" "}
            <span className={allOk ? "text-black" : "text-black"}>
              {allOk ? "✅ all checks passing" : "⚠️ one or more checks failing"}
            </span>
          </p>
        </div>

        <div className="flex flex-col border border-border">
          {checks.map((c) => (
            <div
              key={c.name}
              className="flex flex-col gap-1 border-b border-border p-4 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="t-body-s shrink-0 font-mono">
                  {c.skipped ? "⚠️ SKIPPED" : c.ok ? "✅ OK" : "❌ FAIL"}
                </span>
                <span className="t-body">{c.name}</span>
              </div>
              <p className="t-body-s whitespace-pre-wrap break-all opacity-70">
                {c.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PageTemplate>
  );
}
