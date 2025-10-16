import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jwt from "jsonwebtoken";
import AdminDashboard from "./adminDashboard";

export default function AdminPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  let user: any = null;
  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      user = null;
    }
  }

  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  return <AdminDashboard user={user} />;
}
