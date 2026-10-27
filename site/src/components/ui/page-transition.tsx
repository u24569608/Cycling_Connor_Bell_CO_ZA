"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useState,
  type AnimationEvent,
  type MouseEvent,
  type ReactNode,
  type TransitionEvent,
} from "react";

type PageTransitionProps = {
  children: ReactNode;
};

type TransitionPhase = "idle" | "leaving" | "waiting";

function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pendingPathname, setPendingPathname] = useState<string | null>(null);

  function handleNavigation(event: MouseEvent<HTMLDivElement>) {
    if (
      event.defaultPrevented === true ||
      event.button !== 0 ||
      event.metaKey === true ||
      event.ctrlKey === true ||
      event.shiftKey === true ||
      event.altKey === true ||
      phase !== "idle"
    ) {
      return;
    }

    if (event.target instanceof Element !== true) {
      return;
    }

    const anchor = event.target.closest("a");

    if (
      anchor === null ||
      anchor.target === "_blank" ||
      anchor.hasAttribute("download") === true
    ) {
      return;
    }

    const url = new URL(anchor.href);

    if (
      url.origin !== window.location.origin ||
      url.pathname === window.location.pathname
    ) {
      return;
    }

    event.preventDefault();
    setPendingHref(`${url.pathname}${url.search}${url.hash}`);
    setPendingPathname(url.pathname);
    setPhase("leaving");
  }

  function handleFadeOut(event: TransitionEvent<HTMLDivElement>) {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "opacity" ||
      phase !== "leaving" ||
      pendingHref === null
    ) {
      return;
    }

    setPhase("waiting");
    router.push(pendingHref);
  }

  function handleFadeIn(event: AnimationEvent<HTMLDivElement>) {
    if (
      event.target !== event.currentTarget ||
      phase !== "waiting" ||
      pathname !== pendingPathname
    ) {
      return;
    }

    setPhase("idle");
    setPendingHref(null);
    setPendingPathname(null);
  }

  const visualPhase =
    phase === "waiting" && pathname === pendingPathname ? "entering" : phase;

  return (
    <div
      key={pathname}
      className="page-transition"
      data-phase={visualPhase}
      onAnimationEnd={handleFadeIn}
      onClickCapture={handleNavigation}
      onTransitionEnd={handleFadeOut}
    >
      {children}
    </div>
  );
}

export default PageTransition;
