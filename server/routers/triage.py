from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
from services.ai_service import analyze_symptoms
from config.db import db
import math

router = APIRouter(prefix="/api/triage", tags=["AI Triage"])

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("/analyze")
async def analyze_symptom_endpoint(
    text: str = Form(...),
    language: str = Form("en"),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    image_bytes = None
    mime_type = "image/jpeg"

    if image:
        image_bytes = await image.read()
        mime_type = image.content_type or "image/jpeg"

    # AI Triage & Remedy Analysis
    triage_result = await analyze_symptoms(
        text=text,
        language=language,
        image_bytes=image_bytes,
        mime_type=mime_type
    )

    # Automated Specialist Hospital Matching
    matched_hospitals = []
    user_lat = lat or 16.9891
    user_lng = lng or 82.2475

    try:
        specialist = triage_result.get("specialist", "General Physician")
        cursor = db.hospitals.find()
        hospitals = await cursor.to_list(length=100)

        for h in hospitals:
            h_specs = h.get("specialists", [])
            coordinates = h.get("coordinates") or []
            h_lng = coordinates[0] if len(coordinates) >= 2 else h.get("lng")
            h_lat = coordinates[1] if len(coordinates) >= 2 else h.get("lat")
            dist = calculate_distance(user_lat, user_lng, h_lat, h_lng) if h_lat is not None and h_lng is not None else float("inf")

            has_specialist = any(specialist.lower() in s.lower() for s in h_specs)

            matched_hospitals.append({
                "id": str(h.get("_id", h.get("id"))),
                "name": h.get("name", "City Care Hospital"),
                "address": h.get("address", "Nearby"),
                "distance": f"{dist:.1f} km",
                "rating": h.get("rating", 4.5),
                "waitTime": h.get("wait_time", "15 min"),
                "availableNow": h.get("available_now", True),
                "specialists": h_specs,
                "hasSpecialist": has_specialist
            })

        matched_hospitals.sort(key=lambda x: (not x["hasSpecialist"], float(x["distance"].replace(" km", ""))))
    except Exception as err:
        print(f"Hospital matching fallback: {err}")

    triage_result["suggested_hospitals"] = matched_hospitals[:3]
    return triage_result