"use client";

import { AddSportPage } from "@/components/features/sports/views/AddSportPage";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useEffect } from "react";

function AddSportWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fallback: If no search params, treat as create mode
  const mode = searchParams.get("mode") || "create";
  const id = searchParams.get("id");

  const handleNavigate = (path: string) => {
    router.push(`/sports/${path}`);
  };

  // IMPORTANT: AddSportPage expects initialData object if ID present.
  // It will fetch full details itself as per recent changes.
  const initialData: Record<string, any> | null = id ? { id } : null;

  const { data: session } = useSession();
  const isBranchSportsAdmin = session?.user?.role === "BRANCH_SPORTS_ADMIN";

  useEffect(() => {
    if (isBranchSportsAdmin) {
      router.push("/sports/all-sports");
    }
  }, [isBranchSportsAdmin, router]);

  if (isBranchSportsAdmin) return null;

  return (
    <AddSportPage
      mode={mode}
      initialData={initialData as any}
      hideStep2Coordinators={true}
      hiddenStepIds={[3, 4]}
      onNavigate={handleNavigate}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddSportWrapper />
    </Suspense>
  );
}
