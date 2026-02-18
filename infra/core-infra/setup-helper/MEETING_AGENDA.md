#  Meeting Agenda: UniZ Deployment Requirements

**To:** College Administration  
**From:** [Your Name/Technical Lead]  
**Subject:** Infrastructure & Access Requirements for UniZ "Result Day" Deployment

To ensure the **UniZ** platform successfully handles the projected load of **10,000 concurrent students** on Result Day, we require the following resources and approvals.

---

## 1. 💰 Infrastructure Budget (Monthly Options)

We present two options based on the expected student load:

### **Option A: Full Scale (10,000 Concurrent Users)**

- **Target:** All years checking results simultaneously.
- **Server:** GoDaddy VPS - **4 vCPU / 8 GB RAM** (NVMe SSD).
- **Estimated Cost:** ₹2,500 - ₹3,500 per month.
- **Recommendation:** Highly Safe. Guarantees performance during peak spikes.

### **Option B: Economy Scale (2,000 Concurrent Users)**

- **Target:** Staggered release (e.g., Year-wise slots) or smaller batch exams.
- **Server:** GoDaddy VPS - **2 vCPU / 4 GB RAM**.
- **Estimated Cost:** ₹1,200 - ₹1,800 per month.
- **Trade-off:** We must strictly enforce "Slot-wise" login (e.g., 1st Year at 10 AM, 2nd Year at 11 AM). Users may face slight delays if everyone joins at once.

## 2. Network & Domain Access

To make the platform official and trusted by students:

- **Subdomain Request:** We need a subdomain like `results.rgukt.ac.in` or `uniz.rgukt.ac.in`.
- **DNS Access:** The IT team needs to point an **A Record** for this subdomain to our VPS IP Address.
- **SSL Certificate:** Authorization to generate a free SSL (Let's Encrypt) or provision of an institutional SSL certificate.

## 3. 💾 Data Requirements

To populate the system before launch:

- **Student Database:** A one-time secure dump (Excel/CSV) containing:
  - Student ID / Roll Number
  - Official Email
  - Phone Number (for OTPs)
- **Result Data Format:** Agreement on a standard format for uploading results (e.g., standard Excel template) so the system can parse it automatically.

## 4. Third-Party Services (Operational Costs)

- **Database Hosting (Neon/Postgres):**
  - _Free Tier_ is risky for 10k users.
  - _Request:_ Approval for a **Pro Plan (~$20/mo)** during exam months, or permission to host the database directly on the VPS (saves money, higher maintenance risk).
- **SMS Gateway (For OTPs):**
  - We need a budget for SMS credits (e.g., Fast2SMS or institutional gateway).
  - _Estimate:_ ~0.20 paise per SMS × 10,000 logins = ₹2,000 per event.

## 5. Policy & Governance

- **Uptime Protocol:** Who is the Point of Contact (PoC) if the university internet/power goes down?
- **Pilot Test Permission:** We request to run a "Stress Test" with a single batch (e.g., only 3rd Year students) one week before the main launch to verify stability.
