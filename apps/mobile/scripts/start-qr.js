const { spawn } = require('child_process');
const os = require('os');

// Detect local IPv4 network address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

let qrcode;
try {
  qrcode = require('qrcode-terminal');
} catch (e) {
  // Fallback if not installed
}

const localIp = getLocalIp();
const expoUrl = `exp://${localIp}:8081`;

console.clear();
console.log('================================================================');
console.log('⚡ SYNCED PLATFORM — EXPO MOBILE DEV SERVER');
console.log(`📡 URL: ${expoUrl}`);
console.log('================================================================\n');

if (qrcode) {
  qrcode.generate(expoUrl, { small: true });
} else {
  console.log(`Scan or enter: ${expoUrl}`);
}

console.log('\n📱 Scan this QR code using the EXPO GO app on your phone!');
console.log('🌐 Web App loading from: http://' + localIp + ':5173\n');
console.log('----------------------------------------------------------------');
console.log('Starting Metro Bundler...\n');

// Start Expo in Expo Go mode
const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const expoProcess = spawn(npxCmd, ['expo', 'start', '-g', '-c'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname + '/..',
});

expoProcess.on('exit', (code) => {
  process.exit(code || 0);
});
