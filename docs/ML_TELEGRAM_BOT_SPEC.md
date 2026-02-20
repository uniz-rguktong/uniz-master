# 🤖 UniZ ML Telegram Bot - Technical Specification

Welcome to the UniZ Telegram Bot integration project! This document outlines the architecture, data flow, and API endpoints required for the Python ML Telegram Bot to interact with the UniZ Node.js Microservices.

## 🏗️ Architecture Overview

To maintain strict security and avoid duplicating business logic, the Telegram Bot uses a **Separation of Concerns** architecture:

1.  **UniZ Node.js Backend:** Handles all Database connections, Authentication, PDF generation, and strict Data rules.
2.  **Python ML Service:** Handles the Telegram Webhook, NLP (Natural Language Processing) to parse student intent, and acts as a client calling the Node.js internal APIs.

_(Note: The Python service should **NOT** connect directly to the PostgreSQL database. It must use the internal APIs listed below to ensure data integrity across microservices)._

---

## 🔄 Flow 1: Account Linking (OAUTH-Style)

_We need to securely connect a Telegram `chatId` to a UniZ `studentId`._

1.  **Student Action:** Logs into the UniZ Web Portal and clicks "Link Telegram".
2.  **Node.js Portal:** Generates a secure random 6-digit Link Code (e.g., `839201`) and saves it temporarily in Redis. Displays a button to the student: `t.me/YourUniZBot?start=839201`.
3.  **Bot Action:** The student clicks the link and opens Telegram. The Python bot receives the `/start 839201` command along with the user's Telegram `chatId`.
4.  **Python API Call:** The Python bot sends the `chatId` and `code` to the Node.js API to finalize the link.

### 🔌 API: Finalize Bot Link

_Called by Python when a user sends the `/start <code>` command._

- **Endpoint:** `POST https://api.rguktong.ac.in/api/v1/bot/link`
- **Headers:**
  - `x-internal-secret`: `[YOUR_INTERNAL_BOT_SECRET]` _(Sreecharan will provide this to you)_
- **Body:**
  ```json
  {
    "chatId": "123456789",
    "telegramCode": "839201"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "studentId": "O210008",
    "name": "Sreecharan",
    "message": "Account successfully linked."
  }
  ```
- **Bot Action:** Reply to user: _"Hi Sreecharan! Your UniZ account (O210008) is successfully linked. You can now ask me for your grades, attendance, or outpass status!"_

---

## 🔄 Flow 2: NLP Intent Processing (Data Fetching)

_When a linked student asks the bot a question (e.g., "What is my SEM-1 attendance?")._

1.  **Student Action:** Sends text: _"Show my grades for E2"_ to the bot.
2.  **ML Model:** Parses the text. Identifies:
    - `Intent`: `FETCH_GRADES`
    - `Entity[Semester]`: `E2`
    - `Context`: `chatId = 123456789`
3.  **Python API Call:** The Python bot hits the Node.js internal API requesting the grades for that specific `chatId`.

### 🔌 API 1: Fetch Academic Grades

- **Endpoint:** `GET https://api.rguktong.ac.in/api/v1/bot/academics/grades?chatId=123456789&semesterId=E2`
- **Headers:**
  - `x-internal-secret`: `[YOUR_INTERNAL_BOT_SECRET]`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "studentId": "O210008",
    "semesterId": "E2-SEM-1",
    "sgpa": "9.2",
    "grades": [
      { "subject": "Data Structures", "grade": "O" },
      { "subject": "Operating Systems", "grade": "A" }
    ],
    "downloadLink": "https://api.rguktong.ac.in/api/v1/academics/grades/download/E2-SEM-1"
  }
  ```
- **Bot Action:** Formats the JSON into a beautiful Telegram Markdown message and sends it. Attaches the `downloadLink` as an **Inline Keyboard Button** so the student can download the official PDF directly!

### 🔌 API 2: Fetch Attendance

- **Endpoint:** `GET https://api.rguktong.ac.in/api/v1/bot/academics/attendance?chatId=123456789&semesterId=SEM-1`
- **Headers:**
  - `x-internal-secret`: `[YOUR_INTERNAL_BOT_SECRET]`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "studentId": "O210008",
    "overallPercentage": "86.5",
    "records": [
      {
        "subject": "Data Structures",
        "attended": 40,
        "total": 45,
        "percentage": "88.8"
      }
    ],
    "downloadLink": "https://api.rguktong.ac.in/api/v1/academics/attendance/download/SEM-1"
  }
  ```

### 🔌 API 3: Verify Profile (Who am I talking to?)

_If the ML model needs basic context (Name, Branch, Room No.) to contextualize the chat._

- **Endpoint:** `GET https://api.rguktong.ac.in/api/v1/bot/profile?chatId=123456789`
- **Headers:**
  - `x-internal-secret`: `[YOUR_INTERNAL_BOT_SECRET]`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "name": "Sreecharan",
    "studentId": "O210008",
    "branch": "CSE",
    "isPresentInCampus": true
  }
  ```

---

## 📝 Next Steps for ML Developer:

1.  **Set up the Webhook:** Build the Python Flask/FastAPI server to receive Telegram webhooks.
2.  **Build the NLP:** Train/Configure the LLM (or use regex/intent-matching frameworks like RASA/Dialogflow) to extract `Action` (Grades, Attendance, Identity) and `Entities` (Semester ID).
3.  **Mock the APIs:** While integrating, you can use Mock JSON responses (based on the outputs above) to test your NLP flow until the Node.js endpoints are fully connected.
4.  **Error Handling:** Ensure the bot handles 404 responses (e.g., student not linked, or grades not found) gracefully.

You have all the details needed to start! Happy coding! 🚀
