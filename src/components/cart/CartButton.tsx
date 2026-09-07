"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CartIcon } from "@/components/ui/icons";
import { useCart } from "@/lib/cart/CartProvider";

/**
 * The header's cart. Sits in the right-hand group beside the clock, at the
 * same 48px height as the rest of the header, and carries a count badge in
 * /Yellow — the site's only accent, so the one number that changes is the
 * one thing that catches the eye.
 *
 * The count renders as nothing until the cart has been read from storage,
 * so the first paint never shows a wrong number and then corrects itself.
 */
export default function CartButton() {
  const { count, ready } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex h-full items-center gap-[6px] px-3 text-black"
      aria-label={ready && count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
    >
      <CartIcon color="rgb(0, 0, 0)" />
      <span className="t-body-s hidden tablet:inline">Cart</span>
      {ready && count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25, ease: [0.44, 0, 0.56, 1] }}
          className="t-body-s flex h-[18px] min-w-[18px] items-center justify-center bg-yellow px-[5px] text-black"
        >
          {count}
        </motion.span>
      )}
    </Link>
  );
}
