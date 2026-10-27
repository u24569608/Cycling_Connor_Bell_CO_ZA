"use client";

import { useEffect } from "react";

function TapUnderline() {
  useEffect(() => {
    const controller = new AbortController();
    const timers = new Map<HTMLElement, number>();
    let press: {
      element: HTMLElement;
      pointerId: number;
      x: number;
      y: number;
    } | null = null;

    function handlePointerDown(event: PointerEvent) {
      if (
        (event.pointerType !== "touch" && event.pointerType !== "pen") ||
        event.isPrimary !== true
      ) {
        return;
      }

      press = null;

      if (event.target instanceof Element !== true) {
        return;
      }

      const element = event.target.closest<HTMLElement>(".fade-underline");

      if (
        element === null ||
        element.matches(":disabled, [aria-disabled='true']") === true
      ) {
        return;
      }

      press = {
        element,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
    }

    function handlePointerMove(event: PointerEvent) {
      if (
        press !== null &&
        press.pointerId === event.pointerId &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8
      ) {
        press = null;
      }
    }

    function handlePointerUp(event: PointerEvent) {
      const tap = press;

      if (tap === null || tap.pointerId !== event.pointerId) {
        return;
      }

      press = null;

      if (
        Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 8 ||
        tap.element.isConnected !== true ||
        tap.element.matches(":disabled, [aria-disabled='true']") === true
      ) {
        return;
      }

      const previousTimer = timers.get(tap.element);

      if (previousTimer !== undefined) {
        window.clearTimeout(previousTimer);
      }

      tap.element.setAttribute("data-tap-underline", "");
      timers.set(
        tap.element,
        window.setTimeout(() => {
          tap.element.removeAttribute("data-tap-underline");
          timers.delete(tap.element);
        }, 300),
      );
    }

    function handlePointerCancel(event: PointerEvent) {
      if (press?.pointerId === event.pointerId) {
        press = null;
      }
    }

    const options = {
      capture: true,
      passive: true,
      signal: controller.signal,
    };

    document.addEventListener("pointerdown", handlePointerDown, options);
    document.addEventListener("pointermove", handlePointerMove, options);
    document.addEventListener("pointerup", handlePointerUp, options);
    document.addEventListener("pointercancel", handlePointerCancel, options);

    return () => {
      controller.abort();

      for (const [element, timer] of timers) {
        window.clearTimeout(timer);
        element.removeAttribute("data-tap-underline");
      }

      timers.clear();
    };
  }, []);

  return null;
}

export default TapUnderline;
