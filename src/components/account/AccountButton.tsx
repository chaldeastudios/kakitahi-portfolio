import Link from "next/link";
import { UserIcon } from "@/components/ui/icons";

/**
 * The header's account link, beside the cart.
 *
 * It takes the session as a prop rather than reading it: the header is a
 * client component (it owns the collapsed menu), so the session is read
 * server-side in PageTemplate and handed down. That means the header knows
 * on the first paint whether someone is signed in — no flash of "Sign in"
 * for a customer who already is.
 */
export default function AccountButton({
  name,
  email,
}: {
  name?: string;
  email?: string;
}) {
  const signedIn = Boolean(email);

  return (
    <Link
      href={signedIn ? "/account" : "/account/login"}
      className="flex h-full items-center gap-[6px] px-3 text-black"
      aria-label={signedIn ? `Account — signed in as ${email}` : "Sign in"}
    >
      <UserIcon color="rgb(0, 0, 0)" />
      <span className="t-body-s hidden tablet:inline">
        {signedIn ? (name?.split(" ")[0] || "Account") : "Sign in"}
      </span>
    </Link>
  );
}
