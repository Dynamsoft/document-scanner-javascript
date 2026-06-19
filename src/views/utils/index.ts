import { EnumFlowType, ToolbarButton } from "./types";

/**
 * Retrieves a DOM element from either a CSS selector string or an HTMLElement instance.
 *
 * @param element - A CSS selector string or an HTMLElement instance, or `null`/`undefined`
 * @returns The HTMLElement if found, or null if the input is nullish or invalid
 * @throws {Error} If a CSS selector string is provided but no matching element is found
 *
 * @public
 */
export function getElement(element?: string | HTMLElement | null): HTMLElement | null {
	if (!element) return null;
	if (typeof element === "string") {
		const el = document.querySelector(element) as HTMLElement;
		if (!el) throw new Error("Element not found");
		return el;
	}
	return element instanceof HTMLElement ? element : null;
}

const DEFAULT_CONTROLS_STYLE = `
  .dds-controls {
    display: flex;
    height: 5.5rem;
    background-color: #323234;
    align-items: center;
    font-size: 12px;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    color: var(--dds-toolbar-btn-inactive, #ffffff);
    width: 100%;
  }

  .dds-control-btn {
    background-color: var(--dds-bg-toolbar, #323234);
    color: var(--dds-toolbar-btn-inactive, #ffffff);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    height: 100%;
    width: 100%;
    gap: 0.5rem;
    text-align: center;
    user-select: none;
  }

  /* :active applies to correction & result toolbars only — the scanner subfooter
     toggles get their colors from inline styles in DocumentScannerView.ts */
  .dds-control-btn:not(.disabled):active {
    color: var(--dds-primary, #fe8e14);
  }
  .dds-control-btn:not(.disabled):active svg [fill]:not([fill="none"]) {
    fill: var(--dds-primary, #fe8e14);
  }
  .dds-control-btn:not(.disabled):active svg [stroke]:not([stroke="none"]) {
    stroke: var(--dds-primary, #fe8e14);
  }

  .dds-control-btn.hide {
    display: none;
  }

  .dds-control-btn.disabled {
    opacity: 0.4;
    pointer-events: none;
    cursor: default;
  }

  .dds-control-icon-wrapper {
    flex: 0.75;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    min-height: 40px;
  }

  .dds-control-btn svg {
    width: 32px;
    height: 32px;
  }
  /* Recolor each path/shape that has its own inline fill/stroke (otherwise the
     hardcoded #fff in icons.ts wins over inheritance from the <svg>). */
  .dds-control-btn svg [fill]:not([fill="none"]) {
    fill: var(--dds-toolbar-btn-inactive, #ffffff);
  }
  .dds-control-btn svg [stroke]:not([stroke="none"]) {
    stroke: var(--dds-toolbar-btn-inactive, #ffffff);
  }
  .dds-control-btn img {
    width: 32px;
    height: 32px;
  }

  .dds-control-text {
    flex: 0.5;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  @media (orientation: landscape) and (max-width: 1024px) {
    .dds-controls {
      flex-direction: column;
      height: 100%;
      width: 8rem;
      /* Stopgap: scroll vertically when the buttons no longer fit (we grew from 4 to 6+ buttons). */
      overflow-y: auto;
      overflow-x: hidden;
    }

    .dds-control-btn {
      /* Keep buttons usable instead of squishing; this is what makes the column overflow and scroll. */
      min-height: 5rem;
      box-sizing: border-box;
    }
  }
`;

/**
 * Creates a toolbar control panel with buttons from an array of button definitions.
 *
 * @remarks
 * Generates responsive toolbar UI used in {@link DocumentCorrectionView} and {@link DocumentResultView}.
 * Adapts to orientation: horizontal (portrait) or vertical (landscape ≤ 1024px).
 * Supports image/SVG icons, custom classes, disabled/hidden states.
 *
 * @param buttons - Array of button definitions conforming to {@link ToolbarButton} interface
 * @param containerStyle - Optional CSS style properties to apply to the container element
 * @returns A styled HTMLElement containing the toolbar buttons
 *
 * @public
 */
