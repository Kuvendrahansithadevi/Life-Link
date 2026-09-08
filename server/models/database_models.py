def donor_helper(donor) -> dict:
    return {
        "id": str(donor["_id"]),
        "name": donor["name"],
        "phone": donor["phone"],
        "blood_group": donor["blood_group"],
        "location": donor["location"],
        "distance": donor.get("distance", "Nearby"),
        "last_donated": donor.get("last_donated", "3 months ago")
    }

def hospital_helper(h) -> dict:
    return {
        "id": str(h["_id"]),
        "name": h["name"],
        "phone": h["phone"],
        "address": h["address"],
        "specialists": h["specialists"],
        "available_now": h.get("available_now", True),
        "rating": h.get("rating", 4.2),
        "wait_time": h.get("wait_time", "15 min")
    }