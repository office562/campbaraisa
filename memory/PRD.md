# Camp Baraisa - Product Requirements Document

## Original Problem Statement
Build a comprehensive camp management system for Camp Baraisa, enabling admins to manage camper registrations, billing, communications, and track enrollment status through a Kanban-style workflow.

## Implementation Status

### ✅ COMPLETED Features (Latest Session - Feb 3, 2026)

#### Billing System (P0 - Fixed)
- **Camp Fee Auto-Select:** Default camp fee ($3,475) is automatically selected when creating new invoice
- **Editable Fees:** All fees including the default camp fee can be edited (name, amount, description)
- **Fee Checkbox:** Click anywhere on fee row to toggle selection
- **Stripe Charge Button:** Each invoice with balance shows "Charge" button in Actions column
- **3.5% Fee Breakdown:** Stripe dialog shows Payment Amount + Processing Fee (3.5%) + Total Charge

#### UI/UX Updates
- **Utah Logo:** Enlarged to w-72 h-72 (288x288px) on login page
- **Full Motto:** "The Ultimate Bein Hazmanim Experience for the serious Ben Torah"
- **Bryce Canyon Background:** Applied to Login and Parent Portal
- **Contact Buttons:** Call (green), Text (blue), Email (purple) buttons on Campers page table
- **Photo Zoom:** Click camper photo to open fullscreen modal

### Backend Updates
- `PUT /api/fees/{fee_id}` - Edit any fee including default camp fee
- `PUT /api/groups/{group_id}/campers` - Assign campers to groups
- Hierarchical groups support (`parent_id` field)

### Previous Completed Features

#### 1. Unified Camper Management
- Combined Parent and Camper data into single "Camper" record
- All UI elements reflect unified model

#### 2. Admin Dashboard
- **Global Search:** Find campers by name, yeshiva, grade, parent info
- **Kanban Board:** 10-column drag-and-drop with Call/Text/Email buttons
- **Data Center:** Custom saved lists with field selection
- **Rooms Page:** Physical room assignments with capacity tracking

#### 3. Settings Page (5 Tabs)
- **Account:** Update name, email, phone; change password
- **Admins:** Create, edit, delete admin users
- **Templates:** Email/SMS templates with auto-triggers
- **API Keys:** Twilio, Gmail, Stripe, Resend, Jotform
- **Trash:** View and restore deleted campers

#### 4. Activity/Communication Log
- Chronological activity log per camper
- Status changes, payments, communications tracked

#### 5. Public Application Form
- Accessible at `/apply` without login
- 4-step wizard for camper registration

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI
- **Backend:** FastAPI, Motor (async MongoDB)
- **Database:** MongoDB
- **Payments:** Stripe (test mode)

## Database Collections
- `campers` - Unified camper records
- `campers_trash` - Soft-deleted campers
- `admins` - Admin user accounts
- `invoices` - Financial invoices
- `payments` - Payment records
- `activity_logs` - Activity history
- `email_templates` - Communication templates
- `groups` - Hierarchical groups (supports parent_id)
- `rooms` - Physical room assignments
- `saved_reports` - Data Center saved lists
- `fees` - Custom billable fees (default + custom)

## Key API Endpoints
- `GET/POST/PUT/DELETE /api/fees` - Fee management
- `PUT /api/fees/{fee_id}` - Edit fees (including default)
- `PUT /api/groups/{group_id}/campers` - Assign campers to group
- `POST /api/stripe/checkout` - Stripe checkout with fee
- `GET /api/payment/calculate-fee` - Calculate 3.5% fee

## Remaining Items (Prioritized)

### P1 - High Priority
- **Hierarchical Groups UI:** Frontend page for nested groups (backend ready, UI had babel issues)
- **Sidebar Dropdown:** Rooms & Groups in expandable menu
- **Automated Invoice Reminders:** 15 days before, due date, +3/+7/+15 after
- **Configurable Kanban Email Triggers:** Link templates to status changes
- **Data Center Polish:** Switches UI, Groups/Rooms as columns
- **QuickBooks Export:** Export financial data (no API)
- **Communications Log Overhaul:** Categorized, detailed view

### P2 - Lower Priority
- **Smart Search:** Functional global search
- **Bulk Actions:** Multiple camper operations
- **Installment Plans:** Payment schedules
- **Expense Tracking:** Simple expense logging

## Test Credentials
- **Admin Email:** admin@campbaraisa.com
- **Admin Password:** testpassword123

## Test Reports
- `/app/test_reports/iteration_8.json` - Latest (100% pass - billing & UI)
- `/app/test_reports/iteration_7.json` - Previous (100% pass)

## Known Issues
- **Hierarchical Groups UI:** Groups page causes babel plugin recursion error - needs simpler component structure
- **Gmail/Twilio APIs:** MOCKED - add keys via Settings

## Notes
- Stripe uses test key (sk_test_emergent)
- Hot reload enabled for both frontend and backend
- JotForm API key: 9647d8b76395cd581d0b2b62ffb7e9d3