export function createControls(
	buttons: ToolbarButton[],
	containerStyle?: Partial<CSSStyleDeclaration>,
): HTMLElement {
	createStyle("dds-controls-style", DEFAULT_CONTROLS_STYLE);

	// Create container
	const container = document.createElement("div");
	container.className = "dds-controls";

	// Apply custom container styles if provided
	if (containerStyle) {
		Object.assign(container.style, containerStyle);
	}

	// Create buttons
	buttons.forEach((button) => {
		const buttonEl = document.createElement("div");
		buttonEl.id = button.id;
		buttonEl.className = `dds-control-btn ${button?.className}`;

		// Create icon container
		const iconContainer = document.createElement("div");
		iconContainer.className = "dds-control-icon-wrapper";

		if (isSVGString(button.icon)) {
			iconContainer.innerHTML = button.icon;
		} else {
			const iconImg = document.createElement("img");
			iconImg.src = button.icon;
			iconImg.alt = button.label;
			iconImg.width = 24;
			iconImg.height = 24;
			iconContainer.appendChild(iconImg);
		}

		// Create text container
		const textContainer = document.createElement("div");
		textContainer.className = "dds-control-text";
		textContainer.textContent = button.label;

		// Add disabled state if specified
		if (button.isDisabled) {
			buttonEl.classList.add("disabled");
		}

		if (button.isHidden) {
			buttonEl.classList.add("hide");
		}

		// Append containers to button
		buttonEl.appendChild(iconContainer);
		buttonEl.appendChild(textContainer);

		if (button.onClick && !button.isDisabled) {
			buttonEl.addEventListener("click", button.onClick);
		}

		container.appendChild(buttonEl);
	});

	return container;
}

/**
 * Determines whether automatic perspective correction should be applied based on the capture flow type.
 *
 * @remarks
 * Returns `true` for {@link EnumFlowType.SMART_CAPTURE}, {@link EnumFlowType.UPLOADED_IMAGE}, and {@link EnumFlowType.MANUAL}.
 * Returns `false` for {@link EnumFlowType.AUTO_CROP} (already corrected) and {@link EnumFlowType.STATIC_FILE}.
 *
 * @param flow - The capture flow type from {@link EnumFlowType}
 * @returns `true` if the image should be corrected, `false` otherwise
 *
 * @public
 */
export function shouldCorrectImage(flow: EnumFlowType) {
	return [EnumFlowType.SMART_CAPTURE, EnumFlowType.UPLOADED_IMAGE, EnumFlowType.MANUAL].includes(
		flow,
	);
}

/**
 * Inject a `<style>` element into the document head. Idempotent: skips if an
 * element with the given `id` already exists. {@link applyTheme} manages its
 * own style tag separately because it needs to overwrite on later calls.
 *
 * @public
 */
export function createStyle(id: string, style: string) {
	if (!document.getElementById(id)) {
		const styleSheet = document.createElement("style");
		styleSheet.id = id;
		styleSheet.textContent = style;
		document.head.appendChild(styleSheet);
	}
}

/**
 * Override the default colors used across all views. Every field is optional;
 * unset fields fall back to the library default.
 *
 * @public
 */
export interface ThemeColor {
	/**
	 * Brand accent. Themes the shutter button, the continuous-mode "Done" button,
	 * active toggle labels in the scanner mode selector, selected camera/resolution
	 * option borders, and the pressed state of correction/result toolbar buttons.
	 *
	 * @defaultValue "#fe8e14"
	 * @public
	 */
	primary?: string;
	/**
	 * Default color for toolbar and navigation buttons: correction/result toolbar
	 * icons & labels at rest, the scanner header nav icons (camera select, upload,
	 * torch, close), and inactive toggle labels in the scanner mode selector.
	 *
	 * @defaultValue "#ffffff"
	 * @public
	 */
	toolbarButtonInactive?: string;
	/**
	 * "On" status indicator color on scanner mode selector toggles.
	 *
	 * @defaultValue "#43cc48"
	 * @public
	 */
	activeIndicator?: string;
	/**
	 * "Off" status indicator color on scanner mode selector toggles.
	 *
	 * @defaultValue "#575757"
	 * @public
	 */
	inactiveIndicator?: string;
	/**
	 * Stroke and corner-handle color of the boundary quadrilateral in the
	 * correction view. Independent of {@link ThemeColor.primary}.
	 *
	 * @defaultValue "#fe8e14"
	 * @public
	 */
	correctionQuad?: string;
	/**
	 * Body background for the correction and result views.
	 *
	 * @defaultValue "#575757"
	 * @public
	 */
	backgroundView?: string;
	/**
	 * Chrome background: the toolbar in correction/result views, the scanner
	 * header bar, and the loading screen overlay.
	 *
	 * @defaultValue "#323234"
	 * @public
	 */
	backgroundToolbar?: string;
	/**
	 * Panel background of the result view filter drop-up menu.
	 *
	 * @defaultValue "#323234"
	 * @public
	 */
	filterMenuBackground?: string;
	/**
	 * Text color of the result view filter menu options.
	 *
	 * @defaultValue "#ffffff"
	 * @public
	 */
	filterMenuText?: string;
	/**
	 * Background of the continuous-mode "Scan More" button.
	 *
	 * @defaultValue "#323234"
	 * @public
	 */
	scanMoreBackground?: string;
	/**
	 * Text color of the continuous-mode "Scan More" button.
	 *
	 * @defaultValue "#ffffff"
	 * @public
	 */
	scanMoreText?: string;
}

