CITIES_MASTER = [
    {
        "city_id": 1,
        "name": "Kolkata",
        "iata_code": "CCU",
        "tp_location_id": 2754,
        "state": "West Bengal",
        "country": "IN",
        "currency": "INR",
        "is_active": True,
        "luxury_tier": "Premium"
    }, # <-- Yeh comma zaroori hai
    {
        "city_id": 2,
        "name": "Ranchi",
        "iata_code": "IXR",
        "tp_location_id": 3129,
        "state": "Jharkhand",
        "country": "IN",
        "currency": "INR",
        "is_active": True,
        "luxury_tier": "Standard"
    }, # <-- Yeh comma bhi zaroori hai
    {
        "city_id": 3,
        "name": "Dubai",
        "iata_code": "DXB",
        "tp_location_id": 2114,
        "state": "Dubai",
        "country": "UAE",
        "currency": "AED",
        "is_active": True,
        "luxury_tier": "Ultra"
    } # <-- Last wale mein comma lagao ya na lagao, chalta hai
] # <-- Yeh bracket hamesha end mein hona chahiye

def get_city_by_code(code):
    """
    DATA GUARD: Code se city ka pura data nikalna
    """
    for city in CITIES_MASTER:
        if city['iata_code'] == code.upper():
            return city
    return None

def get_all_active_codes():
    """
    ENGINE FEEDER: Saare active IATA codes nikalna engine.py ke liye
    """
    return [city['iata_code'] for city in CITIES_MASTER if city['is_active']]