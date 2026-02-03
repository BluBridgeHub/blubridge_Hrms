from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'blubridge-hrms-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="BluBridge HRMS API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== ENUMS ==============

class UserRole:
    ADMIN = "admin"
    HR_MANAGER = "hr_manager"
    TEAM_LEAD = "team_lead"
    EMPLOYEE = "employee"

class EmploymentType:
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    CONTRACT = "Contract"
    INTERN = "Intern"

class EmployeeStatus:
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    RESIGNED = "Resigned"

class TierLevel:
    JUNIOR = "Junior"
    MID = "Mid"
    SENIOR = "Senior"
    LEAD = "Lead"

class WorkLocation:
    REMOTE = "Remote"
    OFFICE = "Office"
    HYBRID = "Hybrid"

# ============== MODELS ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password_hash: str
    name: str
    role: str = UserRole.EMPLOYEE
    employee_id: Optional[str] = None
    department: Optional[str] = None
    team: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: dict

# Comprehensive Employee Model
class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Personal Information
    emp_id: str  # Auto-generated
    full_name: str
    official_email: str
    phone_number: Optional[str] = None
    gender: Optional[str] = None  # Male, Female, Other
    date_of_birth: Optional[str] = None
    
    # Employment Information
    date_of_joining: str
    employment_type: str = EmploymentType.FULL_TIME
    employee_status: str = EmployeeStatus.ACTIVE
    designation: str
    tier_level: str = TierLevel.MID
    reporting_manager_id: Optional[str] = None
    
    # Organization Structure
    department: str
    team: str
    work_location: str = WorkLocation.OFFICE
    
    # HR Configuration
    leave_policy: Optional[str] = "Standard"
    shift_type: Optional[str] = "General"
    attendance_tracking_enabled: bool = True
    
    # System Access
    user_role: str = UserRole.EMPLOYEE
    login_enabled: bool = True
    
    # Legacy fields for compatibility
    avatar: Optional[str] = None
    stars: int = 0
    unsafe_count: int = 0
    
    # Soft delete
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(BaseModel):
    # Personal Information
    full_name: str
    official_email: str
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    
    # Employment Information
    date_of_joining: str
    employment_type: str = EmploymentType.FULL_TIME
    designation: str
    tier_level: str = TierLevel.MID
    reporting_manager_id: Optional[str] = None
    
    # Organization Structure
    department: str
    team: str
    work_location: str = WorkLocation.OFFICE
    
    # HR Configuration
    leave_policy: Optional[str] = "Standard"
    shift_type: Optional[str] = "General"
    attendance_tracking_enabled: bool = True
    
    # System Access
    user_role: str = UserRole.EMPLOYEE
    login_enabled: bool = True

class EmployeeUpdate(BaseModel):
    # Personal Information
    full_name: Optional[str] = None
    official_email: Optional[str] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    
    # Employment Information
    date_of_joining: Optional[str] = None
    employment_type: Optional[str] = None
    employee_status: Optional[str] = None
    designation: Optional[str] = None
    tier_level: Optional[str] = None
    reporting_manager_id: Optional[str] = None
    
    # Organization Structure
    department: Optional[str] = None
    team: Optional[str] = None
    work_location: Optional[str] = None
    
    # HR Configuration
    leave_policy: Optional[str] = None
    shift_type: Optional[str] = None
    attendance_tracking_enabled: Optional[bool] = None
    
    # System Access
    user_role: Optional[str] = None
    login_enabled: Optional[bool] = None

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    emp_name: str
    team: str
    department: str
    date: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    total_hours: Optional[str] = None
    status: str = "Not Logged"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaveRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    emp_name: str
    team: str
    department: str
    leave_type: str
    start_date: str
    end_date: str
    duration: str
    reason: Optional[str] = None
    status: str = "pending"
    approved_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type: str
    start_date: str
    end_date: str
    reason: Optional[str] = None

