from enum import Enum
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date

# ==========================================
# ENUMS
# ==========================================
class UserRole(str, Enum):
    citizen = 'citizen'
    worker = 'worker'
    supervisor = 'supervisor'
    manager = 'manager'
    admin = 'admin'

class ComplaintStatus(str, Enum):
    pending_routing = 'pending_routing'
    routed = 'routed'
    in_progress = 'in_progress'
    resolved = 'resolved'
    rejected = 'rejected'
    re_routed = 're_routed'

class OfficeType(str, Enum):
    municipal_corp = 'municipal_corp'
    municipal_council = 'municipal_council'
    panchayat = 'panchayat'
    state_dept = 'state_dept'
    sub_station = 'sub_station'

class PriorityLevel(str, Enum):
    low = 'low'
    medium = 'medium'
    high = 'high'
    critical = 'critical'
