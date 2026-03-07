"use client";
import { useState, useEffect } from "react";
import {
  Search,
  HelpCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Zap,
  Users,
  Calendar,
  BarChart3,
  Globe,
  Mail,
  Settings,
  Shield,
  Image,
  Video,
  Download,
  Upload,
  UserPlus,
  Bell,
  Home,
  Clock,
  TrendingUp,
  Megaphone,
  Trophy,
  FileJson,
  Heart,
  HandHeart,
  Banknote,
  ClipboardList,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentationPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const categories = [
    { id: "all", name: "All Topics" },
    { id: "general", name: "Platform Basics" },
    { id: "events", name: "Event Management" },
    { id: "volunteers", name: "Volunteer Ops" },
    { id: "donations", name: "Donations & Funds" },
    { id: "team", name: "Team & Security" },
    { id: "outreach", name: "Outreach & Reports" },
  ];

  const docs = [
    // --- Platform Basics ---
    {
      id: 1,
      title: "HHO Dashboard Overview",
      description:
        "Understanding the core layout and real-time metrics on your organization's home screen.",
      category: "Platform Basics",
      readTime: "2 min",
      icon: Home,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            The HHO Dashboard provides a command center for all organization
            activities:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Live Metrics:</strong> Real-time counts of active
              volunteers, ongoing drives, and total beneficiaries reached.
            </li>
            <li>
              <strong>Impact Charts:</strong> Visual breakdowns of donation
              trends, volunteer hours logged, and event completion rates.
            </li>
            <li>
              <strong>Activity Feed:</strong> A timeline of the most recent
              volunteer check-ins, donation receipts, and event milestones.
            </li>
          </ul>
        </div>
      ),
      questions: [
        "How often are the dashboard metrics refreshed?",
        "Can I customize the widgets displayed?",
        "Where can I see historical performance data?",
      ],
    },
    {
      id: 17,
      title: "Notification Pipeline",
      description:
        "Staying updated on organization events and configuring your communication alerts.",
      category: "Platform Basics",
      readTime: "3 min",
      icon: Bell,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Never miss a critical update. The Notification Pipeline aggregates
            alerts for new volunteer sign-ups, donation confirmations, and event
            status changes. Customize which notifications you receive via email
            or in-app push.
          </p>
        </div>
      ),
      questions: [
        "Can I toggle specific alert types?",
        "How do I manage push permissions?",
        "Are notifications archived permanently?",
      ],
    },

    // --- Event Management ---
    {
      id: 3,
      title: "Creating a Charity Drive",
      description:
        "Step-by-step guide to planning and launching a new community service or fundraising event.",
      category: "Event Management",
      readTime: "5 min",
      icon: Zap,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Building a charity drive follows a structured pipeline:</p>
          <ul className="list-disc pl-5 space-y-3">
            <li>
              <strong>Phase 1: Cause Definition:</strong> Define the cause,
              target beneficiaries, and fundraising goal.
            </li>
            <li>
              <strong>Phase 2: Logistics:</strong> Set dates, assign venues, and
              define volunteer requirements.
            </li>
            <li>
              <strong>Phase 3: Outreach:</strong> Create promotional material,
              upload posters, and share on social media.
            </li>
            <li>
              <strong>Phase 4: Registration:</strong> Open volunteer/participant
              registrations with approval workflows.
            </li>
            <li>
              <strong>Phase 5: Execution:</strong> Track live attendance, manage
              on-ground operations.
            </li>
          </ul>
        </div>
      ),
      questions: [
        "Can I edit an event after publishing?",
        "What file formats are supported for posters?",
        "How do I set a fundraising target?",
      ],
    },
    {
      id: 4,
      title: "Managing Drafts & Archive",
      description:
        "Organize pending events and manage your organization's historical event log.",
      category: "Event Management",
      readTime: "3 min",
      icon: FileText,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            The 'All Events' page allows you to filter through Ongoing,
            Upcoming, and Draft events. Use Drafts to finalize details before
            making drives visible to the volunteer network.
          </p>
        </div>
      ),
      questions: [
        "How long are drafts saved?",
        "Can I restore an archived event?",
        "Who can see the event drafts?",
      ],
    },
    {
      id: 5,
      title: "Event Calendar & Scheduling",
      description:
        "Visual calendar view for planning drives without conflicts.",
      category: "Event Management",
      readTime: "3 min",
      icon: Calendar,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Use the Event Calendar to plan your community drives. It highlights
            blocked dates (exams, university events) and shows overlapping
            drives to prevent volunteer fatigue. Color-coded tags help
            differentiate event types at a glance.
          </p>
        </div>
      ),
      questions: [
        "Can I sync the calendar with Google Calendar?",
        "How do I block dates for university exams?",
        "Is the calendar view shared with volunteers?",
      ],
    },

    // --- Volunteer Ops ---
    {
      id: 6,
      title: "Volunteer Registration & Onboarding",
      description:
        "Managing volunteer sign-ups, verification, and role assignment.",
      category: "Volunteer Ops",
      readTime: "6 min",
      icon: Users,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Your volunteer management system handles the full lifecycle:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Registration:</strong> Volunteers sign up via the portal
              with student ID verification.
            </li>
            <li>
              <strong>Approval:</strong> Review pending applications and approve
              or reject based on eligibility.
            </li>
            <li>
              <strong>Role Assignment:</strong> Assign roles like Team Lead,
              Field Volunteer, or Logistics Coordinator.
            </li>
            <li>
              <strong>Hours Tracking:</strong> Log and verify volunteer hours
              for each event automatically.
            </li>
          </ul>
        </div>
      ),
      questions: [
        "How do I bulk approve volunteer applications?",
        "Can I export the volunteer list by branch?",
        "What happens if I reject a volunteer application?",
      ],
    },
    {
      id: 7,
      title: "Team & Group Management",
      description:
        "Organizing volunteers into teams for field operations and large-scale drives.",
      category: "Volunteer Ops",
      readTime: "4 min",
      icon: Heart,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            For large-scale events, organize volunteers into teams. Each team
            can have a designated Team Lead who coordinates on-ground
            activities, tracks attendance, and reports outcomes back to the
            dashboard.
          </p>
        </div>
      ),
      questions: [
        "What is the maximum team size?",
        "Can a volunteer be in multiple teams?",
        "How are Team Leads chosen?",
      ],
    },
    {
      id: 8,
      title: "Live Attendance Tracking",
      description:
        "Real-time volunteer check-ins using QR scanning and manual logging.",
      category: "Volunteer Ops",
      readTime: "3 min",
      icon: ClipboardList,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Track volunteer attendance in real-time during events. Launch the
            'Live Attendance' module, scan volunteer QR codes, or manually mark
            them. The system instantly updates your event participation rates
            and volunteer hours.
          </p>
        </div>
      ),
      questions: [
        "Does the scanner work offline?",
        "Can I manually mark attendance without a QR code?",
        "How are volunteer hours calculated?",
      ],
    },

    // --- Donations & Funds ---
    {
      id: 19,
      title: "Donation Tracking System",
      description:
        "Recording, verifying, and reporting all monetary and in-kind donations.",
      category: "Donations & Funds",
      readTime: "5 min",
      icon: Banknote,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Maintain complete transparency with your donation records:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Digital Receipts:</strong> Upload screenshots of UPI/bank
              transfers for verification.
            </li>
            <li>
              <strong>Cash Deposits:</strong> Record cash donations with the
              official deposit receipt.
            </li>
            <li>
              <strong>In-Kind Donations:</strong> Log non-monetary contributions
              like food, clothing, or supplies.
            </li>
            <li>
              <strong>Audit Trail:</strong> Every transaction is logged with
              timestamp and approver details.
            </li>
          </ul>
        </div>
      ),
      questions: [
        "How do I verify a cash donation?",
        "Can I generate a donation receipt for donors?",
        "Is there a minimum donation amount?",
      ],
    },
    {
      id: 20,
      title: "Fund Allocation & Budgeting",
      description:
        "Allocating collected funds to specific causes and tracking expenditure.",
      category: "Donations & Funds",
      readTime: "4 min",
      icon: HandHeart,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Ensure every rupee is accounted for. Use the fund allocation module
            to assign budgets to specific drives, track real-time expenditure,
            and generate transparent financial reports for stakeholders.
          </p>
        </div>
      ),
      questions: [
        "How do I create a new budget category?",
        "Can I transfer funds between causes?",
        "Who has access to financial reports?",
      ],
    },

    // --- Team & Security ---
    {
      id: 9,
      title: "Role Security & Access Control",
      description:
        "Defining access levels for admins, coordinators, and volunteers.",
      category: "Team & Security",
      readTime: "5 min",
      icon: Shield,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Secure your HHO workspace with granular permissions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>HHO Admin:</strong> Full access to all settings, finance,
              and volunteer data.
            </li>
            <li>
              <strong>Event Coordinator:</strong> Can create events, manage
              registrations, and track attendance.
            </li>
            <li>
              <strong>Team Lead:</strong> Operational access to their assigned
              team and events only.
            </li>
          </ul>
        </div>
      ),
      questions: [
        "How do I add a new admin?",
        "Can I create custom roles?",
        "What happens if a coordinator graduates?",
      ],
    },
    {
      id: 10,
      title: "Coordinator Management",
      description:
        "Onboarding new team members and managing their active roles.",
      category: "Team & Security",
      readTime: "3 min",
      icon: UserPlus,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Build your core leadership team from the 'Coordinator Management'
            page. Add new members, assign specific responsibilities, track their
            last login, and manage their access to the organization's data and
            modules.
          </p>
        </div>
      ),
      questions: [
        "How many coordinators can we have?",
        "Can coordinators manage their own roles?",
        "Is there an approval process for new coordinators?",
      ],
    },
    {
      id: 16,
      title: "Admin Profile & Security",
      description:
        "Managing your credentials, profile picture, and session security.",
      category: "Team & Security",
      readTime: "2 min",
      icon: Settings,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Your Admin Profile is your identity on the HHO platform. Keep it
            updated with official contact details and a professional profile
            picture. Monitor active sessions to ensure account security.
          </p>
        </div>
      ),
      questions: [
        "How do I reset my admin password?",
        "Can I enable two-factor authentication?",
        "Where can I see login history?",
      ],
    },

    // --- Outreach & Reports ---
    {
      id: 11,
      title: "Bulk Import & Data Export",
      description:
        "Synchronizing volunteer and donor data via CSV/Excel for record-keeping.",
      category: "Outreach & Reports",
      readTime: "4 min",
      icon: FileJson,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Migrate data seamlessly. Use 'Bulk Import' to bring in historical
            volunteer lists or donor records. Use 'Export' to generate detailed
            reports in Excel format for offline analysis or institutional
            submissions.
          </p>
        </div>
      ),
      questions: [
        "What is the required CSV format?",
        "Are there limits on number of rows for import?",
        "Can I export data for a specific event only?",
      ],
    },
    {
      id: 12,
      title: "Impact Analytics & Reports",
      description:
        "Measuring community impact, volunteer engagement, and fundraising milestones.",
      category: "Outreach & Reports",
      readTime: "7 min",
      icon: TrendingUp,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Go beyond basic numbers. Analyze which departments contribute the
            most volunteers, track donation trends over semesters, and measure
            the real-world impact of your community service initiatives.
          </p>
        </div>
      ),
      questions: [
        "Can I compare impact across semesters?",
        "How is volunteer engagement scored?",
        "Can I generate reports for the university?",
      ],
    },
    {
      id: 13,
      title: "Updates & Announcements",
      description:
        "Broadcasting announcements to volunteers and donors about upcoming drives.",
      category: "Outreach & Reports",
      readTime: "3 min",
      icon: Megaphone,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Communicate instantly with your volunteer network. Use the 'Updates'
            module to send push notifications about upcoming drives, venue
            changes, or urgent volunteer requests.
          </p>
        </div>
      ),
      questions: [
        "Is there a limit on push notifications?",
        "Can I schedule broadcast messages?",
        "Do volunteers get email copies of updates?",
      ],
    },
    {
      id: 14,
      title: "Event Outcomes & Recognition",
      description:
        "Publishing drive results and recognizing outstanding volunteers.",
      category: "Outreach & Reports",
      readTime: "4 min",
      icon: Trophy,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Celebrate impact. Use the 'Event Outcomes' feature to publish drive
            results—beneficiaries reached, funds raised, and items distributed.
            Recognize outstanding volunteers publicly through the platform.
          </p>
        </div>
      ),
      questions: [
        "Can I feature multiple outstanding volunteers?",
        "Are results visible on the public portal?",
        "How do I generate volunteer appreciation certificates?",
      ],
    },
    {
      id: 15,
      title: "Branding: Logo & Promo Video",
      description:
        "Customizing your organization's visual identity and promotional media.",
      category: "Outreach & Reports",
      readTime: "3 min",
      icon: Video,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Keep your branding consistent. Upload your official HHO logo and
            promotional videos that appear on event pages and volunteer portals.
            Manage these globally from the 'Promo Media' settings.
          </p>
        </div>
      ),
      questions: [
        "What are recommended logo dimensions?",
        "Can I host videos on YouTube and embed them?",
        "Does branding update affect existing events?",
      ],
    },
    {
      id: 21,
      title: "Gallery & Media Archive",
      description:
        "Showcasing event highlights and managing your organization's media heritage.",
      category: "Outreach & Reports",
      readTime: "4 min",
      icon: Image,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>
            Tell your organization's story visually. The Gallery module lets you
            curate high-resolution photos from community drives, awareness
            campaigns, and team-building events—building a powerful legacy for
            future batches.
          </p>
        </div>
      ),
      questions: [
        "Is there a storage limit for the gallery?",
        "Can I create sub-albums for different drives?",
        "Who can upload media to the gallery?",
      ],
    },
  ];

  const filteredDocs = docs.filter((d) => {
    const matchesCategory =
      activeCategory === "all" ||
      d.category === categories.find((c) => c.id === activeCategory)?.name;
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 animate-page-entrance">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
          <span>Resources</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1A1A] font-medium">Documentation</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-1">
              Knowledge <span className="text-[#3B82F6]">Hub</span>
            </h1>
            <p className="text-sm text-[#6B7280]">
              Comprehensive guides for every module in your HHO Dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="bg-[#F8F9FA] rounded-[24px] p-2 md:p-3 border border-[#E5E7EB]">
        {/* Modern Toolbar */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4 mb-2">
          {/* Search Section */}
          <div className="relative w-full xl:max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[#9CA3AF] group-focus-within:text-[#3B82F6] transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-2xl text-[15px] placeholder-[#9CA3AF] focus:outline-none focus:ring-4 focus:ring-[#3B82F6]/10 focus:border-[#3B82F6] transition-all shadow-sm"
              placeholder="Search across all modules and guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Categories Section */}
          <div className="w-full xl:w-auto overflow-hidden">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide px-1">
              <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[20px] p-1.5 shadow-sm min-w-max">
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-6 py-2.5 rounded-[16px] text-[13px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      activeCategory === cat.id
                        ? "bg-[#1A1A1A] text-white shadow-lg"
                        : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-gray-50"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-4 md:p-8 min-h-[600px] shadow-sm">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i: any) => (
                <div
                  key={i}
                  className="border border-[#F3F4F6] rounded-[16px] p-6 bg-[#FAFAFA]/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton width={44} height={44} borderRadius={12} />
                    <Skeleton width={60} height={18} />
                  </div>
                  <Skeleton width="90%" height={24} className="mb-2" />
                  <Skeleton width="100%" height={16} className="mb-1" />
                  <Skeleton width="100%" height={16} className="mb-1" />
                  <Skeleton width="70%" height={16} className="mb-6" />
                  <div className="flex items-center justify-between">
                    <Skeleton width={60} height={12} />
                    <Skeleton width={32} height={32} borderRadius="50%" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocs.map((doc: any, idx: any) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoc(doc);
                    setShowModal(true);
                  }}
                  className="group border border-[#F3F4F6] rounded-[16px] p-6 hover:shadow-lg hover:border-[#E5E7EB] transition-all duration-300 cursor-pointer bg-[#FAFAFA]/50 hover:bg-white animate-card-entrance flex flex-col h-full"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                      <doc.icon className="w-5 h-5 text-[#1A1A1A]" />
                    </div>
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-[#F3F4F6] px-2 py-1 rounded">
                      {doc.readTime} read
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#1A1A1A] mb-2 leading-tight group-hover:text-[#3B82F6] transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed mb-6 line-clamp-3">
                    {doc.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider bg-gray-100/50 px-2 py-0.5 rounded">
                      {doc.category}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center group-hover:bg-[#1A1A1A] transition-colors">
                      <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-[#F7F8FA] rounded-full flex items-center justify-center mb-4 border border-[#E5E7EB]">
                <HelpCircle className="w-8 h-8 text-[#D1D5DB]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">
                No guides found
              </h3>
              <p className="text-sm text-[#6B7280]">
                Try adjusting your search or category filter.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Article Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedDoc?.title || "Guide Details"}
        tooltipText="Read full documentation guide"
        onConfirm={() => setShowModal(false)}
        confirmText="Close Guide"
      >
        {selectedDoc && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <selectedDoc.icon className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                  {selectedDoc.category}
                </div>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {selectedDoc.readTime} read
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1A1A1A] mb-2 uppercase tracking-wide">
                Overview
              </h4>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                {selectedDoc.description}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1A1A1A] mb-2 uppercase tracking-wide">
                Guide Content
              </h4>
              <div className="space-y-3 bg-white p-6 rounded-xl border border-gray-100 shadow-inner">
                {selectedDoc.content}
              </div>
            </div>

            {selectedDoc.questions && selectedDoc.questions.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-[#1A1A1A] mb-3 uppercase tracking-wide">
                  Related Questions
                </h4>
                <div className="space-y-2">
                  {selectedDoc.questions.map((q: any, i: any) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors cursor-default"
                    >
                      <HelpCircle className="w-4 h-4 text-[#3B82F6]" />
                      <span className="text-sm text-[#4B5563] font-medium">
                        {q}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
