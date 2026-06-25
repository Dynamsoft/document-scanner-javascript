import { useEffect, useRef, useState } from "react";
import { DocumentScanner } from "dynamsoft-document-scanner";
import "./App.css";

function App() {
	const [result, setResult] = useState({ image: "", message: "" });
	const scannerRef = useRef<DocumentScanner | null>(null);

	useEffect(() => {
		// Prevent double initialization
		if (scannerRef.current) {
			return;
		}

		async function init() {
			try {
				const documentScanner = new DocumentScanner({
					license: "YOUR_LICENSE_KEY_HERE", // Replace with your Dynamsoft license key
					// Self-host the engine, runtime data, and camera UI (mirrored into
					// public/ by vite.config.ts).
					engineResourcePaths: {
						dcvBundle: "/dynamsoft-capture-vision-bundle/dist",
						dcvData: "/dynamsoft-capture-vision-data",
					},
					scannerViewConfig: {
						cameraEnhancerUIPath: "/dynamsoft-document-scanner/dist/document-scanner.ui.xml",
						enableAutoCropMode: true,
						enableSmartCaptureMode: true,
					},
				});
				scannerRef.current = documentScanner;

				const scanResult = await documentScanner.launch();

				if (scanResult?.correctedImageResult) {
					setResult({
						image: scanResult.correctedImageResult.toCanvas().toDataURL("image/png"),
						message: "",
					});
				} else {
					setResult({ image: "", message: "No image scanned. Please try again." });
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(message);
				alert(message);
			}
		}

		const pInit = init();

		return () => {
			pInit
				.then(() => {
					scannerRef.current?.dispose();
					scannerRef.current = null;
				})
				.catch(() => {});
		};
	}, []);

	return (
		<div className="mds-hello-world-page">
			<div className="mds-title">
				<h2 className="mds-title-text">Hello World for React</h2>
			</div>
			<div className="mds-result-container">
				{result.image && <img className="result-img" src={result.image} alt="scanned document" />}
				{result.message && <div className="result-data">{result.message}</div>}
			</div>
		</div>
	);
}

export default App;
