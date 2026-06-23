// third-party:file
// Bridges .livechat-btn clicks to the Comm100 chat installed in index.html.

export {}; // Make this a module so `declare global` is legal.

declare global {
	interface Window {
		Comm100API?: {
			do?: (action: string) => void;
		};
	}
}

document.querySelectorAll<HTMLButtonElement>(".livechat-btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		window.Comm100API?.do?.("livechat.button.click");
	});
});
