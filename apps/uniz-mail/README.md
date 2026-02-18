# UniZ Mail Service - Communication Hub

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer-6.x-339933?style=for-the-badge&logo=nodemailer&logoColor=white)

> **UniZ Microservices Ecosystem**
> _Centralized SMTP orchestration for critical system alerts, reports, and security notifications._

## Architecture Overview

The Mail Service acts as the unified communication gateway for all microservices. It abstracts SMTP complexity into a simple internal API, allowing downstream services to trigger email dispatches for OTPs, outpass approvals, and academic report deliveries. It ensures reliable delivery with retry logic and template management.

## Technology Stack

| Layer           | Technology   | Purpose                                           |
| :-------------- | :----------- | :------------------------------------------------ |
| **Runtime**     | `Node.js`    | High-performance asynchronous execution.          |
| **Language**    | `TypeScript` | Type-safe development and documentation.          |
| **Framework**   | `Express.js` | Robust API routing for internal service requests. |
| **Mailer**      | `Nodemailer` | Standard engine for SMTP communication.           |
| **Integration** | `SMTP`       | Primary protocol for external mail delivery.      |

## Getting Started

### Prerequisites

- Node.js 20+
- SMTP Credentials (SES, SendGrid, or local MailDev)

### Local Development

1. **Setup Environment**:
   ```bash
   cp .env.example .env
   npm install
   ```
2. **Run Service**:
   ```bash
   npm run dev
   ```
   The service will be available at `http://localhost:3006`.

### Docker Deployment

Refer to the `infra/core-infra` documentation for orchestrated deployment instructions.

---

<p align="center">
  Corporate Technical Infrastructure - internal Use Only
</p>
