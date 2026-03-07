import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white p-4">
      <div className="flex max-w-md flex-col items-center text-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-500/10 border border-gray-500/20">
          <FileQuestion className="h-10 w-10 text-gray-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Page Not Found
          </h1>
          <p className="text-gray-400">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex gap-4 pt-4">
          <Link href="/">
            <Button className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white border border-gray-800 transition-colors">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
