from dotenv import load_dotenv
from os import getenv 

load_dotenv()

class Config:
    SUPABASE_URL = getenv("SUPABASE_URL")
    SUPABASE_KEY = getenv("SUPABASE_KEY")
    JWT_SECRET = getenv("JWT_SECRET")
    JWT_EXPIRE_DAYS = getenv("JWT_EXPIRE_DAYS")
    FRONTEND_URL = getenv("FRONTEND_URL")

env = Config()
