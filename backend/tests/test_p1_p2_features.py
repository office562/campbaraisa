"""
Test P1/P2 Features for Camp Baraisa
- Hierarchical Groups
- Smart Search
- QuickBooks Export
- Expense Tracking
- Communications Log
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    def test_login_success(self):
        """Test successful login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "admin" in data
        assert data["admin"]["email"] == "admin@campbaraisa.com"


class TestGroups:
    """Hierarchical Groups API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_groups(self, auth_headers):
        """Test getting all groups"""
        response = requests.get(f"{BASE_URL}/api/groups", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} groups")
    
    def test_create_parent_group(self, auth_headers):
        """Test creating a parent group"""
        response = requests.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_Transportation",
            "description": "Transportation groups"
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Transportation"
        assert data["parent_id"] is None
        assert "id" in data
        return data["id"]
    
    def test_create_subgroup(self, auth_headers):
        """Test creating a subgroup under a parent"""
        # First create parent
        parent_response = requests.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_Shiurim",
            "description": "Shiur groups"
        }, headers=auth_headers)
        assert parent_response.status_code == 200
        parent_id = parent_response.json()["id"]
        
        # Create subgroup
        response = requests.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_Shiur_Aleph",
            "description": "First shiur",
            "parent_id": parent_id
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Shiur_Aleph"
        assert data["parent_id"] == parent_id
    
    def test_update_group(self, auth_headers):
        """Test updating a group"""
        # Create a group first
        create_response = requests.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_ToUpdate",
            "description": "Will be updated"
        }, headers=auth_headers)
        group_id = create_response.json()["id"]
        
        # Update it
        response = requests.put(f"{BASE_URL}/api/groups/{group_id}", json={
            "name": "TEST_Updated",
            "description": "Updated description"
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Updated"
    
    def test_assign_campers_to_group(self, auth_headers):
        """Test assigning campers to a group"""
        # Get a camper
        campers_response = requests.get(f"{BASE_URL}/api/campers", headers=auth_headers)
        campers = campers_response.json()
        if not campers:
            pytest.skip("No campers available for testing")
        
        camper_id = campers[0]["id"]
        
        # Create a group
        group_response = requests.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_WithCampers",
            "description": "Group with campers"
        }, headers=auth_headers)
        group_id = group_response.json()["id"]
        
        # Assign camper
        response = requests.put(f"{BASE_URL}/api/groups/{group_id}/campers", json={
            "camper_ids": [camper_id]
        }, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify assignment
        get_response = requests.get(f"{BASE_URL}/api/groups/{group_id}", headers=auth_headers)
        assert get_response.status_code == 200
        data = get_response.json()
        assert camper_id in data.get("camper_ids", []) or camper_id in data.get("assigned_campers", [])
    
    def test_delete_group(self, auth_headers):
        """Test deleting a group"""
        # Create a group
        create_response = requests.post(f"{BASE_URL}/api/groups", json={
            "name": "TEST_ToDelete",
            "description": "Will be deleted"
        }, headers=auth_headers)
        group_id = create_response.json()["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/groups/{group_id}", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/groups/{group_id}", headers=auth_headers)
        assert get_response.status_code == 404


class TestSmartSearch:
    """Smart Search API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_search_campers(self, auth_headers):
        """Test searching for campers"""
        response = requests.get(f"{BASE_URL}/api/search?q=Test", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "campers" in data
        print(f"Found {len(data['campers'])} matching campers")
    
    def test_search_by_yeshiva(self, auth_headers):
        """Test searching by yeshiva name"""
        response = requests.get(f"{BASE_URL}/api/search?q=Yeshiva", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "campers" in data
    
    def test_search_minimum_length(self, auth_headers):
        """Test that search requires minimum 2 characters"""
        response = requests.get(f"{BASE_URL}/api/search?q=a", headers=auth_headers)
        # Should return 422 validation error for too short query
        assert response.status_code == 422


class TestFinancial:
    """Financial API tests - QuickBooks Export and Summary"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_financial_summary(self, auth_headers):
        """Test getting financial summary"""
        response = requests.get(f"{BASE_URL}/api/financial/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "total_invoiced" in data
        assert "total_collected" in data
        assert "total_outstanding" in data
        assert "total_expenses" in data
        assert "net_income" in data
        assert "expense_by_category" in data
        assert "payment_by_method" in data
        
        print(f"Financial Summary: Invoiced=${data['total_invoiced']}, Collected=${data['total_collected']}")
    
    def test_quickbooks_export(self, auth_headers):
        """Test QuickBooks export endpoint"""
        response = requests.get(f"{BASE_URL}/api/financial/quickbooks-export", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify export structure
        assert "invoices" in data
        assert "payments" in data
        assert "expenses" in data
        assert "summary" in data
        
        # Verify summary fields
        assert "total_invoiced" in data["summary"]
        assert "total_collected" in data["summary"]
        assert "total_expenses" in data["summary"]
        assert "export_date" in data["summary"]
        
        print(f"QuickBooks Export: {len(data['invoices'])} invoices, {len(data['payments'])} payments, {len(data['expenses'])} expenses")
    
    def test_quickbooks_export_invoice_format(self, auth_headers):
        """Test QuickBooks export invoice format"""
        response = requests.get(f"{BASE_URL}/api/financial/quickbooks-export", headers=auth_headers)
        data = response.json()
        
        if data["invoices"]:
            invoice = data["invoices"][0]
            # Verify invoice fields for QuickBooks compatibility
            assert "Date" in invoice
            assert "Type" in invoice
            assert "Customer" in invoice
            assert "Description" in invoice
            assert "Amount" in invoice
            assert "Balance" in invoice
            assert "Status" in invoice


class TestExpenses:
    """Expense Tracking API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_expenses(self, auth_headers):
        """Test getting all expenses"""
        response = requests.get(f"{BASE_URL}/api/expenses", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} expenses")
    
    def test_create_expense(self, auth_headers):
        """Test creating a new expense"""
        response = requests.post(f"{BASE_URL}/api/expenses", json={
            "category": "Food & Catering",
            "amount": 500.00,
            "description": "TEST_Lunch supplies",
            "date": "2026-02-01",
            "vendor": "Test Vendor"
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["category"] == "Food & Catering"
        assert data["amount"] == 500.00
        assert data["description"] == "TEST_Lunch supplies"
        assert "id" in data
        print(f"Created expense: {data['id']}")
    
    def test_create_expense_different_categories(self, auth_headers):
        """Test creating expenses in different categories"""
        categories = ["Staff Salaries", "Transportation", "Activities & Equipment"]
        
        for category in categories:
            response = requests.post(f"{BASE_URL}/api/expenses", json={
                "category": category,
                "amount": 100.00,
                "description": f"TEST_{category} expense",
                "date": "2026-02-01"
            }, headers=auth_headers)
            assert response.status_code == 200
            assert response.json()["category"] == category
    
    def test_get_expense_categories(self, auth_headers):
        """Test getting expense categories"""
        response = requests.get(f"{BASE_URL}/api/expenses/categories", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestCommunications:
    """Communications Log API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_communications(self, auth_headers):
        """Test getting all communications"""
        response = requests.get(f"{BASE_URL}/api/communications", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} communications")
    
    def test_get_communications_by_type_email(self, auth_headers):
        """Test filtering communications by email type"""
        response = requests.get(f"{BASE_URL}/api/communications?type=email", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # All returned items should be email type
        for comm in data:
            assert comm["type"] == "email"
    
    def test_get_communications_by_type_sms(self, auth_headers):
        """Test filtering communications by SMS type"""
        response = requests.get(f"{BASE_URL}/api/communications?type=sms", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # All returned items should be sms type
        for comm in data:
            assert comm["type"] == "sms"
    
    def test_create_communication(self, auth_headers):
        """Test creating a new communication"""
        # Get a camper first
        campers_response = requests.get(f"{BASE_URL}/api/campers", headers=auth_headers)
        campers = campers_response.json()
        if not campers:
            pytest.skip("No campers available for testing")
        
        camper_id = campers[0]["id"]
        
        response = requests.post(f"{BASE_URL}/api/communications", json={
            "camper_id": camper_id,
            "type": "email",
            "subject": "TEST_Communication Subject",
            "message": "This is a test communication message",
            "direction": "outbound",
            "recipient_email": "test@example.com"
        }, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["type"] == "email"
        assert data["subject"] == "TEST_Communication Subject"
        assert data["status"] == "pending"
        assert "id" in data


class TestInvoiceReminders:
    """Invoice Reminder API tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_due_reminders(self, auth_headers):
        """Test getting invoices due for reminders"""
        response = requests.get(f"{BASE_URL}/api/invoices/due-reminders", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} invoices due for reminders")


# Cleanup fixture to remove test data
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    
    # Get auth token
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@campbaraisa.com",
        "password": "testpassword123"
    })
    if response.status_code != 200:
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Delete test groups
    groups_response = requests.get(f"{BASE_URL}/api/groups", headers=headers)
    if groups_response.status_code == 200:
        for group in groups_response.json():
            if group.get("name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/groups/{group['id']}", headers=headers)
    
    print("Test data cleanup completed")
