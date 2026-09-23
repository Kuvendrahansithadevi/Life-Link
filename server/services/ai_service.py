import os
import json
import re
import traceback
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

TRIAGE_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "disease_name": {"type": "string", "description": "Potential condition or symptom-based observation, not a definitive diagnosis."},
        "cause": {"type": "string", "description": "Likely cause or explanation."},
        "urgency": {"type": "string", "enum": ["High", "Medium", "Low"]},
        "triggerEmergency": {"type": "boolean"},
        "specialist": {"type": "string"},
        "remedies": {"type": "array", "items": {"type": "string"}},
        "precautions": {"type": "array", "items": {"type": "string"}},
        "visual_findings": {"type": "string"},
        "guidance": {"type": "string"}
    },
    "required": [
        "disease_name", "cause", "urgency", "triggerEmergency", "specialist",
        "remedies", "precautions", "visual_findings", "guidance"
    ]
}

# Deterministic Clinical Rule Engine (Failsafe for critical red-flags)
CRITICAL_KEYWORDS = [
    "chest pain", "pain in my heart", "heart pain", "heart attack",
    "difficulty breathing", "shortness of breath", "breathless",
    "unconscious", "stroke", "paralysis", "severe bleeding",
    "heavy bleeding", "head trauma", "sudden numbness", "choking",
    "poison", "snake bite", "electric shock"
]

LOW_KEYWORDS = [
    "headache", "small cut", "minor scratch", "tired",
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
                "disease_name": "Mild headache" if "headache" in t else "Low-urgency symptom",
                "cause": "Common causes include minor illness, stress, dehydration, or irritation; the cause cannot be confirmed from text alone.",
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

def normalize_triage_result(result: dict, language: str):
    """Keep model output compatible with the fields rendered by the triage UI."""
    normalized = {
        "disease_name": result.get("disease_name") or result.get("predicted_condition") or result.get("condition"),
        "cause": result.get("cause") or result.get("likely_cause"),
        "urgency": result.get("urgency"),
        "triggerEmergency": result.get("triggerEmergency", result.get("trigger_emergency", False)),
        "specialist": result.get("specialist") or "General Physician",
        "remedies": result.get("remedies") or result.get("recommendations") or [],
        "precautions": result.get("precautions") or [],
        "visual_findings": result.get("visual_findings") or "none",
        "guidance": result.get("guidance") or result.get("recommendation") or "Please consult a healthcare professional for evaluation."
    }

    if normalized["urgency"] not in {"High", "Medium", "Low"}:
        raise ValueError(f"Gemini returned invalid urgency: {normalized['urgency']!r}")
    if not normalized["disease_name"] or not normalized["cause"]:
        raise ValueError("Gemini response omitted the condition or likely cause.")
    if not isinstance(normalized["remedies"], list) or not isinstance(normalized["precautions"], list):
        raise ValueError("Gemini response returned non-list recommendations or precautions.")

    normalized["triggerEmergency"] = bool(normalized["triggerEmergency"])
    normalized["remedies"] = [str(item) for item in normalized["remedies"]]
    normalized["precautions"] = [str(item) for item in normalized["precautions"]]
    return normalized

async def analyze_symptoms(text: str, language: str = "en", image_bytes: bytes = None, mime_type: str = "image/jpeg"):
    # 1. Run deterministic check first
    quick_match = rule_based_triage(text)
    if quick_match and not image_bytes:
        return quick_match

    # 2. Call Gemini Flash with multimodal capability.
    try:
        client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
        if not client:
            raise ValueError("GEMINI_API_KEY not found in environment.")

        system_instruction = (
            "You are a cautious clinical triage AI, not a substitute for an in-person clinician. "
            "Analyze patient text notes and any attached medical image. When a patient uploads a skin image "
            "or describes physical marks such as rashes, eczema, ringworm, burns, psoriasis, acne, or similar "
            "skin findings:\n"
            "1. Predict the specific potential disease_name or skin condition. If the image is inconclusive, "
            "say so clearly instead of presenting a definitive diagnosis.\n"
            "2. Explain the cause and how or why this condition typically occurs.\n"
            "3. Assign the correct urgency as Low, Medium, or High.\n"
            "4. Recommend the exact specialist, such as Dermatologist.\n"
            "5. Provide condition-specific remedies and precautions.\n"
            "Follow strict triage criteria:\n"
            "- Urgency 'High' and triggerEmergency: true for chest pain, heart issues, acute breathlessness, heavy bleeding, stroke symptoms.\n"
            "- Urgency 'Medium' for persistent vomiting, high fever, deep cuts, visible infections, fractures.\n"
            "- Urgency 'Low' for mild cold, light headaches, minor abrasions.\n"
            "Respond strictly in raw JSON without Markdown formatting using this structure:\n"
            "{\n"
            '  "disease_name": "Potential condition or symptom-based observation, never a definitive diagnosis",\n'
            '  "cause": "Clear explanation of the likely cause",\n'
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
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json",
                response_schema=TRIAGE_RESPONSE_SCHEMA
            )
        )

        cleaned_text = (response.text or "").strip()
        if not cleaned_text:
            raise ValueError("Gemini returned an empty response.")
        cleaned_text = re.sub(r"^```json\s*", "", cleaned_text)
        cleaned_text = re.sub(r"\s*```$", "", cleaned_text)
        result = normalize_triage_result(json.loads(cleaned_text), language)

        # Enforce cardiac rule safety net
        if any(w in text.lower() for w in ["heart", "chest pain"]):
            result["urgency"] = "High"
            result["triggerEmergency"] = True
            result["specialist"] = "Cardiologist"

        return result

    except Exception as e:
        print(
            f"Gemini API request failed for model {GEMINI_MODEL!r} "
            f"(api key configured: {bool(GEMINI_API_KEY)}); using explicit safety fallback. "
            f"{type(e).__name__}: {e}",
            flush=True
        )
        print(traceback.format_exc(), flush=True)
        # Return fallback with actionable remedies rather than empty defaults
        if quick_match:
            return quick_match

        return {
            "disease_name": "Unable to determine from available information",
            "cause": "A clinical cause cannot be determined safely without a reliable model response and, when relevant, an in-person examination.",
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