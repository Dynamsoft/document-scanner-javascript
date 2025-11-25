import { EnumFlowType, ToolbarButton } from "./types";

/**
 * Retrieves a DOM element from either a CSS selector string or an HTMLElement instance.
 *
 * @param element - A CSS selector string or an HTMLElement instance
 * @returns The HTMLElement if found, or null if the input is invalid
 * @throws {Error} If a CSS selector string is provided but no matching element is found
 *
 * @public
 */
export function getElement(element: string | HTMLElement): HTMLElement | null {
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
    height: 8rem;
    background-color: #323234;
    align-items: center;
    font-size: 12px;
    font-family: Verdana;
    color: white;
    width: 100%;
  }

  .dds-control-btn {
    background-color: #323234;
    color: white;
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

  .dds-control-icon img,
  .dds-control-icon svg {
    width: 32px;
    height: 32px;
    fill: #fe8e14;
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
export function createControls(buttons: ToolbarButton[], containerStyle?: Partial<CSSStyleDeclaration>): HTMLElement {
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
  return [EnumFlowType.SMART_CAPTURE, EnumFlowType.UPLOADED_IMAGE, EnumFlowType.MANUAL].includes(flow);
}

/**
 * Creates and injects a CSS style element into the document head.
 *
 * @remarks
 * Idempotent: if a style element with the given `id` already exists, no new element is created.
 *
 * @param id - Unique identifier for the style element
 * @param style - CSS content to inject
 *
 * @public
 */
export function createStyle(id: string, style: string) {
  // Initialize styles if not already done
  if (!document.getElementById(id)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = id;
    styleSheet.textContent = style;
    document.head.appendChild(styleSheet);
  }
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
export function findClosestResolutionLevel(selectedResolution: { width: number; height: number }): ResolutionLevel {
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