class StarReward(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    stars: int
    reason: str
    awarded_by: str
    month: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StarRewardCreate(BaseModel):
    employee_id: str
    stars: int
    reason: str

class Team(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    department: str
    lead_id: Optional[str] = None
    member_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Department(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    head_id: Optional[str] = None
    team_count: int = 0

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action: str
    resource: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== HELPERS ==============

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def log_audit(user_id: str, action: str, resource: str, resource_id: str = None, details: str = None):
    log = AuditLog(user_id=user_id, action=action, resource=resource, resource_id=resource_id, details=details)
    doc = log.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.audit_logs.insert_one(doc.copy())

def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    if 'created_at' in doc and not isinstance(doc['created_at'], str):
        doc['created_at'] = doc['created_at'].isoformat()
    if 'updated_at' in doc and not isinstance(doc['updated_at'], str):
        doc['updated_at'] = doc['updated_at'].isoformat()
    if 'deleted_at' in doc and doc['deleted_at'] and not isinstance(doc['deleted_at'], str):
        doc['deleted_at'] = doc['deleted_at'].isoformat()
    if 'timestamp' in doc and not isinstance(doc['timestamp'], str):
        doc['timestamp'] = doc['timestamp'].isoformat()
    return doc

async def generate_emp_id():
    """Generate unique employee ID"""
    count = await db.employees.count_documents({})
    return f"EMP{str(count + 1).zfill(4)}"

# ============== AUTH ROUTES ==============

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = await db.users.find_one({"username": request.username}, {"_id": 0})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account disabled")
    
    token = create_token(user["id"], user["role"])
    await log_audit(user["id"], "login", "auth")
    
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    return {"token": token, "user": user_response}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password_hash"}

# ============== EMPLOYEE MASTER ROUTES ==============

@api_router.get("/employees")
async def get_employees(
    department: Optional[str] = None,
    team: Optional[str] = None,
    status: Optional[str] = None,
    employment_type: Optional[str] = None,
    tier_level: Optional[str] = None,
    work_location: Optional[str] = None,
    search: Optional[str] = None,
    include_deleted: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # Exclude soft-deleted by default
    if not include_deleted:
        query["is_deleted"] = {"$ne": True}
    
    if department and department != "All":
        query["department"] = department
    if team and team != "All":
        query["team"] = team
    if status and status != "All":
        query["employee_status"] = status
    if employment_type and employment_type != "All":
        query["employment_type"] = employment_type
    if tier_level and tier_level != "All":
        query["tier_level"] = tier_level
    if work_location and work_location != "All":
        query["work_location"] = work_location
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"official_email": {"$regex": search, "$options": "i"}},
            {"emp_id": {"$regex": search, "$options": "i"}},
            {"designation": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    total = await db.employees.count_documents(query)
    employees = await db.employees.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    # Add reporting manager name
    for emp in employees:
        if emp.get("reporting_manager_id"):
            manager = await db.employees.find_one({"id": emp["reporting_manager_id"]}, {"_id": 0, "full_name": 1})
            emp["reporting_manager_name"] = manager.get("full_name") if manager else None
    
    return {
        "employees": [serialize_doc(e) for e in employees],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/employees/all")
async def get_all_employees(current_user: dict = Depends(get_current_user)):
    """Get all active employees (for dropdowns)"""
    query = {"is_deleted": {"$ne": True}, "employee_status": EmployeeStatus.ACTIVE}
    employees = await db.employees.find(query, {"_id": 0, "id": 1, "emp_id": 1, "full_name": 1, "department": 1, "team": 1}).to_list(1000)
    return employees

@api_router.get("/employees/stats")
async def get_employee_stats(current_user: dict = Depends(get_current_user)):
    """Get employee statistics for dashboard"""
    base_query = {"is_deleted": {"$ne": True}}
    
    total = await db.employees.count_documents(base_query)
    active = await db.employees.count_documents({**base_query, "employee_status": EmployeeStatus.ACTIVE})
    inactive = await db.employees.count_documents({**base_query, "employee_status": EmployeeStatus.INACTIVE})
    resigned = await db.employees.count_documents({**base_query, "employee_status": EmployeeStatus.RESIGNED})
    
    # By department
    by_department = {}
    departments = await db.departments.find({}, {"_id": 0, "name": 1}).to_list(100)
    for dept in departments:
        count = await db.employees.count_documents({**base_query, "department": dept["name"], "employee_status": EmployeeStatus.ACTIVE})
        by_department[dept["name"]] = count
    
    # By employment type
    by_type = {}
    for emp_type in [EmploymentType.FULL_TIME, EmploymentType.PART_TIME, EmploymentType.CONTRACT, EmploymentType.INTERN]:
        count = await db.employees.count_documents({**base_query, "employment_type": emp_type, "employee_status": EmployeeStatus.ACTIVE})
        by_type[emp_type] = count
    
    # By work location
    by_location = {}
    for loc in [WorkLocation.REMOTE, WorkLocation.OFFICE, WorkLocation.HYBRID]:
        count = await db.employees.count_documents({**base_query, "work_location": loc, "employee_status": EmployeeStatus.ACTIVE})
        by_location[loc] = count
    
    return {
        "total": total,
        "active": active,
        "inactive": inactive,
        "resigned": resigned,
        "by_department": by_department,
        "by_employment_type": by_type,
        "by_work_location": by_location
    }

@api_router.get("/employees/{employee_id}")
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id, "is_deleted": {"$ne": True}}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Add reporting manager details
    if employee.get("reporting_manager_id"):
        manager = await db.employees.find_one({"id": employee["reporting_manager_id"]}, {"_id": 0, "full_name": 1, "emp_id": 1})
        employee["reporting_manager_name"] = manager.get("full_name") if manager else None
        employee["reporting_manager_emp_id"] = manager.get("emp_id") if manager else None
    
    return serialize_doc(employee)

@api_router.post("/employees")
async def create_employee(data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.ADMIN, UserRole.HR_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check for duplicate email
    existing = await db.employees.find_one({"official_email": data.official_email, "is_deleted": {"$ne": True}})
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")
    
    emp_id = await generate_emp_id()
    
    employee = Employee(
        emp_id=emp_id,
        full_name=data.full_name,
        official_email=data.official_email,
        phone_number=data.phone_number,
        gender=data.gender,
        date_of_birth=data.date_of_birth,
        date_of_joining=data.date_of_joining,
        employment_type=data.employment_type,
        designation=data.designation,
        tier_level=data.tier_level,
        reporting_manager_id=data.reporting_manager_id,
        department=data.department,
        team=data.team,
        work_location=data.work_location,
        leave_policy=data.leave_policy,
        shift_type=data.shift_type,
        attendance_tracking_enabled=data.attendance_tracking_enabled,
        user_role=data.user_role,
        login_enabled=data.login_enabled
    )
    
    doc = employee.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.employees.insert_one(doc.copy())
    
    # Update team member count
    await db.teams.update_one({"name": data.team}, {"$inc": {"member_count": 1}})
    
    await log_audit(current_user["id"], "create", "employee", employee.id, f"Created employee: {data.full_name}")
    return serialize_doc(doc)

@api_router.put("/employees/{employee_id}")
async def update_employee(employee_id: str, data: EmployeeUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.ADMIN, UserRole.HR_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    existing = await db.employees.find_one({"id": employee_id, "is_deleted": {"$ne": True}}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check for duplicate email if changing
    if data.official_email and data.official_email != existing.get("official_email"):
        dup = await db.employees.find_one({"official_email": data.official_email, "id": {"$ne": employee_id}, "is_deleted": {"$ne": True}})
        if dup:
            raise HTTPException(status_code=400, detail="Employee with this email already exists")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Handle team change
    old_team = existing.get("team")
    new_team = update_data.get("team")
    if new_team and old_team and new_team != old_team:
        await db.teams.update_one({"name": old_team}, {"$inc": {"member_count": -1}})
        await db.teams.update_one({"name": new_team}, {"$inc": {"member_count": 1}})
    
    result = await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    await log_audit(current_user["id"], "update", "employee", employee_id, f"Updated fields: {list(update_data.keys())}")
    
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    return serialize_doc(employee)

@api_router.delete("/employees/{employee_id}")
async def deactivate_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    """Soft delete - deactivates employee"""
    if current_user["role"] not in [UserRole.ADMIN, UserRole.HR_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    existing = await db.employees.find_one({"id": employee_id, "is_deleted": {"$ne": True}}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_data = {
        "is_deleted": True,
        "deleted_at": datetime.now(timezone.utc).isoformat(),
        "employee_status": EmployeeStatus.INACTIVE,
        "login_enabled": False,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    
    # Update team member count
    await db.teams.update_one({"name": existing.get("team")}, {"$inc": {"member_count": -1}})
    
    await log_audit(current_user["id"], "deactivate", "employee", employee_id, f"Deactivated employee: {existing.get('full_name')}")
    return {"message": "Employee deactivated successfully"}

@api_router.put("/employees/{employee_id}/restore")
async def restore_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    """Restore soft-deleted employee"""
    if current_user["role"] not in [UserRole.ADMIN, UserRole.HR_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    existing = await db.employees.find_one({"id": employee_id, "is_deleted": True}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Deleted employee not found")
    
    update_data = {
        "is_deleted": False,
        "deleted_at": None,
        "employee_status": EmployeeStatus.ACTIVE,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    
    # Update team member count
    await db.teams.update_one({"name": existing.get("team")}, {"$inc": {"member_count": 1}})
    
    await log_audit(current_user["id"], "restore", "employee", employee_id, f"Restored employee: {existing.get('full_name')}")
    
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    return serialize_doc(employee)

# ============== ATTENDANCE ROUTES ==============

@api_router.get("/attendance")
async def get_attendance(
    employee_name: Optional[str] = None,
    team: Optional[str] = None,
    department: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if employee_name:
        query["emp_name"] = {"$regex": employee_name, "$options": "i"}
    if team and team != "All":
        query["team"] = team
    if department and department != "All":
        query["department"] = department
    if from_date:
        query["date"] = {"$gte": from_date}
    if to_date:
        if "date" in query:
            query["date"]["$lte"] = to_date
        else:
            query["date"] = {"$lte": to_date}
    if status and status != "All":
        query["status"] = status
    
    attendance = await db.attendance.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return [serialize_doc(a) for a in attendance]

@api_router.post("/attendance/check-in")
async def check_in(employee_id: str, current_user: dict = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id, "is_deleted": {"$ne": True}}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if not employee.get("attendance_tracking_enabled", True):
        raise HTTPException(status_code=400, detail="Attendance tracking disabled for this employee")
    
    today = datetime.now(timezone.utc).strftime("%d-%m-%Y")
    existing = await db.attendance.find_one({"employee_id": employee_id, "date": today})
    
    if existing and existing.get("check_in"):
        raise HTTPException(status_code=400, detail="Already checked in today")
    
    check_in_time = datetime.now(timezone.utc).strftime("%I:%M %p")
    
    attendance = Attendance(
        employee_id=employee_id,
        emp_name=employee["full_name"],
        team=employee["team"],
        department=employee["department"],
        date=today,
        check_in=check_in_time,
        status="Login"
    )
    doc = attendance.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.attendance.insert_one(doc.copy())
    
    return serialize_doc(doc)

@api_router.post("/attendance/check-out")
async def check_out(employee_id: str, current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%d-%m-%Y")
    attendance = await db.attendance.find_one({"employee_id": employee_id, "date": today}, {"_id": 0})
    
    if not attendance:
        raise HTTPException(status_code=404, detail="No check-in found for today")
    if attendance.get("check_out"):
        raise HTTPException(status_code=400, detail="Already checked out")
    
    check_out_time = datetime.now(timezone.utc).strftime("%I:%M %p")
    
    await db.attendance.update_one(
        {"employee_id": employee_id, "date": today},
        {"$set": {"check_out": check_out_time, "status": "Completed"}}
    )
    
    updated = await db.attendance.find_one({"employee_id": employee_id, "date": today}, {"_id": 0})
    return serialize_doc(updated)

@api_router.get("/attendance/stats")
async def get_attendance_stats(date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if not date:
        date = datetime.now(timezone.utc).strftime("%d-%m-%Y")
    
    # Only count active employees with attendance tracking enabled
    total_employees = await db.employees.count_documents({
        "employee_status": EmployeeStatus.ACTIVE,
        "is_deleted": {"$ne": True},
        "attendance_tracking_enabled": True
    })
    logged_in = await db.attendance.count_documents({"date": date, "status": {"$in": ["Login", "Completed"]}})
    not_logged = total_employees - logged_in
    early_out = await db.attendance.count_documents({"date": date, "status": "Early Out"})
    late_login = await db.attendance.count_documents({"date": date, "status": "Late Login"})
    
    return {
        "total_employees": total_employees,
        "logged_in": logged_in,
        "not_logged": max(0, not_logged),
        "early_out": early_out,
        "late_login": late_login,
        "logout": await db.attendance.count_documents({"date": date, "status": "Completed"})
    }

# ============== LEAVE ROUTES ==============

@api_router.get("/leaves")
async def get_leaves(
    employee_name: Optional[str] = None,
    team: Optional[str] = None,
    department: Optional[str] = None,
    leave_type: Optional[str] = None,
    status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if employee_name:
        query["emp_name"] = {"$regex": employee_name, "$options": "i"}
    if team and team != "All":
        query["team"] = team
    if department and department != "All":
        query["department"] = department
    if leave_type and leave_type != "All":
        query["leave_type"] = leave_type
    if status and status != "All":
        query["status"] = status
    if from_date:
        query["start_date"] = {"$gte": from_date}
    if to_date:
        if "start_date" in query:
            query["start_date"]["$lte"] = to_date
        else:
            query["start_date"] = {"$lte": to_date}
    
    leaves = await db.leaves.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [serialize_doc(l) for l in leaves]

@api_router.post("/leaves")
async def create_leave(data: LeaveRequestCreate, current_user: dict = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": data.employee_id, "is_deleted": {"$ne": True}}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    start = datetime.strptime(data.start_date, "%Y-%m-%d")
    end = datetime.strptime(data.end_date, "%Y-%m-%d")
    duration = (end - start).days + 1
    
    leave = LeaveRequest(
        employee_id=data.employee_id,
        emp_name=employee["full_name"],
        team=employee["team"],
        department=employee["department"],
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        duration=f"{duration} day(s)",
        reason=data.reason
    )
    doc = leave.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.leaves.insert_one(doc.copy())
    
    await log_audit(current_user["id"], "create", "leave", leave.id)
    return serialize_doc(doc)

@api_router.put("/leaves/{leave_id}/approve")
async def approve_leave(leave_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.TEAM_LEAD]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    result = await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {"status": "approved", "approved_by": current_user["id"]}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    await log_audit(current_user["id"], "approve", "leave", leave_id)
    leave = await db.leaves.find_one({"id": leave_id}, {"_id": 0})
    return serialize_doc(leave)

@api_router.put("/leaves/{leave_id}/reject")
async def reject_leave(leave_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.TEAM_LEAD]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    result = await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {"status": "rejected", "approved_by": current_user["id"]}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    await log_audit(current_user["id"], "reject", "leave", leave_id)
    leave = await db.leaves.find_one({"id": leave_id}, {"_id": 0})
    return serialize_doc(leave)

# ============== STAR REWARDS ROUTES ==============

@api_router.get("/star-rewards")
async def get_star_rewards(
    team: Optional[str] = None,
    department: Optional[str] = None,
    month: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": {"$ne": True}, "employee_status": EmployeeStatus.ACTIVE}
    if team and team != "All":
        query["team"] = team
    if department and department != "All":
        query["department"] = department
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"official_email": {"$regex": search, "$options": "i"}}
        ]
    
    employees = await db.employees.find(query, {"_id": 0}).to_list(1000)
    return [serialize_doc(e) for e in employees]

@api_router.post("/star-rewards")
async def add_star_reward(data: StarRewardCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.TEAM_LEAD]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    employee = await db.employees.find_one({"id": data.employee_id, "is_deleted": {"$ne": True}}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    reward = StarReward(
        employee_id=data.employee_id,
        stars=data.stars,
        reason=data.reason,
        awarded_by=current_user["id"],
        month=current_month
    )
    doc = reward.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.star_rewards.insert_one(doc.copy())
    
    new_stars = employee.get("stars", 0) + data.stars
    await db.employees.update_one({"id": data.employee_id}, {"$set": {"stars": new_stars}})
    
    await log_audit(current_user["id"], "award_stars", "star_reward", reward.id)
    return {"message": "Stars awarded", "new_total": new_stars}

@api_router.get("/star-rewards/history/{employee_id}")
async def get_star_history(employee_id: str, current_user: dict = Depends(get_current_user)):
    rewards = await db.star_rewards.find({"employee_id": employee_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [serialize_doc(r) for r in rewards]

# ============== TEAM ROUTES ==============

@api_router.get("/teams")
async def get_teams(department: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if department and department != "All":
        query["department"] = department
    
    teams = await db.teams.find(query, {"_id": 0}).to_list(100)
    
    # Calculate actual member count from employees
    for team in teams:
        count = await db.employees.count_documents({
            "team": team["name"],
            "is_deleted": {"$ne": True},
            "employee_status": EmployeeStatus.ACTIVE
        })
        team["member_count"] = count
    
    return [serialize_doc(t) for t in teams]

@api_router.get("/teams/{team_id}")
async def get_team(team_id: str, current_user: dict = Depends(get_current_user)):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    members = await db.employees.find({
        "team": team["name"],
        "is_deleted": {"$ne": True},
        "employee_status": EmployeeStatus.ACTIVE
    }, {"_id": 0}).to_list(100)
    
    return {"team": serialize_doc(team), "members": [serialize_doc(m) for m in members]}

@api_router.get("/departments")
async def get_departments(current_user: dict = Depends(get_current_user)):
    departments = await db.departments.find({}, {"_id": 0}).to_list(100)
    
    # Calculate actual counts
    for dept in departments:
        emp_count = await db.employees.count_documents({
            "department": dept["name"],
            "is_deleted": {"$ne": True},
            "employee_status": EmployeeStatus.ACTIVE
        })
        team_count = await db.teams.count_documents({"department": dept["name"]})
        dept["employee_count"] = emp_count
        dept["team_count"] = team_count
    
    return [serialize_doc(d) for d in departments]

# ============== DASHBOARD ROUTES ==============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%d-%m-%Y")
    
    # Get counts from employee master
    base_query = {"is_deleted": {"$ne": True}, "employee_status": EmployeeStatus.ACTIVE}
    
    total_research = await db.employees.count_documents({**base_query, "department": "Research Unit"})
    total_support = await db.employees.count_documents({**base_query, "department": "Support Staff"})
    pending_approvals = await db.leaves.count_documents({"status": "pending"})
    upcoming_leaves = await db.leaves.count_documents({
        "status": "approved",
        "start_date": {"$gte": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    })
    
    attendance_stats = await get_attendance_stats(today, current_user)
    employee_stats = await get_employee_stats(current_user)
    
    return {
        "total_research_unit": total_research,
        "total_support_staff": total_support,
        "pending_approvals": pending_approvals,
        "upcoming_leaves": upcoming_leaves,
        "attendance": attendance_stats,
        "employee_stats": employee_stats
    }

@api_router.get("/dashboard/leave-list")
async def get_dashboard_leave_list(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%d-%m-%Y")
    
    # Get employees not logged in today
    all_employees = await db.employees.find({
        "employee_status": EmployeeStatus.ACTIVE,
        "is_deleted": {"$ne": True},
        "attendance_tracking_enabled": True
    }, {"_id": 0}).to_list(1000)
    
    logged_today = await db.attendance.find({"date": today}, {"_id": 0}).to_list(1000)
    logged_ids = {a["employee_id"] for a in logged_today}
    
    not_logged = [e for e in all_employees if e["id"] not in logged_ids]
    
    result = []
    for emp in not_logged[:10]:
        result.append({
            "emp_name": emp["full_name"],
            "team": emp["team"],
            "department": emp["department"],
            "leave_type": "-",
            "date": today,
            "status": "Not Login"
        })
    
    return result

# ============== REPORTS ROUTES ==============

@api_router.get("/reports/attendance")
async def get_attendance_report(
    from_date: str,
    to_date: str,
    department: Optional[str] = None,
    team: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"date": {"$gte": from_date, "$lte": to_date}}
    if team and team != "All":
        query["team"] = team
    if department and department != "All":
        query["department"] = department
    
    records = await db.attendance.find(query, {"_id": 0}).to_list(10000)
    return [serialize_doc(r) for r in records]

@api_router.get("/reports/leaves")
async def get_leave_report(
    from_date: str,
    to_date: str,
    department: Optional[str] = None,
    team: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"start_date": {"$gte": from_date, "$lte": to_date}}
    if team and team != "All":
        query["team"] = team
    if department and department != "All":
        query["department"] = department
    
    records = await db.leaves.find(query, {"_id": 0}).to_list(10000)
    return [serialize_doc(r) for r in records]

@api_router.get("/reports/employees")
async def get_employee_report(
    department: Optional[str] = None,
    team: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_deleted": {"$ne": True}}
    if department and department != "All":
        query["department"] = department
    if team and team != "All":
        query["team"] = team
    if status and status != "All":
        query["employee_status"] = status
    
    records = await db.employees.find(query, {"_id": 0}).to_list(10000)
    return [serialize_doc(r) for r in records]

# ============== AUDIT LOGS ==============

@api_router.get("/audit-logs")
async def get_audit_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    resource: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if user_id:
        query["user_id"] = user_id
    if action:
        query["action"] = action
    if resource:
        query["resource"] = resource
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).to_list(500)
    return [serialize_doc(l) for l in logs]

# ============== CONFIG/LOOKUP ROUTES ==============

@api_router.get("/config/employment-types")
async def get_employment_types():
    return [EmploymentType.FULL_TIME, EmploymentType.PART_TIME, EmploymentType.CONTRACT, EmploymentType.INTERN]

@api_router.get("/config/employee-statuses")
async def get_employee_statuses():
    return [EmployeeStatus.ACTIVE, EmployeeStatus.INACTIVE, EmployeeStatus.RESIGNED]

@api_router.get("/config/tier-levels")
async def get_tier_levels():
    return [TierLevel.JUNIOR, TierLevel.MID, TierLevel.SENIOR, TierLevel.LEAD]

@api_router.get("/config/work-locations")
async def get_work_locations():
    return [WorkLocation.REMOTE, WorkLocation.OFFICE, WorkLocation.HYBRID]

@api_router.get("/config/user-roles")
async def get_user_roles():
    return [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.TEAM_LEAD, UserRole.EMPLOYEE]

# ============== SEED DATA ==============

@api_router.post("/seed")
async def seed_database():
    # Check if already seeded
    admin_exists = await db.users.find_one({"username": "admin"})
    if admin_exists:
        return {"message": "Database already seeded"}
    
    # Create admin user
    admin = User(
        username="admin",
        email="admin@blubridge.com",
        password_hash=hash_password("admin"),
        name="System Admin",
        role=UserRole.ADMIN,
        department="Administration"
    )
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc.copy())
    
    # Create departments
    departments = [
        {"id": str(uuid.uuid4()), "name": "Research Unit", "team_count": 8},
        {"id": str(uuid.uuid4()), "name": "Support Staff", "team_count": 2},
        {"id": str(uuid.uuid4()), "name": "Business & Product", "team_count": 3}
    ]
    await db.departments.insert_many(departments)
    
    # Create teams
    teams = [
        {"id": str(uuid.uuid4()), "name": "Compiler - Auto Differentiation", "department": "Research Unit", "member_count": 0},
        {"id": str(uuid.uuid4()), "name": "Compiler - Computation Graph", "department": "Research Unit", "member_count": 0},
        {"id": str(uuid.uuid4()), "name": "Data", "department": "Research Unit", "member_count": 0},
        {"id": str(uuid.uuid4()), "name": "Framework - Graph & Auto-differentiation", "department": "Research Unit", "member_count": 0},
        {"id": str(uuid.uuid4()), "name": "Framework - parallelism", "department": "Research Unit", "member_count": 0},
        {"id": str(uuid.uuid4()), "name": "Framework - Tensor & Ops", "department": "Research Unit", "member_count": 0},
        {"id": str(uuid.uuid4()), "name": "Framework - Quantz", "department": "Research Unit", "member_count": 0},
        {"id": str(uuid.uuid4()), "name": "Tokenizer", "department": "Research Unit", "member_count": 0},
        {"id": str(uuid.uuid4()), "name": "Administration", "department": "Support Staff", "member_count": 0}
    ]
    await db.teams.insert_many(teams)
    
    # Create employees with full schema
    employees_data = [
        {"full_name": "Adhitya Charan", "official_email": "adhitya.blubridge@evoplus.in", "team": "Framework - parallelism", "stars": -11, "unsafe_count": 3, "gender": "Male", "tier_level": TierLevel.MID},
        {"full_name": "Adwaid Suresh", "official_email": "suresh.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": -2, "unsafe_count": 0, "gender": "Male", "tier_level": TierLevel.SENIOR},
        {"full_name": "Amarnath V S", "official_email": "amarnath.blubridge@evoplus.in", "team": "Framework - Quantz", "stars": -5, "unsafe_count": 2, "gender": "Male", "tier_level": TierLevel.MID},
        {"full_name": "Anuj Kumar", "official_email": "anuj.blubridge@evoplus.in", "team": "Framework - parallelism", "stars": -11, "unsafe_count": 3, "gender": "Male", "tier_level": TierLevel.JUNIOR},
        {"full_name": "Aravind P", "official_email": "aravind.blubridge@evoplus.in", "team": "Tokenizer", "stars": -5, "unsafe_count": 2, "gender": "Male", "tier_level": TierLevel.MID},
        {"full_name": "Aravind S", "official_email": "aravinds.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": -5, "unsafe_count": 2, "gender": "Male", "tier_level": TierLevel.SENIOR},
        {"full_name": "Chaithanya", "official_email": "chaithanya.blubridge@evoplus.in", "team": "Data", "stars": 0, "unsafe_count": 0, "gender": "Female", "tier_level": TierLevel.MID},
        {"full_name": "Dinesh", "official_email": "dinesh.blubridge@evoplus.in", "team": "Framework - parallelism", "stars": 2, "unsafe_count": 0, "gender": "Male", "tier_level": TierLevel.LEAD},
        {"full_name": "Gowtham", "official_email": "gowtham.blubridge@evoplus.in", "team": "Data", "stars": 5, "unsafe_count": 0, "gender": "Male", "tier_level": TierLevel.SENIOR},
        {"full_name": "Gowthamkumar", "official_email": "gowthamkumar.blubridge@evoplus.in", "team": "Framework - Tensor & Ops", "stars": 3, "unsafe_count": 0, "gender": "Male", "tier_level": TierLevel.MID},
        {"full_name": "Grishma", "official_email": "grishma.blubridge@evoplus.in", "team": "Framework - Graph & Auto-differentiation", "stars": 1, "unsafe_count": 0, "gender": "Female", "tier_level": TierLevel.JUNIOR},
        {"full_name": "Hamza", "official_email": "hamza.blubridge@evoplus.in", "team": "Administration", "stars": 0, "unsafe_count": 0, "gender": "Male", "tier_level": TierLevel.MID},
        {"full_name": "Harshini", "official_email": "harshini.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": 2, "unsafe_count": 0, "gender": "Female", "tier_level": TierLevel.JUNIOR},
        {"full_name": "Jenifa", "official_email": "jenifa.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": 4, "unsafe_count": 0, "gender": "Female", "tier_level": TierLevel.MID},
        {"full_name": "Jona", "official_email": "jona.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": 1, "unsafe_count": 0, "gender": "Male", "tier_level": TierLevel.SENIOR},
        {"full_name": "Kota", "official_email": "kota.blubridge@evoplus.in", "team": "Framework - Tensor & Ops", "stars": -3, "unsafe_count": 1, "gender": "Male", "tier_level": TierLevel.MID},
        {"full_name": "Pragathi V", "official_email": "pragathi.blubridge@evoplus.in", "team": "Administration", "stars": 0, "unsafe_count": 0, "gender": "Female", "tier_level": TierLevel.JUNIOR},
        {"full_name": "Suresh K", "official_email": "sureshk.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": 2, "unsafe_count": 0, "gender": "Male", "tier_level": TierLevel.LEAD},
    ]
    
    for i, emp_data in enumerate(employees_data):
        dept = "Support Staff" if emp_data["team"] == "Administration" else "Research Unit"
        emp = Employee(
            emp_id=f"EMP{str(i + 1).zfill(4)}",
            full_name=emp_data["full_name"],
            official_email=emp_data["official_email"],
            gender=emp_data.get("gender"),
            department=dept,
            team=emp_data["team"],
            designation="Software Engineer",
            tier_level=emp_data.get("tier_level", TierLevel.MID),
            date_of_joining="2024-01-15",
            employment_type=EmploymentType.FULL_TIME,
            employee_status=EmployeeStatus.ACTIVE,
            work_location=WorkLocation.OFFICE,
            stars=emp_data["stars"],
            unsafe_count=emp_data["unsafe_count"]
        )
        doc = emp.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.employees.insert_one(doc.copy())
    
    # Create sample attendance
    today = datetime.now(timezone.utc).strftime("%d-%m-%Y")
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    
    for emp in employees[:15]:
        check_in_hour = 8 + (hash(emp["id"]) % 3)
        check_in_min = hash(emp["id"]) % 60
        check_in_time = f"{str(check_in_hour).zfill(2)}:{str(check_in_min).zfill(2)} AM"
        
        att = Attendance(
            employee_id=emp["id"],
            emp_name=emp["full_name"],
            team=emp["team"],
            department=emp["department"],
            date=today,
            check_in=check_in_time,
            status="Login"
        )
        doc = att.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.attendance.insert_one(doc.copy())
    
    return {"message": "Database seeded successfully"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
