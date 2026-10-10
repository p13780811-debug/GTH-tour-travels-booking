import os

import re

import time

import asyncio

import logging

import random

import hashlib

from dotenv import load_dotenv
from rera_collection import collect_pages
from rera_import import insert_registry_batch
from rera_table import parse_table



from supabase import create_client, Client



import undetected_chromedriver as uc

from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException

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
    # Select a table only if its headers identify registry project fields.
    candidates = []
    for table in driver.find_elements(By.TAG_NAME, "table"):
        headers = [cell.text.strip() for cell in table.find_elements(By.CSS_SELECTOR, "thead th")]
        if not headers:
            headers = [cell.text.strip() for cell in table.find_elements(By.CSS_SELECTOR, "tr th")]
        if not headers:
            continue
        try:
            parse_table(headers, [])
        except ValueError:
            continue
        rows = [
            [cell.text.strip() for cell in row.find_elements(By.TAG_NAME, "td")]
            for row in table.find_elements(By.CSS_SELECTOR, "tbody tr")
            if row.find_elements(By.TAG_NAME, "td")
        ]
        candidates.append(parse_table(headers, rows))
    if len(candidates) != 1:
        raise RuntimeError("Expected one supported registry project table")
    return candidates[0]


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



        if "disabled" in (btn.get_attribute("class") or "").lower():

            return False



        previous_rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
        previous_text = tuple(row.text for row in previous_rows)
        driver.execute_script("arguments[0].click();", btn)



        human_delay()



        WebDriverWait(driver, 40).until(
            lambda current: bool(current.find_elements(By.CSS_SELECTOR, "table tbody tr"))
            and tuple(row.text for row in current.find_elements(By.CSS_SELECTOR, "table tbody tr")) != previous_text
        )



        return True



    except NoSuchElementException:
        return False
    except Exception:
        raise RuntimeError("Registry pagination failed; no import performed") from None





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
        if not trigger_search(driver) or not wait_table(driver):
            raise RuntimeError("Registry search did not return a readable table")
        all_data = collect_pages(
            lambda: scrape_page(driver),
            lambda page: next_page(driver, page),
            max_pages=MAX_PAGES,
        )

    except Exception as e:
        logging.error("Registry collection failed; database import skipped")
        raise RuntimeError("Registry collection failed") from None
    finally:
        driver.quit()


    return all_data

# ======================================================

# ⚡ SUPABASE

# ======================================================



async def push(batch):

    if not batch:

        return



    inserted = insert_registry_batch(supabase, batch)
    logging.info("Registry batch: %s inserted, %s already present", inserted, len(batch) - inserted)





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
