const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// OTP ট্র্যাকিং
const otps = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 ডিজিট OTP
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('message', (message) => {
    console.log('Received message:', message);
    const data = JSON.parse(message);
    if (data.type === 'generate_otp') {
      const otp = generateOTP();
      otps.set(otp, { used: false, timestamp: Date.now() });
      ws.send(JSON.stringify({ type: 'otp_generated', otp }));
      console.log(`Generated OTP: ${otp} for connection`);
    } else if (data.type === 'verify_otp') {
      const otp = data.otp;
      if (otps.has(otp) && otps.get(otp).used === false) {
        otps.get(otp).used = true;
        ws.send(JSON.stringify({ type: 'otp_verified', success: true }));
      } else {
        ws.send(JSON.stringify({ type: 'otp_verified', success: false }));
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(8080, () => {
  console.log('WebSocket server running on port 8080');
});
