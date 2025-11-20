/**
 * Configuration options for the loading screen.
 *
 * @public
 */
interface LoadingScreenOptions {
  /**
   * Optional message to display below the spinner.
   *
   * @public
   */
  message?: string;
  /**
   * Spinner size in pixels.
   *
   * @defaultValue 32
   *
   * @public
   */
  spinnerSize?: number;
}

/**
 * Display a full-screen loading overlay with spinner and optional message.
 *
 * @param container - The container element to append the loading screen to
 * @param options - Configuration options for the loading screen
 *
 * @returns An object with methods to control the loading screen
 *
 * @remarks
 * The loading screen covers the entire container with a dark overlay and centered spinner.
 * The returned object provides methods to update the message or hide the overlay with a fade-out animation.
 *
 * @see {@link LoadingScreenOptions} for configuration details
 *
 * @public
 */
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
    /**
     * The loading screen overlay element.
     *
     * @public
     */
    element: overlayDiv,
    /**
     * Update or remove the loading message.
     *
     * @param newMessage - The new message to display, or null to remove the message
     *
     * @public
     */
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
    /**
     * Hide the loading screen with a fade-out animation.
     *
     * @remarks
     * The overlay is removed from the DOM after a 200ms fade-out transition.
     *
     * @public
     */
    hide: () => {
      if (overlayDiv?.parentNode) {
        overlayDiv.classList.add("fade-out");
        setTimeout(() => {
          overlayDiv.parentNode?.removeChild(overlayDiv);
        }, 200);
      }
    },
  };
}



/**
 * Default CSS styles for loading screens.
 *
 * @remarks
 * Defines styles for {@link showLoadingScreen}.
 * Includes fade-out animation for smooth transitions.
 *
 * @public
 */
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
