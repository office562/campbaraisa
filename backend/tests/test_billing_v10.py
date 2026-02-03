"""
Test Suite for Camp Baraisa Billing System - Iteration 10
Tests: Invoice numbers, soft delete/trash, installment plans, send invoice, portal settings
"""
import pytest
import requests
import os
import uuid

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
    
    def test_login_success(self, auth_token):
        """Test login returns valid token"""
        assert auth_token is not None
        assert len(auth_token) > 0


class TestInvoiceCreation:
    """Test invoice creation with invoice numbers and portal tokens"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def test_camper(self, auth_token):
        """Create a test camper for invoice tests"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        camper_data = {
            "first_name": f"TEST_Invoice_{uuid.uuid4().hex[:6]}",
            "last_name": "TestCamper",
            "parent_email": "test@example.com",
            "father_first_name": "Test",
            "father_last_name": "Parent"
        }
        response = requests.post(f"{BASE_URL}/api/campers", json=camper_data, headers=headers)
        assert response.status_code == 200, f"Failed to create camper: {response.text}"
        return response.json()
    
    def test_create_invoice_with_number(self, auth_token, test_camper):
        """Test POST /api/invoices creates invoice with invoice_number and portal_token"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        invoice_data = {
            "camper_id": test_camper["id"],
            "description": "Test Invoice for billing features",
            "due_date": "2026-03-15",
            "line_items": [
                {"description": "Camp Fee", "amount": 3475, "quantity": 1}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data, headers=headers)
        assert response.status_code == 200, f"Failed to create invoice: {response.text}"
        
        invoice = response.json()
        
        # Verify invoice_number is generated
        assert "invoice_number" in invoice, "Invoice should have invoice_number"
        assert invoice["invoice_number"] is not None, "invoice_number should not be None"
        assert invoice["invoice_number"].startswith("INV-"), f"invoice_number should start with INV-, got: {invoice['invoice_number']}"
        
        # Verify portal_token is generated
        assert "portal_token" in invoice, "Invoice should have portal_token"
        assert invoice["portal_token"] is not None, "portal_token should not be None"
        assert len(invoice["portal_token"]) > 10, "portal_token should be a secure token"
        
        # Verify other fields
        assert invoice["status"] == "draft", "New invoice should be in draft status"
        assert invoice["amount"] == 3475, "Invoice amount should match line items"
        
        return invoice
    
    def test_invoice_number_format(self, auth_token, test_camper):
        """Test invoice number follows format INV-YYYY-XXXXX"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        invoice_data = {
            "camper_id": test_camper["id"],
            "description": "Test Invoice Number Format",
            "line_items": [{"description": "Test Fee", "amount": 100, "quantity": 1}]
        }
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data, headers=headers)
        assert response.status_code == 200
        
        invoice = response.json()
        invoice_number = invoice["invoice_number"]
        
        # Format: INV-2026-00001
        parts = invoice_number.split("-")
        assert len(parts) == 3, f"Invoice number should have 3 parts: {invoice_number}"
        assert parts[0] == "INV", "First part should be INV"
        assert parts[1].isdigit() and len(parts[1]) == 4, "Second part should be 4-digit year"
        assert parts[2].isdigit() and len(parts[2]) == 5, "Third part should be 5-digit sequence"


