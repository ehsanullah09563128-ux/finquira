"use client";

import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { Modal, ModalFooter } from "./modal";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  busy = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
          <TriangleAlert className="size-4" />
        </span>
        <p className="text-[13.5px] leading-relaxed text-slate-600">{message}</p>
      </div>
      <ModalFooter>
        <button type="button" className="fin-btn-secondary" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="fin-btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          {confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}

export function Toolbar({
  search,
  onSearch,
  placeholder,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center sm:px-6">
      <label className="relative block w-full lg:max-w-xs">
        <span className="sr-only">{placeholder}</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
          className="fin-input pl-9"
          type="search"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
