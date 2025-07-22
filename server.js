const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises; // File system promises
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// OTP ট্র্যাকিং
const otps = new Map();

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 ডিজিট OTP
  console.log(`Generated OTP: ${otp}`);
  return otp;
}

// maps.json পড়া
async function readMapData() {
  try {
    const data = await fs.readFile('maps.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading maps.json:', error);
    return {};
  }
}

// maps.json লেখা
async function writeMapData(data) {
  try {
    await fs.writeFile('maps.json', JSON.stringify(data, null, 2));
    console.log('maps.json updated successfully');
  } catch (error) {
    console.error('Error writing maps.json:', error);
  }
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  ws.on('message', async (message) => {
    console.log('Received message:', message.toString());
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'generate_otp') {
        const otp = generateOTP();
        otps.set(otp, { used: false, timestamp: Date.now() });
        ws.send(JSON.stringify({ type: 'otp_generated', otp }));
        console.log(`Sent OTP: ${otp} to client`);
      } else if (data.type === 'add_map_data') {
        const mapData = data.mapData;
        const currentData = await readMapData();
        if (!currentData[mapData.district]) currentData[mapData.district] = {};
        if (!currentData[mapData.district][mapData.upazila]) currentData[mapData.district][mapData.upazila] = {};
        currentData[mapData.district][mapData.upazila][mapData.mouza] = {
          file_name: mapData.file_name,
          district_no: mapData.district_no,
          file_size: mapData.file_size,
          pdf: mapData.pdf,
          jpg: mapData.jpg
        };
        await writeMapData(currentData);
        ws.send(JSON.stringify({ type: 'map_data_added', success: true }));
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
