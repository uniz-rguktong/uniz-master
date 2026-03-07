"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function CoordinatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white p-4">
      <div className="flex max-w-md flex-col items-center text-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Coordinator Portal Error
          </h1>
          <p className="text-gray-400">
            An error occurred in the dashboard. Please try again.
          </p>
        </div>
        <div className="flex gap-4 pt-4">
          <Button
            variant="default"
            size="default"
            onClick={() => reset()}
            className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white border border-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            size="default"
            className="flex items-center gap-2 border-gray-800 bg-transparent text-white hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            <Link href="/coordinator">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-600 mt-8 font-mono bg-gray-900/50 px-2 py-1 rounded">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
