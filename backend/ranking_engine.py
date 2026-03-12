def rank_hotels(hotels):

    if not hotels:
        return []

    try:

        hotels_sorted = sorted(
            hotels,
            key=lambda x: x.get("price_from", 999999)
        )

        return hotels_sorted[:5]

    except:

        return hotels[:5]