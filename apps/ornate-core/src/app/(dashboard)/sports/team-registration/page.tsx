"use client";
import { TeamRegistrationPage } from "@/components/features/admin/views/TeamRegistrationPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return (
    <TeamRegistrationPage
      onNavigate={(path) => router.push(`/dashboard/${path}`)}
    />
  );
}
