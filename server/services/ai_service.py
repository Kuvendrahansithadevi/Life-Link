import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def analyze_symptoms(symptoms: str, language: str = "en") -> dict:
    prompt = f"""
    You are an emergency healthcare triage assistant (NOT a doctor, not a definitive diagnostic system).
    Target response language: {language}
    Patient Symptoms: "{symptoms}"

    Provide output STRICTLY as a valid JSON object matching this schema:
    {{
        "urgency": "High" | "Medium" | "Low",
        "specialist": "string (e.g., Cardiologist, General Physician, Orthopedic)",
        "guidance": "Calm, concise triage guidance in {language}",
        "action_required": "string"
    }}
    """
    response = client.models.generate_content(
        model="gemini-2.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )
    return json.loads(response.text)