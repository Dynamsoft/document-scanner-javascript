import { useEffect } from "react";
import { DocumentScanner } from "dynamsoft-document-scanner";
import reactLogo from "./assets/react.svg";
import "./App.css";

function App() {
  useEffect(() => {
    const initScanner = async () => {
      const scanner = new DocumentScanner({
        license: "YOUR_LICENSE_KEY_HERE",
      });

      const result = await scanner.launch();
      if (result?.correctedImageResult) {
        const resultsDiv = document.getElementById("results");
        if (resultsDiv) {
          resultsDiv.innerHTML = "";
          resultsDiv.appendChild(result.correctedImageResult.toCanvas());
        }
      }
    };

    initScanner().catch((error) => {
      console.error("Error initializing document scanner:", error);
    });
  }, []);

  return (
    <div>
      <div className="dds-title">
        <h2>Hello World for React</h2>
        <img src={reactLogo} className="react-logo" alt="logo" />
      </div>
      <div id="results"></div>
    </div>
  );
}

export default App;
