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

class CamperBase(BaseModel):
    # Basic Info
    first_name: str
    last_name: str
    address: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    date_of_birth: Optional[str] = None
    # Yeshiva Info
    yeshiva: Optional[str] = None
    yeshiva_other: Optional[str] = None  # If "Other" selected
    grade: Optional[str] = None  # 11th, 12th, 1st yr Bais Medrash, 2nd yr Bais Medrash
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
    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    # Waivers
    rules_agreed: bool = False
    rules_signature: Optional[str] = None
    waiver_agreed: bool = False
    waiver_signature: Optional[str] = None
    # Due Date (set after acceptance)
    due_date: Optional[str] = None
    # Notes
    notes: Optional[str] = None

class CamperCreate(CamperBase):
    parent_id: str

class CamperResponse(CamperBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    parent_id: str
    status: str
    room: Optional[str] = None
    created_at: datetime

class ParentBase(BaseModel):
    # Primary Email
    email: EmailStr
    # Father Info
    father_title: Optional[str] = None  # Rabbi, Mr, etc.
    father_first_name: Optional[str] = None
    father_last_name: Optional[str] = None
    father_cell: Optional[str] = None
    # Mother Info
    mother_first_name: Optional[str] = None
    mother_last_name: Optional[str] = None
    mother_cell: Optional[str] = None
    # For backwards compatibility and display
    first_name: Optional[str] = None  # Will use father_first_name if not set
    last_name: Optional[str] = None   # Will use father_last_name if not set
    phone: Optional[str] = None       # Will use father_cell if not set
    # Address (from camper but can store here too)
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

class InvoiceBase(BaseModel):
    parent_id: str
    camper_id: str
    amount: float
    description: str
    due_date: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceResponse(InvoiceBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    status: str
    created_at: datetime
    paid_amount: float = 0.0

class PaymentBase(BaseModel):
    invoice_id: str
    amount: float
    method: str  # stripe, check, zelle, cash, other
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
    parent_id: str
    type: str  # email, sms
    subject: Optional[str] = None
    message: str
    direction: str  # inbound, outbound

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

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplateResponse(EmailTemplateBase):
    model_config = ConfigDict(extra="ignore")
    id: str

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

# ==================== PARENT ROUTES ====================

@api_router.post("/parents", response_model=ParentResponse)
async def create_parent(data: ParentCreate, admin=Depends(get_current_admin)):
    parent_doc = {
        "id": str(uuid.uuid4()),
        "access_token": secrets.token_urlsafe(32),
        **data.model_dump(),
        "total_balance": 0.0,
        "total_paid": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.parents.insert_one(parent_doc)
    parent_doc.pop("_id", None)
    parent_doc["created_at"] = datetime.fromisoformat(parent_doc["created_at"])
    return ParentResponse(**parent_doc)

@api_router.get("/parents", response_model=List[ParentResponse])
async def get_parents(admin=Depends(get_current_admin)):
    parents = await db.parents.find({}, {"_id": 0}).to_list(1000)
    for p in parents:
        p["created_at"] = datetime.fromisoformat(p["created_at"])
    return [ParentResponse(**p) for p in parents]

@api_router.get("/parents/{parent_id}", response_model=ParentResponse)
async def get_parent(parent_id: str, admin=Depends(get_current_admin)):
    parent = await db.parents.find_one({"id": parent_id}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    parent["created_at"] = datetime.fromisoformat(parent["created_at"])
    return ParentResponse(**parent)

@api_router.put("/parents/{parent_id}", response_model=ParentResponse)
async def update_parent(parent_id: str, data: ParentCreate, admin=Depends(get_current_admin)):
    result = await db.parents.update_one(
        {"id": parent_id},
        {"$set": data.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Parent not found")
    return await get_parent(parent_id, admin)

# ==================== CAMPER ROUTES ====================

@api_router.post("/campers", response_model=CamperResponse)
async def create_camper(data: CamperCreate, admin=Depends(get_current_admin)):
    camper_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "Applied",
        "room": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.campers.insert_one(camper_doc)
    camper_doc.pop("_id", None)
    camper_doc["created_at"] = datetime.fromisoformat(camper_doc["created_at"])
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
async def update_camper_status(camper_id: str, status: str = Query(...), admin=Depends(get_current_admin)):
    if status not in KANBAN_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {KANBAN_STATUSES}")
    
    camper = await db.campers.find_one({"id": camper_id}, {"_id": 0})
    if not camper:
        raise HTTPException(status_code=404, detail="Camper not found")
    
    old_status = camper.get("status")
    await db.campers.update_one({"id": camper_id}, {"$set": {"status": status}})
    
    # Trigger automated emails based on status change
    parent = await db.parents.find_one({"id": camper["parent_id"]}, {"_id": 0})
    
    if status == "Accepted" and old_status != "Accepted":
        # Log acceptance email
        comm_doc = {
            "id": str(uuid.uuid4()),
            "parent_id": camper["parent_id"],
            "type": "email",
            "subject": f"Welcome to Camp Baraisa - {camper['first_name']} Accepted!",
            "message": f"""We've spoken to your son's Rabbeim & have heard great things.

We are very excited to have {camper['first_name']} join us for this upcoming Summer 2026 Bez"H.

We will I"yH be sending out a packing list & additional info which will be sent out closer to the summer.

Flight & Billing info will be sent in separate emails.

Thank you and looking forward!""",
            "direction": "outbound",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.communications.insert_one(comm_doc)
    
    elif status == "Paid in Full" and old_status != "Paid in Full":
        # Log paid in full email
        comm_doc = {
            "id": str(uuid.uuid4()),
            "parent_id": camper["parent_id"],
            "type": "email",
            "subject": f"Camp Baraisa - Balance Paid in Full",
            "message": f"""Thank you! Your balance for {camper['first_name']}'s enrollment has been paid in full.

We look forward to seeing {camper['first_name']} this summer!

Camp Baraisa Team""",
            "direction": "outbound",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.communications.insert_one(comm_doc)
    
    return {"message": f"Status updated to {status}", "email_triggered": status in ["Accepted", "Paid in Full"]}

@api_router.delete("/campers/{camper_id}")
async def delete_camper(camper_id: str, admin=Depends(get_current_admin)):
    result = await db.campers.delete_one({"id": camper_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Camper not found")
    return {"message": "Camper deleted"}

# ==================== KANBAN ROUTES ====================

@api_router.get("/kanban")
async def get_kanban_board(admin=Depends(get_current_admin)):
    campers = await db.campers.find({}, {"_id": 0}).to_list(1000)
    
    # Get parent info for each camper
    parent_ids = list(set(c["parent_id"] for c in campers))
    parents = await db.parents.find({"id": {"$in": parent_ids}}, {"_id": 0}).to_list(1000)
    parent_map = {p["id"]: p for p in parents}
    
    board = {status: [] for status in KANBAN_STATUSES}
    
    for camper in campers:
        parent = parent_map.get(camper["parent_id"], {})
        camper_data = {
            **camper,
            "parent_name": f"{parent.get('first_name', '')} {parent.get('last_name', '')}".strip(),
            "parent_email": parent.get("email", ""),
            "parent_phone": parent.get("phone", "")
        }
        status = camper.get("status", "Applied")
        if status in board:
            board[status].append(camper_data)
    
    return {"statuses": KANBAN_STATUSES, "board": board}

# ==================== INVOICE ROUTES ====================

@api_router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(data: InvoiceCreate, admin=Depends(get_current_admin)):
    invoice_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "pending",
        "paid_amount": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.invoices.insert_one(invoice_doc)
    
    # Update parent balance
    await db.parents.update_one(
        {"id": data.parent_id},
        {"$inc": {"total_balance": data.amount}}
    )
    
    invoice_doc.pop("_id", None)
    invoice_doc["created_at"] = datetime.fromisoformat(invoice_doc["created_at"])
    return InvoiceResponse(**invoice_doc)

@api_router.get("/invoices", response_model=List[InvoiceResponse])
async def get_invoices(
    parent_id: Optional[str] = None,
    status: Optional[str] = None,
    admin=Depends(get_current_admin)
):
    query = {}
    if parent_id:
        query["parent_id"] = parent_id
    if status:
        query["status"] = status
    
    invoices = await db.invoices.find(query, {"_id": 0}).to_list(1000)
    for inv in invoices:
        inv["created_at"] = datetime.fromisoformat(inv["created_at"])
    return [InvoiceResponse(**inv) for inv in invoices]

@api_router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, admin=Depends(get_current_admin)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice["created_at"] = datetime.fromisoformat(invoice["created_at"])
    return InvoiceResponse(**invoice)

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
    
    # Update invoice and parent if payment is completed (non-stripe)
    if data.method != "stripe":
        new_paid = invoice["paid_amount"] + data.amount
        new_status = "paid" if new_paid >= invoice["amount"] else "partial"
        
        await db.invoices.update_one(
            {"id": data.invoice_id},
            {"$set": {"paid_amount": new_paid, "status": new_status}}
        )
        
        await db.parents.update_one(
            {"id": invoice["parent_id"]},
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

@api_router.post("/stripe/checkout")
async def create_stripe_checkout(
    request: Request,
    invoice_id: str,
    amount: float,
    origin_url: str
):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(amount),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "invoice_id": invoice_id,
            "parent_id": invoice["parent_id"]
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
                
                await db.parents.update_one(
                    {"id": invoice["parent_id"]},
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
    parent_id: Optional[str] = None,
    type: Optional[str] = None,
    admin=Depends(get_current_admin)
):
    query = {}
    if parent_id:
        query["parent_id"] = parent_id
    if type:
        query["type"] = type
    
    comms = await db.communications.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for c in comms:
        c["created_at"] = datetime.fromisoformat(c["created_at"])
    return [CommunicationResponse(**c) for c in comms]

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
    parent_ids = list(set(c["parent_id"] for c in campers))
    parents = await db.parents.find({"id": {"$in": parent_ids}}, {"_id": 0}).to_list(1000)
    parent_map = {p["id"]: p for p in parents}
    
    export_data = []
    for camper in campers:
        parent = parent_map.get(camper["parent_id"], {})
        export_data.append({
            "Camper ID": camper["id"],
            "First Name": camper["first_name"],
            "Last Name": camper["last_name"],
            "Hebrew Name": camper.get("hebrew_name", ""),
            "Grade": camper.get("grade", ""),
            "Yeshiva": camper.get("yeshiva", ""),
            "Status": camper.get("status", ""),
            "Room": camper.get("room", ""),
            "Parent Name": f"{parent.get('first_name', '')} {parent.get('last_name', '')}".strip(),
            "Parent Email": parent.get("email", ""),
            "Parent Phone": parent.get("phone", "")
        })
    
    return {"data": export_data, "filename": "campers_export.csv"}

@api_router.get("/exports/billing")
async def export_billing(admin=Depends(get_current_admin)):
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    parent_ids = list(set(inv["parent_id"] for inv in invoices))
    parents = await db.parents.find({"id": {"$in": parent_ids}}, {"_id": 0}).to_list(1000)
    parent_map = {p["id"]: p for p in parents}
    
    export_data = []
    for inv in invoices:
        parent = parent_map.get(inv["parent_id"], {})
        export_data.append({
            "Invoice ID": inv["id"],
            "Parent Name": f"{parent.get('first_name', '')} {parent.get('last_name', '')}".strip(),
            "Parent Email": parent.get("email", ""),
            "Amount": inv["amount"],
            "Paid Amount": inv["paid_amount"],
            "Status": inv["status"],
            "Description": inv["description"],
            "Due Date": inv.get("due_date", ""),
            "Created": inv["created_at"]
        })
    
    return {"data": export_data, "filename": "billing_export.csv"}

@api_router.get("/exports/parents")
async def export_parents(admin=Depends(get_current_admin)):
    parents = await db.parents.find({}, {"_id": 0}).to_list(1000)
    
    export_data = []
    for parent in parents:
        export_data.append({
            "Parent ID": parent["id"],
            "First Name": parent["first_name"],
            "Last Name": parent["last_name"],
            "Email": parent["email"],
            "Phone": parent.get("phone", ""),
            "Address": parent.get("address", ""),
            "City": parent.get("city", ""),
            "State": parent.get("state", ""),
            "Zip": parent.get("zip_code", ""),
            "Total Balance": parent.get("total_balance", 0),
            "Total Paid": parent.get("total_paid", 0)
        })
    
    return {"data": export_data, "filename": "parents_export.csv"}

# ==================== PARENT PORTAL ROUTES (NO AUTH) ====================

@api_router.get("/portal/{access_token}")
async def get_parent_portal(access_token: str):
    parent = await db.parents.find_one({"access_token": access_token}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Invalid access link")
    
    # Get campers
    campers = await db.campers.find({"parent_id": parent["id"]}, {"_id": 0}).to_list(100)
    
    # Get invoices
    invoices = await db.invoices.find({"parent_id": parent["id"]}, {"_id": 0}).to_list(100)
    
    # Get payments
    camper_ids = [c["id"] for c in campers]
    payments = await db.payments.find(
        {"invoice_id": {"$in": [inv["id"] for inv in invoices]}},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "parent": {
            "id": parent["id"],
            "first_name": parent["first_name"],
            "last_name": parent["last_name"],
            "email": parent["email"],
            "phone": parent.get("phone"),
            "total_balance": parent.get("total_balance", 0),
            "total_paid": parent.get("total_paid", 0)
        },
        "campers": campers,
        "invoices": invoices,
        "payments": payments
    }

@api_router.post("/portal/{access_token}/payment")
async def portal_create_payment(access_token: str, request: Request, invoice_id: str, amount: float):
    parent = await db.parents.find_one({"access_token": access_token}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Invalid access link")
    
    invoice = await db.invoices.find_one({"id": invoice_id, "parent_id": parent["id"]}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get origin from request
    origin = request.headers.get("origin", str(request.base_url).rstrip('/'))
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{origin}/portal/{access_token}?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/portal/{access_token}?payment=cancelled"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(amount),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "invoice_id": invoice_id,
            "parent_id": parent["id"],
            "access_token": access_token
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
