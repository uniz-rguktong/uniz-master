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
    <div className="min-h-screen bg-white font-sans text-neutral-900 pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-6">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-black mb-4">
            Grievance
          </h1>
          <p className="text-neutral-500 font-medium text-lg">
            Submit your grievances and track their status.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl md:rounded-[2.5rem] overflow-hidden border border-neutral-200 shadow-sm">
          <div className="md:flex">
            {/* Form Section */}
            <div className="md:w-2/3 p-6 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-600 text-white rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-black tracking-tight">
                    New Grievance
                  </h3>
                  <p className="text-sm font-medium text-neutral-500">
                    Describe your issue in detail
                  </p>
                </div>
              </div>

              <div className="space-y-6 md:space-y-8">
                {/* Category */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 block ml-1">
                    Category
                  </label>
                  <div className="relative group">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 font-bold text-lg focus:outline-none focus:border-black transition-colors appearance-none"
                    >
                      <option value="Hostel">Hostel</option>
                      <option value="Mess">Mess</option>
                      <option value="Academic">Academic</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-neutral-500"
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
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 block ml-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about your grievance..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 font-bold text-lg focus:outline-none focus:border-black transition-colors min-h-[200px] resize-none"
                  />
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center gap-3 ml-1">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-300 text-black focus:ring-black"
                  />
                  <label
                    htmlFor="anonymous"
                    className="text-sm font-bold text-neutral-700 cursor-pointer select-none"
                  >
                    Submit Anonymously
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 md:pt-8 space-y-4">
                  <Button
                    value={loading ? "Submitting..." : "Submit Grievance"}
                    loading={loading}
                    onclickFunction={handleSubmit}
                  />
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="md:w-1/3 bg-neutral-50 p-6 md:p-12 border-l border-neutral-100 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  Guidelines
                </h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-neutral-200 bg-white text-black font-bold text-xs shrink-0">
                      1
                    </div>
                    <p className="font-medium text-sm text-neutral-600">
                      Be clear and concise about the issue you are facing.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-neutral-200 bg-white text-black font-bold text-xs shrink-0">
                      2
                    </div>
                    <p className="font-medium text-sm text-neutral-600">
                      Provide relevant dates, times, and names if applicable.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-neutral-200 bg-white text-black font-bold text-xs shrink-0">
                      3
                    </div>
                    <p className="font-medium text-sm text-neutral-600">
                      Avoid using abusive or offensive language.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <Send className="h-5 w-5 text-neutral-900 mt-0.5" />
                  <p className="text-xs font-medium text-neutral-600 leading-relaxed">
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
