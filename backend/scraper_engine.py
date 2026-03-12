import os
import google.generativeai as genai
from dotenv import load_dotenv

# .env.local se key uthana
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(env_path)

genai.configure(api_key=os.getenv("GEMINI_PRO_KEY"))
# FINAL FIXED: Gemini 2.5 Flash
model = genai.GenerativeModel('gemini-2.5-flash')

def get_8k_description(hotel_name):
    print(f"📡 Generating 8k Content for: {hotel_name}")
    prompt = f"GTH Luxury: Write an 8k cinematic description for {hotel_name}. Millionaire style."
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error: {e}"