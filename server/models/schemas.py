from pydantic import BaseModel, Field
from typing import List, Optional

class TriageRequest(BaseModel):
    text: str
    language: Optional[str] = "en"

class HospitalCreate(BaseModel):
    name: str
    phone: str
    address: str
    specialists: List[str]
    lat: float
    lng: float
    available_now: bool = True
    rating: Optional[float] = 4.5
    wait_time: Optional[str] = "15 min"

class AppointmentCreate(BaseModel):
    hospital_name: str
    patient_name: str
    phone: str
    specialist: str
    date: str
    time: str

class DonorRegister(BaseModel):
    name: str
    phone: str
    blood_group: str
    location: str
    lat: float
    lng: float

class BloodRequest(BaseModel):
    blood_group: str
    location: str
    quantity: int = Field(default=1, le=3, ge=1, description="Quantity must be less than or equal to 3 units")
    notes: Optional[str] = ""
    
class EmergencyAlert(BaseModel):
    lat: float
    lng: float
    message: Optional[str] = "Emergency assistance needed"