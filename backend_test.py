import requests
import sys
import json
from datetime import datetime

class CampBaraisaAPITester:
    def __init__(self, base_url="https://campportal-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.parent_id = None
        self.camper_id = None
        self.invoice_id = None
        self.parent_access_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("Health Check", "GET", "api/", 200)

    def test_admin_login(self, email="admin@campbaraisa.com", password="admin123"):
        """Test admin login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "api/dashboard/stats",
            200
        )
        if success:
            print(f"   Total campers: {response.get('total_campers', 0)}")
            print(f"   Total invoiced: ${response.get('total_invoiced', 0)}")
        return success

    def test_create_parent(self):
        """Test creating a parent"""
        parent_data = {
            "first_name": "Test",
            "last_name": "Parent",
            "email": f"testparent_{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "555-123-4567",
            "address": "123 Test St",
            "city": "Test City",
            "state": "UT",
            "zip_code": "84000"
        }
        
        success, response = self.run_test(
            "Create Parent",
            "POST",
            "api/parents",
            200,
            data=parent_data
        )
        
        if success and 'id' in response:
            self.parent_id = response['id']
            self.parent_access_token = response.get('access_token')
            print(f"   Parent ID: {self.parent_id}")
            print(f"   Access Token: {self.parent_access_token[:20]}...")
            return True
        return False

    def test_create_camper(self):
        """Test creating a camper"""
        if not self.parent_id:
            print("❌ Cannot create camper - no parent ID available")
            return False
            
        camper_data = {
            "parent_id": self.parent_id,
            "first_name": "Test",
            "last_name": "Camper",
            "hebrew_name": "תלמיד",
            "date_of_birth": "2010-06-15",
            "grade": "8th Grade",
            "yeshiva": "Test Yeshiva",
            "allergies": "None",
            "medical_notes": "None",
            "notes": "Test camper for API testing"
        }
        
        success, response = self.run_test(
            "Create Camper",
            "POST",
            "api/campers",
            200,
            data=camper_data
        )
        
        if success and 'id' in response:
            self.camper_id = response['id']
            print(f"   Camper ID: {self.camper_id}")
            print(f"   Status: {response.get('status', 'Unknown')}")
            return True
        return False

    def test_kanban_board(self):
        """Test kanban board functionality"""
        success, response = self.run_test(
            "Get Kanban Board",
            "GET",
            "api/kanban",
            200
        )
        
        if success:
            statuses = response.get('statuses', [])
            board = response.get('board', {})
            print(f"   Available statuses: {len(statuses)}")
            print(f"   Board sections: {len(board)}")
            
            # Test updating camper status if we have a camper
            if self.camper_id:
                status_success, _ = self.run_test(
                    "Update Camper Status",
                    "PUT",
                    f"api/campers/{self.camper_id}/status?status=Accepted",
                    200
                )
                return success and status_success
        return success

    def test_create_invoice(self):
        """Test creating an invoice"""
        if not self.parent_id or not self.camper_id:
            print("❌ Cannot create invoice - missing parent or camper ID")
            return False
            
        invoice_data = {
            "parent_id": self.parent_id,
            "camper_id": self.camper_id,
            "amount": 2500.00,
            "description": "Camp Baraisa Summer 2026 - Full Session",
            "due_date": "2026-05-01"
        }
        
        success, response = self.run_test(
            "Create Invoice",
            "POST",
            "api/invoices",
            200,
            data=invoice_data
        )
        
        if success and 'id' in response:
            self.invoice_id = response['id']
            print(f"   Invoice ID: {self.invoice_id}")
            print(f"   Amount: ${response.get('amount', 0)}")
            print(f"   Status: {response.get('status', 'Unknown')}")
            return True
        return False

    def test_parent_portal_access(self):
        """Test parent portal access via token"""
        if not self.parent_access_token:
            print("❌ Cannot test portal - no access token available")
            return False
            
        success, response = self.run_test(
            "Parent Portal Access",
            "GET",
            f"api/portal/{self.parent_access_token}",
            200
        )
        
        if success:
            parent_info = response.get('parent', {})
            campers = response.get('campers', [])
            invoices = response.get('invoices', [])
            print(f"   Parent: {parent_info.get('first_name', '')} {parent_info.get('last_name', '')}")
            print(f"   Campers: {len(campers)}")
            print(f"   Invoices: {len(invoices)}")
            return True
        return False

    def test_settings_api(self):
        """Test settings API"""
        # Get settings
        get_success, response = self.run_test(
            "Get Settings",
            "GET",
            "api/settings",
            200
        )
        
        if not get_success:
            return False
            
        # Update settings
        settings_data = {
            "camp_name": "Camp Baraisa",
            "camp_email": "info@campbaraisa.com",
            "camp_phone": "555-CAMP-123",
            "quickbooks_sync": False,
            "twilio_enabled": False,
            "gmail_enabled": False
        }
        
        update_success, _ = self.run_test(
            "Update Settings",
            "PUT",
            "api/settings",
            200,
            data=settings_data
        )
        
        return get_success and update_success

    def test_additional_endpoints(self):
        """Test additional endpoints for completeness"""
        tests = [
            ("Get Parents", "GET", "api/parents", 200),
            ("Get Campers", "GET", "api/campers", 200),
            ("Get Invoices", "GET", "api/invoices", 200),
            ("Get Communications", "GET", "api/communications", 200),
            ("Get Rooms", "GET", "api/rooms", 200),
            ("Financial Summary", "GET", "api/financial/summary", 200),
            ("Export Campers", "GET", "api/exports/campers", 200),
        ]
        
        all_passed = True
        for name, method, endpoint, expected_status in tests:
            success, _ = self.run_test(name, method, endpoint, expected_status)
            if not success:
                all_passed = False
        
        return all_passed

def main():
    print("🏕️  Camp Baraisa API Testing Suite")
    print("=" * 50)
    
    tester = CampBaraisaAPITester()
    
    # Test sequence
    test_sequence = [
        ("Health Check", tester.test_health_check),
        ("Admin Login", tester.test_admin_login),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Create Parent", tester.test_create_parent),
        ("Create Camper", tester.test_create_camper),
        ("Kanban Board", tester.test_kanban_board),
        ("Create Invoice", tester.test_create_invoice),
        ("Parent Portal Access", tester.test_parent_portal_access),
        ("Settings API", tester.test_settings_api),
        ("Additional Endpoints", tester.test_additional_endpoints),
    ]
    
    failed_tests = []
    
    for test_name, test_func in test_sequence:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            success = test_func()
            if not success:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print(f"\n{'='*60}")
    print(f"📊 Final Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
        return 1
    else:
        print(f"\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())