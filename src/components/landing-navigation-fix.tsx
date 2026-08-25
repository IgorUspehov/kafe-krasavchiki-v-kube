"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { consumeLandingReturnReload } from "@/lib/landing-navigation";

export function LandingNavigationFix() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const reloadLandingIfNeeded = () => {
      if (window.location.pathname === "/" && consumeLandingReturnReload()) {
        window.location.reload();
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    const handlePopState = () => {
      requestAnimationFrame(reloadLandingIfNeeded);
    };

    reloadLandingIfNeeded();
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (pathname === "/" && consumeLandingReturnReload()) {
      window.location.reload();
    }
  }, [pathname]);

  return null;
}
