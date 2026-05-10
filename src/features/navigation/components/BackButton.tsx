"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 transition-colors hover:bg-primary/25"
    >
      <ArrowLeft className="h-5 w-5 text-primary" />
    </button>
  );
}
