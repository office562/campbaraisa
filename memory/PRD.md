# Camp Baraisa Management System - PRD

## Original Problem Statement
Build a complete camp management system for Camp Baraisa (Jewish summer camp in Utah) with:
- Admin Portal with login and dashboard
- Campers management with Hebrew name support
- Billing system with Stripe integration
- Kanban board for enrollment pipeline
- Communications hub for email/SMS tracking
- Room assignments
- Financial tracking with expense management
- Data exports
- Settings panel with integrations
- Parent Portal with direct link access (no login)

## User Personas
1. **Camp Administrator** - Manages all aspects of camp operations
2. **Office Staff** - Day-to-day camper and billing management  
3. **Parent/Guardian** - Views their children's status and makes payments

## Core Requirements (Static)
- JWT-based authentication with admin approval for new users
- 10-stage kanban enrollment pipeline
- Stripe payment integration (test mode)
- Automated email triggers on status changes (Accepted, Paid in Full)
- Hebrew text support for camper names
- Export functionality for campers, billing, and parents
- Mobile-responsive design

## What's Been Implemented (2026-02-02)
### Backend
- FastAPI server with 20+ API endpoints
- MongoDB database integration
- JWT authentication with admin approval system
- Full CRUD for: Parents, Campers, Invoices, Payments, Communications, Rooms, Expenses
- Kanban status management with automated email queuing
- Stripe checkout integration (test mode)
- Financial summary and dashboard stats APIs
- CSV export endpoints
- Settings management

### Frontend
- React 19 with Tailwind CSS and Shadcn/UI components
- Admin login with registration request flow
- Dashboard with stats, status summary, recent applications
- Campers table with grade/yeshiva filters, Hebrew name support
- Camper detail view with parent info and portal link
- Billing hub with invoice creation and payment recording
- Drag-and-drop Kanban board with 10 status columns
- Communications center with compose functionality
- Room assignment board
- Financial overview with expense tracking
- Export center for CSV downloads
- Settings panel with integrations toggles
- Parent Portal with payment functionality

### Design
- Camp Baraisa branding (orange #E85D04, dark #2D241E, bone #F8F5F2)
- Utah red rock imagery
- Hebrew font support (Heebo)
- Barlow Condensed headings

## Prioritized Backlog
### P0 (Critical) - DONE
- [x] Admin authentication
- [x] Dashboard overview
- [x] Camper management
- [x] Billing/invoicing
- [x] Kanban pipeline
- [x] Parent portal

### P1 (High Priority)
- [ ] Gmail API integration for actual email sending
- [ ] Twilio SMS integration
- [ ] QuickBooks sync implementation

### P2 (Medium Priority)
- [ ] Payment plan/installment scheduling
- [ ] Document upload for parents
- [ ] Questionnaire system
- [ ] Application form (Jotform-style)

### P3 (Low Priority)
- [ ] Custom domain setup (admin.campbaraisa.com)
- [ ] Advanced reporting
- [ ] Bulk email/SMS campaigns
- [ ] Credit card/bank linking for expenses

## Next Tasks
1. Configure Gmail API credentials for live email sending
2. Set up Twilio for SMS notifications
3. Implement payment plan scheduling feature
4. Add document upload functionality
5. Create parent application form
