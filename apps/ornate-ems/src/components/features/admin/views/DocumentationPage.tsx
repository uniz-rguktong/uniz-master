'use client';
import { useState, useEffect } from 'react';
import {
  Search,
  HelpCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Zap,
  Users,
  Layout,
  Calendar,
  BarChart3,
  PieChart,
  Globe,
  Mail,
  Settings,
  Shield,
  List,
  Image,
  Video,
  Award,
  Download,
  Upload,
  UserPlus,
  QrCode,
  FileBadge,
  Bell,
  Home,
  Clock,
  TrendingUp,
  Megaphone,
  Trophy,
  FileJson,
  Heart
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/ui/skeleton';

export function DocumentationPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);


  const categories = [
    { id: "all", name: "All Topics" },
    { id: "general", name: "Platform Basics" },
    { id: "events", name: "Event Engineering" },
    { id: "participants", name: "Student Lifecycle" },
    { id: "team", name: "Team & Security" },
    { id: "data", name: "Data & Analytics" },
    { id: "marketing", name: "Marketing & Comms" }
  ];

  const docs = [
    // --- Platform Basics ---
    {
      id: 1,
      title: "Dashboard Ecosystem",
      description: "Understand the core layout and real-time telemetry displayed on your home screen.",
      category: "Platform Basics",
      readTime: "2 min",
      icon: Home,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>The Dashboard Ecosystem is designed for high-velocity management. Key features include:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Live Telemetry:</strong> Real-time counts of total events, active members, and registration momentum.</li>
            <li><strong>Visual Insights:</strong> Interactive charts showing registration trends over time and revenue breakdown.</li>
            <li><strong>Flash Feed:</strong> A list of the most recent transactions and student check-ins across all your club's events.</li>
          </ul>
        </div>
      ),
      questions: [
        "How often is the telemetry updated?",
        "Can I customize the charts displayed?",
        "Where does the 'Flash Feed' pull data from?"
      ]
    },

    // --- Event Engineering ---
    {
      id: 3,
      title: "Multi-Step Event Creation",
      description: "From basic details to media assets—how to build professional-grade event pages.",
      category: "Event Engineering",
      readTime: "5 min",
      icon: Zap,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Building an event follows a structured pipeline:</p>
          <ul className="list-disc pl-5 space-y-3">
            <li><strong>Phase 1: Metadata:</strong> Define the name, category, date, and venue.</li>
            <li><strong>Phase 2: Narrative:</strong> Add a detailed description, agenda, and speakers.</li>
            <li><strong>Phase 3: Logic:</strong> Set registration rules, pricing tiers, and attendee capacity.</li>
            <li><strong>Phase 4: Visuals:</strong> Upload high-res posters and embed promo videos.</li>
            <li><strong>Phase 5: Governance:</strong> Review and publish or save as a persistent draft.</li>
          </ul>
        </div>
      ),
      questions: [
        "Can I edit an event after publishing?",
        "What file formats are supported for posters?",
        "How do I set up multiple ticket tiers?"
      ]
    },
    {
      id: 4,
      title: "Managing Drafts & Archive",
      description: "Organize pending events and manage your club's historical event log.",
      category: "Event Engineering",
      readTime: "3 min",
      icon: FileText,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>The 'All Events' page allows you to filter through Ongoing, Upcoming, and Draft events. Use Drafts to collaborate on event details before making them visible to the student body.</p>
        </div>
      ),
      questions: [
        "How long are drafts saved?",
        "Can I restore an archived event?",
        "Who can see the event drafts?"
      ]
    },

    // --- Student Lifecycle ---
    {
      id: 6,
      title: "Total Registration Control",
      description: "Advanced table management—filtering, sorting, and verifying thousands of entries.",
      category: "Student Lifecycle",
      readTime: "6 min",
      icon: Users,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Your registration database is powerful and flexible:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Granular Filtering:</strong> Filter by year, branch, event, or payment status.</li>
            <li><strong>Verification Workflow:</strong> Review payment screenshots and 'Approve' or 'Reject' entries.</li>
            <li><strong>Waitlist Engine:</strong> Automatically handles overflow and allows manual promotion.</li>
          </ul>
        </div>
      ),
      questions: [
        "How do I bulk approve students?",
        "Can I export data for a specific branch only?",
        "What happens if I reject a registration?"
      ]
    },
    {
      id: 7,
      title: "Team & Group Registrations",
      description: "Managing collaborative entries for hackathons and group competitions.",
      category: "Student Lifecycle",
      readTime: "4 min",
      icon: Heart,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>For team-based events, you can view entries grouped by Team Name. Manage team size limits and verify that all members have met registration requirements.</p>
        </div>
      ),
      questions: [
        "What is the maximum team size?",
        "Do all team members need to register individually?",
        "How are team payment screenshots verified?"
      ]
    },
    {
      id: 8,
      title: "QR-Powered Live Attendance",
      description: "Real-time check-ins using the mobile scanner and digital attendance logs.",
      category: "Student Lifecycle",
      readTime: "3 min",
      icon: QrCode,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Transform your event check-ins. Launch the 'Live Attendance' module and scan student QR codes. The system instantly marks them as attended, updating your event conversion rates in real-time.</p>
        </div>
      ),
      questions: [
        "Does the scanner work offline?",
        "Can I manually mark attendance without a QR code?",
        "How do students access their QR codes?"
      ]
    },

    // --- Team & Security ---
    {
      id: 9,
      title: "Role Security & RBAC",
      description: "Defining access levels for Super Admins, entities, and coordinators.",
      category: "Team & Security",
      readTime: "5 min",
      icon: Shield,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Secure your workspace with granular permissions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Super Admin:</strong> Full access to settings and finance.</li>
            <li><strong>Administrative Entity:</strong> Management of events and data.</li>
            <li><strong>Event Coordinator:</strong> Operational access to specific assigned modules.</li>
          </ul>
        </div>
      ),
      questions: [
        "How do I invite a new Super Admin?",
        "Can I create custom roles?",
        "What happens if a coordinator leaves the club?"
      ]
    },
    {
      id: 10,
      title: "Coordinator Management",
      description: "Enrolling new team members and managing their active status.",
      category: "Team & Security",
      readTime: "3 min",
      icon: UserPlus,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Build your core team from the 'Coordinator Management' page. Assign roles, track their last login, and manage their access to your club's data.</p>
        </div>
      ),
      questions: [
        "How many coordinators can I have?",
        "Can coordinators manage their own roles?",
        "Is there a limit on active coordinators?"
      ]
    },

    // --- Data & Analytics ---
    {
      id: 11,
      title: "Bulk Import & Native Export",
      description: "Synchronizing student data via CSV/Excel for external record-keeping.",
      category: "Data & Analytics",
      readTime: "4 min",
      icon: FileJson,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Migrate data seamlessly. Use 'Bulk Import' to bring in historical member lists or use 'Export' to generate detailed registration sheets in Excel format for offline analysis.</p>
        </div>
      ),
      questions: [
        "What is the required CSV format?",
        "Are there limits on number of rows for import?",
        "Can I export data for a specific branch only?"
      ]
    },
    {
      id: 12,
      title: "Deep Event Analytics",
      description: "Analyzing branch-wise participation, peak traffic, and completion rates.",
      category: "Data & Analytics",
      readTime: "7 min",
      icon: TrendingUp,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Beyond basic numbers, get deep insights. See which departments are most active, track peak registration times, and analyze the ROI of your events.</p>
        </div>
      ),
      questions: [
        "Are analytics available for draft events?",
        "Can I compare two different events?",
        "How is the ROI calculated?"
      ]
    },

    // --- Marketing & Comms ---
    {
      id: 13,
      title: "Updates & Student Broadcasts",
      description: "Pushing notifications and email announcements to registered participants.",
      category: "Marketing & Comms",
      readTime: "3 min",
      icon: Megaphone,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Communicate instantly. Use the 'Updates' module to send push notifications or trigger bulk emails to all students registered for a specific event regarding venue changes or timing updates.</p>
        </div>
      ),
      questions: [
        "Is there a limit on push notifications?",
        "Can I schedule broadcast messages?",
        "Do students get email copies of updates?"
      ]
    },
    {
      id: 14,
      title: "Winner Announcements & Socials",
      description: "Official publication of event results and managing your social media reach.",
      category: "Marketing & Comms",
      readTime: "4 min",
      icon: Trophy,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Celebrate excellence. Use the 'Winner Announcements' page to officially crown winners. This data is highlighted in your club's public profile and historical archive.</p>
        </div>
      ),
      questions: [
        "Can I announce multiple winners?",
        "Are winner details public by default?",
        "How do I upload certificate templates?"
      ]
    },
    {
      id: 15,
      title: "Branding: Logo & Promo Video",
      description: "Customizing your club's visual identity and promotional media sets.",
      category: "Marketing & Comms",
      readTime: "3 min",
      icon: Video,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Keep your branding consistent. Upload your official logo and promotional videos that show up on the main student portal. You can manage these globally from the 'Promo Media' settings.</p>
        </div>
      ),
      questions: [
        "What are recommended logo dimensions?",
        "Can I host videos on YouTube?",
        "Does branding affect existing events?"
      ]
    },
    {
      id: 16,
      title: "Admin Profile Hub",
      description: "Managing your personal credentials, profile picture, and session security.",
      category: "Team & Security",
      readTime: "2 min",
      icon: Settings,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Your Admin Profile is your identity on the platform. Keep it updated with your official contact details and a professional profile picture. You can also monitor active sessions to ensure your account security.</p>
        </div>
      ),
      questions: [
        "How do I reset my admin password?",
        "Can I enable two-factor auth?",
        "Where can I see login history?"
      ]
    },
    {
      id: 17,
      title: "Notification Pipeline",
      description: "Staying updated on platform events and configuring your communication alerts.",
      category: "Platform Basics",
      readTime: "3 min",
      icon: Bell,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Never miss a critical update. The Notification Pipeline aggregates system alerts, new registration requests, and coordinator activity. You can customize which notifications you receive via email or push in the Settings panel.</p>
        </div>
      ),
      questions: [
        "Can I toggle specific alert types?",
        "How do I manage push permissions?",
        "Are notifications archived permanently?"
      ]
    },
    {
      id: 18,
      title: "Approval Workflow",
      description: "The official path from raw entry to confirmed event participation.",
      category: "Student Lifecycle",
      readTime: "4 min",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Maintain data integrity. Every registration starts as 'Pending'. Use the Workflow dashboard to verify payment proofs and eligibility before promoting a student to 'Confirmed' status. This ensures no unauthorized entries make it to your event.</p>
        </div>
      ),
      questions: [
        "Can I automate approvals?",
        "What info is needed for payment verification?",
        "Is there a pending approval timeout?"
      ]
    },

    {
      id: 20,
      title: "Interactive FAQ Module",
      description: "Building a self-service knowledge base for your student users.",
      category: "Platform Basics",
      readTime: "3 min",
      icon: HelpCircle,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Reduce support tickets by building a robust FAQ section. Address common queries about event participation, certificate issuance, and registration cycles directly on the main student portal.</p>
        </div>
      ),
      questions: [
        "How do I categorize FAQs?",
        "Can I search within the FAQ module?",
        "Are FAQs visible to non-members?"
      ]
    },
    {
      id: 21,
      title: "Gallery Curation",
      description: "Showcasing event highlights and managing your club's media heritage.",
      category: "Marketing & Comms",
      readTime: "4 min",
      icon: Image,
      content: (
        <div className="space-y-4 text-sm text-[#4B5563]">
          <p>Tell your club's story visually. The Gallery module allows you to curate high-resolution photos and videos from past events, making them accessible to current and prospective members to build a strong legacy.</p>
        </div>
      ),
      questions: [
        "Is there a storage limit for gallery?",
        "Can I create sub-albums?",
        "Who can upload media?"
      ]
    }
  ];

  const filteredDocs = docs.filter(d => {
    const matchesCategory = activeCategory === 'all' || d.category === categories.find(c => c.id === activeCategory)?.name;
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            <h1 className="text-2xl md:text-[28px] font-semibold text-[#1A1A1A] mb-1">Knowledge <span className="text-[#3B82F6]">Hub</span></h1>
            <p className="text-sm text-[#6B7280]">Comprehensive guides for every module in your Club Dashboard.</p>
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
                    className={`px-6 py-2.5 rounded-[16px] text-[13px] font-bold uppercase tracking-wider transition-all duration-300 ${activeCategory === cat.id
                      ? 'bg-[#1A1A1A] text-white shadow-lg'
                      : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-gray-50'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid - Enhanced White Card Background */}
        <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-4 md:p-8 min-h-[600px] shadow-sm">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i: any) => (
                <div key={i} className="border border-[#F3F4F6] rounded-[16px] p-6 bg-[#FAFAFA]/50">
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
                  onClick={() => { setSelectedDoc(doc); setShowModal(true); }}
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
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">No guides found</h3>
              <p className="text-sm text-[#6B7280]">Try adjusting your search or category filter.</p>
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
                <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">{selectedDoc.category}</div>
                <div className="text-sm font-medium text-[#1A1A1A]">{selectedDoc.readTime} read</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1A1A1A] mb-2 uppercase tracking-wide">Overview</h4>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                {selectedDoc.description}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#1A1A1A] mb-2 uppercase tracking-wide">Guide Content</h4>
              <div className="space-y-3 bg-white p-6 rounded-xl border border-gray-100 shadow-inner">
                {selectedDoc.content}
              </div>
            </div>

            {selectedDoc.questions && selectedDoc.questions.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-[#1A1A1A] mb-3 uppercase tracking-wide">Related Questions</h4>
                <div className="space-y-2">
                  {selectedDoc.questions.map((q: any, i: any) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors cursor-default">
                      <HelpCircle className="w-4 h-4 text-[#3B82F6]" />
                      <span className="text-sm text-[#4B5563] font-medium">{q}</span>
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
