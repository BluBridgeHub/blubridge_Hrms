# BluBridge HRMS - Product Requirements Document

## Original Problem Statement
Build a complete Human Resource Management System (HRMS) with admin and employee modules, including:
- Employee management with CRUD operations
- Attendance tracking with check-in/out
- Leave management with approval workflows
- Star reward system for performance tracking
- Team management by departments
- Payroll with attendance-based calculations
- Reports generation and export

## Latest Update: Premium UI/UX Redesign (Feb 5, 2026)

### Completed: Full Visual Redesign
**100% Complete** - All pages redesigned with premium  UI/UX

#### Design System
- **Color Palette**: Primary Blue (#004EEB), Background (#efede5), Cards (#fffdf7)
- **Typography**: Outfit for headings, Public Sans for body, JetBrains Mono for numbers
- **Components**: Glassmorphism sidebar, Bento grid layouts, Premium stat cards
- **Charts**: Recharts integration for data visualization

#### Pages Redesigned
1. **Login** - Premium split layout with blue gradient branding
2. **Admin Layout** - Glassmorphism sidebar with active states, search bar, notifications
3. **Employee Layout** - Simplified employee navigation with emerald/teal accent
4. **Dashboard** - Bento grid with stats, Weekly Attendance chart, Attendance Distribution
5. **Employees** - Stats cards, advanced filters, premium table, tabbed forms
6. **Attendance** - Quick stats, sortable table, status badges with icons
7. **Leave** - Request/History tabs, approve/reject workflows
8. **Star Reward** - Amber/gold theme, employees/teams tabs, grid/table views
9. **Team** - Department tabs, team cards grid, member modals
10. **Payroll** - Summary cards, salary chart, attendance/salary view tabs
11. **Reports** - Leave/Attendance report filters and export
12. **Admin Profile** - Premium gradient header with editable fields
13. **Change Password** - Security-focused with password strength indicator
14. **Employee Dashboard** - Clock in/out with working hours chart
15. **Employee Attendance** - Personal attendance history
16. **Employee Leave** - Leave balance and application
17. **Employee Profile** - Personal information display

### Testing Status
- **Testing Agent**: Iteration 15 - 100% Pass Rate (11/11 features)
- **All functionality preserved** - No logic changes made
- **Design Guidelines**: `/app/design_guidelines.json`

## Technology Stack
- **Frontend**: React 18, Tailwind CSS, Shadcn/UI, Recharts
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **Authentication**: JWT tokens

## User Personas
1. **Admin/HR Manager** - Full access to all modules
2. **Team Lead** - Department-level access, approve leaves
3. **Employee** - Personal dashboard, attendance, leave requests

## Core Features (All Implemented)
1. ✅ Authentication with role-based access
2. ✅ Employee CRUD with advanced search/filters
3. ✅ Attendance tracking with check-in/out
4. ✅ Leave management with approval workflow
5. ✅ Star reward system with weekly tracking
6. ✅ Team dashboard by departments
7. ✅ Payroll with LOP calculations
8. ✅ CSV export for reports

## Future Enhancements (Backlog)
- P2: Email notifications for leave approvals
- P2: Calendar view for attendance
- P3: Performance review module
- P3: Document management

## File Structure
```
/app/frontend/src/
├── components/
│   ├── Layout.js          # Admin layout with premium sidebar
│   ├── EmployeeLayout.js  # Employee layout
│   └── ui/                # Shadcn components
├── pages/
│   ├── Login.js           # Premium login page
│   ├── Dashboard.js       # Admin dashboard with charts
│   ├── Employees.js       # Employee management
│   ├── Attendance.js      # Attendance tracking
│   ├── Leave.js           # Leave management
│   ├── StarReward.js      # Star rewards (amber theme)
│   ├── Team.js            # Team dashboard
│   ├── Payroll.js         # Payroll management
│   ├── Reports.js         # Report generation
│   ├── AdminProfile.js    # Admin profile
│   ├── ChangePassword.js  # Password change
│   ├── EmployeeDashboard.js
│   ├── EmployeeAttendance.js
│   ├── EmployeeLeave.js
│   └── EmployeeProfile.js
└── index.css              # Global premium styles
```

## Test Credentials
- **Admin**: admin / admin
