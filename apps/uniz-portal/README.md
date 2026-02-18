# UniZ Portal - Unified Student & Admin Frontend

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-Analytics-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

> **UniZ Student Success Platform**
> _Providing a seamless, high-performance interface for campus movement, academics, and profile management._

## Architecture Overview

The UniZ Portal is a high-performance Single Page Application (SPA) built using React and Vite. It serves as the primary touchpoint for students, administrative staff, wardens, and security personnel. The application is designed with a mobile-first approach, leveraging Tailwind CSS for responsive styling and Framer Motion for interactive micro-animations. It communicates exclusively with the Edge Gateway to orchestrate requests across the microservices ecosystem.

## Key Features

- **Dynamic Dashboards**: Real-time academic results and attendance visualizations.
- **Workflow Management**: Comprehensive outpass and outing request tracking with multi-role approval visibility.
- **Admin Command Center**: Powerful tools for student management, bulk data ingestion, and system monitoring.
- **Security Protocols**: Integration with border control endpoints for student checkout/checkin.

## Technology Stack

| Layer          | Technology              | Purpose                                                     |
| :------------- | :---------------------- | :---------------------------------------------------------- |
| **Framework**  | `React` + `Vite`        | Fast, modern frontend development and bundling.             |
| **Styling**    | `Tailwind CSS`          | Utility-first CSS for rapid, consistent UI development.     |
| **State**      | `Recoil` / `SWR`        | Management of global state and efficient data fetching.     |
| **Charts**     | `Recharts` / `Chart.js` | Advanced data visualization for academic performance.       |
| **Components** | `Radix UI` / `Lucide`   | Accessible, unstyled primitives and consistent iconography. |

## Getting Started

### Prerequisites

- Node.js 20+
- Access to the UniZ Gateway API

### Local Development

1. **Setup Environment**:
   ```bash
   cp .env.example .env
   npm install
   ```
2. **Run Application**:
   ```bash
   npm run dev
   ```
   Access the portal at `http://localhost:5173`.

---

<p align="center">
  Corporate Technical Infrastructure - internal Use Only
</p>
