from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from bson import ObjectId
import secrets
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app
app = FastAPI(title="Camp Baraisa Management System")

# Create routers
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== MODELS ====================

class AdminBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "admin"

class AdminCreate(AdminBase):
    password: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminResponse(AdminBase):
    id: str
    is_approved: bool
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminResponse

# Combined Camper Model (includes parent info - no separate parents)
class CamperBase(BaseModel):
    # ===== CAMPER INFO =====
    first_name: str
    last_name: str
    date_of_birth: Optional[str] = None
    # Address
    address: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    # Yeshiva Info
    yeshiva: Optional[str] = None
    yeshiva_other: Optional[str] = None
    grade: Optional[str] = None
    menahel: Optional[str] = None
    rebbe_name: Optional[str] = None
    rebbe_phone: Optional[str] = None
    previous_yeshiva: Optional[str] = None
    # Camp History
    camp_2024: Optional[str] = None
    camp_2023: Optional[str] = None
    # Photo
    photo_url: Optional[str] = None
    # Medical
    allergies: Optional[str] = None
    medical_info: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    medications: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_phone: Optional[str] = None
    insurance_company: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    # Waivers
    rules_agreed: bool = False
    rules_signature: Optional[str] = None
    waiver_agreed: bool = False
    waiver_signature: Optional[str] = None
    # Due Date & Notes
    due_date: Optional[str] = None
    notes: Optional[str] = None
    
    # ===== PARENT/FAMILY INFO (embedded) =====
    parent_email: Optional[EmailStr] = None
    # Father Info
    father_title: Optional[str] = None
    father_first_name: Optional[str] = None
    father_last_name: Optional[str] = None
    father_cell: Optional[str] = None
    father_work_phone: Optional[str] = None
    father_occupation: Optional[str] = None
    # Mother Info
    mother_title: Optional[str] = None
    mother_first_name: Optional[str] = None
    mother_last_name: Optional[str] = None
    mother_cell: Optional[str] = None
    mother_work_phone: Optional[str] = None
    mother_occupation: Optional[str] = None
    # Home Contact
    home_phone: Optional[str] = None
    
    # ===== BILLING INFO (embedded) =====
    total_balance: float = 0.0
    total_paid: float = 0.0
    payment_plan: Optional[str] = None  # none, monthly, custom
    payment_plan_details: Optional[str] = None
    
    # ===== GROUPS/ROOMS =====
    room_id: Optional[str] = None
    room_name: Optional[str] = None
    groups: List[str] = []  # List of group IDs
    
    # ===== PORTAL ACCESS =====
    portal_token: Optional[str] = None

class CamperCreate(CamperBase):
    pass

