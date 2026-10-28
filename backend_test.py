import requests
import sys
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image

class CropDoctorAPITester:
    def __init__(self, base_url="https://crop-care-tracker-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test_name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def create_test_image(self):
        """Create a simple test plant image"""
        # Create a simple green leaf-like image
        img = Image.new('RGB', (300, 300), color='white')
        pixels = img.load()
        
        # Draw a simple leaf shape with green color
        for x in range(300):
            for y in range(300):
                # Create a simple oval leaf shape
                center_x, center_y = 150, 150
                if ((x - center_x) ** 2 / 100 + (y - center_y) ** 2 / 150) < 100:
                    # Green leaf color with some variation
                    green_val = min(255, 50 + (x + y) % 100)
                    pixels[x, y] = (0, green_val, 0)
        
        # Convert to bytes
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        return buffer.getvalue()

    def test_root_endpoint(self):
        """Test GET /api/"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data}"
            self.log_test("Root Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Root Endpoint", False, str(e))
            return False

    def test_streak_endpoint(self):
        """Test GET /api/streak"""
        try:
            response = requests.get(f"{self.api_url}/streak", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                # Check required fields
                required_fields = ['current_streak', 'total_diagnoses']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Streak: {data.get('current_streak', 0)}, Total: {data.get('total_diagnoses', 0)}"
            self.log_test("Streak Endpoint", success, details)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Streak Endpoint", False, str(e))
            return False, {}

    def test_diagnoses_list_endpoint(self):
        """Test GET /api/diagnoses"""
        try:
            response = requests.get(f"{self.api_url}/diagnoses", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Count: {len(data)} diagnoses"
            self.log_test("Diagnoses List Endpoint", success, details)
            return success, response.json() if success else []
        except Exception as e:
            self.log_test("Diagnoses List Endpoint", False, str(e))
            return False, []

    def test_progress_endpoint(self):
        """Test GET /api/progress"""
        try:
            response = requests.get(f"{self.api_url}/progress", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                progress_points = data.get('progress_points', [])
                details += f", Progress points: {len(progress_points)}"
            self.log_test("Progress Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Progress Endpoint", False, str(e))
            return False

    def test_diagnose_endpoint(self):
        """Test POST /api/diagnose with image upload"""
        try:
            # Create test image
            image_data = self.create_test_image()
            
            # Prepare multipart form data
            files = {'file': ('test_plant.jpg', image_data, 'image/jpeg')}
            
            print("🔍 Uploading test image for AI diagnosis...")
            response = requests.post(f"{self.api_url}/diagnose", files=files, timeout=60)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ['id', 'disease_name', 'severity', 'treatment_steps', 'health_score', 'image_data']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Disease: {data.get('disease_name', 'N/A')}, Health Score: {data.get('health_score', 0)}"
                    # Return diagnosis ID for further testing
                    self.diagnosis_id = data.get('id')
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Raw response: {response.text[:200]}"
            
            self.log_test("Diagnose Endpoint (AI Integration)", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Diagnose Endpoint (AI Integration)", False, str(e))
            return False, {}

    def test_single_diagnosis_endpoint(self, diagnosis_id):
        """Test GET /api/diagnoses/{id}"""
        if not diagnosis_id:
            self.log_test("Single Diagnosis Endpoint", False, "No diagnosis ID available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/diagnoses/{diagnosis_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Disease: {data.get('disease_name', 'N/A')}"
            self.log_test("Single Diagnosis Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Single Diagnosis Endpoint", False, str(e))
            return False

    def test_delete_diagnosis_endpoint(self, diagnosis_id):
        """Test DELETE /api/diagnoses/{id}"""
        if not diagnosis_id:
            self.log_test("Delete Diagnosis Endpoint", False, "No diagnosis ID available")
            return False
            
        try:
            response = requests.delete(f"{self.api_url}/diagnoses/{diagnosis_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("Delete Diagnosis Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Delete Diagnosis Endpoint", False, str(e))
            return False

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting Crop Doctor Camera API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic endpoints first
        self.test_root_endpoint()
        self.test_streak_endpoint()
        self.test_diagnoses_list_endpoint()
        self.test_progress_endpoint()
        
        # Test AI diagnosis (most critical)
        print("\n🤖 Testing AI Integration...")
        diagnosis_success, diagnosis_data = self.test_diagnose_endpoint()
        
        if diagnosis_success and diagnosis_data.get('id'):
            diagnosis_id = diagnosis_data['id']
            print(f"📋 Testing with diagnosis ID: {diagnosis_id}")
            
            # Test single diagnosis retrieval
            self.test_single_diagnosis_endpoint(diagnosis_id)
            
            # Test deletion (cleanup)
            self.test_delete_diagnosis_endpoint(diagnosis_id)
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check details above.")
            return False

def main():
    tester = CropDoctorAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "test_summary": {
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%",
            "timestamp": datetime.now().isoformat()
        },
        "detailed_results": tester.test_results
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())