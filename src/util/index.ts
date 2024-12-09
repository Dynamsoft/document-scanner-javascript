export function bindControlButton(
  customButton: HTMLElement | string | undefined,
  defaultButton: HTMLElement | null,
  handler: () => void
): HTMLElement {
  let button: HTMLElement | null = null;

  // Try to get custom button
  if (typeof customButton === "string") {
    button = document.querySelector(customButton);
  } else if (customButton instanceof HTMLElement) {
    button = customButton;
  }

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
