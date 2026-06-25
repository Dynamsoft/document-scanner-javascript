<template>
	<div class="mds-hello-world-page">
		<div class="mds-title">
			<h2 class="mds-title-text">Hello World for Vue</h2>
		</div>
		<div class="mds-result-container">
			<img v-if="result.image" class="result-img" :src="result.image" alt="scanned document" />
			<div v-if="result.message" class="result-data">{{ result.message }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { DocumentScanner } from "dynamsoft-document-scanner";

const result = ref({ image: "", message: "" });
let documentScanner: DocumentScanner | null = null;

onMounted(async () => {
	try {
		documentScanner = new DocumentScanner({
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

		const scanResult = await documentScanner.launch();

		if (scanResult?.correctedImageResult) {
			result.value = {
				image: scanResult.correctedImageResult.toCanvas().toDataURL("image/png"),
				message: "",
			};
		} else {
			result.value = { image: "", message: "No image scanned. Please try again." };
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(message);
		alert(message);
	}
});

onBeforeUnmount(() => {
	documentScanner?.dispose();
	documentScanner = null;
});
</script>

<style>
body {
	margin: 0;
	font-family: system-ui, sans-serif;
}

.mds-hello-world-page {
	width: 100%;
	height: 100%;
	text-align: center;
}

.mds-title {
	height: 90px;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20px 0;
}

.mds-result-container {
	overflow-y: auto;
	height: calc(100dvh - 90px - 40px);
	width: 100%;
}

.mds-result-container .result-img {
	width: 100%;
}

.mds-result-container .result-data {
	white-space: pre-line;
	padding-bottom: 20px;
}
</style>
