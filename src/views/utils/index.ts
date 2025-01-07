export function bindControlButton(
  customButton: HTMLElement | string | undefined,
  defaultButton: HTMLElement | null,
  handler: () => void
): HTMLElement {
  let button = getElement(customButton);

  // Fall back to default if no custom button found
  if (!button && defaultButton) {
    button = defaultButton;
  }
  if (!button) {
    throw new Error("No valid button element found");
  }

  button.addEventListener("click", handler);
  return button;
}

export function getElement(element: string | HTMLElement): HTMLElement | null {
  if (typeof element === "string") {
    return document.querySelector(element);
  }
  return element instanceof HTMLElement ? element : null;
}
