"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/lib/i18n/context";
import { supportWidgetCopy } from "@/lib/i18n/support-widget-copy";

const TELEGRAM_URL = "https://t.me/Ihor_Kriazhev";
const WHATSAPP_URL = "https://wa.me/4915258400610";

function shouldHideSupportWidget(pathname: string, framed: boolean): boolean {
  if (framed || !pathname) return true;
  if (pathname.includes("/client") || pathname.includes("/demo")) return true;
  if (pathname === "/d" || pathname.startsWith("/d/")) return true;
  return false;
}

export function SupportWidget() {
  const { locale } = useTranslation();
  const copy = supportWidgetCopy[locale] ?? supportWidgetCopy.de;
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const [pathname, setPathname] = useState("");
  const [framed, setFramed] = useState(true);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    startRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    setPos({ x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y });
  };
  const onMouseUp = () => setDragging(false);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX - pos.x, y: t.clientY - pos.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setPos({ x: t.clientX - startRef.current.x, y: t.clientY - startRef.current.y });
  };

  useEffect(() => {
    setPathname(window.location.pathname);
    setFramed(window.self !== window.top);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (shouldHideSupportWidget(pathname, framed)) {
    return null;
  }

  return (
    <div
      className="fixed z-[9999] flex flex-col items-end gap-3"
      style={{ bottom: 24, right: 24 }}
    >
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="flex max-h-[min(70vh,560px)] w-[min(calc(100vw-48px),380px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-950 px-4 py-3">
            <h2 id={titleId} className="pr-2 text-base font-bold text-white">
              {copy.title}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={copy.close}
              className="rounded-lg p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            <Accordion type="single" collapsible className="w-full">
              {copy.faq.map((item, index) => (
                <AccordionItem key={`${locale}-${index}`} value={`faq-${index}`}>
                  <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-gray-600">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50 p-4">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              {copy.telegram}
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-800"
            >
              {copy.whatsapp}
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        aria-expanded={open}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          cursor: "grab",
        }}
        className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-orange-500 hover:shadow-orange-500/30"
      >
        <MessageCircle className="h-4 w-4" />
        {copy.button}
      </button>
    </div>
  );
}
