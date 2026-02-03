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
- **Email**: Resend (configured, needs API key for production)
- **Design System**: Custom BluBridge theme (#efede5 background, #fffdf7 containers, #0b1f3b primary)

## User Personas
1. **Admin** - Full system access, user management, audit logs
2. **HR Manager** - Employee management, leave approvals, reports
3. **Team Lead** - Team member management, leave approvals for team
4. **Employee** - Self-service attendance, leave requests, profile view

---

## What's Been Implemented

### Admin Module (Completed)
- **Dashboard**: Summary cards, attendance status tabs, leave list table
- **Employee Management**: Full CRUD, section-based forms, search/filter, pagination, CSV export
- **Attendance Tracking**: Daily check-in/out tracking, status management
- **Leave Management**: Request/approval workflow, approve/reject modals, email notifications
- **Star Rewards**: Grid/table views, manual star entry, history tracking
- **Team Dashboard**: Department tabs, team cards with member counts
- **Reports**: Attendance, Leave, Employee reports with CSV export

### Employee Module (Completed - Feb 3, 2026)

#### 1. Employee Dashboard (`/employee/dashboard`)
- Greeting with employee name
- Current day and date display
- Summary cards:
  - Active Days (clickable → Attendance with Present filter)
  - Inactive Days (clickable → Attendance with Absent filter)
  - Late Arrivals (clickable → Attendance with Late filter)
  - Early Out (clickable → Attendance with Early Out filter)
- Live clock panel showing current time (updates every second)
- Today's Status showing Login time, Logout time, Hours Today
- Clock In/Clock Out buttons (context-aware)
- Quick Links: Apply Leave, Attendance, View Profile

#### 2. Employee Attendance (`/employee/attendance`)
- Duration filter: This Week, Last Week, This Month, Last Month, Custom
- Date range selectors (for Custom duration)
- Status filter: All, Present, Late, Early Out, Absent, Leave, NA
- Filter and Reset buttons
- Auto-filter when navigating from Dashboard cards
- Attendance records table: Date, Day, Login, Logout, Total Hours, Status
- Correct status logic:
  - Sunday → "Sunday" status
  - Future dates → "NA" status
  - No attendance record → "Absent" status
  - Approved leave → "Leave" status

#### 3. Employee Leave (`/employee/leave`)
- **Leave Requests Panel**: Upcoming/current leave requests (Approved/Rejected/Pending)
- **Leave History Panel**: Past leave requests
- **Apply Leave Modal**:
  - Leave Type dropdown: Sick, Emergency, Preplanned
  - Leave Date picker (min: tomorrow)
  - Duration dropdown: First Half, Second Half, Full Day
  - Supporting Document upload (PDF/JPG/PNG, 200-500KB via Cloudinary)
  - Reason textarea (min 10 characters)
  - Cancel and Apply Leave buttons
  - Validation for all required fields

#### 4. Employee Profile (`/employee/profile`)
- Profile header with avatar, name, designation, badges (Employee ID, Status, Tier Level)
- Star rewards display
- Read-only sections:
  - Personal Information: Full Name, Email, Phone, Gender, DOB
  - Employment Information: Designation, Employment Type, Date of Joining, Work Location, Tier Level
  - Organization: Department, Team, Reporting Manager
  - HR Configuration: Leave Policy, Shift Type, Attendance Tracking status

### Role-Based Routing
- Employee users (role: "employee") → `/employee/dashboard`
- Admin/HR/Team Lead users → `/dashboard`
- Protected routes prevent cross-role access
- Automatic redirect on unauthorized access

### Backend API Endpoints (Employee Portal)
- `GET /api/employee/dashboard` - Dashboard data with summary and today's status
- `GET /api/employee/profile` - Employee profile details
- `GET /api/employee/attendance` - Attendance records with filters
- `POST /api/employee/clock-in` - Self clock-in
- `POST /api/employee/clock-out` - Self clock-out  
- `GET /api/employee/leaves` - Leave requests and history
- `POST /api/employee/leaves/apply` - Apply for leave with document upload

---

## Integrations

### Cloudinary (Configured & Active)
- Cloud Name: dpkhfdlnp
- Signed uploads via `/api/cloudinary/signature`
- Used for: Employee avatars, Leave supporting documents
- Image deletion endpoint available

### Resend Email (Ready - needs API key)
- HTML email templates for leave approval/rejection
- Star reward notifications
- Professional BluBridge branding in emails

---

## Test Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin |
| Employee | user | user |

The employee user is linked to **Adhitya Charan (EMP0001)** in the seed data.

---

## Test Results (Feb 3, 2026)
- Backend: 100% pass rate
- Frontend: 100% pass rate
- All 49 tests passed including:
  - Role-based authentication
  - Dashboard functionality
  - Attendance tracking
  - Leave management
  - Profile display
  - Cross-role access prevention

---

## Next Tasks
1. **P1**: Add Resend API key for email notifications
2. **P2**: Implement employee photo upload UI with Cloudinary
3. **P2**: Add bulk CSV import for employees
4. **P2**: Advanced analytics dashboard with charts

## Future/Backlog
- Clock-in/out widget on Admin Dashboard
- Visual organization chart
- Push notifications
- Mobile-responsive enhancements
- Dark mode support
