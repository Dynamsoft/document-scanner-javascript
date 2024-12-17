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

export function isMobile() {
  return "ontouchstart" in document.documentElement;
}

export function showInfoDialog(title: string, container: HTMLElement, status: "success" | "warning" = "success") {
  const div = document.createElement("div");
  div.className = "mwc-info-dialog";
  div.innerHTML = [
    `<div>${status === "success" ? infoDialogSuccessIcon : infoDialogWarningIcon}</div>`,
    `<span style="text-align: center">${title}</span>`,
  ].join("");
  Object.assign(div.style, infoDialogStyle);

  container.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 1500);
}

const infoDialogSuccessIcon = `
<svg id="selected-circle" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="selected-circleclip-path">
      <rect id="Rectangle_2751" data-name="Rectangle 2751" width="24" height="24" fill="none"/>
    </clipPath>
  </defs>
  <g id="Group_547" data-name="Group 547" clip-path="url(#selected-circleclip-path)">
    <path id="Path_1478" data-name="Path 1478" d="M24,12A12,12,0,1,1,12,0,12,12,0,0,1,24,12" fill="#fe8e14"/>
    <path id="Path_1479" data-name="Path 1479" d="M10.52,17.174a2.517,2.517,0,0,1-1.757-.725L5.757,13.442a1,1,0,0,1,1.414-1.414l3,3a.49.49,0,0,0,.387.144.511.511,0,0,0,.373-.2l5.8-7.742a1,1,0,0,1,1.6,1.2l-5.81,7.748a2.514,2.514,0,0,1-1.83.994c-.059,0-.117.006-.176.006" fill="#fff"/>
  </g>
</svg>
`;

const infoDialogWarningIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24" fill="white">
  <path width="24" height="24" fill="white"
    d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm0 319.91a20 20 0 1120-20 20 20 0 01-20 20zm21.72-201.15l-5.74 122a16 16 0 01-32 0l-5.74-121.94v-.05a21.74 21.74 0 1143.44 0z" />
</svg>
`;

const infoDialogStyle: Partial<CSSStyleDeclaration> = {
  position: "absolute",
  left: "50%",
  top: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  width: "80px",
  height: "80px",
  borderRadius: "17%",
  color: "white",
  background: "#323234",
  zIndex: "999",
  fontFamily: "Verdana",
  padding: "1rem",
  gap: "0.25rem",
  transform: "translate(-50%, -50%)",
};
