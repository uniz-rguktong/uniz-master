# UniZ Notification Service - Real-Time Communication Bus

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

> **UniZ Microservices Ecosystem**
> _Asynchronous event processing and real-time alert delivery for mission-critical campus operations._

## Architecture Overview

The Notification Service is the primary event bus and real-time dispatcher for the UniZ platform. It operates as a decoupled worker, listening to events published via Redis by other microservices (e.g., Outpass approvals, Security alerts). It orchestrates multi-channel delivery, including WebSockets for instant browser alerts and transactional emails via the internal Mail Service. This architecture ensures high throughput without blocking core business logic threads.

## Technology Stack

| Layer         | Technology   | Purpose                                                      |
| :------------ | :----------- | :----------------------------------------------------------- |
| **Runtime**   | `Node.js`    | High-performance asynchronous execution.                     |
| **Language**  | `TypeScript` | Type-safe development and documentation.                     |
| **Real-time** | `Socket.io`  | Bi-directional, low-latency communication with the frontend. |
| **Pub/Sub**   | `Redis`      | Resilient message broker for inter-service events.           |
| **Worker**    | `BullMQ`     | (Optional/Roadmap) Reliable job queue for background tasks.  |

## Getting Started

### Prerequisites

- Node.js 20+
- Redis Instance
- Access to the internal Mail Service

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
   The service will start listening for Redis events and WebSocket connections on `http://localhost:3007`.

### Docker Deployment

Refer to the `infra/core-infra` documentation for orchestrated deployment instructions.

---

<p align="center">
  Corporate Technical Infrastructure - internal Use Only
</p>
