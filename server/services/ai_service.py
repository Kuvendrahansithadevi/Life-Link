import os
import json
import re
import traceback
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Deterministic Clinical Rule Engine (Failsafe for critical red-flags)
CRITICAL_KEYWORDS = [
    "chest pain", "pain in my heart", "heart pain", "heart attack",
    "difficulty breathing", "shortness of breath", "breathless",
    "unconscious", "stroke", "paralysis", "severe bleeding",
    "heavy bleeding", "head trauma", "sudden numbness", "choking",
    "poison", "snake bite", "electric shock"
]

LOW_KEYWORDS = [
    "mild headache", "small cut", "minor scratch", "tired",
    "mild cold", "runny nose", "slight cough", "sneezing"
]

def rule_based_triage(text: str):
    t = text.lower()
    for kw in CRITICAL_KEYWORDS:
        if kw in t:
            return {
                "urgency": "High",
                "triggerEmergency": True,
                "specialist": "Cardiologist" if ("heart" in t or "chest" in t) else "Emergency Medicine",
                "remedies": [
                    "Call emergency helpline (108) immediately.",
                    "Sit down and rest in a comfortable position; do not exert yourself.",
                    "Loosen any tight clothing around the neck and chest.",
                    "Take slow, steady breaths while waiting for assistance."
                ],
                "precautions": [
                    "Do NOT drive yourself to the hospital.",
                    "Do NOT consume heavy food, caffeinated drinks, or alcohol.",
                    "Avoid sudden movements or panic."
                ],
                "visual_findings": "Identified potential acute distress based on reported symptoms.",
                "guidance": "Severe chest pain or cardiac distress is a medical emergency. Emergency response services should be contacted without delay."
            }
    for kw in LOW_KEYWORDS:
        if kw in t:
            return {
                "urgency": "Low",
                "triggerEmergency": False,
                "specialist": "General Physician",
                "remedies": [
                    "Drink warm fluids and stay well-hydrated.",
                    "Take adequate rest in a well-ventilated room.",
                    "Apply a cold compress if dealing with a mild headache or tension."
                ],
                "precautions": [
                    "Do not take unprescribed antibiotics.",
                    "Seek medical care if symptoms worsen over 48 hours."
                ],
                "visual_findings": "Mild, non-critical symptoms detected.",
                "guidance": "Your symptoms indicate mild discomfort. Rest and home remedies are suggested, but monitor for changes."
            }
    return None

async def analyze_symptoms(text: str, language: str = "en", image_bytes: bytes = None, mime_type: str = "image/jpeg"):
    # 1. Run deterministic check first
    quick_match = rule_based_triage(text)
    if quick_match and not image_bytes:
        return quick_match

    # 2. Call Gemini 3.6 Flash with multimodal capability.
    try:
        client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
        if not client:
            raise ValueError("GEMINI_API_KEY not found in environment.")

        system_instruction = (
            "You are an expert clinical triage emergency AI. "
            "Analyze patient text notes and any attached medical image (rashes, wounds, burns, eyes). "
            "Follow strict triage criteria:\n"
            "- Urgency 'High' and triggerEmergency: true for chest pain, heart issues, acute breathlessness, heavy bleeding, stroke symptoms.\n"
            "- Urgency 'Medium' for persistent vomiting, high fever, deep cuts, visible infections, fractures.\n"
            "- Urgency 'Low' for mild cold, light headaches, minor abrasions.\n"
            "Respond strictly in raw JSON without Markdown formatting using this structure:\n"
            "{\n"
            '  "urgency": "High" | "Medium" | "Low",\n'
            '  "triggerEmergency": true | false,\n'
            '  "specialist": "Specialty Name",\n'
            '  "remedies": ["Actionable first aid 1", "Actionable first aid 2", "Actionable first aid 3"],\n'
            '  "precautions": ["Precaution 1", "Precaution 2"],\n'
            '  "visual_findings": "Description of image observations (or none)",\n'
            '  "guidance": "Brief explanation in the requested language"\n'
            "}"
        )

        contents = []
        if image_bytes:
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
        contents.append(f"Patient reported symptoms: {text}. Target language: {language}")

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json"
            )
        )

        cleaned_text = response.text.strip()
        cleaned_text = re.sub(r"^```json\s*", "", cleaned_text)
        cleaned_text = re.sub(r"\s*```$", "", cleaned_text)
        result = json.loads(cleaned_text)

        # Enforce cardiac rule safety net
        if any(w in text.lower() for w in ["heart", "chest pain"]):
            result["urgency"] = "High"
            result["triggerEmergency"] = True
            result["specialist"] = "Cardiologist"

        return result

    except Exception as e:
        print(f"Gemini API request failed; using explicit safety fallback. Exception: {e}", flush=True)
        print(traceback.format_exc(), flush=True)
        # Return fallback with actionable remedies rather than empty defaults
        if quick_match:
            return quick_match

        return {
            "urgency": "High" if any(w in text.lower() for w in ["heart", "chest", "breath"]) else "Medium",
            "triggerEmergency": True if any(w in text.lower() for w in ["heart", "chest"]) else False,
            "specialist": "Cardiologist" if any(w in text.lower() for w in ["heart", "chest"]) else "General Physician",
            "remedies": [
                "Sit comfortably and avoid any strenuous physical exertion.",
                "Drink water in small sips and take slow deep breaths.",
                "Monitor vitals such as pulse and temperature."
            ],
            "precautions": [
                "Do not ignore recurring or escalating pain.",
                "Avoid heavy meals and self-medication."
            ],
            "visual_findings": "Visual evaluation unavailable in offline fallback mode.",
            "guidance": "Please consult a healthcare professional promptly for evaluation."
        }