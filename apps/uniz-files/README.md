# UniZ Files Service - Asset Management Infrastructure

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-Storage-569A31?style=for-the-badge&logo=amazons3&logoColor=white)

> **UniZ Microservices Ecosystem**
> _Secure, high-availability storage and delivery of university assets, student profiles, and academic certificates._

## Architecture Overview

The Files Service is the centralized asset management system for the UniZ ecosystem. It handles secure file uploads, generates presigned URLs for private asset access, and serves public campus media. The service abstracts the underlying storage provider (AWS S3 or compatible) and performs real-time image processing and metadata extraction to optimize delivery for the Portal Frontend.

## Technology Stack

| Layer          | Technology    | Purpose                                       |
| :------------- | :------------ | :-------------------------------------------- |
| **Runtime**    | `Node.js`     | High-performance asynchronous execution.      |
| **Language**   | `TypeScript`  | Type-safe development and documentation.      |
| **Storage**    | `AWS S3 / R2` | Secure object storage for large binary files. |
| **Engine**     | `Multer`      | Efficient multipart/form-data processing.     |
| **Processing** | `Sharp`       | High-speed image resizing and optimization.   |

## Getting Started

### Prerequisites

- Node.js 20+
- S3-compatible Credentials
- Access to the UniZ Gateway

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
   The service will be available at `http://localhost:3005`.

### Docker Deployment

Refer to the `infra/core-infra` documentation for orchestrated deployment instructions.

---

<p align="center">
  Corporate Technical Infrastructure - internal Use Only
</p>
