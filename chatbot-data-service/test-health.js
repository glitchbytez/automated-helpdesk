#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testing chatbot-data-service health endpoint...');

const options = {
  hostname: 'localhost',
  port: 5502,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (res.statusCode === 200) {
        console.log('✅ Health check passed');
        process.exit(0);
      } else {
        console.log('❌ Health check failed');
        process.exit(1);
      }
    } catch (error) {
      console.log('❌ Invalid JSON response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request failed:', error.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Request timed out');
  req.destroy();
  process.exit(1);
});

req.setTimeout(5000);
req.end(); 