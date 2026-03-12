import os
from dotenv import load_dotenv

# project root
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# load .env.local
env_path = os.path.join(base_dir, ".env.local")
load_dotenv(env_path)

# KEYS
GEMINI_KEY = os.getenv("GEMINI_PRO_KEY")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

TRAVELPAYOUTS_TOKEN = os.getenv("TRAVELPAYOUTS_API_TOKEN")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

print("✅ Config Loaded")