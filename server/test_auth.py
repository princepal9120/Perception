# test_auth.py
"""
Simple test script to verify authentication system functionality.
"""

import asyncio
import requests
import json
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8000"
AUTH_URL = f"{BASE_URL}/api/v1/auth"

# Test user data
test_user = {
    "email": "test@example.com",
    "password": "TestPassword123!",
    "confirm_password": "TestPassword123!",
    "first_name": "Test",
    "last_name": "User"
}

login_data = {
    "email": "test@example.com",
    "password": "TestPassword123!"
}


def test_signup():
    """Test user registration."""
    print("🔄 Testing user signup...")
    
    response = requests.post(f"{AUTH_URL}/signup", json=test_user)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    return response.status_code == 201


def test_login():
    """Test user login."""
    print("\n🔄 Testing user login...")
    
    response = requests.post(f"{AUTH_URL}/login", json=login_data)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        token_data = response.json()
        print(f"Access Token: {token_data['access_token'][:50]}...")
        print(f"Token Type: {token_data['token_type']}")
        print(f"User Email: {token_data['user']['email']}")
        return token_data['access_token']
    else:
        print(f"Login failed: {response.json()}")
        return None


def test_profile(access_token):
    """Test protected profile endpoint."""
    print("\n🔄 Testing protected profile endpoint...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{AUTH_URL}/profile", headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Profile: {response.json()}")
    
    return response.status_code == 200


def test_logout(access_token):
    """Test user logout."""
    print("\n🔄 Testing user logout...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.post(f"{AUTH_URL}/logout", headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    return response.status_code == 200


def test_protected_after_logout(access_token):
    """Test accessing protected endpoint after logout."""
    print("\n🔄 Testing protected endpoint after logout...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{AUTH_URL}/profile", headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    return response.status_code == 401


def main():
    """Run all authentication tests."""
    print("🚀 Starting Authentication System Tests")
    print(f"Testing against: {BASE_URL}")
    print(f"Timestamp: {datetime.now()}")
    print("=" * 60)
    
    try:
        # Test signup (might fail if user already exists)
        signup_success = test_signup()
        if not signup_success:
            print("⚠️  Signup failed (user might already exist)")
        
        # Test login
        access_token = test_login()
        if not access_token:
            print("❌ Login failed - cannot continue tests")
            return
        
        # Test protected endpoint
        profile_success = test_profile(access_token)
        if not profile_success:
            print("❌ Profile access failed")
        
        # Test logout
        logout_success = test_logout(access_token)
        if not logout_success:
            print("❌ Logout failed")
        
        # Test protected endpoint after logout
        protected_after_logout = test_protected_after_logout(access_token)
        if not protected_after_logout:
            print("❌ Token should be invalid after logout")
        
        print("\n" + "=" * 60)
        print("🎉 All authentication tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - make sure the server is running on localhost:8000")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


if __name__ == "__main__":
    main()