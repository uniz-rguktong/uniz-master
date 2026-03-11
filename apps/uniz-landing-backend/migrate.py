import requests
import time

# --- CONFIGURATION ---
OLD_BASE_URL = "https://college-scraped.vercel.app"
NEW_BASE_URL = "http://localhost:8000" # Update this to your new local or prod URL

DEPARTMENTS = ["CSE", "CIVIL", "ECE", "EEE", "ME", "MATHEMATICS", "PHYSICS", "CHEMISTRY", "IT", "BIOLOGY", "ENGLISH", "LIB", "MANAGEMENT", "PED", "TELUGU", "YOGA"]
INSTITUTE_PAGES = ["aboutrgukt", "campuslife", "edusys", "govcouncil", "rtiinfo", "scst"]
ACADEMIC_PAGES = ["AcademicPrograms", "AcademicCalender", "AcademicRegulations", "curicula"]
NOTIFICATION_TYPES = ["news_updates", "tenders", "careers"]

def migrate_data():
    print("🚀 Starting Migration...")

    # 1. Migrate HOME
    print("🏠 Migrating Home Data...")
    home_data = requests.get(f"{OLD_BASE_URL}/api/home").json()
    requests.post(f"{NEW_BASE_URL}/api/home/", json=home_data)

    # 2. Migrate INSTITUTE PAGES
    for page in INSTITUTE_PAGES:
        print(f"🏛️ Migrating Institute: {page}...")
        data = requests.get(f"{OLD_BASE_URL}/api/institute/{page}").json()
        # We hit the new POST endpoint using the page name as the path param
        requests.post(f"{NEW_BASE_URL}/api/institute/{page}", json=data)

    # 3. Migrate ACADEMIC PAGES
    for page in ACADEMIC_PAGES:
        print(f"🎓 Migrating Academics: {page}...")
        data = requests.get(f"{OLD_BASE_URL}/api/academics/{page}").json()
        requests.post(f"{NEW_BASE_URL}/api/academics/{page}", json=data)

    # 4. Migrate NOTIFICATIONS
    for n_type in NOTIFICATION_TYPES:
        print(f"🔔 Migrating Notifications: {n_type}...")
        # The old API uses query params, our new POST uses query params too
        data = requests.get(f"{OLD_BASE_URL}/api/notifications", params={"type": n_type}).json()
        requests.post(f"{NEW_BASE_URL}/api/notifications/", params={"type": n_type}, json=data)

    # 5. Migrate DEPARTMENTS (Deep Bio Fetch)
    for dept in DEPARTMENTS:
        print(f"👨‍🏫 Migrating Dept: {dept} (Deep Sync)...")
        # Fetching with deep=true to get the full bio details
        data = requests.get(f"{OLD_BASE_URL}/api/departments/{dept}", params={"deep": True}).json()
        requests.post(f"{NEW_BASE_URL}/api/departments/{dept}", json=data)

    print("\n✅ Migration Complete! Your new database is now fully populated.")

if __name__ == "__main__":
    try:
        migrate_data()
    except Exception as e:
        print(f"❌ Migration failed: {e}")