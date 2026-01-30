from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
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

# ============== MODELS ==============

class UserRole:
    ADMIN = "admin"
    HR_MANAGER = "hr_manager"
    TEAM_LEAD = "team_lead"
    EMPLOYEE = "employee"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password_hash: str
    name: str
    role: str = UserRole.EMPLOYEE
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

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    emp_id: str
    name: str
    email: str
    phone: Optional[str] = None
    department: str
    team: str
    designation: str
    join_date: str
    status: str = "active"
    avatar: Optional[str] = None
    stars: int = 0
    unsafe_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    department: str
    team: str
    designation: str
    join_date: str

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    team: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[str] = None

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    emp_name: str
    team: str
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
    await db.audit_logs.insert_one(doc)

def serialize_doc(doc: dict) -> dict:
    if doc and 'created_at' in doc and isinstance(doc['created_at'], str):
        pass
    elif doc and 'created_at' in doc:
        doc['created_at'] = doc['created_at'].isoformat()
    if doc and 'timestamp' in doc and not isinstance(doc['timestamp'], str):
        doc['timestamp'] = doc['timestamp'].isoformat()
    return doc

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

# ============== EMPLOYEE ROUTES ==============

@api_router.get("/employees")
async def get_employees(
    department: Optional[str] = None,
    team: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if department:
        query["department"] = department
    if team:
        query["team"] = team
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"emp_id": {"$regex": search, "$options": "i"}}
        ]
    
    employees = await db.employees.find(query, {"_id": 0}).to_list(1000)
    return [serialize_doc(e) for e in employees]

@api_router.get("/employees/{employee_id}")
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return serialize_doc(employee)

