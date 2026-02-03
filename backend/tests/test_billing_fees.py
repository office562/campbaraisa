"""
Backend API tests for Camp Baraisa - Billing and Fees functionality
Tests: Fee CRUD, Invoice creation, Stripe checkout dialog
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@campbaraisa.com"
TEST_PASSWORD = "testpassword123"


class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "admin" in data
        return data["access_token"]


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestFees:
    """Fee management tests - including editing default camp fee"""
    
    def test_get_fees(self, auth_headers):
        """Test getting all fees"""
        response = requests.get(f"{BASE_URL}/api/fees", headers=auth_headers)
        assert response.status_code == 200, f"Get fees failed: {response.text}"
        fees = response.json()
        assert isinstance(fees, list)
        # Should have at least the default camp fee
        assert len(fees) >= 1
        # Check default fee exists
        default_fee = next((f for f in fees if f.get("is_default")), None)
        assert default_fee is not None, "Default camp fee should exist"
        assert default_fee["name"] == "Camp Fee"
        print(f"Found {len(fees)} fees, default fee amount: ${default_fee['amount']}")
        return fees
    
    def test_create_fee(self, auth_headers):
        """Test creating a new fee"""
        new_fee = {
            "name": "TEST_Transportation Fee",
            "amount": 150.00,
            "description": "Bus transportation to camp"
        }
        response = requests.post(f"{BASE_URL}/api/fees", json=new_fee, headers=auth_headers)
        assert response.status_code == 200, f"Create fee failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"Created fee with ID: {data['id']}")
        return data["id"]
    
    def test_update_fee(self, auth_headers):
        """Test updating a fee (including default camp fee)"""
        # First get all fees
        response = requests.get(f"{BASE_URL}/api/fees", headers=auth_headers)
        fees = response.json()
        
        # Find the default camp fee
        default_fee = next((f for f in fees if f.get("is_default")), None)
        assert default_fee is not None, "Default camp fee should exist"
        
        original_amount = default_fee["amount"]
        fee_id = default_fee["id"]
        
        # Update the default fee amount
        new_amount = 3500.00
        update_data = {
            "name": "Camp Fee",
            "amount": new_amount,
            "description": "Summer 2026 Camp Fee - Updated"
        }
        response = requests.put(f"{BASE_URL}/api/fees/{fee_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200, f"Update fee failed: {response.text}"
        
        # Verify the update
        response = requests.get(f"{BASE_URL}/api/fees", headers=auth_headers)
        fees = response.json()
        updated_fee = next((f for f in fees if f["id"] == fee_id), None)
        assert updated_fee is not None
        assert updated_fee["amount"] == new_amount, f"Fee amount should be {new_amount}, got {updated_fee['amount']}"
        print(f"Successfully updated default camp fee from ${original_amount} to ${new_amount}")
        
        # Restore original amount
        restore_data = {"amount": original_amount}
        requests.put(f"{BASE_URL}/api/fees/{fee_id}", json=restore_data, headers=auth_headers)
        return True
    
    def test_update_custom_fee(self, auth_headers):
        """Test updating a custom (non-default) fee"""
        # Create a test fee first
        new_fee = {
            "name": "TEST_Activity Fee",
            "amount": 75.00,
            "description": "Activity fee for testing"
        }
        response = requests.post(f"{BASE_URL}/api/fees", json=new_fee, headers=auth_headers)
        assert response.status_code == 200
        fee_id = response.json()["id"]
        
        # Update the fee
        update_data = {
            "name": "TEST_Activity Fee Updated",
            "amount": 100.00,
            "description": "Updated activity fee"
        }
        response = requests.put(f"{BASE_URL}/api/fees/{fee_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200, f"Update custom fee failed: {response.text}"
        
        # Verify update
        response = requests.get(f"{BASE_URL}/api/fees", headers=auth_headers)
        fees = response.json()
        updated_fee = next((f for f in fees if f["id"] == fee_id), None)
        assert updated_fee is not None
        assert updated_fee["amount"] == 100.00
        assert updated_fee["name"] == "TEST_Activity Fee Updated"
        print(f"Successfully updated custom fee to ${updated_fee['amount']}")
        
        # Cleanup - delete the test fee
        requests.delete(f"{BASE_URL}/api/fees/{fee_id}", headers=auth_headers)
        return True
    
    def test_delete_fee(self, auth_headers):
        """Test deleting a non-default fee"""
        # Create a fee to delete
        new_fee = {
            "name": "TEST_Delete Me Fee",
            "amount": 50.00,
            "description": "Fee to be deleted"
        }
        response = requests.post(f"{BASE_URL}/api/fees", json=new_fee, headers=auth_headers)
        fee_id = response.json()["id"]
        
        # Delete the fee
        response = requests.delete(f"{BASE_URL}/api/fees/{fee_id}", headers=auth_headers)
        assert response.status_code == 200, f"Delete fee failed: {response.text}"
        
        # Verify deletion
        response = requests.get(f"{BASE_URL}/api/fees", headers=auth_headers)
        fees = response.json()
        deleted_fee = next((f for f in fees if f["id"] == fee_id), None)
        assert deleted_fee is None, "Fee should be deleted"
        print("Successfully deleted test fee")
        return True
    
    def test_cannot_delete_default_fee(self, auth_headers):
        """Test that default camp fee cannot be deleted"""
        response = requests.get(f"{BASE_URL}/api/fees", headers=auth_headers)
        fees = response.json()
        default_fee = next((f for f in fees if f.get("is_default")), None)
        
        if default_fee:
            response = requests.delete(f"{BASE_URL}/api/fees/{default_fee['id']}", headers=auth_headers)
            assert response.status_code == 400, "Should not be able to delete default fee"
            print("Correctly prevented deletion of default camp fee")
        return True


class TestInvoices:
    """Invoice creation and management tests"""
    
    def test_get_invoices(self, auth_headers):
        """Test getting all invoices"""
        response = requests.get(f"{BASE_URL}/api/invoices", headers=auth_headers)
        assert response.status_code == 200, f"Get invoices failed: {response.text}"
        invoices = response.json()
        assert isinstance(invoices, list)
        print(f"Found {len(invoices)} invoices")
        return invoices
    
    def test_create_invoice_with_camper(self, auth_headers):
        """Test creating an invoice for a camper"""
        # First get a camper
        response = requests.get(f"{BASE_URL}/api/campers", headers=auth_headers)
        campers = response.json()
        
        if len(campers) == 0:
            pytest.skip("No campers available for invoice test")
        
        camper = campers[0]
        
        # Create invoice
        invoice_data = {
            "camper_id": camper["id"],
            "amount": 3475.00,
            "description": "TEST_Camp Fee 2026",
            "due_date": "2026-06-01"
        }
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data, headers=auth_headers)
        assert response.status_code == 200, f"Create invoice failed: {response.text}"
        invoice = response.json()
        assert invoice["camper_id"] == camper["id"]
        assert invoice["amount"] == 3475.00
        assert invoice["status"] == "pending"
        print(f"Created invoice {invoice['id']} for camper {camper['first_name']} {camper['last_name']}")
        return invoice


class TestCampers:
    """Camper tests - for contact buttons functionality"""
    
    def test_get_campers(self, auth_headers):
        """Test getting all campers"""
        response = requests.get(f"{BASE_URL}/api/campers", headers=auth_headers)
        assert response.status_code == 200, f"Get campers failed: {response.text}"
        campers = response.json()
        assert isinstance(campers, list)
        print(f"Found {len(campers)} campers")
        
        # Check camper has contact info fields
        if len(campers) > 0:
            camper = campers[0]
            # Verify contact fields exist (may be null)
            assert "father_cell" in camper or "mother_cell" in camper or "parent_email" in camper
            print(f"Camper {camper['first_name']} has contact fields available")
        return campers
    
    def test_camper_has_photo_url_field(self, auth_headers):
        """Test that campers have photo_url field for clickable photos"""
        response = requests.get(f"{BASE_URL}/api/campers", headers=auth_headers)
        campers = response.json()
        
        if len(campers) > 0:
            camper = campers[0]
            assert "photo_url" in camper, "Camper should have photo_url field"
            print(f"Camper has photo_url field: {camper.get('photo_url', 'None')}")
        return True


class TestStripeCheckout:
    """Stripe checkout tests - for charge button with 3.5% fee"""
    
    def test_calculate_fee(self, auth_headers):
        """Test fee calculation endpoint"""
        amount = 1000.00
        response = requests.get(f"{BASE_URL}/api/payment/calculate-fee?amount={amount}&include_fee=true", headers=auth_headers)
        assert response.status_code == 200, f"Calculate fee failed: {response.text}"
        data = response.json()
        
        assert data["base_amount"] == amount
        assert data["fee_rate"] == 0.035  # 3.5%
        expected_fee = round(amount * 0.035, 2)
        assert data["fee_amount"] == expected_fee
        assert data["total_with_fee"] == round(amount + expected_fee, 2)
        print(f"Fee calculation: ${amount} + ${expected_fee} (3.5%) = ${data['total_with_fee']}")
        return data
    
    def test_calculate_fee_no_fee(self, auth_headers):
        """Test fee calculation without fee"""
        amount = 500.00
        response = requests.get(f"{BASE_URL}/api/payment/calculate-fee?amount={amount}&include_fee=false", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["fee_amount"] == 0
        assert data["total_with_fee"] == amount
        print(f"No fee calculation: ${amount} total")
        return data


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_fees(self, auth_headers):
        """Remove test fees created during testing"""
        response = requests.get(f"{BASE_URL}/api/fees", headers=auth_headers)
        fees = response.json()
        
        for fee in fees:
            if fee["name"].startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/fees/{fee['id']}", headers=auth_headers)
                print(f"Cleaned up test fee: {fee['name']}")
        return True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
