# test_login.py
import os
from app.config import env
from supabase import create_client

s = create_client(env.SUPABASE_URL, env.SUPABASE_KEY)

# Use the email/password of the user you registered in the Supabase Auth Dashboard
response = s.auth.sign_in_with_password({
    "email": "test@gmail.com",
    "password": "123456789"
})

print("Copy this massive string into Postman/Swagger:")
print(response.session.access_token)
