interface LoadingScreenOptions {
  message?: string;
  spinnerSize?: number;
}

export function showLoadingScreen(container: HTMLElement, options: LoadingScreenOptions = {}) {
  const { message, spinnerSize = 32 } = options;

  const overlayDiv = document.createElement("div");
  overlayDiv.className = "dds-loading-screen";

  const loadingDiv = document.createElement("div");
  loadingDiv.className = "dds-loading";

  // Create the loading content container
  const contentDiv = document.createElement("div");
  contentDiv.className = "dds-loading-content";

  // Add spinner
  const spinner = `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="white" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      width="${spinnerSize}" 
      height="${spinnerSize}" 
      stroke-width="0.75"
    > 
      <path d="M12 3a9 9 0 1 0 9 9"></path> 
    </svg>
  `;
  contentDiv.innerHTML = spinner;

  // Add message only if provided
  if (message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "dds-loading-message";
    messageDiv.textContent = message;
    contentDiv.appendChild(messageDiv);
  }

  loadingDiv.appendChild(contentDiv);
  overlayDiv.appendChild(loadingDiv);
  container.appendChild(overlayDiv);

  return {
    element: overlayDiv,
    updateMessage: (newMessage: string | null) => {
      let messageEl = loadingDiv.querySelector(".dds-loading-message");

      if (newMessage === null) {
        // Remove message if exists
        messageEl?.remove();
        return;
      }

      if (messageEl) {
        // Update existing message
        messageEl.textContent = newMessage;
      } else {
        // Create new message element
        messageEl = document.createElement("div");
        messageEl.className = "dds-loading-message";
        messageEl.textContent = newMessage;
        contentDiv.appendChild(messageEl);
      }
    },
    hide: () => {
      if (overlayDiv && overlayDiv.parentNode) {
        overlayDiv.classList.add("fade-out");
        setTimeout(() => {
          overlayDiv.parentNode?.removeChild(overlayDiv);
        }, 200);
      }
    },
  };
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
    opacity: 1;
    transition: opacity 0.2s ease-out;
  }

  .dds-loading-screen.fade-out {
    opacity: 0;
  }

  .dds-loading {
    position: absolute;
    left: 50%;
    top: 50%;
    color: white;
    z-index: 999;
    transform: translate(-50%, -50%);
  }

  .dds-loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .dds-loading svg {
    animation: spin 1s linear infinite;
  }

  .dds-loading-message {
    color: white;
    font-family: "Verdana";
    font-size: 14px;
    text-align: center;
    max-width: 200px;
    line-height: 1.4;
    opacity: 0.9;
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
