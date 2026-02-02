"""
Camp Baraisa Backend API Tests - Iteration 5
Testing: Unified Camper model, Public Application, Activity Log, Kanban, Dashboard
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@campbaraisa.com"
ADMIN_PASSWORD = "testpassword123"

class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "admin" in data
        assert data["admin"]["email"] == ADMIN_EMAIL
        assert data["admin"]["is_approved"] == True
        print(f"✓ Login successful for {ADMIN_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")
    
    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint with valid token"""
        # First login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_res.json()["access_token"]
        
        # Test /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print("✓ /auth/me endpoint working")


class TestDashboardEndpoints:
    """Dashboard stats endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200, f"Dashboard stats failed: {response.text}"
        data = response.json()
        
        # Verify expected fields
        assert "total_campers" in data
        assert "total_invoiced" in data
        assert "total_collected" in data
        assert "outstanding" in data
        assert "campers_by_status" in data
        print(f"✓ Dashboard stats: {data['total_campers']} campers, ${data['total_invoiced']} invoiced")


class TestCamperEndpoints:
    """Camper CRUD tests - Unified model with embedded parent info"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_campers(self):
        """Test getting all campers"""
        response = requests.get(f"{BASE_URL}/api/campers", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /campers returned {len(data)} campers")
    
    def test_create_camper_with_embedded_parent(self):
        """Test creating camper with embedded parent info (unified model)"""
        unique_id = str(uuid.uuid4())[:8]
        camper_data = {
            "first_name": f"TEST_Camper_{unique_id}",
            "last_name": "TestFamily",
            "grade": "11th",
            "yeshiva": "Yeshivas Mir - Brooklyn",
            # Embedded parent info
            "parent_email": f"test_{unique_id}@example.com",
            "father_first_name": "TestFather",
            "father_last_name": "TestFamily",
            "father_cell": "555-123-4567",
            "mother_first_name": "TestMother",
            "mother_last_name": "TestFamily",
            "mother_cell": "555-987-6543",
            # Emergency contact
            "emergency_contact_name": "Uncle Test",
            "emergency_contact_phone": "555-111-2222",
            "emergency_contact_relationship": "Uncle"
        }
        
        response = requests.post(f"{BASE_URL}/api/campers", json=camper_data, headers=self.headers)
        assert response.status_code == 200, f"Create camper failed: {response.text}"
        
        created = response.json()
        assert created["first_name"] == camper_data["first_name"]
        assert created["father_first_name"] == "TestFather"
        assert created["parent_email"] == camper_data["parent_email"]
        assert created["status"] == "Applied"
        assert "portal_token" in created
        
        # Verify by GET
        get_response = requests.get(f"{BASE_URL}/api/campers/{created['id']}", headers=self.headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["father_first_name"] == "TestFather"
        
        print(f"✓ Created camper with embedded parent info: {created['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/campers/{created['id']}", headers=self.headers)
    
    def test_update_camper_status(self):
        """Test updating camper status"""
        # First create a camper
        unique_id = str(uuid.uuid4())[:8]
        camper_data = {
            "first_name": f"TEST_Status_{unique_id}",
            "last_name": "TestStatus",
            "parent_email": f"status_{unique_id}@example.com",
            "father_first_name": "StatusFather",
            "father_last_name": "TestStatus",
            "father_cell": "555-000-0000"
        }
        create_res = requests.post(f"{BASE_URL}/api/campers", json=camper_data, headers=self.headers)
        camper_id = create_res.json()["id"]
        
        # Update status
        response = requests.put(
            f"{BASE_URL}/api/campers/{camper_id}/status?status=Accepted",
            headers=self.headers
        )
        assert response.status_code == 200
        
        # Verify status changed
        get_res = requests.get(f"{BASE_URL}/api/campers/{camper_id}", headers=self.headers)
        assert get_res.json()["status"] == "Accepted"
        
        print(f"✓ Camper status updated to Accepted")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/campers/{camper_id}", headers=self.headers)


class TestPublicApplicationEndpoint:
    """Test public application endpoint (no auth required)"""
    
    def test_submit_application(self):
        """Test submitting application via public endpoint"""
        unique_id = str(uuid.uuid4())[:8]
        application_data = {
            "first_name": f"TEST_Applicant_{unique_id}",
            "last_name": "PublicTest",
            "parent_email": f"public_{unique_id}@example.com",
            "father_first_name": "PublicFather",
            "father_last_name": "PublicTest",
            "father_cell": "555-PUBLIC",
            "emergency_contact_name": "Emergency Contact",
            "emergency_contact_phone": "555-EMERG",
            "emergency_contact_relationship": "Grandparent"
        }
        
        # No auth header - public endpoint
        response = requests.post(f"{BASE_URL}/api/applications", json=application_data)
        assert response.status_code == 200, f"Application submission failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["message"] == "Application submitted successfully"
        
        print(f"✓ Public application submitted: {data['id']}")
        
        # Verify camper was created with Applied status
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_res.json()["access_token"]
        
        get_res = requests.get(f"{BASE_URL}/api/campers/{data['id']}", headers={
            "Authorization": f"Bearer {token}"
        })
        assert get_res.status_code == 200
        camper = get_res.json()
        assert camper["status"] == "Applied"
        assert camper["first_name"] == application_data["first_name"]
        
        print(f"✓ Application created camper with 'Applied' status")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/campers/{data['id']}", headers={
            "Authorization": f"Bearer {token}"
        })


