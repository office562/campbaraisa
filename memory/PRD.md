# Camp Baraisa - Product Requirements Document

## Original Problem Statement
Build a comprehensive camp management system for Camp Baraisa, enabling admins to manage camper registrations, billing, communications, and track enrollment status through a Kanban-style workflow.

## Core Requirements (Consolidated)

### 1. Unified Camper Management ✅ COMPLETED
- Combined Parent and Camper data into a single "Camper" record
- Camper record contains all information: personal details, parent/guardian details, contact info, yeshiva, camp history, medical info, photo
- All UI elements (Data Center, Kanban, detail pages) reflect this unified model

### 2. Admin Dashboard ✅ COMPLETED
- **Global Search:** Search bar to find any camper by name, yeshiva, grade, parent info
- **Data Center:** Custom reports with field visibility toggling, category-based filtering, CSV export
- **Kanban Board:** Large clickable tiles with photo, due dates, parent contact, status updates
- **Rooms & Groups:** Split into two separate tabs for physical rooms and custom groups

### 3. Activity/Communication Log ✅ COMPLETED
- Each camper profile has chronological activity log
- Logs show status changes, payments, communications
- Each entry timestamped and attributed to admin user
- Admins can add manual notes

### 4. Billing & Payments ✅ COMPLETED
- **Stripe Integration:** 3.5% processing fee for credit card payments (displayed to user before payment)
- **Invoice System:** Create and track invoices linked to campers
- **Parent Portal:** Unique secure link for parents to view balance and make payments

### 5. Public Application Form ✅ COMPLETED
- Accessible at `/apply` without login
- Multi-step wizard (4 steps): Camper & Parent Info → Address & Yeshiva → Camp History & Emergency → Medical
- Creates camper with "Applied" status upon submission

### 6. Settings ✅ COMPLETED
- API key management section for Gmail, Twilio, Stripe (placeholders for user to add later)
- Email/SMS template system with dynamic merge fields
- Visual indicator (⚡) for templates linked to automated triggers

## What's Been Implemented

### December 2025
- **Data Model Refactoring:** Merged Parent and Camper into unified Camper model
- **Backend APIs:** All endpoints updated to use unified model
- **CamperDetail Page:** Added activity log with manual note feature
- **Public Application Form:** Created `/apply` route with 4-step wizard
- **Kanban Board:** 10 status columns with drag-and-drop, parent contact actions
- **Data Center:** Column selection by category, filtering, CSV export
- **Settings Page:** Template management, API key placeholders

### Previous Sessions
- Authentication system (JWT-based)
- Admin registration with approval workflow
- Dashboard with stats
- Invoice creation and payment tracking
- Parent Portal with Stripe checkout
- 3.5% credit card processing fee

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, React Router
- **Backend:** FastAPI, Motor (async MongoDB), Pydantic
- **Database:** MongoDB
- **Payments:** Stripe

## Database Collections
- `campers` - Unified camper records with embedded parent info
- `admins` - Admin user accounts
- `invoices` - Financial invoices linked to campers
- `activity_logs` - Activity history for campers
- `email_templates` - Customizable communication templates
- `groups` - Custom groupings (shiurim, trips, etc.)
- `rooms` - Physical room assignments

## Key API Endpoints
- `POST /api/applications` - Public endpoint for parent applications
- `GET /api/campers` - List all campers
- `POST /api/campers` - Create camper with embedded parent info
- `GET /api/activities` - Get activity log
- `POST /api/activities/note` - Add manual note
- `GET /api/kanban` - Get Kanban board data
- `GET /api/portal/{token}` - Parent portal data
- `POST /api/portal/{token}/payment` - Create payment session

## Pending/Backlog Features

### P1 - High Priority
- **Invoice Reminder System:** Auto-send reminders at 15 days, due date, +3/+7/+15 days after
- **Confirmation Pop-ups:** Modal before sending automated emails/SMS from Kanban status changes
- **Save Report Configurations:** Allow saving Data Center report configs for reuse
- **PDF Export with Photos:** Export camper data with photo cards

### P2 - Medium Priority  
- **AI-Powered Search:** Natural language search integration
- **Admin Approval UI:** Interface for approving new admin registrations
- **Full Rooms & Groups:** Complete building/bed assignment and group linking to profiles

### P3 - Lower Priority
- **Custom Portal URLs:** Generate unique URLs like `lastname-randomstring`
- **Financials Module:** Expense tracking, QuickBooks integration
- **Email/SMS Integration:** Connect actual Gmail and Twilio APIs (currently placeholders)

## Test Credentials
- **Admin Email:** admin@campbaraisa.com
- **Admin Password:** testpassword123

## Notes
- Gmail and Twilio APIs are MOCKED - placeholders for user to add API keys via Settings
- Existing test campers may show "No parent info" if created before unified model migration
- Stripe test key is pre-configured for payments
