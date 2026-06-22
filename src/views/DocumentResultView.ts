import { SharedResources } from "../DocumentScanner";
import DocumentScannerView from "./DocumentScannerView";
import { DeskewedImageResultItem } from "dynamsoft-capture-vision-bundle";
import { createControls, createStyle, getElement, getString, shouldCorrectImage } from "./utils";
import DocumentCorrectionView from "./DocumentCorrectionView";
import { DDS_ICONS } from "./utils/icons";
import {
	DocumentResult,
	EnumFlowType,
	EnumResultStatus,
	ToolbarButton,
	ToolbarButtonConfig,
} from "./utils/types";
import { canvasToResultItem, FILTER_OPTIONS, rotateCanvas } from "./utils/imageEditing";

/**
 * Configuration interface for customizing toolbar buttons in the {@link DocumentResultView}.
 *
 * @remarks
 * This interface allows you to customize the appearance and behavior of the toolbar buttons displayed in the {@link DocumentResultView}. Each button can be configured using a {@link ToolbarButtonConfig} object to modify its icon, label, CSS class, or visibility.
 *
 * The behaviors described for each button below are the default behaviors. You can override the default behavior by providing a custom {@link ToolbarButton.onClick} handler through the {@link ToolbarButtonConfig}.
 *
 * @example
 * Customize button appearance:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     resultViewConfig: {
 *         toolbarButtonsConfig: {
 *             retake: {
 *                 isHidden: true
 *             },
 *             share: {
 *                 icon: "path/to/new_icon.png",
 *                 label: "Custom Label"
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @example
 * Override button behavior with custom onClick handler:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     resultViewConfig: {
 *         toolbarButtonsConfig: {
 *             done: {
 *                 label: "Save",
 *                 onClick: async () => {
 *                     // Custom save logic
 *                     await saveToServer(documentScanner.result);
 *                     console.log("Document saved!");
 *                 }
 *             },
 *             share: {
 *                 onClick: async () => {
 *                     // Custom share logic
 *                     await sendViaEmail(documentScanner.result);
 *                 }
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
export interface DocumentResultViewToolbarButtonsConfig {
	/**
	 * Configuration for the retake button. Default behavior: returns to the {@link DocumentScannerView} to capture a new image.
	 *
	 * @public
	 */
	retake?: ToolbarButtonConfig;
	/**
	 * Configuration for the correct button. Default behavior: enters the {@link DocumentCorrectionView} to adjust document boundaries.
	 *
	 * @public
	 */
	correct?: ToolbarButtonConfig;
	/**
	 * Configuration for the share button. Default behavior: shares or downloads the scanned document.
	 *
	 * @remarks
	 * On mobile devices with Web Share API support, this button triggers the native share dialog. On desktop or devices without share support, it downloads the image instead.
	 *
	 * @public
	 */
	share?: ToolbarButtonConfig;
	/**
	 * Configuration for the upload button. Default behavior: triggers the {@link DocumentResultViewConfig.onUpload} callback.
	 *
	 * @remarks
	 * This button is only visible when {@link DocumentResultViewConfig.onUpload} is defined.
	 *
	 * @public
	 */
	upload?: ToolbarButtonConfig;
	/**
	 * Configuration for the done button. Default behavior: completes the scanning workflow.
	 *
	 * @remarks
	 * In continuous scanning mode ({@link DocumentScannerConfig.enableContinuousScanning}), a separate floating "Scan More" button keeps the current scan and loops back to the {@link DocumentScannerView} for the next capture.
	 *
	 * @public
	 */
	done?: ToolbarButtonConfig;

	/**
	 * Configuration for the done button. Default behavior: rotate the image 90 degrees clockwise.
	 *
	 * @public
	 */
	rotate?: ToolbarButtonConfig;
	/**
	 * Configuration for the filter button. Default behavior: reveal drop-up menu with the following filters:
	 *
	 * 1. Original
	 * 2. Grayscale
	 * 3. Black & White
	 * 4. Sepia
	 * 5. Inverted
	 *
	 * @public
	 */
	filter?: ToolbarButtonConfig;
}

