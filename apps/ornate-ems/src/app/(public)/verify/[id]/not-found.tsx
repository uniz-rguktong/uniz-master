import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileWarning, LogIn } from "lucide-react";

export default function VerifyNotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white p-4">
      <div className="flex max-w-md flex-col items-center text-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <FileWarning className="h-10 w-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Invalid Link
          </h1>
          <p className="text-gray-400">
            This verification link is invalid or has expired. Please check the
            URL or request a new link.
          </p>
        </div>
        <div className="flex gap-4 pt-4">
          <Link href="/login">
            <Button className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white border border-gray-800 transition-colors">
              <LogIn className="h-4 w-4" />
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
