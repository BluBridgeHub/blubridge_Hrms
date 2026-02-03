# BluBridge HRMS - Product Requirements Document

## Original Problem Statement
Migrate WordPress Admin-Based HRMS to a Modern React Enterprise Platform with:
- Employee Management (CRUD with comprehensive fields)
- Attendance Tracking
- Leave Management
- Star Rewards System
- Team Dashboard
- Reports Module
- Role-based Access Control (RBAC)

## Architecture
- **Frontend**: React with React Router, Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with async MongoDB driver (Motor)
- **Database**: MongoDB
- **Authentication**: JWT tokens with role-based permissions
- **Design System**: Custom BluBridge theme (#efede5 background, #fffdf7 containers, #0b1f3b primary)

## User Personas
1. **Admin** - Full system access, user management, audit logs
2. **HR Manager** - Employee management, leave approvals, reports
3. **Team Lead** - Team member management, leave approvals for team
4. **Employee** - Self-service attendance, leave requests

## Core Requirements (Static)
- [x] JWT-based authentication with refresh tokens
- [x] Role-based access control (4 roles)
- [x] Dashboard with real-time stats
- [x] **Employee Master Module (NEW)**
- [x] Attendance tracking with check-in/out
- [x] Leave management with approval workflow
- [x] Star rewards system
- [x] Team/Department organization
- [x] Reports generation with CSV export
- [x] Audit logging

## What's Been Implemented (Feb 3, 2026)

### Employee Management Module (NEW)
**Personal Information:**
- Employee ID (auto-generated EMP0001 format)
- Full Name, Official Email, Phone Number
- Gender (Male/Female/Other), Date of Birth

**Employment Information:**
- Date of Joining
- Employment Type (Full-time, Part-time, Contract, Intern)
- Employee Status (Active, Inactive, Resigned)
- Designation, Tier Level (Junior, Mid, Senior, Lead)
- Reporting Manager (relation to employee)

**Organization Structure:**
- Department, Team
- Work Location (Remote, Office, Hybrid)

**HR Configuration:**
- Leave Policy, Shift Type
- Attendance Tracking Enabled (boolean)

**System Access:**
- User Role (Admin, Manager, Employee)
- Login Enabled (boolean)

**Features:**
- Add, Edit, View, Deactivate (soft delete)
- Search by name/email/ID
- Filter by department, team, status, role
- Pagination with page size controls
- CSV export
- Section-based forms in slide panels (4 tabs)

### Design Updates
- Custom logo replaced
- Primary color changed to #0b1f3b
- Emergent badge hidden

## Test Credentials
- URL: /login or /admin
- Username: admin
- Password: admin

## Prioritized Backlog

### P0 (Critical) - DONE
- ✅ Employee Master CRUD
- ✅ Soft delete implementation
- ✅ Dynamic dashboard metrics from employee data

### P1 (High Priority)
- [ ] Employee profile photo upload
- [ ] Bulk employee import/export
- [ ] Leave balance tracking per employee
- [ ] Email notifications for leave approvals

### P2 (Medium Priority)
- [ ] Payroll module integration
- [ ] Calendar view for leaves
- [ ] Advanced reporting with charts
- [ ] Employee documents management

## Next Tasks
1. Add employee photo upload functionality
2. Implement leave balance tracking per policy
3. Create bulk import from CSV
4. Add advanced analytics dashboard
