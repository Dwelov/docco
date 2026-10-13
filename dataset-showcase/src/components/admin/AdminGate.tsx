import { cookies } from "next/headers";
import AdminDashboard from "./AdminDashboard";
import { ADMIN_COOKIE, verifySession } from "@/lib/auth";

/** Server gate: reads the session cookie and hands auth state to the dashboard. */
export default async function AdminGate() {
  const cookieStore = await cookies();
  const initialAuthed = await verifySession(cookieStore.get(ADMIN_COOKIE)?.value);
  return <AdminDashboard initialAuthed={initialAuthed} />;
}