@api_router.post("/employees")
async def create_employee(data: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.ADMIN, UserRole.HR_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    count = await db.employees.count_documents({})
    emp_id = f"EMP{str(count + 1).zfill(4)}"
    
    employee = Employee(emp_id=emp_id, **data.model_dump())
    doc = employee.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.employees.insert_one(doc.copy())
    
    await log_audit(current_user["id"], "create", "employee", employee.id)
    return serialize_doc(doc)

@api_router.put("/employees/{employee_id}")
async def update_employee(employee_id: str, data: EmployeeUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.ADMIN, UserRole.HR_MANAGER]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    await log_audit(current_user["id"], "update", "employee", employee_id)
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    return serialize_doc(employee)

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    await log_audit(current_user["id"], "delete", "employee", employee_id)
    return {"message": "Employee deleted"}

# ============== ATTENDANCE ROUTES ==============

@api_router.get("/attendance")
async def get_attendance(
    employee_name: Optional[str] = None,
    team: Optional[str] = None,
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
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    today = datetime.now(timezone.utc).strftime("%d-%m-%Y")
    existing = await db.attendance.find_one({"employee_id": employee_id, "date": today})
    
    if existing and existing.get("check_in"):
        raise HTTPException(status_code=400, detail="Already checked in today")
    
    check_in_time = datetime.now(timezone.utc).strftime("%I:%M %p")
    
    attendance = Attendance(
        employee_id=employee_id,
        emp_name=employee["name"],
        team=employee["team"],
        date=today,
        check_in=check_in_time,
        status="Login"
    )
    doc = attendance.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.attendance.insert_one(doc)
    
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
    
    total_employees = await db.employees.count_documents({"status": "active"})
    logged_in = await db.attendance.count_documents({"date": date, "status": {"$in": ["Login", "Completed"]}})
    not_logged = total_employees - logged_in
    early_out = await db.attendance.count_documents({"date": date, "status": "Early Out"})
    late_login = await db.attendance.count_documents({"date": date, "status": "Late Login"})
    
    return {
        "total_employees": total_employees,
        "logged_in": logged_in,
        "not_logged": not_logged,
        "early_out": early_out,
        "late_login": late_login,
        "logout": await db.attendance.count_documents({"date": date, "status": "Completed"})
    }

# ============== LEAVE ROUTES ==============

@api_router.get("/leaves")
async def get_leaves(
    employee_name: Optional[str] = None,
    team: Optional[str] = None,
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
    employee = await db.employees.find_one({"id": data.employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    start = datetime.strptime(data.start_date, "%Y-%m-%d")
    end = datetime.strptime(data.end_date, "%Y-%m-%d")
    duration = (end - start).days + 1
    
    leave = LeaveRequest(
        employee_id=data.employee_id,
        emp_name=employee["name"],
        team=employee["team"],
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        duration=f"{duration} day(s)",
        reason=data.reason
    )
    doc = leave.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.leaves.insert_one(doc)
    
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
    month: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if team and team != "All":
        query["team"] = team
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    employees = await db.employees.find(query, {"_id": 0}).to_list(1000)
    return [serialize_doc(e) for e in employees]

@api_router.post("/star-rewards")
async def add_star_reward(data: StarRewardCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.TEAM_LEAD]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    employee = await db.employees.find_one({"id": data.employee_id}, {"_id": 0})
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
    await db.star_rewards.insert_one(doc)
    
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
    return [serialize_doc(t) for t in teams]

@api_router.get("/teams/{team_id}")
async def get_team(team_id: str, current_user: dict = Depends(get_current_user)):
    team = await db.teams.find_one({"id": team_id}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    members = await db.employees.find({"team": team["name"]}, {"_id": 0}).to_list(100)
    return {"team": serialize_doc(team), "members": [serialize_doc(m) for m in members]}

@api_router.get("/departments")
async def get_departments(current_user: dict = Depends(get_current_user)):
    departments = await db.departments.find({}, {"_id": 0}).to_list(100)
    return [serialize_doc(d) for d in departments]

# ============== DASHBOARD ROUTES ==============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%d-%m-%Y")
    
    total_research = await db.employees.count_documents({"department": "Research Unit"})
    total_support = await db.employees.count_documents({"department": "Support Staff"})
    pending_approvals = await db.leaves.count_documents({"status": "pending"})
    upcoming_leaves = await db.leaves.count_documents({
        "status": "approved",
        "start_date": {"$gte": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    })
    
    attendance_stats = await get_attendance_stats(today, current_user)
    
    return {
        "total_research_unit": total_research,
        "total_support_staff": total_support,
        "pending_approvals": pending_approvals,
        "upcoming_leaves": upcoming_leaves,
        "attendance": attendance_stats
    }

@api_router.get("/dashboard/leave-list")
async def get_dashboard_leave_list(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%d-%m-%Y")
    
    # Get employees not logged in today
    all_employees = await db.employees.find({"status": "active"}, {"_id": 0}).to_list(1000)
    logged_today = await db.attendance.find({"date": today}, {"_id": 0}).to_list(1000)
    logged_ids = {a["employee_id"] for a in logged_today}
    
    not_logged = [e for e in all_employees if e["id"] not in logged_ids]
    
    result = []
    for emp in not_logged[:10]:
        result.append({
            "emp_name": emp["name"],
            "team": emp["team"],
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
    
    records = await db.leaves.find(query, {"_id": 0}).to_list(10000)
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
    await db.users.insert_one(doc)
    
    # Create departments
    departments = [
        {"id": str(uuid.uuid4()), "name": "Research Unit", "team_count": 6},
        {"id": str(uuid.uuid4()), "name": "Support Staff", "team_count": 2},
        {"id": str(uuid.uuid4()), "name": "Business & Product", "team_count": 3}
    ]
    await db.departments.insert_many(departments)
    
    # Create teams
    teams = [
        {"id": str(uuid.uuid4()), "name": "Compiler - Auto Differentiation", "department": "Research Unit", "member_count": 7},
        {"id": str(uuid.uuid4()), "name": "Compiler - Computation Graph", "department": "Research Unit", "member_count": 1},
        {"id": str(uuid.uuid4()), "name": "Data", "department": "Research Unit", "member_count": 7},
        {"id": str(uuid.uuid4()), "name": "Framework - Graph & Auto-differentiation", "department": "Research Unit", "member_count": 3},
        {"id": str(uuid.uuid4()), "name": "Framework - parallelism", "department": "Research Unit", "member_count": 5},
        {"id": str(uuid.uuid4()), "name": "Framework - Tensor & Ops", "department": "Research Unit", "member_count": 6},
        {"id": str(uuid.uuid4()), "name": "Framework - Quantz", "department": "Research Unit", "member_count": 2},
        {"id": str(uuid.uuid4()), "name": "Tokenizer", "department": "Research Unit", "member_count": 2},
        {"id": str(uuid.uuid4()), "name": "Administration", "department": "Support Staff", "member_count": 4}
    ]
    await db.teams.insert_many(teams)
    
    # Create employees based on screenshot data
    employees_data = [
        {"name": "Adhitya Charan", "email": "adhitya.blubridge@evoplus.in", "team": "Framework - parallelism", "stars": -11, "unsafe_count": 3},
        {"name": "Adwaid Suresh", "email": "suresh.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": -2, "unsafe_count": 0},
        {"name": "Amarnath V S", "email": "amarnath.blubridge@evoplus.in", "team": "Framework - Quantz", "stars": -5, "unsafe_count": 2},
        {"name": "Anuj Kumar", "email": "anuj.blubridge@evoplus.in", "team": "Framework - parallelism", "stars": -11, "unsafe_count": 3},
        {"name": "Aravind P", "email": "aravind.blubridge@evoplus.in", "team": "Tokenizer", "stars": -5, "unsafe_count": 2},
        {"name": "Aravind S", "email": "aravinds.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": -5, "unsafe_count": 2},
        {"name": "Chaithanya", "email": "chaithanya.blubridge@evoplus.in", "team": "Data", "stars": 0, "unsafe_count": 0},
        {"name": "Dinesh", "email": "dinesh.blubridge@evoplus.in", "team": "Framework - parallelism", "stars": 2, "unsafe_count": 0},
        {"name": "Gowtham", "email": "gowtham.blubridge@evoplus.in", "team": "Data", "stars": 5, "unsafe_count": 0},
        {"name": "Gowthamkumar", "email": "gowthamkumar.blubridge@evoplus.in", "team": "Framework - Tensor & Ops", "stars": 3, "unsafe_count": 0},
        {"name": "Grishma", "email": "grishma.blubridge@evoplus.in", "team": "Framework - Graph & Auto-differentiation", "stars": 1, "unsafe_count": 0},
        {"name": "Hamza", "email": "hamza.blubridge@evoplus.in", "team": "Administration", "stars": 0, "unsafe_count": 0},
        {"name": "Harshini", "email": "harshini.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": 2, "unsafe_count": 0},
        {"name": "Jenifa", "email": "jenifa.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": 4, "unsafe_count": 0},
        {"name": "Jona", "email": "jona.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": 1, "unsafe_count": 0},
        {"name": "Kota", "email": "kota.blubridge@evoplus.in", "team": "Framework - Tensor & Ops", "stars": -3, "unsafe_count": 1},
        {"name": "Pragathi V", "email": "pragathi.blubridge@evoplus.in", "team": "Administration", "stars": 0, "unsafe_count": 0},
        {"name": "Suresh", "email": "suresh2.blubridge@evoplus.in", "team": "Compiler - Auto Differentiation", "stars": 2, "unsafe_count": 0},
    ]
    
    for i, emp_data in enumerate(employees_data):
        dept = "Support Staff" if emp_data["team"] == "Administration" else "Research Unit"
        emp = Employee(
            emp_id=f"EMP{str(i + 1).zfill(4)}",
            name=emp_data["name"],
            email=emp_data["email"],
            department=dept,
            team=emp_data["team"],
            designation="Software Engineer",
            join_date="2024-01-15",
            stars=emp_data["stars"],
            unsafe_count=emp_data["unsafe_count"]
        )
        doc = emp.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.employees.insert_one(doc)
    
    # Create sample attendance
    today = datetime.now(timezone.utc).strftime("%d-%m-%Y")
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    
    for emp in employees[:15]:
        check_in_hour = 8 + (hash(emp["id"]) % 3)
        check_in_min = hash(emp["id"]) % 60
        check_in_time = f"{str(check_in_hour).zfill(2)}:{str(check_in_min).zfill(2)} AM"
        
        att = Attendance(
            employee_id=emp["id"],
            emp_name=emp["name"],
            team=emp["team"],
            date=today,
            check_in=check_in_time,
            status="Login"
        )
        doc = att.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.attendance.insert_one(doc)
    
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
