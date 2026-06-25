export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Missing #${id}`);
	return el as T;
};

// Coarse device split — picks the hub's mobile or desktop toolbar layout.
export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
	navigator.userAgent,
);