class CamperResponse(CamperBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    status: str
    created_at: datetime

# Keep ParentBase for backwards compatibility but mark as deprecated
class ParentBase(BaseModel):
    email: EmailStr
    father_title: Optional[str] = None
    father_first_name: Optional[str] = None
    father_last_name: Optional[str] = None
    father_cell: Optional[str] = None
    mother_first_name: Optional[str] = None
    mother_last_name: Optional[str] = None
    mother_cell: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

class ParentCreate(ParentBase):
    pass

class ParentResponse(ParentBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    access_token: str
    created_at: datetime
    total_balance: float = 0.0
    total_paid: float = 0.0

# Invoice now links directly to camper
class InvoiceBase(BaseModel):
    camper_id: str
    amount: float
    description: str
    due_date: Optional[str] = None
    reminder_sent_dates: List[str] = []  # Track when reminders were sent

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceResponse(InvoiceBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    status: str
    created_at: datetime
    paid_amount: float = 0.0
    next_reminder_date: Optional[str] = None

class PaymentBase(BaseModel):
    invoice_id: str
    camper_id: Optional[str] = None
    amount: float
    method: str  # stripe, check, zelle, cash, internal
    include_fee: bool = True  # Whether 3.5% fee was included
    fee_amount: float = 0.0
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    status: str
    created_at: datetime
    stripe_session_id: Optional[str] = None

class CommunicationBase(BaseModel):
    camper_id: str  # Changed from parent_id - now linked to camper
    type: str  # email, sms
    subject: Optional[str] = None
    message: str
    direction: str  # inbound, outbound
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None

class CommunicationCreate(CommunicationBase):
    pass

class CommunicationResponse(CommunicationBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    status: str
    created_at: datetime

class RoomBase(BaseModel):
    name: str
    capacity: int
    building: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    assigned_campers: List[str] = []

# Groups Model (for shiurim, trips, transportation, etc.)
class GroupBase(BaseModel):
    name: str
    type: str  # shiur, transportation, trip, room, custom
    capacity: Optional[int] = None
    description: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class GroupResponse(GroupBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    assigned_campers: List[str] = []
    created_at: Optional[datetime] = None

# Activity Log Model
class ActivityLogBase(BaseModel):
    entity_type: str  # camper, parent, invoice
    entity_id: str
    action: str  # status_changed, note_added, email_sent, etc.
    details: Optional[Dict[str, Any]] = None
    performed_by: Optional[str] = None  # admin id

class ActivityLogCreate(ActivityLogBase):
    pass

class ActivityLogResponse(ActivityLogBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: datetime

class ExpenseBase(BaseModel):
    category: str
    amount: float
    description: str
    date: str
    vendor: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: datetime

class EmailTemplateBase(BaseModel):
    name: str
    subject: str
    body: str
    trigger: Optional[str] = None
    template_type: str = "email"  # email or sms

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplateResponse(EmailTemplateBase):
    model_config = ConfigDict(extra="ignore")
    id: str

# Available merge fields for templates
TEMPLATE_MERGE_FIELDS = {
    "parent": [
        {"field": "{{parent_father_title}}", "label": "Father Title (Rabbi, Mr, etc.)"},
        {"field": "{{parent_father_first_name}}", "label": "Father First Name"},
        {"field": "{{parent_father_last_name}}", "label": "Father Last Name"},
        {"field": "{{parent_father_cell}}", "label": "Father Cell Phone"},
        {"field": "{{parent_mother_first_name}}", "label": "Mother First Name"},
        {"field": "{{parent_mother_last_name}}", "label": "Mother Last Name"},
        {"field": "{{parent_mother_cell}}", "label": "Mother Cell Phone"},
        {"field": "{{parent_email}}", "label": "Parent Email"},
        {"field": "{{parent_address}}", "label": "Parent Address"},
    ],
    "camper": [
        {"field": "{{camper_first_name}}", "label": "Camper First Name"},
        {"field": "{{camper_last_name}}", "label": "Camper Last Name"},
        {"field": "{{camper_full_name}}", "label": "Camper Full Name"},
        {"field": "{{camper_grade}}", "label": "Camper Grade"},
        {"field": "{{camper_yeshiva}}", "label": "Camper Yeshiva"},
        {"field": "{{camper_status}}", "label": "Camper Status"},
    ],
    "billing": [
        {"field": "{{amount_due}}", "label": "Amount Due"},
        {"field": "{{total_balance}}", "label": "Total Balance"},
        {"field": "{{due_date}}", "label": "Payment Due Date"},
        {"field": "{{payment_link}}", "label": "Payment Portal Link"},
    ],
    "camp": [
        {"field": "{{camp_name}}", "label": "Camp Name"},
        {"field": "{{camp_email}}", "label": "Camp Email"},
        {"field": "{{camp_phone}}", "label": "Camp Phone"},
    ]
}

# Default templates to seed
DEFAULT_TEMPLATES = [
    {
        "name": "Acceptance Letter",
        "subject": "Welcome to {{camp_name}} - {{camper_first_name}} Has Been Accepted!",
        "body": """Dear {{parent_father_title}} and Mrs. {{parent_father_last_name}},

We are thrilled to inform you that {{camper_first_name}} {{camper_last_name}} has been accepted to {{camp_name}} for the upcoming summer!

We can't wait to have {{camper_first_name}} join us for The Ultimate Bein Hazmanim Experience.

To secure your spot, please submit your deposit by visiting your Parent Portal:
{{payment_link}}

If you have any questions, please don't hesitate to reach out.

Best regards,
{{camp_name}} Team
{{camp_email}}""",
        "trigger": "status_accepted",
        "template_type": "email"
    },
    {
        "name": "Payment Reminder",
        "subject": "Payment Reminder - {{amount_due}} Due for {{camper_first_name}}",
        "body": """Dear {{parent_father_title}} {{parent_father_last_name}},

This is a friendly reminder that you have a payment of {{amount_due}} due for {{camper_first_name}}'s enrollment at {{camp_name}}.

Due Date: {{due_date}}

You can make your payment easily through your Parent Portal:
{{payment_link}}

If you have already sent payment, please disregard this message.

Thank you,
{{camp_name}}""",
        "trigger": "payment_reminder",
        "template_type": "email"
    },
    {
        "name": "Payment Received - Full",
        "subject": "Payment Confirmed - {{camper_first_name}} is Fully Enrolled!",
        "body": """Dear {{parent_father_title}} and Mrs. {{parent_father_last_name}},

Great news! We have received your full payment for {{camper_first_name}} {{camper_last_name}}.

{{camper_first_name}} is now fully enrolled for this summer at {{camp_name}}!

We will be sending more information about camp preparations closer to the start date.

Thank you for choosing {{camp_name}}!

Best regards,
{{camp_name}} Team""",
        "trigger": "status_paid_in_full",
        "template_type": "email"
    },
    {
        "name": "SMS - Acceptance",
        "subject": "",
        "body": "{{camp_name}}: Great news! {{camper_first_name}} has been accepted! Visit your portal to complete enrollment: {{payment_link}}",
        "trigger": "status_accepted",
        "template_type": "sms"
    },
    {
        "name": "SMS - Payment Reminder",
        "subject": "",
        "body": "{{camp_name}} Reminder: {{amount_due}} due by {{due_date}} for {{camper_first_name}}. Pay now: {{payment_link}}",
        "trigger": "payment_reminder",
        "template_type": "sms"
    }
]

class SettingsBase(BaseModel):
    camp_name: str = "Camp Baraisa"
    camp_email: Optional[str] = None
    camp_phone: Optional[str] = None
    quickbooks_sync: bool = False
    twilio_enabled: bool = False
    gmail_enabled: bool = False

class SettingsResponse(SettingsBase):
    model_config = ConfigDict(extra="ignore")
    id: str

# Kanban statuses
KANBAN_STATUSES = [
    "Applied",
    "Accepted",
    "Check/Unknown",
    "Invoice Sent",
    "Payment Plan - Request",
    "Payment Plan Running",
    "Sending Check",
    "Partial Paid",
    "Partial Paid & Committed",
    "Paid in Full"
]

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(admin_id: str, email: str) -> str:
    payload = {
        "sub": admin_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin = await db.admins.find_one({"id": payload["sub"]}, {"_id": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        if not admin.get("is_approved"):
            raise HTTPException(status_code=403, detail="Admin not approved")
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=AdminResponse)
async def register_admin(data: AdminCreate):
    existing = await db.admins.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if this is the first admin (auto-approve)
    admin_count = await db.admins.count_documents({})
    is_first_admin = admin_count == 0
    
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "name": data.name,
        "role": data.role,
        "password_hash": hash_password(data.password),
        "is_approved": is_first_admin,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin_doc)
    
    return AdminResponse(
        id=admin_doc["id"],
        email=admin_doc["email"],
        name=admin_doc["name"],
        role=admin_doc["role"],
        is_approved=admin_doc["is_approved"],
        created_at=datetime.fromisoformat(admin_doc["created_at"])
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login_admin(data: AdminLogin):
    admin = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not admin.get("is_approved"):
        raise HTTPException(status_code=403, detail="Account pending approval")
    
    token = create_token(admin["id"], admin["email"])
    
    return TokenResponse(
        access_token=token,
        admin=AdminResponse(
            id=admin["id"],
            email=admin["email"],
            name=admin["name"],
            role=admin["role"],
            is_approved=admin["is_approved"],
            created_at=datetime.fromisoformat(admin["created_at"])
        )
    )

@api_router.get("/auth/me", response_model=AdminResponse)
async def get_current_admin_info(admin=Depends(get_current_admin)):
    return AdminResponse(
        id=admin["id"],
        email=admin["email"],
        name=admin["name"],
        role=admin["role"],
        is_approved=admin["is_approved"],
        created_at=datetime.fromisoformat(admin["created_at"])
    )

@api_router.get("/auth/pending", response_model=List[AdminResponse])
async def get_pending_admins(admin=Depends(get_current_admin)):
    pending = await db.admins.find({"is_approved": False}, {"_id": 0, "password_hash": 0}).to_list(100)
    return [AdminResponse(
        id=a["id"],
        email=a["email"],
        name=a["name"],
        role=a["role"],
        is_approved=a["is_approved"],
        created_at=datetime.fromisoformat(a["created_at"])
    ) for a in pending]

@api_router.post("/auth/approve/{admin_id}")
async def approve_admin(admin_id: str, admin=Depends(get_current_admin)):
    result = await db.admins.update_one(
        {"id": admin_id},
        {"$set": {"is_approved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"message": "Admin approved successfully"}

@api_router.post("/auth/deny/{admin_id}")
async def deny_admin(admin_id: str, admin=Depends(get_current_admin)):
    """Deny and delete pending admin"""
    result = await db.admins.delete_one({"id": admin_id, "is_approved": False})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pending admin not found")
    return {"message": "Admin denied and removed"}

# ==================== ADMIN MANAGEMENT ====================

@api_router.get("/admins")
async def get_all_admins(admin=Depends(get_current_admin)):
    """Get all admins (approved and pending)"""
    admins = await db.admins.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    for a in admins:
        a["created_at"] = datetime.fromisoformat(a["created_at"]) if isinstance(a["created_at"], str) else a["created_at"]
    return admins

class AdminCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "admin"
    phone: Optional[str] = None

@api_router.post("/admins")
async def create_admin(data: AdminCreate, admin=Depends(get_current_admin)):
    """Create a new admin (from main admin account)"""
    # Check if email exists
    existing = await db.admins.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    admin_doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email,
        "password_hash": bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode(),
        "role": data.role,
        "phone": data.phone,
        "is_approved": True,  # Auto-approve when created by admin
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin_doc)
    
    return {"message": "Admin created successfully", "id": admin_doc["id"]}

class AdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_approved: Optional[bool] = None

@api_router.put("/admins/{admin_id}")
async def update_admin(admin_id: str, data: AdminUpdate, admin=Depends(get_current_admin)):
    """Update admin details"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.admins.update_one({"id": admin_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return {"message": "Admin updated successfully"}

@api_router.delete("/admins/{admin_id}")
async def delete_admin(admin_id: str, admin=Depends(get_current_admin)):
    """Delete an admin"""
    if admin_id == admin.get("id"):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.admins.delete_one({"id": admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return {"message": "Admin deleted successfully"}

# ==================== ACCOUNT SETTINGS ====================

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

@api_router.put("/account")
async def update_account(data: AccountUpdate, admin=Depends(get_current_admin)):
    """Update current user's account settings"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    # Check if email is being changed and if it's already taken
    if data.email and data.email != admin.get("email"):
        existing = await db.admins.find_one({"email": data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    await db.admins.update_one({"id": admin["id"]}, {"$set": update_data})
    
    return {"message": "Account updated successfully"}

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@api_router.put("/account/password")
async def change_password(data: PasswordChange, admin=Depends(get_current_admin)):
    """Change current user's password"""
    # Get full admin record with password
    admin_full = await db.admins.find_one({"id": admin["id"]})
    if not admin_full:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Verify current password
    if not bcrypt.checkpw(data.current_password.encode(), admin_full["password_hash"].encode()):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_hash = bcrypt.hashpw(data.new_password.encode(), bcrypt.gensalt()).decode()
    await db.admins.update_one({"id": admin["id"]}, {"$set": {"password_hash": new_hash}})
    
    return {"message": "Password changed successfully"}

# ==================== GLOBAL SEARCH ====================

@api_router.get("/search")
async def global_search(q: str = Query(..., min_length=2), admin=Depends(get_current_admin)):
    """Search across all campers (unified model - includes parent info)"""
    search_query = q.lower()
    
    # Search campers (which now includes parent info)
    campers = await db.campers.find({}, {"_id": 0}).to_list(1000)
    matching_campers = []
    for c in campers:
        # Search in camper name, yeshiva, grade, parent info, email, phone
        searchable = f"{c.get('first_name', '')} {c.get('last_name', '')} {c.get('yeshiva', '')} {c.get('grade', '')} {c.get('father_first_name', '')} {c.get('father_last_name', '')} {c.get('mother_first_name', '')} {c.get('mother_last_name', '')} {c.get('parent_email', '')} {c.get('father_cell', '')} {c.get('mother_cell', '')}".lower()
        if search_query in searchable:
            # Build parent display name
            parent_name = f"{c.get('father_first_name', '')} {c.get('father_last_name', '')}".strip()
            if not parent_name:
                parent_name = f"{c.get('mother_first_name', '')} {c.get('mother_last_name', '')}".strip()
            
            matching_campers.append({
                "id": c["id"],
                "first_name": c.get("first_name"),
                "last_name": c.get("last_name"),
                "grade": c.get("grade"),
                "yeshiva": c.get("yeshiva"),
                "status": c.get("status"),
                "photo_url": c.get("photo_url"),
                "parent_name": parent_name,
                "parent_email": c.get("parent_email"),
                "parent_phone": c.get("father_cell") or c.get("mother_cell"),
                "portal_token": c.get("portal_token")
            })
    
    return {
        "campers": matching_campers[:30]  # Limit results
    }

# ==================== PARENT ROUTES (DEPRECATED - Use Campers) ====================
# These endpoints are kept for backwards compatibility but parent data is now embedded in campers

@api_router.get("/parents")
async def get_parents(admin=Depends(get_current_admin)):
    """Deprecated: Returns unique parent info extracted from campers for backwards compatibility"""
    campers = await db.campers.find({}, {"_id": 0}).to_list(1000)
    
    # Extract unique parent info from campers based on parent_email
    parents_map = {}
    for c in campers:
        email = c.get("parent_email")
        if email and email not in parents_map:
            parents_map[email] = {
                "id": c["id"],  # Use camper ID as parent ID for backwards compat
                "email": email,
                "father_title": c.get("father_title"),
                "father_first_name": c.get("father_first_name"),
                "father_last_name": c.get("father_last_name"),
                "father_cell": c.get("father_cell"),
                "mother_first_name": c.get("mother_first_name"),
                "mother_last_name": c.get("mother_last_name"),
                "mother_cell": c.get("mother_cell"),
                "first_name": c.get("father_first_name"),
                "last_name": c.get("father_last_name"),
                "phone": c.get("father_cell") or c.get("mother_cell"),
                "address": c.get("address"),
                "city": c.get("city"),
                "state": c.get("state"),
                "zip_code": c.get("zip_code"),
                "access_token": c.get("portal_token"),
                "total_balance": c.get("total_balance", 0),
                "total_paid": c.get("total_paid", 0),
                "created_at": c.get("created_at")
            }
    
    return list(parents_map.values())

# ==================== PUBLIC APPLICATION ENDPOINT ====================

class ApplicationSubmission(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    parent_email: str
    father_first_name: str
    father_last_name: str
    father_cell: str
    mother_first_name: Optional[str] = None
    mother_last_name: Optional[str] = None
    mother_cell: Optional[str] = None
    yeshiva: Optional[str] = None
    yeshiva_other: Optional[str] = None
    grade: Optional[str] = None
    menahel: Optional[str] = None
    rebbe_name: Optional[str] = None
    rebbe_phone: Optional[str] = None
    previous_yeshiva: Optional[str] = None
    camp_2024: Optional[str] = None
    camp_2023: Optional[str] = None
    emergency_contact_name: str
    emergency_contact_phone: str
    emergency_contact_relationship: str
    medical_info: Optional[str] = None
    allergies: Optional[str] = None

@api_router.post("/applications")
async def submit_application(data: ApplicationSubmission):
    """Public endpoint for parents to submit camper applications (no auth required)"""
    # Generate unique portal token
    clean_name = ''.join(c for c in data.last_name.lower() if c.isalnum())
    portal_token = f"{clean_name}-{secrets.token_urlsafe(8)}"
    
    camper_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "portal_token": portal_token,
        "status": "Applied",
        "total_balance": 0.0,
        "total_paid": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.campers.insert_one(camper_doc)
    
    # Log the activity
    await log_activity(
        entity_type="camper",
        entity_id=camper_doc["id"],
        action="camper_created",
        details={"source": "public_application"},
        performed_by=None  # Public submission
    )
    
    return {"message": "Application submitted successfully", "id": camper_doc["id"]}

# ==================== CAMPER ROUTES (Combined with Parent data) ====================

def generate_portal_url(last_name: str) -> str:
    """Generate unique portal URL: lastname + random string"""
    clean_name = ''.join(c for c in last_name.lower() if c.isalnum())
    random_suffix = secrets.token_urlsafe(8)
    return f"{clean_name}-{random_suffix}"

@api_router.post("/campers", response_model=CamperResponse)
async def create_camper(data: CamperCreate, admin=Depends(get_current_admin)):
    # Generate unique portal token based on last name
    portal_token = generate_portal_url(data.last_name)
    
    camper_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "Applied",
        "portal_token": portal_token,
        "groups": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.campers.insert_one(camper_doc)
    camper_doc.pop("_id", None)
    camper_doc["created_at"] = datetime.fromisoformat(camper_doc["created_at"])
    
    # Log activity
    await log_activity(
        entity_type="camper",
        entity_id=camper_doc["id"],
        action="created",
        details={"name": f"{data.first_name} {data.last_name}"},
        performed_by=admin.get("id")
    )
    
    return CamperResponse(**camper_doc)

@api_router.get("/campers", response_model=List[CamperResponse])
async def get_campers(
    grade: Optional[str] = None,
    yeshiva: Optional[str] = None,
    status: Optional[str] = None,
    admin=Depends(get_current_admin)
):
    query = {}
    if grade:
        query["grade"] = grade
    if yeshiva:
        query["yeshiva"] = yeshiva
    if status:
        query["status"] = status
    
    campers = await db.campers.find(query, {"_id": 0}).to_list(1000)
    for c in campers:
        c["created_at"] = datetime.fromisoformat(c["created_at"])
    return [CamperResponse(**c) for c in campers]

@api_router.get("/campers/{camper_id}", response_model=CamperResponse)
async def get_camper(camper_id: str, admin=Depends(get_current_admin)):
    camper = await db.campers.find_one({"id": camper_id}, {"_id": 0})
    if not camper:
        raise HTTPException(status_code=404, detail="Camper not found")
    camper["created_at"] = datetime.fromisoformat(camper["created_at"])
    return CamperResponse(**camper)

@api_router.put("/campers/{camper_id}", response_model=CamperResponse)
async def update_camper(camper_id: str, data: CamperBase, admin=Depends(get_current_admin)):
    result = await db.campers.update_one(
        {"id": camper_id},
        {"$set": data.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Camper not found")
    return await get_camper(camper_id, admin)

@api_router.put("/campers/{camper_id}/status")
async def update_camper_status(
    camper_id: str, 
    status: str = Query(...), 
    skip_email: bool = Query(False),
    admin=Depends(get_current_admin)
):
    if status not in KANBAN_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {KANBAN_STATUSES}")
    
    camper = await db.campers.find_one({"id": camper_id}, {"_id": 0})
    if not camper:
        raise HTTPException(status_code=404, detail="Camper not found")
    
    old_status = camper.get("status")
    await db.campers.update_one({"id": camper_id}, {"$set": {"status": status}})
    
    # Log the activity
    await log_activity(
        entity_type="camper",
        entity_id=camper_id,
        action="status_changed",
        details={"old_status": old_status, "new_status": status},
        performed_by=admin.get("id")
    )
    
    # Map status to trigger name
    status_trigger_map = {
        "Accepted": "status_accepted",
        "Paid in Full": "status_paid_in_full",
        "Invoice Sent": "invoice_sent"
    }
    
    email_triggered = False
    email_content = None
    
    # Check if there's a template for this status change
    if status in status_trigger_map and old_status != status and not skip_email:
        trigger_name = status_trigger_map[status]
        template = await db.email_templates.find_one({"trigger": trigger_name}, {"_id": 0})
        
        if template:
            # Render template with camper data
            subject = template.get("subject", "")
            body = template.get("body", "")
            
            # Replace merge fields
            merge_data = {
                "camper_first_name": camper.get("first_name", ""),
                "camper_last_name": camper.get("last_name", ""),
                "camper_full_name": f"{camper.get('first_name', '')} {camper.get('last_name', '')}",
                "parent_father_first_name": camper.get("father_first_name", ""),
                "parent_father_last_name": camper.get("father_last_name", ""),
                "parent_email": camper.get("parent_email", ""),
                "parent_father_cell": camper.get("father_cell", ""),
                "status": status
            }
            
            for key, value in merge_data.items():
                subject = subject.replace("{{" + key + "}}", str(value))
                body = body.replace("{{" + key + "}}", str(value))
            
            comm_doc = {
                "id": str(uuid.uuid4()),
                "camper_id": camper_id,
                "type": template.get("template_type", "email"),
                "subject": subject,
                "message": body,
                "direction": "outbound",
                "status": "pending",
                "recipient_email": camper.get("parent_email"),
                "recipient_phone": camper.get("father_cell") or camper.get("mother_cell"),
                "template_id": template.get("id"),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.communications.insert_one(comm_doc)
            
            await log_activity(
                entity_type="camper",
                entity_id=camper_id,
                action="email_queued",
                details={"type": trigger_name, "email_id": comm_doc["id"], "template_name": template.get("name")},
                performed_by=admin.get("id")
            )
            
            email_triggered = True
            email_content = {"subject": subject, "body": body}
    
    return {
        "message": f"Status updated to {status}", 
        "email_triggered": email_triggered,
        "email_content": email_content
    }

# Get email preview for status change (used by confirmation popup)
@api_router.get("/campers/{camper_id}/email-preview")
async def get_status_email_preview(
    camper_id: str, 
    new_status: str = Query(...),
    admin=Depends(get_current_admin)
):
    """Get preview of email that would be sent for a status change"""
    camper = await db.campers.find_one({"id": camper_id}, {"_id": 0})
    if not camper:
        raise HTTPException(status_code=404, detail="Camper not found")
    
    status_trigger_map = {
        "Accepted": "status_accepted",
        "Paid in Full": "status_paid_in_full",
        "Invoice Sent": "invoice_sent"
    }
    
    if new_status not in status_trigger_map:
        return {"has_template": False, "subject": "", "body": ""}
    
    trigger_name = status_trigger_map[new_status]
    template = await db.email_templates.find_one({"trigger": trigger_name}, {"_id": 0})
    
    if not template:
        return {"has_template": False, "subject": "", "body": ""}
    
    # Render template with camper data
    subject = template.get("subject", "")
    body = template.get("body", "")
    
    merge_data = {
        "camper_first_name": camper.get("first_name", ""),
        "camper_last_name": camper.get("last_name", ""),
        "camper_full_name": f"{camper.get('first_name', '')} {camper.get('last_name', '')}",
        "parent_father_first_name": camper.get("father_first_name", ""),
        "parent_father_last_name": camper.get("father_last_name", ""),
        "parent_email": camper.get("parent_email", ""),
        "parent_father_cell": camper.get("father_cell", ""),
        "status": new_status
    }
    
    for key, value in merge_data.items():
        subject = subject.replace("{{" + key + "}}", str(value))
        body = body.replace("{{" + key + "}}", str(value))
    
    return {
        "has_template": True,
        "template_name": template.get("name", ""),
        "template_type": template.get("template_type", "email"),
        "subject": subject,
        "body": body,
        "recipient_email": camper.get("parent_email"),
        "recipient_phone": camper.get("father_cell") or camper.get("mother_cell")
    }

@api_router.delete("/campers/{camper_id}")
async def delete_camper(camper_id: str, admin=Depends(get_current_admin)):
    """Soft delete - move to trash"""
    camper = await db.campers.find_one({"id": camper_id}, {"_id": 0})
    if not camper:
        raise HTTPException(status_code=404, detail="Camper not found")
    
    # Move to trash collection
    camper["deleted_at"] = datetime.now(timezone.utc).isoformat()
    camper["deleted_by"] = admin.get("id")
    await db.campers_trash.insert_one(camper)
    
    # Remove from campers
    await db.campers.delete_one({"id": camper_id})
    
    # Log activity
    await log_activity(
        entity_type="camper",
        entity_id=camper_id,
        action="camper_deleted",
        details={"camper_name": f"{camper.get('first_name')} {camper.get('last_name')}"},
        performed_by=admin.get("id")
    )
    
    return {"message": "Camper moved to trash"}

@api_router.get("/campers/trash/list")
async def get_trash(admin=Depends(get_current_admin)):
    """Get all campers in trash"""
    trash = await db.campers_trash.find({}, {"_id": 0}).sort("deleted_at", -1).to_list(1000)
    return trash

@api_router.post("/campers/trash/{camper_id}/restore")
async def restore_camper(camper_id: str, admin=Depends(get_current_admin)):
    """Restore camper from trash"""
    camper = await db.campers_trash.find_one({"id": camper_id}, {"_id": 0})
    if not camper:
        raise HTTPException(status_code=404, detail="Camper not found in trash")
    
    # Remove trash metadata
    camper.pop("deleted_at", None)
    camper.pop("deleted_by", None)
    
    # Restore to campers
    await db.campers.insert_one(camper)
    await db.campers_trash.delete_one({"id": camper_id})
    
    # Log activity
    await log_activity(
        entity_type="camper",
        entity_id=camper_id,
        action="camper_restored",
        details={"camper_name": f"{camper.get('first_name')} {camper.get('last_name')}"},
        performed_by=admin.get("id")
    )
    
    return {"message": "Camper restored"}

@api_router.delete("/campers/trash/{camper_id}/permanent")
async def permanent_delete_camper(camper_id: str, admin=Depends(get_current_admin)):
    """Permanently delete camper from trash"""
    result = await db.campers_trash.delete_one({"id": camper_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Camper not found in trash")
    return {"message": "Camper permanently deleted"}

# ==================== FEES ROUTES ====================

class FeeCreate(BaseModel):
    name: str
    amount: float
    description: Optional[str] = None

@api_router.get("/fees")
async def get_fees(admin=Depends(get_current_admin)):
    """Get all fees"""
    fees = await db.fees.find({}, {"_id": 0}).to_list(100)
    # Add default camp fee if not exists
    if not any(f.get("is_default") for f in fees):
        default_fee = {
            "id": "camp_fee_default",
            "name": "Camp Fee",
            "amount": 3475,
            "description": "Summer 2026 Camp Fee",
            "is_default": True
        }
        fees.insert(0, default_fee)
    return fees

@api_router.post("/fees")
async def create_fee(data: FeeCreate, admin=Depends(get_current_admin)):
    """Create a new fee"""
    fee_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "is_default": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.fees.insert_one(fee_doc)
    return {"message": "Fee created", "id": fee_doc["id"]}

@api_router.delete("/fees/{fee_id}")
async def delete_fee(fee_id: str, admin=Depends(get_current_admin)):
    """Delete a fee"""
    result = await db.fees.delete_one({"id": fee_id, "is_default": {"$ne": True}})
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Cannot delete default fee or fee not found")
    return {"message": "Fee deleted"}

# ==================== KANBAN ROUTES ====================

@api_router.get("/kanban")
async def get_kanban_board(admin=Depends(get_current_admin)):
    campers = await db.campers.find({}, {"_id": 0}).to_list(1000)
    
    # Get invoice info for balance calculation
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    
    board = {status: [] for status in KANBAN_STATUSES}
    
    for camper in campers:
        # Calculate balance from invoices
        camper_invoices = [i for i in invoices if i.get("camper_id") == camper["id"]]
        total_due = sum(i.get("amount", 0) for i in camper_invoices)
        total_paid = sum(i.get("paid_amount", 0) for i in camper_invoices)
        balance = total_due - total_paid
        
        # Use embedded parent info from camper
        parent_name = f"{camper.get('father_title', '')} {camper.get('father_first_name', '')} {camper.get('father_last_name', '')}".strip()
        if not parent_name or parent_name == "":
            parent_name = f"{camper.get('mother_first_name', '')} {camper.get('mother_last_name', '')}".strip()
        
        camper_data = {
            **camper,
            "parent_name": parent_name,
            "parent_email": camper.get("parent_email", ""),
            "parent_phone": camper.get("father_cell") or camper.get("mother_cell") or "",
            "balance": balance
        }
        status = camper.get("status", "Applied")
        if status in board:
            board[status].append(camper_data)
    
    return {"statuses": KANBAN_STATUSES, "board": board}

# ==================== INVOICE ROUTES ====================

# Invoice reminder schedule: every 15 days, on due date, +3, +7, +15 days after
REMINDER_SCHEDULE = {
    "pre_due": [15, 30, 45, 60, 75, 90],  # Days before due date
    "on_due": 0,  # On due date
    "post_due": [3, 7, 15]  # Days after due date
}

def calculate_next_reminder(due_date_str: str, reminder_sent_dates: List[str]) -> Optional[str]:
    """Calculate when the next reminder should be sent"""
    if not due_date_str:
        return None
    
    try:
        due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
    except:
        return None
    
    today = datetime.now(timezone.utc).date()
    days_until_due = (due_date - today).days
    
    # Check pre-due reminders (every 15 days before)
    for days_before in sorted(REMINDER_SCHEDULE["pre_due"], reverse=True):
        reminder_date = due_date - timedelta(days=days_before)
        if reminder_date >= today and reminder_date.isoformat() not in reminder_sent_dates:
            return reminder_date.isoformat()
    
    # Check due date reminder
    if due_date >= today and due_date.isoformat() not in reminder_sent_dates:
        return due_date.isoformat()
    
    # Check post-due reminders
    for days_after in REMINDER_SCHEDULE["post_due"]:
        reminder_date = due_date + timedelta(days=days_after)
        if reminder_date >= today and reminder_date.isoformat() not in reminder_sent_dates:
            return reminder_date.isoformat()
    
    return None

@api_router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(data: InvoiceCreate, admin=Depends(get_current_admin)):
    # Calculate default due date (90 days from now) if not provided
    if not data.due_date:
        default_due = datetime.now(timezone.utc) + timedelta(days=90)
        data.due_date = default_due.strftime("%Y-%m-%d")
    
    invoice_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "pending",
        "paid_amount": 0.0,
        "reminder_sent_dates": [],
        "next_reminder_date": calculate_next_reminder(data.due_date, []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.invoices.insert_one(invoice_doc)
    
    # Update camper balance
    await db.campers.update_one(
        {"id": data.camper_id},
        {"$inc": {"total_balance": data.amount}}
    )
    
    # Log activity
    camper = await db.campers.find_one({"id": data.camper_id}, {"_id": 0})
    await log_activity(
        entity_type="camper",
        entity_id=data.camper_id,
        action="invoice_created",
        details={
            "invoice_id": invoice_doc["id"],
            "amount": data.amount,
            "due_date": data.due_date,
            "description": data.description
        },
        performed_by=admin.get("id")
    )
    
    invoice_doc.pop("_id", None)
    invoice_doc["created_at"] = datetime.fromisoformat(invoice_doc["created_at"])
    return InvoiceResponse(**invoice_doc)

@api_router.get("/invoices", response_model=List[InvoiceResponse])
async def get_invoices(
    camper_id: Optional[str] = None,
    status: Optional[str] = None,
    admin=Depends(get_current_admin)
):
    query = {}
    if camper_id:
        query["camper_id"] = camper_id
    if status:
        query["status"] = status
    
    invoices = await db.invoices.find(query, {"_id": 0}).to_list(1000)
    for inv in invoices:
        inv["created_at"] = datetime.fromisoformat(inv["created_at"])
        # Calculate next reminder if not set
        if not inv.get("next_reminder_date"):
            inv["next_reminder_date"] = calculate_next_reminder(
                inv.get("due_date"), 
                inv.get("reminder_sent_dates", [])
            )
    return [InvoiceResponse(**inv) for inv in invoices]

@api_router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, admin=Depends(get_current_admin)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice["created_at"] = datetime.fromisoformat(invoice["created_at"])
    return InvoiceResponse(**invoice)

@api_router.get("/invoices/reminders/due")
async def get_due_reminders(admin=Depends(get_current_admin)):
    """Get all invoices that need reminders sent today"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    invoices = await db.invoices.find(
        {"status": {"$ne": "paid"}, "next_reminder_date": today},
        {"_id": 0}
    ).to_list(1000)
    
    # Enrich with camper info
    result = []
    for inv in invoices:
        camper = await db.campers.find_one({"id": inv["camper_id"]}, {"_id": 0})
        if camper:
            result.append({
                **inv,
                "camper_name": f"{camper.get('first_name')} {camper.get('last_name')}",
                "parent_email": camper.get("parent_email"),
                "parent_phone": camper.get("father_cell") or camper.get("mother_cell")
            })
    
    return result

@api_router.post("/invoices/{invoice_id}/send-reminder")
async def send_invoice_reminder(invoice_id: str, admin=Depends(get_current_admin)):
    """Mark reminder as sent and calculate next reminder date"""
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    today = datetime.now(timezone.utc).date().isoformat()
    reminder_sent_dates = invoice.get("reminder_sent_dates", [])
    reminder_sent_dates.append(today)
    
    next_reminder = calculate_next_reminder(invoice.get("due_date"), reminder_sent_dates)
    
    await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": {
            "reminder_sent_dates": reminder_sent_dates,
            "next_reminder_date": next_reminder
        }}
    )
    
    # Log activity
    await log_activity(
        entity_type="camper",
        entity_id=invoice["camper_id"],
        action="reminder_sent",
        details={
            "invoice_id": invoice_id,
            "reminder_date": today,
            "next_reminder": next_reminder
        },
        performed_by=admin.get("id")
    )
    
    # Create communication log
    camper = await db.campers.find_one({"id": invoice["camper_id"]}, {"_id": 0})
    if camper:
        comm_doc = {
            "id": str(uuid.uuid4()),
            "camper_id": invoice["camper_id"],
            "type": "email",
            "subject": f"Payment Reminder - {camper.get('first_name')} {camper.get('last_name')}",
            "message": f"Reminder for invoice ${invoice['amount']} - Due: {invoice.get('due_date')}",
            "direction": "outbound",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.communications.insert_one(comm_doc)
    
    return {"message": "Reminder sent", "next_reminder_date": next_reminder}

# ==================== PAYMENT ROUTES ====================

@api_router.post("/payments", response_model=PaymentResponse)
async def create_payment(data: PaymentCreate, admin=Depends(get_current_admin)):
    invoice = await db.invoices.find_one({"id": data.invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    payment_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "completed" if data.method != "stripe" else "pending",
        "stripe_session_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_doc)
    
    # Update invoice and camper if payment is completed (non-stripe)
    if data.method != "stripe":
        new_paid = invoice["paid_amount"] + data.amount
        new_status = "paid" if new_paid >= invoice["amount"] else "partial"
        
        await db.invoices.update_one(
            {"id": data.invoice_id},
            {"$set": {"paid_amount": new_paid, "status": new_status}}
        )
        
        # Update camper's total_paid (parent info now embedded in camper)
        if invoice.get("camper_id"):
            await db.campers.update_one(
                {"id": invoice["camper_id"]},
                {"$inc": {"total_paid": data.amount}}
            )
    
    payment_doc.pop("_id", None)
    payment_doc["created_at"] = datetime.fromisoformat(payment_doc["created_at"])
    return PaymentResponse(**payment_doc)

@api_router.get("/payments", response_model=List[PaymentResponse])
async def get_payments(invoice_id: Optional[str] = None, admin=Depends(get_current_admin)):
    query = {}
    if invoice_id:
        query["invoice_id"] = invoice_id
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    for p in payments:
        p["created_at"] = datetime.fromisoformat(p["created_at"])
    return [PaymentResponse(**p) for p in payments]

# ==================== STRIPE ROUTES ====================

# Credit card processing fee rate
CREDIT_CARD_FEE_RATE = 0.035  # 3.5%

@api_router.get("/payment/calculate-fee")
async def calculate_payment_fee(amount: float, include_fee: bool = True):
    """Calculate the credit card processing fee"""
    if include_fee:
        fee = round(amount * CREDIT_CARD_FEE_RATE, 2)
        total = round(amount + fee, 2)
        return {
            "base_amount": amount,
            "fee_rate": CREDIT_CARD_FEE_RATE,
            "fee_amount": fee,
            "total_with_fee": total,
            "fee_description": f"3.5% credit card processing fee"
        }
    return {
        "base_amount": amount,
        "fee_rate": 0,
        "fee_amount": 0,
        "total_with_fee": amount,
        "fee_description": "No fee (internal payment)"
    }

@api_router.post("/stripe/checkout")
async def create_stripe_checkout(
    request: Request,
    invoice_id: str,
    amount: float,
    origin_url: str,
    include_fee: bool = True  # Whether to add the 3.5% fee
):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Calculate fee
    base_amount = float(amount)
    fee_amount = round(base_amount * CREDIT_CARD_FEE_RATE, 2) if include_fee else 0
    total_amount = round(base_amount + fee_amount, 2)
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=total_amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "invoice_id": invoice_id,
            "parent_id": invoice["parent_id"],
            "base_amount": str(base_amount),
            "fee_amount": str(fee_amount),
            "include_fee": str(include_fee)
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    payment_doc = {
        "id": str(uuid.uuid4()),
        "invoice_id": invoice_id,
        "amount": amount,
        "method": "stripe",
        "status": "pending",
        "stripe_session_id": session.session_id,
        "notes": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(payment_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/stripe/status/{session_id}")
async def get_stripe_status(session_id: str, request: Request):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update payment transaction if paid
    if status.payment_status == "paid":
        transaction = await db.payment_transactions.find_one(
            {"stripe_session_id": session_id},
            {"_id": 0}
        )
        
        if transaction and transaction["status"] != "completed":
            await db.payment_transactions.update_one(
                {"stripe_session_id": session_id},
                {"$set": {"status": "completed"}}
            )
            
            # Update invoice
            invoice = await db.invoices.find_one(
                {"id": transaction["invoice_id"]},
                {"_id": 0}
            )
            if invoice:
                new_paid = invoice["paid_amount"] + transaction["amount"]
                new_status = "paid" if new_paid >= invoice["amount"] else "partial"
                
                await db.invoices.update_one(
                    {"id": transaction["invoice_id"]},
                    {"$set": {"paid_amount": new_paid, "status": new_status}}
                )
                
                # Update camper's total_paid (parent info now embedded in camper)
                if invoice.get("camper_id"):
                    await db.campers.update_one(
                        {"id": invoice["camper_id"]},
                        {"$inc": {"total_paid": transaction["amount"]}}
                    )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"stripe_session_id": webhook_response.session_id},
                {"$set": {"status": "completed"}}
            )
        
        return {"received": True}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"received": True}

# ==================== COMMUNICATION ROUTES ====================

@api_router.post("/communications", response_model=CommunicationResponse)
async def create_communication(data: CommunicationCreate, admin=Depends(get_current_admin)):
    comm_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.communications.insert_one(comm_doc)
    comm_doc.pop("_id", None)
    comm_doc["created_at"] = datetime.fromisoformat(comm_doc["created_at"])
    return CommunicationResponse(**comm_doc)

@api_router.get("/communications", response_model=List[CommunicationResponse])
async def get_communications(
    camper_id: Optional[str] = None,
    type: Optional[str] = None,
    admin=Depends(get_current_admin)
):
    query = {}
    if camper_id:
        query["camper_id"] = camper_id
    if type:
        query["type"] = type
    
    comms = await db.communications.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    result = []
    for c in comms:
        c["created_at"] = datetime.fromisoformat(c["created_at"])
        # Handle both old parent_id and new camper_id for backwards compat
        if "parent_id" in c and "camper_id" not in c:
            c["camper_id"] = c.get("parent_id", "")
        result.append(CommunicationResponse(**c))
    return result

@api_router.put("/communications/{comm_id}/status")
async def update_communication_status(comm_id: str, status: str, admin=Depends(get_current_admin)):
    result = await db.communications.update_one(
        {"id": comm_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Communication not found")
    return {"message": "Status updated"}

# ==================== ROOM ROUTES ====================

@api_router.post("/rooms", response_model=RoomResponse)
async def create_room(data: RoomCreate, admin=Depends(get_current_admin)):
    room_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "assigned_campers": []
    }
    await db.rooms.insert_one(room_doc)
    room_doc.pop("_id", None)
    return RoomResponse(**room_doc)

@api_router.get("/rooms", response_model=List[RoomResponse])
async def get_rooms(admin=Depends(get_current_admin)):
    rooms = await db.rooms.find({}, {"_id": 0}).to_list(100)
    return [RoomResponse(**r) for r in rooms]

@api_router.put("/rooms/{room_id}/assign")
async def assign_camper_to_room(room_id: str, camper_id: str, admin=Depends(get_current_admin)):
    # Remove camper from any existing room
    await db.rooms.update_many(
        {},
        {"$pull": {"assigned_campers": camper_id}}
    )
    
    # Assign to new room
    result = await db.rooms.update_one(
        {"id": room_id},
        {"$addToSet": {"assigned_campers": camper_id}}
    )
    
    # Update camper's room field
    await db.campers.update_one(
        {"id": camper_id},
        {"$set": {"room": room_id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Camper assigned to room"}

@api_router.put("/rooms/{room_id}/unassign")
async def unassign_camper_from_room(room_id: str, camper_id: str, admin=Depends(get_current_admin)):
    result = await db.rooms.update_one(
        {"id": room_id},
        {"$pull": {"assigned_campers": camper_id}}
    )
    
    await db.campers.update_one(
        {"id": camper_id},
        {"$set": {"room": None}}
    )
    
    return {"message": "Camper unassigned from room"}

# ==================== GROUPS ROUTES ====================

@api_router.post("/groups", response_model=GroupResponse)
async def create_group(data: GroupCreate, admin=Depends(get_current_admin)):
    group_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "assigned_campers": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.groups.insert_one(group_doc)
    group_doc.pop("_id", None)
    group_doc["created_at"] = datetime.fromisoformat(group_doc["created_at"])
    return GroupResponse(**group_doc)

@api_router.get("/groups", response_model=List[GroupResponse])
async def get_groups(type: Optional[str] = None, admin=Depends(get_current_admin)):
    query = {}
    if type:
        query["type"] = type
    groups = await db.groups.find(query, {"_id": 0}).to_list(500)
    for g in groups:
        if g.get("created_at"):
            g["created_at"] = datetime.fromisoformat(g["created_at"]) if isinstance(g["created_at"], str) else g["created_at"]
    return [GroupResponse(**g) for g in groups]

@api_router.get("/groups/{group_id}", response_model=GroupResponse)
async def get_group(group_id: str, admin=Depends(get_current_admin)):
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.get("created_at"):
        group["created_at"] = datetime.fromisoformat(group["created_at"]) if isinstance(group["created_at"], str) else group["created_at"]
    return GroupResponse(**group)

@api_router.put("/groups/{group_id}", response_model=GroupResponse)
async def update_group(group_id: str, data: GroupCreate, admin=Depends(get_current_admin)):
    result = await db.groups.update_one(
        {"id": group_id},
        {"$set": data.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if group.get("created_at"):
        group["created_at"] = datetime.fromisoformat(group["created_at"]) if isinstance(group["created_at"], str) else group["created_at"]
    return GroupResponse(**group)

@api_router.delete("/groups/{group_id}")
async def delete_group(group_id: str, admin=Depends(get_current_admin)):
    # Remove group reference from all campers
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if group:
        for camper_id in group.get("assigned_campers", []):
            await db.campers.update_one(
                {"id": camper_id},
                {"$pull": {"groups": group_id}}
            )
    
    result = await db.groups.delete_one({"id": group_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"message": "Group deleted"}

@api_router.put("/groups/{group_id}/assign")
async def assign_camper_to_group(group_id: str, camper_id: str, admin=Depends(get_current_admin)):
    result = await db.groups.update_one(
        {"id": group_id},
        {"$addToSet": {"assigned_campers": camper_id}}
    )
    
    # Add group to camper's groups array
    await db.campers.update_one(
        {"id": camper_id},
        {"$addToSet": {"groups": group_id}}
    )
    
    # Log activity
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    await log_activity(
        entity_type="camper",
        entity_id=camper_id,
        action="group_assigned",
        details={"group_id": group_id, "group_name": group.get("name") if group else None, "group_type": group.get("type") if group else None},
        performed_by=admin.get("id")
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"message": "Camper assigned to group"}

@api_router.put("/groups/{group_id}/unassign")
async def unassign_camper_from_group(group_id: str, camper_id: str, admin=Depends(get_current_admin)):
    result = await db.groups.update_one(
        {"id": group_id},
        {"$pull": {"assigned_campers": camper_id}}
    )
    
    # Remove group from camper's groups array
    await db.campers.update_one(
        {"id": camper_id},
        {"$pull": {"groups": group_id}}
    )
    
    return {"message": "Camper removed from group"}

# ==================== ACTIVITY LOG ====================

async def log_activity(entity_type: str, entity_id: str, action: str, details: dict = None, performed_by: str = None):
    """Helper to log activities"""
    log_doc = {
        "id": str(uuid.uuid4()),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "action": action,
        "details": details or {},
        "performed_by": performed_by,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.activity_logs.insert_one(log_doc)
    return log_doc

@api_router.get("/activities")
async def get_activities(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    admin=Depends(get_current_admin)
):
    """Get activity logs with flexible filtering"""
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    
    logs = await db.activity_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with admin names
    for log in logs:
        if log.get("performed_by"):
            admin_user = await db.admins.find_one({"id": log["performed_by"]}, {"_id": 0})
            log["performed_by_name"] = admin_user.get("name") if admin_user else "Unknown"
        log["created_at"] = datetime.fromisoformat(log["created_at"]) if isinstance(log["created_at"], str) else log["created_at"]
    
    return logs

@api_router.get("/activity/{entity_type}/{entity_id}")
async def get_activity_log(entity_type: str, entity_id: str, admin=Depends(get_current_admin)):
    logs = await db.activity_logs.find(
        {"entity_type": entity_type, "entity_id": entity_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with admin names
    for log in logs:
        if log.get("performed_by"):
            admin_user = await db.admins.find_one({"id": log["performed_by"]}, {"_id": 0})
            log["performed_by_name"] = admin_user.get("name") if admin_user else "Unknown"
        log["created_at"] = datetime.fromisoformat(log["created_at"]) if isinstance(log["created_at"], str) else log["created_at"]
    
    return logs

class NoteRequest(BaseModel):
    entity_type: str
    entity_id: str
    note: str

@api_router.post("/activities/note")
async def add_activity_note(data: NoteRequest, admin=Depends(get_current_admin)):
    """Add a note to a camper's activity log"""
    log = await log_activity(
        entity_type=data.entity_type,
        entity_id=data.entity_id,
        action="note_added",
        details={"note": data.note},
        performed_by=admin.get("id")
    )
    return {"message": "Note added", "log_id": log["id"]}

@api_router.post("/activity/{entity_type}/{entity_id}/note")
async def add_note(entity_type: str, entity_id: str, note: str = Query(...), admin=Depends(get_current_admin)):
    """Add a note to a camper or parent (legacy endpoint)"""
    log = await log_activity(
        entity_type=entity_type,
        entity_id=entity_id,
        action="note_added",
        details={"note": note},
        performed_by=admin.get("id")
    )
    return {"message": "Note added", "log_id": log["id"]}

# ==================== EXPENSE ROUTES ====================

@api_router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(data: ExpenseCreate, admin=Depends(get_current_admin)):
    expense_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.expenses.insert_one(expense_doc)
    expense_doc.pop("_id", None)
    expense_doc["created_at"] = datetime.fromisoformat(expense_doc["created_at"])
    return ExpenseResponse(**expense_doc)

@api_router.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses(
    category: Optional[str] = None,
    admin=Depends(get_current_admin)
):
    query = {}
    if category:
        query["category"] = category
    
    expenses = await db.expenses.find(query, {"_id": 0}).to_list(1000)
    for e in expenses:
        e["created_at"] = datetime.fromisoformat(e["created_at"])
    return [ExpenseResponse(**e) for e in expenses]

@api_router.get("/expenses/categories")
async def get_expense_categories(admin=Depends(get_current_admin)):
    categories = await db.expenses.distinct("category")
    return {"categories": categories}

# ==================== SAVED REPORTS/LISTS ====================

class SavedReportCreate(BaseModel):
    name: str
    description: Optional[str] = None
    columns: List[str]
    filters: Optional[dict] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = "asc"

@api_router.get("/reports")
async def get_saved_reports(admin=Depends(get_current_admin)):
    """Get all saved reports/lists"""
    reports = await db.saved_reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reports

@api_router.post("/reports")
async def create_saved_report(data: SavedReportCreate, admin=Depends(get_current_admin)):
    """Create a new saved report/list"""
    report_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_by": admin.get("id"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.saved_reports.insert_one(report_doc)
    return {"message": "Report saved", "id": report_doc["id"]}

@api_router.get("/reports/{report_id}")
async def get_saved_report(report_id: str, admin=Depends(get_current_admin)):
    """Get a specific saved report with data"""
    report = await db.saved_reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Get camper data based on report config
    query = report.get("filters", {}) or {}
    campers = await db.campers.find(query, {"_id": 0}).to_list(1000)
    
    # Sort if configured
    if report.get("sort_by"):
        reverse = report.get("sort_order", "asc") == "desc"
        campers.sort(key=lambda x: x.get(report["sort_by"], ""), reverse=reverse)
    
    # Filter to only requested columns
    columns = report.get("columns", [])
    if columns:
        filtered_data = []
        for camper in campers:
            row = {"id": camper["id"]}
            for col in columns:
                row[col] = camper.get(col, "")
            filtered_data.append(row)
        campers = filtered_data
    
    return {"report": report, "data": campers}

@api_router.put("/reports/{report_id}")
async def update_saved_report(report_id: str, data: SavedReportCreate, admin=Depends(get_current_admin)):
    """Update a saved report"""
    result = await db.saved_reports.update_one(
        {"id": report_id},
        {"$set": data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report updated"}

@api_router.delete("/reports/{report_id}")
async def delete_saved_report(report_id: str, admin=Depends(get_current_admin)):
    """Delete a saved report"""
    result = await db.saved_reports.delete_one({"id": report_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted"}

# ==================== FINANCIAL ROUTES ====================

@api_router.get("/financial/summary")
async def get_financial_summary(admin=Depends(get_current_admin)):
    # Get all invoices
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    total_invoiced = sum(inv["amount"] for inv in invoices)
    total_collected = sum(inv["paid_amount"] for inv in invoices)
    total_outstanding = total_invoiced - total_collected
    
    # Get all expenses
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    total_expenses = sum(exp["amount"] for exp in expenses)
    
    # Expenses by category
    expense_by_category = {}
    for exp in expenses:
        cat = exp["category"]
        expense_by_category[cat] = expense_by_category.get(cat, 0) + exp["amount"]
    
    # Payment method breakdown
    payments = await db.payments.find({"status": "completed"}, {"_id": 0}).to_list(1000)
    payment_by_method = {}
    for pay in payments:
        method = pay["method"]
        payment_by_method[method] = payment_by_method.get(method, 0) + pay["amount"]
    
    return {
        "total_invoiced": total_invoiced,
        "total_collected": total_collected,
        "total_outstanding": total_outstanding,
        "total_expenses": total_expenses,
        "net_income": total_collected - total_expenses,
        "expense_by_category": expense_by_category,
        "payment_by_method": payment_by_method
    }

# ==================== EMAIL TEMPLATE ROUTES ====================

@api_router.get("/template-merge-fields")
async def get_template_merge_fields(admin=Depends(get_current_admin)):
    """Get available merge fields for templates"""
    return TEMPLATE_MERGE_FIELDS

@api_router.post("/templates/seed-defaults")
async def seed_default_templates(admin=Depends(get_current_admin)):
    """Seed default templates if none exist"""
    existing_count = await db.email_templates.count_documents({})
    if existing_count == 0:
        for template in DEFAULT_TEMPLATES:
            template_doc = {
                "id": str(uuid.uuid4()),
                **template
            }
            await db.email_templates.insert_one(template_doc)
        return {"message": f"Created {len(DEFAULT_TEMPLATES)} default templates"}
    return {"message": "Templates already exist"}

@api_router.post("/templates/preview")
async def preview_template(
    template_id: str = Query(None),
    camper_id: str = Query(None),
    custom_subject: str = Query(None),
    custom_body: str = Query(None),
    admin=Depends(get_current_admin)
):
    """Preview a template with real data from a camper"""
    # Get template content
    if template_id:
        template = await db.email_templates.find_one({"id": template_id}, {"_id": 0})
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        subject = template.get("subject", "")
        body = template.get("body", "")
    elif custom_subject is not None or custom_body is not None:
        subject = custom_subject or ""
        body = custom_body or ""
    else:
        raise HTTPException(status_code=400, detail="Either template_id or custom content required")
    
    # Get data for merge fields
    merge_data = {}
    
    # Get settings for camp info
    settings = await db.settings.find_one({}, {"_id": 0})
    if settings:
        merge_data["camp_name"] = settings.get("camp_name", "Camp Baraisa")
        merge_data["camp_email"] = settings.get("camp_email", "")
        merge_data["camp_phone"] = settings.get("camp_phone", "")
    else:
        merge_data["camp_name"] = "Camp Baraisa"
        merge_data["camp_email"] = ""
        merge_data["camp_phone"] = ""
    
    # Get camper and parent data if camper_id provided
    if camper_id:
        camper = await db.campers.find_one({"id": camper_id}, {"_id": 0})
        if camper:
            merge_data["camper_first_name"] = camper.get("first_name", "")
            merge_data["camper_last_name"] = camper.get("last_name", "")
            merge_data["camper_full_name"] = f"{camper.get('first_name', '')} {camper.get('last_name', '')}"
            merge_data["camper_grade"] = camper.get("grade", "")
            merge_data["camper_yeshiva"] = camper.get("yeshiva", "")
            merge_data["camper_status"] = camper.get("status", "")
            merge_data["due_date"] = camper.get("due_date", "")
            
            # Parent data is now embedded in camper
            merge_data["parent_father_title"] = camper.get("father_title", "Mr.")
            merge_data["parent_father_first_name"] = camper.get("father_first_name", "")
            merge_data["parent_father_last_name"] = camper.get("father_last_name", "")
            merge_data["parent_father_cell"] = camper.get("father_cell", "")
            merge_data["parent_mother_first_name"] = camper.get("mother_first_name", "")
            merge_data["parent_mother_last_name"] = camper.get("mother_last_name", "")
            merge_data["parent_mother_cell"] = camper.get("mother_cell", "")
            merge_data["parent_email"] = camper.get("parent_email", "")
            merge_data["parent_address"] = camper.get("address", "")
            merge_data["payment_link"] = f"{os.environ.get('FRONTEND_URL', '')}/portal/{camper.get('portal_token', '')}"
            merge_data["total_balance"] = f"${camper.get('total_balance', 0):,.2f}"
            
            # Calculate amount due from invoices (now linked by camper_id)
            invoices = await db.invoices.find({"camper_id": camper["id"], "status": {"$ne": "paid"}}, {"_id": 0}).to_list(100)
            amount_due = sum(inv.get("amount", 0) - inv.get("paid_amount", 0) for inv in invoices)
            merge_data["amount_due"] = f"${amount_due:,.2f}"
    else:
        # Use sample data for preview
        merge_data.update({
            "camper_first_name": "Sample",
            "camper_last_name": "Camper",
            "camper_full_name": "Sample Camper",
            "camper_grade": "11th Grade",
            "camper_yeshiva": "Sample Yeshiva",
            "camper_status": "Applied",
            "parent_father_title": "Rabbi",
            "parent_father_first_name": "John",
            "parent_father_last_name": "Doe",
            "parent_father_cell": "(555) 123-4567",
            "parent_mother_first_name": "Jane",
            "parent_mother_last_name": "Doe",
            "parent_mother_cell": "(555) 987-6543",
            "parent_email": "parent@example.com",
            "parent_address": "123 Main St, City, State 12345",
            "payment_link": "https://portal.example.com/abc123",
            "amount_due": "$2,500.00",
            "total_balance": "$5,000.00",
            "due_date": "March 15, 2026"
        })
    
    # Replace merge fields in subject and body
    rendered_subject = subject
    rendered_body = body
    for key, value in merge_data.items():
        placeholder = "{{" + key + "}}"
        rendered_subject = rendered_subject.replace(placeholder, str(value) if value else "")
        rendered_body = rendered_body.replace(placeholder, str(value) if value else "")
    
    return {
        "subject": rendered_subject,
        "body": rendered_body,
        "merge_data": merge_data
    }

@api_router.delete("/email-templates/{template_id}")
async def delete_email_template(template_id: str, admin=Depends(get_current_admin)):
    result = await db.email_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}

@api_router.post("/email-templates", response_model=EmailTemplateResponse)
async def create_email_template(data: EmailTemplateCreate, admin=Depends(get_current_admin)):
    template_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump()
    }
    await db.email_templates.insert_one(template_doc)
    template_doc.pop("_id", None)
    return EmailTemplateResponse(**template_doc)

@api_router.get("/email-templates", response_model=List[EmailTemplateResponse])
async def get_email_templates(admin=Depends(get_current_admin)):
    templates = await db.email_templates.find({}, {"_id": 0}).to_list(100)
    # Seed defaults if none exist
    if len(templates) == 0:
        for template in DEFAULT_TEMPLATES:
            template_doc = {
                "id": str(uuid.uuid4()),
                **template
            }
            await db.email_templates.insert_one(template_doc)
        templates = await db.email_templates.find({}, {"_id": 0}).to_list(100)
    return [EmailTemplateResponse(**t) for t in templates]

@api_router.put("/email-templates/{template_id}", response_model=EmailTemplateResponse)
async def update_email_template(template_id: str, data: EmailTemplateCreate, admin=Depends(get_current_admin)):
    result = await db.email_templates.update_one(
        {"id": template_id},
        {"$set": data.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    template = await db.email_templates.find_one({"id": template_id}, {"_id": 0})
    return EmailTemplateResponse(**template)

# ==================== SETTINGS ROUTES ====================

@api_router.get("/settings", response_model=SettingsResponse)
async def get_settings(admin=Depends(get_current_admin)):
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        settings = {
            "id": str(uuid.uuid4()),
            "camp_name": "Camp Baraisa",
            "camp_email": None,
            "camp_phone": None,
            "quickbooks_sync": False,
            "twilio_enabled": False,
            "gmail_enabled": False
        }
        await db.settings.insert_one(settings)
    return SettingsResponse(**settings)

@api_router.put("/settings", response_model=SettingsResponse)
async def update_settings(data: SettingsBase, admin=Depends(get_current_admin)):
    settings = await db.settings.find_one({}, {"_id": 0})
    if settings:
        await db.settings.update_one(
            {"id": settings["id"]},
            {"$set": data.model_dump()}
        )
    else:
        settings = {"id": str(uuid.uuid4()), **data.model_dump()}
        await db.settings.insert_one(settings)
    
    return await get_settings(admin)

# ==================== EXPORT ROUTES ====================

@api_router.get("/exports/campers")
async def export_campers(admin=Depends(get_current_admin)):
    campers = await db.campers.find({}, {"_id": 0}).to_list(1000)
    
    export_data = []
    for camper in campers:
        # Parent info is now embedded in camper
        parent_name = f"{camper.get('father_first_name', '')} {camper.get('father_last_name', '')}".strip()
        if not parent_name:
            parent_name = f"{camper.get('mother_first_name', '')} {camper.get('mother_last_name', '')}".strip()
        
        export_data.append({
            "Camper ID": camper["id"],
            "First Name": camper["first_name"],
            "Last Name": camper["last_name"],
            "Hebrew Name": camper.get("hebrew_name", ""),
            "Grade": camper.get("grade", ""),
            "Yeshiva": camper.get("yeshiva", ""),
            "Status": camper.get("status", ""),
            "Room": camper.get("room_name", ""),
            "Parent Name": parent_name,
            "Parent Email": camper.get("parent_email", ""),
            "Parent Phone": camper.get("father_cell") or camper.get("mother_cell") or "",
            "Due Date": camper.get("due_date", ""),
            "Total Balance": camper.get("total_balance", 0),
            "Total Paid": camper.get("total_paid", 0),
            "Portal Link": f"/portal/{camper.get('portal_token', '')}" if camper.get("portal_token") else ""
        })
    
    return {"data": export_data, "filename": "campers_export.csv"}

@api_router.get("/exports/billing")
async def export_billing(admin=Depends(get_current_admin)):
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    
    # Get campers for enrichment
    camper_ids = list(set(inv.get("camper_id") for inv in invoices if inv.get("camper_id")))
    campers = await db.campers.find({"id": {"$in": camper_ids}}, {"_id": 0}).to_list(1000)
    camper_map = {c["id"]: c for c in campers}
    
    export_data = []
    for inv in invoices:
        camper = camper_map.get(inv.get("camper_id"), {})
        parent_name = f"{camper.get('father_first_name', '')} {camper.get('father_last_name', '')}".strip()
        
        export_data.append({
            "Invoice ID": inv["id"],
            "Camper Name": f"{camper.get('first_name', '')} {camper.get('last_name', '')}".strip(),
            "Parent Name": parent_name,
            "Parent Email": camper.get("parent_email", ""),
            "Amount": inv["amount"],
            "Paid Amount": inv["paid_amount"],
            "Status": inv["status"],
            "Description": inv["description"],
            "Due Date": inv.get("due_date", ""),
            "Created": inv["created_at"]
        })
    
    return {"data": export_data, "filename": "billing_export.csv"}

# ==================== PARENT PORTAL ROUTES (NO AUTH) ====================

@api_router.get("/portal/{access_token}")
async def get_parent_portal(access_token: str):
    """Portal can now be accessed via camper's portal_token or old parent access_token"""
    # First try to find camper by portal_token
    camper = await db.campers.find_one({"portal_token": access_token}, {"_id": 0})
    
    if camper:
        # New model - camper has all info
        invoices = await db.invoices.find({"camper_id": camper["id"]}, {"_id": 0}).to_list(100)
        invoice_ids = [inv["id"] for inv in invoices]
        payments = await db.payments.find({"invoice_id": {"$in": invoice_ids}}, {"_id": 0}).to_list(100)
        
        return {
            "parent": {
                "id": camper["id"],
                "first_name": camper.get("father_first_name") or camper.get("first_name"),
                "last_name": camper.get("father_last_name") or camper.get("last_name"),
                "email": camper.get("parent_email"),
                "father_first_name": camper.get("father_first_name"),
                "father_cell": camper.get("father_cell"),
                "phone": camper.get("father_cell") or camper.get("mother_cell"),
                "total_balance": camper.get("total_balance", 0),
                "total_paid": camper.get("total_paid", 0)
            },
            "campers": [camper],
            "invoices": invoices,
            "payments": payments
        }
    
    # Fallback to old parent model for backwards compatibility
    parent = await db.parents.find_one({"access_token": access_token}, {"_id": 0})
    if not camper:
        raise HTTPException(status_code=404, detail="Invalid access link")
    
    return {
        "parent": {
            "id": camper["id"],
            "first_name": camper.get("father_first_name") or camper.get("first_name"),
            "last_name": camper.get("father_last_name") or camper.get("last_name"),
            "email": camper.get("parent_email"),
            "father_first_name": camper.get("father_first_name"),
            "father_cell": camper.get("father_cell"),
            "phone": camper.get("father_cell") or camper.get("mother_cell"),
            "total_balance": camper.get("total_balance", 0),
            "total_paid": camper.get("total_paid", 0)
        },
        "campers": [camper],
        "invoices": invoices,
        "payments": payments
    }

@api_router.post("/portal/{access_token}/payment")
async def portal_create_payment(
    access_token: str, 
    request: Request, 
    invoice_id: str, 
    amount: float,
    include_fee: bool = True  # 3.5% credit card fee
):
    # Find camper by portal_token
    camper = await db.campers.find_one({"portal_token": access_token}, {"_id": 0})
    
    if not camper:
        raise HTTPException(status_code=404, detail="Invalid access link")
    
    invoice = await db.invoices.find_one({"id": invoice_id, "camper_id": camper["id"]}, {"_id": 0})
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Calculate fee
    base_amount = float(amount)
    fee_amount = round(base_amount * CREDIT_CARD_FEE_RATE, 2) if include_fee else 0
    total_amount = round(base_amount + fee_amount, 2)
    
    # Get origin from request
    origin = request.headers.get("origin", str(request.base_url).rstrip('/'))
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{origin}/portal/{access_token}?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/portal/{access_token}?payment=cancelled"
    
    checkout_request = CheckoutSessionRequest(
        amount=total_amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "invoice_id": invoice_id,
            "camper_id": camper["id"] if camper else None,
            "access_token": access_token,
            "base_amount": str(base_amount),
            "fee_amount": str(fee_amount)
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    payment_doc = {
        "id": str(uuid.uuid4()),
        "invoice_id": invoice_id,
        "camper_id": camper["id"] if camper else None,
        "amount": base_amount,
        "fee_amount": fee_amount,
        "include_fee": include_fee,
        "method": "stripe",
        "status": "pending",
        "stripe_session_id": session.session_id,
        "notes": "Portal payment",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(payment_doc)
    
    return {"url": session.url, "session_id": session.session_id}

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(admin=Depends(get_current_admin)):
    # Camper counts
    total_campers = await db.campers.count_documents({})
    campers_by_status = {}
    for status in KANBAN_STATUSES:
        count = await db.campers.count_documents({"status": status})
        campers_by_status[status] = count
    
    # Financial summary
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    total_invoiced = sum(inv["amount"] for inv in invoices)
    total_collected = sum(inv["paid_amount"] for inv in invoices)
    
    # Recent activity
    recent_campers = await db.campers.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_payments = await db.payments.find({"status": "completed"}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    # Pending communications
    pending_comms = await db.communications.count_documents({"status": "pending"})
    
    return {
        "total_campers": total_campers,
        "campers_by_status": campers_by_status,
        "total_invoiced": total_invoiced,
        "total_collected": total_collected,
        "outstanding": total_invoiced - total_collected,
        "recent_campers": recent_campers,
        "recent_payments": recent_payments,
        "pending_communications": pending_comms
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Camp Baraisa API", "status": "healthy"}

# ==================== MAIN APP CONFIG ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
