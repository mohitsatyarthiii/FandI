// test-sms.js
import dotenv from 'dotenv';
dotenv.config();

import twilioService from './services/twilioService.js';

const testSMS = async () => {
  console.log('\n🧪 TESTING SMS...\n');
  console.log('Environment Check:');
  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
  console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
  console.log('TWILIO_SMS_FROM:', process.env.TWILIO_SMS_FROM || '❌ Missing');
  
  // Test with different formats
  const testNumbers = [
    '7486079506',      // Without 0
    '07486079506',     // With 0 (problem)
    '+917486079506',   // With +91
  ];
  
  for (const num of testNumbers) {
    console.log(`\n📞 Testing with: "${num}"`);
    const result = await twilioService.sendSMS(num, 'Test SMS from Fandi App');
    console.log('Result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    if (!result.success) {
      console.log('Error:', result.error);
    }
    console.log('---');
  }
};

testSMS();