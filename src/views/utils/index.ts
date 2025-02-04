import { EnumFlowType, ToolbarButton } from "./types";

export function getElement(element: string | HTMLElement): HTMLElement | null {
  if (typeof element === "string") {
    return document.querySelector(element);
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
`;

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

export function shouldCorrectImage(flow: EnumFlowType) {
  return [EnumFlowType.SMART_CAPTURE, EnumFlowType.UPLOADED_IMAGE, EnumFlowType.MANUAL].includes(flow);
}

export function createStyle(id: string, style: string) {
  // Initialize styles if not already done
  if (!document.getElementById(id)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = id;
    styleSheet.textContent = style;
    document.head.appendChild(styleSheet);
  }
}

export function isSVGString(str: string): boolean {
  return str.trim().startsWith("<svg") && str.trim().endsWith("</svg>");
}
