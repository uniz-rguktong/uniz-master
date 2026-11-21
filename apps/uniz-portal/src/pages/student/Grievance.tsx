import { useState } from "react";
import { toast } from "@/utils/toast-ref";
import { BASE_URL } from "../../api/endpoints";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/Button";
import { portalLabelClass, portalSelectClass, portalTextareaClass } from "@/lib/portal-ui";

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
    <div className="mx-auto max-w-[640px]">
      <PageHeader
        title="Grievance"
        meta="Describe the issue. The administration reviews it and updates you in the portal."
      />
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div>
          <label className={portalLabelClass} htmlFor="grievance-category">
            Category
          </label>
          <select
            id="grievance-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={portalSelectClass}
          >
            <option value="Hostel">Hostel</option>
            <option value="Mess">Mess</option>
            <option value="Academic">Academic</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="grievance-description">
            Description
          </label>
          <textarea
            id="grievance-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide detailed information about your grievance..."
            className={portalTextareaClass}
          />
        </div>
        <label className="flex items-center gap-3 text-dense text-text" htmlFor="anonymous">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-5 w-5 rounded-sm border-border-strong text-navy-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring"
          />
          Submit Anonymously (Identity Protected)
        </label>
        <p className="text-body leading-6 text-text-2">
          Be clear and concise about the issue you are facing. Provide relevant
          dates, times, and names if applicable. Avoid using abusive or offensive
          language. Submission initializes an audit trail. Once submitted, your
          grievance will be reviewed by the administration and status updates will
          be delivered via your portal.
        </p>
        <Button type="submit" className="w-full min-[821px]:w-auto" disabled={loading} isLoading={loading}>
          {loading ? "Processing..." : "Submit Official Grievance"}
        </Button>
      </form>
    </div>
  );
}
