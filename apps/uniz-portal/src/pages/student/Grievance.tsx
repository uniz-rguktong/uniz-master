import { useState } from "react";
import { Button } from "../../components/Button";
import { toast } from "react-toastify";
import { AlertCircle, Send } from "lucide-react";
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
    myHeaders.append("Authorization", `Bearer ${JSON.parse(token)}`);
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
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-2">
            Grievance
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Submit your grievances and track their status.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl md:rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm">
          <div className="md:flex">
            {/* Form Section */}
            <div className="md:w-2/3 p-6 md:p-8 md:px-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    New Grievance
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    Describe your issue in detail
                  </p>
                </div>
              </div>

              <div className="space-y-6 md:space-y-8">
                {/* Category */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block ml-1">
                    Category
                  </label>
                  <div className="relative group">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-bold text-[15px] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all appearance-none text-slate-900"
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
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block ml-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about your grievance..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-[15px] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all min-h-[160px] resize-none text-slate-900 placeholder:text-slate-300 placeholder:font-normal"
                  />
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center gap-3 ml-1">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                  <label
                    htmlFor="anonymous"
                    className="text-sm font-bold text-slate-700 cursor-pointer select-none"
                  >
                    Submit Anonymously
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 md:pt-4 space-y-4">
                  <Button
                    variant="primary"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3.5 h-auto rounded-xl font-bold shadow-lg shadow-blue-100 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                    value={loading ? "Submitting..." : "Submit Grievance"}
                    loading={loading}
                    onclickFunction={handleSubmit}
                  />
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="md:w-1/3 bg-slate-50/50 p-6 md:p-8 border-l border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  Guidelines
                </h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-200 bg-white text-slate-900 font-bold text-xs shrink-0">
                      1
                    </div>
                    <p className="font-medium text-sm text-slate-600">
                      Be clear and concise about the issue you are facing.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-200 bg-white text-slate-900 font-bold text-xs shrink-0">
                      2
                    </div>
                    <p className="font-medium text-sm text-slate-600">
                      Provide relevant dates, times, and names if applicable.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-200 bg-white text-slate-900 font-bold text-xs shrink-0">
                      3
                    </div>
                    <p className="font-medium text-sm text-slate-600">
                      Avoid using abusive or offensive language.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <Send className="h-5 w-5 text-slate-900 mt-0.5" />
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    Once submitted, your grievance will be reviewed by the
                    administration. You will be notified of any updates.
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