const THEME_VAR_MAP: Record<keyof ThemeColor, string> = {
	primary: "--dds-primary",
	toolbarButtonInactive: "--dds-toolbar-btn-inactive",
	activeIndicator: "--dds-active-indicator",
	inactiveIndicator: "--dds-inactive-indicator",
	correctionQuad: "--dds-correction-quad",
	backgroundView: "--dds-bg-view",
	backgroundToolbar: "--dds-bg-toolbar",
	filterMenuBackground: "--dds-filter-menu-bg",
	filterMenuText: "--dds-filter-menu-text",
	scanMoreBackground: "--dds-scan-more-bg",
	scanMoreText: "--dds-scan-more-text",
};

const THEME_DEFAULTS: Required<ThemeColor> = {
	primary: "#fe8e14",
	toolbarButtonInactive: "#ffffff",
	activeIndicator: "#43cc48",
	inactiveIndicator: "#575757",
	correctionQuad: "#fe8e14",
	backgroundView: "#575757",
	backgroundToolbar: "#323234",
	filterMenuBackground: "#323234",
	filterMenuText: "#ffffff",
	scanMoreBackground: "#323234",
	scanMoreText: "#ffffff",
};

let resolvedTheme: Required<ThemeColor> = { ...THEME_DEFAULTS };

/**
 * Apply a theme: inject CSS variables for view stylesheets and cache the resolved
 * values for non-CSS sinks (canvas drawing styles). Called on every
 * {@link DocumentScanner.initialize}; later calls replace the previous theme.
 *
 * @internal
 */
export function applyTheme(theme?: ThemeColor) {
	resolvedTheme = { ...THEME_DEFAULTS, ...theme };

	const styleEl = document.getElementById("dds-theme-style");
	const vars: string[] = [];
	for (const key of Object.keys(THEME_VAR_MAP) as (keyof ThemeColor)[]) {
		const value = theme?.[key];
		if (value) vars.push(`${THEME_VAR_MAP[key]}: ${value};`);
	}

	if (!vars.length) {
		styleEl?.remove();
		return;
	}

	const css = `:root {\n  ${vars.join("\n  ")}\n}`;
	if (styleEl) {
		styleEl.textContent = css;
	} else {
		const newStyle = document.createElement("style");
		newStyle.id = "dds-theme-style";
		newStyle.textContent = css;
		document.head.appendChild(newStyle);
	}
}

/**
 * Read the resolved color for a {@link ThemeColor} field. Use this for non-CSS
 * sinks (canvas drawing styles, libraries that don't resolve `var(...)`); CSS
 * rules should consume the variables directly.
 *
 * @internal
 */
export function getThemeColor(key: keyof ThemeColor): string {
	return resolvedTheme[key];
}

/**
 * Override the default user-facing strings displayed by the DocumentScanner. Every
 * field is optional; unset fields fall back to the library default. Toolbar button
 * labels (Re-take, Apply, Done, etc.) are not configured here — use
 * `correctionViewConfig.toolbarButtonsConfig` and `resultViewConfig.toolbarButtonsConfig`
 * for those.
 *
 * Strings that include a `{count}` or `{error}` placeholder are noted inline; the
 * placeholder is substituted at render time.
 *
 * @public
 */
