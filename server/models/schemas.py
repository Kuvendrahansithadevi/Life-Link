from datetime import date as calendar_date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
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
    city: str = ""
    specialists: List[str]
    lat: float
    lng: float
    phone: str = ""
    description: str = ""
    conditions: List[str] = Field(default_factory=list)
    specializations: List[str] = Field(default_factory=list)
    treatments: List[dict] = Field(default_factory=list)
    specialist_profiles: List[dict] = Field(default_factory=list)
    total_beds: int = Field(default=0, ge=0, alias="totalBeds")
    icu_beds: int = Field(default=0, ge=0, alias="icuBeds")
    available_beds: int = Field(default=0, ge=0, alias="availableBeds")
    available_now: bool = Field(default=True, alias="availableNow")
    rating: Optional[float] = 4.5
    wait_time: Optional[str] = Field(default="15 min", alias="waitTime")
    staff_email: EmailStr = Field(alias="staffEmail")
    temporary_password: str = Field(alias="temporaryPassword", min_length=1)

class HospitalUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    conditions: Optional[List[str]] = None
    specializations: Optional[List[str]] = None
    treatments: Optional[List[dict]] = None
    specialist_profiles: Optional[List[dict]] = None
    specialists: Optional[List[str]] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    total_beds: Optional[int] = Field(default=None, ge=0, alias="totalBeds")
    icu_beds: Optional[int] = Field(default=None, ge=0, alias="icuBeds")
    available_beds: Optional[int] = Field(default=None, ge=0, alias="availableBeds")
    available_now: Optional[bool] = Field(default=None, alias="availableNow")
    rating: Optional[float] = None
    wait_time: Optional[str] = Field(default=None, alias="waitTime")
    doctor_status: Optional[str] = Field(default=None, alias="doctorStatus")
    available_icu_beds: Optional[int] = Field(default=None, ge=0, alias="availableIcuBeds")

class HospitalBedsUpdate(BaseModel):
    available_beds: int = Field(ge=0, alias="availableBeds")
    icu_beds: int = Field(ge=0, alias="icuBeds")
    wait_time: str = Field(alias="waitTime")

class SpecialistAvailabilityUpdate(BaseModel):
    specialist: str
    on_duty: bool = Field(alias="onDuty")


class ScheduleCreate(BaseModel):
    date: calendar_date
    start_time: str = Field(min_length=5, max_length=5)
    end_time: str = Field(min_length=5, max_length=5)
    slot_duration: int = Field(default=30, ge=5, le=240)
    active: bool = True

    @model_validator(mode="after")
    def validate_schedule(self):
        today = calendar_date.today()
        if self.date < today:
            raise ValueError("Availability date cannot be in the past")
        try:
            start = datetime.strptime(self.start_time, "%H:%M")
            end = datetime.strptime(self.end_time, "%H:%M")
        except ValueError as exc:
            raise ValueError("Start and end time must use HH:MM format") from exc
        if end <= start:
            raise ValueError("End time must be after start time")
        return self


class SpecialistCreate(BaseModel):
    name: str
    specialization: str
    consultation_fee: Optional[float] = Field(default=None, ge=0)
    schedule: List[ScheduleCreate] = Field(min_length=1)


class TreatmentCreate(BaseModel):
    name: str
    description: str = ""
    price: Optional[float] = Field(default=None, ge=0)
    duration: str = ""
    specialization: str = ""

class HospitalBloodRequestCreate(BaseModel):
    blood_group: str = Field(alias="bloodGroup")
    units: int = Field(ge=1, le=3)
    notes: str = ""
    requester_name: str = Field(alias="requesterName")
    requester_phone: str = Field(default="", alias="requesterPhone")

class AppointmentCreate(BaseModel):
    hospital_id: Optional[str] = None
    hospital_name: str
    patient_name: str
    phone: str
    specialist: str
    date: str
    time: str


class DiscoveryBookingCreate(BaseModel):
    user_id: str
    hospital_id: str
    appointment_type: str = Field(pattern="^(specialist|treatment)$")
    specialist_id: Optional[str] = None
    treatment_id: Optional[str] = None
    appointment_date: str
    appointment_time: str
    patient_name: str
    phone: str = Field(min_length=7, max_length=20)
    email: EmailStr
    age: Optional[int] = Field(default=None, ge=0, le=150)
    notes: str = ""


class PaymentVerification(BaseModel):
    booking_id: str
    payment_reference: str

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

class EmergencyContactCreate(BaseModel):
    # NOTE: user_id is intentionally NOT part of this schema.
    # The authenticated user's id is derived server-side from the
    # Authorization token (see routers/emergency.py -> get_current_user_id)
    # and must never be trusted from the request body.
    name: str
    phone: str
    relation: str


class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    relation: Optional[str] = None