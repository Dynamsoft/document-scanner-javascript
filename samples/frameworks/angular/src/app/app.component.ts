import { Component, OnInit, OnDestroy, signal } from "@angular/core";
import { DocumentScanner } from "dynamsoft-document-scanner";

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit, OnDestroy {
	result = signal({ image: "", message: "" });
	private documentScanner: DocumentScanner | null = null;

	async ngOnInit() {
		try {
			this.documentScanner = new DocumentScanner({
				license: "YOUR_LICENSE_KEY_HERE", // Replace with your Dynamsoft license key
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

			const scanResult = await this.documentScanner.launch();

			if (scanResult?.correctedImageResult) {
				this.result.set({
					image: scanResult.correctedImageResult.toCanvas().toDataURL("image/png"),
					message: "",
				});
			} else {
				this.result.set({ image: "", message: "No image scanned. Please try again." });
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(message);
			alert(message);
		}
	}

	ngOnDestroy() {
		this.documentScanner?.dispose();
		this.documentScanner = null;
	}
}
