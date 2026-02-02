# Camp Baraisa Management System - PRD

## Overview
A comprehensive camp management system for Camp Baraisa - a Bein Hazmanim (Jewish holiday camp) experience. The system replaces traditional Jotform-based registration with an integrated admin dashboard and parent portal.

## Branding
- **Name**: Camp Baraisa
- **Tagline**: "The Ultimate Bein Hazmanim Experience - For the serious Ben Torah."
- **Primary Color**: Orange (#E85D04)
- **Contact**:
  - Phone: 848.BAR.AISA (227-2472)
  - Email: office@campbaraisa.com
  - Address: 665 Princeton Ave Apt. 206, Lakewood, NJ 08701

---

## Completed Features (Feb 2026)

### ✅ Admin Dashboard
- **Authentication**: JWT-based login/register with admin approval system
- **Dashboard Overview**: Stats for campers, invoiced amounts, collections, outstanding
- **Sidebar Navigation**: Overview, Campers, Billing, Kanban, Communications, Rooms & Groups, Financial, Data Center, Settings
- **Search Bar**: Present in top navigation

### ✅ Kanban Board (Enhanced)
- **10 Status Columns**: Applied, Accepted, Check/Unknown, Invoice Sent, Payment Plan Request, Payment Plan Running, Sending Check, Partial Paid, Partial Paid & Committed, Paid in Full
- **Enhanced Cards**:
  - Bigger tiles with more information
  - Camper photo placeholder
  - Name, Grade, Yeshiva info
  - Parent name and contact details
  - Due date display (with urgency indicator)
  - Quick action buttons: Call, SMS, Email
- **Drag & Drop**: Move campers between statuses
- **Email Confirmation Dialog**: When moving to Accepted/Invoice Sent/Paid in Full, shows email preview before sending

### ✅ Camper Management
- **Clickable Rows**: Click anywhere on row to view camper details
- **Photo Support**: Field added for camper photos
- **Comprehensive Fields**: All fields from original Jotform including yeshiva, grade, emergency contacts, medical info
- **Filters**: Search, Grade filter, Status filter

### ✅ Data Center (Replaced Exports)
- **Reports**: Campers, Parents tabs
- **Search & Filter**: Search across all fields, status filter for campers
- **Column Customization**: Toggle columns on/off
- **Sorting**: Click columns to sort
- **Export Options**: CSV, PDF (coming soon)
- **Clickable Rows**: Navigate to camper details

### ✅ Rooms & Groups Management (NEW)
- **5 Group Types**:
  - Shiur/Class (purple icon)
  - Transportation (blue icon)
  - Trip Group (green icon)
  - Room/Bunk (orange icon)
  - Custom Group (gray icon)
- **Features**:
  - Create groups with name, type, capacity, description
  - Assign/unassign campers with filters (status, yeshiva, grade)
  - "Show only ungrouped" filter
  - Export group rosters to CSV
  - Edit and delete groups

### ✅ Dynamic Email/SMS Templates
- **Template Types**: Email and SMS
- **Merge Fields**: 
  - Parent: title, first/last name, cell, email, address
  - Camper: first/last name, grade, yeshiva, status
  - Billing: amount due, total balance, due date, payment link
  - Camp: name, email, phone
- **Click-to-Insert**: Merge field toolbar in editor
- **Automatic Triggers**: ⚡ Lightning bolt icon for auto templates
  - When camper is Accepted
  - When paid in full
  - Payment reminder (auto)
  - When invoice is sent
- **Preview**: See template with sample/real data before sending

### ✅ Activity Logging (NEW)
- **Tracks**: Status changes, emails queued, group assignments
- **Records**: Which admin performed the action
- **Notes**: Add notes to campers with activity history

### ✅ Parent Portal
- **Secure Access**: Unique URL with access token (no login required)
- **Header**: Bryce Canyon background image with Camp Baraisa branding
- **Balance Summary**: Total Balance, Total Paid, Outstanding
- **Camper List**: Shows registered campers with status
- **Invoices**: View invoices with due dates, make payments
- **Payment History**: Track all payments
- **3.5% Credit Card Fee**: Clearly shown before payment with breakdown
- **Footer**: Contact info (848.BAR.AISA, email, address), copyright

### ✅ Login Page
- **Utah/Bryce Canyon Background**
- **Admin Portal**: Sign In / Request Access tabs
- **Contact Info Section**: For non-admins to reach camp
- **Admin Approval**: New accounts require approval

### ✅ Settings Page (Enhanced)
- **General**: Camp name, email, phone
- **Integrations**:
  - QuickBooks, Gmail, Twilio toggles
  - **API Keys Section** (NEW):
    - Gmail API Credentials
    - Twilio SMS (Account SID, Auth Token, Phone Number)
    - Jotform (API Key, Form ID)
    - Stripe (Secret Key, Publishable Key)
- **Templates**: Email/SMS template management with auto indicators
- **Admins**: View pending approvals, current admin info

---

## Backend API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Login
- `GET /api/auth/pending` - Get pending admin approvals
- `POST /api/auth/approve/{admin_id}` - Approve admin

### Campers
- `GET /api/campers` - List all campers
- `POST /api/campers` - Create camper
- `GET /api/campers/{id}` - Get camper details
- `PUT /api/campers/{id}` - Update camper
- `PUT /api/campers/{id}/status` - Update camper status (with activity log)

### Parents
- `GET /api/parents` - List all parents
- `POST /api/parents` - Create parent
- `GET /api/parents/{id}` - Get parent details

### Groups (NEW)
- `GET /api/groups` - List all groups (filter by type)
- `POST /api/groups` - Create group
- `GET /api/groups/{id}` - Get group details
- `PUT /api/groups/{id}` - Update group
- `DELETE /api/groups/{id}` - Delete group
- `PUT /api/groups/{id}/assign` - Assign camper to group
- `PUT /api/groups/{id}/unassign` - Remove camper from group

### Activity Log (NEW)
- `GET /api/activity/{entity_type}/{entity_id}` - Get activity log
- `POST /api/activity/{entity_type}/{entity_id}/note` - Add note

### Payments (NEW)
- `GET /api/payment/calculate-fee` - Calculate 3.5% CC fee

### Billing
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment

### Kanban
- `GET /api/kanban` - Get board data

### Search
- `GET /api/search?q=` - Global search (campers + parents)

### Templates
- `GET /api/email-templates` - List templates
- `POST /api/email-templates` - Create template
- `PUT /api/email-templates/{id}` - Update template
- `DELETE /api/email-templates/{id}` - Delete template
- `GET /api/template-merge-fields` - Get available merge fields
- `POST /api/templates/preview` - Preview template with data

### Portal
- `GET /api/portal/{token}` - Get parent portal data

---

## Pending Tasks

### P1 - High Priority
- [ ] Stripe Integration for payments (test key available)
- [ ] Gmail Integration for automated emails (API key input ready)
- [ ] Twilio Integration for SMS (API key input ready)
- [ ] Public Application Form (replace Jotform)
- [ ] File upload for camper photos
- [ ] AI-powered global search

### P2 - Medium Priority
- [ ] Invoice auto-reminders (15 days, due date, +3/7/15 days after)
- [ ] Custom portal URLs (lastname + unique ID)
- [ ] Admin notification email when new user signs up
- [ ] PDF export with camper photos (card layout)
- [ ] Combine Parents + Campers into "Families" view

### P3 - Future
- [ ] QuickBooks integration
- [ ] Payment plans management
- [ ] Saved report configurations in Data Center
- [ ] Comprehensive communications hub
- [ ] Internal charging (no fee) option

---

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Recharts
- **Backend**: FastAPI, Motor (MongoDB async driver)
- **Database**: MongoDB
- **Authentication**: JWT tokens
- **Payments**: Stripe (pending integration)

---

## Test Credentials
- **Admin**: admin@campbaraisa.com / testpassword123
- **Parent Portal**: /portal/zuiU-lz6QwEs4hTwL4vpBNQLa_mIKMgEKrqZZD176O0

---

Last Updated: February 2, 2026
