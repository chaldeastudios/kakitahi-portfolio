import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageTemplate from "@/components/layout/PageTemplate";
import AuthForms from "@/components/account/AuthForms";
import { getSession } from "@/lib/auth/session";

/**
 * /account/login — sign in or create an account. Already signed in? There
 * is nothing here for you, so go to the account itself.
 */
export const metadata: Metadata = {
  title: "Sign in — Isaiah Kakitahi",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/account");
  const { next } = await searchParams;

  return (
    <PageTemplate>
      <div className="flex w-full flex-col items-center gap-0 p-0">
        <AuthForms next={next} />
      </div>
    </PageTemplate>
  );
}
