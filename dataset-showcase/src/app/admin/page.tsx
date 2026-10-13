import type { Metadata } from "next";
import { Suspense } from "react";
import AdminGate from "@/components/admin/AdminGate";

export const metadata: Metadata = {
  title: "Admin — Dataset Showcase",
  description: "Manage showcase datasets.",
};

function AdminLoading() {
  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8" aria-busy="true" aria-label="Loading admin">
      <div className="space-y-2">
        <div className="h-6 w-1/4 animate-pulse rounded bg-gray-200" />
        <div className="h-24 animate-pulse rounded bg-gray-100" />
        <div className="h-24 animate-pulse rounded bg-gray-100" />
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminGate />
    </Suspense>
  );
}
