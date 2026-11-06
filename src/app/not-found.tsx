import { Compass } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/app-shell";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[#f5f7f6] px-5">
      <div className="fin-card w-full max-w-md p-8 text-center">
        <div className="mx-auto flex w-fit items-center gap-2">
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">Finquira</span>
        </div>
        <span className="mx-auto mt-6 grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Compass className="size-5" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">Page not found</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          The page you were looking for does not exist, or the record belongs to another account.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/dashboard" className="fin-btn-primary">
            Back to dashboard
          </Link>
          <Link href="/" className="fin-btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
