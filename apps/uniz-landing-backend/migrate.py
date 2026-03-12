import requests
import sys
from config import settings


OLD_BASE_URL = "https://college-scraped.vercel.app"
NEW_BASE_URL = "http://localhost:8000"


TOKEN = settings.DUMMY_TOKEN


HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

DEPARTMENTS = ["CSE", "CIVIL", "ECE", "EEE", "ME", "MATHEMATICS", "PHYSICS", "CHEMISTRY", "IT", "BIOLOGY", "ENGLISH", "LIB", "MANAGEMENT", "PED", "TELUGU", "YOGA"]
INSTITUTE_PAGES = ["aboutrgukt", "campuslife", "edusys", "govcouncil", "rtiinfo", "scst"]
ACADEMIC_PAGES = ["AcademicPrograms", "AcademicCalender", "AcademicRegulations", "curicula"]
NOTIFICATION_TYPES = ["news_updates", "tenders", "careers"]

def migrate_data():
    if TOKEN == "your_fresh_jwt_token_here":
        print("❌ Please update the TOKEN variable at the top of the script first!")
        sys.exit(1)

    print("🚀 Starting Authenticated Migration...")

    # 1. Migrate HOME (Trailing slash included)
    print("🏠 Migrating Home Data...")
    home_data = requests.get(f"{OLD_BASE_URL}/api/home").json()
    resp = requests.post(f"{NEW_BASE_URL}/api/home/", json=home_data, headers=HEADERS)
    print(f"   Status: {resp.status_code}")

    # 2. Migrate INSTITUTE PAGES
    for page in INSTITUTE_PAGES:
        print(f"🏛️ Migrating Institute: {page}...")
        data = requests.get(f"{OLD_BASE_URL}/api/institute/{page}").json()
        resp = requests.post(f"{NEW_BASE_URL}/api/institute/{page}", json=data, headers=HEADERS)
        print(f"   Status: {resp.status_code}")

    # 3. Migrate ACADEMIC PAGES
    for page in ACADEMIC_PAGES:
        print(f"🎓 Migrating Academics: {page}...")
        data = requests.get(f"{OLD_BASE_URL}/api/academics/{page}").json()
        resp = requests.post(f"{NEW_BASE_URL}/api/academics/{page}", json=data, headers=HEADERS)
        print(f"   Status: {resp.status_code}")

    # 4. Migrate NOTIFICATIONS (Trailing slash included)
    for n_type in NOTIFICATION_TYPES:
        print(f"🔔 Migrating Notifications: {n_type}...")
        data = requests.get(f"{OLD_BASE_URL}/api/notifications", params={"type": n_type}).json()
        resp = requests.post(f"{NEW_BASE_URL}/api/notifications/", params={"type": n_type}, json=data, headers=HEADERS)
        print(f"   Status: {resp.status_code}")

    # 5. Migrate DEPARTMENTS (Deep Sync)
    for dept in DEPARTMENTS:
        print(f"👨‍🏫 Migrating Dept: {dept} (Deep Sync)...")
        data = requests.get(f"{OLD_BASE_URL}/api/departments/{dept}", params={"deep": True}).json()
        resp = requests.post(f"{NEW_BASE_URL}/api/departments/{dept}", json=data, headers=HEADERS)
        print(f"   Status: {resp.status_code}")

    print("\n✅ Migration Complete! Your database is fully populated and secured.")

if __name__ == "__main__":
    try:
        migrate_data()
    except Exception as e:
        print(f"❌ Migration failed: {e}")