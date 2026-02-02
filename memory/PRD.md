# Camp Baraisa - Product Requirements Document

## Original Problem Statement
Build a comprehensive camp management system for Camp Baraisa, enabling admins to manage camper registrations, billing, communications, and track enrollment status through a Kanban-style workflow.

## Implementation Status

### ✅ COMPLETED Features

#### 1. Unified Camper Management
- Combined Parent and Camper data into single "Camper" record
- No separate Parents/Families sections - all embedded in camper
- All UI elements reflect unified model

#### 2. Admin Dashboard
- **Global Search:** Find campers by name, yeshiva, grade, parent info
- **Kanban Board:** 10-column drag-and-drop status pipeline
- **Data Center:** Custom saved lists system with field selection
- **Rooms & Groups:** Split tabs for physical rooms and custom groups

#### 3. Settings Page (5 Tabs)
- **Account:** Update name, email, phone; change password
- **Admins:** Create, edit, delete, approve/deny admin users
- **Templates:** Email/SMS templates with auto-triggers (⚡ icons)
- **API Keys:** Twilio and Gmail API configuration
- **Trash:** View deleted campers, restore or permanently delete

#### 4. Activity/Communication Log
- Each camper profile has chronological activity log
- Status changes, payments, communications tracked
- Timestamped entries with admin attribution
- Manual note addition feature

#### 5. Billing & Payments
- **Stripe Integration:** 3.5% processing fee for credit cards
- **Invoice System:** Create/track invoices linked to campers
- **Parent Portal:** Secure link for balance viewing and payments

#### 6. Public Application Form
- Accessible at `/apply` without login
- 4-step wizard: Camper/Parent Info → Address/Yeshiva → Camp/Emergency → Medical
- Creates camper with "Applied" status

#### 7. Camper Delete & Trash
- Delete button on camper rows
- Soft delete moves to trash collection
- Restore from Settings > Trash tab
- Permanent delete option

#### 8. Email Templates with Auto-Triggers
- Create templates in Settings > Templates
- Assign triggers: status_accepted, status_paid_in_full, invoice_sent, etc.
- Kanban status changes show confirmation popup with template preview
- Skip email option available

#### 9. Removed Quick Action Buttons
- Removed Call/SMS/Email buttons from Kanban tiles
- Removed quick contact buttons from CamperDetail sidebar
- Simplified parent info display

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, React Router
- **Backend:** FastAPI, Motor (async MongoDB), Pydantic
- **Database:** MongoDB
- **Payments:** Stripe (test mode)

## Database Collections
- `campers` - Unified camper records with embedded parent info
- `campers_trash` - Soft-deleted campers
- `admins` - Admin user accounts
- `invoices` - Financial invoices
- `activity_logs` - Activity history
- `email_templates` - Communication templates with triggers
- `groups` - Custom groupings
- `rooms` - Physical room assignments
- `saved_reports` - Data Center saved lists

## Key API Endpoints
- `POST /api/applications` - Public application submission
- `GET/POST/PUT/DELETE /api/campers` - Camper CRUD
- `DELETE /api/campers/{id}` - Soft delete to trash
- `GET /api/campers/trash/list` - List deleted campers
- `POST /api/campers/trash/{id}/restore` - Restore from trash
- `GET/POST/PUT/DELETE /api/admins` - Admin management
- `PUT /api/account` - Update own account
- `PUT /api/account/password` - Change password
- `GET/POST/PUT/DELETE /api/reports` - Saved lists/reports
- `GET /api/campers/{id}/email-preview` - Template preview for status change

## Remaining Items (Lower Priority)

### Invoice Reminder System
- Auto-send reminders at intervals (15 days before, due date, +3/+7/+15 after)
- Templates exist but scheduler not implemented

### PDF Export with Photos
- CSV export works
- PDF with camper photos not yet implemented

### AI-Powered Search
- Natural language search integration pending

### Real Email/SMS Sending
- Gmail and Twilio APIs are placeholders
- User can add keys via Settings > API Keys
- Actual sending not yet implemented

## Test Credentials
- **Admin Email:** admin@campbaraisa.com
- **Admin Password:** testpassword123

## Test Reports
- `/app/test_reports/iteration_6.json` - Latest (100% pass rate)

## Notes
- Gmail and Twilio APIs are MOCKED - add keys via Settings
- Stripe uses test key (pre-configured)
- Hot reload enabled for both frontend and backend
