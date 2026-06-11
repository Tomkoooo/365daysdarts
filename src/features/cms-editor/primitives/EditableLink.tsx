"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCmsEdit } from "@/features/cms-editor/context/CmsEditContext";
import { Button } from "@/components/ui/button";
import { DynamicLucideIcon } from "@/features/cms-editor/primitives/IconPicker";

export function EditableLink({
  blockId,
  labelField,
  hrefField,
  label,
  href,
  icon,
  className,
  buttonVariant = "default",
  buttonClassName,
  onCommitLabel,
  onCommitHref,
}: {
  blockId: string;
  labelField: string;
  hrefField: string;
  label: string;
  href: string;
  icon?: string;
  className?: string;
  buttonVariant?: "default" | "outline" | "secondary";
  buttonClassName?: string;
  onCommitLabel?: (value: string) => void;
  onCommitHref?: (value: string) => void;
}) {
  const cms = useCmsEdit();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);
  const [nextHref, setNextHref] = useState(href || "");
  const [nextLabel, setNextLabel] = useState(label || "");

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelPos({ top: rect.bottom + 8, left: rect.left });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const buttonContent = (
    <>
      {icon ? <DynamicLucideIcon name={icon} className="w-4 h-4 mr-2" /> : null}
      {label || "Gomb"}
    </>
  );

  if (!cms.enabled) {
    return (
      <Link href={href || "#"} className={className}>
        <Button variant={buttonVariant} className={buttonClassName}>
          {buttonContent}
        </Button>
      </Link>
    );
  }

  const panel =
    open && panelPos
      ? createPortal(
          <div
            className="cms-admin-control fixed z-[500] w-72 rounded-md border bg-popover p-3 shadow-xl space-y-2"
            style={{ top: panelPos.top, left: panelPos.left }}
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Link beállítások
            </p>
            <input
              value={nextLabel}
              onChange={(event) => setNextLabel(event.target.value)}
              onBlur={() =>
                onCommitLabel
                  ? onCommitLabel(nextLabel)
                  : cms.updateField(blockId, labelField, nextLabel)
              }
              className="w-full h-8 px-2 border rounded text-xs"
              placeholder="Gomb felirat"
            />
            <input
              value={nextHref}
              onChange={(event) => setNextHref(event.target.value)}
              onBlur={() =>
                onCommitHref
                  ? onCommitHref(nextHref)
                  : cms.updateField(blockId, hrefField, nextHref)
              }
              className="w-full h-8 px-2 border rounded text-xs"
              placeholder="/"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full h-8 border rounded text-xs uppercase"
            >
              Kész
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div ref={anchorRef} className="relative inline-block">
        <Button
          variant={buttonVariant}
          className={buttonClassName}
          onClick={(event) => {
            event.preventDefault();
            if (!open) {
              setNextLabel(label || "");
              setNextHref(href || "");
            }
            setOpen((prev) => !prev);
          }}
        >
          {buttonContent}
        </Button>
      </div>
      {panel}
    </>
  );
}
