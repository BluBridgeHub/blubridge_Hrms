# BluBridge HRMS - Product Requirements Document

## Original Problem Statement
Build production-ready Enterprise HRMS with:
- **Admin Module**: Dashboard, Employee Management, Attendance, Leave, Star Rewards, Teams, Reports
- **Employee Module**: Personal Dashboard, Self-service Attendance, Leave Management, Profile View
- Role-based access control (Admin, HR Manager, Team Lead, Employee)

## Architecture
- **Frontend**: React with React Router, Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with async MongoDB driver (Motor)
- **Database**: MongoDB (local)
- **Authentication**: JWT tokens with role-based permissions
- **File Storage**: Cloudinary (image & document uploads)
- **Email**: Resend (configured with API key)
- **Design System**: Custom BluBridge theme (#efede5 background, #fffdf7 containers, #0b1f3b primary)

## User Personas
1. **Admin** - Full system access, user management, audit logs
2. **HR Manager** - Employee management, leave approvals, reports
3. **Team Lead** - Team member management, leave approvals for team
4. **Employee** - Self-service attendance, leave requests, profile view

---

## What's Been Implemented

### Admin Module (Completed)
- **Dashboard**: Summary cards with navigation, attendance status tabs, leave list table, date range filtering
- **Employee Management**: Full CRUD, section-based forms, search/filter, pagination, CSV export, reactivation logic
- **Attendance Tracking**: Daily check-in/out tracking, status management, filters (department, team, status, date range)
- **Leave Management**: Request/approval workflow, approve/reject modals, email notifications, corrected leave type filter
- **Star Rating Module**: COMPLETE REDESIGN (Feb 4, 2026)
  - Employees/Teams toggle tabs
  - Table/Grid view toggle
  - Filters: Team, Month, Search, Apply, Export CSV
  - Secondary filters: From/To month, page size (10/25/50/100)
  - Employees table: Name, Email, Team, Stars, Unsafe, Actions (View/Add)
  - Teams table: Team, Members, Team Stars, Avg, Actions (View members) with expandable rows
  - Teams grid: Cards with team name, members, stars, avg
  - Pagination with Page X of Y, Next, Go to page
  - View History modal showing star history
  - Add Stars modal with 4 types: Performance, Learning, Innovation, Unsafe Methods
  - Restricted to Research Unit employees only
- **Team Dashboard**: Department tabs, team cards with member counts
- **Reports**: Attendance, Leave, Employee reports with CSV export

### Employee Module (Completed)
- **Dashboard**: Summary cards, live clock, clock-in/out, quick links
- **Attendance**: Duration filters, status filters, calendar view
- **Leave**: Apply/edit leave requests with document upload
- **Profile**: Read-only profile with password change

### P0 Dashboard Fixes (Completed - Feb 4, 2026)
1. **Stat Card Navigation** - Cards now navigate to correct pages with proper filters
2. **Date Range Filter** - Dashboard correctly fetches filtered attendance records
3. **Count Logic Fixed** - Late Login + Early Out now counted in Login totals
4. **Dynamic Table Columns** - Table shows different columns based on selected attendance tab

### P1 Admin Fixes (Completed - Feb 4, 2026)
1. **Attendance Module Filters** - Added Department filter, fixed Status options
2. **Leave Type Filter** - Corrected options to match DB values (Sick/Emergency/Preplanned)
3. **Employee Delete/Reactivate Logic** - Delete deactivates user account; re-create reactivates with new credentials
4. **Employee Dashboard Count Logic** - Early Out with late login counted in both categories

---

## Integrations

### Cloudinary (Configured & Active)
- Cloud Name: dpkhfdlnp
- Signed uploads via `/api/cloudinary/signature`
- Used for: Employee avatars, Leave supporting documents

### Resend Email (Configured & Active)
- API Key: Configured in backend/.env
- HTML email templates for leave approval/rejection, welcome emails
- Professional BluBridge branding

---

## Test Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin |
| Employee | user | user |

---

## Test Results (Feb 4, 2026)
- P0 Dashboard Fixes: 100% pass rate (iteration_6.json)
- P1 Admin Fixes: 100% pass rate (iteration_7.json)
- Star Rating Redesign: 100% pass rate (iteration_8.json)

---

## Pending Issues
None - All issues resolved.

## Upcoming Tasks (P1)
1. **Department & Team Creation UI** - Add UI for creating Departments & Teams in Admin module (currently hardcoded)
2. **Report Module Enhancements**
   - Section-specific filters (e.g., status for Attendance, type/status for Leave)
   - CSV export for all reports

## Future/Backlog (P2)
- Employee Avatar Upload UI
- Clock-in/out widget on Admin Dashboard
- Visual organization chart
- Push notifications
- Mobile-responsive enhancements
- Dark mode support
