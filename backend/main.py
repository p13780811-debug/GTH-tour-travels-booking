from cities import cities
from ai_engine import generate_blog


def run_gth_engine():

    print("🚀 GTH AI Engine Started\n")

    for city in cities:

        print(f"🌍 Generating content for {city}\n")

        blog = generate_blog(city, [], [])

        print(blog[:800])


if __name__ == "__main__":
    run_gth_engine()