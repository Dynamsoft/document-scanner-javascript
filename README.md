## Running the Sample

### Steps to Run the Sample

1. **Install Dependencies**  
   Install all necessary dependencies by running:  
   ```bash
   npm install
   ```

2. **Build the Project**  
   Build the project to prepare it for execution:  
   ```bash
   npm run build
   ```

3. **Start the Server**  
   The server logic is defined in `index.js`. Start the server by running:  
   ```bash
   npm run serve
   ```

### Notes on the Test Server (Development Only)

This sample uses the web server provided by Express (https://expressjs.com/). It is intended solely for local development and testing purposes, and it lacks production-grade features like advanced security, scalability, and detailed logging.

- The server is configured to run on **"localhost"** using port `3000` and on your computer's **local IP address** using port `3001` with SSL enabled via self-signed certificates.
- To access the application from a mobile device or another computer on your network, use your computer's **local IP address** and ensure the device is connected to the same Local Area Network (LAN).