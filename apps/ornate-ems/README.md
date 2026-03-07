# Branches Dashboard Ornate

A comprehensive Dashboard Application for RGUKT Ongole designed to manage university branch activities, events, sports championships, and student registrations. Built with Next.js and Tailwind CSS.

## Features

### Event Management

- Create & Manage Events: Comprehensive forms for scheduling workshops, hackathons, and competitions.
- Analytics: Visual insights into participation, registration trends, and revenue.
- Timeline & Calendar: Interactive roadmap and calendar views for event scheduling.

### Registration System

- Student Registrations: Centralized management of all student sign-ups.
- Approval Workflow: Robust system for verifying payments (with screenshot support) and checking eligibility requirements.
- Waitlist Management: Automated and manual handling of event waitlists.
- Bulk Operations: Import/Export capabilities for large datasets.

### Sports & Championships

- Tournament Management: Create brackets, schedule matches, and manage teams.
- Live Scoring: Real-time updates for ongoing matches.
- Leaderboards: Automated standings and results tracking for various sports.

### Communication & Media

- Announcements: Broadcast updates and winner announcements.
- Gallery: Showcase event highlights and promo videos.
- Notifications: Configurable alert settings for admins and students.

### Administration

- Access Control: Role-based permissions and security settings.
- Audit Logs: Track admin activities and system changes.
- Profile Management: Personalized admin settings and preferences.

## Tech Stack

- Framework: Next.js 16 (App Router)
- Styling: Tailwind CSS
- Icons: Lucide React
- Fonts: Geist & Geist Mono
- Deployment: Vercel / Netlify ready

## Project Structure

```
src/
├── app/                  # Next.js App Router root
├── components/           # Reusable UI components
│   ├── ui/               # Basic UI primitives (Skeleton, etc.)
│   └── ...               # Feature-specific components (MetricCard, Modal, etc.)
├── views/                # Page components (Dashboard, Events, etc.)
├── hooks/                # Custom React hooks
└── guidelines/           # Project documentation and guidelines
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open your browser:
   Navigate to http://localhost:3000

## Scripts

- npm run dev: Starts the development server.
- npm run build: Builds the application for production.
- npm start: Runs the production build.
- npm run lint: Runs ESLint to check for code quality issues.
- node clean_imports.js: Utility to clean up import paths.

## Contributing

1. Fork the project
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
