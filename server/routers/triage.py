from fastapi import APIRouter
from models.schemas import TriageRequest
from services.safety_checker import check_red_flags
from services.ai_service import analyze_symptoms

router = APIRouter(prefix="/api/triage", tags=["AI Triage"])

@router.post("/analyze")
async def triage_endpoint(req: TriageRequest):
    # Step 1: Deterministic Red-flag check (immediate crisis mode bypass)
    if check_red_flags(req.text):
        return {
            "urgency": "High",
            "specialist": "Cardiologist / Emergency Medicine",
            "guidance": "Critical condition symptoms detected. Do not wait for a scheduled appointment — activate Emergency Mode or call 108 immediately.",
            "triggerEmergency": True
        }
    
    # Step 2: LLM analysis
    try:
        data = await analyze_symptoms(req.text, req.language)
        data["triggerEmergency"] = (data.get("urgency") == "High")
        return data
    except Exception as e:
        return {
            "urgency": "Medium",
            "specialist": "General Physician",
            "guidance": "Please consult a clinic or physician nearby.",
            "triggerEmergency": False,
            "error": str(e)
        }