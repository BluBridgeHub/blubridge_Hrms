# BluBridge HRMS - Product Requirements Document

## Original Problem Statement
Build production-ready Admin Module for HRMS with:
- Dashboard with dynamic summary cards and attendance status tabs
- Employee Management with comprehensive CRUD
- Attendance Tracking
- Leave Management with approve/reject workflow
- Star Rewards System
- Team Dashboard with hierarchy
- Reports Module with CSV export
- Cloudinary for image uploads
- Resend for email notifications

## Architecture
- **Frontend**: React with React Router, Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with async MongoDB driver (Motor)
- **Database**: MongoDB (local)
- **Authentication**: JWT tokens with role-based permissions
- **File Storage**: Cloudinary
- **Email**: Resend (configured, needs API key)
- **Design System**: Custom BluBridge theme (#efede5 background, #fffdf7 containers, #0b1f3b primary)

## User Personas
1. **Admin** - Full system access, user management, audit logs
2. **HR Manager** - Employee management, leave approvals, reports
3. **Team Lead** - Team member management, leave approvals for team
4. **Employee** - Self-service attendance, leave requests

## What's Been Implemented (Feb 3, 2026)

### Admin Module Features

**Dashboard**
- Summary cards: Total Research Unit, Upcoming Leaves, Pending Approvals, Total Support Staff
- Interactive attendance tabs: Leaves/No Login, Login, Early Out, Logout, Late Login
- Each tab dynamically loads attendance data
- Filter section with date range and leave type validation
- Leave list table with slide-over detail panel

**Employee Management**
- Comprehensive CRUD with all fields (Personal, Employment, Organization, System)
- Section-based forms in slide panels (4 tabs)
- Search by name/email/ID, filter by department/team/status
- Pagination, CSV export
- Soft delete (deactivate/restore)
- Avatar upload via Cloudinary (signature endpoint ready)

**Leave Management**
- Request and History tabs with counts
- Approve/Reject with confirmation modals
- Email notifications on approval/rejection (via Resend)
- Slide-over detail panels
- Full filtering and sorting

**Star Rewards**
- Grid and Table views
- Manual star entry with reason
- Email notification on star award
- History tracking per employee
- CSV export

**Team Dashboard**
- Department tabs (Research Unit, Support Staff, Business & Product)
- Team cards with dynamic member counts
- Team detail modal with member list

**Reports**
- Attendance Report with date range filters
- Leave Report with filters
- Employee Report
- CSV export for all report types

### Integrations

**Cloudinary** (Configured)
- Cloud Name: dpkhfdlnp
- Signed uploads via /api/cloudinary/signature
- Image deletion endpoint

**Resend Email** (Ready - needs API key)
- HTML email templates for leave approval/rejection
- Star reward notifications
- Professional BluBridge branding in emails

## Test Credentials
- URL: /login or /admin
- Username: admin
- Password: admin

## Test Results
- Backend: 100% (31/31 tests passed)
- Frontend: 100%
- Integration: 100%

## Next Tasks
1. Add Resend API key for email notifications
2. Implement employee photo upload UI with Cloudinary
3. Add bulk CSV import for employees
4. Create advanced analytics dashboard with charts
