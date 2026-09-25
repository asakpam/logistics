// Test script to verify driver registration flow
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001/api';

async function testDriverRegistration() {
  const testEmail = `driver-test-${Date.now()}@example.com`;
  const testPassword = 'Test123456';
  
  console.log('\n🧪 Testing Driver Registration Flow\n');
  console.log('Test Email:', testEmail);
  console.log('Test Password:', testPassword);
  console.log('─'.repeat(60));

  try {
    // Step 1: Register via Firebase (simulating frontend registerWithEmail)
    console.log('\n1️⃣ Creating Firebase account (simulated)...');
    // In production this would be done by Firebase SDK
    // For now we'll skip this and go directly to backend registration
    
    // Step 2: Create a test Ghana Card image
    console.log('\n2️⃣ Creating test Ghana Card image...');
    const testImagePath = path.join(__dirname, 'test-ghana-card.png');
    
    // Create a simple 1x1 PNG for testing
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngData);
    console.log('✅ Test image created:', testImagePath);

    // Step 3: Register on backend with driver data
    console.log('\n3️⃣ Registering driver on backend...');
    
    const formData = new FormData();
    formData.append('name', 'Test Driver User');
    formData.append('email', testEmail);
    formData.append('phone', '+233123456789');
    formData.append('role', 'driver');
    formData.append('address[street]', '123 Test Street');
    formData.append('address[city]', 'Accra');
    formData.append('address[region]', 'Greater Accra');
    formData.append('licenseNumber', 'DL-TEST-12345');
    formData.append('vehicleType', 'Van');
    formData.append('vehicleNumber', 'GH-1234-20');
    formData.append('digitalAddress', 'GA-001-1234');
    formData.append('ghanaCard', fs.createReadStream(testImagePath));

    // Note: This would normally include a Firebase token
    // For testing, we'll need to mock authentication or use a real token
    console.log('⚠️  Note: This test requires a valid Firebase token');
    console.log('   Please test manually through the frontend at http://localhost:3000/register');
    
    // Clean up test image
    fs.unlinkSync(testImagePath);
    console.log('\n✅ Test image cleaned up');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
      console.error('   Status:', error.response.status);
    }
  }

  console.log('\n─'.repeat(60));
  console.log('\n📋 MANUAL TEST STEPS:\n');
  console.log('1. Open browser: http://localhost:3000/register');
  console.log('2. Click "Delivery Driver" option');
  console.log('3. Fill in all required fields:');
  console.log('   - Name: Test Driver');
  console.log('   - Email:', testEmail);
  console.log('   - Password:', testPassword);
  console.log('   - Phone: +233123456789');
  console.log('   - Street: 123 Test Street');
  console.log('   - City: Accra');
  console.log('   - Region: Greater Accra');
  console.log('   - License Number: DL-TEST-12345');
  console.log('   - Vehicle Type: Van');
  console.log('   - Vehicle Number: GH-1234-20');
  console.log('   - Digital Address: GA-001-1234');
  console.log('   - Upload a Ghana Card image (any JPG/PNG)');
  console.log('\n4. Click "Create Account"');
  console.log('5. Check backend logs for debug output');
  console.log('6. Verify user role in MongoDB');
  console.log('\n─'.repeat(60));
}

testDriverRegistration();
