# UniZ Edge Gateway - High-Performance Routing Infrastructure

![Nginx](https://img.shields.io/badge/Nginx-1.25-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Edge-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Edge-DC382D?style=for-the-badge&logo=redis&logoColor=white)

> **UniZ Microservices Ecosystem**
> _Providing centralized request orchestration, rate limiting, and edge security for the university network._

## Architecture Overview

The UniZ Edge Gateway is the intelligent entry point for the entire platform. In production, it leverages Vercel's Serverless Edge capabilities combined with dedicated Nginx instances on the VPS to provide high-speed request routing. It implements a "Fast-Pass" strategy using Redis to perform instant user suspension checks (<1ms) before forwarding requests to downstream microservices, effectively eliminating database bottlenecks at the entry point.

## Technology Stack

| Layer             | Technology           | Purpose                                                 |
| :---------------- | :------------------- | :------------------------------------------------------ |
| **Proxy**         | `Nginx` (Production) | Robust load balancing and TCP handshake buffering.      |
| **Edge Compute**  | `Vercel / Node.js`   | Dynamic routing and authentication middleware.          |
| **Cache**         | `Redis`              | Global state caching for instant security enforcement.  |
| **Orchestration** | `Docker`             | Consistent containerized routing for local development. |
| **Health**        | `Custom Heartbeat`   | Real-time status monitoring of all downstream nodes.    |

## Key Innovations

- **Fast-Pass Authentication**: Redis-backed middleware that prevents suspended users from accessing APIs with zero database overhead.
- **Dynamic Port Selection**: Seamlessly switches between local container ports (3001-3008) and production Vercel endpoints.
- **Rate Limiting**: Hardened edge policing (20 requests/second per IP) to prevent abuse and brute-force attacks.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Redis Instance

### Local Development

1. **Configure Mode**:
   ```bash
   # From project root
   bash scripts/system/gateway-config.sh local
   ```
2. **Run Service**:
   ```bash
   npm install && npm run dev
   ```
   The gateway will be available at `http://localhost:3000`, routing to local microservices on ports 3001-3008.

### Docker Deployment

Refer to the `infra/core-infra` documentation for information on the Nginx-based Gateway container.

---

<p align="center">
  Corporate Technical Infrastructure - internal Use Only
</p>
