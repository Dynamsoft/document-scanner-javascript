export function showLoadingScreen(container: HTMLElement) {
  const overlayDiv = document.createElement("div");
  overlayDiv.className = "dds-loading-screen";

  const loadingDiv = document.createElement("div");
  loadingDiv.className = "dds-loading";

  loadingDiv.innerHTML = `
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="white" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        width="24" 
        height="24" 
        stroke-width="0.75"
      > 
        <path d="M12 3a9 9 0 1 0 9 9"></path> 
      </svg>
    `;

  overlayDiv.appendChild(loadingDiv);
  container.appendChild(overlayDiv);

  return overlayDiv;
}

export function hideLoadingScreen(loadingElement: HTMLElement) {
  if (loadingElement && loadingElement.parentNode) {
    loadingElement.parentNode.removeChild(loadingElement);
  }
}

export const DEFAULT_LOADING_SCREEN_STYLE = `
  .dds-loading-screen {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #323234;
    z-index: 998;
  }

  .dds-loading {
    position: absolute;
    left: 50%;
    top: 50%;
    color: white;
    z-index: 999;
    transform: translate(-50%, -50%);
  }

  .dds-loading svg {
    animation: spin 1s linear infinite;
    width: 32px;
    height: 32px;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
