# Camp Baraisa - Product Requirements Document

## Original Problem Statement
Build a comprehensive camp management system for Camp Baraisa with a unified camper model, Kanban workflow, billing/invoicing, and communications management.

## Latest Session Update (Feb 3, 2026)

### ✅ BILLING SYSTEM OVERHAUL (QuickBooks-Style)

#### Invoice Features
- **Invoice Numbers**: Auto-generated format INV-YYYY-XXXXX
- **Line Items**: Support multiple fees per invoice
- **Status Workflow**: Draft → Sent → Viewed → Partial → Paid / Overdue
- **Discounts**: Fixed amount or percentage discounts
- **Due Dates**: With automatic overdue detection
- **Portal Tokens**: Unique secure links for parent access

#### Invoice Actions
- **Send Invoice**: Marks as sent, logs communication
- **View Details**: Full invoice breakdown dialog
- **Charge Card**: Stripe checkout with 3.5% fee display
- **Setup Installments**: Split balance into 2-6 payments
- **Delete (Soft)**: Moves to trash, can be restored
- **Restore**: Bring back from trash

#### Installment Plans
- Admin can set up 2-6 installments from backend
- Auto-calculates monthly payment amounts
- Tracks payment status per installment

#### Portal Settings
- **Toggle**: Enable/disable all portal links (for end of season)
- Located in Settings > API Keys tab

### ✅ STRIPE PAYMENT VERIFICATION

#### Webhook Endpoint
- `POST /api/stripe/webhook`
- Handles `checkout.session.completed` events
- Automatically updates invoice status to Paid/Partial
- Creates payment record in database
- Logs activity to camper profile

### ✅ EMAIL MERGE FIELDS FOR PORTAL LINKS

New merge fields available in templates:
- `{{portal_link}}` - Parent portal link
- `{{payment_link}}` - Direct payment link
- `{{invoice_number}}` - Invoice number
- `{{invoice_amount}}` - Invoice amount

### ✅ PREVIOUS FEATURES (Still Working)

#### P1 Features
- Hierarchical Groups (parent → subgroups)
- Sidebar Dropdown for Rooms & Groups
- Smart Search (real-time camper search)
- QuickBooks Export (CSV download)
- Expense Tracking
- Communications Log (categorized Email/SMS)

#### Core Features
- Unified Camper Model
- Kanban Board with 10 columns
- Call/Text/Email buttons
- Clickable camper photos
- Admin management
- Email templates with triggers
- Camper delete to trash

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **Payments**: Stripe (test mode with webhook)

## Key API Endpoints

### Invoices (Enhanced)
- `POST /api/invoices` - Create with line items, number, portal token
- `GET /api/invoices` - List with include_deleted option
- `PUT /api/invoices/{id}` - Update invoice details
- `POST /api/invoices/{id}/send` - Mark as sent
- `DELETE /api/invoices/{id}` - Soft delete
- `GET /api/invoices/trash/list` - List deleted invoices
- `POST /api/invoices/{id}/restore` - Restore from trash
- `POST /api/invoices/{id}/installments` - Setup payment plan
- `POST /api/invoices/{id}/send-reminder` - Log reminder sent

### Stripe & Portal
- `POST /api/stripe/webhook` - Payment verification webhook
- `POST /api/stripe/checkout` - Create checkout session
- `GET /api/portal/check/{token}` - Validate portal access

### Settings
- `GET /api/settings` - Get settings (includes portal_links_enabled)
- `PUT /api/settings` - Update settings

## Test Credentials
- **Admin Email**: admin@campbaraisa.com
- **Admin Password**: testpassword123

## Test Reports
- `/app/test_reports/iteration_10.json` - Billing overhaul (93% backend, 100% frontend)

## Remaining/Future Items

### Not Yet Automated
- **Invoice Reminder Emails**: Backend endpoints exist, needs scheduler for auto-send
- **Kanban Email Triggers**: Template linking UI needed

### Working But Could Be Enhanced
- **Email Sending**: Currently logs only, needs Resend/Gmail API integration
- **Installment Reminders**: Schedule tracking but no auto-reminders

## Notes
- Stripe uses test key (sk_test_emergent)
- Portal links can be disabled via Settings when season ends
- Invoice numbers: INV-YYYY-XXXXX format
- Soft delete pattern used for both campers and invoices
