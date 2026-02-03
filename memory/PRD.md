# Camp Baraisa - Product Requirements Document

## Original Problem Statement
Build a comprehensive camp management system for Camp Baraisa, enabling admins to manage camper registrations, billing, communications, and track enrollment status through a Kanban-style workflow.

## Implementation Status

### ✅ ALL P1 & P2 FEATURES COMPLETED (Feb 3, 2026)

#### P1 Features - DONE
1. **Hierarchical Groups System** ✅
   - Parent groups (Transportation, Shiurim, etc.)
   - Subgroups (Bus 1, Bus 2, Shiur Aleph, etc.)
   - Assign campers to groups/subgroups
   - Export group lists as CSV

2. **Sidebar Dropdown** ✅
   - "Rooms & Groups" expands to show Rooms and Groups sub-items
   - Chevron icon toggles expand/collapse
   - Sub-items properly highlighted when active

3. **Smart Search** ✅
   - Real-time search in header bar
   - Searches by: camper name, parent name, yeshiva, email
   - Dropdown shows matching results with details
   - Click result navigates to camper profile

4. **QuickBooks Export** ✅
   - Export button on Financial page
   - Downloads CSV with invoices, payments, expenses
   - QuickBooks-compatible format

5. **Expense Tracking** ✅
   - Add expenses with category, amount, description, date, vendor
   - Pie chart visualization by category
   - Categories: Food & Catering, Staff Salaries, Transportation, Activities & Equipment, Utilities, Office Supplies, Medical, Insurance, Marketing, Miscellaneous

6. **Invoice Reminders Backend** ✅
   - Endpoint: GET /api/invoices/due-reminders
   - Returns invoices by reminder timing: 15 days before, due date, +3/+7/+15 days
   - Endpoint: POST /api/invoices/{id}/send-reminder (logs reminder)
   - **Note:** Actual automated email sending NOT implemented

7. **Communications Log Overhaul** ✅
   - Tabbed interface: All / Email / SMS
   - Categorized message list
   - Click message to see full details (recipient, date, status, content)
   - Compose message dialog with camper selection

#### Previous Features
- **Billing System:** Camp fee auto-select, editable fees, Stripe charge with 3.5% fee
- **Camper Management:** Unified model, photo zoom, Call/Text/Email buttons
- **Kanban Board:** 10-column drag-and-drop, status-triggered emails
- **Login/Portal:** Large Utah logo, Bryce Canyon background, full motto
- **Settings:** Admin management, API keys, templates, trash

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
- `expenses` - Expense tracking
- `activity_logs` - Activity history
- `email_templates` - Communication templates
- `groups` - Hierarchical groups (parent_id support)
- `rooms` - Physical room assignments
- `saved_reports` - Data Center saved lists
- `fees` - Custom billable fees
- `communications` - Email/SMS logs

## Key API Endpoints
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create group (with parent_id for subgroups)
- `PUT /api/groups/{id}/campers` - Assign campers
- `GET /api/financial/quickbooks-export` - QuickBooks CSV data
- `GET /api/invoices/due-reminders` - Invoices needing reminders
- `POST /api/invoices/{id}/send-reminder` - Log reminder sent
- `GET/POST /api/expenses` - Expense CRUD
- `GET/POST /api/communications` - Communications log

## Test Credentials
- **Admin Email:** admin@campbaraisa.com
- **Admin Password:** testpassword123

## Test Reports
- `/app/test_reports/iteration_9.json` - P1/P2 features (100% pass)
- `/app/test_reports/iteration_8.json` - Billing fixes (100% pass)

## Remaining/Future Items

### Not Yet Implemented
- **Automated Invoice Reminders:** Backend ready, needs cron job or scheduler for actual sending
- **Configurable Kanban Email Triggers:** UI for linking templates to status changes
- **Bulk Actions:** Multi-select operations
- **Installment Plans:** Payment schedule setup

### Working But Could Be Enhanced
- **Data Center:** Could add Groups/Rooms as exportable columns
- **Email Provider Toggle:** Settings has toggle but actual Resend vs Gmail switching needs verification

## Notes
- Gmail/Twilio APIs are MOCKED - add keys via Settings
- Stripe uses test key (sk_test_emergent)
- JotForm API key: 9647d8b76395cd581d0b2b62ffb7e9d3
