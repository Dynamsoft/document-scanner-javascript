import express from "express";
import fs from "fs";
import http from "http";
import https from "https";
import cors from "cors";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if dist folder exists
const distPath = path.join(__dirname, "../dist");
if (!fs.existsSync(distPath)) {
  console.error("\x1b[31m%s\x1b[0m", "Error: 'dist' folder not found!");
  console.log("\nPlease build the project first by running:");
  console.log("\x1b[33m%s\x1b[0m", "npm run build");
  console.log("\nThen try running the server again.\n");
  process.exit(1);
}

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      return callback(null, true);
    },
  })
);

// Serve static files
app.use("/dist", express.static(distPath));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../samples/hello-world.html"));
});

app.get("/hello-world", (req, res) => {
  res.sendFile(path.join(__dirname, "../samples/hello-world.html"));
});

let httpPort = 3000;
let httpsPort = 3001;

// redirect handling
app.use((req, res, next) => {
  const host = req.get("Host"); // Get the host name from the request

  // Skip redirection if it's localhost with the correct HTTP port
  if (!req.secure && host !== `localhost:${httpPort}`) {
    // Replace the HTTP port with HTTPS port in the host
    const httpsHost = host.replace(`:${httpPort}`, `:${httpsPort}`);
    return res.redirect(["https://", httpsHost, req.url].join(""));
  }

  next(); // Proceed to the next middleware or route
});

// HTTPS server configuration
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "pem/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "pem/cert.pem")),
};

// Create HTTPS server
const httpsServer = https.createServer(httpsOptions, app);

// Create HTTP server
const httpServer = http.createServer(app);

// Add error handlers before starting servers
httpServer.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\x1b[31mError: Port ${httpPort} is already in use\x1b[0m`);
    console.log("\nTo fix this, you can:");
    console.log(`1. Update the port manually by changing \x1b[33mhttpPort\x1b[0m in the code`);
    console.log(`2. Close any other applications using port ${httpPort}`);
    console.log(`3. Wait a few moments and try again - the port might be in a cleanup state\n`);
  } else {
    console.error("\x1b[31mHTTP Server error:\x1b[0m", error);
  }
  process.exit(1);
});

httpsServer.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\x1b[31mError: Port ${httpsPort} is already in use\x1b[0m`);
    console.log("\nTo fix this, you can:");
    console.log(`1. Update the port manually by changing \x1b[33mhttpsPort\x1b[0m in the code`);
    console.log(`2. Close any other applications using port ${httpsPort}`);
    console.log(`3. Wait a few moments and try again - the port might be in a cleanup state\n`);
  } else {
    console.error("\x1b[31mHTTP Server error:\x1b[0m", error);
  }
  process.exit(1);
});

// Start the servers
httpServer.listen(httpPort, () => {
  console.log("\n\x1b[1m Dynamsoft Document Scanner Sample\x1b[0m\n");
  console.log("\x1b[36m Access URLs:\x1b[0m");
  console.log("\x1b[90m-------------------\x1b[0m");
  console.log("\x1b[32m Local:\x1b[0m    http://localhost:" + httpPort + "/");
});

httpsServer.listen(httpsPort, "0.0.0.0", () => {
  const networkInterfaces = os.networkInterfaces();
  const ipv4Addresses = [];
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === "IPv4" && !iface.internal) {
        ipv4Addresses.push(iface.address);
      }
    });
  });

  ipv4Addresses.forEach((localIP) => {
    console.log("\x1b[32m Network:\x1b[0m  https://" + localIP + ":" + httpsPort + "/");
  });
  console.log("\x1b[36m Available Pages:\x1b[0m");
  console.log("\x1b[90m-------------------\x1b[0m");
  console.log("\x1b[33m Hello World:\x1b[0m  /hello-world\n");

  console.log("\x1b[90mPress Ctrl+C to stop the server\x1b[0m\n");
});