/**
 * The `DocumentResultViewConfig` interface passes settings to the {@link DocumentScanner} constructor through the {@link DocumentScannerConfig} to apply UI and business logic customizations for the {@link DocumentResultView}.
 *
 * @remarks
 * Only rare and edge-case scenarios require editing MDS source code. MDS uses sensible default values for all omitted properties.
 *
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
 *     resultViewConfig: {
 *         onDone: async (result) =>
 *         {
 *             const canvas = result.correctedImageResult.toCanvas();
 *             resultContainer.appendChild(canvas);
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
export interface DocumentResultViewConfig {
	/**
	 * The HTML container element or selector for the {@link DocumentResultView} UI.
	 *
	 * @public
	 */
	container?: HTMLElement | string;
	/**
	 * Configure the appearance and labels of the buttons for the {@link DocumentResultView} UI.
	 *
	 * @see {@link DocumentResultViewToolbarButtonsConfig}
	 *
	 * @public
	 */
	toolbarButtonsConfig?: DocumentResultViewToolbarButtonsConfig;
	/**
	 * Handler called when the user clicks the "Done" button.
	 *
	 * @param result - The {@link DocumentResult} of the scan, including the original image, corrected image, detected boundaries, and scan status
	 *
	 * @public
	 */
	onDone?: (result: DocumentResult) => Promise<void>;
	/**
	 * Handler called when the user clicks the "Upload" button.
	 *
	 * @param result - The {@link DocumentResult} of the scan, including the original image, corrected image, detected boundaries, and scan status
	 *
	 * @public
	 */
	onUpload?: (result: DocumentResult) => Promise<void>;
}

export default class DocumentResultView {
	private currentScanResultViewResolver?: (result: DocumentResult) => void;

	// Edits applied to the corrected image, recomputed from the pristine image on every change.
	private editState: { rotation: number; filterId: string | null } = {
		rotation: 0,
		filterId: null,
	};
	private baseCorrectedImage?: DeskewedImageResultItem;
	// Untouched copy of the corrected image; all edits are derived from this, never mutating it.
	private pristineCanvas?: HTMLCanvasElement;
	// The on-screen canvas that edits are drawn into.
	private displayCanvas?: HTMLCanvasElement;
	private filterMenuOutsideClick?: (event: MouseEvent) => void;
	// Timestamp of the last accepted rotate click, used to debounce mouse switch chatter.
	private lastRotateClickAt = 0;

	constructor(
		private resources: SharedResources,
		private config: DocumentResultViewConfig,
		private scannerView?: DocumentScannerView,
		private correctionView?: DocumentCorrectionView,
	) {}

	async launch(): Promise<DocumentResult> {
		try {
			const container = getElement(this.config.container);
			if (!container) throw new Error("Result view container not found");
			container.textContent = "";
			await this.initialize();
			container.style.display = "flex";

			// Return promise that resolves when user clicks done
			return new Promise((resolve) => {
				this.currentScanResultViewResolver = resolve;
			});
		} catch (ex: any) {
			let errMsg = ex?.message || ex;
			console.error(errMsg);
			throw errMsg;
		}
	}

	/**
	 * Handle upload or share button actions.
	 *
	 * @param mode - The action mode: "share" to share/download the image, "upload" to trigger the upload callback
	 *
	 * @returns Promise that resolves when the operation completes
	 *
	 * @remarks
	 * Validates image exists, then invokes callback or delegates to {@link handleShare}.
	 *
	 * @internal
	 */
	private async handleUploadAndShareBtn(mode?: "share" | "upload") {
		try {
			const { result } = this.resources;
			if (!result?.correctedImageResult) {
				throw new Error("No image to upload");
			}

			if (mode === "upload" && this.config?.onUpload) {
				await this.config.onUpload(result);
			} else if (mode === "share") {
				await this.handleShare();
			}
		} catch (error) {
			console.error("Error on upload/share:", error);
			alert(getString("uploadShareFailedAlert"));
		}
	}

