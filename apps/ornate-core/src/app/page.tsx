import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const role = session.user.role;

    switch (role) {
      case "SUPER_ADMIN":
        redirect("/super-admin");
      case "BRANCH_ADMIN":
        redirect("/branch-admin");
      case "SPORTS_ADMIN":
        redirect("/sports/all-sports");
      case "BRANCH_SPORTS_ADMIN":
        redirect("/sports/all-sports");
      case "HHO":
        redirect("/hho");
      case "CLUB_COORDINATOR":
        redirect("/clubs-portal");
      case "EVENT_COORDINATOR":
        redirect("/coordinator");
      default:
        redirect("/login");
    }
  }

  // If not logged in, redirect to login
  redirect("/login");
}
