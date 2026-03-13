import { useState } from "react";
import { toast } from "react-toastify";
import { Send } from "lucide-react";
import { BASE_URL } from "../../api/endpoints";

export default function Grievance() {
  const [category, setCategory] = useState("Hostel");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!category || !description) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("student_token");

    if (!token) {
      toast.error("Authentication token missing. Please sign in again.");
      setLoading(false);
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append(
      "Authorization",
      `Bearer ${(token || "").replace(/"/g, "")}`,
    );
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      category: category,
      description: description,
      isAnonymous: isAnonymous,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow" as RequestRedirect,
    };

    try {
      const res = await fetch(`${BASE_URL}/grievance/submit`, requestOptions);

      if (res.ok) {
        toast.success("Grievance submitted successfully!");
        setCategory("Hostel");
        setDescription("");
        setIsAnonymous(false);
      } else {
        toast.error("Failed to submit grievance");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while submitting the grievance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-slate-900">
      <div className="max-w-6xl mx-auto px-4 pb-4 md:pb-10">
        <div className="flex flex-col gap-0.5 md:mb-6 mb-2">
          <p className="text-slate-500 font-medium text-[11px] md:text-[13px]">
            Institutional Support Terminal
          </p>
          <h1 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Grievance Redressal System
          </h1>
        </div>

        {/* Main Content */}
        <div className="md:bg-white md:rounded-xl md:overflow-hidden md:border md:border-slate-100 md:shadow-sm bg-transparent">
          <div className="md:flex">
            {/* Form Section */}
            <div className="md:w-2/3 md:p-10 md:border-r border-slate-50 py-2 md:py-6 px-0">
              <div className="md:mb-8 mb-4">
              </div>

              <div className="space-y-3 md:space-y-6">
                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Category
                  </label>
                  <div className="relative group">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 md:py-3.5 font-semibold text-sm md:text-[15px] focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 transition-all appearance-none text-slate-900"
                    >
                      <option value="Hostel">Hostel</option>
                      <option value="Mess">Mess</option>
                      <option value="Academic">Academic</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about your grievance..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-5 font-semibold text-sm md:text-[15px] focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 transition-all h-[100px] md:min-h-[160px] resize-none text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
                  />
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center gap-3 ml-1 bg-slate-50/50 p-2 md:p-3 rounded-xl border border-slate-100/50">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded-md border-slate-300 text-navy-900 focus:ring-navy-900 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                  <label
                    htmlFor="anonymous"
                    className="text-sm font-semibold text-slate-700 cursor-pointer select-none"
                  >
                    Submit Anonymously (Identity Protected)
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="pt-4">
                  <button
                    className="w-full py-3.5 md:py-4 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                    onClick={() => handleSubmit()}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Submit Official Grievance"}
                  </button>
                </div>
              </div>
            </div>

            {/* Info Section - Hidden on Mobile */}
            <div className="hidden md:flex md:w-1/3 bg-slate-50/30 p-8 flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  Official Guidelines
                </h3>

                <div className="space-y-3 md:space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-slate-900 font-bold text-[10px] shrink-0 shadow-sm">
                      01
                    </div>
                    <p className="font-medium text-[13px] text-slate-500 leading-relaxed">
                      Be clear and concise about the issue you are facing.
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-slate-900 font-bold text-[10px] shrink-0 shadow-sm">
                      02
                    </div>
                    <p className="font-medium text-[13px] text-slate-500 leading-relaxed">
                      Provide relevant dates, times, and names if applicable.
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-slate-100 text-slate-900 font-bold text-[10px] shrink-0 shadow-sm">
                      03
                    </div>
                    <p className="font-medium text-[13px] text-slate-500 leading-relaxed">
                      Avoid using abusive or offensive language.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-5 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <Send size={16} className="text-slate-900 mt-0.5" />
                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                    Submission initializes an audit trail. Once submitted, your
                    grievance will be reviewed by the administration and status
                    updates will be delivered via your portal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