	/**
	 * Share or download the corrected document image.
	 *
	 * @returns Promise resolving to `true` if successful, `undefined` on error
	 *
	 * @remarks
	 * This method attempts to share or download the corrected document image using platform-appropriate mechanisms:
	 *
	 * **On Mobile Devices:**
	 * - Detects mobile platforms via user agent string
	 * - Attempts to use the Web Share API ({@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share | navigator.share}) if available
	 * - Checks file sharing support via {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare | navigator.canShare}
	 * - Handles various error scenarios (AbortError, NotAllowedError, TypeError, DataError) gracefully
	 * - Falls back to download if sharing is not supported or fails
	 *
	 * **On Desktop or Fallback:**
	 * - Creates a temporary download link with a timestamped filename
	 * - Triggers automatic download by simulating a click
	 * - Cleans up the temporary object URL after download
	 *
	 * The corrected image is converted to a PNG blob using {@link DeskewedImageResultItem.toBlob} before sharing/downloading.
	 * If the user cancels the share dialog (AbortError), the operation is considered successful and returns without error.
	 *
	 * @throws {Error} If no corrected image result is available
	 * @throws {Error} If blob conversion fails
	 *
	 * @see {@link handleUploadAndShareBtn} which invokes this method in "share" mode
	 * @see {@link DeskewedImageResultItem.toBlob} for image conversion
	 * @see {@link SharedResources.result} for the source of the corrected image
	 * @see {@link createControls} where the share button is configured
	 *
	 * @internal
	 */
	private async handleShare() {
		try {
			const { result } = this.resources;

			// Validate input
			if (!result?.correctedImageResult) {
				throw new Error("No image result provided");
			}

			// Convert to blob
			const blob = await (result.correctedImageResult as DeskewedImageResultItem).toBlob(
				"image/png",
			);
			if (!blob) {
				throw new Error("Failed to convert image to blob");
			}

			const file = new File([blob], `${getString("downloadFilenamePrefix")}-${Date.now()}.png`, {
				type: blob.type,
			});

			// Detect mobile devices
			const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent,
			);

			// Try Web Share API only on mobile devices
			if (isMobile && navigator.share) {
				// Check if file sharing is supported
				const canShareFiles = navigator.canShare?.({ files: [file] }) ?? false;

				if (canShareFiles) {
					try {
						await navigator.share({
							files: [file],
							title: getString("shareTitle"),
						});
						return true;
					} catch (shareError: any) {
						// Handle different error types per MDN documentation
						if (shareError.name === "AbortError") {
							// User cancelled the share dialog - this is normal, don't show error
							return true;
						} else if (shareError.name === "NotAllowedError") {
							// Permission denied or no user activation - fall back to download
							console.log("Share permission denied, falling back to download");
						} else if (shareError.name === "TypeError") {
							// Invalid data or unsupported file type - fall back to download
							console.log("File type not supported for sharing, falling back to download");
						} else if (shareError.name === "DataError") {
							// Issue with share target - fall back to download
							console.log("Share target error, falling back to download");
						} else {
							// Unknown error - log and fall back
							console.warn("Share failed with unexpected error:", shareError);
						}
						// Fall through to download fallback
					}
				}
			}

			// Fallback: download the file (always used on desktop)
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = file.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			return true;
		} catch (ex: any) {
			// Unexpected error in the overall process
			let errMsg = ex?.message || ex;
			console.error("Error in share/download process:", errMsg);
			alert(getString("shareErrorAlert").replace("{error}", String(errMsg)));
		}
	}

	/**
	 * Launch the correction view to manually adjust document boundaries.
	 *
	 * @returns Promise that resolves when the correction is complete
	 *
	 * @remarks
	 * Hides result view, launches {@link DocumentCorrectionView}, updates result and reinitializes on success.
	 *
	 * @internal
	 */
	private async handleCorrectImage() {
		try {
			if (!this.correctionView) {
				console.error("Correction View not initialized");
				return;
			}

			this.hideView();
			const result = await this.correctionView.launch();

			// After normalization is complete, show scan result view again with updated image
			if (result.correctedImageResult) {
				// Update the shared resources with new corrected result
				if (this.resources.result) {
					this.resources.onResultUpdated?.({
						...this.resources.result,
						correctedImageResult: result.correctedImageResult,
					});
				}

				// Clear current scan result view and reinitialize with new image
				this.dispose(true); // true = preserve resolver
				await this.initialize();
				const container = getElement(this.config.container);
				if (container) container.style.display = "flex";
			}
		} catch (error: any) {
			console.error("DocumentResultView - Handle Correction View Error:", error);
			// Make sure to resolve with error if something goes wrong
			this.currentScanResultViewResolver?.({
				status: {
					code: EnumResultStatus.RS_FAILED,
					message: error?.message || error,
				},
			});
			throw error;
		}
	}

	/**
	 * Return to the scanner view to capture a new document.
	 *
	 * @returns Promise that resolves when the retake workflow completes
	 *
	 * @remarks
	 * This method is invoked when the user clicks the "Re-take" button in the {@link DocumentResultView} toolbar.
	 * It performs the following workflow:
	 *
	 * 1. **Validation**: Checks that {@link DocumentScannerView} is initialized
	 * 2. **View Transition**: Hides the result view via {@link hideView} and shows the {@link DocumentScannerView}
	 * 3. **Capture**: Launches {@link DocumentScannerView.launch} to capture a new document
	 * 4. **Result Handling**:
	 *    - If cancelled ({@link EnumResultStatus.RS_CANCELLED}) or failed ({@link EnumResultStatus.RS_FAILED}): Resolves with the status and exits
	 *    - If successful ({@link EnumResultStatus.RS_SUCCESS}):
	 *      - Updates {@link SharedResources.result} via {@link SharedResources.onResultUpdated}
	 *      - Stops camera capture via {@link DocumentScannerView.stopCapturing}
	 *      - Hides the {@link DocumentScannerView}
	 *      - If {@link DocumentCorrectionView} is configured: Routes through correction view
	 *      - Refreshes the result view with the new image via {@link dispose} and {@link initialize}
	 *
	 * **Correction View Integration:**
	 * When {@link DocumentCorrectionView} is configured, the retake workflow automatically routes through the correction view
	 * before returning to the result view. This allows the user to adjust boundaries on the newly captured document.
	 * If the user cancels or encounters an error in the correction view, the workflow exits and resolves with the error status.
	 *
	 * @throws {Error} If the {@link DocumentScannerView} is not initialized
	 * @throws {Error} If an error occurs during the retake workflow
	 *
	 * @see {@link DocumentScannerView} for the scanner view implementation
	 * @see {@link DocumentScannerView.launch} which is called to capture a new document
	 * @see {@link DocumentCorrectionView} for optional boundary adjustment after capture
	 * @see {@link SharedResources.onResultUpdated} for result update notification
	 * @see {@link createControls} where the retake button is created and this handler is attached
	 *
	 * @internal
	 */
	private async handleRetake() {
		try {
			if (!this.scannerView) {
				console.error("Scanner View not initialized");
				return;
			}

			this.hideView();

			// Show scanner view
			if (this.scannerView) {
				const scannerContainer = getElement((this.scannerView as any).config.container);
				if (scannerContainer) scannerContainer.style.display = "flex";
			}

			// Wait for new scan
			const result = await this.scannerView.launch();

			// Handle cancelled or failed results - resolve and exit
			if (
				result?.status?.code === EnumResultStatus.RS_CANCELLED ||
				result?.status?.code === EnumResultStatus.RS_FAILED
			) {
				this.currentScanResultViewResolver?.(result);
				return;
			}

			// Handle success case - update resources and re-enter result flow
			if (result?.status.code === EnumResultStatus.RS_SUCCESS) {
				this.resources.onResultUpdated?.(result);

				// Stop capturing before hiding scanner view
				if (this.scannerView) {
					this.scannerView.stopCapturing();
				}

				// Hide scanner view
				if (this.scannerView) {
					const scannerContainer = getElement((this.scannerView as any).config.container);
					if (scannerContainer) scannerContainer.style.display = "none";
				}

				// Route through correction view only for flows that need correction
				if (
					this.correctionView &&
					result._flowType !== undefined &&
					shouldCorrectImage(result._flowType)
				) {
					// Hide result view temporarily
					this.dispose(true); // preserve resolver

					// Show and launch correction view
					const correctionResult = await this.correctionView.launch();

					// Handle cancelled/failed from correction view
					if (
						correctionResult?.status?.code === EnumResultStatus.RS_CANCELLED ||
						correctionResult?.status?.code === EnumResultStatus.RS_FAILED
					) {
						this.currentScanResultViewResolver?.(correctionResult);
						return;
					}

					// After correction completes successfully, resources are already updated by correction view's confirmCorrection
				}

				// Refresh the result view with new data
				this.dispose(true); // preserve resolver
				await this.initialize();
				const container = getElement(this.config.container);
				if (container) container.style.display = "flex";
			}
		} catch (error: any) {
			console.error("Error in retake handler:", error);
			// Make sure to resolve with error if something goes wrong
			this.currentScanResultViewResolver?.({
				status: {
					code: EnumResultStatus.RS_FAILED,
					message: error?.message || error,
				},
			});
			throw error;
		}
	}

	/**
	 * Complete the scanning workflow and finalize the result.
	 *
	 * @returns Promise that resolves when the done handler completes
	 *
	 * @remarks
	 * Invokes {@link DocumentResultViewConfig.onDone}, resolves, cleans up. In continuous mode this ends the
	 * session; "Scan More" sets {@link SharedResources.scanMoreRequested} first so the loop continues instead.
	 *
	 * @internal
	 */
	private async handleDone() {
		try {
			const result = this.resources.result ?? {
				status: { code: EnumResultStatus.RS_FAILED, message: "No scan result available" },
			};
			await this.config?.onDone?.(result);

			// Resolve with current result
			this.currentScanResultViewResolver?.(result);

			// Clean up
			this.hideView();
			this.dispose();
		} catch (error: any) {
			console.error("Error in done handler:", error);
			// Make sure to resolve with error if something goes wrong
			this.currentScanResultViewResolver?.({
				status: {
					code: EnumResultStatus.RS_FAILED,
					message: error?.message || error,
				},
			});
			throw error;
		}
	}

	/**
	 * Rotate the corrected image 90 degrees clockwise.
	 *
	 * @remarks
	 * Rotation accumulates ({@link editState}) and is reapplied on top of the active filter by
	 * {@link applyEdits}, so repeated clicks cycle through 90/180/270/0.
	 *
	 * @internal
	 */
	private handleRotate(): void {
		// Some browsers deliver duplicate trusted click events a few ms apart (mouse switch
		// chatter that other browsers filter out); ignore a click within 50ms of the previous one.
		// Genuine rapid clicks are >100ms apart, so this never drops an intended rotation.
		const now = performance.now();
		if (now - this.lastRotateClickAt < 50) return;
		this.lastRotateClickAt = now;

		this.editState.rotation = (this.editState.rotation + 90) % 360;
		this.applyEdits();
	}

	/**
	 * Toggle the filter selection menu attached to the filter toolbar button.
	 *
	 * @remarks
	 * The menu is built once from {@link FILTER_OPTIONS} (plus an "Original" entry to clear the filter)
	 * and cached on the button; subsequent clicks toggle its visibility. Selecting an option records
	 * it in {@link editState} and triggers {@link applyEdits}.
	 *
	 * @internal
	 */
	private handleFilter(): void {
		const filterBtn = document.getElementById("dds-scanResult-filter");
		if (!filterBtn) return;

		const existingMenu = filterBtn.querySelector(".dds-filter-menu");
		if (existingMenu) {
			existingMenu.classList.toggle("show");
			return;
		}

		createStyle("dds-filter-dropdown-style", FILTER_DROPDOWN_STYLE);

		const menu = document.createElement("div");
		menu.className = "dds-filter-menu";

		const options: { id: string | null; label: string }[] = [
			{ id: null, label: getString("filterOriginalBtn") },
			...FILTER_OPTIONS.map((o) => ({ id: o.id, label: getString(o.labelKey) })),
		];
		for (const option of options) {
			const optionBtn = document.createElement("button");
			optionBtn.className = "dds-filter-option";
			optionBtn.textContent = option.label;
			// Mark and display active filter
			if (option.id === this.editState.filterId) optionBtn.classList.add("active");
			optionBtn.addEventListener("click", (event) => {
				event.stopPropagation();
				this.editState.filterId = option.id;
				menu.querySelector(".dds-filter-option.active")?.classList.remove("active");
				optionBtn.classList.add("active");
				this.applyEdits();
				menu.classList.remove("show");
			});
			menu.appendChild(optionBtn);
		}

		// Close the menu when clicking anywhere outside the filter button.
		this.filterMenuOutsideClick = (event: MouseEvent) => {
			if (!filterBtn.contains(event.target as Node)) {
				menu.classList.remove("show");
			}
		};
		document.addEventListener("click", this.filterMenuOutsideClick);

		filterBtn.appendChild(menu);
		menu.classList.add("show");
	}

	/**
	 * Recompute the displayed image from the pristine corrected image, applying the active filter
	 * and rotation, then publish the edited image so share/upload/done export it.
	 *
	 * @remarks
	 * Edits are always derived from {@link baseCorrectedImage} to not stack edits. The live canvas is redrawn in place (no view rebuild) and the result is wrapped
	 * via {@link canvasToResultItem} and pushed through {@link SharedResources.onResultUpdated}.
	 *
	 * @internal
	 */
	private applyEdits(): void {
		if (!this.baseCorrectedImage || !this.displayCanvas || !this.pristineCanvas) return;

		// Derive from the untouched pristine copy for unstacked edits
		let working = document.createElement("canvas");
		const filter = FILTER_OPTIONS.find((option) => option.id === this.editState.filterId);
		if (filter) {
			filter.apply(this.pristineCanvas, working);
		} else {
			working.width = this.pristineCanvas.width;
			working.height = this.pristineCanvas.height;
			working.getContext("2d")?.drawImage(this.pristineCanvas, 0, 0);
		}

		working = rotateCanvas(working, this.editState.rotation);

		// Redraw the live canvas in place to avoid a full view rebuild.
		this.displayCanvas.width = working.width;
		this.displayCanvas.height = working.height;
		this.displayCanvas.getContext("2d")?.drawImage(working, 0, 0);

		if (this.resources.result) {
			this.resources.onResultUpdated?.({
				...this.resources.result,
				correctedImageResult: canvasToResultItem(working, this.baseCorrectedImage),
			});
		}
	}

	/**
	 * Create the toolbar controls for the result view.
	 *
	 * @returns The HTMLElement containing the toolbar with all configured buttons
	 *
	 * @remarks
	 * Detects mobile/share capability, creates retake/correction/share/upload/done buttons. Customizable via {@link DocumentResultViewToolbarButtonsConfig}.
	 *
	 * @internal
	 */
	private createControls(): HTMLElement {
		const { toolbarButtonsConfig, onUpload } = this.config;

		// Helper to detect mobile devices
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);

		// Check if share is possible - only enable on mobile devices
		const testImageBlob = new Blob(["mock-png-data"], { type: "image/png" });
		const testFile = new File([testImageBlob], "test.png", { type: "image/png" });
		const canShare = isMobile && "share" in navigator && navigator.canShare({ files: [testFile] });

		const buttons: ToolbarButton[] = [
			{
				id: `dds-scanResult-retake`,
				icon: toolbarButtonsConfig?.retake?.icon || DDS_ICONS.retake,
				label: toolbarButtonsConfig?.retake?.label || "Re-take",
				onClick: () => this.handleRetake(),
				className: `${toolbarButtonsConfig?.retake?.className || ""}`,
				isHidden: toolbarButtonsConfig?.retake?.isHidden || false,
				isDisabled: !this.scannerView,
			},
			{
				id: `dds-scanResult-rotate`,
				icon: toolbarButtonsConfig?.rotate?.icon || DDS_ICONS.rotate,
				label: toolbarButtonsConfig?.rotate?.label || "Rotate",
				onClick: () => this.handleRotate(),
				className: `${toolbarButtonsConfig?.rotate?.className || ""}`,
				isHidden: toolbarButtonsConfig?.rotate?.isHidden || false,
				isDisabled: !this.resources.result?.correctedImageResult,
			},
			{
				id: `dds-scanResult-filter`,
				icon: toolbarButtonsConfig?.filter?.icon || DDS_ICONS.filter,
				label: toolbarButtonsConfig?.filter?.label || "Filter",
				onClick: () => this.handleFilter(),
				className: `${toolbarButtonsConfig?.filter?.className || ""}`,
				isHidden: toolbarButtonsConfig?.filter?.isHidden || false,
				isDisabled: !this.resources.result?.correctedImageResult,
			},
			{
				id: `dds-scanResult-correct`,
				icon: toolbarButtonsConfig?.correct?.icon || DDS_ICONS.normalize,
				label: toolbarButtonsConfig?.correct?.label || "Correction",
				onClick: () => this.handleCorrectImage(),
				className: `${toolbarButtonsConfig?.correct?.className || ""}`,
				isHidden: toolbarButtonsConfig?.correct?.isHidden || false,
				isDisabled: !this.correctionView,
			},
			{
				id: `dds-scanResult-share`,
				icon:
					toolbarButtonsConfig?.share?.icon || (canShare ? DDS_ICONS.share : DDS_ICONS.downloadPNG),
				label: toolbarButtonsConfig?.share?.label || (canShare ? "Share" : "Download"),
				className: `${toolbarButtonsConfig?.share?.className || ""}`,
				isHidden: toolbarButtonsConfig?.share?.isHidden || false,
				onClick: () => this.handleUploadAndShareBtn("share"),
			},
			{
				id: `dds-scanResult-upload`,
				icon: toolbarButtonsConfig?.upload?.icon || DDS_ICONS.upload,
				label: toolbarButtonsConfig?.upload?.label || "Upload",
				className: `${toolbarButtonsConfig?.upload?.className || ""}`,
				isHidden: !onUpload ? true : toolbarButtonsConfig?.upload?.isHidden || false,
				isDisabled: !onUpload,
				onClick: () => this.handleUploadAndShareBtn("upload"),
			},
			{
				id: `dds-scanResult-done`,
				icon: toolbarButtonsConfig?.done?.icon || DDS_ICONS.complete,
				label: toolbarButtonsConfig?.done?.label || "Done",
				className: `${toolbarButtonsConfig?.done?.className || ""}`,
				isHidden: toolbarButtonsConfig?.done?.isHidden || false,
				onClick: () => this.handleDone(),
			},
		];

		// Reverse the DOM order so the landscape column (normal `flex-direction: column`) reads
		// in reverse and its scrollbar still anchors at the top. Portrait is flipped back to the
		// original left-to-right order via `row-reverse` in DEFAULT_RESULT_VIEW_CSS.
		return createControls(buttons.reverse());
	}

	async initialize(): Promise<void> {
		try {
			if (!this.resources.result) {
				throw Error("Captured image is missing. Please capture an image first!");
			}

			if (!this.config.container) {
				throw new Error("Please create a Scan Result View Container element");
			}

			createStyle("dds-result-view-style", DEFAULT_RESULT_VIEW_CSS);

			// Create a wrapper div that preserves container dimensions
			const resultViewWrapper = document.createElement("div");
			resultViewWrapper.className = "dds-result-view-container";

			// Create and add scan result view image container
			const scanResultViewImageContainer = document.createElement("div");
			Object.assign(scanResultViewImageContainer.style, {
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "0",
			});

			// Add scan result image
			const scanResultImg = (
				this.resources.result.correctedImageResult as DeskewedImageResultItem
			)?.toCanvas();
			Object.assign(scanResultImg.style, {
				maxWidth: "100%",
				maxHeight: "100%",
				objectFit: "contain",
			});

			// Capture an immutable pristine copy and the live canvas for rotate/filter editing.
			this.baseCorrectedImage = this.resources.result
				.correctedImageResult as DeskewedImageResultItem;
			this.displayCanvas = scanResultImg;
			this.pristineCanvas = document.createElement("canvas");
			this.pristineCanvas.width = scanResultImg.width;
			this.pristineCanvas.height = scanResultImg.height;
			this.pristineCanvas.getContext("2d")?.drawImage(scanResultImg, 0, 0);
			// Preserve filter across scans in continuous scanning mode
			this.editState = {
				rotation: 0,
				filterId: this.resources.enableContinuousScanning ? this.editState.filterId : null,
			};
			if (this.editState.filterId !== null) this.applyEdits();

			scanResultViewImageContainer.appendChild(scanResultImg);
			resultViewWrapper.appendChild(scanResultViewImageContainer);

			// Set up controls
			const controlContainer = this.createControls();
			resultViewWrapper.appendChild(controlContainer);

			if (this.resources.enableContinuousScanning) this.createScanMoreButton(controlContainer);

			const container = getElement(this.config.container);
			if (container) container.appendChild(resultViewWrapper);

			// Hide retake button on flow.STATIC_FILE
			if (this.resources.result._flowType === EnumFlowType.STATIC_FILE) {
				const retakeBtn = document.querySelector("#dds-scanResult-retake") as HTMLElement;
				retakeBtn.style.display = "none";
			}
		} catch (ex: any) {
			let errMsg = ex?.message || ex;
			console.error(errMsg);
			alert(errMsg);
		}
	}

	/**
	 * Floating "Scan More" button (continuous mode): a filter drop-up panel on the Done button that requests
	 * another capture, then reuses {@link handleDone} so the launch loop loops back instead of ending. @internal
	 */
	private createScanMoreButton(controls: HTMLElement): void {
		const doneBtn = controls.querySelector<HTMLElement>("#dds-scanResult-done");
		if (!doneBtn) return;

		createStyle("dds-filter-dropdown-style", FILTER_DROPDOWN_STYLE);
		createStyle("dds-scan-more-style", SCAN_MORE_STYLE);

		const panel = document.createElement("div");
		panel.id = "dds-scanResult-scanMore";
		panel.className = "dds-filter-menu show";
		panel.innerHTML = `<button class="dds-filter-option">${DDS_ICONS.plus}<span>${getString("scanMoreBtn")}</span></button>`;
		panel.firstElementChild!.addEventListener("click", (event) => {
			event.stopPropagation(); // don't also fire Done's handler
			this.resources.scanMoreRequested = true;
			this.handleDone();
		});
		doneBtn.appendChild(panel);
	}

	/**
	 * Hide the result view by setting its container display to "none".
	 *
	 * @remarks
	 * Sets container display to "none" without disposing contents.
	 *
	 * @internal
	 */
	hideView(): void {
		const container = getElement(this.config.container);
		if (container) container.style.display = "none";
	}

	/**
	 * Dispose of the result view by cleaning up the container and optionally clearing the resolver.
	 *
	 * @param preserveResolver - If `true`, preserves the {@link currentScanResultViewResolver} for reuse; if `false`, clears it. Defaults to `false`.
	 *
	 * @remarks
	 * Clears container contents. Optionally preserves resolver for {@link handleCorrectImage} and {@link handleRetake}.
	 *
	 * @internal
	 */
	dispose(preserveResolver: boolean = false): void {
		// Clean up the container
		const container = getElement(this.config.container);
		if (container) container.textContent = "";

		// Remove the filter menu's document-level click listener so it does not leak across rebuilds.
		if (this.filterMenuOutsideClick) {
			document.removeEventListener("click", this.filterMenuOutsideClick);
			this.filterMenuOutsideClick = undefined;
		}

		// Clear resolver only if not preserving
		if (!preserveResolver) {
			this.currentScanResultViewResolver = undefined;
		}
	}
}