export interface StringConfig {
	/** Loading overlay message shown during initial DCV load. @defaultValue "Loading..." */
	loadingMsg?: string;
	/** Loading overlay message shown while opening the camera. @defaultValue "Initializing camera..." */
	initializingCameraMsg?: string;
	/** Loading overlay message shown while processing a captured or uploaded image. @defaultValue "Processing image..." */
	processingImageMsg?: string;

	/**
	 * Label of the "Done" button in continuous scanning mode. The literal substring
	 * `{count}` is replaced with the current scan count at render time.
	 *
	 * @defaultValue "Done ({count})"
	 */
	continuousScanDoneBtn?: string;

	/** `title` field passed to the Web Share API when sharing the corrected image. @defaultValue "Scanned Document" */
	shareTitle?: string;
	/** Filename prefix for downloaded images. Final filename is `{prefix}-{timestamp}.png`. @defaultValue "document" */
	downloadFilenamePrefix?: string;

	/** Alert shown when the upload or share button handler throws. @defaultValue "Failed" */
	uploadShareFailedAlert?: string;
	/**
	 * Alert shown when the share/download flow throws. The literal substring `{error}`
	 * is replaced with the error message at render time.
	 *
	 * @defaultValue "Error processing image: {error}"
	 */
	shareErrorAlert?: string;

	/** Tooltip on the scanner view header button that opens the camera/resolution picker. @defaultValue "Select Camera or Resolution" */
	selectCameraBtnTitle?: string;
	/** Tooltip on the scanner view header button that uploads an image file. @defaultValue "Upload Image" */
	uploadImageBtnTitle?: string;
	/** Tooltip on the scanner view header close (X) button. @defaultValue "Close" */
	closeScannerBtnTitle?: string;

	/** Section heading above the list of cameras in the camera switcher menu. @defaultValue "Camera" */
	cameraSwitcherCameraLabel?: string;
	/** Section heading above the list of resolutions in the camera switcher menu. @defaultValue "Resolution" */
	cameraSwitcherResolutionLabel?: string;

	/** Tooltip / accessible label on the shutter (take photo) button. @defaultValue "Take Photo" */
	takePhotoBtnTitle?: string;

	/** Label of the continuous-mode "Scan More" button. @defaultValue "Scan More" */
	scanMoreBtn?: string;
	/** Result view filter menu: the "no filter" option. @defaultValue "Original" */
	filterOriginalBtn?: string;
	/** Result view filter menu: the grayscale option. @defaultValue "Grayscale" */
	filterGrayscaleBtn?: string;
	/** Result view filter menu: the black & white option. @defaultValue "Black & White" */
	filterBlackWhiteBtn?: string;
	/** Result view filter menu: the sepia option. @defaultValue "Sepia" */
	filterSepiaBtn?: string;
	/** Result view filter menu: the inverted option. @defaultValue "Inverted" */
	filterInvertedBtn?: string;
}

const STRING_DEFAULTS: Required<StringConfig> = {
	loadingMsg: "Loading...",
	initializingCameraMsg: "Initializing camera...",
	processingImageMsg: "Processing image...",
	continuousScanDoneBtn: "Done ({count})",
	shareTitle: "Scanned Document",
	downloadFilenamePrefix: "document",
	uploadShareFailedAlert: "Failed",
	shareErrorAlert: "Error processing image: {error}",
	selectCameraBtnTitle: "Select Camera or Resolution",
	uploadImageBtnTitle: "Upload Image",
	closeScannerBtnTitle: "Close",
	cameraSwitcherCameraLabel: "Camera",
	cameraSwitcherResolutionLabel: "Resolution",
	takePhotoBtnTitle: "Take Photo",
	scanMoreBtn: "Scan More",
	filterOriginalBtn: "Original",
	filterGrayscaleBtn: "Grayscale",
	filterBlackWhiteBtn: "Black & White",
	filterSepiaBtn: "Sepia",
	filterInvertedBtn: "Inverted",
};

let resolvedStrings: Required<StringConfig> = { ...STRING_DEFAULTS };
let explicitStringKeys: Set<keyof StringConfig> = new Set();

/**
 * Apply a string config: merges user overrides over the defaults and caches the
 * resolved values for later {@link getString} calls. Called on every
 * {@link DocumentScanner.initialize}; later calls replace the previous config.
 * Calling with no argument (or `undefined`) resets all strings to defaults.
 *
 * @internal
 */
