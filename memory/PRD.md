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
- **Star Rewards**: Grid/table views, manual star entry, history tracking
- **Team Dashboard**: Department tabs, team cards with member counts
- **Reports**: Attendance, Leave, Employee reports with CSV export

### Employee Module (Completed)
- **Dashboard**: Summary cards, live clock, clock-in/out, quick links
- **Attendance**: Duration filters, status filters, calendar view
- **Leave**: Apply/edit leave requests with document upload
- **Profile**: Read-only profile with password change

### P0 Dashboard Fixes (Completed - Feb 4, 2026)
1. **Stat Card Navigation** - Cards now navigate to correct pages with proper filters
   - Total Research Unit → Team page (Research Unit tab)
   - Total Support Staff → Team page (Support Staff tab)
   - Upcoming Leaves → Leave page (Approved status)
   - Pending Approvals → Leave page (Pending status)
2. **Date Range Filter** - Dashboard now correctly fetches filtered attendance records
3. **Count Logic Fixed** - Late Login + Early Out now counted in Login totals
4. **Dynamic Table Columns** - Table shows different columns based on selected attendance tab

### P1 Admin Fixes (Completed - Feb 4, 2026)
1. **Attendance Module Filters** - Added Department filter, fixed Status options (Login, Completed, Early Out, Late Login, Not Logged)
2. **Leave Type Filter** - Corrected options to match DB values (Sick, Emergency, Preplanned)
3. **Employee Delete/Reactivate Logic** - Delete now deactivates user account, re-creating with same email reactivates with new credentials
4. **Employee Dashboard Count Logic** - Early Out with late login now counted in both Late and Early Out categories

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
- P0 Dashboard Fixes: 100% pass rate
- P1 Admin Fixes: 100% pass rate
- All filters working correctly
- Employee delete/reactivate flow verified

---

## Pending Issues
None - All P0/P1 issues resolved.

## Upcoming Tasks (P1)
1. **Department & Team Creation UI** - Add UI for creating Departments & Teams in Admin module (currently hardcoded)
2. **Star Reward Module Overhaul**
   - Restrict rewards to Research Unit employees
   - Add month range filters and pagination
   - Grid/table view toggle for teams
   - Four different Add Star forms (Performance, Learning, Innovation, Unsafe Methods)
3. **Report Module Enhancements**
   - Section-specific filters (status for Attendance, type/status for Leave)
   - CSV export for all reports

## Future/Backlog (P2)
- Employee Avatar Upload UI
- Clock-in/out widget on Admin Dashboard
- Visual organization chart
- Push notifications
- Mobile-responsive enhancements
- Dark mode support
