# BluBridge HRMS - Product Requirements Document

## Original Problem Statement
Build production-ready Enterprise HRMS with:
- **Admin Module**: Dashboard, Employee Management, Attendance, Leave, Star Rewards, Teams, Reports, Payroll
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
1. **Admin** - Full system access, user management, audit logs, payroll management
2. **HR Manager** - Employee management, leave approvals, reports, payroll
3. **Team Lead** - Team member management, leave approvals for team
4. **Employee** - Self-service attendance, leave requests, profile view

---

## What's Been Implemented

### Admin Module (Completed)
- **Dashboard**: Summary cards with navigation, attendance status tabs, leave list table, date range filtering
- **Employee Management**: Full CRUD, section-based forms, search/filter, pagination, CSV export, reactivation logic
- **Attendance Tracking**: Daily check-in/out tracking, status management, filters (department, team, status, date range), LOP detection
- **Leave Management**: Request/approval workflow, approve/reject modals, email notifications, corrected leave type filter
- **Star Rating Module**: COMPLETE REDESIGN (Feb 4, 2026)
- **Team Dashboard**: Department tabs, team cards with member counts
- **Reports**: Attendance, Leave, Employee reports with CSV export
- **Payroll Module**: NEW (Feb 5, 2026) - Full payroll management with LOP calculations

### Employee Module (Completed)
- **Dashboard**: Summary cards, live clock, clock-in/out, quick links
- **Attendance**: Duration filters, status filters, calendar view
- **Leave**: Apply/edit leave requests with document upload
- **Profile**: Read-only profile with password change

### Shift Rules & LOP System (NEW - Feb 5, 2026)
**Backend Implementation:**
- `SHIFT_DEFINITIONS` with 6 shift types:
  - General: 10:00 AM - 9:00 PM (11 hours)
  - Morning: 6:00 AM - 2:00 PM (8 hours)
  - Evening: 2:00 PM - 10:00 PM (8 hours)
  - Night: 10:00 PM - 6:00 AM (8 hours)
  - Flexible: 8 hours required, no fixed time
  - Custom: Admin-defined login/logout times
  
**Strict LOP Rules (No Grace Period):**
- Late Login (even 1 minute) = Loss of Pay
- Early Logout (even 1 minute) = Loss of Pay
- Insufficient Hours = Loss of Pay
- All rules enforced in backend, frontend is display-only

**New API Endpoints:**
- `GET /api/config/shifts` - Get all shift configurations
- `GET /api/config/shift/{type}` - Get specific shift details
- `PUT /api/employees/{id}/shift` - Update employee shift (supports Custom)
- `PUT /api/employees/{id}/salary` - Update employee monthly salary
- `GET /api/payroll?month=YYYY-MM` - Get payroll for all employees
- `GET /api/payroll/{employee_id}?month=YYYY-MM` - Get individual payroll
- `GET /api/payroll/summary/{month}` - Get payroll summary

**Payroll Calculation Formula:**
- Per Day Salary = Monthly Salary / 30
- LOP Deduction = Per Day Salary × (LOP Days + Absent Days)
- Net Salary = Monthly Salary - LOP Deduction

**Frontend Updates:**
- Payroll.js: Summary cards, Attendance View (calendar grid), Salary View (table with LOP columns)
- Employees.js: Custom Shift option with login/logout time inputs, Monthly Salary field
- Attendance.js: LOP status filter, expected times display, LOP reason display

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

## Test Results
- P0 Dashboard Fixes: 100% pass rate (iteration_6.json)
- P1 Admin Fixes: 100% pass rate (iteration_7.json)
- Star Rating Redesign: 100% pass rate (iteration_8.json)
- Shift Rules & Payroll: 100% pass rate (iteration_9.json) - Feb 5, 2026
- Star Rating Logic & Theme Fixes: 100% pass rate (iteration_10.json) - Feb 5, 2026
- Star Rating View Members & Check-In Sync: 100% pass rate (iteration_11.json) - Feb 5, 2026
- Date Picker & LOP 0.5 Day Calculation: 100% pass rate (iteration_12.json) - Feb 5, 2026

---

## Pending Issues
None - All issues resolved.

## Upcoming Tasks (P1)
1. **Department & Team Creation UI** - Add UI for creating Departments & Teams in Admin module (currently hardcoded)
2. **Responsive Layout Verification** - Verify Dashboard and Team pages at various zoom levels

## Future/Backlog (P2)
- Employee Avatar Upload UI
- Clock-in/out widget on Admin Dashboard
- Visual organization chart
- Push notifications
- Mobile-responsive enhancements
- Dark mode support
- Payroll PDF export
- Payslip generation
