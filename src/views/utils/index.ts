import { ControlButton, EnumFlowType } from "./types";

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

export function createControls(buttons: ControlButton[], containerStyle?: Partial<CSSStyleDeclaration>): HTMLElement {
  // Inject styles if they don't exist
  if (!document.getElementById("dds-controls-style")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "dds-controls-style";
    styleSheet.textContent = DEFAULT_CONTROLS_STYLE;
    document.head.appendChild(styleSheet);
  }

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
    buttonEl.className = "dds-control-btn";

    // Add disabled class if button is disabled
    if (button.disabled) {
      buttonEl.classList.add("disabled");
    }

    buttonEl.innerHTML = `
      <div class="dds-control-icon-wrapper">
        <div class="dds-control-icon">${button.icon}</div>
      </div>
      <div class="dds-control-text">${button.text}</div>
    `;

    if (button.onClick && !button.disabled) {
      buttonEl.addEventListener("click", button.onClick);
    }

    container.appendChild(buttonEl);
  });

  return container;
}

export function shouldCorrectImage(flow: EnumFlowType) {
  return [EnumFlowType.SMART_CAPTURE, EnumFlowType.UPLOADED_IMAGE, EnumFlowType.MANUAL].includes(flow);
}
