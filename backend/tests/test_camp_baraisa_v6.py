"""
Camp Baraisa Backend Tests - Iteration 6
Testing new features:
- Settings page: Account settings, Admin management, Templates, API Keys, Trash
- Delete camper functionality with trash/restore
- Data Center with saved lists system
- Kanban email confirmation with templates
- Removed Call/SMS/Email buttons verification (frontend only)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@campbaraisa.com"
ADMIN_PASSWORD = "testpassword123"


class TestAuth:
    """Authentication tests"""
    
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
        print(f"✓ Login successful for {ADMIN_EMAIL}")
        return data["access_token"]


class TestAccountSettings:
    """Account settings endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_current_admin(self, auth_token):
        """Test GET /api/auth/me returns current admin info"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "name" in data
        print(f"✓ GET /api/auth/me returns admin info: {data['name']}")
    
    def test_update_account(self, auth_token):
        """Test PUT /api/account updates account settings"""
        # Get current admin info first
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        original_name = me_response.json().get("name", "Admin")
        
        # Update with a test phone number
        response = requests.put(f"{BASE_URL}/api/account", json={
            "phone": "555-TEST-123"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        print("✓ PUT /api/account updates account settings")


class TestAdminManagement:
    """Admin management endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_all_admins(self, auth_token):
        """Test GET /api/admins returns list of admins"""
        response = requests.get(f"{BASE_URL}/api/admins", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least the current admin
        print(f"✓ GET /api/admins returns {len(data)} admin(s)")
    
    def test_create_admin(self, auth_token):
        """Test POST /api/admins creates new admin"""
        unique_email = f"test_admin_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/admins", json={
            "name": "Test Admin",
            "email": unique_email,
            "password": "testpass123",
            "role": "admin",
            "phone": "555-0000"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"✓ POST /api/admins creates new admin: {unique_email}")
        return data["id"]
    
    def test_update_admin(self, auth_token):
        """Test PUT /api/admins/{id} updates admin"""
        # First create an admin to update
        unique_email = f"test_update_{uuid.uuid4().hex[:8]}@test.com"
        create_response = requests.post(f"{BASE_URL}/api/admins", json={
            "name": "Admin To Update",
            "email": unique_email,
            "password": "testpass123",
            "role": "admin"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        admin_id = create_response.json()["id"]
        
        # Update the admin
        response = requests.put(f"{BASE_URL}/api/admins/{admin_id}", json={
            "name": "Updated Admin Name",
            "phone": "555-UPDATED"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        print(f"✓ PUT /api/admins/{admin_id} updates admin")
    
    def test_delete_admin(self, auth_token):
        """Test DELETE /api/admins/{id} deletes admin"""
        # First create an admin to delete
        unique_email = f"test_delete_{uuid.uuid4().hex[:8]}@test.com"
        create_response = requests.post(f"{BASE_URL}/api/admins", json={
            "name": "Admin To Delete",
            "email": unique_email,
            "password": "testpass123",
            "role": "admin"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        admin_id = create_response.json()["id"]
        
        # Delete the admin
        response = requests.delete(f"{BASE_URL}/api/admins/{admin_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        print(f"✓ DELETE /api/admins/{admin_id} deletes admin")


class TestCamperTrash:
    """Camper delete/trash/restore endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_trash_list(self, auth_token):
        """Test GET /api/campers/trash/list returns trash items"""
        response = requests.get(f"{BASE_URL}/api/campers/trash/list", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/campers/trash/list returns {len(data)} item(s)")
    
    def test_delete_camper_moves_to_trash(self, auth_token):
        """Test DELETE /api/campers/{id} moves camper to trash"""
        # First create a camper to delete
        unique_name = f"TrashTest_{uuid.uuid4().hex[:6]}"
        create_response = requests.post(f"{BASE_URL}/api/campers", json={
            "first_name": unique_name,
            "last_name": "ToDelete",
            "parent_email": f"{unique_name.lower()}@test.com",
            "father_first_name": "Test",
            "father_last_name": "Father",
            "father_cell": "555-0000"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert create_response.status_code == 200
        camper_id = create_response.json()["id"]
        
        # Delete the camper (soft delete - moves to trash)
        delete_response = requests.delete(f"{BASE_URL}/api/campers/{camper_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert delete_response.status_code == 200
        
        # Verify camper is in trash
        trash_response = requests.get(f"{BASE_URL}/api/campers/trash/list", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        trash_data = trash_response.json()
        camper_in_trash = any(c["id"] == camper_id for c in trash_data)
        assert camper_in_trash, "Deleted camper should be in trash"
        print(f"✓ DELETE /api/campers/{camper_id} moves camper to trash")
        return camper_id
    
    def test_restore_camper_from_trash(self, auth_token):
        """Test POST /api/campers/trash/{id}/restore restores camper"""
        # First create and delete a camper
        unique_name = f"RestoreTest_{uuid.uuid4().hex[:6]}"
        create_response = requests.post(f"{BASE_URL}/api/campers", json={
            "first_name": unique_name,
            "last_name": "ToRestore",
            "parent_email": f"{unique_name.lower()}@test.com",
            "father_first_name": "Test",
            "father_last_name": "Father",
            "father_cell": "555-0000"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        camper_id = create_response.json()["id"]
        
        # Delete the camper
        requests.delete(f"{BASE_URL}/api/campers/{camper_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        
        # Restore the camper
        restore_response = requests.post(f"{BASE_URL}/api/campers/trash/{camper_id}/restore", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert restore_response.status_code == 200
        
        # Verify camper is back in campers list
        campers_response = requests.get(f"{BASE_URL}/api/campers", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        campers_data = campers_response.json()
        camper_restored = any(c["id"] == camper_id for c in campers_data)
        assert camper_restored, "Restored camper should be in campers list"
        print(f"✓ POST /api/campers/trash/{camper_id}/restore restores camper")
    
    def test_permanent_delete_from_trash(self, auth_token):
        """Test DELETE /api/campers/trash/{id}/permanent permanently deletes"""
        # First create and delete a camper
        unique_name = f"PermDelete_{uuid.uuid4().hex[:6]}"
        create_response = requests.post(f"{BASE_URL}/api/campers", json={
            "first_name": unique_name,
            "last_name": "ToPermDelete",
            "parent_email": f"{unique_name.lower()}@test.com",
            "father_first_name": "Test",
            "father_last_name": "Father",
            "father_cell": "555-0000"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        camper_id = create_response.json()["id"]
        
        # Delete the camper (move to trash)
        requests.delete(f"{BASE_URL}/api/campers/{camper_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        
        # Permanently delete
        perm_delete_response = requests.delete(f"{BASE_URL}/api/campers/trash/{camper_id}/permanent", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert perm_delete_response.status_code == 200
        
        # Verify camper is not in trash anymore
        trash_response = requests.get(f"{BASE_URL}/api/campers/trash/list", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        trash_data = trash_response.json()
        camper_in_trash = any(c["id"] == camper_id for c in trash_data)
        assert not camper_in_trash, "Permanently deleted camper should not be in trash"
        print(f"✓ DELETE /api/campers/trash/{camper_id}/permanent permanently deletes")


class TestEmailTemplates:
    """Email template endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_templates(self, auth_token):
        """Test GET /api/email-templates returns templates"""
        response = requests.get(f"{BASE_URL}/api/email-templates", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/email-templates returns {len(data)} template(s)")
    
    def test_create_template_with_trigger(self, auth_token):
        """Test POST /api/email-templates creates template with auto-trigger"""
        unique_name = f"Test Template {uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/email-templates", json={
            "name": unique_name,
            "subject": "Test Subject {{camper_first_name}}",
            "body": "Hello {{parent_father_first_name}}, your camper {{camper_first_name}} has been accepted!",
            "trigger": "status_accepted",
            "template_type": "email"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"✓ POST /api/email-templates creates template with trigger: {unique_name}")
        return data["id"]
    
    def test_update_template(self, auth_token):
        """Test PUT /api/email-templates/{id} updates template"""
        # First create a template
        unique_name = f"Update Template {uuid.uuid4().hex[:6]}"
        create_response = requests.post(f"{BASE_URL}/api/email-templates", json={
            "name": unique_name,
            "subject": "Original Subject",
            "body": "Original body",
            "template_type": "email"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        template_id = create_response.json()["id"]
        
        # Update the template
        response = requests.put(f"{BASE_URL}/api/email-templates/{template_id}", json={
            "name": unique_name,
            "subject": "Updated Subject",
            "body": "Updated body with {{camper_first_name}}",
            "trigger": "status_paid_in_full",
            "template_type": "email"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        print(f"✓ PUT /api/email-templates/{template_id} updates template")
    
    def test_delete_template(self, auth_token):
        """Test DELETE /api/email-templates/{id} deletes template"""
        # First create a template
        unique_name = f"Delete Template {uuid.uuid4().hex[:6]}"
        create_response = requests.post(f"{BASE_URL}/api/email-templates", json={
            "name": unique_name,
            "subject": "To Delete",
            "body": "This will be deleted",
            "template_type": "email"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        template_id = create_response.json()["id"]
        
        # Delete the template
        response = requests.delete(f"{BASE_URL}/api/email-templates/{template_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        print(f"✓ DELETE /api/email-templates/{template_id} deletes template")


class TestSavedReports:
    """Data Center saved reports/lists endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_reports(self, auth_token):
        """Test GET /api/reports returns saved reports"""
        response = requests.get(f"{BASE_URL}/api/reports", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/reports returns {len(data)} report(s)")
    
    def test_create_report(self, auth_token):
        """Test POST /api/reports creates new saved list"""
        unique_name = f"Test List {uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/reports", json={
            "name": unique_name,
            "description": "Test list for parent contacts",
            "columns": ["first_name", "last_name", "parent_email", "father_cell"],
            "sort_by": "last_name",
            "sort_order": "asc"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"✓ POST /api/reports creates new list: {unique_name}")
        return data["id"]
    
    def test_get_report_with_data(self, auth_token):
        """Test GET /api/reports/{id} returns report with data"""
        # First create a report
        unique_name = f"Data List {uuid.uuid4().hex[:6]}"
        create_response = requests.post(f"{BASE_URL}/api/reports", json={
            "name": unique_name,
            "columns": ["first_name", "last_name", "status"],
            "sort_by": "first_name",
            "sort_order": "asc"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        report_id = create_response.json()["id"]
        
        # Get the report with data
        response = requests.get(f"{BASE_URL}/api/reports/{report_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "report" in data
        assert "data" in data
        assert isinstance(data["data"], list)
        print(f"✓ GET /api/reports/{report_id} returns report with {len(data['data'])} records")
    
    def test_update_report(self, auth_token):
        """Test PUT /api/reports/{id} updates report"""
        # First create a report
        unique_name = f"Update List {uuid.uuid4().hex[:6]}"
        create_response = requests.post(f"{BASE_URL}/api/reports", json={
            "name": unique_name,
            "columns": ["first_name", "last_name"]
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        report_id = create_response.json()["id"]
        
        # Update the report
        response = requests.put(f"{BASE_URL}/api/reports/{report_id}", json={
            "name": unique_name + " Updated",
            "columns": ["first_name", "last_name", "yeshiva", "grade"],
            "sort_by": "grade",
            "sort_order": "desc"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        print(f"✓ PUT /api/reports/{report_id} updates report")
    
    def test_delete_report(self, auth_token):
        """Test DELETE /api/reports/{id} deletes report"""
        # First create a report
        unique_name = f"Delete List {uuid.uuid4().hex[:6]}"
        create_response = requests.post(f"{BASE_URL}/api/reports", json={
            "name": unique_name,
            "columns": ["first_name", "last_name"]
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        report_id = create_response.json()["id"]
        
        # Delete the report
        response = requests.delete(f"{BASE_URL}/api/reports/{report_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        print(f"✓ DELETE /api/reports/{report_id} deletes report")


class TestKanbanEmailPreview:
    """Kanban email preview endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_email_preview_for_status_change(self, auth_token):
        """Test GET /api/campers/{id}/email-preview returns email preview"""
        # First get a camper
        campers_response = requests.get(f"{BASE_URL}/api/campers", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        campers = campers_response.json()
        
        if len(campers) == 0:
            # Create a test camper
            create_response = requests.post(f"{BASE_URL}/api/campers", json={
                "first_name": "EmailPreview",
                "last_name": "Test",
                "parent_email": "emailpreview@test.com",
                "father_first_name": "Test",
                "father_last_name": "Father",
                "father_cell": "555-0000"
            }, headers={
                "Authorization": f"Bearer {auth_token}"
            })
            camper_id = create_response.json()["id"]
        else:
            camper_id = campers[0]["id"]
        
        # Get email preview for "Accepted" status
        response = requests.get(f"{BASE_URL}/api/campers/{camper_id}/email-preview?new_status=Accepted", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "has_template" in data
        print(f"✓ GET /api/campers/{camper_id}/email-preview returns preview (has_template: {data['has_template']})")
    
    def test_status_change_with_skip_email(self, auth_token):
        """Test PUT /api/campers/{id}/status with skip_email parameter"""
        # Create a test camper
        unique_name = f"SkipEmail_{uuid.uuid4().hex[:6]}"
        create_response = requests.post(f"{BASE_URL}/api/campers", json={
            "first_name": unique_name,
            "last_name": "Test",
            "parent_email": f"{unique_name.lower()}@test.com",
            "father_first_name": "Test",
            "father_last_name": "Father",
            "father_cell": "555-0000"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        camper_id = create_response.json()["id"]
        
        # Update status with skip_email=true
        response = requests.put(
            f"{BASE_URL}/api/campers/{camper_id}/status?status=Accepted&skip_email=true",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email_triggered" in data
        assert data["email_triggered"] == False  # Should be false because we skipped
        print(f"✓ PUT /api/campers/{camper_id}/status with skip_email=true works")


class TestSettings:
    """Settings endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_settings(self, auth_token):
        """Test GET /api/settings returns settings"""
        response = requests.get(f"{BASE_URL}/api/settings", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        # Settings might return 200 or 404 if not configured
        assert response.status_code in [200, 404]
        print(f"✓ GET /api/settings returns status {response.status_code}")
    
    def test_update_settings(self, auth_token):
        """Test PUT /api/settings updates settings"""
        response = requests.put(f"{BASE_URL}/api/settings", json={
            "camp_name": "Camp Baraisa",
            "camp_email": "office@campbaraisa.com",
            "camp_phone": "848-BAR-AISA"
        }, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        # Settings update should work
        assert response.status_code == 200
        print("✓ PUT /api/settings updates settings")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