const DEFAULT_RESULT_VIEW_CSS = `
  .dds-result-view-container {
    display: flex;
    width: 100%;
    height: 100%;
    background-color: var(--dds-bg-view, #575757);
    font-size: 12px;
    flex-direction: column;
    align-items: center;
  }

  /* The footer buttons are reversed in the DOM (see createControls) so the landscape column scrolls
     from the top. Flip them back here so portrait keeps its original left-to-right order. */
  .dds-result-view-container .dds-controls {
    flex-direction: row-reverse;
  }

  @media (orientation: landscape) and (max-width: 1024px) {
    .dds-result-view-container {
      flex-direction: row;
    }

    /* Landscape stays a normal column (top-anchored scroll); reading the reversed DOM top-to-bottom
       gives the reversed button order. Higher specificity than the row-reverse rule above. */
    .dds-result-view-container .dds-controls {
      flex-direction: column;
    }

    /* Group Re-take next to Done at the top of the landscape column (CSS-only, no DOM/handler change).
       Done stays first; Re-take floats to the second slot just below it. */
    .dds-result-view-container #dds-scanResult-done {
      order: -2;
    }
    .dds-result-view-container #dds-scanResult-retake {
      order: -1;
    }
  }
`;

const FILTER_DROPDOWN_STYLE = ` /* Filter button customization */
  .dds-control-btn {
    position: relative; /* Anchor the absolutely-positioned filter menu to the button */
  }

  .dds-filter-menu {
    position: absolute;
    /* Sit entirely above the footer (100% spans the button/footer height) with a thin gap. */
    bottom: calc(100% + 0.25rem);
    left: 50%;
    transform: translateX(-50%);
    width: max-content;
    background-color: var(--dds-filter-menu-bg, #323234);
    border-radius: 0.5rem;
    overflow: hidden;
    display: none;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  }

  .dds-filter-menu.show {
    display: block;
  }

  .dds-filter-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    color: var(--dds-filter-menu-text, #ffffff);
    background: none;
    border: none;
    cursor: pointer;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    font-size: 14px;
    width: 100%;
    box-sizing: border-box;
    text-align: left;
  }

  /* Leading checkmark column to mark active filter */
  .dds-filter-option::before {
    content: "✓";
    width: 1rem;
    flex: none;
    text-align: center;
    color: #fe8e14;
    visibility: hidden;
  }

  .dds-filter-option.active::before {
    visibility: visible;
  }

  .dds-filter-option:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .dds-filter-option:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Landscape: the controls column clips overflow-x, cutting off the centred drop-up. Make the button
     static so the menu anchors to the (relative) wrapper instead, then pin it left of the 8rem column. */
  @media (orientation: landscape) and (max-width: 1024px) {
    .dds-result-view-container { position: relative; }
    #dds-scanResult-filter { position: static; }
    #dds-scanResult-filter .dds-filter-menu {
      inset: auto calc(8rem + 0.5rem) 0.5rem auto; transform: none;
    }
  }
`;

