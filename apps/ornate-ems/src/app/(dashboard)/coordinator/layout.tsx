import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user) {
    redirect("/login");
  }

  if (role !== "EVENT_COORDINATOR" && role !== "SUPER_ADMIN") {
    if (role === "SPORTS_ADMIN" || role === "BRANCH_SPORTS_ADMIN") {
      redirect("/sports/all-sports");
    }
    if (role === "BRANCH_ADMIN") {
      redirect("/branch-admin");
    }
    if (role === "CLUB_COORDINATOR") {
      redirect("/clubs-portal");
    }
    if (role === "HHO") {
      redirect("/hho");
    }
    redirect("/login");
  }

  return <>{children}</>;
}
