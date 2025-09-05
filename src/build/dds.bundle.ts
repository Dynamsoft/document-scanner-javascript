// DDS bundled together with DCV Bundle.
// Use this bundle to allow users to use DDS without installing DCV bundle as dependencies
// Used for  <script type="module">

// Re-export everything including types and classes
export * from "dynamsoft-capture-vision-bundle";

// Create namespace exports for backward compatibility with UMD builds
// Import only runtime values (classes, functions, enums) from the bundle
import {
  // Core runtime exports
  CoreModule,
  EnumErrorCode,
  EnumImagePixelFormat,
  EnumBufferOverflowProtectionMode,
  EnumCapturedResultItemType,
  isDSImageData,
  isDSRect,
  isPoint,
  isQuad,
  innerVersions,
  handleEngineResourcePaths,
  // License runtime exports
  LicenseManager,
  LicenseModule,
  // CVR runtime exports
  CaptureVisionRouter,
  CaptureVisionRouterModule,
  IntermediateResultReceiver,
  CapturedResultReceiver,
  // DCE runtime exports
  CameraEnhancer,
  CameraEnhancerModule,
  CameraView,
  CameraManager,
  // DDN runtime exports
  DocumentNormalizerModule,
  // Utility runtime exports
  UtilityModule,
  MultiFrameResultCrossFilter,
  ImageProcessor,
  ImageIO,
  ImageDrawer,
} from "dynamsoft-capture-vision-bundle";

// Re-export types for TypeScript users
export type {
  DSImageData,
  DSRect,
  DSFile,
  Point,
  Quadrilateral,
  EngineResourcePaths,
  CapturedResult,
  DetectedQuadResultItem,
  DeskewedImageResultItem,
  OriginalImageResultItem,
} from "dynamsoft-capture-vision-bundle";

// Group runtime exports into namespaces for UMD compatibility
export const Core = {
  CoreModule,
  EnumErrorCode,
  EnumImagePixelFormat,
  EnumBufferOverflowProtectionMode,
  EnumCapturedResultItemType,
  isDSImageData,
  isDSRect,
  isPoint,
  isQuad,
  innerVersions,
  handleEngineResourcePaths,
};

export const License = {
  LicenseManager,
  LicenseModule,
};

export const CVR = {
  CaptureVisionRouter,
  CaptureVisionRouterModule,
  IntermediateResultReceiver,
  CapturedResultReceiver,
};

export const DCE = {
  CameraEnhancer,
  CameraEnhancerModule,
  CameraView,
  CameraManager,
};

export const DDN = {
  DocumentNormalizerModule,
};

export const Utility = {
  UtilityModule,
  MultiFrameResultCrossFilter,
  ImageProcessor,
  ImageIO,
  ImageDrawer,
};

export * from "./index";
