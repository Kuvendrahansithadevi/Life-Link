from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

class TriageRequest(BaseModel):
    text: str
    language: Optional[str] = "en"
    lat: Optional[float] = None
    lng: Optional[float] = None

class HospitalCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    address: str
    specialists: List[str]
    lat: float
    lng: float
    phone: str = ""
    total_beds: int = Field(default=0, ge=0, alias="totalBeds")
    icu_beds: int = Field(default=0, ge=0, alias="icuBeds")
    available_beds: int = Field(default=0, ge=0, alias="availableBeds")
    available_now: bool = Field(default=True, alias="availableNow")
    rating: Optional[float] = 4.5
    wait_time: Optional[str] = Field(default="15 min", alias="waitTime")

class HospitalUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    specialists: Optional[List[str]] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    total_beds: Optional[int] = Field(default=None, ge=0, alias="totalBeds")
    icu_beds: Optional[int] = Field(default=None, ge=0, alias="icuBeds")
    available_beds: Optional[int] = Field(default=None, ge=0, alias="availableBeds")
    available_now: Optional[bool] = Field(default=None, alias="availableNow")
    rating: Optional[float] = None
    wait_time: Optional[str] = Field(default=None, alias="waitTime")

class AppointmentCreate(BaseModel):
    hospital_id: Optional[str] = None
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