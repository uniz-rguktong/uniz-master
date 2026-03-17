export type TeamMember = {
    name: string;
    image: string;
    linkedin?: string;
    categories: string[];
    isTeamLead?: boolean;
    securityDetails?: string[];
};

export type TeamSection = {
    id: 'ornate-2k26' | 'ornate-core';
    title: string;
    description: string;
    members: TeamMember[];
};

const R2_BASE_URL = "https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/DevTeam";

export const TEAM_DATA: TeamSection[] = [
    {
        id: 'ornate-2k26',
        title: 'Ornate Main',
        description: 'The creative and technical force behind the 10th Anniversary edition of Ornate.',
        members: [
            { 
                name: "A.V. LEELADHAR", 
                image: `${R2_BASE_URL}/Leeladhar.webp`, 
                categories: ['UI/UX Designing', 'Frontend Engineering'],
                isTeamLead: true,
                securityDetails: ["Product Vision & Experience Strategy", "Solar Navigation UX", "Technical Guidance"],
                linkedin: "#"
            },
            { 
                name: "SK. MAYIF", 
                image: `${R2_BASE_URL}/msk.webp`, 
                categories: ['Full Stack Development'],
                securityDetails: ["Full Stack Architecture", "Real-time Systems", "Deployment"],
                linkedin: "#"
            },
            { 
                name: "M. ARAVIND", 
                image: `${R2_BASE_URL}/Aravind.webp`, 
                categories: ['Backend & Database', 'Production'],
                securityDetails: ["Database Optimization", "Server Management", "Asset Delivery"],
                linkedin: "#"
            },
            { 
                name: "S. RAJASEKHAR", 
                image: `${R2_BASE_URL}/raj.webp`, 
                categories: ['Full Stack Development'],
                securityDetails: ["Cross-platform Integration", "Logical Styling", "Data Mapping"],
                linkedin: "#"
            },
            { 
                name: "N. PAVAN", 
                image: `${R2_BASE_URL}/pavan.webp`, 
                categories: ['Testing & QA', 'Frontend Engineering'],
                securityDetails: ["Quality Assurance", "UI Debugging", "Performance Scaling"],
                linkedin: "#"
            },
            { 
                name: "G. KAVYA", 
                image: `${R2_BASE_URL}/kavya.webp`, 
                categories: ['UI/UX Designing'],
                securityDetails: ["Visual Aesthetics", "Cosmos Design", "Wireframing"],
                linkedin: "#"
            },
            { 
                name: "G.V. SAI KUMAR", 
                image: `${R2_BASE_URL}/saikumar.webp`, 
                categories: ['Frontend Engineering'],
                securityDetails: ["Responsive Layouts", "Animation Timing", "State Handling"],
                linkedin: "#"
            },
            { 
                name: "A. CHAITANYA", 
                image: `${R2_BASE_URL}/chaitanya.webp`, 
                categories: ['Frontend Engineering'],
                securityDetails: ["Interface Logic", "Component Design", "Client-side Tuning"],
                linkedin: "#"
            },
        ],
    },
    {
        id: 'ornate-core',
        title: 'Ornate EMS',
        description: 'The Event Management System powering the underlying infrastructure of the fest for administrators.',
        members: [
            { 
                name: "A.V. LEELADHAR", 
                image: `${R2_BASE_URL}/Leeladhar.webp`, 
                categories: ['UI/UX Designing', 'Frontend Engineering'],
                isTeamLead: true,
                securityDetails: ["System Oversight", "Admin UX Flow", "Global Architecture"],
                linkedin: "#"
            },
            { 
                name: "SK. MAYIF", 
                image: `${R2_BASE_URL}/msk.webp`, 
                categories: ['Full Stack Development'],
                securityDetails: ["Core API Design", "Admin Permissions", "Socket Layers"],
                linkedin: "#"
            },
            { 
                name: "M. ARAVIND", 
                image: `${R2_BASE_URL}/Aravind.webp`, 
                categories: ['Backend & Database', 'Production'],
                securityDetails: ["Data Persistence", "Batch Jobs", "Resource Scaling"],
                linkedin: "#"
            },
            { 
                name: "S. RAJASEKHAR", 
                image: `${R2_BASE_URL}/raj.webp`, 
                categories: ['Full Stack Development'],
                securityDetails: ["System Logic", "Query Handling", "Module Sync"],
                linkedin: "#"
            },
            { 
                name: "N. PAVAN", 
                image: `${R2_BASE_URL}/pavan.webp`, 
                categories: ['Testing & QA', 'Frontend Engineering'],
                securityDetails: ["Boundary Testing", "Security Audits", "Integration Checks"],
                linkedin: "#"
            },
            { 
                name: "G. KAVYA", 
                image: `${R2_BASE_URL}/kavya.webp`, 
                categories: ['UI/UX Designing'],
                securityDetails: ["Consistency Checks", "Dashboard Aesthetics"],
                linkedin: "#"
            },
            { 
                name: "G.V. SAI KUMAR", 
                image: `${R2_BASE_URL}/saikumar.webp`, 
                categories: ['Frontend Engineering'],
                securityDetails: ["Form Handling", "Validation Layers"],
                linkedin: "#"
            },
            { 
                name: "A. CHAITANYA", 
                image: `${R2_BASE_URL}/chaitanya.webp`, 
                categories: ['Frontend Engineering'],
                securityDetails: ["UI Elements", "Admin Navigation"],
                linkedin: "#"
            },
            { 
                name: "P.V. PADMA", 
                image: `${R2_BASE_URL}/padma.webp`, 
                categories: ['UI/UX Designing'],
                securityDetails: ["User Persona Mapping", "Asset Refinement"],
                linkedin: "#"
            },
            { 
                name: "M. MOHAN", 
                image: `${R2_BASE_URL}/mohan.webp`, 
                categories: ['Frontend Engineering'],
                securityDetails: ["Component Logic", "Visual Polish"],
                linkedin: "#"
            },
            { 
                name: "K. UDAY SAI SRIKAR", 
                image: `${R2_BASE_URL}/srikar.webp`, 
                categories: ['Testing & QA'],
                securityDetails: ["Edge Case Detection", "System Stress Tests"],
                linkedin: "#"
            },
        ],
    },
];