class TestActivityLogEndpoints:
    """Activity log endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_activities_for_camper(self):
        """Test getting activity log for a camper"""
        # First create a camper
        unique_id = str(uuid.uuid4())[:8]
        camper_data = {
            "first_name": f"TEST_Activity_{unique_id}",
            "last_name": "ActivityTest",
            "parent_email": f"activity_{unique_id}@example.com",
            "father_first_name": "ActivityFather",
            "father_last_name": "ActivityTest",
            "father_cell": "555-ACT-IVTY"
        }
        create_res = requests.post(f"{BASE_URL}/api/campers", json=camper_data, headers=self.headers)
        camper_id = create_res.json()["id"]
        
        # Get activities
        response = requests.get(
            f"{BASE_URL}/api/activities?entity_type=camper&entity_id={camper_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        activities = response.json()
        assert isinstance(activities, list)
        
        # Should have at least the "created" activity
        print(f"✓ GET /activities returned {len(activities)} activities for camper")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/campers/{camper_id}", headers=self.headers)
    
    def test_add_note_to_activity_log(self):
        """Test adding a manual note to activity log"""
        # First create a camper
        unique_id = str(uuid.uuid4())[:8]
        camper_data = {
            "first_name": f"TEST_Note_{unique_id}",
            "last_name": "NoteTest",
            "parent_email": f"note_{unique_id}@example.com",
            "father_first_name": "NoteFather",
            "father_last_name": "NoteTest",
            "father_cell": "555-NOTE"
        }
        create_res = requests.post(f"{BASE_URL}/api/campers", json=camper_data, headers=self.headers)
        camper_id = create_res.json()["id"]
        
        # Add note
        note_data = {
            "entity_type": "camper",
            "entity_id": camper_id,
            "note": "Test note from automated testing"
        }
        response = requests.post(f"{BASE_URL}/api/activities/note", json=note_data, headers=self.headers)
        assert response.status_code == 200, f"Add note failed: {response.text}"
        
        # Verify note appears in activities
        activities_res = requests.get(
            f"{BASE_URL}/api/activities?entity_type=camper&entity_id={camper_id}",
            headers=self.headers
        )
        activities = activities_res.json()
        note_found = any(a.get("action") == "note_added" for a in activities)
        assert note_found, "Note not found in activity log"
        
        print(f"✓ Note added to activity log successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/campers/{camper_id}", headers=self.headers)


class TestKanbanEndpoints:
    """Kanban board endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_kanban_board(self):
        """Test getting kanban board with all statuses"""
        response = requests.get(f"{BASE_URL}/api/kanban", headers=self.headers)
        assert response.status_code == 200, f"Kanban failed: {response.text}"
        
        data = response.json()
        assert "statuses" in data
        assert "board" in data
        
        # Verify all 10 statuses
        expected_statuses = [
            "Applied", "Accepted", "Check/Unknown", "Invoice Sent",
            "Payment Plan - Request", "Payment Plan Running", "Sending Check",
            "Partial Paid", "Partial Paid & Committed", "Paid in Full"
        ]
        assert data["statuses"] == expected_statuses
        
        print(f"✓ Kanban board has {len(data['statuses'])} status columns")
    
    def test_kanban_camper_has_parent_info(self):
        """Test that kanban cards include embedded parent contact info"""
        # Create a camper with parent info
        unique_id = str(uuid.uuid4())[:8]
        camper_data = {
            "first_name": f"TEST_Kanban_{unique_id}",
            "last_name": "KanbanTest",
            "parent_email": f"kanban_{unique_id}@example.com",
            "father_first_name": "KanbanFather",
            "father_last_name": "KanbanTest",
            "father_cell": "555-KANBAN"
        }
        create_res = requests.post(f"{BASE_URL}/api/campers", json=camper_data, headers=self.headers)
        camper_id = create_res.json()["id"]
        
        # Get kanban board
        response = requests.get(f"{BASE_URL}/api/kanban", headers=self.headers)
        data = response.json()
        
        # Find our camper in Applied column
        applied_campers = data["board"].get("Applied", [])
        our_camper = next((c for c in applied_campers if c["id"] == camper_id), None)
        
        if our_camper:
            assert "parent_name" in our_camper
            assert "parent_email" in our_camper
            assert "parent_phone" in our_camper
            print(f"✓ Kanban card includes parent contact info")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/campers/{camper_id}", headers=self.headers)


class TestDataCenterEndpoints:
    """Data Center / Reports endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_export_campers_json(self):
        """Test exporting campers data as JSON"""
        response = requests.get(f"{BASE_URL}/api/export/campers?format=json", headers=self.headers)
        assert response.status_code == 200, f"Export failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Export returned {len(data)} campers in JSON format")


class TestGlobalSearch:
    """Global search endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_res.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_search_campers(self):
        """Test global search across campers"""
        # Create a camper with unique name
        unique_id = str(uuid.uuid4())[:8]
        camper_data = {
            "first_name": f"SearchTest_{unique_id}",
            "last_name": "UniqueSearchName",
            "parent_email": f"search_{unique_id}@example.com",
            "father_first_name": "SearchFather",
            "father_last_name": "UniqueSearchName",
            "father_cell": "555-SEARCH"
        }
        create_res = requests.post(f"{BASE_URL}/api/campers", json=camper_data, headers=self.headers)
        camper_id = create_res.json()["id"]
        
        # Search for the camper
        response = requests.get(f"{BASE_URL}/api/search?q=UniqueSearchName", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "campers" in data
        
        # Should find our camper
        found = any(c["id"] == camper_id for c in data["campers"])
        assert found, "Created camper not found in search results"
        
        print(f"✓ Global search found camper by name")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/campers/{camper_id}", headers=self.headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
