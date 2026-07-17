# UniZ ML Telegram Bot - Technical Specification

## 1. Executive Summary

This document provides the technical requirements for integrating a Python-based Machine Learning (ML) Telegram Bot into the UniZ Microservices framework. The bot serves as an intelligent NLP interface for students to query academic and profile data.

---

## 2. Infrastructure & Data Access

### 2.1 Database Access (PostgreSQL)

The ML Bot is granted read-access to the primary PostgreSQL instance to facilitate complex NLP intent matching and data extraction.

| Parameter       | Configuration                                         |
| :-------------- | :---------------------------------------------------- |
| **Host**        | `uniz-postgres` (Internal) / VPC IP (Production)      |
| **Port**        | `5432`                                                |
| **Database**    | `uniz_db`                                             |
| **Schemas**     | `users`, `academics`, `auth`, `outpass`               |
| **Credentials** | Consult `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`) |

**Connection Requirement:** The bot must utilize the internal Docker network or a secure VPN bridge to reach the database. Use a connection pool (e.g., `SQLAlchemy` or `psycopg2`) for efficient querying.

### 2.2 Internal Secret Authentication

All API communication between the Python Bot and Node.js microservices must be authenticated via a shared internal secret.

- **Header Key**: `x-internal-secret`
- **Header Value**: Stored as `INTERNAL_SECRET` in the vault environment.

---

## 3. Core Integration Workflows

### 3.1 Flow A: Secure Account Linking

Establishes a 1:1 mapping between a Telegram `chatId` and a UniZ `studentId`.

1.  **Verification**: Student retrieves a 6-digit OTP from the UniZ Portal.
2.  **Handshake**: Student sends `/start <OTP>` to the Telegram Bot.
3.  **Finalization**: Bot executes the following internal call:

- **Endpoint**: `POST /api/v1/bot/link`
- **Payload**:
  ```json
  {
    "chatId": "TELEGRAM_CHAT_ID",
    "telegramCode": "6_DIGIT_OTP"
  }
  ```
- **Response**: Returns `studentId` and `name` on success.

### 3.2 Flow B: NLP Data Retrieval

When a user submits a query (e.g., _"What is my current attendance?"_), the ML model extracts intent and parameters to call the relevant internal API.

#### Optimized Internal API Endpoints:

- **Profile Summary**: `GET /api/v1/bot/profile?chatId={id}`
- **Academic Grades**: `GET /api/v1/bot/academics/grades?chatId={id}&semesterId={sem}`
- **Attendance Stats**: `GET /api/v1/bot/academics/attendance?chatId={id}&semesterId={sem}`

---

## 4. Developer Implementation Checklist

1.  **Environment Setup**:
    - Clone `uniz-master`.
    - Retrieve database credentials from `infra/core-infra/.env`.
2.  **Bot Initialization**:
    - Build a Python Flask/FastAPI service.
    - Implement `python-telegram-bot` for webhook/polling management.
3.  **NLP Integration**:
    - Configure LLM or Intent Wrapper (e.g., RASA, LangChain).
    - Map student queries to the database schemas or internal APIs.
4.  **Security**:
    - Ensure `chatId` is validated against the `users.bot_links` table before returning sensitive academic data.
5.  **Output Formatting**:
    - Deliver responses using Telegram MarkdownV2 for premium UI/UX.

---

_UniZ Enterprise Infrastructure - Internal Development Document_
