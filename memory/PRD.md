# Camp Baraisa - Product Requirements Document

## Original Problem Statement
Build a comprehensive camp management system for Camp Baraisa, enabling admins to manage camper registrations, billing, communications, and track enrollment status through a Kanban-style workflow.

## Implementation Status

### ✅ COMPLETED Features (Session Updates - Feb 3, 2026)

#### Latest Updates
- **Login Page Branding:** Utah Elevated logo enlarged to w-72 h-72 (288x288px)
- **Full Motto:** "The Ultimate Bein Hazmanim Experience for the serious Ben Torah"
- **Bryce Canyon Background:** Applied to Login and Parent Portal
- **Call/Text/Email Buttons:** Added to Campers page table in Contact column
- **Clickable Camper Photos:** Photos can be clicked to open zoom modal (Campers, CamperDetail)
- **Stripe Credit Card Charging:** Admin can charge credit cards directly from Billing page with 3.5% fee breakdown

#### 1. Unified Camper Management
- Combined Parent and Camper data into single "Camper" record
- No separate Parents/Families sections - all embedded in camper
- All UI elements reflect unified model

#### 2. Admin Dashboard
- **Global Search:** Find campers by name, yeshiva, grade, parent info
- **Kanban Board:** 10-column drag-and-drop status pipeline with Call/Text/Email buttons
- **Data Center:** Custom saved lists system with field selection
- **Rooms & Groups:** Split tabs for physical rooms and custom groups

#### 3. Settings Page (5 Tabs)
- **Account:** Update name, email, phone; change password
- **Admins:** Create, edit, delete, approve/deny admin users
- **Templates:** Email/SMS templates with auto-triggers (⚡ icons)
- **API Keys:** Twilio, Gmail, Stripe, Resend, Jotform configuration
- **Trash:** View deleted campers, restore or permanently delete

#### 4. Activity/Communication Log
- Each camper profile has chronological activity log
- Status changes, payments, communications tracked
- Timestamped entries with admin attribution
- Manual note addition feature

#### 5. Billing & Payments
- **Stripe Integration:** 3.5% processing fee for credit cards
- **Admin Charge Card:** Direct credit card charging from Billing page
- **Invoice System:** Create/track invoices linked to campers
- **Fee Management:** Custom fees ($3,475 default camp fee)
- **Discounts:** Percentage and fixed amount discounts
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
- Assign triggers: status_accepted, status_paid_in_full, invoice_sent
- Kanban status changes show confirmation popup with template preview
- Skip email option available

#### 9. Contact Actions
- Call/SMS/Email buttons on Kanban cards
- Call/SMS/Email buttons on Campers page table
- One-click contact to parent phone or email

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
- `payments` - Payment records
- `activity_logs` - Activity history
- `email_templates` - Communication templates with triggers
- `groups` - Custom groupings
- `rooms` - Physical room assignments
- `saved_reports` - Data Center saved lists
- `fees` - Custom billable fees

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
- `POST /api/stripe/checkout` - Initiate Stripe checkout
- `GET /api/payment/calculate-fee` - Calculate 3.5% fee
- `GET/POST /api/fees` - Fee management

## Remaining Items (Prioritized)

### P1 - High Priority
- **Hierarchical Groups System:** Nested groups (Transportation → Bus 1, Bus 2)
- **Sidebar Dropdown:** Rooms & Groups in expandable menu
- **Automated Invoice Reminders:** 15 days before, due date, +3/+7/+15 after
- **Configurable Kanban Email Triggers:** Link templates to status changes via switches
- **Data Center Polish:** Switches UI for editing, Groups/Rooms as columns
- **QuickBooks Export:** Export financial data (no API integration)
- **Communications Log Overhaul:** Categorized (SMS/Email), click for details

### P2 - Lower Priority
- **Smart Search:** Functional global search
- **Bulk Actions:** Multiple camper operations
- **Installment Plans:** Set up payment schedules internally
- **Expense Tracking:** Simple expense logging

## Test Credentials
- **Admin Email:** admin@campbaraisa.com
- **Admin Password:** testpassword123

## Test Reports
- `/app/test_reports/iteration_7.json` - Latest (100% pass rate)

## Notes
- Gmail and Twilio APIs are MOCKED - add keys via Settings
- Stripe uses test key (pre-configured)
- Hot reload enabled for both frontend and backend
- JotForm API key provided: 9647d8b76395cd581d0b2b62ffb7e9d3