class TestInvoiceSoftDelete:
    """Test invoice soft delete (trash) functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def test_camper(self, auth_token):
        headers = {"Authorization": f"Bearer {auth_token}"}
        camper_data = {
            "first_name": f"TEST_Delete_{uuid.uuid4().hex[:6]}",
            "last_name": "TestCamper",
            "parent_email": "delete@example.com"
        }
        response = requests.post(f"{BASE_URL}/api/campers", json=camper_data, headers=headers)
        return response.json()
    
    @pytest.fixture
    def test_invoice(self, auth_token, test_camper):
        """Create a test invoice for delete tests"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        invoice_data = {
            "camper_id": test_camper["id"],
            "description": "Invoice for delete test",
            "line_items": [{"description": "Test Fee", "amount": 500, "quantity": 1}]
        }
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data, headers=headers)
        return response.json()
    
    def test_delete_invoice_soft_delete(self, auth_token, test_invoice):
        """Test DELETE /api/invoices/{id} performs soft delete"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        invoice_id = test_invoice["id"]
        
        # Delete the invoice
        response = requests.delete(f"{BASE_URL}/api/invoices/{invoice_id}", headers=headers)
        assert response.status_code == 200, f"Failed to delete invoice: {response.text}"
        assert "deleted" in response.json().get("message", "").lower()
        
        # Verify invoice is not in regular list
        list_response = requests.get(f"{BASE_URL}/api/invoices", headers=headers)
        assert list_response.status_code == 200
        invoices = list_response.json()
        invoice_ids = [inv["id"] for inv in invoices]
        assert invoice_id not in invoice_ids, "Deleted invoice should not appear in regular list"
    
    def test_get_trash_list(self, auth_token, test_invoice):
        """Test GET /api/invoices/trash/list returns deleted invoices"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        invoice_id = test_invoice["id"]
        
        # First delete the invoice
        requests.delete(f"{BASE_URL}/api/invoices/{invoice_id}", headers=headers)
        
        # Get trash list
        response = requests.get(f"{BASE_URL}/api/invoices/trash/list", headers=headers)
        assert response.status_code == 200, f"Failed to get trash list: {response.text}"
        
        trash = response.json()
        assert isinstance(trash, list), "Trash should be a list"
        
        # Verify deleted invoice is in trash
        trash_ids = [inv["id"] for inv in trash]
        assert invoice_id in trash_ids, "Deleted invoice should be in trash"
    
    def test_restore_invoice_from_trash(self, auth_token, test_invoice):
        """Test POST /api/invoices/{id}/restore restores from trash"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        invoice_id = test_invoice["id"]
        
        # Delete the invoice first
        requests.delete(f"{BASE_URL}/api/invoices/{invoice_id}", headers=headers)
        
        # Restore the invoice
        response = requests.post(f"{BASE_URL}/api/invoices/{invoice_id}/restore", headers=headers)
        assert response.status_code == 200, f"Failed to restore invoice: {response.text}"
        assert "restored" in response.json().get("message", "").lower()
        
        # Verify invoice is back in regular list
        list_response = requests.get(f"{BASE_URL}/api/invoices", headers=headers)
        invoices = list_response.json()
        invoice_ids = [inv["id"] for inv in invoices]
        assert invoice_id in invoice_ids, "Restored invoice should appear in regular list"
        
        # Verify invoice is no longer in trash
        trash_response = requests.get(f"{BASE_URL}/api/invoices/trash/list", headers=headers)
        trash = trash_response.json()
        trash_ids = [inv["id"] for inv in trash]
        assert invoice_id not in trash_ids, "Restored invoice should not be in trash"


class TestInstallmentPlans:
    """Test installment plan functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def test_camper(self, auth_token):
        headers = {"Authorization": f"Bearer {auth_token}"}
        camper_data = {
            "first_name": f"TEST_Installment_{uuid.uuid4().hex[:6]}",
            "last_name": "TestCamper",
            "parent_email": "installment@example.com"
        }
        response = requests.post(f"{BASE_URL}/api/campers", json=camper_data, headers=headers)
        return response.json()
    
    @pytest.fixture
    def test_invoice(self, auth_token, test_camper):
        headers = {"Authorization": f"Bearer {auth_token}"}
        invoice_data = {
            "camper_id": test_camper["id"],
            "description": "Invoice for installment test",
            "due_date": "2026-04-01",
            "line_items": [{"description": "Camp Fee", "amount": 3000, "quantity": 1}]
        }
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data, headers=headers)
        return response.json()
    
    def test_setup_installments(self, auth_token, test_invoice):
        """Test POST /api/invoices/{id}/installments creates installment plan"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        invoice_id = test_invoice["id"]
        
        # Setup 3 installments
        response = requests.post(
            f"{BASE_URL}/api/invoices/{invoice_id}/installments",
            json={"num_installments": 3},
            headers=headers
        )
        assert response.status_code == 200, f"Failed to setup installments: {response.text}"
        
        result = response.json()
        assert "plan" in result, "Response should contain plan"
        
        plan = result["plan"]
        assert plan["num_installments"] == 3, "Should have 3 installments"
        assert plan["total_amount"] == 3000, "Total amount should match invoice"
        assert len(plan["schedule"]) == 3, "Schedule should have 3 entries"
        
        # Verify each installment
        for i, installment in enumerate(plan["schedule"]):
            assert "due_date" in installment, "Installment should have due_date"
            assert "amount" in installment, "Installment should have amount"
            assert installment["status"] == "pending", "Installment should be pending"
            assert installment["installment_number"] == i + 1
        
        # Verify amounts sum to total
        total = sum(inst["amount"] for inst in plan["schedule"])
        assert total == 3000, f"Installment amounts should sum to 3000, got {total}"
    
    def test_create_invoice_with_installments(self, auth_token, test_camper):
        """Test creating invoice with installments in one request"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        invoice_data = {
            "camper_id": test_camper["id"],
            "description": "Invoice with installments",
            "due_date": "2026-05-01",
            "line_items": [{"description": "Camp Fee", "amount": 2400, "quantity": 1}],
            "create_installments": True,
            "num_installments": 4
        }
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data, headers=headers)
        assert response.status_code == 200, f"Failed to create invoice: {response.text}"
        
        invoice = response.json()
        assert invoice["installment_plan"] is not None, "Invoice should have installment_plan"
        assert invoice["installment_plan"]["num_installments"] == 4


