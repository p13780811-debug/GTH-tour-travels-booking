import google.generativeai as genai
import json
import re
from config import GEMINI_KEY

genai.configure(api_key=GEMINI_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")


def generate_city_batch(cities):

    prompt = f"""
Return ONLY JSON.

Generate luxury travel content for these cities:

{cities}

Format:

[
{{
"name": "City Name",
"description": "Luxury travel description under 120 words",
"seo_title": "Luxury Travel Guide to City",
"seo_description": "SEO meta description under 160 characters"
}}
]

No explanations.
No extra text.
Only JSON.
"""

    response = model.generate_content(prompt)

    text = response.text.strip()

    try:
        # direct parse
        return json.loads(text)

    except:
        try:
            # extract JSON using regex
            json_text = re.search(r"\[.*\]", text, re.DOTALL).group()
            return json.loads(json_text)
        except:
            print("❌ Gemini JSON parse failed")
            return []