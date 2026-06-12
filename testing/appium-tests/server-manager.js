const { spawn } = require('child_process');
const net = require('net');
const config = require('./config');

let serverProcess = null;

/**
 * Checks if a port is open.
 */
function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

/**
 * Starts the local PHP built-in server if Apache is not already running.
 */
async function start() {
  const host = config.apiHost;
  const port = config.port;

  console.log(`Checking if API backend is active on ${host}:${port}...`);
  const active = await isPortOpen(host, port);
  
  if (active) {
    console.log(`API backend is already active and serving on ${host}:${port}. No need to start local PHP server.`);
    return null;
  }

  return new Promise((resolve, reject) => {
    console.log(`API backend is offline. Starting temporary PHP server on ${host}:${port}...`);
    
    // We bind to 0.0.0.0 so it is reachable by any network interface, including the emulator
    serverProcess = spawn(config.phpPath, ['-S', `0.0.0.0:${port}`, '-t', config.htdocsPath], {
      stdio: 'pipe'
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start temporary PHP server process:', err);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.log(`Temporary PHP server exited with code: ${code}`);
      }
    });

    // Wait and verify if it is open
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
      attempts++;
      const open = await isPortOpen(host, port);
      if (open) {
        clearInterval(interval);
        console.log(`Temporary PHP server is now active and responding on ${host}:${port}.`);
        resolve(serverProcess);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error(`Timeout: Temporary PHP server failed to start on ${host}:${port} after ${maxAttempts} attempts.`));
      }
    }, 500);
  });
}

/**
 * Stops the temporary PHP server.
 */
function stop() {
  return new Promise((resolve) => {
    if (serverProcess) {
      console.log('Stopping temporary PHP server...');
      try {
        serverProcess.kill('SIGKILL');
      } catch (err) {
        console.error('Error killing temporary PHP server process:', err);
      }
      serverProcess = null;
      console.log('Temporary PHP server stopped.');
      resolve();
    } else {
      resolve();
    }
  });
}

module.exports = {
  start,
  stop
};
