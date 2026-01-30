# BluBridge HRMS - Product Requirements Document

## Original Problem Statement
Migrate WordPress Admin-Based HRMS to a Modern React Enterprise Platform with:
- Employee Management
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
- **Design System**: Custom BluBridge theme (#efede5 background, #fffdf7 containers)

## User Personas
1. **Admin** - Full system access, user management, audit logs
2. **HR Manager** - Employee management, leave approvals, reports
3. **Team Lead** - Team member management, leave approvals for team
4. **Employee** - Self-service attendance, leave requests

## Core Requirements (Static)
- [x] JWT-based authentication with refresh tokens
- [x] Role-based access control (4 roles)
- [x] Dashboard with real-time stats
- [x] Attendance tracking with check-in/out
- [x] Leave management with approval workflow
- [x] Star rewards system
- [x] Team/Department organization
- [x] Reports generation with CSV export
- [x] Audit logging

## What's Been Implemented (Jan 30, 2026)

### Backend (FastAPI)
- JWT authentication with admin/admin test credentials
- CRUD APIs for employees, attendance, leaves, teams, departments
- Star rewards with history tracking
- Reports endpoints (attendance, leaves)
- Audit logging system
- Database seeding with sample data

### Frontend (React)
- Login page with test credentials hint
- Dashboard with stats cards and leave list
- Attendance page with filters and sorting
- Leave Management with Request/History tabs
- Star Reward page with grid/table views and CSV export
- Team Dashboard with department tabs
- Reports page with attendance/leave generation
- Responsive sidebar navigation
- Premium UI with Outfit/Public Sans fonts

### Design Implementation
- Global background: #efede5
- Container background: #fffdf7
- Primary color: #004EEB
- Enterprise-grade UI matching Workday/BambooHR standards

## Test Credentials
- URL: /login or /admin
- Username: admin
- Password: admin

## Prioritized Backlog

### P0 (Critical)
- ✅ Core HRMS functionality implemented

### P1 (High Priority)
- [ ] Employee profile editing with slide panel
- [ ] Bulk attendance import/export
- [ ] Leave balance tracking per employee
- [ ] Email notifications for leave approvals

### P2 (Medium Priority)
- [ ] Payroll module integration
- [ ] Calendar view for leaves
- [ ] Advanced reporting with charts
- [ ] Mobile-responsive improvements

### P3 (Low Priority)
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Integration with external payroll systems

## Next Tasks
1. Add employee profile editing slide panel
2. Implement leave balance tracking
3. Add bulk attendance import functionality
4. Create advanced reporting with Recharts