const SCAN_MORE_STYLE = `
  #dds-scanResult-scanMore { bottom: calc(100% + 1.5rem); background-color: var(--dds-scan-more-bg, #323234); }
  #dds-scanResult-scanMore .dds-filter-option { gap: 0.5rem; padding: 0 1.25rem; min-height: 4rem; font-size: 14px; color: var(--dds-scan-more-text, #ffffff); }
  #dds-scanResult-scanMore .dds-filter-option svg,
  #dds-scanResult-scanMore .dds-filter-option img { width: 20px; height: 20px; }
  #dds-scanResult-scanMore .dds-filter-option::before { display: none; }
  /* Pressed: recolour both the label and the plus icon (the icon's fill is hardcoded, so target it directly). */
  #dds-scanResult-scanMore .dds-filter-option:active { color: var(--dds-primary, #fe8e14); }
  #dds-scanResult-scanMore .dds-filter-option:active svg [fill]:not([fill="none"]) { fill: var(--dds-primary, #fe8e14); }

  @media (max-width: 1024px) {
    #dds-scanResult-scanMore .dds-filter-option { min-height: 3rem; padding: 0 1rem; font-size: 12px; }
    #dds-scanResult-scanMore .dds-filter-option svg,
    #dds-scanResult-scanMore .dds-filter-option img { width: 16px; height: 16px; }
  }

  @media (orientation: portrait) and (max-width: 1024px) {
    #dds-scanResult-scanMore { left: auto; right: 0.5rem; transform: none; bottom: calc(100% + 1rem); }
  }

  @media (orientation: landscape) and (max-width: 1024px) {
    /* Done static → panel's containing block is the unclipped wrapper; centre on Done's 5rem column height. */
    .dds-result-view-container { position: relative; }
    .dds-result-view-container #dds-scanResult-done { position: static; }
    #dds-scanResult-scanMore {
      bottom: auto; left: auto; right: calc(8rem + 0.25rem);
      top: 2.5rem; transform: translateY(-50%);
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
    }
  }
`;
