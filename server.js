const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// OTP ট্র্যাকিং
const otps = new Map();

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 ডিজিট OTP
  console.log(`Generated OTP: ${otp}`);
  return otp;
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  ws.on('message', (message) => {
    console.log('Received message:', message.toString());
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'generate_otp') {
        const otp = generateOTP();
        otps.set(otp, { used: false, timestamp: Date.now() });
        ws.send(JSON.stringify({ type: 'otp_generated', otp }));
        console.log(`Sent OTP: ${otp} to client`);
      } else if (data.type === 'verify_otp') {
        const otp = data.otp;
        if (otps.has(otp) && otps.get(otp).used === false) {
          otps.get(otp).used = true;
          ws.send(JSON.stringify({ type: 'otp_verified', success: true }));
          console.log(`Verified OTP: ${otp}`);
        } else {
          ws.send(JSON.stringify({ type: 'otp_verified', success: false }));
          console.log(`Invalid or used OTP: ${otp}`);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid request' }));
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(8080, () => {
  console.log('WebSocket server running on port 8080');
});
