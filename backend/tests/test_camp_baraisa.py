"""
Camp Baraisa Backend API Tests
Tests for: Groups API, Activity Log, Fee Calculation, Settings API Keys
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@campbaraisa.com"
ADMIN_PASSWORD = "testpassword123"
PARENT_PORTAL_TOKEN = "zuiU-lz6QwEs4hTwL4vpBNQLa_mIKMgEKrqZZD176O0"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        # API returns access_token, not token
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_check(self, api_client):
        """Test API health endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "status" in data
        print("✓ Health check passed")
    
    def test_admin_login(self, api_client):
        """Test admin login with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "admin" in data
        assert data["admin"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful for {ADMIN_EMAIL}")
    
    def test_admin_login_invalid_credentials(self, api_client):
        """Test admin login with wrong credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")


class TestGroupsAPI:
    """Tests for Groups API - Shiur, Transportation, Trip, Room, Custom"""
    
    def test_get_groups(self, authenticated_client):
        """Test fetching all groups"""
        response = authenticated_client.get(f"{BASE_URL}/api/groups")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Fetched {len(data)} groups")
    
    def test_create_shiur_group(self, authenticated_client):
        """Test creating a Shiur/Class group"""
        response = authenticated_client.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_Shiur_Aleph",
            "type": "shiur",
            "capacity": 15,
            "description": "Test shiur group"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Shiur_Aleph"
        assert data["type"] == "shiur"
        assert data["capacity"] == 15
        assert "id" in data
        print(f"✓ Created shiur group: {data['id']}")
        return data["id"]
    
    def test_create_transportation_group(self, authenticated_client):
        """Test creating a Transportation group"""
        response = authenticated_client.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_Bus_A",
            "type": "transportation",
            "capacity": 40,
            "description": "Test bus group"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "transportation"
        print(f"✓ Created transportation group: {data['id']}")
    
    def test_create_trip_group(self, authenticated_client):
        """Test creating a Trip group"""
        response = authenticated_client.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_Trip_1",
            "type": "trip",
            "capacity": 25,
            "description": "Test trip group"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "trip"
        print(f"✓ Created trip group: {data['id']}")
    
    def test_create_room_group(self, authenticated_client):
        """Test creating a Room/Bunk group"""
        response = authenticated_client.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_Bunk_1",
            "type": "room",
            "capacity": 8,
            "description": "Test room group"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "room"
        print(f"✓ Created room group: {data['id']}")
    
    def test_create_custom_group(self, authenticated_client):
        """Test creating a Custom group"""
        response = authenticated_client.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_Custom_Group",
            "type": "custom",
            "capacity": None,
            "description": "Test custom group"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "custom"
        print(f"✓ Created custom group: {data['id']}")
    
    def test_filter_groups_by_type(self, authenticated_client):
        """Test filtering groups by type"""
        response = authenticated_client.get(f"{BASE_URL}/api/groups?type=shiur")
        assert response.status_code == 200
        data = response.json()
        for group in data:
            assert group["type"] == "shiur"
        print(f"✓ Filtered {len(data)} shiur groups")
    
    def test_update_group(self, authenticated_client):
        """Test updating a group"""
        # First create a group
        create_response = authenticated_client.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_Update_Group",
            "type": "shiur",
            "capacity": 10,
            "description": "Original description"
        })
        group_id = create_response.json()["id"]
        
        # Update the group
        update_response = authenticated_client.put(f"{BASE_URL}/api/groups/{group_id}", json={
            "name": "TEST_Updated_Group",
            "type": "shiur",
            "capacity": 20,
            "description": "Updated description"
        })
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["name"] == "TEST_Updated_Group"
        assert data["capacity"] == 20
        print(f"✓ Updated group: {group_id}")
    
    def test_delete_group(self, authenticated_client):
        """Test deleting a group"""
        # First create a group
        create_response = authenticated_client.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_Delete_Group",
            "type": "custom",
            "capacity": None,
            "description": "To be deleted"
        })
        group_id = create_response.json()["id"]
        
        # Delete the group
        delete_response = authenticated_client.delete(f"{BASE_URL}/api/groups/{group_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = authenticated_client.get(f"{BASE_URL}/api/groups/{group_id}")
        assert get_response.status_code == 404
        print(f"✓ Deleted group: {group_id}")


class TestFeeCalculation:
    """Tests for 3.5% credit card processing fee"""
    
    def test_calculate_fee_with_fee(self, api_client):
        """Test fee calculation with fee included"""
        response = api_client.get(f"{BASE_URL}/api/payment/calculate-fee?amount=100&include_fee=true")
        assert response.status_code == 200
        data = response.json()
        assert data["base_amount"] == 100
        assert data["fee_rate"] == 0.035
        assert data["fee_amount"] == 3.5  # 3.5% of 100
        assert data["total_with_fee"] == 103.5
        assert "3.5%" in data["fee_description"]
        print(f"✓ Fee calculation correct: $100 + $3.50 fee = $103.50")
    
    def test_calculate_fee_without_fee(self, api_client):
        """Test fee calculation without fee"""
        response = api_client.get(f"{BASE_URL}/api/payment/calculate-fee?amount=100&include_fee=false")
        assert response.status_code == 200
        data = response.json()
        assert data["base_amount"] == 100
        assert data["fee_rate"] == 0
        assert data["fee_amount"] == 0
        assert data["total_with_fee"] == 100
        print("✓ No fee calculation correct")
    
    def test_calculate_fee_large_amount(self, api_client):
        """Test fee calculation with larger amount"""
        response = api_client.get(f"{BASE_URL}/api/payment/calculate-fee?amount=2500&include_fee=true")
        assert response.status_code == 200
        data = response.json()
        assert data["base_amount"] == 2500
        assert data["fee_amount"] == 87.5  # 3.5% of 2500
        assert data["total_with_fee"] == 2587.5
        print(f"✓ Large amount fee: $2500 + $87.50 fee = $2587.50")


class TestActivityLog:
    """Tests for Activity Logging API"""
    
    def test_get_activity_log(self, authenticated_client):
        """Test fetching activity log for a camper"""
        # First get a camper
        campers_response = authenticated_client.get(f"{BASE_URL}/api/campers")
        if campers_response.status_code == 200 and len(campers_response.json()) > 0:
            camper_id = campers_response.json()[0]["id"]
            
            # Get activity log
            response = authenticated_client.get(f"{BASE_URL}/api/activity/camper/{camper_id}")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Fetched {len(data)} activity logs for camper")
        else:
            pytest.skip("No campers available for activity log test")
    
    def test_add_note_to_camper(self, authenticated_client):
        """Test adding a note to a camper"""
        # First get a camper
        campers_response = authenticated_client.get(f"{BASE_URL}/api/campers")
        if campers_response.status_code == 200 and len(campers_response.json()) > 0:
            camper_id = campers_response.json()[0]["id"]
            
            # Add note
            response = authenticated_client.post(
                f"{BASE_URL}/api/activity/camper/{camper_id}/note?note=TEST_Note_from_testing"
            )
            assert response.status_code == 200
            data = response.json()
            assert "log_id" in data
            print(f"✓ Added note to camper: {data['log_id']}")
        else:
            pytest.skip("No campers available for note test")


class TestSettingsAPI:
    """Tests for Settings API"""
    
    def test_get_settings(self, authenticated_client):
        """Test fetching settings"""
        response = authenticated_client.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "camp_name" in data
        assert "quickbooks_sync" in data
        assert "gmail_enabled" in data
        assert "twilio_enabled" in data
        print(f"✓ Fetched settings: {data.get('camp_name')}")
    
    def test_update_settings(self, authenticated_client):
        """Test updating settings"""
        response = authenticated_client.put(f"{BASE_URL}/api/settings", json={
            "camp_name": "Camp Baraisa",
            "camp_email": "test@campbaraisa.com",
            "camp_phone": "848-227-2472",
            "quickbooks_sync": False,
            "gmail_enabled": False,
            "twilio_enabled": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["camp_email"] == "test@campbaraisa.com"
        print("✓ Settings updated successfully")


class TestEmailTemplates:
    """Tests for Email Templates API"""
    
    def test_get_templates(self, authenticated_client):
        """Test fetching email templates"""
        response = authenticated_client.get(f"{BASE_URL}/api/email-templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Fetched {len(data)} email templates")
    
    def test_get_merge_fields(self, authenticated_client):
        """Test fetching template merge fields"""
        response = authenticated_client.get(f"{BASE_URL}/api/template-merge-fields")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        # Should have categories like parent, camper, billing, camp
        print(f"✓ Fetched merge fields with {len(data)} categories")
    
    def test_create_template_with_auto_trigger(self, authenticated_client):
        """Test creating a template with auto trigger"""
        response = authenticated_client.post(f"{BASE_URL}/api/email-templates", json={
            "name": "TEST_Auto_Template",
            "subject": "Test Subject {{camper_first_name}}",
            "body": "Hello {{parent_father_first_name}}, this is a test.",
            "trigger": "status_accepted",
            "template_type": "email"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Auto_Template"
        assert data["trigger"] == "status_accepted"
        print(f"✓ Created template with auto trigger: {data['id']}")
        return data["id"]
    
    def test_preview_template(self, authenticated_client):
        """Test template preview"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/templates/preview?custom_subject=Hello {{{{camper_first_name}}}}&custom_body=Test body"
        )
        assert response.status_code == 200
        data = response.json()
        assert "subject" in data
        assert "body" in data
        assert "merge_data" in data
        print("✓ Template preview working")


class TestParentPortal:
    """Tests for Parent Portal API"""
    
    def test_portal_access(self, api_client):
        """Test parent portal access with token"""
        response = api_client.get(f"{BASE_URL}/api/portal/{PARENT_PORTAL_TOKEN}")
        assert response.status_code == 200
        data = response.json()
        assert "parent" in data
        assert "campers" in data
        assert "invoices" in data
        assert "payments" in data
        print(f"✓ Portal access successful for parent: {data['parent'].get('first_name')}")
    
    def test_portal_invalid_token(self, api_client):
        """Test parent portal with invalid token"""
        response = api_client.get(f"{BASE_URL}/api/portal/invalid-token-12345")
        assert response.status_code == 404
        print("✓ Invalid portal token correctly rejected")


class TestKanbanAPI:
    """Tests for Kanban Board API"""
    
    def test_get_kanban_board(self, authenticated_client):
        """Test fetching kanban board"""
        response = authenticated_client.get(f"{BASE_URL}/api/kanban")
        assert response.status_code == 200
        data = response.json()
        assert "statuses" in data
        assert "board" in data
        # Should have 10 status columns
        assert len(data["statuses"]) == 10
        print(f"✓ Kanban board has {len(data['statuses'])} status columns")
    
    def test_update_camper_status(self, authenticated_client):
        """Test updating camper status (triggers email)"""
        # Get a camper
        campers_response = authenticated_client.get(f"{BASE_URL}/api/campers")
        if campers_response.status_code == 200 and len(campers_response.json()) > 0:
            camper = campers_response.json()[0]
            camper_id = camper["id"]
            original_status = camper.get("status", "Applied")
            
            # Update status
            response = authenticated_client.put(
                f"{BASE_URL}/api/campers/{camper_id}/status?status=Accepted"
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            print(f"✓ Updated camper status to Accepted")
            
            # Restore original status
            authenticated_client.put(
                f"{BASE_URL}/api/campers/{camper_id}/status?status={original_status}"
            )
        else:
            pytest.skip("No campers available for status update test")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_groups(self, authenticated_client):
        """Clean up TEST_ prefixed groups"""
        response = authenticated_client.get(f"{BASE_URL}/api/groups")
        if response.status_code == 200:
            groups = response.json()
            deleted_count = 0
            for group in groups:
                if group["name"].startswith("TEST_"):
                    delete_response = authenticated_client.delete(f"{BASE_URL}/api/groups/{group['id']}")
                    if delete_response.status_code == 200:
                        deleted_count += 1
            print(f"✓ Cleaned up {deleted_count} test groups")
    
    def test_cleanup_test_templates(self, authenticated_client):
        """Clean up TEST_ prefixed templates"""
        response = authenticated_client.get(f"{BASE_URL}/api/email-templates")
        if response.status_code == 200:
            templates = response.json()
            deleted_count = 0
            for template in templates:
                if template["name"].startswith("TEST_"):
                    delete_response = authenticated_client.delete(f"{BASE_URL}/api/email-templates/{template['id']}")
                    if delete_response.status_code == 200:
                        deleted_count += 1
            print(f"✓ Cleaned up {deleted_count} test templates")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
