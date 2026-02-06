#!/usr/bin/env node

// Simple reverse proxy for mission.control -> localhost:4847
// Uses only built-in Node.js modules

const http = require("http");
const net = require("net");

const TARGET_HOST = "127.0.0.1";
const TARGET_PORT = 4847;
const PREFERRED_PORT = 80;
const FALLBACK_PORT = 8080;

const server = http.createServer((req, res) => {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${TARGET_HOST}:${TARGET_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("Bad Gateway - Nectar may not be running");
  });

  req.pipe(proxyReq);
});

// Handle WebSocket upgrades for Convex real-time
server.on("upgrade", (req, socket, head) => {
  const proxySocket = net.connect(TARGET_PORT, TARGET_HOST, () => {
    const headers = [`${req.method} ${req.url} HTTP/1.1`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const key = req.rawHeaders[i];
      const value = req.rawHeaders[i + 1];
      if (key.toLowerCase() === "host") {
        headers.push(`Host: ${TARGET_HOST}:${TARGET_PORT}`);
      } else {
        headers.push(`${key}: ${value}`);
      }
    }
    headers.push("", "");

    proxySocket.write(headers.join("\r\n"));
    if (head.length) {
      proxySocket.write(head);
    }

    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxySocket.on("error", (err) => {
    console.error("WebSocket proxy error:", err.message);
    socket.end();
  });

  socket.on("error", (err) => {
    console.error("Client socket error:", err.message);
    proxySocket.end();
  });
});

function startServer(port) {
  server
    .listen(port, "0.0.0.0")
    .on("listening", () => {
      console.log(`[Proxy] mission.control -> localhost:${TARGET_PORT}`);
      console.log(`[Proxy] Listening on port ${port}`);
      if (port !== 80) {
        console.log(`[Proxy] Access via: http://mission.control:${port}`);
      } else {
        console.log(`[Proxy] Access via: http://mission.control`);
      }
    })
    .on("error", (err) => {
      if (err.code === "EACCES" && port === PREFERRED_PORT) {
        console.log(`[Proxy] Port ${PREFERRED_PORT} requires sudo, trying ${FALLBACK_PORT}...`);
        startServer(FALLBACK_PORT);
      } else if (err.code === "EADDRINUSE") {
        console.error(`[Proxy] Port ${port} is already in use`);
        process.exit(1);
      } else {
        throw err;
      }
    });
}

startServer(PREFERRED_PORT);
