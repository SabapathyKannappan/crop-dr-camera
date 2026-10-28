from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
import string
import random
from datetime import datetime, timezone, timedelta
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Get API key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Authentication helper
def generate_signin_code() -> str:
    """Generate a unique 6-character alphanumeric sign-in code (e.g., V56790)"""
    chars = string.ascii_uppercase + string.digits
    code = ''.join(random.choices(chars, k=6))
    return code

async def verify_auth_code(auth_code: Optional[str] = Header(None, alias="X-Auth-Code")) -> str:
    """Verify authentication code from header"""
    if not auth_code:
        raise HTTPException(status_code=401, detail="Authentication required. Please sign in.")
    
    # Verify code exists in database
    user = await db.users.find_one({"auth_code": auth_code}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid sign-in code. Please check your code.")
    
    return auth_code

# Define Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    auth_code: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_signin_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SignInRequest(BaseModel):
    code: Optional[str] = None

class SignInResponse(BaseModel):
    auth_code: str
    is_new_user: bool
    message: str

class DailyAction(BaseModel):
    day: int
    title: str
    action: str
    time_of_day: str

class CareSchedule(BaseModel):
    plant_id: str
    schedule_days: int = 7
    daily_actions: List[DailyAction]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Diagnosis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_auth_code: str  # Link to user
    plant_name: str
    disease_name: str
    severity: str
    treatment_steps: List[str]
    description: str
    image_data: str
    health_score: int
    care_schedule: List[Dict]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    auth_code: str
    total_diagnoses: int = 0
    active_care_plans: int = 0

class ProgressPoint(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_auth_code: str
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    health_score: int
    disease_count: int

# Authentication endpoints
@api_router.post("/auth/signin", response_model=SignInResponse)
async def signin(request: SignInRequest):
    """Sign in with existing code or generate new one"""
    try:
        if request.code:
            # User provided existing code
            code = request.code.strip().upper()
            
            # Check if code exists
            user = await db.users.find_one({"auth_code": code}, {"_id": 0})
            
            if not user:
                raise HTTPException(status_code=404, detail="Sign-in code not found. Please check your code.")
            
            # Update last sign-in time
            await db.users.update_one(
                {"auth_code": code},
                {"$set": {"last_signin_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            logging.info(f"User signed in with existing code: {code}")
            return SignInResponse(
                auth_code=code,
                is_new_user=False,
                message="Welcome back! Your data has been loaded."
            )
        else:
            # Generate new code for new user
            new_code = generate_signin_code()
            
            # Ensure code is unique
            while await db.users.find_one({"auth_code": new_code}):
                new_code = generate_signin_code()
            
            # Create new user
            new_user = User(auth_code=new_code)
            user_doc = new_user.model_dump()
            user_doc['created_at'] = user_doc['created_at'].isoformat()
            user_doc['last_signin_at'] = user_doc['last_signin_at'].isoformat()
            await db.users.insert_one(user_doc)
            
            logging.info(f"New user created with code: {new_code}")
            return SignInResponse(
                auth_code=new_code,
                is_new_user=True,
                message=f"Welcome! Your sign-in code is {new_code}. Save this code to access your data from any device."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in signin: {str(e)}")
        raise HTTPException(status_code=500, detail="Sign-in failed. Please try again.")

@api_router.post("/auth/signout")
async def signout(auth_code: str = Depends(verify_auth_code)):
    """Sign out (frontend will clear stored code)"""
    logging.info(f"User signed out: {auth_code}")
    return {"message": "Signed out successfully"}

@api_router.get("/auth/verify")
async def verify_auth(auth_code: str = Depends(verify_auth_code)):
    """Verify if auth code is valid"""
    return {"valid": True, "auth_code": auth_code}

@api_router.get("/")
async def root():
    return {"message": "Crop Doctor Camera API - Authentication Required"}

@api_router.post("/diagnose")
async def diagnose_plant(
    file: UploadFile = File(...),
    auth_code: str = Depends(verify_auth_code)
):
    """Diagnose plant disease from uploaded image - requires authentication"""
    try:
        # Read and process image
        image_data = await file.read()
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Validate image format
        try:
            img = Image.open(io.BytesIO(image_data))
            img_format = img.format
            if img_format not in ['JPEG', 'PNG', 'WEBP']:
                buffer = io.BytesIO()
                img.convert('RGB').save(buffer, format='PNG')
                image_data = buffer.getvalue()
                base64_image = base64.b64encode(image_data).decode('utf-8')
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Create AI chat instance
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"diagnosis_{uuid.uuid4()}",
            system_message="""You are an expert plant pathologist AI. Analyze plant images and provide accurate disease diagnosis.
            Return your response in the following JSON format:
            {
                "plant_name": "Name of the plant",
                "disease_name": "Name of the disease or 'Healthy Plant'",
                "severity": "healthy/mild/moderate/severe/critical",
                "description": "Brief description",
                "treatment_steps": ["Step 1", "Step 2", "Step 3"],
                "health_score": 85,
                "care_schedule": [
                    {"day": 1, "title": "Immediate Action", "action": "Specific care", "time_of_day": "morning"},
                    {"day": 2, "title": "Follow-up", "action": "Care instruction", "time_of_day": "afternoon"}
                ]
            }
            Create a realistic 7-day care schedule."""
        ).with_model("openai", "gpt-5.1")
        
        image_content = ImageContent(image_base64=base64_image)
        user_message = UserMessage(
            text="Analyze this plant image, diagnose any diseases, and create a detailed 7-day care schedule.",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse AI response
        import json
        try:
            response_text = response.strip()
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0]
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0]
            diagnosis_data = json.loads(response_text)
        except:
            diagnosis_data = {
                "plant_name": "Unknown Plant",
                "disease_name": "Unable to parse diagnosis",
                "severity": "unknown",
                "description": response,
                "treatment_steps": ["Please consult with a local plant expert"],
                "health_score": 50,
                "care_schedule": [
                    {"day": i, "title": f"Day {i} Care", "action": "Monitor plant condition", "time_of_day": "morning"}
                    for i in range(1, 8)
                ]
            }
        
        # Ensure 7-day schedule
        if len(diagnosis_data.get('care_schedule', [])) < 7:
            existing = diagnosis_data.get('care_schedule', [])
            for i in range(len(existing) + 1, 8):
                existing.append({
                    "day": i,
                    "title": f"Day {i} Maintenance",
                    "action": "Continue monitoring and maintaining care routine",
                    "time_of_day": "morning"
                })
            diagnosis_data['care_schedule'] = existing
        
        # Create diagnosis object with user link
        diagnosis = Diagnosis(
            user_auth_code=auth_code,
            plant_name=diagnosis_data.get('plant_name', 'Unknown Plant'),
            disease_name=diagnosis_data.get('disease_name', 'Unknown'),
            severity=diagnosis_data.get('severity', 'unknown'),
            treatment_steps=diagnosis_data.get('treatment_steps', []),
            description=diagnosis_data.get('description', ''),
            image_data=base64_image,
            health_score=diagnosis_data.get('health_score', 50),
            care_schedule=diagnosis_data.get('care_schedule', [])
        )
        
        # Save to database
        doc = diagnosis.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.diagnoses.insert_one(doc)
        
        # Add progress point
        progress_point = ProgressPoint(
            user_auth_code=auth_code,
            health_score=diagnosis.health_score,
            disease_count=1 if diagnosis.severity not in ['healthy', 'none'] else 0
        )
        progress_doc = progress_point.model_dump()
        progress_doc['date'] = progress_doc['date'].isoformat()
        await db.progress_history.insert_one(progress_doc)
        
        return diagnosis
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in diagnose: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/diagnoses", response_model=List[Diagnosis])
async def get_diagnoses(auth_code: str = Depends(verify_auth_code)):
    """Get all diagnosis history for authenticated user"""
    diagnoses = await db.diagnoses.find(
        {"user_auth_code": auth_code},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(1000)
    
    for diagnosis in diagnoses:
        if isinstance(diagnosis['timestamp'], str):
            diagnosis['timestamp'] = datetime.fromisoformat(diagnosis['timestamp'])
    
    return diagnoses

@api_router.get("/diagnoses/{diagnosis_id}", response_model=Diagnosis)
async def get_diagnosis(diagnosis_id: str, auth_code: str = Depends(verify_auth_code)):
    """Get a single diagnosis - user-scoped"""
    diagnosis = await db.diagnoses.find_one(
        {"id": diagnosis_id, "user_auth_code": auth_code},
        {"_id": 0}
    )
    
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    
    if isinstance(diagnosis['timestamp'], str):
        diagnosis['timestamp'] = datetime.fromisoformat(diagnosis['timestamp'])
    
    return diagnosis

@api_router.delete("/diagnoses/{diagnosis_id}")
async def delete_diagnosis(diagnosis_id: str, auth_code: str = Depends(verify_auth_code)):
    """Delete a diagnosis - user-scoped"""
    try:
        if not diagnosis_id or len(diagnosis_id) < 10:
            raise HTTPException(status_code=400, detail="Invalid diagnosis ID")
        
        logging.info(f"User {auth_code} attempting to delete diagnosis: {diagnosis_id}")
        
        # Check if diagnosis exists and belongs to user
        existing = await db.diagnoses.find_one(
            {"id": diagnosis_id, "user_auth_code": auth_code},
            {"_id": 0}
        )
        if not existing:
            logging.warning(f"Diagnosis not found or unauthorized: {diagnosis_id}")
            raise HTTPException(status_code=404, detail="Diagnosis not found or you don't have permission")
        
        # Delete the diagnosis
        result = await db.diagnoses.delete_one({"id": diagnosis_id, "user_auth_code": auth_code})
        
        if result.deleted_count == 0:
            logging.error(f"Failed to delete diagnosis: {diagnosis_id}")
            raise HTTPException(status_code=500, detail="Failed to delete diagnosis")
        
        logging.info(f"Successfully deleted diagnosis: {diagnosis_id}")
        return {
            "message": "Diagnosis deleted successfully",
            "deleted_id": diagnosis_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting diagnosis {diagnosis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error while deleting")

@api_router.get("/profile", response_model=UserProfile)
async def get_profile(auth_code: str = Depends(verify_auth_code)):
    """Get user profile with care plan statistics - user-scoped"""
    
    # Count actual diagnoses for this user
    total_count = await db.diagnoses.count_documents({"user_auth_code": auth_code})
    
    # Count active care plans (diagnoses from last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    active_count = await db.diagnoses.count_documents({
        "user_auth_code": auth_code,
        "timestamp": {"$gte": seven_days_ago.isoformat()}
    })
    
    return UserProfile(
        auth_code=auth_code,
        total_diagnoses=total_count,
        active_care_plans=active_count
    )

@api_router.get("/progress")
async def get_progress(auth_code: str = Depends(verify_auth_code)):
    """Get progress data for charts - user-scoped"""
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    progress_points = await db.progress_history.find(
        {"user_auth_code": auth_code},
        {"_id": 0}
    ).sort("date", 1).to_list(1000)
    
    for point in progress_points:
        if isinstance(point['date'], str):
            point['date'] = datetime.fromisoformat(point['date'])
    
    recent_points = [p for p in progress_points if p['date'] >= thirty_days_ago]
    
    return {
        "progress_points": recent_points,
        "total_points": len(progress_points)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()