export function applyStringConfig(config?: StringConfig) {
	const explicit = config ? Object.entries(config).filter(([, v]) => v !== undefined) : [];
	resolvedStrings = { ...STRING_DEFAULTS, ...Object.fromEntries(explicit) };
	explicitStringKeys = new Set(explicit.map(([k]) => k as keyof StringConfig));
}

/**
 * Read the resolved value for a {@link StringConfig} field. Always returns the
 * default if no override is set.
 *
 * @internal
 */
export function getString(key: keyof StringConfig): string {
	return resolvedStrings[key];
}

/**
 * Whether the user explicitly provided a value for `key` in the last
 * {@link applyStringConfig} call. Use this to gate overrides of values that
 * have an existing source of truth (e.g. labels baked into the DCE UI XML),
 * so customer-customized XMLs are not clobbered by our defaults.
 *
 * @internal
 */
export function hasStringOverride(key: keyof StringConfig): boolean {
	return explicitStringKeys.has(key);
}

/**
 * Checks if a string contains SVG markup.
 *
 * @remarks
 * Checks if trimmed string starts with `<svg` and ends with `</svg>`.
 *
 * @param str - The string to check for SVG content
 * @returns `true` if the string is an SVG, `false` otherwise
 *
 * @public
 */
export function isSVGString(str: string): boolean {
	return str.trim().startsWith("<svg") && str.trim().endsWith("</svg>");
}

/**
 * Checks if an object is empty, null, or undefined.
 *
 * @param obj - The object to check
 * @returns `true` if the object is empty, null, or undefined; `false` otherwise
 *
 * @public
 */
export const isEmptyObject = (obj: object | null | undefined): boolean => {
	return !obj || Object.keys(obj).length === 0;
};

/**
 * Constant object defining standard video resolutions for camera constraints.
 *
 * @remarks
 * 4k (3840×2160), 2k (2560×1440), 1080p (1920×1080), 720p (1280×720), 480p (640×480).
 *
 * @public
 */
export const STANDARD_RESOLUTIONS = {
	"4k": { width: 3840, height: 2160 },
	"2k": { width: 2560, height: 1440 },
	"1080p": { width: 1920, height: 1080 },
	"720p": { width: 1280, height: 720 },
	"480p": { width: 640, height: 480 },
} as const;

/**
 * Type representing the keys of {@link STANDARD_RESOLUTIONS}.
 *
 * @public
 */
type ResolutionLevel = keyof typeof STANDARD_RESOLUTIONS;

/**
 * Finds the closest standard resolution level to a given resolution.
 *
 * @remarks
 * Uses weighted scoring: 70% pixel count difference, 30% aspect ratio difference.
 *
 * @param selectedResolution - An object with `width` and `height` properties in pixels
 * @returns The key from {@link STANDARD_RESOLUTIONS} representing the closest match
 *
 * @public
 */
export function findClosestResolutionLevel(selectedResolution: {
	width: number;
	height: number;
}): ResolutionLevel {
	// Calculate the total pixels for the input resolution
	const inputPixels = selectedResolution.width * selectedResolution.height;

	// Calculate the aspect ratio of the input resolution
	const inputAspectRatio = selectedResolution.width / selectedResolution.height;

	// Find the closest resolution by comparing total pixels and aspect ratio
	let closestLevel: ResolutionLevel = "480p";
	let smallestDifference = Number.MAX_VALUE;

	for (const [level, resolution] of Object.entries(STANDARD_RESOLUTIONS)) {
		const standardPixels = resolution.width * resolution.height;
		const standardAspectRatio = resolution.width / resolution.height;

		// Calculate differences in pixels and aspect ratio
		const pixelDifference = Math.abs(standardPixels - inputPixels);
		const aspectRatioDifference = Math.abs(standardAspectRatio - inputAspectRatio);

		// Use a weighted scoring system - pixels are more important than aspect ratio
		const totalDifference = pixelDifference * 0.7 + aspectRatioDifference * standardPixels * 0.3;

		if (totalDifference < smallestDifference) {
			smallestDifference = totalDifference;
			closestLevel = level as ResolutionLevel;
		}
	}

	return closestLevel;
}
