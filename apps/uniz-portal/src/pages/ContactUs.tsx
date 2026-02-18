
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { ArrowLeft } from "lucide-react";

export default function ContactUs() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
            <h1 className="text-4xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Contact Us</h1>
            <p className="text-slate-500 max-w-md mb-8 font-medium">
                this is contact Us page
            </p>
            <Link to="/">
                <Button variant="outline" className="rounded-none border-2 border-black font-bold uppercase">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Return to Home
                </Button>
            </Link>
        </div>
    );
}
