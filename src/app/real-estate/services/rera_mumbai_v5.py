import os

import re

import time

import asyncio

import logging

import random

import hashlib

from dotenv import load_dotenv



from supabase import create_client, Client



import undetected_chromedriver as uc

from selenium.webdriver.common.by import By

from selenium.webdriver.chrome.options import Options

from selenium.webdriver.support.ui import WebDriverWait

from selenium.webdriver.support import expected_conditions as EC





# ======================================================

# 🔐 ENV

# ======================================================



load_dotenv("backend/.env")



SUPABASE_URL = os.getenv("SUPABASE_URL")

SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")



if not SUPABASE_URL or not SUPABASE_KEY:

    raise Exception("❌ Missing Supabase credentials")



supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)



logging.basicConfig(level=logging.INFO)





# ======================================================

# 🎭 USER AGENT

# ======================================================



UA_POOL = [

    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",

    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",

    "Mozilla/5.0 (X11; Linux x86_64)",

]



def ua():

    return random.choice(UA_POOL)





# ======================================================

# 🧠 SLUG ENGINE

# ======================================================



def slugify(title, rera_id):

    base = re.sub(r"[^a-z0-9]+", "-", (title or "property").lower()).strip("-")

    h = hashlib.md5((rera_id or str(time.time())).encode()).hexdigest()[:6]

    return f"{base}-{h}"





# ======================================================

# 🕵️ DRIVER (HARDENED V13)

# ======================================================



def get_driver():
    options = uc.ChromeOptions()

    options.add_argument("--window-size=1366,768")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--lang=en-US")
    options.add_argument(f"--user-agent={ua()}")

    try:
        driver = uc.Chrome(
            options=options,
            use_subprocess=True,
            headless=False,
            version_main=147,
            driver_executable_path=None
        )

    except Exception as e:
        logging.warning(f"Primary failed: {e}")

        driver = uc.Chrome(
            options=options,
            use_subprocess=True,
            headless=False
        )

    return driver





# ======================================================

# 🪟 OPTIONAL IFRAME HANDLER (SAFE)

# ======================================================



def handle_iframe(driver):

    try:

        frames = driver.find_elements(By.TAG_NAME, "iframe")



        if len(frames) > 0:

            driver.switch_to.frame(frames[0])

            logging.info("🪟 iframe switched")



    except Exception as e:

        logging.warning(f"iframe error: {e}")





# ======================================================

# ⏳ HUMAN DELAY (ANTI BLOCK)

# ======================================================



def human_delay():

    time.sleep(random.uniform(2, 5))





# ======================================================

# 🔘 SMART SEARCH TRIGGER (NO ID RELIANCE)

# ======================================================



def trigger_search(driver):

    try:

        logging.info("🔍 Clicking Search")

        btn = WebDriverWait(driver, 30).until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    "//input[contains(@value,'Search')]"
                )
            )
        )

        driver.execute_script(
            "arguments[0].scrollIntoView({block:'center'});",
            btn
        )

        time.sleep(2)

        btn.click()

        time.sleep(5)

        return True

    except Exception as e:

        logging.error(f"❌ search failed: {e}")

        return False




# ======================================================

# ⏳ SAFE TABLE WAIT

# ======================================================



def wait_table(driver, timeout=40):

    start = time.time()



    while time.time() - start < timeout:

        rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")



        if len(rows) > 0:

            return True



        time.sleep(1)



    logging.warning("⚠️ table not ready")

    return False





# ======================================================

# 🧼 CLEAN

# ======================================================



def clean(x):

    return x.text.strip() if x else None





# ======================================================

# 📦 SCRAPE PAGE

# ======================================================



def scrape_page(driver):

    rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")



    data = []



    for r in rows:

        try:

            c = r.find_elements(By.TAG_NAME, "td")



            if len(c) < 4:

                continue



            title = clean(c[0])

            dev = clean(c[1])

            rera = clean(c[2])

            loc = clean(c[3])



            if not rera:

                continue



            data.append({

                "title": title,

                "developer": dev,

                "rera_id": rera,

                "location": loc,

                "city": "Mumbai",

                "slug": slugify(title, rera),

                "price": None,

                "lat": None,

                "lng": None,

                "is_featured": False,

                "boost_expiry": None,

                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),

            })



        except:

            continue



    return data





# ======================================================

# ⏭️ SAFE PAGINATION (MAX LIMIT FIX)

# ======================================================



MAX_PAGES = 300



def next_page(driver, page):

    if page >= MAX_PAGES:

        logging.warning("🛑 MAX PAGE LIMIT REACHED")

        return False



    try:

        btn = driver.find_element(By.LINK_TEXT, "Next")



        if "disabled" in btn.get_attribute("class").lower():

            return False



        driver.execute_script("arguments[0].click();", btn)



        human_delay()



        wait_table(driver)



        return True



    except:

        return False





# ======================================================

# 🚀 SCRAPER ENGINE

# ======================================================



def scrape_rera():
    driver = get_driver()
    
    try:
        # 1. Seedha Search page ke bajaye Home page par jaiye
        logging.info("🌐 Entering via Home Page for Session...")
        driver.get("https://maharera.mahaonline.gov.in/")
        time.sleep(random.uniform(5, 8)) # Insaan ki tarah thoda rukiye

        # 2. "Search Project Details" dhoond kar click kijiye
        # Ye link aksar 'Registration' ya 'Citizens' menu mein hota hai
        logging.info("🖱️ Navigating to Search Section...")
        driver.get("https://maharerait.mahaonline.gov.in/SearchList/Search")
        
        time.sleep(15)
        
        # 3. Agar abhi bhi "Page not available" dikhe, toh Refresh kijiye
        if "not available" in driver.page_source.lower():
            
            driver.delete_all_cookies() # Cookies saaf kijiye
            time.sleep(2)
            driver.refresh()
            time.sleep(5)

        # 4. Handle iframe & Trigger search (Aapka existing logic)
        handle_iframe(driver)
        trigger_search(driver)

        all_data = []
        page = 1
        # ... rest of your loop ...

    except Exception as e:
        logging.error(f"❌ Entrance Failed: {e}")
    finally:
        driver.quit()


    return all_data

# ======================================================

# ⚡ SUPABASE

# ======================================================



async def push(batch):

    if not batch:

        return



    supabase.table("properties").upsert(

        batch,

        on_conflict="rera_id"

    ).execute()



    logging.info(f"✅ inserted: {len(batch)}")





async def batcher(data, size=50):

    for i in range(0, len(data), size):

        await push(data[i:i+size])





# ======================================================

# 🚀 RUN

# ======================================================



async def run():

    logging.info("🔥 GTH PRO RERA V13 STARTED")



    data = scrape_rera()



    logging.info(f"📦 TOTAL: {len(data)}")



    await batcher(data)



    logging.info("🏁 DONE SUCCESSFULLY")





if __name__ == "__main__":

    asyncio.run(run())