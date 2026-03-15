import { Github } from "lucide-react";
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-slate-200 py-8 mt-auto">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-center md:text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-lg tracking-tight">UniZ</span>
              <span className="text-slate-500 text-sm">© {year}</span>
            </div>
            <div className="hidden md:block h-4 w-px bg-slate-200" />
            <span className="text-slate-400 text-sm font-medium">
              Explore and contribute to the campus.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/uniz-rguktong"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                <Github size={18} />
                <span>Contribute on GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
