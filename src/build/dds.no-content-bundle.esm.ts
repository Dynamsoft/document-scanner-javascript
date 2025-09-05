// For framework like vue/react,
// the package is only a empty shell,
// relink directly to specific packages.

// Re-export only DDS-needed exports
export {
  // Core module exports
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

  // License exports
  LicenseManager,
  LicenseModule,

  // CVR exports
  CaptureVisionRouter,
  CaptureVisionRouterModule,
  IntermediateResultReceiver,
  CapturedResultReceiver,

  // DCE exports
  CameraEnhancer,
  CameraEnhancerModule,
  CameraView,
  CameraManager,

  // DDN exports (Document Detection/Normalization)
  DocumentNormalizerModule,

  // Utility exports
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

export * from "./index";
