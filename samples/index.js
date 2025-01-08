const express = require("express");
const fs = require("fs");
const https = require("https");
const cors = require("cors");
const path = require("path");

const app = express();
// Access-Control-Allow-Origin: **any**
app.use(
  cors({
    origin: (origin, callback) => {
      return callback(null, true);
    },
  })
);

// Redirect all HTTP to HTTPS
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect(["https://", req.get("Host"), req.url].join(""));
  }
  next();
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/demo.html"));
});

app.get("/demo", (req, res) => {
  res.sendFile(path.join(__dirname, "views/demo.html"));
});

app.get("/hello-world", (req, res) => {
  res.sendFile(path.join(__dirname, "views/hello-world.html"));
});

// Create HTTPS server
const httpsServer = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, "pem/key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "pem/cert.pem")),
  },
  app
);

let httpsPort = 3000;

httpsServer.listen(httpsPort, "0.0.0.0", () => {
  const networkInterfaces = require("os").networkInterfaces();
  let localIP;
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((interface) => {
      if (interface.family === "IPv4" && !interface.internal) {
        localIP = interface.address;
      }
    });
  });

  console.log("Dynamsoft Document Scanner Sample is available at");
  console.log(`Local: https://localhost:${httpsPort}/`);
  console.log(`Network: https://${localIP}:${httpsPort}/`);
  console.log("-------------------");
  console.log("Available pages:");
  console.log("Demo Page: /demo");
  console.log("Hello World Page: /hello-world");
  console.log("Press Ctrl+C to stop the server");
});
