/*!
* Dynamsoft Document Scanner JavaScript Library
* @product Dynamsoft Document Scanner JS Edition Bundle
* @website http://www.dynamsoft.com
* @copyright Copyright 2026, Dynamsoft Corporation
* @author Dynamsoft
* @version 1.5.0-beta202606250003
* @fileoverview Dynamsoft Document Scanner (DDS) is a ready-to-use SDK for capturing and enhancing document images with automatic border detection, correction, and customizable workflows. Uses Dynamsoft Capture Vision Bundle v3.2.2000.
* More info on DDS JS: https://www.dynamsoft.com/mobile-document-scanner/docs/web/introduction/index.html
*/
import { CameraEnhancer as e, CameraEnhancer as t, CameraEnhancerModule as n, CameraManager as r, CameraView as i, CameraView as a, CaptureVisionRouter as o, CaptureVisionRouter as s, CaptureVisionRouterModule as c, CapturedResultReceiver as l, CapturedResultReceiver as u, CoreModule as d, CoreModule as f, DocumentNormalizerModule as p, DrawingStyleManager as m, EnumBufferOverflowProtectionMode as h, EnumCapturedResultItemType as g, EnumCapturedResultItemType as _, EnumErrorCode as v, EnumImagePixelFormat as y, EnumImagePixelFormat as b, ImageDrawer as x, ImageEditorView as S, ImageIO as C, ImageProcessor as w, IntermediateResultReceiver as ee, LicenseManager as te, LicenseManager as T, LicenseModule as ne, MultiFrameResultCrossFilter as re, MultiFrameResultCrossFilter as ie, QuadDrawingItem as E, UtilityModule as ae, handleEngineResourcePaths as oe, innerVersions as se, isDSImageData as ce, isDSRect as le, isPoint as ue, isQuad as de } from "dynamsoft-capture-vision-bundle";
//#region src/views/utils/types.ts
var D = /* @__PURE__ */ function(e) {
	return e.Scanner = "scanner", e.Result = "scan-result", e.Correction = "correction", e;
}({}), O = {
	detect: "DetectDocumentBoundaries_Default",
	normalize: "NormalizeDocument_Default"
}, k = /* @__PURE__ */ function(e) {
	return e[e.RS_SUCCESS = 0] = "RS_SUCCESS", e[e.RS_CANCELLED = 1] = "RS_CANCELLED", e[e.RS_FAILED = 2] = "RS_FAILED", e;
}({}), A = /* @__PURE__ */ function(e) {
	return e.MANUAL = "manual", e.SMART_CAPTURE = "smartCapture", e.AUTO_CROP = "autoCrop", e.UPLOADED_IMAGE = "uploadedImage", e.STATIC_FILE = "staticFile", e;
}({});
//#endregion
//#region src/views/utils/index.ts
function j(e) {
	if (!e) return null;
	if (typeof e == "string") {
		let t = document.querySelector(e);
		if (!t) throw Error("Element not found");
		return t;
	}
	return e instanceof HTMLElement ? e : null;
}
var fe = "\n  .dds-controls {\n    display: flex;\n    height: 5.5rem;\n    background-color: #323234;\n    align-items: center;\n    font-size: 12px;\n    font-family: Verdana, Geneva, Tahoma, sans-serif;\n    color: var(--dds-toolbar-btn-inactive, #ffffff);\n    width: 100%;\n  }\n\n  .dds-control-btn {\n    background-color: var(--dds-bg-toolbar, #323234);\n    color: var(--dds-toolbar-btn-inactive, #ffffff);\n    cursor: pointer;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    flex-direction: column;\n    height: 100%;\n    width: 100%;\n    gap: 0.5rem;\n    text-align: center;\n    user-select: none;\n  }\n\n  /* :active applies to correction & result toolbars only — the scanner subfooter\n     toggles get their colors from inline styles in DocumentScannerView.ts */\n  .dds-control-btn:not(.disabled):active {\n    color: var(--dds-primary, #fe8e14);\n  }\n  .dds-control-btn:not(.disabled):active svg [fill]:not([fill=\"none\"]) {\n    fill: var(--dds-primary, #fe8e14);\n  }\n  .dds-control-btn:not(.disabled):active svg [stroke]:not([stroke=\"none\"]) {\n    stroke: var(--dds-primary, #fe8e14);\n  }\n\n  .dds-control-btn.hide {\n    display: none;\n  }\n\n  .dds-control-btn.disabled {\n    opacity: 0.4;\n    pointer-events: none;\n    cursor: default;\n  }\n\n  .dds-control-icon-wrapper {\n    flex: 0.75;\n    display: flex;\n    align-items: flex-end;\n    justify-content: center;\n    min-height: 40px;\n  }\n\n  .dds-control-btn svg {\n    width: 32px;\n    height: 32px;\n  }\n  /* Recolor each path/shape that has its own inline fill/stroke (otherwise the\n     hardcoded #fff in icons.ts wins over inheritance from the <svg>). */\n  .dds-control-btn svg [fill]:not([fill=\"none\"]) {\n    fill: var(--dds-toolbar-btn-inactive, #ffffff);\n  }\n  .dds-control-btn svg [stroke]:not([stroke=\"none\"]) {\n    stroke: var(--dds-toolbar-btn-inactive, #ffffff);\n  }\n  .dds-control-btn img {\n    width: 32px;\n    height: 32px;\n  }\n\n  .dds-control-text {\n    flex: 0.5;\n    display: flex;\n    align-items: flex-start;\n    justify-content: center;\n  }\n\n  @media (orientation: landscape) and (max-width: 1024px) {\n    .dds-controls {\n      flex-direction: column;\n      height: 100%;\n      width: 8rem;\n      /* Stopgap: scroll vertically when the buttons no longer fit (we grew from 4 to 6+ buttons). */\n      overflow-y: auto;\n      overflow-x: hidden;\n    }\n\n    .dds-control-btn {\n      /* Keep buttons usable instead of squishing; this is what makes the column overflow and scroll. */\n      min-height: 5rem;\n      box-sizing: border-box;\n    }\n  }\n";
function M(e, t) {
	P("dds-controls-style", fe);
	let n = document.createElement("div");
	return n.className = "dds-controls", t && Object.assign(n.style, t), e.forEach((e) => {
		let t = document.createElement("div");
		t.id = e.id, t.className = `dds-control-btn ${e?.className}`;
		let r = document.createElement("div");
		if (r.className = "dds-control-icon-wrapper", ge(e.icon)) r.innerHTML = e.icon;
		else {
			let t = document.createElement("img");
			t.src = e.icon, t.alt = e.label, t.width = 24, t.height = 24, r.appendChild(t);
		}
		let i = document.createElement("div");
		i.className = "dds-control-text", i.textContent = e.label, e.isDisabled && t.classList.add("disabled"), e.isHidden && t.classList.add("hide"), t.appendChild(r), t.appendChild(i), e.onClick && !e.isDisabled && t.addEventListener("click", e.onClick), n.appendChild(t);
	}), n;
}
function N(e) {
	return [
		A.SMART_CAPTURE,
		A.UPLOADED_IMAGE,
		A.MANUAL
	].includes(e);
}
function P(e, t) {
	if (!document.getElementById(e)) {
		let n = document.createElement("style");
		n.id = e, n.textContent = t, document.head.appendChild(n);
	}
}
var F = {
	primary: "--dds-primary",
	toolbarButtonInactive: "--dds-toolbar-btn-inactive",
	activeIndicator: "--dds-active-indicator",
	inactiveIndicator: "--dds-inactive-indicator",
	correctionQuad: "--dds-correction-quad",
	backgroundView: "--dds-bg-view",
	backgroundToolbar: "--dds-bg-toolbar",
	filterMenuBackground: "--dds-filter-menu-bg",
	filterMenuText: "--dds-filter-menu-text",
	scanMoreBackground: "--dds-scan-more-bg",
	scanMoreText: "--dds-scan-more-text"
}, I = {
	primary: "#fe8e14",
	toolbarButtonInactive: "#ffffff",
	activeIndicator: "#43cc48",
	inactiveIndicator: "#575757",
	correctionQuad: "#fe8e14",
	backgroundView: "#575757",
	backgroundToolbar: "#323234",
	filterMenuBackground: "#323234",
	filterMenuText: "#ffffff",
	scanMoreBackground: "#323234",
	scanMoreText: "#ffffff"
}, L = { ...I };
function pe(e) {
	L = {
		...I,
		...e
	};
	let t = document.getElementById("dds-theme-style"), n = [];
	for (let t of Object.keys(F)) {
		let r = e?.[t];
		r && n.push(`${F[t]}: ${r};`);
	}
	if (!n.length) {
		t?.remove();
		return;
	}
	let r = `:root {\n  ${n.join("\n  ")}\n}`;
	if (t) t.textContent = r;
	else {
		let e = document.createElement("style");
		e.id = "dds-theme-style", e.textContent = r, document.head.appendChild(e);
	}
}
function me(e) {
	return L[e];
}
var R = {
	loadingMsg: "Loading...",
	initializingCameraMsg: "Initializing camera...",
	processingImageMsg: "Processing image...",
	continuousScanDoneBtn: "Done ({count})",
	shareTitle: "Scanned Document",
	downloadFilenamePrefix: "document",
	uploadShareFailedAlert: "Failed",
	shareErrorAlert: "Error processing image: {error}",
	selectCameraBtnTitle: "Select Camera or Resolution",
	uploadImageBtnTitle: "Upload Image",
	closeScannerBtnTitle: "Close",
	cameraSwitcherCameraLabel: "Camera",
	cameraSwitcherResolutionLabel: "Resolution",
	takePhotoBtnTitle: "Take Photo",
	scanMoreBtn: "Scan More",
	filterOriginalBtn: "Original",
	filterGrayscaleBtn: "Grayscale",
	filterBlackWhiteBtn: "Black & White",
	filterSepiaBtn: "Sepia",
	filterInvertedBtn: "Inverted"
}, z = { ...R }, B = /* @__PURE__ */ new Set();
function he(e) {
	let t = e ? Object.entries(e).filter(([, e]) => e !== void 0) : [];
	z = {
		...R,
		...Object.fromEntries(t)
	}, B = new Set(t.map(([e]) => e));
}
function V(e) {
	return z[e];
}
function H(e) {
	return B.has(e);
}
function ge(e) {
	return e.trim().startsWith("<svg") && e.trim().endsWith("</svg>");
}
var _e = (e) => !e || Object.keys(e).length === 0, ve = {
	"4k": {
		width: 3840,
		height: 2160
	},
	"2k": {
		width: 2560,
		height: 1440
	},
	"1080p": {
		width: 1920,
		height: 1080
	},
	"720p": {
		width: 1280,
		height: 720
	},
	"480p": {
		width: 640,
		height: 480
	}
};
function ye(e) {
	let t = e.width * e.height, n = e.width / e.height, r = "480p", i = Number.MAX_VALUE;
	for (let [e, a] of Object.entries(ve)) {
		let o = a.width * a.height, s = a.width / a.height, c = Math.abs(o - t), l = Math.abs(s - n), u = c * .7 + l * o * .3;
		u < i && (i = u, r = e);
	}
	return r;
}
//#endregion
//#region src/views/utils/icons.ts
var U = {
	rotate: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"25\" height=\"25\" viewBox=\"0 0 24 24\"><path fill=\"#fff\" d=\"M15.55 5.55 11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42 1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z\"/></svg>",
	filter: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"25\" height=\"25\" viewBox=\"0 0 24 24\"><path fill=\"#fff\" d=\"M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z\"/></svg>",
	plus: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path fill=\"#fff\" d=\"M13.25 4.75a1.25 1.25 0 0 0-2.5 0v6h-6a1.25 1.25 0 0 0 0 2.5h6v6a1.25 1.25 0 0 0 2.5 0v-6h6a1.25 1.25 0 0 0 0-2.5h-6v-6z\"/></svg>",
	fullImage: "\n  <svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"25\" height=\"25\" viewBox=\"0 0 25 25\">\n  <defs>\n    <clipPath id=\"fullImageclip-path\">\n      <rect id=\"Rectangle_2776\" data-name=\"Rectangle 2776\" width=\"25\" height=\"25\" fill=\"#fff\"/>\n    </clipPath>\n  </defs>\n  <g id=\"full-image\" transform=\"translate(0 0)\">\n    <g id=\"Group_586\" data-name=\"Group 586\" transform=\"translate(0 0)\" clip-path=\"url(#fullImageclip-path)\">\n      <path id=\"Path_1528\" data-name=\"Path 1528\" d=\"M.621,3.618A.621.621,0,0,0,1.242,3V1.809a.569.569,0,0,1,.567-.567H3A.621.621,0,0,0,3,0H1.809A1.811,1.811,0,0,0,0,1.809V3a.621.621,0,0,0,.621.621\" transform=\"translate(0 0)\" fill=\"#fff\"/>\n      <path id=\"Path_1529\" data-name=\"Path 1529\" d=\"M17.842,1.242H19.03a.568.568,0,0,1,.566.567V3a.621.621,0,1,0,1.242,0V1.809A1.811,1.811,0,0,0,19.03,0H17.842a.621.621,0,0,0,0,1.242\" transform=\"translate(4.162 0)\" fill=\"#fff\"/>\n      <path id=\"Path_1530\" data-name=\"Path 1530\" d=\"M9.562,0H5.4a.621.621,0,0,0,0,1.242H9.562A.621.621,0,0,0,9.562,0\" transform=\"translate(1.156 0)\" fill=\"#fff\"/>\n      <path id=\"Path_1531\" data-name=\"Path 1531\" d=\"M11.623,1.242h4.158a.621.621,0,0,0,0-1.242H11.623a.621.621,0,0,0,0,1.242\" transform=\"translate(2.659 0)\" fill=\"#fff\"/>\n      <path id=\"Path_1532\" data-name=\"Path 1532\" d=\"M3,19.6H1.808a.568.568,0,0,1-.566-.567V17.841a.621.621,0,1,0-1.242,0v1.188a1.81,1.81,0,0,0,1.808,1.809H3A.621.621,0,0,0,3,19.6\" transform=\"translate(0 4.161)\" fill=\"#fff\"/>\n      <path id=\"Path_1533\" data-name=\"Path 1533\" d=\"M9.562,19.134H5.4a.621.621,0,1,0,0,1.242H9.562a.621.621,0,1,0,0-1.242\" transform=\"translate(1.156 4.624)\" fill=\"#fff\"/>\n      <path id=\"Path_1534\" data-name=\"Path 1534\" d=\"M.621,10.183a.621.621,0,0,0,.621-.621V5.4A.621.621,0,0,0,0,5.4V9.562a.621.621,0,0,0,.621.621\" transform=\"translate(0 1.156)\" fill=\"#fff\"/>\n      <path id=\"Path_1535\" data-name=\"Path 1535\" d=\"M.621,16.4a.621.621,0,0,0,.621-.621V11.624a.621.621,0,1,0-1.242,0v4.157a.621.621,0,0,0,.621.621\" transform=\"translate(0 2.659)\" fill=\"#fff\"/>\n      <path id=\"Path_1536\" data-name=\"Path 1536\" d=\"M20.376,5.4a.621.621,0,1,0-1.242,0V9.563a.621.621,0,1,0,1.242,0Z\" transform=\"translate(4.624 1.156)\" fill=\"#fff\"/>\n      <path id=\"Path_1537\" data-name=\"Path 1537\" d=\"M20.217,17.221a.621.621,0,0,0-.621.621V19.03a.568.568,0,0,1-.567.566H17.841a.621.621,0,1,0,0,1.242h1.188a1.811,1.811,0,0,0,1.809-1.808V17.842a.621.621,0,0,0-.621-.621\" transform=\"translate(4.162 4.162)\" fill=\"#fff\"/>\n      <path id=\"Path_1538\" data-name=\"Path 1538\" d=\"M15.781,19.134H11.623a.621.621,0,1,0,0,1.242h4.158a.621.621,0,0,0,0-1.242\" transform=\"translate(2.659 4.624)\" fill=\"#fff\"/>\n      <path id=\"Path_1539\" data-name=\"Path 1539\" d=\"M19.755,11a.621.621,0,0,0-.621.621v4.157a.621.621,0,0,0,1.242,0V11.624A.621.621,0,0,0,19.755,11\" transform=\"translate(4.624 2.659)\" fill=\"#fff\"/>\n      <path id=\"Path_1540\" data-name=\"Path 1540\" d=\"M7.5,18.3a.621.621,0,0,0-.621-.621H4.733l5.149-5.149A.621.621,0,0,0,9,11.656L3.855,16.806V14.579a.621.621,0,0,0-1.242,0V18.3a.611.611,0,0,0,.048.238A.606.606,0,0,0,3,18.877a.606.606,0,0,0,.238.048H6.878A.621.621,0,0,0,7.5,18.3\" transform=\"translate(0.632 2.773)\" fill=\"#fff\"/>\n      <path id=\"Path_1541\" data-name=\"Path 1541\" d=\"M14.173,3.409a.619.619,0,0,0,.621.621h1.836L11.483,9.178a.621.621,0,0,0,.878.878l5.148-5.148V6.744a.621.621,0,1,0,1.242,0V3.41a.606.606,0,0,0-.048-.238.612.612,0,0,0-.335-.335.606.606,0,0,0-.238-.048H14.794a.621.621,0,0,0-.621.621\" transform=\"translate(2.731 0.673)\" fill=\"#fff\"/>\n      <path id=\"Path_1542\" data-name=\"Path 1542\" d=\"M2.661,3.172a.615.615,0,0,0-.048.238V6.744a.621.621,0,0,0,1.242,0V4.908L9,10.057a.621.621,0,0,0,.878-.878L4.733,4.03H6.57a.621.621,0,1,0,0-1.242H3.235A.634.634,0,0,0,3,2.836a.624.624,0,0,0-.335.335\" transform=\"translate(0.632 0.673)\" fill=\"#fff\"/>\n      <path id=\"Path_1543\" data-name=\"Path 1543\" d=\"M18.7,18.545a.617.617,0,0,0,.048-.24h0V14.581a.62.62,0,1,0-1.24,0v2.226l-5.148-5.15a.621.621,0,0,0-.878.878l5.147,5.149H14.4a.621.621,0,0,0-.621.621.623.623,0,0,0,.621.621h3.71a.616.616,0,0,0,.453-.18.6.6,0,0,0,.117-.175c0-.009.012-.016.016-.025\" transform=\"translate(2.731 2.773)\" fill=\"#fff\"/>\n    </g>\n  </g>\n</svg>\n\n",
	autoBounds: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"25.04\" height=\"25\" viewBox=\"0 0 25.04 25\">\n  <g id=\"bounds-detection\" transform=\"translate(0.02)\">\n    <g id=\"Group_306\" data-name=\"Group 306\" transform=\"translate(-0.02)\">\n      <path id=\"Path_982\" data-name=\"Path 982\" d=\"M.791,8.146h.02a.468.468,0,0,0,.516-.416.455.455,0,0,0,0-.063V1.927a1,1,0,0,1,1-1H7.957A.468.468,0,0,0,8.436.492.468.468,0,0,0,7.977.013H2.247A1.913,1.913,0,0,0,.333,1.927v5.74A.468.468,0,0,0,.791,8.146Z\" transform=\"translate(-0.293 -0.012)\" fill=\"#fff\"/>\n      <path id=\"Path_983\" data-name=\"Path 983\" d=\"M140.092,132.044a.468.468,0,0,0-.458-.478h-.02a.468.468,0,0,0-.478.458q0,.01,0,.02v5.74a1,1,0,0,1-1,1h-5.671a.5.5,0,0,0,0,1h5.711a1.913,1.913,0,0,0,1.915-1.912q0-.041,0-.081Z\" transform=\"translate(-115.132 -114.777)\" fill=\"#fff\"/>\n      <path id=\"Path_984\" data-name=\"Path 984\" d=\"M7.665,138.7H1.955a1,1,0,0,1-1-1v-5.661a.468.468,0,0,0-.458-.478H.48a.468.468,0,0,0-.478.458q0,.01,0,.02v5.74A1.914,1.914,0,0,0,1.914,139.7H7.665a.5.5,0,1,0,0-1Z\" transform=\"translate(-0.001 -114.777)\" fill=\"#fff\"/>\n      <path id=\"Path_985\" data-name=\"Path 985\" d=\"M138.405,0l-.081,0h-5.711a.468.468,0,0,0-.478.458q0,.01,0,.02a.468.468,0,0,0,.458.478h5.731a1,1,0,0,1,1,1v5.7a.5.5,0,0,0,1,0V1.915A1.913,1.913,0,0,0,138.405,0Z\" transform=\"translate(-115.277)\" fill=\"#fff\"/>\n      <path id=\"Path_986\" data-name=\"Path 986\" d=\"M32.226,33.132v14.81a1.227,1.227,0,0,0,1.227,1.227H48.265a1.217,1.217,0,0,0,1.227-1.206V33.132a1.217,1.217,0,0,0-1.206-1.227H33.453A1.227,1.227,0,0,0,32.226,33.132Zm16.251-.045a.19.19,0,0,1,0,.045v14.81a.19.19,0,0,1-.179.2H33.453a.19.19,0,0,1-.211-.168.182.182,0,0,1,0-.033V33.132a.19.19,0,0,1,.212-.212H48.265A.191.191,0,0,1,48.477,33.087Z\" transform=\"translate(-28.359 -28.076)\" fill=\"#fff\"/>\n      <path id=\"Path_987\" data-name=\"Path 987\" d=\"M59.363,95.652h9.209a.478.478,0,0,0,.478-.478.488.488,0,0,0-.478-.478H59.363a.488.488,0,0,0-.478.478A.478.478,0,0,0,59.363,95.652Z\" transform=\"translate(-51.309 -82.838)\" fill=\"#fff\"/>\n      <path id=\"Path_988\" data-name=\"Path 988\" d=\"M59.363,128.6h9.209a.478.478,0,0,0,.478-.478.488.488,0,0,0-.478-.478H59.363a.488.488,0,0,0-.478.478A.478.478,0,0,0,59.363,128.6Z\" transform=\"translate(-51.309 -111.663)\" fill=\"#fff\"/>\n      <path id=\"Path_989\" data-name=\"Path 989\" d=\"M59.364,64.6h4.285a.488.488,0,0,0,.478-.478.478.478,0,0,0-.478-.478H59.364a.468.468,0,0,0-.478.458q0,.01,0,.02A.478.478,0,0,0,59.364,64.6Z\" transform=\"translate(-51.443 -55.678)\" fill=\"#fff\"/>\n    </g>\n  </g>\n</svg>\n",
	finish: "<svg id=\"finish\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\">\n  <defs>\n    <clipPath id=\"finishclip-path\">\n      <rect id=\"Rectangle_2775\" data-name=\"Rectangle 2775\" width=\"24\" height=\"24\" fill=\"currentColor\"/>\n    </clipPath>\n  </defs>\n  <g id=\"Group_584\" data-name=\"Group 584\" clip-path=\"url(#finishclip-path)\">\n    <path id=\"Path_1526\" data-name=\"Path 1526\" d=\"M17.6,6.7l-6.691,9.081L6.313,12.11a.5.5,0,0,0-.625.781l5,4a.508.508,0,0,0,.378.1.493.493,0,0,0,.337-.2l7-9.5A.5.5,0,1,0,17.6,6.7\" fill=\"currentColor\"/>\n    <path id=\"Path_1527\" data-name=\"Path 1527\" d=\"M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0m0,23A11,11,0,1,1,23,12,11.013,11.013,0,0,1,12,23\" fill=\"currentColor\"/>\n  </g>\n</svg>\n",
	upload: "<svg id=\"Layer_2\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\">\n  <defs>\n    <style>\n      .cls-1 {\n        fill: #fff;\n        stroke-width: 0px;\n      }\n    </style>\n  </defs>\n  <g id=\"Layer_1-2\">\n    <path class=\"cls-1\"\n      d=\"m17.05,14.93c-.27,0-.48.22-.48.5v5.95l-2.97-6.18c-.1-.21-.32-.32-.54-.26-.22.05-.37.25-.37.49v8.07c0,.28.21.5.48.5s.48-.22.48-.5v-5.95l2.97,6.18c.08.17.25.28.43.28.04,0,.07,0,.11-.01.22-.05.37-.25.37-.49v-8.07c0-.28-.21-.5-.48-.5Z\" />\n    <path class=\"cls-1\"\n      d=\"m8.64,14.93h-1.94c-.27,0-.48.22-.48.5v8.07c0,.28.21.5.48.5s.48-.22.48-.5v-3.53h1.46c1.34,0,2.42-1.13,2.42-2.52s-1.09-2.52-2.42-2.52Zm0,4.03h-1.46v-3.04h1.46c.81,0,1.46.68,1.46,1.52s-.66,1.52-1.46,1.52Z\" />\n    <path class=\"cls-1\"\n      d=\"m23.52,18.62c.27,0,.48-.22.48-.5v-.67c0-1.39-1.09-2.52-2.42-2.52s-2.42,1.13-2.42,2.52v4.03c0,1.39,1.09,2.52,2.42,2.52s2.42-1.13,2.42-2.52v-.67c0-.28-.21-.5-.48-.5h-1.29c-.27,0-.48.22-.48.5s.21.5.48.5h.81v.17c0,.84-.65,1.52-1.46,1.52s-1.46-.68-1.46-1.52v-4.03c0-.84.65-1.52,1.46-1.52s1.46.68,1.46,1.52v.67c0,.28.21.5.48.5Z\" />\n    <path class=\"cls-1\"\n      d=\"m3.65,22.96H1.58c-.27,0-.49-.21-.49-.48V1.52c0-.26.22-.48.49-.48h12.45c.16,0,.31.03.47.05v3.42c0,.84.71,1.52,1.58,1.52h3.55c.01.15.05.3.05.45v6.01c0,.29.24.52.54.52s.54-.23.54-.52v-6.01c0-.33-.03-.65-.08-.97,0,0,0,0,0,0,0,0,0-.02,0-.02-.45-2.77-2.72-4.97-5.6-5.4-.01,0-.02,0-.03,0,0,0,0,0,0,0-.33-.05-.66-.08-1-.08H1.58C.71,0,0,.68,0,1.52v20.96c0,.84.71,1.52,1.58,1.52h2.07c.3,0,.54-.23.54-.52s-.24-.52-.54-.52ZM15.58,1.28c1.86.52,3.31,1.92,3.85,3.71h-3.36c-.27,0-.49-.21-.49-.48V1.28Z\" />\n    <path class=\"cls-1\" transform=\"scale(1, -1) translate(0, -14)\"\n      d=\"m10.32,7.11l-1.65,1.53v-4.58c0-.3-.26-.55-.59-.55s-.59.25-.59.55v4.58l-1.65-1.53c-.23-.21-.6-.21-.84,0s-.23.56,0,.78l2.66,2.47c.05.05.12.09.19.12.07.03.15.04.23.04s.15-.01.23-.04c.07-.03.14-.07.19-.12l2.66-2.47c.23-.21.23-.56,0-.78-.23-.21-.6-.21-.84,0Z\" />\n  </g>\n</svg>\n",
	share: "\n<svg id=\"sharePng\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\">\n  <g id=\"sharePng\">\n    <path fill=\"#fff\" stroke-width=\"0\"\n      d=\"m17.05,14.93c-.27,0-.48.22-.48.5v5.95l-2.97-6.18c-.1-.21-.32-.32-.54-.26-.22.05-.37.25-.37.49v8.07c0,.28.21.5.48.5s.48-.22.48-.5v-5.95l2.97,6.18c.08.17.25.28.43.28.04,0,.07,0,.11-.01.22-.05.37-.25.37-.49v-8.07c0-.28-.21-.5-.48-.5Z\" />\n    <path fill=\"#fff\" stroke-width=\"0\"\n      d=\"m8.64,14.93h-1.94c-.27,0-.48.22-.48.5v8.07c0,.28.21.5.48.5s.48-.22.48-.5v-3.53h1.46c1.34,0,2.42-1.13,2.42-2.52s-1.09-2.52-2.42-2.52Zm0,4.03h-1.46v-3.04h1.46c.81,0,1.46.68,1.46,1.52s-.66,1.52-1.46,1.52Z\" />\n    <path fill=\"#fff\" stroke-width=\"0\"\n      d=\"m23.52,18.62c.27,0,.48-.22.48-.5v-.67c0-1.39-1.09-2.52-2.42-2.52s-2.42,1.13-2.42,2.52v4.03c0,1.39,1.09,2.52,2.42,2.52s2.42-1.13,2.42-2.52v-.67c0-.28-.21-.5-.48-.5h-1.29c-.27,0-.48.22-.48.5s.21.5.48.5h.81v.17c0,.84-.65,1.52-1.46,1.52s-1.46-.68-1.46-1.52v-4.03c0-.84.65-1.52,1.46-1.52s1.46.68,1.46,1.52v.67c0,.28.21.5.48.5Z\" />\n    <path fill=\"#fff\" stroke-width=\"0\"\n      d=\"m3.65,22.96H1.58c-.27,0-.49-.21-.49-.48V1.52c0-.26.22-.48.49-.48h12.45c.16,0,.31.03.47.05v3.42c0,.84.71,1.52,1.58,1.52h3.55c.01.15.05.3.05.45v6.01c0,.29.24.52.54.52s.54-.23.54-.52v-6.01c0-.33-.03-.65-.08-.97,0,0,0,0,0,0,0,0,0-.02,0-.02-.45-2.77-2.72-4.97-5.6-5.4-.01,0-.02,0-.03,0,0,0,0,0,0,0-.33-.05-.66-.08-1-.08H1.58C.71,0,0,.68,0,1.52v20.96c0,.84.71,1.52,1.58,1.52h2.07c.3,0,.54-.23.54-.52s-.24-.52-.54-.52ZM15.58,1.28c1.86.52,3.31,1.92,3.85,3.71h-3.36c-.27,0-.49-.21-.49-.48V1.28Z\" />\n    <path transform=\"scale(0.4, -0.4) translate(8, -30)\" stroke=\"#fff\" fill=\"#fff\" stroke-width=\"1px\" d=\"M19.489,15.009h0c-.008,0-.014,0-.022,0a4.465,4.465,0,0,0-3.749,2.052l-7-3.5a4.482,4.482,0,0,0,0-3.1l7-3.5a4.466,4.466,0,0,0,3.771,2.053l.018,0A4.516,4.516,0,1,0,15.282,6.06L8.257,9.574a4.49,4.49,0,1,0-4.793,6.814,4.548,4.548,0,0,0,1.043.122,4.468,4.468,0,0,0,3.755-2.056l7.018,3.511a4.485,4.485,0,1,0,4.209-2.956M17.13,1.914a3.508,3.508,0,1,1,2.366,6.1h-.01l-.011,0a3.476,3.476,0,0,1-3.112-1.932l0-.006a3.525,3.525,0,0,1,.769-4.162M3.693,15.415a3.5,3.5,0,1,1,3.931-4.967v0a3.47,3.47,0,0,1,0,3.119l0,0a3.479,3.479,0,0,1-3.931,1.842m17.636,7.066a3.5,3.5,0,0,1-4.971-4.53l0,0a3.477,3.477,0,0,1,3.126-1.936l.011,0a3.5,3.5,0,0,1,1.831,6.472\" />\n  </g>\n</svg>\n",
	normalize: "<svg id=\"normalize\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"19\" height=\"24\" viewBox=\"0 0 19 24\">\n<defs>\n  <clipPath id=\"normalizeclip-path\">\n    <rect id=\"Rectangle_2772\" data-name=\"Rectangle 2772\" width=\"19\" height=\"24\" fill=\"#fff\"/>\n  </clipPath>\n</defs>\n<g id=\"Group_578\" data-name=\"Group 578\" clip-path=\"url(#normalizeclip-path)\">\n  <path id=\"Path_1510\" data-name=\"Path 1510\" d=\"M3.483,18.987a.521.521,0,0,0,.52.522H14.9a.522.522,0,0,0,0-1.044H4a.521.521,0,0,0-.52.522\" fill=\"#fff\"/>\n  <path id=\"Path_1511\" data-name=\"Path 1511\" d=\"M4,13.52h8.75a.522.522,0,0,0,0-1.043H4A.522.522,0,0,0,4,13.52\" fill=\"#fff\"/>\n  <path id=\"Path_1512\" data-name=\"Path 1512\" d=\"M4,10.526h7.448a.522.522,0,0,0,0-1.043H4a.522.522,0,0,0,0,1.043\" fill=\"#fff\"/>\n  <path id=\"Path_1513\" data-name=\"Path 1513\" d=\"M4,7.532H9.927a.522.522,0,0,0,0-1.043H4A.522.522,0,0,0,4,7.532\" fill=\"#fff\"/>\n  <path id=\"Path_1514\" data-name=\"Path 1514\" d=\"M4.005,15.471H4a.522.522,0,0,0,0,1.043l9.79.039h0a.522.522,0,0,0,0-1.043Z\" fill=\"#fff\"/>\n  <path id=\"Path_1515\" data-name=\"Path 1515\" d=\"M9.33,1.044H11.5A.522.522,0,0,0,11.5,0H9.33a.522.522,0,0,0,0,1.043\" fill=\"#fff\"/>\n  <path id=\"Path_1516\" data-name=\"Path 1516\" d=\"M13.679,1.044h2.174a.522.522,0,0,0,0-1.043H13.679a.522.522,0,0,0,0,1.043\" fill=\"#fff\"/>\n  <path id=\"Path_1517\" data-name=\"Path 1517\" d=\"M18.48,17.548a.516.516,0,0,0-.367.152c-.572-3.035-1.506-7.61-3.012-14.546a.524.524,0,0,0-.139-.256,1.432,1.432,0,0,0-.972-.437L6.806,1.044h.349A.522.522,0,0,0,7.155,0H4.981A.522.522,0,0,0,4.46.522a.426.426,0,0,0,.013.062L3.291.351A.516.516,0,0,0,2.805,0H1.765a.515.515,0,0,0-.124.025L1.515,0A1.52,1.52,0,0,0,0,1.52V22.481A1.519,1.519,0,0,0,1.515,24H18.432a.142.142,0,0,0,.022,0,.238.238,0,0,0,.026,0,.52.52,0,0,0,.52-.521V22.435a.522.522,0,0,0-.152-.369c-.047-.358-.111-.8-.2-1.329A.516.516,0,0,0,19,20.25V18.069a.519.519,0,0,0-.52-.521M1.515,22.957a.475.475,0,0,1-.474-.476V1.52a.491.491,0,0,1,.373-.486L13.89,3.495a.468.468,0,0,1,.233.061c1.449,6.682,3.613,17.143,3.823,19.4Z\" fill=\"#fff\"/>\n  <path id=\"Path_1518\" data-name=\"Path 1518\" d=\"M18.48,4.461a.52.52,0,0,0-.52.522v2.18a.52.52,0,1,0,1.04,0V4.983a.52.52,0,0,0-.52-.522\" fill=\"#fff\"/>\n  <path id=\"Path_1519\" data-name=\"Path 1519\" d=\"M18.29.366a.521.521,0,0,0-.638.824.827.827,0,0,1,.308.653V2.8A.52.52,0,1,0,19,2.8V1.843A1.877,1.877,0,0,0,18.29.366\" fill=\"#fff\"/>\n  <path id=\"Path_1520\" data-name=\"Path 1520\" d=\"M18.48,13.185a.52.52,0,0,0-.52.522v2.181a.52.52,0,1,0,1.04,0V13.707a.52.52,0,0,0-.52-.522\" fill=\"#fff\"/>\n  <path id=\"Path_1521\" data-name=\"Path 1521\" d=\"M18.48,8.823a.52.52,0,0,0-.52.522v2.181a.52.52,0,1,0,1.04,0V9.345a.52.52,0,0,0-.52-.522\" fill=\"#fff\"/>\n</g>\n</svg>\n",
	retake: "<svg id=\"re-take\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"28.761\" height=\"23\" viewBox=\"0 0 28.761 23\">\n<defs>\n<clipPath id=\"retakeclip-path\">\n  <rect id=\"Rectangle_2773\" data-name=\"Rectangle 2773\" width=\"28.761\" height=\"23\" fill=\"#fff\"/>\n</clipPath>\n</defs>\n<g id=\"Group_580\" data-name=\"Group 580\" clip-path=\"url(#retakeclip-path)\">\n<path id=\"Path_1522\" data-name=\"Path 1522\" d=\"M25.877,3.639H21.663a.7.7,0,0,1-.575-.288l-.575-.764C19.264.961,18.59,0,17.44,0H11.4C10.151,0,9.486.961,8.336,2.588l-.674.764a.7.7,0,0,1-.575.288H2.875C.476,3.639,0,5.077,0,6.227v13.9C0,22.041,1.051,23,2.974,23H25.787c1.914,0,2.974-.961,2.974-2.776v-14c-.008-1.147-.485-2.585-2.884-2.585m-.1,18.411H2.974c-1.339,0-2.013-.575-2.013-1.824v-14c0-.863.189-1.626,1.914-1.626H7.188a1.666,1.666,0,0,0,1.339-.674L9.1,3.162c1.15-1.626,1.536-2.2,2.2-2.2H17.34c.674,0,1.15.575,2.3,2.2l.575.764a1.562,1.562,0,0,0,1.339.674h4.313c1.725,0,1.914.764,1.914,1.626v14h.009c0,1.249-.673,1.824-2.012,1.824\" fill=\"#fff\"/>\n<path id=\"Path_1523\" data-name=\"Path 1523\" d=\"M15.978,9.16H9.462l1.745-1.743A.5.5,0,0,0,10.5,6.71l-2.6,2.6a.484.484,0,0,0-.108.162.5.5,0,0,0,0,.382.479.479,0,0,0,.108.163l2.6,2.6a.5.5,0,0,0,.708-.708L9.462,10.16h6.516a4.028,4.028,0,0,1,0,8.055H10.255a.5.5,0,1,0,0,1h5.723a5.028,5.028,0,0,0,0-10.055\" fill=\"#fff\"/>\n</g>\n</svg>\n",
	complete: "\n<svg id=\"continue\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\">\n<defs>\n<clipPath id=\"continueclip-path\">\n  <rect id=\"Rectangle_2774\" data-name=\"Rectangle 2774\" width=\"24\" height=\"24\" fill=\"currentColor\"/>\n</clipPath>\n</defs>\n<g id=\"Group_582\" data-name=\"Group 582\" clip-path=\"url(#continueclip-path)\">\n<path id=\"Path_1524\" data-name=\"Path 1524\" d=\"M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0m0,23A11,11,0,1,1,23,12,11.013,11.013,0,0,1,12,23\" fill=\"currentColor\"/>\n<path id=\"Path_1525\" data-name=\"Path 1525\" d=\"M19.862,12a.17.17,0,0,0,0-.024.512.512,0,0,0-.033-.168.532.532,0,0,0-.113-.17l-4.219-4.29a.5.5,0,0,0-.714,0,.51.51,0,0,0,0,.719l3.371,3.428H4.643a.509.509,0,0,0,0,1.018h13.5l-3.373,3.428a.512.512,0,0,0,0,.72.5.5,0,0,0,.714,0l4.224-4.295a.438.438,0,0,0,.056-.086.5.5,0,0,0,.051-.078A.521.521,0,0,0,19.862,12h0\" fill=\"currentColor\"/>\n</g>\n</svg>\n",
	downloadPNG: "\n<svg id=\"Layer_2\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\">\n<defs>\n<style>\n  .cls-1 {\n    fill: #fff;\n    stroke-width: 0px;\n  }\n</style>\n</defs>\n<g id=\"Layer_1-2\">\n<path class=\"cls-1\"\n  d=\"m17.05,14.93c-.27,0-.48.22-.48.5v5.95l-2.97-6.18c-.1-.21-.32-.32-.54-.26-.22.05-.37.25-.37.49v8.07c0,.28.21.5.48.5s.48-.22.48-.5v-5.95l2.97,6.18c.08.17.25.28.43.28.04,0,.07,0,.11-.01.22-.05.37-.25.37-.49v-8.07c0-.28-.21-.5-.48-.5Z\" />\n<path class=\"cls-1\"\n  d=\"m8.64,14.93h-1.94c-.27,0-.48.22-.48.5v8.07c0,.28.21.5.48.5s.48-.22.48-.5v-3.53h1.46c1.34,0,2.42-1.13,2.42-2.52s-1.09-2.52-2.42-2.52Zm0,4.03h-1.46v-3.04h1.46c.81,0,1.46.68,1.46,1.52s-.66,1.52-1.46,1.52Z\" />\n<path class=\"cls-1\"\n  d=\"m23.52,18.62c.27,0,.48-.22.48-.5v-.67c0-1.39-1.09-2.52-2.42-2.52s-2.42,1.13-2.42,2.52v4.03c0,1.39,1.09,2.52,2.42,2.52s2.42-1.13,2.42-2.52v-.67c0-.28-.21-.5-.48-.5h-1.29c-.27,0-.48.22-.48.5s.21.5.48.5h.81v.17c0,.84-.65,1.52-1.46,1.52s-1.46-.68-1.46-1.52v-4.03c0-.84.65-1.52,1.46-1.52s1.46.68,1.46,1.52v.67c0,.28.21.5.48.5Z\" />\n<path class=\"cls-1\"\n  d=\"m3.65,22.96H1.58c-.27,0-.49-.21-.49-.48V1.52c0-.26.22-.48.49-.48h12.45c.16,0,.31.03.47.05v3.42c0,.84.71,1.52,1.58,1.52h3.55c.01.15.05.3.05.45v6.01c0,.29.24.52.54.52s.54-.23.54-.52v-6.01c0-.33-.03-.65-.08-.97,0,0,0,0,0,0,0,0,0-.02,0-.02-.45-2.77-2.72-4.97-5.6-5.4-.01,0-.02,0-.03,0,0,0,0,0,0,0-.33-.05-.66-.08-1-.08H1.58C.71,0,0,.68,0,1.52v20.96c0,.84.71,1.52,1.58,1.52h2.07c.3,0,.54-.23.54-.52s-.24-.52-.54-.52ZM15.58,1.28c1.86.52,3.31,1.92,3.85,3.71h-3.36c-.27,0-.49-.21-.49-.48V1.28Z\" />\n<path class=\"cls-1\"\n  d=\"m10.32,7.11l-1.65,1.53v-4.58c0-.3-.26-.55-.59-.55s-.59.25-.59.55v4.58l-1.65-1.53c-.23-.21-.6-.21-.84,0s-.23.56,0,.78l2.66,2.47c.05.05.12.09.19.12.07.03.15.04.23.04s.15-.01.23-.04c.07-.03.14-.07.19-.12l2.66-2.47c.23-.21.23-.56,0-.78-.23-.21-.6-.21-.84,0Z\" />\n</g>\n</svg>\n"
}, W = class {
	get result() {
		if (!this.resources.result) throw Error("Captured image is missing. Please capture an image first!");
		return this.resources.result;
	}
	get originalImage() {
		let e = this.result.originalImageResult;
		if (!e) throw Error("Original image is missing from the scan result");
		return e;
	}
	constructor(e, t, n) {
		this.resources = e, this.config = t, this.scannerView = n, this.quadColor = "#fe8e14", this.config.utilizedTemplateNames = {
			detect: t.utilizedTemplateNames?.detect || O.detect,
			normalize: t.utilizedTemplateNames?.normalize || O.normalize
		};
	}
	async initialize() {
		if (!this.resources.result) throw Error("Captured image is missing. Please capture an image first!");
		if (!this.config.container) throw Error("Please create an Correction View Container element");
		P("dds-correction-view-style", be);
		let e = document.createElement("div");
		e.className = "dds-correction-view-container";
		let t = document.createElement("div");
		Object.assign(t.style, {
			width: "100%",
			height: "100%"
		}), e.appendChild(t);
		let n = j(this.config.container);
		if (n && n.appendChild(e), this.imageEditorView = await S.createInstance(t), this.imageEditorView.isUseMagnifier = !1, this.layer = this.imageEditorView.createDrawingLayer(), this.imageEditorView.setOriginalImage(this.originalImage), this.quadColor = me("correctionQuad"), this.setupDrawingLayerStyle(), this.setupInitialDetectedQuad(), this.setupCorrectionControls(), this.setupQuadConstraints(), this.resources.result._flowType === A.STATIC_FILE) {
			let e = document.querySelector("#dds-correction-retake");
			e.style.display = "none";
		}
	}
	setupDrawingLayerStyle() {
		let e = m.createDrawingStyle({
			lineWidth: 5,
			fillStyle: "transparent",
			strokeStyle: this.quadColor,
			paintMode: "stroke"
		});
		this.layer.setDefaultStyle(e);
	}
	setupQuadConstraints() {
		let e = this.layer.fabricCanvas;
		e.defaultCursor = "default", e.hoverCursor = "default", e.moveCursor = "default", e.on("object:scaling", (t) => {
			let n = t.target, r = n.points, i = this.getCanvasBounds();
			r.forEach((e) => {
				e.x = Math.max(0, Math.min(i.width, e.x)), e.y = Math.max(0, Math.min(i.height, e.y));
			}), n.set({
				points: r,
				dirty: !0
			}), e.renderAll();
		}), e.on("object:modified", (t) => {
			let n = t.target;
			if (!n) return;
			let r = n.points, i = this.getCanvasBounds(), a = !1;
			r.forEach((e) => {
				(e.x < 0 || e.x > i.width || e.y < 0 || e.y > i.height) && (a = !0);
			}), a && (r.forEach((e) => {
				e.x = Math.max(0, Math.min(i.width, e.x)), e.y = Math.max(0, Math.min(i.height, e.y));
			}), n.set({
				points: r,
				dirty: !0
			}), e.renderAll());
		});
	}
	getCanvasBounds() {
		let e = this.layer.fabricCanvas;
		return {
			width: e.getWidth(),
			height: e.getHeight()
		};
	}
	addQuadToLayer(e) {
		this.layer.clearDrawingItems();
		let t = e._getFabricObject();
		t.cornerSize = Math.min(this.originalImage.width, this.originalImage.height) * .1, t.lockMovementX = !0, t.lockMovementY = !0;
		let n = this.quadColor;
		t.cornerColor = n, t.on("mousedown", function(e) {
			e.target?.controls && (this.cornerColor = "transparent", this.dirty = !0, this.canvas?.renderAll());
		}), t.on("mouseup", function() {
			this.cornerColor = n, this.dirty = !0, this.canvas?.renderAll();
		}), this.layer.renderAll(), this.layer.addDrawingItems([e]), this.layer.fabricCanvas.setActiveObject(t), this.layer.fabricCanvas.renderAll();
	}
	setupInitialDetectedQuad() {
		let e;
		if (this.result.detectedQuadrilateral) e = new E(this.result.detectedQuadrilateral);
		else {
			let { width: t, height: n } = this.originalImage;
			e = new E({
				points: [
					{
						x: 0,
						y: 0
					},
					{
						x: t,
						y: 0
					},
					{
						x: t,
						y: n
					},
					{
						x: 0,
						y: n
					}
				],
				area: t * n
			});
		}
		this.addQuadToLayer(e);
	}
	createControls() {
		let { toolbarButtonsConfig: e } = this.config;
		return M([
			{
				id: "dds-correction-retake",
				icon: e?.retake?.icon || U.retake,
				label: e?.retake?.label || "Re-take",
				onClick: () => this.handleRetake(),
				className: `${e?.retake?.className || ""}`,
				isHidden: e?.retake?.isHidden || !1,
				isDisabled: !this.scannerView
			},
			{
				id: "dds-correction-fullImage",
				icon: e?.fullImage?.icon || U.fullImage,
				label: e?.fullImage?.label || "Full Image",
				className: `${e?.fullImage?.className || ""}`,
				isHidden: e?.fullImage?.isHidden || !1,
				onClick: () => this.setFullImageBoundary()
			},
			{
				id: "dds-correction-detectBorders",
				icon: e?.detectBorders?.icon || U.autoBounds,
				label: e?.detectBorders?.label || "Detect Borders",
				className: `${e?.detectBorders?.className || ""}`,
				isHidden: e?.detectBorders?.isHidden || !1,
				onClick: () => this.setBoundaryAutomatically()
			},
			{
				id: "dds-correction-apply",
				icon: e?.apply?.icon || (this.config?._showResultView === !1 ? U.complete : U.finish),
				label: e?.apply?.label || (this.resources.enableContinuousScanning && this.config?._showResultView === !1 ? "Keep Scan" : this.config?._showResultView === !1 ? "Done" : "Apply"),
				className: `${e?.apply?.className || ""}`,
				isHidden: e?.apply?.isHidden || !1,
				onClick: () => {
					this.resources.enableContinuousScanning && this.config?._showResultView === !1 && (this.resources.scanMoreRequested = !0), this.confirmCorrection();
				}
			}
		]);
	}
	setupCorrectionControls() {
		try {
			let e = this.createControls(), t = j(this.config.container)?.firstElementChild;
			t && t.appendChild(e);
		} catch (e) {
			throw console.error("Error setting up correction controls:", e), Error(`Failed to setup correction controls: ${e?.message || e}`);
		}
	}
	async handleRetake() {
		try {
			if (!this.scannerView) {
				console.error("Scanner View not initialized");
				return;
			}
			if (this.hideView(), this.scannerView) {
				let e = j(this.scannerView.config.container);
				e && (e.style.display = "flex");
			}
			let e = await this.scannerView.launch();
			if (e?.status?.code === k.RS_CANCELLED || e?.status?.code === k.RS_FAILED) {
				this.currentCorrectionResolver?.(e);
				return;
			}
			if (e?.status.code === k.RS_SUCCESS) {
				if (this.resources.onResultUpdated?.(e), this.scannerView?.stopCapturing(), this.scannerView) {
					let e = j(this.scannerView.config.container);
					e && (e.style.display = "none");
				}
				if (e._flowType !== void 0 && !N(e._flowType)) {
					this.currentCorrectionResolver?.(e), this.dispose();
					return;
				}
				this.dispose(!0), await this.initialize();
				let t = j(this.config.container);
				t && (t.style.display = "flex");
			}
		} catch (e) {
			throw console.error("Error in retake handler:", e), this.currentCorrectionResolver?.({ status: {
				code: k.RS_FAILED,
				message: e?.message || e
			} }), e;
		}
	}
	setFullImageBoundary() {
		if (!this.resources.result) throw Error("Captured image is missing. Please capture an image first!");
		let { width: e, height: t } = this.originalImage, n = new E({
			points: [
				{
					x: 0,
					y: 0
				},
				{
					x: e,
					y: 0
				},
				{
					x: e,
					y: t
				},
				{
					x: 0,
					y: t
				}
			],
			area: e * t
		});
		this.addQuadToLayer(n);
	}
	async setBoundaryAutomatically() {
		let { cvRouter: e } = this.resources, t = this.config.utilizedTemplateNames;
		if (!e || !t) throw Error("Correction view resources are not initialized");
		this.config.templateFilePath && await e.initSettings(this.config.templateFilePath);
		let n = await e.getSimplifiedSettings(t.detect);
		n.outputOriginalImage = !0, await e.updateSettings(t.detect, n), e.maxImageSideLength = Infinity;
		let r = (await e.capture(this.originalImage, "DetectDocumentBoundaries_Default")).items.find((e) => e.type === _.CRIT_DETECTED_QUAD)?.location;
		r ? this.addQuadToLayer(new E(r)) : this.setFullImageBoundary();
	}
	async confirmCorrection() {
		let e = this.layer.getDrawingItems()[0];
		if (!e) throw Error("No quad drawing item found");
		let t = e.getQuad(), n = await this.correctImage(t?.points);
		if (n) {
			let e = {
				...this.result,
				correctedImageResult: n,
				detectedQuadrilateral: t
			};
			this.resources.onResultUpdated?.(e), this.config?.onFinish?.(e), this.currentCorrectionResolver?.(e);
		} else this.currentCorrectionResolver?.(this.result);
		this.dispose(), this.hideView();
	}
	async launch() {
		try {
			if (!this.resources.result?.correctedImageResult) return { status: {
				code: k.RS_FAILED,
				message: "No image available for correction"
			} };
			let e = j(this.config.container);
			if (!e) throw Error("Correction view container not found");
			return e.textContent = "", await this.initialize(), e.style.display = "flex", new Promise((e) => {
				this.currentCorrectionResolver = e;
			});
		} catch (e) {
			let t = e?.message || e;
			return console.error(t), { status: {
				code: k.RS_FAILED,
				message: t
			} };
		}
	}
	hideView() {
		let e = j(this.config.container);
		e && (e.style.display = "none");
	}
	async correctImage(e) {
		let { cvRouter: t } = this.resources, n = this.config.utilizedTemplateNames;
		if (!t || !n) throw Error("Correction view resources are not initialized");
		this.config.templateFilePath && await t.initSettings(this.config.templateFilePath);
		let r = await t.getSimplifiedSettings(n.normalize);
		r.roiMeasuredInPercentage = !1, r.roi.points = e, await t.updateSettings(n.normalize, r);
		let i = await t.capture(this.originalImage, n.normalize);
		if (i?.processedDocumentResult?.deskewedImageResultItems?.[0]) return i.processedDocumentResult.deskewedImageResultItems[0];
	}
	dispose(e = !1) {
		this.imageEditorView?.dispose?.();
		let t = j(this.config?.container);
		t && (t.textContent = ""), e || (this.currentCorrectionResolver = void 0);
	}
}, be = "\n  .dds-correction-view-container {\n    display: flex;\n    width: 100%;\n    height: 100%;\n    background-color: var(--dds-bg-view, #575757);\n    font-size: 12px;\n    flex-direction: column;\n    align-items: center;\n  }\n\n  @media (orientation: landscape) and (max-width: 1024px) {\n    .dds-correction-view-container {\n      flex-direction: row;\n    }\n  }\n";
//#endregion
//#region src/views/utils/LoadingScreen.ts
function G(e, t = {}) {
	let { message: n, spinnerSize: r = 32 } = t, i = document.createElement("div");
	i.className = "dds-loading-screen";
	let a = document.createElement("div");
	a.className = "dds-loading";
	let o = document.createElement("div");
	if (o.className = "dds-loading-content", o.innerHTML = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="${r}"
      height="${r}"
      stroke-width="0.75"
    >
      <path d="M12 3a9 9 0 1 0 9 9"></path>
    </svg>
  `, n) {
		let e = document.createElement("div");
		e.className = "dds-loading-message", e.textContent = n, o.appendChild(e);
	}
	return a.appendChild(o), i.appendChild(a), e.appendChild(i), {
		element: i,
		updateMessage: (e) => {
			let t = a.querySelector(".dds-loading-message");
			if (e === null) {
				t?.remove();
				return;
			}
			t ? t.textContent = e : (t = document.createElement("div"), t.className = "dds-loading-message", t.textContent = e, o.appendChild(t));
		},
		hide: () => {
			i?.parentNode && (i.classList.add("fade-out"), setTimeout(() => {
				i.parentNode?.removeChild(i);
			}, 200));
		}
	};
}
var K = "\n  .dds-loading-screen {\n    position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    background-color: var(--dds-bg-toolbar, #323234);\n    z-index: 998;\n    opacity: 1;\n    transition: opacity 0.2s ease-out;\n  }\n\n  .dds-loading-screen.fade-out {\n    opacity: 0;\n  }\n\n  .dds-loading {\n    position: absolute;\n    left: 50%;\n    top: 50%;\n    color: white;\n    z-index: 999;\n    transform: translate(-50%, -50%);\n  }\n\n  .dds-loading-content {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 16px;\n  }\n\n  .dds-loading svg {\n    animation: spin 1s linear infinite;\n  }\n\n  .dds-loading-message {\n    color: white;\n    font-family: Verdana, Geneva, Tahoma, sans-serif;\n    font-size: 14px;\n    text-align: center;\n    max-width: 200px;\n    line-height: 1.4;\n    opacity: 0.9;\n  }\n\n  @keyframes spin {\n    from {\n      transform: rotate(0deg);\n    }\n    to {\n      transform: rotate(360deg);\n    }\n  }\n", xe = 2, q = class {
	showScannerLoadingOverlay(e) {
		let t = j(this.config.container);
		t && (this.loadingScreen = G(t, { message: e }), t.style.display = "block", t.style.position = "relative");
	}
	hideScannerLoadingOverlay(e = !1) {
		if (this.loadingScreen?.hide(), e) {
			let e = j(this.config.container);
			e && (e.style.display = "none");
		}
	}
	getMinVerifiedFramesForAutoCapture() {
		return !this.config?.minVerifiedFramesForAutoCapture || this.config?.minVerifiedFramesForAutoCapture <= 0 || this.config?.minVerifiedFramesForAutoCapture > 5 ? xe : this.config?.minVerifiedFramesForAutoCapture;
	}
	get cvRouter() {
		if (!this.resources.cvRouter) throw Error("Capture Vision Router is not initialized");
		return this.resources.cvRouter;
	}
	get cameraView() {
		if (!this.resources.cameraView) throw Error("Camera View is not initialized");
		return this.resources.cameraView;
	}
	get cameraEnhancer() {
		if (!this.resources.cameraEnhancer) throw Error("Camera Enhancer is not initialized");
		return this.resources.cameraEnhancer;
	}
	get templateNames() {
		return this.config.utilizedTemplateNames ?? O;
	}
	constructor(e, t) {
		this.resources = e, this.config = t, this.boundsDetectionEnabled = !0, this.smartCaptureEnabled = !1, this.autoCropEnabled = !1, this.isCapturing = !1, this.isClosing = !1, this.resizeTimer = null, this.crossVerificationCount = 0, this.lastCaptureTimestamp = 0, this.CONTINUOUS_SCAN_COOLDOWN_MS = 2e3, this.frameVerificationEnabled = !0, this.currentFrameId = 0, this.maxClarity = 0, this.maxClarityTimestamp = 0, this.maxClarityImg = null, this.maxClarityFrameId = 0, this.nonImprovingClarityFrameCount = 0, this.clearestFrameId = 0, this.clarityHistory = [], this.capturedResultItems = [], this.originalImageData = null, this.initialized = !1, this.initializedDCE = !1, this.DCE_ELEMENTS = {
			selectCameraBtn: null,
			uploadImageBtn: null,
			closeScannerBtn: null,
			takePhotoBtn: null,
			boundsDetectionBtn: null,
			smartCaptureBtn: null,
			autoCropBtn: null,
			continuousScanDoneBtn: null,
			thumbnailPreview: null,
			thumbnailImg: null,
			floatingImage: null,
			floatingImageImg: null
		}, this.loadingScreen = null, this.toastObserver = null, this.handleResize = () => {
			this.toggleScanGuide(!1), this.resizeTimer && window.clearTimeout(this.resizeTimer), this.resizeTimer = window.setTimeout(() => {
				this.toggleScanGuide(!0);
			}, 500);
		}, this.config.utilizedTemplateNames = {
			detect: t.utilizedTemplateNames?.detect || O.detect,
			normalize: t.utilizedTemplateNames?.normalize || O.normalize
		};
	}
	async initialize() {
		if (!this.initialized) {
			this.boundsDetectionEnabled = this.config?.enableBoundsDetectionMode ?? this.config?.enableSmartCaptureMode ?? this.config?.enableAutoCropMode ?? !0, this.smartCaptureEnabled = (this.config?.enableSmartCaptureMode || this.config?.enableAutoCropMode) ?? !1, this.autoCropEnabled = this.config?.enableAutoCropMode ?? !1, this.frameVerificationEnabled = this.config?.enableFrameVerification ?? !0, this.config.minVerifiedFramesForAutoCapture = this.getMinVerifiedFramesForAutoCapture(), P("dds-loading-screen-style", K);
			try {
				let e = this.cameraView, t = this.cameraEnhancer, n = this.cvRouter;
				e.setScanRegionMaskStyle({
					...e.getScanRegionMaskStyle(),
					lineWidth: this.config?.scanRegion?.style?.strokeWidth ?? 2,
					strokeStyle: this.config?.scanRegion?.style?.strokeColor ?? "transparent"
				}), e.setVideoFit("cover"), n.setInput(t);
				let r = new ie();
				r.enableResultCrossVerification(_.CRIT_DETECTED_QUAD, !0), r.enableResultDeduplication(_.CRIT_DETECTED_QUAD, !0), await n.addResultFilter(r), this.config.templateFilePath && await n.initSettings(this.config.templateFilePath);
				let i = await n.getSimplifiedSettings(this.templateNames.detect);
				i.outputOriginalImage = !0, i.documentSettings.scaleDownThreshold = 1e3, await n.updateSettings(this.templateNames.detect, i), n.maxImageSideLength = Infinity;
				let a = new u();
				a.onCapturedResultReceived = (e) => this.handleBoundsDetection(e), await n.addResultReceiver(a), this.initialized = !0;
			} catch (e) {
				let t = e?.message || e;
				console.error(t), alert(t), this.closeCamera();
				let n = { status: {
					code: k.RS_FAILED,
					message: "DDS Init error"
				} };
				this.currentScanResolver?.(n);
			}
		}
	}
	async initializeElements() {
		let e = j(this.config.container);
		if (!e) throw Error("Scanner container not found");
		let t = e.children[e.children.length - 1];
		if (!t?.shadowRoot) throw Error("Shadow root not found");
		this.DCE_ELEMENTS = {
			selectCameraBtn: t.shadowRoot.querySelector(".dce-mn-select-camera-icon"),
			uploadImageBtn: t.shadowRoot.querySelector(".dce-mn-upload-image-icon"),
			closeScannerBtn: t.shadowRoot.querySelector(".dce-mn-close"),
			takePhotoBtn: t.shadowRoot.querySelector(".dce-mn-take-photo"),
			boundsDetectionBtn: t.shadowRoot.querySelector(".dce-mn-bounds-detection"),
			smartCaptureBtn: t.shadowRoot.querySelector(".dce-mn-smart-capture"),
			autoCropBtn: t.shadowRoot.querySelector(".dce-mn-auto-crop"),
			continuousScanDoneBtn: t.shadowRoot.querySelector(".dce-mn-continuous-scan-done-btn"),
			thumbnailPreview: t.shadowRoot.querySelector(".dce-mn-thumbnail-preview"),
			thumbnailImg: t.shadowRoot.querySelector(".dce-mn-thumbnail-img"),
			floatingImage: t.shadowRoot.querySelector(".dce-mn-floating-image"),
			floatingImageImg: t.shadowRoot.querySelector(".dce-mn-floating-image-img")
		}, this.applyDCEStringOverrides(t.shadowRoot), this.assignDCEClickEvents(), this.setupSmartToastFilter(t.shadowRoot);
		try {
			if (!this.resources.cameraEnhancer?.getCapabilities?.()?.torch) {
				let e = t.shadowRoot.querySelector(".dce-mn-torch");
				e && (e.style.display = "none");
			}
		} catch (e) {
			console.warn("Error checking torch capabilities:", e);
		}
		if (this.config._showCorrectionView === !1 && this.DCE_ELEMENTS.smartCaptureBtn && (this.DCE_ELEMENTS.smartCaptureBtn.style.display = "none"), this.config?.showSubfooter === !1) {
			let e = t.shadowRoot.querySelector(".dce-subfooter");
			e.style.display = "none";
		}
		if (this.config?.showPoweredByDynamsoft === !1) {
			let e = t.shadowRoot.querySelector(".dce-mn-msg-poweredby");
			e.style.display = "none";
		}
		this.resources.onThumbnailClicked && this.DCE_ELEMENTS.thumbnailPreview && (this.DCE_ELEMENTS.thumbnailPreview.style.border = "2px solid rgba(255, 255, 255, 0.4)", this.DCE_ELEMENTS.thumbnailPreview.style.cursor = "pointer"), this.initializedDCE = !0;
	}
	applyDCEStringOverrides(e) {
		let t = (t, n) => {
			if (!H(n)) return;
			let r = e.querySelector(t);
			r && (r.title = V(n));
		}, n = (t, n) => {
			if (!H(n)) return;
			let r = e.querySelector(t);
			r && (r.textContent = V(n));
		};
		t(".dce-mn-select-camera-icon", "selectCameraBtnTitle"), t(".dce-mn-upload-image-icon", "uploadImageBtnTitle"), t(".dce-mn-close", "closeScannerBtnTitle"), t(".dce-mn-take-photo", "takePhotoBtnTitle"), n(".dce-mn-camera-container > div:first-child", "cameraSwitcherCameraLabel"), n(".dce-mn-resolutions > div:first-child", "cameraSwitcherResolutionLabel");
	}
	assignDCEClickEvents() {
		let { selectCameraBtn: e, uploadImageBtn: t, closeScannerBtn: n, takePhotoBtn: r, boundsDetectionBtn: i, smartCaptureBtn: a, autoCropBtn: o } = this.DCE_ELEMENTS;
		if (!e || !t || !n || !r || !i || !a || !o) throw Error("Camera control elements not found");
		this.takePhoto = this.takePhoto.bind(this), this.toggleBoundsDetection = this.toggleBoundsDetection.bind(this), this.toggleSmartCapture = this.toggleSmartCapture.bind(this), this.toggleAutoCrop = this.toggleAutoCrop.bind(this), this.closeCamera = this.closeCamera.bind(this), r.onclick = this.takePhoto, i.onclick = async () => {
			await this.toggleBoundsDetection();
		}, a.onclick = async () => {
			await this.toggleSmartCapture();
		}, o.onclick = async () => {
			await this.toggleAutoCrop();
		}, n.onclick = async () => {
			await this.handleCloseBtn();
		}, e.onclick = (e) => {
			e.stopPropagation(), this.toggleSelectCameraBox();
		}, t.onclick = () => {
			this.uploadImage();
		}, this.DCE_ELEMENTS.continuousScanDoneBtn && (this.DCE_ELEMENTS.continuousScanDoneBtn.onclick = () => {
			this.handleContinuousScanDone();
		}), this.DCE_ELEMENTS.thumbnailPreview?.addEventListener("touchstart", (e) => {
			e.preventDefault();
		}, { passive: !1 }), this.DCE_ELEMENTS.thumbnailPreview?.addEventListener("touchend", (e) => {
			e.preventDefault();
		}, { passive: !1 }), this.DCE_ELEMENTS.thumbnailPreview?.addEventListener("dblclick", (e) => {
			e.preventDefault();
		}), this.DCE_ELEMENTS.thumbnailPreview?.addEventListener("click", async (e) => {
			e.preventDefault(), this.resources.onThumbnailClicked && this.resources.result && await this.resources.onThumbnailClicked(this.resources.result);
		});
		let s = j(this.config.container), c = (s ? s.children[s.children.length - 1] : void 0)?.shadowRoot?.querySelector(".dce-mn-torch");
		c && (c.addEventListener("touchstart", (e) => {
			e.preventDefault();
		}, { passive: !1 }), c.addEventListener("touchend", (e) => {
			e.preventDefault();
		}, { passive: !1 }), c.addEventListener("dblclick", (e) => {
			e.preventDefault();
		}));
	}
	handleContinuousScanDone() {
		this.isCapturing || this.isClosing || (this.isClosing = !0, this.closeCamera(), this.currentScanResolver?.({ status: {
			code: k.RS_CANCELLED,
			message: "Continuous scanning stopped by user"
		} }));
	}
	updateContinuousScanDoneButton() {
		if (!this.DCE_ELEMENTS.continuousScanDoneBtn) return;
		(this.resources.completedScansCount ?? 0) > 0 ? this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "block" : this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "none";
		let e = this.DCE_ELEMENTS.continuousScanDoneBtn?.querySelector(".dce-mn-continuous-scan-done-text");
		e && (e.textContent = V("continuousScanDoneBtn").replace("{count}", String(this.resources.completedScansCount ?? 0)));
	}
	updateThumbnail(e) {
		if (!this.DCE_ELEMENTS.thumbnailPreview || !this.DCE_ELEMENTS.thumbnailImg || !this.resources.enableContinuousScanning) return;
		let t = e.toDataURL("image/jpeg", .8);
		this.DCE_ELEMENTS.thumbnailImg.src = t, this.DCE_ELEMENTS.thumbnailPreview.style.display = "block";
	}
	isIOS() {
		return /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
	}
	setupSmartToastFilter(e) {
		let t = e.querySelector(".dce-mn-toast");
		if (!t) return;
		let n = () => {
			let e = t.textContent?.trim() || "";
			if (e === "Torch Not Supported") {
				let { cameraEnhancer: e } = this.resources;
				if (e?.isOpen()) try {
					if (e.getCapabilities?.()?.torch) {
						t.style.display = "none";
						return;
					}
				} catch (e) {
					console.warn("Error checking torch capabilities:", e);
				}
			}
			e ? t.style.display = "" : t.style.display = "none";
		};
		this.toastObserver = new MutationObserver(() => {
			n();
		}), this.toastObserver.observe(t, {
			childList: !0,
			characterData: !0,
			subtree: !0
		}), n();
	}
	async animateFloatingImage(e) {
		return new Promise((t) => {
			if (!this.DCE_ELEMENTS.floatingImage || !this.DCE_ELEMENTS.floatingImageImg || !this.DCE_ELEMENTS.thumbnailPreview || !this.DCE_ELEMENTS.thumbnailImg) {
				t();
				return;
			}
			let n = e.toDataURL("image/jpeg", .9);
			this.DCE_ELEMENTS.floatingImageImg.src = n, this.DCE_ELEMENTS.thumbnailImg.style.opacity = "0", this.DCE_ELEMENTS.floatingImage.style.display = "block", this.DCE_ELEMENTS.floatingImage.classList.remove("animating"), requestAnimationFrame(() => {
				if (!this.DCE_ELEMENTS.floatingImage || !this.DCE_ELEMENTS.thumbnailPreview) {
					t();
					return;
				}
				let e = this.DCE_ELEMENTS.floatingImage.getBoundingClientRect(), n = this.DCE_ELEMENTS.thumbnailPreview.getBoundingClientRect(), r = e.left + e.width / 2, i = e.top + e.height / 2, a = n.left + n.width / 2, o = n.top + n.height / 2, s = a - r, c = o - i, l = Math.min(n.width / e.width, n.height / e.height);
				this.DCE_ELEMENTS.floatingImage.style.setProperty("--translate-x", `${s}px`), this.DCE_ELEMENTS.floatingImage.style.setProperty("--translate-y", `${c}px`), this.DCE_ELEMENTS.floatingImage.style.setProperty("--scale", `${l}`), this.DCE_ELEMENTS.floatingImage.offsetWidth, this.DCE_ELEMENTS.floatingImage.classList.add("animating"), setTimeout(() => {
					this.DCE_ELEMENTS.floatingImage && (this.DCE_ELEMENTS.floatingImage.style.display = "none", this.DCE_ELEMENTS.floatingImage.classList.remove("animating")), this.DCE_ELEMENTS.thumbnailImg && (this.DCE_ELEMENTS.thumbnailImg.style.opacity = "1"), t();
				}, 500);
			});
		});
	}
	async handleCloseBtn() {
		if (this.isCapturing) {
			console.warn("Cannot close during image capture");
			return;
		}
		this.closeCamera(), this.currentScanResolver?.({ status: {
			code: k.RS_CANCELLED,
			message: "Cancelled"
		} });
	}
	attachOptionClickListeners() {
		let e = j(this.config.container);
		if (!e) return;
		let t = e.children[e.children.length - 1];
		if (!t?.shadowRoot) return;
		let n = t.shadowRoot.querySelector(".dce-mn-camera-and-resolution-settings"), r = t.shadowRoot.querySelectorAll(".dce-mn-camera-option"), i = t.shadowRoot.querySelectorAll(".dce-mn-resolution-option");
		[...r, ...i].forEach((e) => {
			e.onclick = () => {
				let t = e.getAttribute("data-device-id"), r = e.getAttribute("data-height"), i = e.getAttribute("data-width");
				if (t) this.resources.cameraEnhancer?.selectCamera(t).catch((e) => console.warn(`Camera error (selectCamera ${t}):`, e)).finally(() => this.toggleScanGuide(!0));
				else if (r && i) {
					let e = parseInt(i), t = parseInt(r);
					this.resources.cameraEnhancer?.setScanRegion({
						left: 0,
						right: 100,
						top: 0,
						bottom: 100,
						isMeasuredInPercentage: !0
					}), this.resources.cameraEnhancer?.setResolution({
						width: e,
						height: t
					}).catch((n) => console.warn(`Camera error (setResolution ${e}x${t}):`, n)).finally(() => this.toggleScanGuide(!0));
				}
				n.style.display !== "none" && this.toggleSelectCameraBox();
			};
		});
	}
	highlightCameraAndResolutionOption() {
		let e = j(this.config.container);
		if (!e) return;
		let t = e.children[e.children.length - 1];
		if (!t?.shadowRoot) return;
		let n = t.shadowRoot.querySelector(".dce-mn-camera-and-resolution-settings"), r = n.querySelectorAll(".dce-mn-camera-option"), i = n.querySelectorAll(".dce-mn-resolution-option"), a = this.resources.cameraEnhancer?.getSelectedCamera(), o = this.resources.cameraEnhancer?.getResolution();
		r.forEach((e) => {
			let t = e;
			t.getAttribute("data-device-id") === a?.deviceId ? t.style.border = "2px solid var(--dds-primary, #fe814a)" : t.style.border = "none";
		});
		let s = {
			"480p": "480",
			"720p": "720",
			"1080p": "1080",
			"2k": "1440",
			"4k": "2160"
		}, c = o ? ye(o) : "";
		i.forEach((e) => {
			let t = e;
			t.getAttribute("data-height") === s[c] ? t.style.border = "2px solid var(--dds-primary, #fe814a)" : t.style.border = "none";
		});
	}
	toggleSelectCameraBox() {
		let e = j(this.config.container);
		if (!e) return;
		let t = e.children[e.children.length - 1];
		if (!t?.shadowRoot) return;
		let n = t.shadowRoot.querySelector(".dce-mn-resolution-box");
		this.highlightCameraAndResolutionOption(), this.attachOptionClickListeners(), n.click(), this.toggleScanGuide(!0);
	}
	async uploadImage() {
		let e = document.createElement("input");
		e.type = "file", e.accept = "image/png,image/jpeg", e.style.display = "none", document.body.appendChild(e);
		try {
			this.showScannerLoadingOverlay(V("processingImageMsg"));
			let t = await new Promise((t, n) => {
				e.onchange = (e) => {
					let r = e.target.files?.[0];
					if (!r?.type.startsWith("image/")) {
						n(/* @__PURE__ */ Error("Please select an image file"));
						return;
					}
					t(r);
				}, e.addEventListener("cancel", () => this.hideScannerLoadingOverlay(!1)), e.click();
			});
			if (!t) {
				this.hideScannerLoadingOverlay(!1);
				return;
			}
			this.resources.enableContinuousScanning ? this.cvRouter.stopCapturing() : this.closeCamera(!1);
			let { blob: n } = await this.fileToBlob(t);
			this.capturedResultItems = (await this.cvRouter.capture(n, this.templateNames.detect)).items, this.originalImageData = this.capturedResultItems[0]?.imageData;
			let r;
			if (this.capturedResultItems?.length <= 1) {
				this.capturedResultItems = [];
				let { width: e, height: t } = this.originalImageData;
				r = {
					points: [
						{
							x: 0,
							y: 0
						},
						{
							x: e,
							y: 0
						},
						{
							x: e,
							y: t
						},
						{
							x: 0,
							y: t
						}
					],
					area: t * e
				};
			} else r = this.capturedResultItems.find((e) => e.type === _.CRIT_DETECTED_QUAD)?.location;
			let i = await this.normalizeImage(r.points, this.originalImageData), a = {
				status: {
					code: k.RS_SUCCESS,
					message: "Success"
				},
				originalImageResult: this.originalImageData,
				correctedImageResult: i,
				detectedQuadrilateral: r,
				_flowType: A.UPLOADED_IMAGE
			};
			if (this.resources.onResultUpdated?.(a), this.resources.enableContinuousScanning) {
				if (!this.config._showCorrectionView && !this.config._showResultView) {
					let e = i.toCanvas();
					this.updateThumbnail(e), await this.animateFloatingImage(e), await this.cvRouter.startCapturing(this.templateNames.detect);
				}
				this.hideScannerLoadingOverlay(!1);
			} else this.hideScannerLoadingOverlay(!0);
			this.currentScanResolver?.(a);
		} catch (e) {
			let t = e?.message || e;
			console.error(t), alert(t), this.closeCamera();
			let n = { status: {
				code: k.RS_FAILED,
				message: "Error processing uploaded image"
			} };
			this.currentScanResolver?.(n);
		} finally {
			document.body.removeChild(e);
		}
	}
	async fileToBlob(e) {
		return new Promise((t, n) => {
			let r = new Image();
			r.onload = () => {
				let i = document.createElement("canvas");
				i.width = r.width, i.height = r.height, i.getContext("2d")?.drawImage(r, 0, 0), i.toBlob((e) => {
					e ? t({
						blob: e,
						width: r.width,
						height: r.height
					}) : n(/* @__PURE__ */ Error("Failed to create blob"));
				}, e.type);
			}, r.onerror = n, r.src = URL.createObjectURL(e);
		});
	}
	async toggleBoundsDetection(e) {
		let t = j(this.config.container);
		if (!t) return;
		let n = t.children[t.children.length - 1];
		if (!n?.shadowRoot) return;
		let r = n.shadowRoot.querySelector(".dce-mn-bounds-detection"), i = n.shadowRoot.querySelector(".dce-mn-bounds-detection-on"), a = n.shadowRoot.querySelector(".dce-mn-bounds-detection-off");
		if (!i || !a) return;
		let o = e === void 0 ? !this.boundsDetectionEnabled : e;
		o || (await this.toggleSmartCapture(!1), this.config._showCorrectionView === !1 && await this.toggleAutoCrop(!1));
		let s = this.cvRouter;
		this.boundsDetectionEnabled = o, r.style.color = this.boundsDetectionEnabled ? "var(--dds-primary, #fe814a)" : "var(--dds-toolbar-btn-inactive, #fff)", a.style.display = this.boundsDetectionEnabled ? "none" : "block", i.style.display = this.boundsDetectionEnabled ? "block" : "none", this.initialized && this.boundsDetectionEnabled ? (await s.startCapturing(this.templateNames.detect), this.toggleScanGuide(!0)) : this.initialized && !this.boundsDetectionEnabled && this.stopCapturing();
	}
	async toggleSmartCapture(e) {
		let t = j(this.config.container);
		if (!t) return;
		let n = t.children[t.children.length - 1];
		if (!n?.shadowRoot) return;
		let r = n.shadowRoot.querySelector(".dce-mn-smart-capture"), i = n.shadowRoot.querySelector(".dce-mn-smart-capture-on"), a = n.shadowRoot.querySelector(".dce-mn-smart-capture-off");
		if (!i || !a) return;
		let o = e === void 0 ? !this.smartCaptureEnabled : e;
		o && !this.boundsDetectionEnabled ? await this.toggleBoundsDetection(!0) : !o && this.config._showCorrectionView !== !1 && await this.toggleAutoCrop(!1), this.smartCaptureEnabled = o, r.style.color = this.smartCaptureEnabled ? "var(--dds-primary, #fe814a)" : "var(--dds-toolbar-btn-inactive, #fff)", a.style.display = this.smartCaptureEnabled ? "none" : "block", i.style.display = this.smartCaptureEnabled ? "block" : "none", this.crossVerificationCount = 0;
	}
	async toggleAutoCrop(e) {
		let t = j(this.config.container);
		if (!t) return;
		let n = t.children[t.children.length - 1];
		if (!n?.shadowRoot) return;
		let r = n.shadowRoot.querySelector(".dce-mn-auto-crop"), i = n.shadowRoot.querySelector(".dce-mn-auto-crop-on"), a = n.shadowRoot.querySelector(".dce-mn-auto-crop-off");
		if (!i || !a) return;
		let o = e === void 0 ? !this.autoCropEnabled : e;
		o && (!this.boundsDetectionEnabled || !this.smartCaptureEnabled) && (await this.toggleBoundsDetection(!0), await this.toggleSmartCapture(!0)), !o && this.config._showCorrectionView === !1 && await this.toggleSmartCapture(!1), this.autoCropEnabled = o, r.style.color = this.autoCropEnabled ? "var(--dds-primary, #fe814a)" : "var(--dds-toolbar-btn-inactive, #fff)", a.style.display = this.autoCropEnabled ? "none" : "block", i.style.display = this.autoCropEnabled ? "block" : "none";
	}
	toggleScanGuide(e) {
		e && this.calculateScanRegion();
	}
	calculateScanRegion(e = 0) {
		let { cameraEnhancer: t, cameraView: n } = this.resources;
		if (!n) return;
		let r = n.getVideoElement();
		if (!(t?.isOpen() && r?.readyState >= 2 && r.videoWidth > 0 && r.videoHeight > 0) || !t) {
			e < 60 && requestAnimationFrame(() => this.calculateScanRegion(e + 1));
			return;
		}
		let i = r.videoWidth, a = r.videoHeight, o = n.getVisibleRegionOfVideo({ inPixels: !0 });
		if (!o) return;
		let s = this.config?.scanRegion?.ratio;
		if (!s) {
			t.setScanRegion(null), n.setScanRegionMaskVisible(!1);
			return;
		}
		let c, l = this.config?.scanRegion?.regionBottomMargin ?? 0, u = o.height - l;
		o.width > o.height ? (c = u * .75 / s.height, c * s.width > o.width * .9 && (c = o.width * .9 / s.width)) : (c = o.width * .9 / s.width, c * s.height > u * .75 && (c = u * .75 / s.height));
		let d = c * s.width, f = c * s.height, p = (o.width - d) / 2, m = (u - f) / 2, h = p, g = p + d, _ = m, v = m + f, y = o.x + h, b = o.x + g, x = o.y + _, S = o.y + v, C = (e) => Math.min(100, Math.max(0, Math.round(e))), w = {
			left: C(y / i * 100),
			right: C(b / i * 100),
			top: C(x / a * 100),
			bottom: C(S / a * 100),
			isMeasuredInPercentage: !0
		};
		w.left >= w.right || w.top >= w.bottom || (n?.setScanRegionMaskVisible(!0), t.setScanRegion(w));
	}
	async openCamera() {
		try {
			let e = this.cameraEnhancer, t = this.cameraView, n = j(this.config.container);
			if (!n) throw Error("Scanner container not found");
			if (this.resources.enableContinuousScanning && e?.isOpen()) {
				n.style.display = "block", this.DCE_ELEMENTS.continuousScanDoneBtn && ((this.resources.completedScansCount ?? 0) > 0 ? (this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "block", this.updateContinuousScanDoneButton()) : this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "none"), this.resources.cvRouter._isPauseScan && await this.cvRouter.startCapturing(this.templateNames.detect);
				return;
			}
			if (this.showScannerLoadingOverlay(V("initializingCameraMsg")), n.style.display = "block", !e?.isOpen()) {
				let r = t.getUIElement();
				r.parentElement || n.append(r);
				try {
					await e.open();
				} catch (e) {
					let t = e?.message || e;
					throw t.includes("in use") || t.includes("not available") ? Error("Camera is already in use by another tab or application. Please close other tabs/applications using the camera and try again.") : e;
				}
			} else if (e?.isPaused()) try {
				await e.resume();
			} catch (e) {
				console.warn("Camera error (openCamera - resume after pause):", e);
			}
			if (e?.isOpen()) try {
				await e.setResolution({
					width: 2560,
					height: 1440
				});
			} catch (e) {
				console.warn("Camera error (openCamera - setResolution):", e);
			}
			!this.initializedDCE && e?.isOpen() && await this.initializeElements(), window.addEventListener("resize", this.handleResize), await this.toggleBoundsDetection(this.boundsDetectionEnabled), await this.toggleSmartCapture(this.smartCaptureEnabled), await this.toggleAutoCrop(this.autoCropEnabled), this.toggleScanGuide(!0), this.DCE_ELEMENTS.continuousScanDoneBtn && (this.resources.enableContinuousScanning && (this.resources.completedScansCount ?? 0) > 0 ? (this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "block", this.updateContinuousScanDoneButton()) : this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "none");
		} catch (e) {
			let t = e?.message || e;
			console.error(t), alert(t), this.closeCamera();
			let n = { status: {
				code: k.RS_FAILED,
				message: "DDS Open Camera Error"
			} };
			this.currentScanResolver?.(n);
		} finally {
			this.hideScannerLoadingOverlay();
		}
	}
	closeCamera(e = !0) {
		window.removeEventListener("resize", this.handleResize), this.resizeTimer && window.clearTimeout(this.resizeTimer), this.toastObserver?.disconnect();
		let { cameraEnhancer: t, cameraView: n } = this.resources, r = j(this.config.container);
		r && (r.style.display = e ? "none" : "block", n && n.getUIElement().parentElement && r.removeChild(n.getUIElement()));
		try {
			t?.close();
		} catch (e) {
			console.warn("Camera error (closeCamera):", e);
		}
		this.stopCapturing(), this.isClosing = !1;
	}
	pauseCamera() {
		let { cameraEnhancer: e } = this.resources;
		try {
			e?.pause();
		} catch (e) {
			console.warn("Camera error (pauseCamera):", e);
		}
	}
	stopCapturing() {
		let { cameraView: e, cvRouter: t } = this.resources;
		t?.stopCapturing(), e?.clearAllInnerDrawingItems();
	}
	getFlowType() {
		return this.autoCropEnabled ? A.AUTO_CROP : this.smartCaptureEnabled ? A.SMART_CAPTURE : A.MANUAL;
	}
	trackFrameClarity(e) {
		++this.currentFrameId;
		let t = e._clarity;
		if (!t) return;
		let n = Date.now();
		this.maxClarityTimestamp < n - 3e3 && (this.maxClarity = 0), t > this.maxClarity && (this.maxClarity = t, this.maxClarityTimestamp = n, this.maxClarityImg = this.originalImageData, this.maxClarityFrameId = this.currentFrameId, this.nonImprovingClarityFrameCount = 0), t <= this.clarityHistory[this.clarityHistory.length - 1] ? ++this.nonImprovingClarityFrameCount : this.nonImprovingClarityFrameCount = 0, this.clearestFrameId != this.maxClarityFrameId && this.maxClarityTimestamp + 1e3 <= n && this.nonImprovingClarityFrameCount >= 2 && (this.clearestFrameId = this.maxClarityFrameId), this.clarityHistory.push(t), this.clarityHistory.length > 50 && this.clarityHistory.shift();
	}
	async takePhoto() {
		if (!this.isCapturing) {
			this.isCapturing = !0;
			try {
				let { cameraEnhancer: e, onResultUpdated: t } = this.resources, n = !this.boundsDetectionEnabled || this.boundsDetectionEnabled && this.capturedResultItems?.length <= 1;
				if (this.frameVerificationEnabled && this.maxClarityImg && !n ? this.originalImageData = this.maxClarityImg : this.originalImageData = n ? e?.fetchImage() ?? null : this.originalImageData, !this.originalImageData) throw Error("Failed to capture image frame");
				let r = this.originalImageData, i = null, a;
				if (n) {
					this.capturedResultItems = [];
					let { width: e, height: t } = r;
					a = {
						points: [
							{
								x: 0,
								y: 0
							},
							{
								x: e,
								y: 0
							},
							{
								x: e,
								y: t
							},
							{
								x: 0,
								y: t
							}
						],
						area: t * e
					};
				} else a = this.capturedResultItems.find((e) => e.type === _.CRIT_DETECTED_QUAD)?.location;
				n || (a.points = a.points.map((e) => this.resources.cameraEnhancer?.convertToScanRegionCoordinates(e) || e));
				let o = this.getFlowType();
				if (this.resources.enableContinuousScanning ? (this.DCE_ELEMENTS.takePhotoBtn && (this.DCE_ELEMENTS.takePhotoBtn.style.pointerEvents = "none", this.DCE_ELEMENTS.takePhotoBtn.style.opacity = "0.5"), this.DCE_ELEMENTS.continuousScanDoneBtn && (this.DCE_ELEMENTS.continuousScanDoneBtn.style.pointerEvents = "none", this.DCE_ELEMENTS.continuousScanDoneBtn.style.opacity = "0.5")) : this.showScannerLoadingOverlay(V("processingImageMsg")), this.resources.enableContinuousScanning && this.resources.cameraEnhancer?.pause(), i = await this.normalizeImage(a.points, r), this.resources.enableContinuousScanning && await this.resources.cameraEnhancer?.resume(), !this.resources.enableContinuousScanning) {
					let e = this.smartCaptureEnabled, t = this.autoCropEnabled;
					await this.toggleSmartCapture(!1), this.closeCamera(), this.smartCaptureEnabled = e, this.autoCropEnabled = t;
				}
				this.resources.enableContinuousScanning ? (this.DCE_ELEMENTS.takePhotoBtn && (this.DCE_ELEMENTS.takePhotoBtn.style.pointerEvents = "auto", this.DCE_ELEMENTS.takePhotoBtn.style.opacity = "1"), this.DCE_ELEMENTS.continuousScanDoneBtn && (this.DCE_ELEMENTS.continuousScanDoneBtn.style.pointerEvents = "auto", this.DCE_ELEMENTS.continuousScanDoneBtn.style.opacity = "1")) : this.hideScannerLoadingOverlay(!0);
				let s = {
					status: {
						code: k.RS_SUCCESS,
						message: "Success"
					},
					originalImageResult: r,
					correctedImageResult: i,
					detectedQuadrilateral: a,
					_flowType: o
				};
				if (this.resources.enableContinuousScanning && !this.config._showCorrectionView && !this.config._showResultView) {
					let e = i.toCanvas();
					this.updateThumbnail(e), this.resources.cameraEnhancer?.pause(), await this.animateFloatingImage(e), await this.resources.cameraEnhancer?.resume();
				}
				t?.(s), this.currentScanResolver?.(s);
			} catch (e) {
				let t = e?.message || e;
				if (console.error(t), alert(t), this.resources.enableContinuousScanning) {
					if (this.DCE_ELEMENTS.takePhotoBtn && (this.DCE_ELEMENTS.takePhotoBtn.style.pointerEvents = "auto", this.DCE_ELEMENTS.takePhotoBtn.style.opacity = "1"), this.DCE_ELEMENTS.continuousScanDoneBtn && (this.DCE_ELEMENTS.continuousScanDoneBtn.style.pointerEvents = "auto", this.DCE_ELEMENTS.continuousScanDoneBtn.style.opacity = "1"), this.resources.cameraEnhancer?.isPaused()) try {
						await this.resources.cameraEnhancer.resume();
					} catch (e) {
						console.warn("Camera error (after correction/result - resume):", e);
					}
				} else this.closeCamera();
				let n = { status: {
					code: k.RS_FAILED,
					message: "Error capturing image"
				} };
				this.currentScanResolver?.(n);
			} finally {
				this.isCapturing = !1;
			}
		}
	}
	async handleBoundsDetection(e) {
		if (this.capturedResultItems = e.items, !e.items?.length) return;
		let t = e.items.filter((e) => e.type === _.CRIT_ORIGINAL_IMAGE);
		this.originalImageData = t[0]?.imageData, this.frameVerificationEnabled && this.boundsDetectionEnabled && this.trackFrameClarity(e), (this.smartCaptureEnabled || this.autoCropEnabled) && this.handleAutoCaptureMode(e);
	}
	async handleAutoCaptureMode(e) {
		if (e.items.length <= 1) {
			this.crossVerificationCount = 0;
			return;
		}
		this.resources.enableContinuousScanning && Date.now() - this.lastCaptureTimestamp < this.CONTINUOUS_SCAN_COOLDOWN_MS || (e.processedDocumentResult?.detectedQuadResultItems?.[0]?.crossVerificationStatus === 1 && this.crossVerificationCount++, this.crossVerificationCount >= this.getMinVerifiedFramesForAutoCapture() && (this.crossVerificationCount = 0, this.lastCaptureTimestamp = Date.now(), await this.takePhoto()));
	}
	dispose() {
		this.closeCamera(), this.currentScanResolver?.({ status: {
			code: k.RS_CANCELLED,
			message: "Disposed"
		} }), this.currentScanResolver = void 0;
	}
	async launch() {
		try {
			await this.initialize();
			let e = this.cvRouter, t = this.cameraEnhancer;
			return new Promise(async (n) => {
				if (this.currentScanResolver = n, await this.openCamera(), this.boundsDetectionEnabled && await e.startCapturing(this.templateNames.detect), this.toggleScanGuide(!0), t?.isOpen()) try {
					t.setPixelFormat(b.IPF_ABGR_8888);
				} catch (e) {
					console.warn("Camera error (takePhoto - setPixelFormat):", e);
				}
				this.crossVerificationCount = 0;
			});
		} catch (e) {
			let t = e?.message || e;
			console.error("DDS Launch error: ", t), this.closeCamera();
			let n = { status: {
				code: k.RS_FAILED,
				message: "DDS Launch error"
			} };
			return this.currentScanResolver?.(n), n;
		}
	}
	async normalizeImage(e, t) {
		let n = this.cvRouter, r = await n.getSimplifiedSettings(this.templateNames.normalize);
		r.roiMeasuredInPercentage = !1, r.roi.points = e, await n.updateSettings(this.templateNames.normalize, r);
		let i = await n.capture(t, this.templateNames.normalize);
		if (i?.processedDocumentResult?.deskewedImageResultItems?.[0]) return i.processedDocumentResult.deskewedImageResultItems[0];
		throw Error("Failed to normalize image");
	}
}, Se = Object.defineProperty, Ce = (e, t, n) => t in e ? Se(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, J = (e, t, n) => (Ce(e, typeof t == "symbol" ? t : t + "", n), n), Y = class {
	constructor(e) {
		J(this, "cvs"), this.cvs = e;
	}
	process(e) {
		let t, n;
		e instanceof HTMLImageElement ? (t = e.naturalWidth, n = e.naturalHeight) : e instanceof HTMLCanvasElement ? (t = e.width, n = e.height) : (t = e.videoWidth, n = e.videoHeight);
		let r = this.cvs.getContext("2d");
		if (this.cvs.width = t, this.cvs.height = n, r) {
			r.drawImage(e, 0, 0);
			let t = r.getImageData(0, 0, this.cvs.width, this.cvs.height), n = t.data;
			for (var i = 0; i < n.length; i += 4) {
				let e = n[i], t = n[i + 1], r = n[i + 2], a = n[i + 3], o = this.convert(e, t, r, a);
				n[i] = o.r, n[i + 1] = o.g, n[i + 2] = o.b, n[i + 3] = o.a;
			}
			r.putImageData(t, 0, 0);
		}
	}
	convert(e, t, n, r) {
		return {
			r: e,
			g: t,
			b: n,
			a: r
		};
	}
};
function we(e) {
	return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var X = {};
(function(e) {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.default = void 0;
	function t(e) {
		return i(e) || r(e) || n();
	}
	function n() {
		throw TypeError("Invalid attempt to spread non-iterable instance");
	}
	function r(e) {
		if (Symbol.iterator in Object(e) || Object.prototype.toString.call(e) === "[object Arguments]") return Array.from(e);
	}
	function i(e) {
		if (Array.isArray(e)) {
			for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
			return n;
		}
	}
	var a = function(e, n) {
		return e.reduce(function(e, t) {
			return e[n.indexOf(t)] += 1, e;
		}, t(Array(n.length)).fill(0));
	}, o = function(e, t, n) {
		for (var r = 0, i = t; i < n; i += 1) r += e[i];
		return r;
	}, s = function(e) {
		return Array.from(new Set(e)).sort(function(e, t) {
			return e - t;
		});
	}, c = function(e, t, n, r) {
		for (var i = 0, a = t; a < n; a += 1) i += e[a];
		return i / r;
	}, l = function(e, t, n, r, i) {
		for (var a = 0, o = n; o < r; o += 1) a += e[o] * t[o];
		return a * i;
	}, u = function(e, t, n, r, i, a) {
		for (var o = 0, s = n; s < r; s += 1) {
			var c = t[s] - i;
			o += c * c * e[s];
		}
		return o * a;
	}, d = function(e, t, n, r) {
		return e * t + n * r;
	};
	e.default = function(e) {
		var n = s(e), r = a(e, n), i = e.length, f = t(Array(n.length)).map(function(e, t) {
			var a = 0, s = t, f = t, p = r.length, m = 1 / o(r, a, s), h = 1 / o(r, f, p), g = d(c(r, a, s, i), u(r, n, a, s, l(r, n, a, s, m), m), c(r, f, p, i), u(r, n, f, p, l(r, n, f, p, h), h));
			return isNaN(g) ? Infinity : g;
		});
		return n[f.indexOf(Math.min.apply(Math, t(f)))];
	};
})(X);
var Te = /* @__PURE__ */ we(X), Ee = class extends Y {
	constructor(e, t, n, r, i, a) {
		super(e), J(this, "threshold", 127), J(this, "otsuEnabled", !1), J(this, "adaptive", !1), J(this, "blockSize", 31), J(this, "C", 10), this.threshold = t, this.otsuEnabled = n, this.adaptive = r, this.blockSize = i, this.C = a;
	}
	process(e) {
		let t, n;
		e instanceof HTMLImageElement ? (t = e.naturalWidth, n = e.naturalHeight) : e instanceof HTMLCanvasElement ? (t = e.width, n = e.height) : (t = e.videoWidth, n = e.videoHeight);
		let r = this.cvs.getContext("2d");
		this.cvs.width = t, this.cvs.height = n;
		let i = 0;
		if (r) {
			r.drawImage(e, 0, 0);
			let t = r.getImageData(0, 0, this.cvs.width, this.cvs.height);
			this.adaptive ? t = this.adaptiveThresholdWithIntegralImage(t) : i = this.globalThresholding(t), r.putImageData(t, 0, 0);
		}
		return i;
	}
	adaptiveThresholdWithIntegralImage(e) {
		let t = e.width, n = e.height, r = this.blockSize, i = this.C, a = e.data, o = new ImageData(t, n), s = o.data, c = this.computeIntegralImage(a, t, n), l = Math.floor(r / 2);
		for (let e = 0; e < n; e++) for (let r = 0; r < t; r++) {
			let o = Math.max(r - l, 0), u = Math.max(e - l, 0), d = Math.min(r + l, t - 1), f = Math.min(e + l, n - 1), p = (d - o + 1) * (f - u + 1), m = this.getAreaSum(c, t, o, u, d, f) / p - i, h = (e * t + r) * 4, g = a[h];
			s[h] = s[h + 1] = s[h + 2] = g > m ? 255 : 0, s[h + 3] = 255;
		}
		return o;
	}
	computeIntegralImage(e, t, n) {
		let r = new Uint32Array(t * n);
		for (let i = 0; i < n; i++) {
			let n = 0;
			for (let a = 0; a < t; a++) {
				let o = (i * t + a) * 4;
				n += e[o], r[i * t + a] = (i > 0 ? r[(i - 1) * t + a] : 0) + n;
			}
		}
		return r;
	}
	getAreaSum(e, t, n, r, i, a) {
		let o = n > 0 && r > 0 ? e[(r - 1) * t + (n - 1)] : 0, s = r > 0 ? e[(r - 1) * t + i] : 0, c = n > 0 ? e[a * t + (n - 1)] : 0;
		return e[a * t + i] - s - c + o;
	}
	globalThresholding(e) {
		let t = e.data, n = [];
		for (var r = 0; r < t.length; r += 4) {
			let e = t[r], i = t[r + 1], a = t[r + 2], o = this.grayscale(e, i, a);
			n.push(o);
		}
		let i;
		i = this.otsuEnabled ? Te(n) : this.threshold;
		let a = 0;
		for (var r = 0; r < t.length; r += 4) {
			let e = n[a];
			a += 1;
			let o = 255;
			e < i && (o = 0), t[r] = o, t[r + 1] = o, t[r + 2] = o;
		}
		return i;
	}
	grayscale(e, t, n) {
		return e * 6966 + t * 23436 + n * 2366 >> 15;
	}
	setAdaptive(e, t, n) {
		this.adaptive = e, this.blockSize = t, this.C = n;
	}
	setThreshold(e) {
		this.adaptive = !1, this.threshold = e;
	}
	setOTSUEnabled(e) {
		this.adaptive = !1, this.otsuEnabled = e;
	}
}, De = class extends Y {
	convert(e, t, n, r) {
		let i = e * 6966 + t * 23436 + n * 2366 >> 15;
		return {
			r: i,
			g: i,
			b: i,
			a: r
		};
	}
}, Oe = class extends Y {
	convert(e, t, n, r) {
		return {
			r: e * .393 + t * .769 + n * .189,
			g: e * .349 + t * .686 + n * .168,
			b: e * .272 + t * .534 + n * .131,
			a: r
		};
	}
}, Z;
if (document.createElement("canvas"), window.Dynamsoft && (Z = window.Dynamsoft.DDV), !Z) {
	class e {}
	Z = { ImageFilter: e };
}
Z.ImageFilter;
var ke = class extends Y {
	convert(e, t, n, r) {
		return e = 255 - e, t = 255 - t, n = 255 - n, {
			r: e,
			g: t,
			b: n,
			a: r
		};
	}
}, Q = [
	{
		id: "grayscale",
		labelKey: "filterGrayscaleBtn",
		apply: (e, t) => new De(t).process(e)
	},
	{
		id: "black-white",
		labelKey: "filterBlackWhiteBtn",
		apply: (e, t) => new Ee(t, 128, !0, !1, 0, 0).process(e)
	},
	{
		id: "sepia",
		labelKey: "filterSepiaBtn",
		apply: (e, t) => new Oe(t).process(e)
	},
	{
		id: "invert",
		labelKey: "filterInvertedBtn",
		apply: (e, t) => new ke(t).process(e)
	}
];
function Ae(e, t) {
	let n = (t % 360 + 360) % 360;
	if (n === 0) return e;
	let r = document.createElement("canvas"), i = n === 90 || n === 270;
	r.width = i ? e.height : e.width, r.height = i ? e.width : e.height;
	let a = r.getContext("2d");
	return a ? (a.translate(r.width / 2, r.height / 2), a.rotate(n * Math.PI / 180), a.drawImage(e, -e.width / 2, -e.height / 2), r) : e;
}
function je(e, t) {
	let n = e.getContext("2d")?.getImageData(0, 0, e.width, e.height);
	return {
		...t,
		imageData: {
			bytes: n ? new Uint8Array(n.data.buffer) : /* @__PURE__ */ new Uint8Array(),
			width: e.width,
			height: e.height,
			stride: e.width * 4,
			format: b.IPF_ABGR_8888
		},
		toCanvas: () => e,
		toImage: (t) => {
			let n = new Image();
			return n.src = e.toDataURL(t), n;
		},
		toBlob: (t) => new Promise((n, r) => {
			e.toBlob((e) => e ? n(e) : r(/* @__PURE__ */ Error("Failed to convert canvas to blob")), t);
		})
	};
}
//#endregion
//#region src/views/DocumentResultView.ts
var $ = class {
	constructor(e, t, n, r) {
		this.resources = e, this.config = t, this.scannerView = n, this.correctionView = r, this.editState = {
			rotation: 0,
			filterId: null
		}, this.lastRotateClickAt = 0;
	}
	async launch() {
		try {
			let e = j(this.config.container);
			if (!e) throw Error("Result view container not found");
			return e.textContent = "", await this.initialize(), e.style.display = "flex", new Promise((e) => {
				this.currentScanResultViewResolver = e;
			});
		} catch (e) {
			let t = e?.message || e;
			throw console.error(t), t;
		}
	}
	async handleUploadAndShareBtn(e) {
		try {
			let { result: t } = this.resources;
			if (!t?.correctedImageResult) throw Error("No image to upload");
			e === "upload" && this.config?.onUpload ? await this.config.onUpload(t) : e === "share" && await this.handleShare();
		} catch (e) {
			console.error("Error on upload/share:", e), alert(V("uploadShareFailedAlert"));
		}
	}
	async handleShare() {
		try {
			let { result: e } = this.resources;
			if (!e?.correctedImageResult) throw Error("No image result provided");
			let t = await e.correctedImageResult.toBlob("image/png");
			if (!t) throw Error("Failed to convert image to blob");
			let n = new File([t], `${V("downloadFilenamePrefix")}-${Date.now()}.png`, { type: t.type });
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && navigator.share && (navigator.canShare?.({ files: [n] }) ?? !1)) try {
				return await navigator.share({
					files: [n],
					title: V("shareTitle")
				}), !0;
			} catch (e) {
				if (e.name === "AbortError") return !0;
				e.name === "NotAllowedError" ? console.log("Share permission denied, falling back to download") : e.name === "TypeError" ? console.log("File type not supported for sharing, falling back to download") : e.name === "DataError" ? console.log("Share target error, falling back to download") : console.warn("Share failed with unexpected error:", e);
			}
			let r = URL.createObjectURL(t), i = document.createElement("a");
			return i.href = r, i.download = n.name, document.body.appendChild(i), i.click(), document.body.removeChild(i), URL.revokeObjectURL(r), !0;
		} catch (e) {
			let t = e?.message || e;
			console.error("Error in share/download process:", t), alert(V("shareErrorAlert").replace("{error}", String(t)));
		}
	}
	async handleCorrectImage() {
		try {
			if (!this.correctionView) {
				console.error("Correction View not initialized");
				return;
			}
			this.hideView();
			let e = await this.correctionView.launch();
			if (e.correctedImageResult) {
				this.resources.result && this.resources.onResultUpdated?.({
					...this.resources.result,
					correctedImageResult: e.correctedImageResult
				}), this.dispose(!0), await this.initialize();
				let t = j(this.config.container);
				t && (t.style.display = "flex");
			}
		} catch (e) {
			throw console.error("DocumentResultView - Handle Correction View Error:", e), this.currentScanResultViewResolver?.({ status: {
				code: k.RS_FAILED,
				message: e?.message || e
			} }), e;
		}
	}
	async handleRetake() {
		try {
			if (!this.scannerView) {
				console.error("Scanner View not initialized");
				return;
			}
			if (this.hideView(), this.scannerView) {
				let e = j(this.scannerView.config.container);
				e && (e.style.display = "flex");
			}
			let e = await this.scannerView.launch();
			if (e?.status?.code === k.RS_CANCELLED || e?.status?.code === k.RS_FAILED) {
				this.currentScanResultViewResolver?.(e);
				return;
			}
			if (e?.status.code === k.RS_SUCCESS) {
				if (this.resources.onResultUpdated?.(e), this.scannerView && this.scannerView.stopCapturing(), this.scannerView) {
					let e = j(this.scannerView.config.container);
					e && (e.style.display = "none");
				}
				if (this.correctionView && e._flowType !== void 0 && N(e._flowType)) {
					this.dispose(!0);
					let e = await this.correctionView.launch();
					if (e?.status?.code === k.RS_CANCELLED || e?.status?.code === k.RS_FAILED) {
						this.currentScanResultViewResolver?.(e);
						return;
					}
				}
				this.dispose(!0), await this.initialize();
				let t = j(this.config.container);
				t && (t.style.display = "flex");
			}
		} catch (e) {
			throw console.error("Error in retake handler:", e), this.currentScanResultViewResolver?.({ status: {
				code: k.RS_FAILED,
				message: e?.message || e
			} }), e;
		}
	}
	async handleDone() {
		try {
			let e = this.resources.result ?? { status: {
				code: k.RS_FAILED,
				message: "No scan result available"
			} };
			await this.config?.onDone?.(e), this.currentScanResultViewResolver?.(e), this.hideView(), this.dispose();
		} catch (e) {
			throw console.error("Error in done handler:", e), this.currentScanResultViewResolver?.({ status: {
				code: k.RS_FAILED,
				message: e?.message || e
			} }), e;
		}
	}
	handleRotate() {
		let e = performance.now();
		e - this.lastRotateClickAt < 50 || (this.lastRotateClickAt = e, this.editState.rotation = (this.editState.rotation + 90) % 360, this.applyEdits());
	}
	handleFilter() {
		let e = document.getElementById("dds-scanResult-filter");
		if (!e) return;
		let t = e.querySelector(".dds-filter-menu");
		if (t) {
			t.classList.toggle("show");
			return;
		}
		P("dds-filter-dropdown-style", Ne);
		let n = document.createElement("div");
		n.className = "dds-filter-menu";
		let r = [{
			id: null,
			label: V("filterOriginalBtn")
		}, ...Q.map((e) => ({
			id: e.id,
			label: V(e.labelKey)
		}))];
		for (let e of r) {
			let t = document.createElement("button");
			t.className = "dds-filter-option", t.textContent = e.label, e.id === this.editState.filterId && t.classList.add("active"), t.addEventListener("click", (r) => {
				r.stopPropagation(), this.editState.filterId = e.id, n.querySelector(".dds-filter-option.active")?.classList.remove("active"), t.classList.add("active"), this.applyEdits(), n.classList.remove("show");
			}), n.appendChild(t);
		}
		this.filterMenuOutsideClick = (t) => {
			e.contains(t.target) || n.classList.remove("show");
		}, document.addEventListener("click", this.filterMenuOutsideClick), e.appendChild(n), n.classList.add("show");
	}
	applyEdits() {
		if (!this.baseCorrectedImage || !this.displayCanvas || !this.pristineCanvas) return;
		let e = document.createElement("canvas"), t = Q.find((e) => e.id === this.editState.filterId);
		t ? t.apply(this.pristineCanvas, e) : (e.width = this.pristineCanvas.width, e.height = this.pristineCanvas.height, e.getContext("2d")?.drawImage(this.pristineCanvas, 0, 0)), e = Ae(e, this.editState.rotation), this.displayCanvas.width = e.width, this.displayCanvas.height = e.height, this.displayCanvas.getContext("2d")?.drawImage(e, 0, 0), this.resources.result && this.resources.onResultUpdated?.({
			...this.resources.result,
			correctedImageResult: je(e, this.baseCorrectedImage)
		});
	}
	createControls() {
		let { toolbarButtonsConfig: e, onUpload: t } = this.config, n = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), r = new Blob(["mock-png-data"], { type: "image/png" }), i = new File([r], "test.png", { type: "image/png" }), a = n && "share" in navigator && navigator.canShare({ files: [i] });
		return M([
			{
				id: "dds-scanResult-retake",
				icon: e?.retake?.icon || U.retake,
				label: e?.retake?.label || "Re-take",
				onClick: () => this.handleRetake(),
				className: `${e?.retake?.className || ""}`,
				isHidden: e?.retake?.isHidden || !1,
				isDisabled: !this.scannerView
			},
			{
				id: "dds-scanResult-rotate",
				icon: e?.rotate?.icon || U.rotate,
				label: e?.rotate?.label || "Rotate",
				onClick: () => this.handleRotate(),
				className: `${e?.rotate?.className || ""}`,
				isHidden: e?.rotate?.isHidden || !1,
				isDisabled: !this.resources.result?.correctedImageResult
			},
			{
				id: "dds-scanResult-filter",
				icon: e?.filter?.icon || U.filter,
				label: e?.filter?.label || "Filter",
				onClick: () => this.handleFilter(),
				className: `${e?.filter?.className || ""}`,
				isHidden: e?.filter?.isHidden || !1,
				isDisabled: !this.resources.result?.correctedImageResult
			},
			{
				id: "dds-scanResult-correct",
				icon: e?.correct?.icon || U.normalize,
				label: e?.correct?.label || "Correction",
				onClick: () => this.handleCorrectImage(),
				className: `${e?.correct?.className || ""}`,
				isHidden: e?.correct?.isHidden || !1,
				isDisabled: !this.correctionView
			},
			{
				id: "dds-scanResult-share",
				icon: e?.share?.icon || (a ? U.share : U.downloadPNG),
				label: e?.share?.label || (a ? "Share" : "Download"),
				className: `${e?.share?.className || ""}`,
				isHidden: e?.share?.isHidden || !1,
				onClick: () => this.handleUploadAndShareBtn("share")
			},
			{
				id: "dds-scanResult-upload",
				icon: e?.upload?.icon || U.upload,
				label: e?.upload?.label || "Upload",
				className: `${e?.upload?.className || ""}`,
				isHidden: t ? e?.upload?.isHidden || !1 : !0,
				isDisabled: !t,
				onClick: () => this.handleUploadAndShareBtn("upload")
			},
			{
				id: "dds-scanResult-done",
				icon: e?.done?.icon || U.complete,
				label: e?.done?.label || "Done",
				className: `${e?.done?.className || ""}`,
				isHidden: e?.done?.isHidden || !1,
				onClick: () => this.handleDone()
			}
		].reverse());
	}
	async initialize() {
		try {
			if (!this.resources.result) throw Error("Captured image is missing. Please capture an image first!");
			if (!this.config.container) throw Error("Please create a Scan Result View Container element");
			P("dds-result-view-style", Me);
			let e = document.createElement("div");
			e.className = "dds-result-view-container";
			let t = document.createElement("div");
			Object.assign(t.style, {
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "0"
			});
			let n = this.resources.result.correctedImageResult?.toCanvas();
			Object.assign(n.style, {
				maxWidth: "100%",
				maxHeight: "100%",
				objectFit: "contain"
			}), this.baseCorrectedImage = this.resources.result.correctedImageResult, this.displayCanvas = n, this.pristineCanvas = document.createElement("canvas"), this.pristineCanvas.width = n.width, this.pristineCanvas.height = n.height, this.pristineCanvas.getContext("2d")?.drawImage(n, 0, 0), this.editState = {
				rotation: 0,
				filterId: this.resources.enableContinuousScanning ? this.editState.filterId : null
			}, this.editState.filterId !== null && this.applyEdits(), t.appendChild(n), e.appendChild(t);
			let r = this.createControls();
			e.appendChild(r), this.resources.enableContinuousScanning && this.createScanMoreButton(r);
			let i = j(this.config.container);
			if (i && i.appendChild(e), this.resources.result._flowType === A.STATIC_FILE) {
				let e = document.querySelector("#dds-scanResult-retake");
				e.style.display = "none";
			}
		} catch (e) {
			let t = e?.message || e;
			console.error(t), alert(t);
		}
	}
	createScanMoreButton(e) {
		let t = e.querySelector("#dds-scanResult-done");
		if (!t) return;
		P("dds-filter-dropdown-style", Ne), P("dds-scan-more-style", Pe);
		let n = document.createElement("div");
		n.id = "dds-scanResult-scanMore", n.className = "dds-filter-menu show", n.innerHTML = `<button class="dds-filter-option">${U.plus}<span>${V("scanMoreBtn")}</span></button>`, n.firstElementChild.addEventListener("click", (e) => {
			e.stopPropagation(), this.resources.scanMoreRequested = !0, this.handleDone();
		}), t.appendChild(n);
	}
	hideView() {
		let e = j(this.config.container);
		e && (e.style.display = "none");
	}
	dispose(e = !1) {
		let t = j(this.config.container);
		t && (t.textContent = ""), this.filterMenuOutsideClick &&= (document.removeEventListener("click", this.filterMenuOutsideClick), void 0), e || (this.currentScanResultViewResolver = void 0);
	}
}, Me = "\n  .dds-result-view-container {\n    display: flex;\n    width: 100%;\n    height: 100%;\n    background-color: var(--dds-bg-view, #575757);\n    font-size: 12px;\n    flex-direction: column;\n    align-items: center;\n  }\n\n  /* The footer buttons are reversed in the DOM (see createControls) so the landscape column scrolls\n     from the top. Flip them back here so portrait keeps its original left-to-right order. */\n  .dds-result-view-container .dds-controls {\n    flex-direction: row-reverse;\n  }\n\n  @media (orientation: landscape) and (max-width: 1024px) {\n    .dds-result-view-container {\n      flex-direction: row;\n    }\n\n    /* Landscape stays a normal column (top-anchored scroll); reading the reversed DOM top-to-bottom\n       gives the reversed button order. Higher specificity than the row-reverse rule above. */\n    .dds-result-view-container .dds-controls {\n      flex-direction: column;\n    }\n\n    /* Group Re-take next to Done at the top of the landscape column (CSS-only, no DOM/handler change).\n       Done stays first; Re-take floats to the second slot just below it. */\n    .dds-result-view-container #dds-scanResult-done {\n      order: -2;\n    }\n    .dds-result-view-container #dds-scanResult-retake {\n      order: -1;\n    }\n  }\n", Ne = " /* Filter button customization */\n  .dds-control-btn {\n    position: relative; /* Anchor the absolutely-positioned filter menu to the button */\n  }\n\n  .dds-filter-menu {\n    position: absolute;\n    /* Sit entirely above the footer (100% spans the button/footer height) with a thin gap. */\n    bottom: calc(100% + 0.25rem);\n    left: 50%;\n    transform: translateX(-50%);\n    width: max-content;\n    background-color: var(--dds-filter-menu-bg, #323234);\n    border-radius: 0.5rem;\n    overflow: hidden;\n    display: none;\n    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);\n  }\n\n  .dds-filter-menu.show {\n    display: block;\n  }\n\n  .dds-filter-option {\n    display: flex;\n    align-items: center;\n    gap: 1rem;\n    padding: 1rem;\n    color: var(--dds-filter-menu-text, #ffffff);\n    background: none;\n    border: none;\n    cursor: pointer;\n    font-family: Verdana, Geneva, Tahoma, sans-serif;\n    font-size: 14px;\n    width: 100%;\n    box-sizing: border-box;\n    text-align: left;\n  }\n\n  /* Leading checkmark column to mark active filter */\n  .dds-filter-option::before {\n    content: \"✓\";\n    width: 1rem;\n    flex: none;\n    text-align: center;\n    color: #fe8e14;\n    visibility: hidden;\n  }\n\n  .dds-filter-option.active::before {\n    visibility: visible;\n  }\n\n  .dds-filter-option:hover {\n    background-color: rgba(255, 255, 255, 0.1);\n  }\n\n  .dds-filter-option:not(:last-child) {\n    border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  }\n\n  /* Landscape: the controls column clips overflow-x, cutting off the centred drop-up. Make the button\n     static so the menu anchors to the (relative) wrapper instead, then pin it left of the 8rem column. */\n  @media (orientation: landscape) and (max-width: 1024px) {\n    .dds-result-view-container { position: relative; }\n    #dds-scanResult-filter { position: static; }\n    #dds-scanResult-filter .dds-filter-menu {\n      inset: auto calc(8rem + 0.5rem) 0.5rem auto; transform: none;\n    }\n  }\n", Pe = "\n  #dds-scanResult-scanMore { bottom: calc(100% + 1.5rem); background-color: var(--dds-scan-more-bg, #323234); }\n  #dds-scanResult-scanMore .dds-filter-option { gap: 0.5rem; padding: 0 1.25rem; min-height: 4rem; font-size: 14px; color: var(--dds-scan-more-text, #ffffff); }\n  #dds-scanResult-scanMore .dds-filter-option svg,\n  #dds-scanResult-scanMore .dds-filter-option img { width: 20px; height: 20px; }\n  #dds-scanResult-scanMore .dds-filter-option::before { display: none; }\n  /* Pressed: recolour both the label and the plus icon (the icon's fill is hardcoded, so target it directly). */\n  #dds-scanResult-scanMore .dds-filter-option:active { color: var(--dds-primary, #fe8e14); }\n  #dds-scanResult-scanMore .dds-filter-option:active svg [fill]:not([fill=\"none\"]) { fill: var(--dds-primary, #fe8e14); }\n\n  @media (max-width: 1024px) {\n    #dds-scanResult-scanMore .dds-filter-option { min-height: 3rem; padding: 0 1rem; font-size: 12px; }\n    #dds-scanResult-scanMore .dds-filter-option svg,\n    #dds-scanResult-scanMore .dds-filter-option img { width: 16px; height: 16px; }\n  }\n\n  @media (orientation: portrait) and (max-width: 1024px) {\n    #dds-scanResult-scanMore { left: auto; right: 0.5rem; transform: none; bottom: calc(100% + 1rem); }\n  }\n\n  @media (orientation: landscape) and (max-width: 1024px) {\n    /* Done static → panel's containing block is the unclipped wrapper; centre on Done's 5rem column height. */\n    .dds-result-view-container { position: relative; }\n    .dds-result-view-container #dds-scanResult-done { position: static; }\n    #dds-scanResult-scanMore {\n      bottom: auto; left: auto; right: calc(8rem + 0.25rem);\n      top: 2.5rem; transform: translateY(-50%);\n      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);\n    }\n  }\n", Fe = "https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.5.0/dist/document-scanner.ui.xml", Ie = { rootDirectory: "https://cdn.jsdelivr.net/npm/" }, Le = "100dvh", Re = class {
	showScannerLoadingOverlay(e) {
		let t = j(this.config.scannerViewConfig?.container);
		if (!t) return;
		let n = j(this.config.container);
		n && (n.style.display = "block"), this.loadingScreen = G(t, { message: e }), t.style.display = "block", t.style.position = "relative";
	}
	hideScannerLoadingOverlay(e = !1) {
		if (this.loadingScreen?.hide(), e) {
			let e = j(this.config.scannerViewConfig?.container);
			e && (e.style.display = "none");
		}
	}
	constructor(e) {
		this.config = e, this.resources = {}, this.isInitialized = !1, this.isCapturing = !1, this.shouldStopContinuousScanning = !1, this.loadingScreen = null;
	}
	async initialize() {
		if (this.isInitialized) return {
			resources: this.resources,
			components: {
				scannerView: this.scannerView,
				correctionView: this.correctionView,
				scanResultView: this.scanResultView
			}
		};
		try {
			this.initializeDDSConfig(), pe(this.config.themeColor), he(this.config.stringConfig), P("dds-loading-screen-style", K), this.showScannerLoadingOverlay(V("loadingMsg")), await this.initializeDCVResources(), this.resources.onResultUpdated = (e) => {
				this.resources.result = e;
			}, this.resources.enableContinuousScanning = this.config.enableContinuousScanning || !1, this.resources.completedScansCount = 0, this.resources.onThumbnailClicked = this.config.onThumbnailClicked;
			let e = {};
			return this.config.scannerViewConfig && (this.scannerView = new q(this.resources, this.config.scannerViewConfig), e.scannerView = this.scannerView, await this.scannerView.initialize()), this.config.correctionViewConfig && (this.correctionView = new W(this.resources, this.config.correctionViewConfig, this.scannerView), e.correctionView = this.correctionView), this.config.resultViewConfig && (this.scanResultView = new $(this.resources, this.config.resultViewConfig, this.scannerView, this.correctionView), e.scanResultView = this.scanResultView), this.isInitialized = !0, {
				resources: this.resources,
				components: e
			};
		} catch (e) {
			this.isInitialized = !1;
			let t = j(this.config.container);
			t && (t.style.display = "none");
			let n = e?.message || e;
			throw Error(`Initialization Failed: ${n}`);
		} finally {
			this.hideScannerLoadingOverlay();
		}
	}
	async initializeDCVResources() {
		try {
			f.engineResourcePaths = _e(this.config?.engineResourcePaths) ? Ie : this.config.engineResourcePaths, T._onAuthMessage = (e) => e.replace("(https://www.dynamsoft.com/customer/license/trialLicense?product=unknown&deploymenttype=unknown)", "(https://www.dynamsoft.com/customer/license/trialLicense?product=mwc&deploymenttype=web)"), T.initLicense(this.config?.license || "", !0), f.loadWasm(), this.resources.cameraView = await a.createInstance(this.config.scannerViewConfig?.cameraEnhancerUIPath), this.resources.cameraEnhancer = await t.createInstance(this.resources.cameraView), this.resources.cvRouter = await s.createInstance();
		} catch (e) {
			let t = e?.message || e;
			throw Error(`Resource Initialization Failed: ${t}`);
		}
	}
	shouldCreateDefaultContainer() {
		let e = !this.config.container, t = !(this.config.scannerViewConfig?.container || this.config.resultViewConfig?.container || this.config.correctionViewConfig?.container);
		return e && t;
	}
	createDefaultDDSContainer() {
		let e = document.createElement("div");
		return e.className = "dds-main-container", Object.assign(e.style, {
			display: "none",
			height: Le,
			width: "100%",
			position: "absolute",
			left: "0",
			top: "0",
			zIndex: "999"
		}), document.body.append(e), e;
	}
	checkForTemporaryLicense(e) {
		return !e?.length || e?.startsWith("A") || e?.startsWith("L") || e?.startsWith("P") || e?.startsWith("Y") ? "DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9" : e;
	}
	validateViewConfigs() {
		if (!this.config.container && !this.shouldCreateDefaultContainer()) {
			if (this.config.showCorrectionView && !this.config.correctionViewConfig?.container) throw Error("CorrectionView container is required when showCorrectionView is true and no main container is provided");
			if (this.config.showResultView && !this.config.resultViewConfig?.container) throw Error("ResultView container is required when showResultView is true and no main container is provided");
		}
	}
	showCorrectionView() {
		return this.config.showCorrectionView === !1 ? !1 : this.config.container ? this.config.showCorrectionView === void 0 && (this.config.correctionViewConfig?.container || this.config.container) ? !0 : !!this.config.showCorrectionView : this.config.showCorrectionView && !!this.config.correctionViewConfig?.container;
	}
	showResultView() {
		return this.config.showResultView === !1 ? !1 : this.config.container ? this.config.showResultView === void 0 && (this.config.resultViewConfig?.container || this.config.container) ? !0 : !!this.config.showResultView : this.config.showResultView && !!this.config.resultViewConfig?.container;
	}
	initializeDDSConfig() {
		this.validateViewConfigs(), this.shouldCreateDefaultContainer() ? this.config.container = this.createDefaultDDSContainer() : this.config.container && (this.config.container = j(this.config.container) ?? void 0);
		let e = j(this.config.container), t = e ? this.createViewContainers(e) : {}, n = {
			license: this.checkForTemporaryLicense(this.config.license),
			utilizedTemplateNames: {
				detect: this.config.utilizedTemplateNames?.detect || O.detect,
				normalize: this.config.utilizedTemplateNames?.normalize || O.normalize
			},
			templateFilePath: this.config?.templateFilePath || null
		}, r = {
			...this.config.scannerViewConfig,
			container: t[D.Scanner] || this.config.scannerViewConfig?.container || null,
			cameraEnhancerUIPath: this.config.scannerViewConfig?.cameraEnhancerUIPath || Fe,
			templateFilePath: n.templateFilePath,
			utilizedTemplateNames: n.utilizedTemplateNames,
			_showCorrectionView: this.showCorrectionView(),
			_showResultView: this.showResultView(),
			enableFrameVerification: this.config.enableFrameVerification !== !1
		}, i = this.showCorrectionView() ? {
			...this.config.correctionViewConfig,
			container: t[D.Correction] || this.config.correctionViewConfig?.container || null,
			templateFilePath: n.templateFilePath,
			utilizedTemplateNames: n.utilizedTemplateNames,
			_showResultView: this.showResultView()
		} : void 0, a = this.showResultView() ? {
			...this.config.resultViewConfig,
			container: t[D.Result] || this.config.resultViewConfig?.container || null
		} : void 0;
		Object.assign(this.config, {
			...n,
			scannerViewConfig: r,
			correctionViewConfig: i,
			resultViewConfig: a
		});
	}
	createViewContainers(e) {
		e.textContent = "";
		let t = [D.Scanner];
		return this.showCorrectionView() && t.push(D.Correction), this.showResultView() && t.push(D.Result), t.reduce((t, n) => {
			let r = document.createElement("div");
			return r.className = `dds-${n}-view-container`, Object.assign(r.style, {
				height: "100%",
				width: "100%",
				display: "none",
				position: "relative",
				userSelect: "none"
			}), e.append(r), t[n] = r, t;
		}, {});
	}
	stopContinuousScanning() {
		this.shouldStopContinuousScanning = !0;
	}
	dispose() {
		this.scanResultView?.dispose(), this.scanResultView = void 0, this.correctionView?.dispose(), this.correctionView = void 0, this.scannerView?.dispose(), this.scannerView = void 0, this.resources.cameraEnhancer?.dispose(), this.resources.cameraEnhancer = void 0, this.resources.cameraView?.dispose(), this.resources.cameraView = void 0, this.resources.cvRouter?.dispose(), this.resources.cvRouter = void 0, this.resources.result = void 0, this.resources.onResultUpdated = void 0;
		let e = (e) => {
			let t = j(e);
			t && (t.style.display = "none", t.textContent = "");
		};
		e(this.config.container), e(this.config.scannerViewConfig?.container), e(this.config.correctionViewConfig?.container), e(this.config.resultViewConfig?.container), this.isInitialized = !1, this.isCapturing = !1, this.shouldStopContinuousScanning = !1;
	}
	async processFileToBlob(e) {
		return new Promise((t, n) => {
			if (!e.type.startsWith("image/")) {
				n(/* @__PURE__ */ Error("Please select an image file"));
				return;
			}
			let r = new Image();
			r.onload = () => {
				let i = document.createElement("canvas");
				i.width = r.width, i.height = r.height, i.getContext("2d")?.drawImage(r, 0, 0), i.toBlob((e) => {
					e ? t({
						blob: e,
						width: r.width,
						height: r.height
					}) : n(/* @__PURE__ */ Error("Failed to create blob from image"));
				}, e.type);
			}, r.onerror = () => n(/* @__PURE__ */ Error("Failed to load image")), r.src = URL.createObjectURL(e);
		});
	}
	async processUploadedFile(e) {
		try {
			this.showScannerLoadingOverlay(V("processingImageMsg"));
			let { cvRouter: t } = this.resources, n = this.config.utilizedTemplateNames;
			if (!t || !n) throw Error("Scanner resources are not initialized");
			let { blob: r } = await this.processFileToBlob(e), i = (await t.capture(r, n.detect)).items, a = i[0]?.imageData;
			if (!a) throw Error("Failed to extract image data");
			let o;
			if (i.length <= 1) {
				let { width: e, height: t } = a;
				o = {
					points: [
						{
							x: 0,
							y: 0
						},
						{
							x: e,
							y: 0
						},
						{
							x: e,
							y: t
						},
						{
							x: 0,
							y: t
						}
					],
					area: t * e
				};
			} else o = i.find((e) => e.type === _.CRIT_DETECTED_QUAD)?.location;
			let s = await t.getSimplifiedSettings(n.normalize);
			s.roiMeasuredInPercentage = !1, s.roi.points = o.points, await t.updateSettings(n.normalize, s);
			let c = (await t.capture(a, n.normalize))?.processedDocumentResult?.deskewedImageResultItems?.[0], l = {
				status: {
					code: k.RS_SUCCESS,
					message: "Success"
				},
				originalImageResult: a,
				correctedImageResult: c,
				detectedQuadrilateral: o,
				_flowType: A.STATIC_FILE
			};
			return this.resources.onResultUpdated?.(l), this.hideScannerLoadingOverlay(!0), l;
		} catch (e) {
			return console.error("Failed to process uploaded file:", e), { status: {
				code: k.RS_FAILED,
				message: `Failed to process image: ${e?.message || e}`
			} };
		}
	}
	async performSingleScan(e) {
		let { components: t } = await this.initialize();
		if (this.config.container) {
			let e = j(this.config.container);
			e && (e.style.display = "block");
		}
		if (e && (t.scannerView = void 0, await this.processUploadedFile(e)), !t.scannerView && this.resources.result) {
			if (t.correctionView && !t.scanResultView) return await t.correctionView.launch();
			if (t.scanResultView && !t.correctionView) return await t.scanResultView.launch();
			if (t.scanResultView && t.correctionView) return await t.correctionView.launch(), await t.scanResultView.launch();
		}
		if (!t.scannerView && !this.resources.result) throw Error("Scanner view is required when no previous result exists");
		if (t.scannerView) {
			let e = await t.scannerView.launch();
			if (e?.status.code !== k.RS_SUCCESS) return { status: {
				code: e?.status.code,
				message: e?.status.message || "Failed to capture image"
			} };
			if (t.scannerView) {
				t.scannerView.stopCapturing();
				let e = j(this.config.scannerViewConfig?.container);
				e && (e.style.display = "none");
			}
			if (t.correctionView && t.scanResultView && e._flowType !== void 0 && N(e._flowType)) return await t.correctionView.launch(), await t.scanResultView.launch();
			if (t.correctionView && !t.scanResultView && (e._flowType === void 0 || N(e._flowType))) return await t.correctionView.launch();
			if (t.scanResultView) return await t.scanResultView.launch();
		}
		return this.resources.result ?? { status: {
			code: k.RS_FAILED,
			message: "Failed to capture image"
		} };
	}
	async launch(e) {
		if (this.isCapturing) throw Error("Capture session already in progress");
		try {
			if (this.isCapturing = !0, document.body.style.overflow = "hidden", this.config.enableContinuousScanning) {
				for (this.shouldStopContinuousScanning = !1; !this.shouldStopContinuousScanning;) {
					this.resources.scanMoreRequested = !1;
					let t = await this.performSingleScan(e);
					if (t.status.code === k.RS_CANCELLED) break;
					if (t.status.code === k.RS_FAILED) return t;
					if (t.status.code === k.RS_SUCCESS) {
						this.resources.completedScansCount = (this.resources.completedScansCount ?? 0) + 1, await this.config.onDocumentScanned?.(t);
						let e = !this.showCorrectionView() && !this.showResultView();
						if (this.resources.scanMoreRequested || e) continue;
						break;
					}
				}
				return this.resources.result || { status: {
					code: k.RS_CANCELLED,
					message: "Continuous scanning stopped"
				} };
			}
			let t = await this.performSingleScan(e);
			return t.status.code === k.RS_SUCCESS && await this.config.onDocumentScanned?.(t), t;
		} catch (e) {
			return console.error("Document capture flow failed:", e?.message || e), { status: {
				code: k.RS_FAILED,
				message: `Document capture flow failed. ${e?.message || e}`
			} };
		} finally {
			this.isCapturing = !1, document.body.style.overflow = "", this.dispose();
		}
	}
}, ze = {
	DocumentScanner: Re,
	DocumentNormalizerView: W,
	DocumentScannerView: q,
	DocumentResultView: $,
	EnumResultStatus: k,
	EnumFlowType: A,
	EnumDDSViews: D
};
//#endregion
export { e as CameraEnhancer, n as CameraEnhancerModule, r as CameraManager, i as CameraView, o as CaptureVisionRouter, c as CaptureVisionRouterModule, l as CapturedResultReceiver, d as CoreModule, ze as DDS, p as DocumentNormalizerModule, W as DocumentNormalizerView, $ as DocumentResultView, Re as DocumentScanner, q as DocumentScannerView, h as EnumBufferOverflowProtectionMode, g as EnumCapturedResultItemType, v as EnumErrorCode, y as EnumImagePixelFormat, k as EnumResultStatus, x as ImageDrawer, C as ImageIO, w as ImageProcessor, ee as IntermediateResultReceiver, te as LicenseManager, ne as LicenseModule, re as MultiFrameResultCrossFilter, ae as UtilityModule, oe as handleEngineResourcePaths, se as innerVersions, ce as isDSImageData, le as isDSRect, ue as isPoint, de as isQuad };
