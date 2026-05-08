import os
import re
import time
import asyncio
import logging
import random
import hashlib
from dotenv import load_dotenv

from supabase import create_client, Client

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ==============================
# 🔐 ENV
# ==============================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

logging.basicConfig(level=logging.INFO)

# ==============================
# 🎭 USER AGENT ROTATION
# ==============================

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "Mozilla/5.0 (X11; Linux x86_64)",
]

def ua():
    return random.choice(USER_AGENTS)

# ==============================
# 🧠 SLUG ENGINE (V5)
# ==============================

def slugify(title, rera_id):
    base = re.sub(r"[^a-z0-9]+", "-", (title or "property").lower()).strip("-")
    hash_part = hashlib.sha1((rera_id or str(time.time())).encode()).hexdigest()[:6]
    return f"{base}-{hash_part}"

# ==============================
# 🕵️ DRIVER (ANTI DETECTION V5)
# ==============================

def get_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument(f"user-agent={ua()}")

    driver = webdriver.Chrome(options=options)

    driver.execute_cdp_cmd(
        "Page.addScriptToEvaluateOnNewDocument",
        {"source": "Object.defineProperty(navigator,'webdriver',{get:()=>undefined})"}
    )

    return driver

# ==============================
# ⏳ SAFE TABLE WAIT
# ==============================

def wait_table(driver, timeout=20):
    WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((By.TAG_NAME, "table"))
    )

# ==============================
# 🧼 CLEAN
# ==============================

def clean(x):
    return x.text.strip() if x else None

# ==============================
# 🧠 SCRAPE PAGE
# ==============================

def scrape_page(driver):
    data = []
    rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")

    for r in rows:
        try:
            c = r.find_elements(By.TAG_NAME, "td")
            if len(c) < 4:
                continue

            title = clean(c[0])
            dev = clean(c[1])
            rera = clean(c[2])
            loc = clean(c[3])

            data.append({
                "title": title,
                "developer": dev,
                "rera_id": rera,
                "location": loc,
                "slug": slugify(title, rera),
                "city": "Mumbai",
                "price": None,
                "lat": None,
                "lng": None,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "is_featured": False,
                "boost_expiry": None
            })

        except:
            continue

    return data

# ==============================
# ⏭️ NEXT PAGE SAFE
# ==============================

def next_page(driver):
    try:
        btn = driver.find_element(By.LINK_TEXT, "Next")
        if "disabled" in btn.get_attribute("class").lower():
            return False

        driver.execute_script("arguments[0].click();", btn)
        time.sleep(2)
        wait_table(driver)
        return True

    except:
        return False

# ==============================
# 🚀 MAIN SCRAPER
# ==============================

def scrape_rera():
    driver = get_driver()
    driver.get("https://maharera.mahaonline.gov.in/")

    wait_table(driver)

    all_data = []

    page = 0
    while True:
        page += 1
        logging.info(f"📄 Page {page}")

        all_data.extend(scrape_page(driver))

        if not next_page(driver):
            break

    driver.quit()
    return all_data

# ==============================
# ⚡ BATCH UPSERT
# ==============================

async def push(batch):
    try:
        supabase.table("properties") \
            .upsert(batch, on_conflict="rera_id") \
            .execute()

        logging.info(f"✅ Inserted {len(batch)}")

    except Exception as e:
        logging.error(e)

async def batcher(data, size=50):
    tasks = []
    for i in range(0, len(data), size):
        tasks.append(push(data[i:i+size]))

    await asyncio.gather(*tasks)

# ==============================
# 🚀 RUN ENGINE
# ==============================

async def run():
    logging.info("🔥 GTH PRO V5 STARTED")

    data = scrape_rera()

    logging.info(f"📦 Scraped: {len(data)}")

    await batcher(data)

    logging.info("🏁 DONE")

if __name__ == "__main__":
    asyncio.run(run())