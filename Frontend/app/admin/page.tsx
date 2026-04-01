import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/server/auth/options";
import AdminDashboard from "../components/admin/AdminDashboard";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return <AdminDashboard />;
}