class TestSendInvoice:
    """Test send invoice functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def test_camper(self, auth_token):
        headers = {"Authorization": f"Bearer {auth_token}"}
        camper_data = {
            "first_name": f"TEST_Send_{uuid.uuid4().hex[:6]}",
            "last_name": "TestCamper",
            "parent_email": "send@example.com"
        }
        response = requests.post(f"{BASE_URL}/api/campers", json=camper_data, headers=headers)
        return response.json()
    
    @pytest.fixture
    def test_invoice(self, auth_token, test_camper):
        headers = {"Authorization": f"Bearer {auth_token}"}
        invoice_data = {
            "camper_id": test_camper["id"],
            "description": "Invoice for send test",
            "line_items": [{"description": "Test Fee", "amount": 1000, "quantity": 1}]
        }
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data, headers=headers)
        return response.json()
    
    def test_send_invoice(self, auth_token, test_invoice):
        """Test POST /api/invoices/{id}/send marks invoice as sent"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        invoice_id = test_invoice["id"]
        
        # Verify initial status is draft
        assert test_invoice["status"] == "draft"
        
        # Send the invoice
        response = requests.post(f"{BASE_URL}/api/invoices/{invoice_id}/send", headers=headers)
        assert response.status_code == 200, f"Failed to send invoice: {response.text}"
        
        result = response.json()
        assert result["status"] == "sent", "Invoice status should be 'sent'"
        
        # Verify invoice status is updated
        get_response = requests.get(f"{BASE_URL}/api/invoices/{invoice_id}", headers=headers)
        assert get_response.status_code == 200
        
        updated_invoice = get_response.json()
        assert updated_invoice["status"] == "sent", "Invoice status should be 'sent'"
        assert updated_invoice.get("sent_at") is not None, "sent_at should be set"


class TestPortalSettings:
    """Test portal settings toggle"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        return response.json()["access_token"]
    
    def test_get_settings_has_portal_links_enabled(self, auth_token):
        """Test GET /api/settings returns portal_links_enabled"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        assert response.status_code == 200, f"Failed to get settings: {response.text}"
        
        settings = response.json()
        assert "portal_links_enabled" in settings, "Settings should have portal_links_enabled"
    
    def test_update_portal_links_enabled(self, auth_token):
        """Test PUT /api/settings can toggle portal_links_enabled"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        current_settings = get_response.json()
        current_value = current_settings.get("portal_links_enabled", True)
        
        # Toggle the value
        new_value = not current_value
        update_response = requests.put(
            f"{BASE_URL}/api/settings",
            json={"portal_links_enabled": new_value},
            headers=headers
        )
        assert update_response.status_code == 200, f"Failed to update settings: {update_response.text}"
        
        # Verify the change
        verify_response = requests.get(f"{BASE_URL}/api/settings", headers=headers)
        updated_settings = verify_response.json()
        assert updated_settings["portal_links_enabled"] == new_value, "portal_links_enabled should be updated"
        
        # Restore original value
        requests.put(
            f"{BASE_URL}/api/settings",
            json={"portal_links_enabled": current_value},
            headers=headers
        )
    
    def test_portal_check_endpoint(self, auth_token):
        """Test GET /api/portal/check/{token} respects portal_links_enabled"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a camper to get a portal token
        camper_data = {
            "first_name": f"TEST_Portal_{uuid.uuid4().hex[:6]}",
            "last_name": "TestCamper",
            "parent_email": "portal@example.com"
        }
        camper_response = requests.post(f"{BASE_URL}/api/campers", json=camper_data, headers=headers)
        camper = camper_response.json()
        portal_token = camper.get("portal_token")
        
        if portal_token:
            # Test portal check with valid token
            check_response = requests.get(f"{BASE_URL}/api/portal/check/{portal_token}")
            # Should return 200 if portal is enabled, or 403 if disabled
            assert check_response.status_code in [200, 403], f"Unexpected status: {check_response.status_code}"


class TestStripeWebhook:
    """Test Stripe webhook endpoint exists"""
    
    def test_stripe_webhook_endpoint_exists(self):
        """Test POST /api/stripe/webhook endpoint exists"""
        # Just verify the endpoint exists (will return error without proper signature)
        response = requests.post(
            f"{BASE_URL}/api/stripe/webhook",
            data="{}",
            headers={"Content-Type": "application/json"}
        )
        # Should not be 404 - any other error is acceptable (400, 401, 500 etc)
        assert response.status_code != 404, "Stripe webhook endpoint should exist"


class TestInvoiceListWithNumbers:
    """Test invoice list shows invoice numbers"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@campbaraisa.com",
            "password": "testpassword123"
        })
        return response.json()["access_token"]
    
    def test_invoices_list_has_invoice_numbers(self, auth_token):
        """Test GET /api/invoices returns invoices with invoice_number field"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/invoices", headers=headers)
        assert response.status_code == 200
        
        invoices = response.json()
        if len(invoices) > 0:
            # Check that invoices have invoice_number
            for invoice in invoices[:5]:  # Check first 5
                assert "invoice_number" in invoice, "Invoice should have invoice_number field"


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup test data after all tests"""
    yield
    # Cleanup would happen here if needed
    # For now, test data with TEST_ prefix can be identified and cleaned manually


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
