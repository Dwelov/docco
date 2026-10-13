import type { Metadata } from "next";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin — Dataset Showcase",
  description: "Manage showcase datasets.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
