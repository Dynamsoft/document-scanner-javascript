declare enum EnumBufferOverflowProtectionMode {
    /** New images are blocked when the buffer is full.*/
    BOPM_BLOCK = 0,
    /** New images are appended at the end, and oldest images are pushed out from the beginning if the buffer is full.*/
    BOPM_UPDATE = 1
}

declare enum EnumCapturedResultItemType {
    CRIT_ORIGINAL_IMAGE = 1,
    CRIT_BARCODE = 2,
    CRIT_TEXT_LINE = 4,
    CRIT_DETECTED_QUAD = 8,
    CRIT_DESKEWED_IMAGE = 16,
    CRIT_PARSED_RESULT = 32,
    CRIT_ENHANCED_IMAGE = 64
}

declare enum EnumCornerType {
    CT_NORMAL_INTERSECTED = 0,
    CT_T_INTERSECTED = 1,
    CT_CROSS_INTERSECTED = 2,
    CT_NOT_INTERSECTED = 3
}

/**
 * `ErrorCode` enumerates the specific error codes that the SDK may return, providing a systematic way to identify and handle errors encountered during its operation.
 */
declare enum EnumErrorCode {
    /** Operation completed successfully. */
    EC_OK = 0,
    /** An unspecified error occurred. */
    EC_UNKNOWN = -10000,
    /** The system does not have enough memory to perform the requested operation. */
    EC_NO_MEMORY = -10001,
    /** A null pointer was encountered where a valid pointer was required. */
    EC_NULL_POINTER = -10002,
    /** The provided license is not valid. */
    EC_LICENSE_INVALID = -10003,
    /** The provided license has expired. */
    EC_LICENSE_EXPIRED = -10004,
    /** The specified file could not be found. */
    EC_FILE_NOT_FOUND = -10005,
    /** The file type is not supported for processing. */
    EC_FILE_TYPE_NOT_SUPPORTED = -10006,
    /** The image's bits per pixel (BPP) is not supported. */
    EC_BPP_NOT_SUPPORTED = -10007,
    /** The specified index is out of the valid range. */
    EC_INDEX_INVALID = -10008,
    /** The specified custom region value is invalid or out of range. */
    EC_CUSTOM_REGION_INVALID = -10010,
    /** Failed to read the image due to an error in accessing or interpreting the image data. */
    EC_IMAGE_READ_FAILED = -10012,
    /** Failed to read a TIFF image, possibly due to corruption or unsupported format. */
    EC_TIFF_READ_FAILED = -10013,
    /** The provided DIB (Device-Independent Bitmaps) buffer is invalid or corrupted. */
    EC_DIB_BUFFER_INVALID = -10018,
    /** Failed to read a PDF image, possibly due to corruption or unsupported format. */
    EC_PDF_READ_FAILED = -10021,
    /** Required PDF processing DLL is missing. */
    EC_PDF_DLL_MISSING = -10022,
    /** The specified page number is invalid or out of bounds for the document. */
    EC_PAGE_NUMBER_INVALID = -10023,
    /** The specified custom size is invalid or not supported. */
    EC_CUSTOM_SIZE_INVALID = -10024,
    /** The operation timed out. */
    EC_TIMEOUT = -10026,
    /** Failed to parse JSON input. */
    EC_JSON_PARSE_FAILED = -10030,
    /** The JSON type is invalid for the expected context. */
    EC_JSON_TYPE_INVALID = -10031,
    /** The JSON key is invalid or unrecognized in the current context. */
    EC_JSON_KEY_INVALID = -10032,
    /** The JSON value is invalid for the specified key. */
    EC_JSON_VALUE_INVALID = -10033,
    /** The required "Name" key is missing in the JSON data. */
    EC_JSON_NAME_KEY_MISSING = -10034,
    /** The value of the "Name" key is duplicated and conflicts with existing data. */
    EC_JSON_NAME_VALUE_DUPLICATED = -10035,
    /** The template name is invalid or does not match any known template. */
    EC_TEMPLATE_NAME_INVALID = -10036,
    /** The reference made by the "Name" key is invalid or points to nonexistent data. */
    EC_JSON_NAME_REFERENCE_INVALID = -10037,
    /** The parameter value provided is invalid or out of the expected range. */
    EC_PARAMETER_VALUE_INVALID = -10038,
    /** The domain of the current site does not match the domain bound to the current product key. */
    EC_DOMAIN_NOT_MATCH = -10039,
    /** The license key does not match the license content. */
    EC_LICENSE_KEY_NOT_MATCH = -10043,
    /** Error setting the mode's argument, indicating invalid or incompatible arguments. */
    EC_SET_MODE_ARGUMENT_ERROR = -10051,
    /** Failed to retrieve the mode's argument, possibly due to invalid state or configuration. */
    EC_GET_MODE_ARGUMENT_ERROR = -10055,
    /** The Intermediate Result Types (IRT) license is invalid or not present. */
    EC_IRT_LICENSE_INVALID = -10056,
    /** Failed to save the file, possibly due to permissions, space, or an invalid path. */
    EC_FILE_SAVE_FAILED = -10058,
    /** The specified stage type is invalid or not supported in the current context. */
    EC_STAGE_TYPE_INVALID = -10059,
    /** The specified image orientation is invalid or not supported. */
    EC_IMAGE_ORIENTATION_INVALID = -10060,
    /** Failed to convert complex template to simplified settings, indicating a configuration or compatibility issue. */
    EC_CONVERT_COMPLEX_TEMPLATE_ERROR = -10061,
    /** Rejecting function call while capturing is in progress, to prevent conflicts or data corruption. */
    EC_CALL_REJECTED_WHEN_CAPTURING = -10062,
    /** The specified image source was not found, indicating a missing or inaccessible input source. */
    EC_NO_IMAGE_SOURCE = -10063,
    /** Failed to read the directory, possibly due to permissions, non-existence, or other access issues. */
    EC_READ_DIRECTORY_FAILED = -10064,
    /** A required module (e.g., DynamsoftBarcodeReader, DynamsoftLabelRecognizer) was not found. */
    EC_MODULE_NOT_FOUND = -10065,
    EC_MULTI_PAGES_NOT_SUPPORTED = -10066,
    /** Indicates an attempt to write to a file that already exists, with overwriting explicitly disabled. This error suggests the need for either enabling overwriting or ensuring unique file names to avoid conflicts. */
    EC_FILE_ALREADY_EXISTS = -10067,
    /** The specified file path does not exist and could not be created. This error could be due to insufficient permissions, a read-only filesystem, or other environmental constraints preventing file creation. */
    EC_CREATE_FILE_FAILED = -10068,
    /** The input ImageData object contains invalid parameters. This could be due to incorrect data types, out-of-range values, or improperly formatted data being passed to a function expecting ImageData. */
    EC_IMGAE_DATA_INVALID = -10069,
    /** The size of the input image does not meet the requirements. */
    EC_IMAGE_SIZE_NOT_MATCH = -10070,
    /** The pixel format of the input image does not meet the requirements. */
    EC_IMAGE_PIXEL_FORMAT_NOT_MATCH = -10071,
    /** The section level result is irreplaceable. */
    EC_SECTION_LEVEL_RESULT_IRREPLACEABLE = -10072,
    /** Incorrect axis definition. */
    EC_AXIS_DEFINITION_INCORRECT = -10073,
    /**The result is not replaceable due to type mismatch*/
    EC_RESULT_TYPE_MISMATCH_IRREPLACEABLE = -10074,
    /**Failed to load the PDF library.*/
    EC_PDF_LIBRARY_LOAD_FAILED = -10075,
    EC_UNSUPPORTED_JSON_KEY_WARNING = -10077,
    /**Model file is not found*/
    EC_MODEL_FILE_NOT_FOUND = -10078,
    /**[PDF] No license found.*/
    EC_PDF_LICENSE_NOT_FOUND = -10079,
    /**The rectangle is invalid.*/
    EC_RECT_INVALID = -10080,
    EC_TEMPLATE_VERSION_INCOMPATIBLE = -10081,
    /** Indicates no license is available or the license is not set. */
    EC_NO_LICENSE = -20000,
    /** Encountered failures while attempting to read or write to the license buffer. */
    EC_LICENSE_BUFFER_FAILED = -20002,
    /** Synchronization with the license server failed, possibly due to network issues or server unavailability. */
    EC_LICENSE_SYNC_FAILED = -20003,
    /** The device attempting to use the license does not match the device specified in the license buffer. */
    EC_DEVICE_NOT_MATCH = -20004,
    /** Binding the device to the license failed, indicating possible issues with the license or device identifier. */
    EC_BIND_DEVICE_FAILED = -20005,
    /** The number of instances using the license exceeds the limit allowed by the license terms. */
    EC_INSTANCE_COUNT_OVER_LIMIT = -20008,
    /** Indicates the license in use is a trial version with limited functionality or usage time. */
    EC_TRIAL_LICENSE = -20010,
    /**The license is not valid for current version*/
    EC_LICENSE_VERSION_NOT_MATCH = -20011,
    /**Online license validation failed due to network issues.Using cached license information for validation.*/
    EC_LICENSE_CACHE_USED = -20012,
    EC_LICENSE_AUTH_QUOTA_EXCEEDED = -20013,
    /**License restriction: the number of results has exceeded the allowed limit.*/
    EC_LICENSE_RESULTS_LIMIT_EXCEEDED = -20014,
    /** The specified barcode format is invalid or unsupported. */
    EC_BARCODE_FORMAT_INVALID = -30009,
    /** The specified custom module size for barcode generation is invalid or outside acceptable limits. */
    EC_CUSTOM_MODULESIZE_INVALID = -30025,
    /**There is a conflict in the layout of TextLineGroup. */
    EC_TEXT_LINE_GROUP_LAYOUT_CONFLICT = -40101,
    /**There is a conflict in the regex of TextLineGroup. */
    EC_TEXT_LINE_GROUP_REGEX_CONFLICT = -40102,
    /** The specified quadrilateral is invalid, potentially due to incorrect points or an unprocessable shape. */
    EC_QUADRILATERAL_INVALID = -50057,
    /** The license for generating or processing panoramas is invalid or missing. */
    EC_PANORAMA_LICENSE_INVALID = -70060,
    /** The specified resource path does not exist, indicating a missing directory or incorrect path specification. */
    EC_RESOURCE_PATH_NOT_EXIST = -90001,
    /** Failed to load the specified resource, which might be due to missing files, access rights, or other issues preventing loading. */
    EC_RESOURCE_LOAD_FAILED = -90002,
    /** The code specification required for processing was not found, indicating a missing or incorrect specification. */
    EC_CODE_SPECIFICATION_NOT_FOUND = -90003,
    /** The full code string provided is empty, indicating no data was provided for processing. */
    EC_FULL_CODE_EMPTY = -90004,
    /** Preprocessing the full code string failed, possibly due to invalid format, corruption, or unsupported features. */
    EC_FULL_CODE_PREPROCESS_FAILED = -90005,
    /**The license is initialized successfully but detected invalid content in your key.*/
    EC_LICENSE_WARNING = -10076,
    /** [Barcode Reader] No license found.*/
    EC_BARCODE_READER_LICENSE_NOT_FOUND = -30063,
    /**[Label Recognizer] No license found.*/
    EC_LABEL_RECOGNIZER_LICENSE_NOT_FOUND = -40103,
    /**[Document Normalizer] No license found.*/
    EC_DOCUMENT_NORMALIZER_LICENSE_NOT_FOUND = -50058,
    /**[Code Parser] No license found.*/
    EC_CODE_PARSER_LICENSE_NOT_FOUND = -90012
}

declare enum EnumGrayscaleEnhancementMode {
    /**
     * Disables any grayscale image preprocessing. Selecting this mode skips the preprocessing step, passing the image through to subsequent operations without modification.
     */
    GEM_SKIP = 0,
    /**
     * Automatic selection of grayscale enhancement mode. Currently, not supported. Future implementations may automatically choose the most suitable enhancement based on image analysis.
     */
    GEM_AUTO = 1,
    /**
     * Uses the original, unprocessed image for subsequent operations. This mode is selected when no specific grayscale enhancement is required, maintaining the image in its natural state.
     */
    GEM_GENERAL = 2,
    /**
     * Applies a grayscale equalization algorithm to the image, enhancing contrast and detail in gray level.
     * Suitable for images with poor contrast. Refer to Image Processing Mode (IPM) documentation for argument settings.
     */
    GEM_GRAY_EQUALIZE = 4,
    /**
     * Implements a grayscale smoothing algorithm to reduce noise and smooth the image.
     * This can be beneficial for images with high levels of grain or noise. Check IPM documentation for configuration options.
     */
    GEM_GRAY_SMOOTH = 8,
    /**
     * Enhances the image by applying both sharpening and smoothing algorithms. This mode aims to increase clarity and detail while reducing noise, offering a balanced approach to image preprocessing.
     * Refer to the IPM section for available argument settings.
     */
    GEM_SHARPEN_SMOOTH = 16,
    /**
     * Reserved for future use. This setting is part of the grayscale enhancement mode but is currently not defined for public use. It's reserved for internal development or future enhancements.
     */
    GEM_REV = -2147483648,
    /**
     * Placeholder value with no functional meaning.
     */
    GEM_END = -1
}

declare enum EnumGrayscaleTransformationMode {
    /**
     * Bypasses grayscale transformation, leaving the image in its current state without any modification to its grayscale values.
     * This mode is selected when no alteration of the grayscale data is desired, passing the image through to subsequent operations without modification.
     */
    GTM_SKIP = 0,
    /**
     * Applies an inversion to the grayscale values of the image, effectively transforming light elements to dark and vice versa.
     * This mode is particularly useful for images with light text on dark backgrounds, enhancing visibility for further processing.
     */
    GTM_INVERTED = 1,
    /**
     * Maintains the original grayscale values of the image without any transformation. This mode is suited for images with dark elements on light backgrounds, ensuring the natural contrast and detail are preserved for subsequent analysis.
     */
    GTM_ORIGINAL = 2,
    /**
     * Delegates the choice of grayscale transformation to the library's algorithm, which automatically determines the most suitable transformation based on the image's characteristics. This mode is beneficial when the optimal transformation is not known in advance or varies across different images.
     */
    GTM_AUTO = 4,
    /**
     * Reserved for future expansion or internal use. This placeholder indicates a grayscale transformation mode that is not currently defined for public use but may be utilized for upcoming features or reserved for specific, undocumented adjustments.
     */
    GTM_REV = -2147483648,
    /**
     * Placeholder value with no functional meaning.
     */
    GTM_END = -1
}

declare enum EnumImagePixelFormat {
    /** Binary format representing images with two colors: 0 for black and 1 for white. */
    IPF_BINARY = 0,
    /** Inverted binary format with 0 for white and 1 for black. */
    IPF_BINARYINVERTED = 1,
    /** Grayscale format with 8 bits per pixel, allowing for 256 shades of gray. */
    IPF_GRAYSCALED = 2,
    /** NV21 format, a YUV planar format used commonly in camera preview and video encoding, with 8-bit Y followed by interleaved V/U values. */
    IPF_NV21 = 3,
    /** RGB format with 5 bits for red and blue, and 6 bits for green, stored in a 16-bit structure. */
    IPF_RGB_565 = 4,
    /** Similar to RGB_565 but with 5 bits for each color channel, providing uniform color depth across channels in a 16-bit structure. */
    IPF_RGB_555 = 5,
    /** Standard 24-bit RGB format with 8 bits per channel. */
    IPF_RGB_888 = 6,
    /** 32-bit ARGB format with 8 bits per channel, including an alpha channel for transparency. */
    IPF_ARGB_8888 = 7,
    /** High-depth 48-bit RGB format with 16 bits per channel. */
    IPF_RGB_161616 = 8,
    /** 64-bit ARGB format with 16 bits per channel, including an alpha channel. */
    IPF_ARGB_16161616 = 9,
    /** 32-bit ABGR format with 8 bits per channel, storing color information in reverse order of ARGB_8888. */
    IPF_ABGR_8888 = 10,
    /** 64-bit ABGR format with 16 bits per channel, providing high color depth and transparency in the reverse order of ARGB_16161616. */
    IPF_ABGR_16161616 = 11,
    /** 24-bit BGR format with 8 bits per channel, where the blue channel is stored first. */
    IPF_BGR_888 = 12,
    /** Binary format with 8 bits per pixel, enabling more detailed binary images by allowing for antialiasing or other binary representations. */
    IPF_BINARY_8 = 13,
    /** NV12 format, similar to NV21 but with the U and V color components swapped. */
    IPF_NV12 = 14,
    /** Inverted binary format with 8 bits per pixel. */
    IPF_BINARY_8_INVERTED = 15
}

declare enum EnumImageTagType {
    /** Represents an image that has been sourced from a static file. */
    ITT_FILE_IMAGE = 0,
    /** Indicates that the image is a frame extracted from a video stream. */
    ITT_VIDEO_FRAME = 1
}

declare enum EnumColourChannelUsageType {
    /**
     * Automatically determines how color channels are used.
     * This option allows the SDK to choose the most appropriate channel usage mode dynamically.
     */
    CCUT_AUTO = 0,
    /**
     * Utilizes all available color channels in the image for processing.
     * This mode is ideal for scenarios where full color information is necessary for accurate analysis or processing.
     */
    CCUT_FULL_CHANNEL = 1,
    /**
     * Processes images using only the Y (luminance) channel, specifically in NV21 format images.
     * This mode is useful for operations that require analyzing the brightness or intensity of the image while ignoring color information.
     */
    CCUT_Y_CHANNEL_ONLY = 2,
    /**
     * Uses only the red color channel for processing in RGB images.
     * This mode is useful for tasks that require analysis or manipulation based on the red component of the image.
     */
    CCUT_RGB_R_CHANNEL_ONLY = 3,
    /**
     * Uses only the green color channel for processing in RGB images.
     * This mode is useful for tasks where the green component is most relevant.
     */
    CCUT_RGB_G_CHANNEL_ONLY = 4,
    /**
     * Uses only the blue color channel for processing in RGB images.
     * This mode is useful for tasks where the blue component is of particular interest.
     */
    CCUT_RGB_B_CHANNEL_ONLY = 5
}

declare enum EnumCrossVerificationStatus {
    /** The cross verification has not been performed yet. */
    CVS_NOT_VERIFIED = 0,
    /** The cross verification has been passed successfully. */
    CVS_PASSED = 1,
    /** The cross verification has failed. */
    CVS_FAILED = 2
}

declare const EnumIntermediateResultUnitType: {
    /** No intermediate result. */
    IRUT_NULL: bigint;
    /** A full-color image. */
    IRUT_COLOUR_IMAGE: bigint;
    /** A color image that has been scaled down for efficiency. */
    IRUT_SCALED_COLOUR_IMAGE: bigint;
    /** A grayscale image derived from the original input. */
    IRUT_GRAYSCALE_IMAGE: bigint;
    /** A grayscale image that has undergone transformation. */
    IRUT_TRANSOFORMED_GRAYSCALE_IMAGE: bigint;
    /** A grayscale image enhanced for further processing. */
    IRUT_ENHANCED_GRAYSCALE_IMAGE: bigint;
    /** Regions pre-detected as potentially relevant for further analysis. */
    IRUT_PREDETECTED_REGIONS: bigint;
    /** A binary (black and white) image. */
    IRUT_BINARY_IMAGE: bigint;
    /** Results from detecting textures within the image. */
    IRUT_TEXTURE_DETECTION_RESULT: bigint;
    /** A grayscale image with textures removed to enhance subject details like text or barcodes. */
    IRUT_TEXTURE_REMOVED_GRAYSCALE_IMAGE: bigint;
    /** A binary image with textures removed), useful for clear detection of subjects without background noise. */
    IRUT_TEXTURE_REMOVED_BINARY_IMAGE: bigint;
    /** Detected contours within the image), which can help in identifying shapes and objects. */
    IRUT_CONTOURS: bigint;
    /** Detected line segments), useful in structural analysis of the image content. */
    IRUT_LINE_SEGMENTS: bigint;
    /** Identified text zones), indicating areas with potential textual content. */
    IRUT_TEXT_ZONES: bigint;
    /** A binary image with text regions removed. */
    IRUT_TEXT_REMOVED_BINARY_IMAGE: bigint;
    /** Zones identified as potential barcode areas), aiding in focused barcode detection. */
    IRUT_CANDIDATE_BARCODE_ZONES: bigint;
    /** Barcodes that have been localized but not yet decoded. */
    IRUT_LOCALIZED_BARCODES: bigint;
    /** Barcode images scaled up for improved readability or decoding accuracy. */
    IRUT_SCALED_BARCODE_IMAGE: bigint;
    /** Images of barcodes processed to resist deformation and improve decoding success. */
    IRUT_DEFORMATION_RESISTED_BARCODE_IMAGE: bigint;
    /** Barcode images that have been complemented. */
    IRUT_COMPLEMENTED_BARCODE_IMAGE: bigint;
    /** Successfully decoded barcodes. */
    IRUT_DECODED_BARCODES: bigint;
    /** Detected long lines. */
    IRUT_LONG_LINES: bigint;
    /** Detected corners within the image. */
    IRUT_CORNERS: bigint;
    /** Candidate edges identified as potential components of quadrilaterals. */
    IRUT_CANDIDATE_QUAD_EDGES: bigint;
    /** Successfully detected quadrilaterals. */
    IRUT_DETECTED_QUADS: bigint;
    /** Text lines that have been localized in preparation for recognition. */
    IRUT_LOCALIZED_TEXT_LINES: bigint;
    /** Successfully recognized text lines. */
    IRUT_RECOGNIZED_TEXT_LINES: bigint;
    /** Successfully normalized images. */
    IRUT_DESKEWED_IMAGE: bigint;
    /** Successfully detected short lines. */
    IRUT_SHORT_LINES: bigint;
    IRUT_RAW_TEXT_LINES: bigint;
    /** Detected logic lines. */
    IRUT_LOGIC_LINES: bigint;
    IRUT_ENHANCED_IMAGE: bigint;
    /** A mask to select all types of intermediate results. */
    IRUT_ALL: bigint;
};
type EnumIntermediateResultUnitType = bigint;

declare enum EnumRegionObjectElementType {
    /** Corresponds to the `PredetectedRegionElement` subclass, representing areas within the image identified as potentially significant for further analysis before detailed processing. */
    ROET_PREDETECTED_REGION = 0,
    /** Corresponds to the `LocalizedBarcodeElement` subclass, indicating areas where barcodes have been localized within the image.*/
    ROET_LOCALIZED_BARCODE = 1,
    /** Corresponds to the `DecodedBarcodeElement` subclass, signifying barcodes that have not only been localized but also successfully decoded. */
    ROET_DECODED_BARCODE = 2,
    /** Corresponds to the `LocalizedTextLineElement` subclass, indicating lines of text that have been localized within the image. */
    ROET_LOCALIZED_TEXT_LINE = 3,
    /** Corresponds to the `RecognizedTextLineElement` subclass, referring to text lines that have been recognized. */
    ROET_RECOGNIZED_TEXT_LINE = 4,
    /** Corresponds to the `DetectedQuadElement` subclass, representing quadrilateral shapes detected within the image. */
    ROET_DETECTED_QUAD = 5,
    /** Corresponds to the `DeskewedImageElement` subclass, referring to images that have been deskewed. */
    ROET_DESKEWED_IMAGE = 6,
    /** Corresponds to the `SourceImageElement` subclass. */
    ROET_SOURCE_IMAGE = 7,
    /** Corresponds to the `TargetROIElement` subclass. */
    ROET_TARGET_ROI = 8,
    /** Corresponds to the `EnhancedImageElement` subclass, indicating images that have undergone enhancement for better clarity or detail, specifically in the context of enhanced image processing. */
    ROET_ENHANCED_IMAGE = 9
}

declare enum EnumSectionType {
    /** Indicates that no specific section type has been specified. */
    ST_NULL = 0,
    /** Corresponds to results generated in the "region prediction" section. */
    ST_REGION_PREDETECTION = 1,
    /** Corresponds to results generated in the "barcode localization" section. */
    ST_BARCODE_LOCALIZATION = 2,
    /** Corresponds to results generated in the "barcode decoding" section. */
    ST_BARCODE_DECODING = 3,
    /** Corresponds to results generated in the "text line localization" section. */
    ST_TEXT_LINE_LOCALIZATION = 4,
    /** Corresponds to results generated in the "text line recognition" section. */
    ST_TEXT_LINE_RECOGNITION = 5,
    /** Corresponds to results generated in the "document detection" section. */
    ST_DOCUMENT_DETECTION = 6,
    /** Corresponds to results generated in the "document deskewing" section. */
    ST_DOCUMENT_DESKEWING = 7,
    /** Corresponds to results generated in the "document enhancement" section. */
    ST_IMAGE_ENHANCEMENT = 8
}

declare enum EnumImageFileFormat {
    /** JPEG image format. */
    IFF_JPEG = 0,
    /** PNG image format. */
    IFF_PNG = 1,
    /** BMP (Bitmap) image format. */
    IFF_BMP = 2,
    /** PDF (Portable Document Format) format. */
    IFF_PDF = 3
}
type PathInfo = {
    version: string;
    path: string;
    isInternal?: boolean;
};
type DwtInfo = {
    resourcesPath?: string;
    serviceInstallerLocation?: string;
};
interface EngineResourcePaths {
    "rootDirectory"?: string;
    "std"?: string | PathInfo;
    "dip"?: string | PathInfo;
    "dnn"?: string | PathInfo;
    "core"?: string | PathInfo;
    "license"?: string | PathInfo;
    "cvr"?: string | PathInfo;
    "utility"?: string | PathInfo;
    "dbr"?: string | PathInfo;
    "dlr"?: string | PathInfo;
    "ddn"?: string | PathInfo;
    "dcp"?: string | PathInfo;
    "dce"?: string | PathInfo;
    "dcvData"?: string | PathInfo;
    "ddv"?: string | PathInfo;
    "dwt"?: string | DwtInfo;
    "dbrBundle"?: string | PathInfo;
    "dcvBundle"?: string | PathInfo;
}
interface InnerVersions {
    [key: string]: {
        worker?: string;
        wasm?: string;
    };
}
interface WasmVersions {
    "DIP"?: string;
    "DNN"?: string;
    "CORE"?: string;
    "LICENSE"?: string;
    "CVR"?: string;
    "UTILITY"?: string;
    "DBR"?: string;
    "DLR"?: string;
    "DDN"?: string;
    "DCP"?: string;
}
type WasmType = "baseline" | "ml" | "ml-simd" | "ml-simd-pthread" | "auto";
interface WasmLoadOptions {
    wasmType?: WasmType;
    pthreadPoolSize?: number;
}
declare const innerVersions: InnerVersions;
declare class CoreModule {
    static get engineResourcePaths(): EngineResourcePaths;
    static set engineResourcePaths(value: EngineResourcePaths);
    private static _bSupportDce4Module;
    static get bSupportDce4Module(): number;
    private static _bSupportIRTModule;
    static get bSupportIRTModule(): number;
    private static _versions;
    static get versions(): any;
    static get _onLog(): (message: string) => void;
    static set _onLog(value: (message: string) => void);
    static get _bDebug(): boolean;
    static set _bDebug(value: boolean);
    static _bundleEnv: "DCV" | "DBR";
    static get _workerName(): string;
    private static _wasmLoadOptions;
    static get wasmLoadOptions(): WasmLoadOptions;
    static set wasmLoadOptions(options: WasmLoadOptions);
    static loadedWasmType: Exclude<WasmType, "auto">;
    /**
     * Initiates the loading process for the .wasm file(s) corresponding to the specified module(s).
     * If a module relies on other modules, the other modules will be loaded as well.
     *
     * @returns A promise that resolves when the resources have been successfully released. It does not provide any value upon resolution.
     */
    static isModuleLoaded(name?: string): boolean;
    static loadWasm(): Promise<void>;
    /**
     * An event that fires during the loading of a WebAssembly module (.wasm).
     *
     * @param filePath The path of the wasm file.
     * @param tag Indicates the ongoing status of the file download ("starting", "in progress", "completed").
     * @param progress An object indicating the progress of the download, with `loaded` and `total` bytes.
     */
    static onWasmLoadProgressChanged: (filePath: string, tag: "starting" | "in progress" | "completed", progress: {
        loaded: number;
        total: number;
    }) => void;
    /**
     * Detect environment and get a report.
     */
    static detectEnvironment(): Promise<any>;
    /**
     * modify from https://gist.github.com/2107/5529665
     * @ignore
     */
    static browserInfo: any;
    static getModuleVersion(): Promise<WasmVersions>;
    static getVersion(): string;
    static enableLogging(): void;
    static disableLogging(): void;
    static cfd(count: number): Promise<void>;
}

interface ImageTag {
    /** The unique identifier of the image. */
    imageId: number;
    /** The type of the image. */
    type: EnumImageTagType;
}

interface DSImageData {
    /** The raw bytes of the image as a Uint8Array. */
    bytes: Uint8Array;
    /** The width of the image in pixels. */
    width: number;
    /** The height of the image in pixels. */
    height: number;
    /** The stride (or row width) of the image in bytes. */
    stride: number;
    /** The pixel format of the image. */
    format: EnumImagePixelFormat;
    /** An optional tag associated with the image data. */
    tag?: ImageTag;
}

interface CapturedResultItem {
    /** The type of the captured result item, indicating what kind of data it represents. */
    readonly type: EnumCapturedResultItemType;
    /** A property of type `CapturedResultItem` that represents a reference to another captured result item. */
    readonly referenceItem: CapturedResultItem | null;
    /** The name of the target ROI definition which includes a task that generated the result. */
    readonly targetROIDefName: string;
    /** The name of the task that generated the result. */
    readonly taskName: string;
}

interface OriginalImageResultItem extends CapturedResultItem {
    /** The image data associated with this result item. */
    imageData: DSImageData;
    /** Converts the image data into an HTMLCanvasElement for display or further manipulation in web applications. */
    toCanvas: () => HTMLCanvasElement;
    /** Converts the image data into an HTMLImageElement of a specified MIME type ('image/png' or 'image/jpeg'). */
    toImage: (MIMEType: "image/png" | "image/jpeg") => HTMLImageElement;
    /** Converts the image data into a Blob object of a specified MIME type ('image/png' or 'image/jpeg'). */
    toBlob: (MIMEType: "image/png" | "image/jpeg") => Promise<Blob>;
}

interface Point {
    /** The x-coordinate of the point. */
    x: number;
    /** The y-coordinate of the point. */
    y: number;
}

interface Contour {
    /** An array of `Point` objects defining the vertices of the contour. */
    points: Array<Point>;
}

interface LineSegment {
    /** The starting point of the line segment. */
    startPoint: Point;
    /** The ending point of the line segment. */
    endPoint: Point;
}

interface Corner {
    /** The type of the corner, represented by the enumeration EnumCornerType. */
    type: EnumCornerType;
    /** The point of intersection of the two lines forming the corner. */
    intersection: Point;
    /** The first line segment forming the corner. */
    line1: LineSegment;
    /** The second line segment forming the corner. */
    line2: LineSegment;
}

interface Rect {
    /** The x-coordinate of the rectangle's top-left corner. */
    x: number;
    /** The y-coordinate of the rectangle's top-left corner. */
    y: number;
    /** The width of the rectangle. */
    width: number;
    /** The height of the rectangle. */
    height: number;
    /** [Optional] Indicates if the rectangle's measurements are in percentages. */
    isMeasuredInPercentage?: boolean;
}

interface DSRect {
    /** The left coordinate of the rectangle. */
    left: number;
    /** The right coordinate of the rectangle. */
    right: number;
    /** The top coordinate of the rectangle. */
    top: number;
    /** The bottom coordinate of the rectangle. */
    bottom: number;
    /** Indicates if the rectangle's measurements are in percentages. */
    isMeasuredInPercentage?: boolean;
}

interface Edge {
    /** The starting corner of the edge. */
    startCorner: Corner;
    /** The ending corner of the edge. */
    endCorner: Corner;
}

interface ImageSourceErrorListener {
    /**
     * Called when an error is received from the image source.
     *
     * @param errorCode An enumeration value of type "EnumErrorCode" indicating the type of error.
     * @param errorMessage A C-style string containing the error message providing
     *                     additional information about the error.
     */
    onErrorReceived: (errorCode: EnumErrorCode, errorMessage: string) => void;
}

interface Quadrilateral {
    /** An array of four `Point` objects defining the vertices of the quadrilateral. */
    points: [Point, Point, Point, Point];
    /** The bounding rectangle of the quadrilateral, represented by a `DSRect` object. */
    boundingRect?: DSRect;
    /** The area of the quadrilateral. */
    area?: number;
}

interface DSFile extends File {
    /** Downloads the file in memory to the local drive via the browser. */
    download: () => void;
}

interface Warning {
    /** A unique identifier for the warning message. */
    id: number;
    /** The textual description of the warning. */
    message: string;
}

interface IntermediateResultUnit {
    /** A unique identifier for the intermediate result unit. */
    hashId: string;
    /** The hash ID of the original image associated with this unit. */
    originalImageHashId: string;
    /** The tag associated with the original image. */
    originalImageTag: ImageTag;
    /** The type of the intermediate result unit, defined by the enumeration `EnumIntermediateResultUnitType`. */
    unitType: EnumIntermediateResultUnitType;
}

interface BinaryImageUnit extends IntermediateResultUnit {
    /** The image data for the binary image. */
    imageData: DSImageData;
}

interface ColourImageUnit extends IntermediateResultUnit {
    /** The image data for the colour image. */
    imageData: DSImageData;
}

interface ContoursUnit extends IntermediateResultUnit {
    /** An array of `Contour` objects, each representing a series of points that outline a shape within the image. */
    contours: Array<Contour>;
}

interface EnhancedGrayscaleImageUnit extends IntermediateResultUnit {
    /** The image data for the enhanced grayscale image. */
    imageData: DSImageData;
}

interface GrayscaleImageUnit extends IntermediateResultUnit {
    /** The image data for the grayscale image. */
    imageData: DSImageData;
}

interface IntermediateResult {
    /** An array of `IntermediateResultUnit` objects, each representing a different type of intermediate result. */
    intermediateResultUnits: Array<IntermediateResultUnit>;
}

interface IntermediateResultExtraInfo {
    /** The property indicates the name of the `TargetROIDef` object that generates the intermediate result. */
    targetROIDefName: string;
    /** The name of the processing task to which this result belongs. */
    taskName: string;
    /** Indicates whether the result is at the section level. */
    isSectionLevelResult: boolean;
    /** The type of section, if applicable, as defined by the enumeration `EnumSectionType`. */
    sectionType: EnumSectionType;
}

interface LineSegmentsUnit extends IntermediateResultUnit {
    /** An array of `LineSegment` objects, each representing a segment of a line detected within the image. */
    lineSegments: Array<LineSegment>;
}

interface RegionObjectElement {
    /** The location of the region object, represented as a quadrilateral. */
    location: Quadrilateral;
    /** A reference to another `RegionObjectElement`. */
    referencedElement: RegionObjectElement;
    /** The type of the region object element, defined by the enumeration EnumRegionObjectElementType. */
    elementType: EnumRegionObjectElementType;
    /**The image data for the `RegionObjectElement`. */
    imageData: DSImageData;
}

interface PredetectedRegionElement extends RegionObjectElement {
    /** The name of the detection mode used to detect this region element. */
    modeName: string;
    /** The ID of the label associated with this region element. */
    labelID: number;
    /** The name of the label associated with this region element. */
    labelName: string;
}

interface PredetectedRegionsUnit extends IntermediateResultUnit {
    /** An array of `PredetectedRegionElement` objects, each representing a pre-detected region detected within the image. */
    predetectedRegions: Array<PredetectedRegionElement>;
}

interface ScaledColourImageUnit extends IntermediateResultUnit {
    /** The image data for the scaled colour image. */
    imageData: DSImageData;
}

interface ShortLinesUnit extends IntermediateResultUnit {
    /** An array of `LineSegment` objects, each representing a short line detected within the image. */
    shortLines: Array<LineSegment>;
}

interface TextRemovedBinaryImageUnit extends IntermediateResultUnit {
    /** The image data for the text-removed binary image. */
    imageData: DSImageData;
}

interface TextureDetectionResultUnit extends IntermediateResultUnit {
    /** This value represents the detected horizontal distance in pixels between consecutive texture patterns, providing an indication of the texture's density and orientation within the image. */
    xSpacing: number;
    /**
     * The spacing between texture stripes in the y-direction. Similar to `xSpacing`, this value measures the vertical distance between texture patterns.
     * It offers insights into the vertical density and alignment of the texture within the image, contributing to the understanding of the texture's characteristics and spatial distribution.
     */
    ySpacing: number;
}

interface TextureRemovedBinaryImageUnit extends IntermediateResultUnit {
    /** The image data for the texture-removed binary image. */
    imageData: DSImageData;
}

interface TextureRemovedGrayscaleImageUnit extends IntermediateResultUnit {
    /** The image data for the texture-removed grayscale image. */
    imageData: DSImageData;
}

interface TextZone {
    /** The location of the text zone. */
    location: Quadrilateral;
    /** The indices of the character contours. */
    charContoursIndices: Array<number>;
}

interface TextZonesUnit extends IntermediateResultUnit {
    /** An array of `TextZone` objects, each representing the geometric boundaries of a detected text zone within the image. */
    textZones: Array<TextZone>;
}

interface TransformedGrayscaleImageUnit extends IntermediateResultUnit {
    /** The image data for the transformed grayscale image. */
    imageData: DSImageData;
}

/**
 * The `ObservationParameters` interface represents an object used to configure intermediate result observation.
 */
interface ObservationParameters {
    /**
     * Sets the types of intermediate result units that are observed.
     * @param types The types of intermediate result units to observe.
     * @returns A promise that resolves when the types have been successfully set. It does not provide any value upon resolution.
     */
    setObservedResultUnitTypes: (types: bigint) => void;
    /**
     * Retrieves the types of intermediate result units that are observed.
     * @returns A promise that resolves with a number that represents the types that are observed.
     */
    getObservedResultUnitTypes: () => bigint;
    /**
     * Determines whether the specified result unit type is observed.
     * @param type The result unit type to check.
     * @returns Boolean indicating whether the result unit type is observed.
     */
    isResultUnitTypeObserved: (type: EnumIntermediateResultUnitType) => boolean;
    /**
     * Adds an observed task by its name.
     * @param taskName The name of the task.
     */
    addObservedTask: (taskName: string) => void;
    /**
     * Removes an observed task by its name.
     * @param taskName The name of the task.
     */
    removeObservedTask: (taskName: string) => void;
    /**
     * Determines whether the specified task is observed.
     * @param taskName The name of the task.
     * @returns Boolean indicating whether the task is observed.
     */
    isTaskObserved: (taskName: string) => boolean;
}

interface CapturedResultBase {
    /** Error code associated with the capture result. */
    readonly errorCode: number;
    /** Error string providing details about the error. */
    readonly errorString: string;
    /** The hash ID of the original image. */
    readonly originalImageHashId: string;
    /** The tag associated with the original image. */
    readonly originalImageTag: ImageTag;
}

interface ErrorInfo {
    errorCode: EnumErrorCode;
    errorString: string;
}

declare abstract class ImageSourceAdapter {
    #private;
    /**
     * @ignore
     */
    static _onLog: (message: any) => void;
    /**
     * @ignore
     */
    get _isFetchingStarted(): boolean;
    constructor();
    abstract hasNextImageToFetch(): boolean;
    /**
     * @brief Sets the error listener for the image source.
     *
     * This function allows you to set an error listener object that will receive
     * notifications when errors occur during image source operations.
     * If an error occurs, the error information will be passed to the listener's
     * OnErrorReceived method.
     *
     * @param listener An instance of ImageSourceErrorListener or its
     *                 derived class, which will handle error notifications.
     */
    setErrorListener(listener: ImageSourceErrorListener): void;
    /**
     * Adds an image to the internal buffer.
     *
     * @param image An instance of `DSImageData` containing the image to buffer.
     */
    addImageToBuffer(image: DSImageData): void;
    /**
     * Retrieves a buffered image, of type `DSImageData`.
     *
     * This function retrieves the latest image added to the buffer, and removes it from the buffer in the process.
     *
     * @returns A `DSImageData` object retrieved from the buffer which contains the image data of the frame and related information.
     */
    getImage(): DSImageData;
    /**
     * Sets the processing priority of a specific image. This can affect the order in which images are returned by getImage.
     *
     * @param imageId The ID of the image to prioritize.
     * @param keepInBuffer [Optional] Boolean indicating whether to keep the image in the buffer after it has been returned.
     */
    setNextImageToReturn(imageId: number, keepInBuffer?: boolean): void;
    /**
     * @ignore
     */
    _resetNextReturnedImage(): void;
    /**
     * Checks if an image with the specified ID is present in the buffer.
     *
     * @param imageId The ID of the image to check.
     *
     * @returns Boolean indicating whether the image is present in the buffer.
     */
    hasImage(imageId: number): boolean;
    /**
     * Starts the process of fetching images.
     */
    startFetching(): void;
    /**
     * Stops the process of fetching images.
     * to false, indicating that image fetching has been halted.
     */
    stopFetching(): void;
    /**
     * Sets the maximum number of images that can be buffered at any time. Implementing classes should attempt to keep the buffer within this limit.
     *
     * @param count The maximum number of images the buffer can hold.
     */
    setMaxImageCount(count: number): void;
    /**
     * Retrieves the maximum number of images that can be buffered.
     *
     * @returns The maximum image count for the buffer.
     */
    getMaxImageCount(): number;
    /**
     * Retrieves the current number of images in the buffer.
     *
     * @returns The current image count in the buffer.
     */
    getImageCount(): number;
    /**
     * Clears all images from the buffer, resetting the state for new image fetching.
     */
    clearBuffer(): void;
    /**
     * Determines whether the buffer is currently empty.
     *
     * @returns Boolean indicating whether the buffer is empty.
     */
    isBufferEmpty(): boolean;
    /**
     * Sets the behavior for handling new incoming images when the buffer is full. Implementations should adhere to the specified mode to manage buffer overflow.
     *
     * @param mode One of the modes defined in EnumBufferOverflowProtectionMode, specifying how to handle buffer overflow.
     */
    setBufferOverflowProtectionMode(mode: EnumBufferOverflowProtectionMode): void;
    /**
     * Retrieves the current mode for handling buffer overflow.
     *
     * @returns The current buffer overflow protection mode.
     */
    getBufferOverflowProtectionMode(): EnumBufferOverflowProtectionMode;
    /**
     * Sets the usage type for color channels in images.
     *
     * @param type One of the types defined in EnumColourChannelUsageType, specifying how color channels should be used.
     */
    setColourChannelUsageType(type: EnumColourChannelUsageType): void;
    /**
     * Retrieves the current mode for handling buffer overflow.
     *
     * @returns The current buffer overflow protection mode.
     */
    getColourChannelUsageType(): EnumColourChannelUsageType;
}
/**
 * Judge is the input is a {@link DSImageData} object.
 * @param value
 * @returns
 * @ignore
 */
declare const isDSImageData: (value: any) => value is DSImageData;
/**
 * Judge is the input is a {@link DSRect} object.
 * @param value
 * @returns
 * @ignore
 */
declare const isDSRect: (value: any) => value is DSRect;
/**
 * Judge is the input is a {@link Point} object.
 * @param value
 * @returns
 * @ignore
 */
declare const isPoint: (value: any) => value is Point;
/**
 * Judge is the input is a {@link Quadrilateral} object.
 * @param value
 * @returns
 * @ignore
 */
declare const isQuad: (value: any) => value is Quadrilateral;
declare const handleEngineResourcePaths: (engineResourcePaths: EngineResourcePaths) => EngineResourcePaths;






interface CapturedResult extends CapturedResultBase {
    /** An array of `CapturedResultItem` objects representing the captured result items. */
    items: Array<CapturedResultItem>;
    /** The decoded barcode results within the original image. */
    decodedBarcodesResult?: DecodedBarcodesResult;
    /** The recognized textLine results within the original image. */
    recognizedTextLinesResult?: RecognizedTextLinesResult;
    /** The processed document results within the original image. */
    processedDocumentResult?: ProcessedDocumentResult;
    /** The parsed results within the original image. */
    parsedResult?: ParsedResult;
}

declare class CapturedResultReceiver {
    /**
     * Event triggered when a generic captured result is available, occurring each time an image finishes its processing.
     * This event can be used for any result that does not fit into the specific categories of the other callback events.
     * @param result The captured result, an instance of `CapturedResult`.
     */
    onCapturedResultReceived?: (result: CapturedResult) => void;
    /**
     * Event triggered when the original image result is available.
     * This event is used to handle the original image captured by an image source such as Dynamsoft Camera Enhancer.
     * @param result The original image result, an instance of `OriginalImageResultItem`.
     */
    onOriginalImageResultReceived?: (result: OriginalImageResultItem) => void;
    onDecodedBarcodesReceived?: (result: DecodedBarcodesResult) => void;
    onRecognizedTextLinesReceived?: (result: RecognizedTextLinesResult) => void;
    onProcessedDocumentResultReceived?: (result: ProcessedDocumentResult) => void;
    onParsedResultsReceived?: (result: ParsedResult) => void;
}

declare class BufferedItemsManager {
    private _cvr;
    constructor(cvr: any);
    /**
     * Gets the maximum number of buffered items.
     * @returns Returns the maximum number of buffered items.
     */
    getMaxBufferedItems(): Promise<number>;
    /**
     * Sets the maximum number of buffered items.
     * @param count the maximum number of buffered items
     */
    setMaxBufferedItems(count: number): Promise<void>;
    /**
     * Gets the buffered character items.
     * @return the buffered character items
     */
    getBufferedCharacterItemSet(): Promise<Array<BufferedCharacterItemSet>>;
}

declare class IntermediateResultReceiver {
    private _observedResultUnitTypes;
    private _observedTaskMap;
    private _parameters;
    /**
     * Gets the observed parameters of the intermediate result receiver. Allowing for configuration of intermediate result observation.
     * @return The observed parameters, of type ObservationParameters. The default parameters are to observe all intermediate result unit types and all tasks.
     */
    getObservationParameters(): ObservationParameters;
    onTaskResultsReceived?: (result: IntermediateResult, info: IntermediateResultExtraInfo) => void;
    onPredetectedRegionsReceived?: (result: PredetectedRegionsUnit, info: IntermediateResultExtraInfo) => void;
    onTargetROIResultsReceived?: (result: IntermediateResultUnit, info: IntermediateResultExtraInfo) => void;
    onColourImageUnitReceived?: (result: ColourImageUnit, info: IntermediateResultExtraInfo) => void;
    onScaledColourImageUnitReceived?: (result: ScaledColourImageUnit, info: IntermediateResultExtraInfo) => void;
    onGrayscaleImageUnitReceived?: (result: GrayscaleImageUnit, info: IntermediateResultExtraInfo) => void;
    onTransformedGrayscaleImageUnitReceived?: (result: TransformedGrayscaleImageUnit, info: IntermediateResultExtraInfo) => void;
    onEnhancedGrayscaleImageUnitReceived?: (result: EnhancedGrayscaleImageUnit, info: IntermediateResultExtraInfo) => void;
    onBinaryImageUnitReceived?: (result: BinaryImageUnit, info: IntermediateResultExtraInfo) => void;
    onTextureDetectionResultUnitReceived?: (result: TextureDetectionResultUnit, info: IntermediateResultExtraInfo) => void;
    onTextureRemovedGrayscaleImageUnitReceived?: (result: TextureRemovedGrayscaleImageUnit, info: IntermediateResultExtraInfo) => void;
    onTextureRemovedBinaryImageUnitReceived?: (result: TextureRemovedBinaryImageUnit, info: IntermediateResultExtraInfo) => void;
    onContoursUnitReceived?: (result: ContoursUnit, info: IntermediateResultExtraInfo) => void;
    onLineSegmentsUnitReceived?: (result: LineSegmentsUnit, info: IntermediateResultExtraInfo) => void;
    onTextZonesUnitReceived?: (result: TextZonesUnit, info: IntermediateResultExtraInfo) => void;
    onTextRemovedBinaryImageUnitReceived?: (result: TextRemovedBinaryImageUnit, info: IntermediateResultExtraInfo) => void;
    onShortLinesUnitReceived?: (result: ShortLinesUnit, info: IntermediateResultExtraInfo) => void;
    onCandidateBarcodeZonesUnitReceived?: (result: CandidateBarcodeZonesUnit, info: IntermediateResultExtraInfo) => void;
    onComplementedBarcodeImageUnitReceived?: (result: ComplementedBarcodeImageUnit, info: IntermediateResultExtraInfo) => void;
    onDecodedBarcodesReceived?: (result: DecodedBarcodesUnit, info: IntermediateResultExtraInfo) => void;
    onDeformationResistedBarcodeImageUnitReceived?: (result: DeformationResistedBarcodeImageUnit, info: IntermediateResultExtraInfo) => void;
    onLocalizedBarcodesReceived?: (result: LocalizedBarcodesUnit, info: IntermediateResultExtraInfo) => void;
    onScaledBarcodeImageUnitReceived?: (result: ScaledBarcodeImageUnit, info: IntermediateResultExtraInfo) => void;
    onLocalizedTextLinesReceived?: (result: LocalizedTextLinesUnit, info: IntermediateResultExtraInfo) => void;
    onRawTextLinesUnitReceived?: (result: RawTextLinesUnit, info: IntermediateResultExtraInfo) => void;
    onRecognizedTextLinesReceived?: (result: RecognizedTextLinesUnit, info: IntermediateResultExtraInfo) => void;
    onCandidateQuadEdgesUnitReceived?: (result: CandidateQuadEdgesUnit, info: IntermediateResultExtraInfo) => void;
    onCornersUnitReceived?: (result: CornersUnit, info: IntermediateResultExtraInfo) => void;
    onDeskewedImageReceived?: (result: DeskewedImageUnit, info: IntermediateResultExtraInfo) => void;
    onDetectedQuadsReceived?: (result: DetectedQuadsUnit, info: IntermediateResultExtraInfo) => void;
    onEnhancedImageReceived?: (result: EnhancedImageUnit, info: IntermediateResultExtraInfo) => void;
    onLogicLinesUnitReceived?: (result: LogicLinesUnit, info: IntermediateResultExtraInfo) => void;
    onLongLinesUnitReceived?: (result: LongLinesUnit, info: IntermediateResultExtraInfo) => void;
}

declare class IntermediateResultManager {
    private _cvr;
    private _irrRegistryState;
    _intermediateResultReceiverSet: Set<IntermediateResultReceiver>;
    constructor(cvr: any);
    /**
     * Adds a `IntermediateResultReceiver` object as the receiver of intermediate results.
     * @param receiver The receiver object, of type `IntermediateResultReceiver`.
     */
    addResultReceiver(receiver: IntermediateResultReceiver): Promise<void>;
    /**
     * Removes the specified `IntermediateResultReceiver` object.
     * @param receiver The receiver object, of type `IntermediateResultReceiver`.
     */
    removeResultReceiver(receiver: IntermediateResultReceiver): Promise<void>;
    /**
     * Retrieves the original image data.
     *
     * @returns A promise that resolves when the operation has successfully completed. It provides the original image upon resolution.
     */
    getOriginalImage(): DSImageData;
}

declare enum EnumImageSourceState {
    /**
     * Indicates that the buffer of the image source is currently empty.
     */
    ISS_BUFFER_EMPTY = 0,
    /**
    * Signifies that the source for the image source has been depleted.
    */
    ISS_EXHAUSTED = 1
}

interface ImageSourceStateListener {
    /**
     * Event triggered whenever there is a change in the image source's state.
     * @param status This parameter indicates the current status of the image source, using the `EnumImageSourceState` type.
     * This enumeration defines various possible states of an image source.
     */
    onImageSourceStateReceived?: (status: EnumImageSourceState) => void;
}

interface SimplifiedCaptureVisionSettings {
    /**
     * Specifies weather to output the original image.
     */
    outputOriginalImage: boolean;
    /**
     * Designates the region of interest (ROI) within an image, limiting the image processing activities exclusively to this specified area. It is of type `Quadrilateral`.
     */
    roi: Quadrilateral;
    /**
     * Determines if the coordinates for the region of interest (ROI) are expressed in percentage terms (true) or as exact pixel measurements (false).
     */
    roiMeasuredInPercentage: boolean;
    /**
     * Specifies the timeout duration for processing an image, in milliseconds.
     */
    timeout: number;
    /**
     * Specifies the shortest time span, in milliseconds, that must elapse between two successive image captures. Opting for a higher interval decreases capture frequency, which can lower the system's processing load and conserve energy. On the other hand, a smaller interval value increases the frequency of image captures, enhancing the system's responsiveness.
     * @remarks Handling of Special Values:
     *   -1: This value ensures the image source waits until processing of the current image is complete before starting to acquire the next one. This approach ensures there is a deliberate pause between processing consecutive images.
     *   0 (The default setting): Adopting this value means the image source queues up the next image for immediate availability once processing of the current image is finished, facilitating continuous, uninterrupted image processing.
     */
    minImageCaptureInterval: number;
    /**
     * Specifies the basic settings for the barcode reader module. It is of type `SimplifiedBarcodeReaderSettings`.
     */
    barcodeSettings: SimplifiedBarcodeReaderSettings;
    /**
     * Specifies the basic settings for the document normalizer module. It is of type `SimplifiedDocumentNormalizerSettings`.
     */
    documentSettings: SimplifiedDocumentNormalizerSettings;
    /**
     * Specifies the basic settings for the label recognizer module. It is of type `SimplifiedLabelRecognizerSettings`.
     */
    labelSettings: SimplifiedLabelRecognizerSettings;
}

interface CapturedResultFilter {
    onOriginalImageResultReceived?: (result: OriginalImageResultItem) => void;
    onDecodedBarcodesReceived?: (result: DecodedBarcodesResult) => void;
    onRecognizedTextLinesReceived?: (result: RecognizedTextLinesResult) => void;
    onProcessedDocumentResultReceived?: (result: ProcessedDocumentResult) => void;
    onParsedResultsReceived?: (result: ParsedResult) => void;
    getFilteredResultItemTypes(): number;
}

declare class CaptureVisionRouter {
    #private;
    static _onLog: (message: string) => void;
    static _defaultTemplate: string;
    private static _isNoOnnx;
    /**
     * The maximum length of the longer side of the image to be processed. The default value is 2048 pixels in mobile devices and 4096 pixels in desktop browser.
     */
    maxImageSideLength: number;
    /**
    * An event that fires during the loading of a recognition data file (.data).
    * @param filePath The path of the recognition data file.
    * @param tag Indicates the ongoing status of the file download ("starting", "in progress", "completed").
    * @param progress An object indicating the progress of the download, with `loaded` and `total` bytes.
    */
    static onDataLoadProgressChanged: (filePath: string, tag: "starting" | "in progress" | "completed", progress: {
        loaded: number;
        total: number;
    }) => void;
    /**
     * An event that fires when an error occurs from the start of capturing process.
     * @param error The error object that contains the error code and error string.
     */
    onCaptureError: (error: Error) => void;
    _instanceID: number;
    private _dsImage;
    private _loopReadVideoTimeoutId;
    private _isPauseScan;
    private _isOutputOriginalImage;
    private _templateName;
    private _isOpenDetectVerify;
    private _isOpenNormalizeVerify;
    private _isOpenBarcodeVerify;
    private _isOpenLabelVerify;
    private _minImageCaptureInterval;
    private _averageProcessintTimeArray;
    private _averageFetchImageTimeArray;
    private _currentSettings;
    private _averageTime;
    private _dynamsoft;
    /**
     * Returns whether the `CaptureVisionRouter` instance has been disposed of.
     *
     * @returns Boolean indicating whether the `CaptureVisionRouter` instance has been disposed of.
     */
    get disposed(): boolean;
    /**
     * Initializes a new instance of the `CaptureVisionRouter` class.
     *
     * @returns A promise that resolves with the initialized `CaptureVisionRouter` instance.
     */
    static createInstance(loadPresetTemplates?: boolean): Promise<CaptureVisionRouter>;
    /**
     * Appends a deep learning model to the memory buffer.
     * @param dataName Specifies the name of the model.
     * @param dataPath [Optional] Specifies the path to find the model file. If not specified, the default path points to the package "dynamsoft-capture-vision-data".
     *
     * @returns A promise that resolves once the model file is successfully loaded. It does not provide any value upon resolution.
     */
    static appendDLModelBuffer(modelName: string, dataPath?: string): Promise<ErrorInfo>;
    /**
     * Clears all deep learning models from buffer to free up memory
     */
    static clearDLModelBuffers(): Promise<void>;
    private _singleFrameModeCallback;
    private _singleFrameModeCallbackBind;
    /**
     * Sets up an image source to provide images for continuous processing.
     * @param imageSource The image source which is compliant with the `ImageSourceAdapter` interface.
     */
    setInput(imageSource: ImageSourceAdapter): void;
    /**
     * Returns the image source object.
     */
    getInput(): ImageSourceAdapter;
    /**
     * Adds listeners for image source state change.
     */
    addImageSourceStateListener(listener: ImageSourceStateListener): void;
    /**
     * Removes listeners for image source state change.
     */
    removeImageSourceStateListener(listener: ImageSourceStateListener): boolean;
    /**
     * Adds a `CapturedResultReceiver` object as the receiver of captured results.
     * @param receiver The receiver object, of type `CapturedResultReceiver`.
     */
    addResultReceiver(receiver: CapturedResultReceiver): void;
    /**
     * Removes the specified `CapturedResultReceiver` object.
     * @param receiver The receiver object, of type `CapturedResultReceiver`.
     */
    removeResultReceiver(receiver: CapturedResultReceiver): void;
    private _setCrrRegistry;
    /**
     * Adds a `MultiFrameResultCrossFilter` object to filter non-essential results.
     * @param filter The filter object, of type `MultiFrameResultCrossFilter`.
     *
     * @returns A promise that resolves when the operation has successfully completed. It does not provide any value upon resolution.
     */
    addResultFilter(filter: CapturedResultFilter): Promise<void>;
    /**
     * Removes the specified `MultiFrameResultCrossFilter` object.
     * @param filter The filter object, of type `MultiFrameResultCrossFilter`.
     *
     * @returns A promise that resolves when the operation has successfully completed. It does not provide any value upon resolution.
     */
    removeResultFilter(filter: CapturedResultFilter): Promise<void>;
    private _handleFilterUpdate;
    /**
     * Initiates a capturing process based on a specified template. This process is repeated for each image fetched from the source.
     * @param templateName [Optional] Specifies a "CaptureVisionTemplate" to use.
     *
     * @returns A promise that resolves when the capturing process has successfully started. It does not provide any value upon resolution.
     */
    startCapturing(templateName: string): Promise<void>;
    /**
     * Stops the capturing process.
     */
    stopCapturing(): void;
    containsTask(templateName: string): Promise<any>;
    /**
     * Switches the currently active capturing template during the image processing workflow. This allows dynamic reconfiguration of the capture process without restarting or reinitializing the system, enabling different settings or rules to be applied on the fly.
     *
     * @param templateName The name of the new capturing template to apply.
     *
     * @return A promise with an ErrorInfo object that resolves when the operation has completed, containing the result of the operation.
     *
     */
    switchCapturingTemplate(templateName: string): Promise<void>;
    /**
     * Video stream capture, recursive call, loop frame capture
     */
    private _loopReadVideo;
    private _reRunCurrnetFunc;
    getClarity(dsimage: DSImageData, bitcount: number, wr: number, hr: number, grayThreshold: number): Promise<number>;
    /**
     * Processes a single image or a file containing a single image to derive important information.
     * @param imageOrFile Specifies the image or file to be processed. The following data types are accepted: `Blob`, `HTMLImageElement`, `HTMLCanvasElement`, `HTMLVideoElement`, `DSImageData`, `string`.
     * @param templateName [Optional] Specifies a "CaptureVisionTemplate" to use.
     *
     * @returns A promise that resolves with a `CapturedResult` object which contains the derived information from the image processed.
     */
    capture(imageOrFile: Blob | string | DSImageData | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, templateName?: string): Promise<CapturedResult>;
    private _captureDsimage;
    private _captureUrl;
    private _captureBase64;
    private _captureBlob;
    private _captureImage;
    private _captureCanvas;
    private _captureVideo;
    private _captureInWorker;
    /**
     * Configures runtime settings using a provided JSON string, an object, or a URL pointing to an object, which contains settings for one or more `CaptureVisionTemplates`.
     * @param settings A JSON string, an object, or a URL pointing to an object that contains settings for one or more `CaptureVisionTemplates`.
     *
     * @returns A promise that resolves when the operation has completed. It provides an object that describes the result.
     */
    initSettings(settings: string | object): Promise<ErrorInfo>;
    /**
     * Returns an object that contains settings for the specified `CaptureVisionTemplate`.
     * @param templateName Specifies a `CaptureVisionTemplate` by its name. If passed "*", the returned object will contain all templates.
     *
     * @returns A promise that resolves with the object that contains settings for the specified template or all templates.
     */
    outputSettings(templateName?: string, includeDefaultValues?: boolean): Promise<any>;
    /**
     * Generates a Blob object or initiates a JSON file download containing the settings for the specified `CaptureVisionTemplate`.
     * @param templateName Specifies a `CaptureVisionTemplate` by its name. If passed "*", the returned object will contain all templates.
     * @param fileName Specifies the name of the file.
     * @param download Boolean that specifies whether to initiates a file download.
     *
     * @returns A promise that resolves with the Blob object that contains settings for the specified template or all templates.
     */
    outputSettingsToFile(templateName: string, fileName: string, download?: boolean, includeDefaultValues?: boolean): Promise<Blob>;
    /** Get all parameter template names.
     *
     * @returns A promise that resolves with an array of template names.
     */
    getTemplateNames(): Promise<Array<string>>;
    /**
     * Retrieves a JSON object that contains simplified settings for the specified `CaptureVisionTemplate`.
     * @param templateName Specifies a `CaptureVisionTemplate` by its name.
     *
     * @returns A promise that resolves with a JSON object, of type `SimplifiedCaptureVisionSettings`, which represents the simplified settings for the specified template.
     * @remarks If the settings of the specified template are too complex, we cannot create a SimplifiedCaptureVisionSettings, and as a result, it will return an error.
     */
    getSimplifiedSettings(templateName: string): Promise<SimplifiedCaptureVisionSettings>;
    /**
     * Updates the specified `CaptureVisionTemplate` with an updated `SimplifiedCaptureVisionSettings` object.
     * @param templateName Specifies a `CaptureVisionTemplate` by its name.
     * @param settings The `SimplifiedCaptureVisionSettings` object that contains updated settings.
     *
     * @returns A promise that resolves when the operation has completed. It provides an object that describes the result.
     */
    updateSettings(templateName: string, settings: SimplifiedCaptureVisionSettings): Promise<ErrorInfo>;
    /**
     * Restores all runtime settings to their original default values.
     *
     * @returns A promise that resolves when the operation has completed. It provides an object that describes the result.
     */
    resetSettings(): Promise<ErrorInfo>;
    /**
     * Returns an object, of type `BufferedItemsManager`, that manages buffered items.
     * @returns The `BufferedItemsManager` object.
     */
    getBufferedItemsManager(): BufferedItemsManager;
    /**
     * Returns an object, of type `IntermediateResultManager`, that manages intermediate results.
     *
     * @returns The `IntermediateResultManager` object.
     */
    getIntermediateResultManager(): IntermediateResultManager;
    /**
     * Sets the global number of threads used internally for model execution.
     * @param intraOpNumThreads Number of threads used internally for model execution.
     */
    static setGlobalIntraOpNumThreads(intraOpNumThreads?: number): Promise<void>;
    parseRequiredResources(templateName: string): Promise<{
        models: string[];
        specss: string[];
    }>;
    /**
     * Releases all resources used by the `CaptureVisionRouter` instance.
     *
     * @returns A promise that resolves when the resources have been successfully released. It does not provide any value upon resolution.
     */
    dispose(): Promise<void>;
    /**
    * For Debug
    */
    private _getInternalData;
    private _getWasmFilterState;
}

declare class CaptureVisionRouterModule {
    private static _version;
    /**
     * Returns the version of the CaptureVisionRouter module.
     */
    static getVersion(): string;
}

declare const EnumBarcodeFormat: {
    /**No barcode format in BarcodeFormat*/
    BF_NULL: bigint;
    /**All supported formats in BarcodeFormat*/
    BF_ALL: bigint;
    /**Use the default barcode format settings*/
    BF_DEFAULT: bigint;
    /**Combined value of BF_CODABAR, BF_CODE_128, BF_CODE_39, BF_CODE_39_Extended, BF_CODE_93, BF_EAN_13, BF_EAN_8, INDUSTRIAL_25, BF_ITF, BF_UPC_A, BF_UPC_E, BF_MSI_CODE;  */
    BF_ONED: bigint;
    /**Combined value of BF_GS1_DATABAR_OMNIDIRECTIONAL, BF_GS1_DATABAR_TRUNCATED, BF_GS1_DATABAR_STACKED, BF_GS1_DATABAR_STACKED_OMNIDIRECTIONAL, BF_GS1_DATABAR_EXPANDED, BF_GS1_DATABAR_EXPANDED_STACKED, BF_GS1_DATABAR_LIMITED*/
    BF_GS1_DATABAR: bigint;
    /**Code 39 */
    BF_CODE_39: bigint;
    /**Code 128 */
    BF_CODE_128: bigint;
    /**Code 93 */
    BF_CODE_93: bigint;
    /**Codabar */
    BF_CODABAR: bigint;
    /**Interleaved 2 of 5 */
    BF_ITF: bigint;
    /**EAN-13 */
    BF_EAN_13: bigint;
    /**EAN-8 */
    BF_EAN_8: bigint;
    /**UPC-A */
    BF_UPC_A: bigint;
    /**UPC-E */
    BF_UPC_E: bigint;
    /**Industrial 2 of 5 */
    BF_INDUSTRIAL_25: bigint;
    /**CODE39 Extended */
    BF_CODE_39_EXTENDED: bigint;
    /**GS1 Databar Omnidirectional*/
    BF_GS1_DATABAR_OMNIDIRECTIONAL: bigint;
    /**GS1 Databar Truncated*/
    BF_GS1_DATABAR_TRUNCATED: bigint;
    /**GS1 Databar Stacked*/
    BF_GS1_DATABAR_STACKED: bigint;
    /**GS1 Databar Stacked Omnidirectional*/
    BF_GS1_DATABAR_STACKED_OMNIDIRECTIONAL: bigint;
    /**GS1 Databar Expanded*/
    BF_GS1_DATABAR_EXPANDED: bigint;
    /**GS1 Databar Expaned Stacked*/
    BF_GS1_DATABAR_EXPANDED_STACKED: bigint;
    /**GS1 Databar Limited*/
    BF_GS1_DATABAR_LIMITED: bigint;
    /**Patch code. */
    BF_PATCHCODE: bigint;
    /**PDF417 */
    BF_CODE_32: bigint;
    /**PDF417 */
    BF_PDF417: bigint;
    /**QRCode */
    BF_QR_CODE: bigint;
    /**DataMatrix */
    BF_DATAMATRIX: bigint;
    /**AZTEC */
    BF_AZTEC: bigint;
    /**MAXICODE */
    BF_MAXICODE: bigint;
    /**Micro QR Code*/
    BF_MICRO_QR: bigint;
    /**Micro PDF417*/
    BF_MICRO_PDF417: bigint;
    /**GS1 Composite Code*/
    BF_GS1_COMPOSITE: bigint;
    /**MSI Code*/
    BF_MSI_CODE: bigint;
    BF_CODE_11: bigint;
    BF_TWO_DIGIT_ADD_ON: bigint;
    BF_FIVE_DIGIT_ADD_ON: bigint;
    BF_MATRIX_25: bigint;
    /**Combined value of BF2_USPSINTELLIGENTMAIL, BF2_POSTNET, BF2_PLANET, BF2_AUSTRALIANPOST, BF2_RM4SCC.*/
    BF_POSTALCODE: bigint;
    /**Nonstandard barcode */
    BF_NONSTANDARD_BARCODE: bigint;
    /**USPS Intelligent Mail.*/
    BF_USPSINTELLIGENTMAIL: bigint;
    /**Postnet.*/
    BF_POSTNET: bigint;
    /**Planet.*/
    BF_PLANET: bigint;
    /**Australian Post.*/
    BF_AUSTRALIANPOST: bigint;
    /**Royal Mail 4-State Customer Barcode.*/
    BF_RM4SCC: bigint;
    /**KIX.*/
    BF_KIX: bigint;
    /**DotCode.*/
    BF_DOTCODE: bigint;
    /**_PHARMACODE_ONE_TRACK.*/
    BF_PHARMACODE_ONE_TRACK: bigint;
    /**PHARMACODE_TWO_TRACK.*/
    BF_PHARMACODE_TWO_TRACK: bigint;
    /**PHARMACODE.*/
    BF_PHARMACODE: bigint;
    /**Telepen*/
    BF_TELEPEN: bigint;
    /**Telepen Numeric. A variation of the Telepen format optimized for encoding numeric data only.*/
    BF_TELEPEN_NUMERIC: bigint;
};
type EnumBarcodeFormat = bigint;

declare enum EnumExtendedBarcodeResultType {
    /**Specifies the standard text. This means the barcode value. */
    EBRT_STANDARD_RESULT = 0,
    /**Specifies all the candidate text. This means all the standard text results decoded from the barcode. */
    EBRT_CANDIDATE_RESULT = 1,
    /**Specifies the partial text. This means part of the text result decoded from the barcode. */
    EBRT_PARTIAL_RESULT = 2
}

interface BarcodeDetails {
}

interface BarcodeResultItem extends CapturedResultItem {
    /** The format of the decoded barcode, as defined by `EnumBarcodeFormat`. */
    format: EnumBarcodeFormat;
    /** A string representation of the barcode format. */
    formatString: string;
    /** The decoded text from the barcode. */
    text: string;
    /** The raw byte data of the decoded barcode. */
    bytes: Uint8Array;
    /** The location of the barcode in the image, represented as a quadrilateral. */
    location: Quadrilateral;
    /** A confidence score for the barcode detection. */
    confidence: number;
    /** The rotation angle of the barcode in the image. */
    angle: number;
    /** The size of a single module in the barcode. */
    moduleSize: number;
    /** Additional details specific to the type of barcode detected. */
    details: BarcodeDetails;
    /** Indicates if the barcode is mirrored. */
    isMirrored: boolean;
    /** Indicates if the barcode is detected using Direct Part Marking (DPM) method. */
    isDPM: boolean;
}

interface DecodedBarcodesResult extends CapturedResultBase {
    /**
     * An array of `BarcodeResultItem` objects, each representing a decoded barcode within the original image.
     */
    barcodeResultItems: Array<BarcodeResultItem>;
}

interface DecodedBarcodeElement extends RegionObjectElement {
    /** The format of the decoded barcode, as defined by `EnumBarcodeFormat`. */
    format: EnumBarcodeFormat;
    /** A string representation of the barcode format. */
    formatString: string;
    /** The decoded text from the barcode. */
    text: string;
    /** The raw byte data of the decoded barcode. */
    bytes: Uint8Array;
    /** Additional details specific to the type of barcode detected. */
    details: BarcodeDetails;
    /** Indicates if the barcode is detected using Direct Part Marking (DPM) method. */
    isDPM: boolean;
    /** Indicates if the barcode is mirrored. */
    isMirrored: boolean;
    /** The rotation angle of the barcode in the image. */
    angle: number;
    /** The size of a single module in the barcode. */
    moduleSize: number;
    /** A confidence score for the barcode detection. */
    confidence: number;
    /** Array of extended barcode results if available. */
    extendedBarcodeResults: Array<ExtendedBarcodeResult>;
}

interface ExtendedBarcodeResult extends DecodedBarcodeElement {
    /** Type of the extended barcode result. */
    extendedBarcodeResultType: EnumExtendedBarcodeResultType;
    /** Deformation level of the barcode. */
    deformation: number;
    /** Clarity score of the barcode. */
    clarity: number;
    /** Image data sampled from the barcode. */
    samplingImage: DSImageData;
}

interface SimplifiedBarcodeReaderSettings {
    /** Specifies the barcode formats to be detected. */
    barcodeFormatIds: EnumBarcodeFormat;
    /** Expected number of barcodes to detect. */
    expectedBarcodesCount: number;
    /** Grayscale transformation modes to apply, enhancing detection capability. */
    grayscaleTransformationModes: Array<EnumGrayscaleTransformationMode>;
    /** Grayscale enhancement modes to apply for improving detection in challenging conditions. */
    grayscaleEnhancementModes: Array<EnumGrayscaleEnhancementMode>;
    /** Localization modes to use for detecting barcodes in various orientations or positions. */
    localizationModes: Array<number>;
    /** Deblur modes to apply for improving detection of barcodes. */
    deblurModes: Array<number>;
    /** Minimum confidence level required for a barcode to be considered successfully detected. */
    minResultConfidence: number;
    /** Minimum length of barcode text to be considered valid. */
    minBarcodeTextLength: number;
    /** Regular expression pattern that the detected barcode text must match. */
    barcodeTextRegExPattern: string;
    /** Threshold for reducing the size of large images to speed up processing. If the size of the image's shorter edge exceeds this threshold, the image may be downscaled to decrease processing time. The standard setting is 2300. */
    scaleDownThreshold: number;
}

/**
 * The `CandidateBarcodeZone` interface represents a candidate barcode zone.
 */
interface CandidateBarcodeZone {
    /** Location of the candidate barcode zone within the image. */
    location: Quadrilateral;
    /** Possible formats of the localized barcode. */
    possibleFormats: EnumBarcodeFormat;
}

/**
 * The `CandidateBarcodeZonesUnit` interface extends the `IntermediateResultUnit` interface and represents a unit of candidate barcode zones.
 */
interface CandidateBarcodeZonesUnit extends IntermediateResultUnit {
    /** Array of candidate barcode zones represented as quadrilaterals. */
    candidateBarcodeZones: Array<CandidateBarcodeZone>;
}

interface ComplementedBarcodeImageUnit extends IntermediateResultUnit {
    imageData: DSImageData;
    location: Quadrilateral;
}

interface DecodedBarcodesUnit extends IntermediateResultUnit {
    decodedBarcodes: Array<DecodedBarcodeElement>;
}

/**
 * The `DeformationResistedBarcode` interface represents a deformation-resisted barcode image.
 */
interface DeformationResistedBarcode {
    /** Format of the barcode, as defined by `EnumBarcodeFormat`. */
    format: EnumBarcodeFormat;
    /** Image data of the deformation-resisted barcode image. */
    imageData: DSImageData;
    /** Location of the deformation-resisted barcode within the image. */
    location: Quadrilateral;
}

/**
 * The `DeformationResistedBarcodeImageUnit` interface extends the `IntermediateResultUnit` interface and represents a unit that holds the deformation-resisted barcode which includes the corresponding image data, its location, and the barcode format.
 */
interface DeformationResistedBarcodeImageUnit extends IntermediateResultUnit {
    /** The deformation-resisted barcode. */
    deformationResistedBarcode: DeformationResistedBarcode;
}

interface LocalizedBarcodeElement extends RegionObjectElement {
    /** Possible formats of the localized barcode. */
    possibleFormats: EnumBarcodeFormat;
    /** String representation of the possible formats. */
    possibleFormatsString: string;
    /** The rotation angle of the localized barcode in the image. */
    angle: number;
    /** The size of a single module in the localized barcode. */
    moduleSize: number;
    /** A confidence score for the localized barcode detection. */
    confidence: number;
}

interface LocalizedBarcodesUnit extends IntermediateResultUnit {
    /** An array of `LocalizedBarcodeElement` objects, each representing a localized barcode. */
    localizedBarcodes: Array<LocalizedBarcodeElement>;
}

interface ScaledBarcodeImageUnit extends IntermediateResultUnit {
    /** Image data of the scaled barcode. */
    imageData: DSImageData;
}



declare class CameraEnhancerModule {
    /**
     * Returns the version of the CameraEnhancer module.
     */
    static getVersion(): string;
}

interface VideoFrameTag extends ImageTag {
    /** Indicates whether the video frame is cropped. */
    isCropped: boolean;
    /** The region based on which the original frame was cropped. If `isCropped` is false, the region covers the entire original image. */
    cropRegion: DSRect;
    /** The original width of the video frame before any cropping. */
    originalWidth: number;
    /** The original height of the video frame before any cropping. */
    originalHeight: number;
    /** The current width of the video frame after cropping. */
    currentWidth: number;
    /** The current height of the video frame after cropping. */
    currentHeight: number;
    /** The time spent acquiring the frame, in milliseconds. */
    timeSpent: number;
    /** The timestamp marking the completion of the frame acquisition. */
    timeStamp: number;
}

interface DCEFrame extends DSImageData {
    /** Converts the image data into an HTMLCanvasElement for display or further manipulation in web applications. */
    toCanvas: () => HTMLCanvasElement;
    /** Flag indicating whether the frame is a `DCEFrame`. */
    isDCEFrame: boolean;
    /** Holds extra information about the image data which is extracted from video streams. */
    tag?: VideoFrameTag;
}

interface DrawingItemEvent extends Event {
    /** The drawing item that is the target of the event. */
    targetItem: DrawingItem;
    /** The X coordinate of the item relative to the viewpoint of the browser window. */
    itemClientX: number;
    /** The Y coordinate of the item relative to the viewpoint of the browser window. */
    itemClientY: number;
    /** The X coordinate of the item relative to the entire document (the webpage content). */
    itemPageX: number;
    /** The Y coordinate of the item relative to the entire document (the webpage content). */
    itemPageY: number;
}

interface Note {
    /** The name of the note. */
    name: string;
    /** The content of the note, can be of any type. */
    content: any;
}

interface PlayCallbackInfo {
    /** The height of the video frame. */
    height: number;
    /** The width of the video frame. */
    width: number;
    /** The unique identifier of the camera. */
    deviceId: string;
}

interface Resolution {
    /** The width of the video frame. */
    width: number;
    /** The height of the video frame. */
    height: number;
}

interface TipConfig {
    /** The top left point of the tip message box. */
    topLeftPoint: Point;
    /** The width of the tip message box. */
    width: number;
    /** The display duration of the tip in milliseconds. */
    duration: number;
    /** The base coordinate system used (e.g., "view" or "image"). */
    coordinateBase?: "view" | "image";
}

interface VideoDeviceInfo {
    /** The unique identifier for the camera. */
    deviceId: string;
    /** The label or name of the camera. */
    label: string;
    /** @ignore */
    _checked: boolean;
}

declare enum EnumDrawingItemMediaType {
    /**
     * Represents a rectangle, a basic geometric shape with four sides where opposite sides are equal in length and it has four right angles.
     */
    DIMT_RECTANGLE = 1,
    /**
     * Represents any four-sided figure. This includes squares, rectangles, rhombuses, and more general forms that do not necessarily have right angles or equal sides.
     */
    DIMT_QUADRILATERAL = 2,
    /**
     * Represents a text element. This allows for the inclusion of textual content as a distinct drawing item within the graphic representation.
     */
    DIMT_TEXT = 4,
    /**
     * Represents an arc, which is a portion of the circumference of a circle or an ellipse. Arcs are used to create curved shapes and segments.
     */
    DIMT_ARC = 8,
    /**
     * Represents an image. This enables embedding bitmap images within the drawing context.
     */
    DIMT_IMAGE = 16,
    /**
     * Represents a polygon, which is a plane figure that is described by a finite number of straight line segments connected to form a closed polygonal chain or circuit.
     */
    DIMT_POLYGON = 32,
    /**
     * Represents a line segment. This is the simplest form of a drawing item, defined by two endpoints and the straight path connecting them.
     */
    DIMT_LINE = 64,
    /**
     * Represents a group of drawing items. This allows for the logical grouping of multiple items, treating them as a single entity for manipulation or transformation purposes.
     */
    DIMT_GROUP = 128
}

declare enum EnumDrawingItemState {
    /**
     * DIS_DEFAULT: The default state of a drawing item. This state indicates that the drawing item is in its normal, unselected state.
     */
    DIS_DEFAULT = 1,
    /**
     * DIS_SELECTED: Indicates that the drawing item is currently selected. This state can trigger different behaviors or visual styles, such as highlighting the item to show it is active or the focus of user interaction.
     */
    DIS_SELECTED = 2
}

declare enum EnumEnhancedFeatures {
    /**
     * Enables auto-focus on areas likely to contain barcodes, assisting in their identification and interpretation.
     */
    EF_ENHANCED_FOCUS = 4,
    /**
     * Facilitates automatic zooming in on areas likely to contain barcodes, aiding in their detection and decoding.
     */
    EF_AUTO_ZOOM = 16,
    /**
     * Allows users to tap on a specific item or area in the video feed to focus on, simplifying the interaction for selecting or highlighting important elements.
     */
    EF_TAP_TO_FOCUS = 64
}

declare enum EnumPixelFormat {
    GREY = "grey",
    GREY32 = "grey32",
    RGBA = "rgba",
    RBGA = "rbga",
    GRBA = "grba",
    GBRA = "gbra",
    BRGA = "brga",
    BGRA = "bgra"
}

declare enum EnumItemType {
    ARC = 0,
    IMAGE = 1,
    LINE = 2,
    POLYGON = 3,
    QUAD = 4,
    RECT = 5,
    TEXT = 6,
    GROUP = 7
}
declare enum EnumItemState {
    DEFAULT = 0,
    SELECTED = 1
}
declare abstract class DrawingItem {
    #private;
    /**
     * TODO: replace with enum
     * @ignore
     */
    static arrMediaTypes: string[];
    /**
     * @ignore
     */
    static mapItemType: Map<EnumItemType, string>;
    /**
     * TOOD: replace with enum
     * @ignore
     */
    static arrStyleSelectors: string[];
    /**
     * @ignore
     */
    static mapItemState: Map<EnumItemState, string>;
    protected _fabricObject: any;
    /**
     * TODO: make it private and replace it with 'mediaType'
     * @ignore
     */
    _mediaType: string;
    /**
     * @ignore
     */
    get mediaType(): EnumDrawingItemMediaType;
    /**
     * TODO: rename it to 'state' and return enum
     */
    get styleSelector(): string;
    /**
     * @ignore
     */
    styleId?: number;
    /**
     * Returns or sets the numeric ID for the `DrawingStyle` that applies to this `DrawingItem`.
     * Invoke `renderAll()` for the new `DrawingStyle` to take effect.
     */
    set drawingStyleId(id: number);
    get drawingStyleId(): number;
    /**
     * Returns or sets the coordinate system base with a string:
     * - "view" for viewport-based coordinates or
     * - "image" for image-based coordinates.
     */
    set coordinateBase(base: "view" | "image");
    get coordinateBase(): "view" | "image";
    /**
     * @ignore
     */
    _zIndex?: number;
    /**
     * @ignore
     */
    _drawingLayer: any;
    /**
     * @ignore
     */
    _drawingLayerId: number;
    /**
     * Returns the numeric ID for the `DrawingLayer` this `DrawingItem` belongs to.
     */
    get drawingLayerId(): number;
    /**
     * record the item's styles
     * TODO: use enum
     * @ignore
     */
    _mapState_StyleId: Map<string, number>;
    protected mapEvent_Callbacks: Map<string, Map<Function, Function>>;
    protected mapNoteName_Content: Map<string, Array<any>>;
    /**
     * @ignore
     */
    readonly isDrawingItem: boolean;
    /**
     *
     * @param fabricObject
     * @param drawingStyleId
     * @ignore
     */
    constructor(fabricObject?: any, drawingStyleId?: number);
    protected _setFabricObject(fabricObject: any): void;
    /**
     *
     * @returns
     * @ignore
     */
    _getFabricObject(): any;
    /**
     *
     * @param state Specifies the state of the `DrawingItem` as a string.
     * @ignore
     */
    setState(state: EnumDrawingItemState): void;
    /**
     * Returns the current state of the `DrawingItem`.
     *
     * @returns The current state of the `DrawingItem`, of type `EnumDrawingItemState`.
     */
    getState(): EnumDrawingItemState;
    /**
     * @ignore
     */
    _on(eventName: string, listener: (event: DrawingItemEvent) => void): void;
    /**
     * Binds a listener for a specific event.
     * The event name is limited to "mousedown" | "mouseup" | "dblclick" | "mouseover" | "mouseout".
     * @param eventName Specifies the event by its name.
     * @param listener The event listener.
     */
    on(eventName: "mousedown" | "mouseup" | "dblclick" | "mouseover" | "mouseout", listener: (event: DrawingItemEvent) => void): void;
    /**
     * @ignore
     */
    _off(eventName: string, listener: (event: DrawingItemEvent) => void): void;
    /**
     * Unbinds a listener for a specific event.
     * The event name is limited to "mousedown" | "mouseup" | "dblclick" | "mouseover" | "mouseout".
     * @param eventName Specifies the event by its name.
     * @param listener The event listener.
     */
    off(eventName: "mousedown" | "mouseup" | "dblclick" | "mouseover" | "mouseout", listener: (event: DrawingItemEvent) => void): void;
    /**
     * Set if this item can be edited.
     * @param editable
     * @ignore
     */
    _setEditable(editable: boolean): void;
    /**
     * Checks if a `Note` object with the specified name exists.
     * @param name Specifies the name of the `Note` object.
     *
     * @returns Boolean indicating whether the `Note` object exists.
     */
    hasNote(name: string): boolean;
    /**
     * Adds a `Note` object to this `DrawingItem`.
     * @param note Specifies the `Note` object.
     * @param replace [Optional] Whether to replace an existing note if the notes share the same name.
     */
    addNote(note: Note, replace?: boolean): void;
    /**
     * Returns a `Note` object specified by its name, if it exists.
     * @param name Specifies the name of the `Note` object.
     *
     * @returns The corresponding `Note` object specified by its name, if it exists.
     */
    getNote(name: string): Note;
    /**
     * Returns a collection of all existing `Note` objects on this `DrawingItem`.
     *
     * @returns All existing `Note` objects on this `DrawingItem`.
     */
    getNotes(): Array<Note>;
    /**
     * Updates the content of a specified `Note` object.
     * @param name Specifies the name of the `Note` object.
     * @param content Specifies the new content, can be of any type.
     * @param mergeContent [Optional] Whether to merge the new content with the existing one.
     */
    updateNote(name: string, content: any, mergeContent?: boolean): void;
    /**
     * Deletes a `Note` object specified by its name.
     * @param name Specifies the name of the `Note` object.
     */
    deleteNote(name: string): void;
    /**
     * Deletes all `Note` objects on this `DrawingItem`.
     */
    clearNotes(): void;
    protected abstract extendSet(property: string, value: any): boolean;
    protected abstract extendGet(property: string): any;
    /**
     *
     * @param property
     * @returns
     * @ignore
     */
    set(property: string, value: any): void;
    /**
     *
     * @param property
     * @returns
     * @ignore
     */
    get(property: string): any;
    /**
     * Remove this item from drawing layer.
     * @ignore
     */
    remove(): void;
    /**
     * Convert item's property(width, height, x, y, etc.) from related to image/video to related to view/page.
     * @param value
     * @returns
     */
    protected convertPropFromImageToView(value: number): number;
    /**
     * Convert item's property(width, height, x, y, etc.) from related to view/page to related to image/video.
     * @param value
     * @returns
     */
    protected convertPropFromViewToImage(value: number): number;
    protected abstract updateCoordinateBaseFromImageToView(): void;
    protected abstract updateCoordinateBaseFromViewToImage(): void;
    /**
     * @ignore
     */
    _setLineWidth(value: number): void;
    /**
     * @ignore
     */
    _getLineWidth(): number;
    /**
     * @ignore
     */
    _setFontSize(value: number): void;
    /**
     * @ignore
     */
    _getFontSize(): number;
    /**
     * @ignore
     */
    abstract setPosition(position: any): void;
    /**
     * @ignore
     */
    abstract getPosition(): any;
    /**
     * Update item's propertys(width, height, x, y, etc.).
     * It is called when item is added to layer.
     * @ignore
     */
    abstract updatePosition(): void;
}

declare class DT_Text extends DrawingItem {
    #private;
    private _text;
    constructor(text: string, rect: Rect, drawingStyleId?: number);
    protected extendSet(property: string, value: any): boolean;
    protected extendGet(property: string): any;
    protected updateCoordinateBaseFromImageToView(): void;
    protected updateCoordinateBaseFromViewToImage(): void;
    setPosition(position: any): void;
    getPosition(): any;
    updatePosition(): void;
    setText(text: string): void;
    getText(): string;
    setTextRect(rect: Rect): void;
    getTextRect(): Rect;
}

declare class DrawingLayer {
    /**
     * Predefined ID for the default layer meant to be used by Dynamsoft Document Normalizer.
     */
    static DDN_LAYER_ID: number;
    /**
     * Predefined ID for the default layer meant to be used by Dynamsoft Barcode Reader.
     */
    static DBR_LAYER_ID: number;
    /**
     * Predefined ID for the default layer meant to be used by Dynamsoft Label Recognizer.
     */
    static DLR_LAYER_ID: number;
    /**
     * The starting ID for user-defined layers, distinguishing them from default system layers.
     */
    static USER_DEFINED_LAYER_BASE_ID: number;
    /**
     * @ignore
     */
    static TIP_LAYER_ID: number;
    /**
     * returns the 'fabric.Canvas' object
     * @ignore
     */
    fabricCanvas: any;
    private id;
    /**
     * @ignore
     */
    get width(): number;
    /**
     * @ignore
     */
    get height(): number;
    private mapType_StateAndStyleId;
    private mode;
    /**
     * Event triggered whenever there is a change in which `DrawingItem` objects are selected or deselected.
     * @param selectedDrawingItems An array of `DrawingItem` objects that have been selected as a result of the latest selection change.
     * @param deselectedDrawingItems An array of `DrawingItem` objects that have been deselected as a result of the latest selection change.
     * [NOTE]: This event is only functional when the `DrawingLayer` in which it is defined belongs to an `ImageEditorView` instance.
     */
    onSelectionChanged: (selectedDrawingItems: Array<DrawingItem>, deselectedDrawingItems: Array<DrawingItem>) => void;
    private _arrDrwaingItem;
    private _arrFabricObject;
    private _visible;
    /**
     * @ignore
     */
    _manager: any;
    /**
     * @ignore
     */
    set _allowMultiSelect(value: boolean);
    get _allowMultiSelect(): boolean;
    /**
     * @ignore
     */
    constructor(canvas: HTMLCanvasElement, id: number, options?: Object);
    /**
     * Retrieves the unique identifier of the layer.
     */
    getId(): number;
    /**
     * Sets the visibility of the layer.
     * @param visible Whether to show or hide the layer.
     */
    setVisible(visible: boolean): void;
    /**
     * Retrieves the visibility status of the layer.
     *
     * @returns Boolean indicating whether the layer is visible.
     */
    isVisible(): boolean;
    private _getItemCurrentStyle;
    /**
     * Change style of drawingItems of specific media type in specific style selector.
     * DrawingItems that have 'styleId' won't be changed.
     * @param mediaType the mediaType of drawingItems that attend to change
     * @param styleSelector
     * @param drawingStyle
     * @private
     */
    private _changeMediaTypeCurStyleInStyleSelector;
    /**
     * Change the style of specific drawingItem.
     * DrawingItem that has 'styleId' won't be changed.
     * @param drawingItem
     * @param drawingStyle
     * @private
     */
    private _changeItemStyle;
    /**
     *
     * @param targetGroup
     * @param item
     * @param addOrRemove
     * @returns
     * @ignore
     */
    _updateGroupItem(targetGroup: DrawingItem, item: DrawingItem, addOrRemove: string): void;
    private _addDrawingItem;
    /**
     * Add a drawing item to the drawing layer.
     * Drawing items in drawing layer with higher id are always above those in drawing layer with lower id.
     * In a same drawing layer, the later added is above the previous added.
     * @param drawingItem
     * @ignore
     */
    private addDrawingItem;
    /**
     * Adds an array of `DrawingItem` objects to the layer.
     * @param drawingItems An array of `DrawingItem` objects.
     */
    addDrawingItems(drawingItems: Array<DrawingItem>): void;
    /**
     *
     * @param drawingItem
     * @returns
     * @ignore
     */
    private removeDrawingItem;
    /**
     * Removes specified `DrawingItem` objects from the layer.
     * @param drawingItems An array of `DrawingItem` objects.
     */
    removeDrawingItems(drawingItems: Array<DrawingItem>): void;
    /**
     * Sets the layer's `DrawingItem` objects, replacing any existing items.
     * @param drawingItems An array of `DrawingItem` objects.
     */
    setDrawingItems(drawingItems: Array<DrawingItem>): void;
    /**
     * Retrieves `DrawingItem` objects from the layer, optionally filtered by a custom function.
     * @param filter [Optional] A predicate function used to select a subset of `DrawingItem` objects based on specific criteria. Only items for which this function returns `true` are included in the result.
     *
     */
    getDrawingItems(filter?: (item: DrawingItem) => boolean): Array<DrawingItem>;
    /**
     * Returns an array of all selected DrawingItem instances.
     *
     * @returns  An array of `DrawingItem` objects.
     */
    getSelectedDrawingItems(): Array<DrawingItem>;
    /**
     * Checks if a specific `DrawingItem` exists within the layer.
     * @param drawingItem Specifies the `DrawingItem`.
     *
     * @returns Boolean indicating whether the specific `DrawingItem` exists.
     */
    hasDrawingItem(drawingItem: DrawingItem): boolean;
    /**
     * Clears all `DrawingItem` objects from the layer.
     */
    clearDrawingItems(): void;
    private _setDefaultStyle;
    /**
     * Establishes the baseline styling preferences for `DrawingItem` objects on the layer.
     * This method offers flexible styling options tailored to the diverse requirements of `DrawingItem` objects based on their state and type:
     * - Universal Application: By default, without specifying `state` or `mediaType`, the designated style is universally applied to all `DrawingItem` objects on the layer, ensuring a cohesive look and feel.
     * - State-Specific Styling: Specifying only the state parameter allows the method to target `DrawingItem` objects matching that particular state, enabling differentiated styling that reflects their current status or condition.
     * - Refined Targeting with State and MediaType: Providing both `state` and `mediaType` parameters focuses the style application even further, affecting only those `DrawingItem` objects that align with the specified type while in the given state.
     *
     * This precision is particularly useful for creating visually distinct interactions or highlighting specific elements based on their content and interaction state.
     * @param drawingStyleId The unique ID of the `DrawingStyle` to be applied.
     * @param state [Optional] Allows the styling to be conditional based on the `DrawingItem`'s current state.
     * @param mediaType [Optional] Further refines the application of the style based on the the `DrawingItem`'s type.
     */
    setDefaultStyle(drawingStyleId: number, state?: EnumDrawingItemState, mediaType?: EnumDrawingItemMediaType): void;
    /**
     * Change drawing layer mode, "viewer" or "editor".
     * @param newMode
     * @ignore
     */
    setMode(newMode: string): void;
    /**
     *
     * @returns
     * @ignore
     */
    getMode(): string;
    /**
     * Update the dimensions of drawing layer.
     * @param dimensions
     * @param options
     * @ignore
     */
    _setDimensions(dimensions: {
        width: number | string;
        height: number | string;
    }, options?: {
        backstoreOnly?: boolean;
        cssOnly?: boolean;
    }): void;
    /**
     * Update the object-fit of drawing layer.
     * @param value
     * @ignore
     */
    _setObjectFit(value: string): void;
    /**
     *
     * @returns
     * @ignore
     */
    _getObjectFit(): string;
    /**
     * Forces a re-render of all `DrawingItem` objects on the layer.
     * Invoke this method to ensure any modifications made to existing `DrawingItem` objects are visually reflected on the layer.
     */
    renderAll(): void;
    /**
     * @ignore
     */
    dispose(): void;
}

declare class DrawingLayerManager {
    _arrDrawingLayer: DrawingLayer[];
    /**
     * Creates a new `DrawingLayer` object and returns it.
     * @param baseCvs An `HTMLCanvasElement` used as the base for creating the `DrawingLayer` object.
     * @param drawingLayerId Assign a unique number as an identifier for the `DrawingLayer` object.
     *
     * @returns The created `DrawingLayer` object.
     */
    createDrawingLayer(baseCvs: HTMLCanvasElement, drawingLayerId: number): DrawingLayer;
    /**
     * Deletes a user-defined `DrawingLayer` object specified by its unique identifier (ID).
     * [NOTE] The name for the same method on `CameraView` or `ImageEditorView` is deleteUserDefinedDrawingLayer().
     * @param drawingLayerId The unique identifier (ID) of the `DrawingLayer` object.
     */
    deleteDrawingLayer(drawingLayerId: number): void;
    /**
     * Clears all user-defined `DrawingLayer` objects, resetting the drawing space without affecting default built-in `DrawingLayer` objects.
     * [NOTE] The name for the same method on `CameraView` or `ImageEditorView` is clearUserDefinedDrawingLayers().
     */
    clearDrawingLayers(): void;
    /**
     * Retrieves a `DrawingLayer` object by its unique identifier (ID).
     * @param id The unique identifier (ID) of the `DrawingLayer` object.
     *
     * @returns The `DrawingLayer` object specified by its unique identifier (ID) or `null`.
     */
    getDrawingLayer(drawingLayerId: number): DrawingLayer;
    /**
     * Returns an array of all `DrawingLayer` objects managed by this `DrawingLayerManager`.
     *
     * @returns An array of all `DrawingLayer` objects.
     */
    getAllDrawingLayers(): Array<DrawingLayer>;
    /**
     * Returns an array of all selected DrawingItem instances across different layers, supporting complex selection scenarios.
     *
     * @returns  An array of `DrawingItem` objects.
     */
    getSelectedDrawingItems(): Array<DrawingItem>;
    setDimensions(dimensions: {
        width: number | string;
        height: number | string;
    }, options?: {
        backstoreOnly?: boolean;
        cssOnly?: boolean;
    }): void;
    setObjectFit(value: string): void;
    getObjectFit(): string;
    setVisible(visible: boolean): void;
    _getFabricCanvas(): any;
    _switchPointerEvent(): void;
}

declare class InnerComponent extends HTMLElement {
    #private;
    constructor();
    getWrapper(): HTMLDivElement;
    setElement(slot: "content" | "single-frame-input-container" | "drawing-layer", el: HTMLElement): void;
    getElement(slot: "content" | "single-frame-input-container" | "drawing-layer"): HTMLElement;
    removeElement(slot: "content" | "single-frame-input-container" | "drawing-layer"): void;
}

declare class DT_Tip extends DT_Text {
    #private;
    constructor(text: string, x: number, y: number, width: number, styleId?: number);
    /**
     * Make the tip hidden after a period of time.
     * @param duration if less then 0, it clears the timer.
     */
    setDuration(duration: number): void;
    getDuration(): number;
}
declare abstract class View {
    #private;
    /**
     * @ignore
     */
    _innerComponent: InnerComponent;
    /** @ignore */
    _drawingLayerManager: DrawingLayerManager;
    /** @ignore */
    _layerBaseCvs: HTMLCanvasElement;
    /** @ignore */
    _drawingLayerOfTip: DrawingLayer;
    private _tipStyleId;
    /** @ignore */
    _tip: DT_Tip;
    constructor();
    /**
     * get the dimensions of content which the view shows. In 'CameraView', the 'content' usually means the video; in 'ImageEditorView', the 'content' usually means the image.
     */
    protected abstract getContentDimensions(): {
        width: number;
        height: number;
        objectFit: string;
    };
    /**
     * Create a native 'canvas' element, which will be passed to 'fabric' to create a 'fabric.Canvas'.
     * In fact, all drawing layers are in one canvas.
     * @ignore
     */
    protected createDrawingLayerBaseCvs(width: number, height: number, objectFit?: string): HTMLCanvasElement;
    /**
     * Create drawing layer with specified id and size.
     * Differ from 'createDrawingLayer()', the drawing layers created'createDrawingLayer()' can not Specified id, and their size is the same as video.
     * @ignore
     */
    _createDrawingLayer(drawingLayerId: number, width?: number, height?: number, objectFit?: string): DrawingLayer;
    /**
     * Creates a new `DrawingLayer` object and returns it.
     *
     * @returns The created `DrawingLayer` object.
     */
    createDrawingLayer(): DrawingLayer;
    /**
     * Differ from 'deleteUserDefinedDrawingLayer()', 'deleteDrawingLayer()' can delete any layer, while 'deleteUserDefinedDrawingLayer()' can only delete user defined layer.
     */
    protected deleteDrawingLayer(drawingLayerId: number): void;
    /**
     * Deletes a user-defined `DrawingLayer` object specified by its unique identifier (ID).
     * @param id The unique identifier (ID) of the `DrawingLayer` object.
     */
    deleteUserDefinedDrawingLayer(id: number): void;
    /**
     * Not used yet.
     * @ignore
     */
    _clearDrawingLayers(): void;
    /**
     * Clears all user-defined `DrawingLayer` objects, resetting the drawing space without affecting default built-in `DrawingLayer` objects.
     */
    clearUserDefinedDrawingLayers(): void;
    /**
     * Retrieves a `DrawingLayer` object by its unique identifier (ID).
     * @param id The unique identifier (ID) of the `DrawingLayer` object.
     *
     * @returns The `DrawingLayer` object specified by its unique identifier (ID) or `null`.
     */
    getDrawingLayer(drawingLayerId: number): DrawingLayer;
    /**
     * Returns an array of all `DrawingLayer` objects .
     *
     * @returns An array of all `DrawingLayer` objects.
     */
    getAllDrawingLayers(): Array<DrawingLayer>;
    /**
     * update drawing layers according to content(video/image) dimensions.
     */
    protected updateDrawingLayers(contentDimensions: {
        width: number;
        height: number;
        objectFit: string;
    }): void;
    /**
     * Returns an array of all selected DrawingItem instances across different layers, supporting complex selection scenarios.
     *
     * @returns An array of `DrawingItem` objects.
     */
    getSelectedDrawingItems(): Array<DrawingItem>;
    /**
     * Applies configuration settings to the tip message box.
     * This includes its position, size, display duration, and the coordinate system basis.
     * @param tipConfig Configuration object for the tip message box, including top-left position, width, display duration, and coordinate system basis.
     */
    setTipConfig(tipConfig: TipConfig): void;
    /**
     * Retrieves the current configuration of the tip message box, reflecting its position, size, display duration, and the coordinate system basis.
     *
     * @returns The current configuration settings of the tip message box.
     */
    getTipConfig(): TipConfig;
    /**
     * Controls the visibility of the tip message box on the screen.
     * This can be used to show or hide the tip based on user interaction or other criteria.
     * @param visible Boolean flag indicating whether the tip message box should be visible (`true`) or hidden (`false`).
     */
    setTipVisible(visible: boolean): void;
    /**
     * Checks whether the tip message box is currently visible to the user.
     *
     * @returns Boolean indicating the visibility of the tip message box (`true` for visible, `false` for hidden).
     */
    isTipVisible(): boolean;
    /**
     * Updates the message displayed in the tip message box.
     * This can be used to provide dynamic feedback or information to the user.
     * @param message The new message to be displayed in the tip message box.
     */
    updateTipMessage(message: string): void;
}

declare class EventHandler {
    #private;
    get disposed(): boolean;
    on(event: string, listener: Function): void;
    off(event: string, listener: Function): void;
    offAll(event: string): void;
    fire(event: string, params?: Array<any>, options?: {
        target?: object;
        async?: boolean;
        copy?: boolean;
    }): void;
    dispose(): void;
}

declare class ImageDataGetter {
    #private;
    static _onLog: (message: any) => void;
    static get version(): string;
    static _webGLSupported: boolean;
    static get webGLSupported(): boolean;
    useWebGLByDefault: boolean;
    _reusedCvs: HTMLCanvasElement;
    _reusedWebGLCvs?: HTMLCanvasElement;
    get disposed(): boolean;
    constructor();
    private sourceIsReady;
    /**
     * Draw a image to canvas.
     * TODO: fix image is flipped when drawing in 'WebGL'.
     * @param canvas
     * @param source
     * @param sourceWidth
     * @param sourceHeight
     * @param position
     * @param options
     * @param options.bufferContainer if it is set and WebGL is used, the image data will be put into this variable.
     * @returns
     */
    drawImage(canvas: HTMLCanvasElement, source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap, sourceWidth: number, sourceHeight: number, position?: {
        sx?: number;
        sy?: number;
        sWidth?: number;
        sHeight?: number;
        dx?: number;
        dy?: number;
        dWidth?: number;
        dHeight?: number;
    }, options?: {
        pixelFormat?: EnumPixelFormat;
        bUseWebGL?: boolean;
        bufferContainer?: Uint8Array;
        isEnableMirroring?: boolean;
    }): {
        context: CanvasRenderingContext2D | WebGLRenderingContext;
        pixelFormat: EnumPixelFormat;
        bUseWebGL: boolean;
    };
    /**
     * Read 'Unit8Array' from context of canvas.
     * @param context
     * @param position
     * @param bufferContainer If set, the data will be put into this variable, which will be useful when you want to reuse container.
     * @returns
     */
    readCvsData(context: CanvasRenderingContext2D | WebGLRenderingContext, position?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }, bufferContainer?: Uint8Array): Uint8Array;
    /**
     * Transform pixel format.
     * @param data
     * @param originalFormat
     * @param targetFormat
     * @param copy
     * @returns
     */
    transformPixelFormat(data: Uint8Array, originalFormat: EnumPixelFormat, targetFormat: EnumPixelFormat, copy?: boolean): Uint8Array;
    /**
     * Get image data from image.
     * @param source
     * @param sourceWidth
     * @param sourceHeight
     * @param position
     * @param options
     * @returns
     */
    getImageData(source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap, position: {
        sx: number;
        sy: number;
        sWidth: number;
        sHeight: number;
        dWidth: number;
        dHeight: number;
    }, options?: {
        pixelFormat?: EnumPixelFormat.RGBA | EnumPixelFormat.GREY;
        bufferContainer?: Uint8Array;
        isEnableMirroring?: boolean;
    }): {
        data: Uint8Array;
        pixelFormat: EnumPixelFormat;
        width: number;
        height: number;
        bUseWebGL: boolean;
    };
    /**
     * Draw image data to a canvas.
     * @param data
     * @param width
     * @param height
     * @param pixelFormat
     * @returns
     */
    convertDataToCvs(data: Uint8Array | Uint8ClampedArray, width: number, height: number, pixelFormat: EnumPixelFormat): HTMLCanvasElement;
    /**
     * Force lose webgl context.
     * @private
     */
    forceLoseContext(): void;
    dispose(): void;
}

interface CameraInfo {
    deviceId: string;
    label: string;
    /** @ignore */
    _checked: boolean;
}

type CameraEvent = "before:open" | "opened" | "before:close" | "closed" | "before:camera:change" | "camera:changed" | "before:resolution:change" | "resolution:changed" | "played" | "paused" | "resumed" | "tapfocus";
declare class CameraManager {
    #private;
    static _onLog: (message: any) => void;
    static get version(): string;
    static browserInfo: {
        browser: string;
        version: number;
        OS: string;
    };
    private static _tryToReopenTime;
    static onWarning: (message: string) => void;
    /**
     * Check if storage is available.
     * @ignore
     */
    static isStorageAvailable(type: string): boolean;
    static findBestRearCameraInIOS(cameraList: Array<{
        label: string;
        deviceId: string;
    }>, options?: {
        getMainCamera?: boolean;
    }): string;
    static findBestRearCamera(cameraList: Array<{
        label: string;
        deviceId: string;
    }>, options?: {
        getMainCameraInIOS?: boolean;
    }): string;
    static findBestCamera(cameraList: Array<{
        label: string;
        deviceId: string;
    }>, facingMode: "environment" | "user" | null, options?: {
        getMainCameraInIOS?: boolean;
    }): string;
    static playVideo(videoEl: HTMLVideoElement, source: string | MediaStream | MediaSource | Blob, timeout?: number): Promise<HTMLVideoElement>;
    static testCameraAccess(constraints?: MediaStreamConstraints): Promise<{
        ok: boolean;
        errorName?: string;
        errorMessage?: string;
    }>;
    /**
     * Camera/video state.
     */
    get state(): "closed" | "opening" | "opened";
    _zoomPreSetting: {
        factor: number;
        centerPoint?: {
            x: string;
            y: string;
        };
    };
    videoSrc: string;
    _mediaStream: MediaStream;
    defaultConstraints: MediaStreamConstraints;
    cameraOpenTimeout: number;
    /**
     * @ignore
     */
    _arrCameras: Array<CameraInfo>;
    /**
     * Whether to record camera you selected after reload the page.
     */
    set ifSaveLastUsedCamera(value: boolean);
    get ifSaveLastUsedCamera(): boolean;
    /**
     * Whether to skip the process of picking a proper rear camera when opening camera the first time.
     */
    ifSkipCameraInspection: boolean;
    selectIOSRearMainCameraAsDefault: boolean;
    get isVideoPlaying(): boolean;
    _focusParameters: any;
    _focusSupported: boolean;
    calculateCoordInVideo: (clientX: number, clientY: number) => {
        x: number;
        y: number;
    };
    set tapFocusEventBoundEl(element: HTMLElement);
    get tapFocusEventBoundEl(): HTMLElement;
    updateVideoElWhenSoftwareScaled: () => void;
    imageDataGetter: ImageDataGetter;
    detectedResolutions: {
        width: number;
        height: number;
    }[];
    get disposed(): boolean;
    constructor(videoEl?: HTMLVideoElement);
    setVideoEl(videoEl: HTMLVideoElement): void;
    getVideoEl(): HTMLVideoElement;
    releaseVideoEl(): void;
    isVideoLoaded(): boolean;
    /**
     * Open camera and play video.
     * @returns
     */
    open(): Promise<void>;
    close(): Promise<void>;
    pause(): void;
    resume(): Promise<void>;
    setCamera(deviceId: string): Promise<CameraInfo>;
    switchToFrontCamera(options?: {
        resolution: {
            width: number;
            height: number;
        };
    }): Promise<CameraInfo>;
    getCamera(): CameraInfo;
    _getCameras(force?: boolean): Promise<Array<CameraInfo>>;
    getCameras(): Promise<Array<CameraInfo>>;
    getAllCameras(): Promise<CameraInfo[]>;
    setResolution(width: number, height: number, exact?: boolean): Promise<{
        width: number;
        height: number;
    }>;
    getResolution(): {
        width: number;
        height: number;
    };
    getResolutions(reGet?: boolean): Promise<Array<{
        width: number;
        height: number;
    }>>;
    setMediaStreamConstraints(mediaStreamConstraints: MediaStreamConstraints, reOpen?: boolean): Promise<void>;
    getMediaStreamConstraints(): MediaStreamConstraints;
    resetMediaStreamConstraints(): void;
    getCameraCapabilities(): MediaTrackCapabilities;
    getCameraSettings(): MediaTrackSettings;
    turnOnTorch(): Promise<void>;
    turnOffTorch(): Promise<void>;
    setColorTemperature(value: number, autoCorrect?: boolean): Promise<number>;
    getColorTemperature(): number;
    setExposureCompensation(value: number, autoCorrect?: boolean): Promise<number>;
    getExposureCompensation(): number;
    setFrameRate(value: number, autoCorrect?: boolean): Promise<number>;
    getFrameRate(): number;
    setFocus(settings: {
        mode: string;
    } | {
        mode: "manual";
        distance: number;
    } | {
        mode: "manual";
        area: {
            centerPoint: {
                x: string;
                y: string;
            };
            width?: string;
            height?: string;
        };
    }, autoCorrect?: boolean): Promise<void>;
    getFocus(): Object;
    /**
     * Attention: tap focus is a feature that requires payment in DCE JS 4.x. Please consult relevant members if you want to export it to customers.
     */
    enableTapToFocus(): void;
    disableTapToFocus(): void;
    isTapToFocusEnabled(): boolean;
    /**
     *
     * @param settings factor: scale value; centerPoint: experimental argument, set the scale center. Video center by default.
     */
    setZoom(settings: {
        factor: number;
        centerPoint?: {
            x: string;
            y: string;
        };
    }): Promise<void>;
    getZoom(): {
        factor: number;
    };
    resetZoom(): Promise<void>;
    setHardwareScale(value: number, autoCorrect?: boolean): Promise<number>;
    getHardwareScale(): number;
    /**
     *
     * @param value scale value
     * @param center experimental argument, set the scale center. Video center by default.
     */
    setSoftwareScale(value: number, center?: {
        x: string;
        y: string;
    }): void;
    getSoftwareScale(): number;
    /**
     * Reset scale center to video center.
     * @experimental
     */
    resetScaleCenter(): void;
    resetSoftwareScale(): void;
    getFrameData(options?: {
        position?: {
            sx: number;
            sy: number;
            sWidth: number;
            sHeight: number;
            dWidth: number;
            dHeight: number;
        };
        pixelFormat?: EnumPixelFormat.GREY | EnumPixelFormat.RGBA;
        scale?: number;
        scaleCenter?: {
            x: string;
            y: string;
        };
        bufferContainer?: Uint8Array;
        isEnableMirroring?: boolean;
    }): {
        data: Uint8Array;
        width: number;
        height: number;
        pixelFormat: EnumPixelFormat;
        timeSpent: number;
        timeStamp: number;
        toCanvas: () => HTMLCanvasElement;
    };
    /**
     *
     * @param event {@link CameraEvent}
     * @param listener
     * @see {@link CameraEvent}
     * @see {@link off}
     */
    on(event: CameraEvent, listener: Function): void;
    /**
     *
     * @param event
     * @param listener
     * @see {@link CameraEvent}
     * @see {@link on}
     */
    off(event: CameraEvent, listener: Function): void;
    dispose(): Promise<void>;
}

declare class CameraEnhancer extends ImageSourceAdapter {
    #private;
    /** @ignore */
    static _debug: boolean;
    private static _isRTU;
    static set _onLog(value: (message: any) => void);
    static get _onLog(): (message: any) => void;
    /**
     * @ignore
     */
    static browserInfo: {
        browser: string;
        version: number;
        OS: string;
    };
    /**
     * Event triggered when the running environment is not ideal.
     * @param warning The warning message.
     */
    static onWarning: (warning: Warning) => void;
    /**
     * Detect environment and get a report.
     * ```js
     * console.log(Dynamsoft.DCE.CameraEnhancer.detectEnvironment());
     * // {"wasm":true, "worker":true, "getUserMedia":true, "camera":true, "browser":"Chrome", "version":90, "OS":"Windows"}
     * ```
     */
    static detectEnvironment(): Promise<any>;
    /**
     * Tests whether the application has access to the camera.
     * This static method can be used before initializing a `CameraEnhancer` instance to ensure that the device's camera can be accessed, providing a way to handle permissions or other access issues preemptively.
     * This method offers the additional advantage of accelerating the camera opening process for the first time.
     *
     * @returns A promise that resolves with an object containing:
     * - `ok`: Boolean indicating whether camera access is available.
     * - `message`: A string providing additional information or the reason why camera access is not available, if applicable.
     */
    static testCameraAccess(): Promise<{
        ok: boolean;
        message: string;
    }>;
    /**
     * Initializes a new instance of the `CameraEnhancer` class.
     * @param view [Optional] Specifies a `CameraView` instance to provide the user interface element to display the live feed from the camera.
     *
     * @returns A promise that resolves with the initialized `CameraEnhancer` instance.
     */
    static createInstance(view?: CameraView): Promise<CameraEnhancer>;
    cameraManager: CameraManager;
    private cameraView;
    /**
     * @ignore
    */
    private _imageDataGetter;
    private _isEnableMirroring;
    get isEnableMirroring(): boolean;
    /**
     * @ignore
     */
    get video(): HTMLVideoElement;
    /**
     * Sets or returns the source URL for the video stream to be used by the `CameraEnhancer`.
     * 1. You can use this property to specify an existing video as the source to play which will be processed the same way as the video feed from a live camera.
     * 2. When playing an existing video, the camera selection and video selection boxes will be hidden.
     *
     * It is particularly useful for applications that need to process or display video from a specific source rather than the device's default camera.
     */
    set videoSrc(src: string);
    get videoSrc(): string;
    /**
     * Determines whether the last used camera settings should be saved and reused the next time the `CameraEnhancer` is initialized.
     *
     * The default is `false`.
     *
     * When set to `true`, the enhancer attempts to restore the previously used camera settings, offering a more seamless user experience across sessions.
     *
     * - This feature makes use of the [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) of the browser.
     * - This feature only works on mainstream browsers like Chrome, Firefox, and Safari. Other browsers may change the device IDs dynamically thus making it impossible to track the camera.
     */
    set ifSaveLastUsedCamera(value: boolean);
    get ifSaveLastUsedCamera(): boolean;
    /**
     * Determines whether to skip the initial camera inspection process.
     *
     * The default is `false`, which means to opt for an optimal rear camera at the first `open()`.
     *
     * Setting this property to `true` bypasses the automatic inspection and configuration that typically occurs when a camera connection is established.
     * This can be useful for scenarios where the default inspection process may not be desirable or necessary.
     *
     * Note that if a previously used camera is already available in the [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), the inspection is skipped automatically. Read more on `ifSaveLastUsedCamera`.
     */
    set ifSkipCameraInspection(value: boolean);
    get ifSkipCameraInspection(): boolean;
    /**
     * Specifies the timeout in milliseconds for opening the camera. The default value is 15000 ms.
     *
     * Setting 0 means canceling the timeout or waiting indefinitely.
     *
     * This property sets a limit on how long the `CameraEnhancer` will attempt to open the camera before timing out.
     * It can be adjusted to accommodate different devices and scenarios, ensuring that the application does not hang indefinitely while trying to access the camera.
     */
    set cameraOpenTimeout(value: number);
    get cameraOpenTimeout(): number;
    isTorchOn: undefined | boolean;
    set singleFrameMode(value: "disabled" | "camera" | "image");
    get singleFrameMode(): "disabled" | "camera" | "image";
    /**
     * Event handler in camera selection in default UI.
     * @ignore
     */
    private _onCameraSelChange;
    /**
     * Event handler in resolution selection in default UI.
     * @ignore
     */
    private _onResolutionSelChange;
    /**
     * Event handler in close button in default UI.
     *
     * Now the close button is removed, so it is useless.
     * @ignore
     */
    private _onCloseBtnClick;
    /**
     * Event handler for single frame mode.
     * @ignore
     */
    private _onSingleFrameAcquired;
    _intermediateResultReceiver: any;
    /**
     * @ignore
     */
    get _isFetchingStarted(): boolean;
    /**
     * Set the size limit of the gotten images.
     *
     * By default, there is no limit.
     * @ignore
     */
    canvasSizeLimit: number;
    /**
     * It is used in `DCEFrame.tag.imageId`.
     * @ignore
     */
    _imageId: number;
    private fetchInterval;
    /**
     * Returns whether the `CameraEnhancer` instance has been disposed of.
     *
     * @returns Boolean indicating whether the `CameraEnhancer` instance has been disposed of.
     */
    get disposed(): boolean;
    readonly isCameraEnhancer = true;
    private constructor();
    /**
     * Sets the `CameraView` instance to be used with the `CameraEnhancer`.
     * This method allows for specifying a custom camera view, which can be used to display the camera feed and interface elements.
     *
     * @param view A `CameraView` instance that will be used to display the camera's video feed and any associated UI components.
     */
    setCameraView(view: CameraView): void;
    /**
     * Retrieves the current `CameraView` instance associated with the `CameraEnhancer`.
     * This method allows for accessing the camera view, which can be useful for manipulating the view or accessing its properties and methods.
     *
     * @returns The current `CameraView` instance used by the `CameraEnhancer`.
     */
    getCameraView(): CameraView;
    /**
     *
     * @returns
     * @ignore
     */
    private releaseCameraView;
    /**
     * Add some event listeners to UI element in camera view.
     * @returns
     * @ignore
     */
    private addListenerToView;
    /**
     * Remove event listeners from UI element in camera view.
     * @returns
     */
    private removeListenerFromView;
    /**
     * Retrieves the current state of the camera.
     *
     * @returns A string indicating the camera's current state, which can be "opening", "open", or "closed".
     */
    getCameraState(): string;
    /**
     * Checks if the camera is currently open and streaming video.
     *
     * @returns Boolean indicating whether the camera is open (`true`) or not (`false`).
     */
    isOpen(): boolean;
    /**
     * Retrieves the HTMLVideoElement used by the `CameraEnhancer` for displaying the camera feed.
     * This method provides direct access to the video element, enabling further customization or interaction with the video stream.
     *
     * @returns The `HTMLVideoElement` that is being used to display the camera's video feed.
     */
    getVideoEl(): HTMLVideoElement;
    /**
     * Opens the currently selected camera and starts the video stream.
     *
     * @returns A promise that resolves with a `PlayCallbackInfo` object with details about the operation's outcome.
     */
    open(): Promise<PlayCallbackInfo>;
    /**
     * Closes the currently active camera and stops the video stream.
     */
    close(): void;
    /**
     * Pauses the video stream without closing the camera.
     * This can be useful for temporarily halting video processing while keeping the camera ready.
     */
    pause(): void;
    /**
     * Checks if the video stream is currently paused.
     *
     * @returns Boolean indicating whether the video stream is paused (`true`) or active (`false`).
     */
    isPaused(): boolean;
    /**
     * Resumes the video stream from a paused state.
     *
     * @returns A promise that resolves when the video stream resumes. It does not provide any value upon resolution.
     */
    resume(): Promise<void>;
    /**
     * Selects a specific camera for use by the `CameraEnhancer`. The camera can be specified by a `VideoDeviceInfo` object or by its device ID.
     * If called before `open()` or `show()`, the selected camera will be used. Otherwise, the system will decide which one to use.
     * @param cameraObjectOrDeviceID The `VideoDeviceInfo` object or device ID string of the camera to select.
     *
     * @returns A promise that resolves with a `PlayCallbackInfo` object indicating the outcome of the camera selection operation.
     */
    selectCamera(videoDeviceInfoOrDeviceId: VideoDeviceInfo | string): Promise<PlayCallbackInfo>;
    /**
     * Returns the currently selected camera device.
     *
     * @returns The `VideoDeviceInfo` object representing the currently active camera.
     */
    getSelectedCamera(): VideoDeviceInfo;
    /**
     * Retrieves a list of all available video input devices (cameras) on the current device.
     *
     * @returns A promise that resolves with an array of `VideoDeviceInfo` objects representing each available camera.
     */
    getAllCameras(): Promise<Array<VideoDeviceInfo>>;
    /**
     * Sets the resolution of the video stream to a specified value.
     * If the specified resolution is not exactly supported, the closest resolution will be applied.
     * If called before `open()` or `show()`, the camera will use the set resolution when it opens. Otherwise, the default resolution used is 1920x1080 on desktop and 1280x720 on mobile devices.
     * @param resolution The `Resolution` to which the video stream should be set.
     *
     * @returns A promise that resolves with a `PlayCallbackInfo` object with details about the operation's outcome.
     */
    setResolution(resolution: Resolution): Promise<PlayCallbackInfo>;
    /**
     * Gets the current resolution of the video stream.
     *
     * @returns The current `Resolution` of the video stream.
     */
    getResolution(): Resolution;
    /**
     * Retrieves a list of available resolutions supported by the currently selected camera.
     *
     * - The returned resolutions are limited to these values "160 by 120", "320 by 240", "480 by 360", "640 by 480", "800 by 600", "960 by 720", "1280 by 720", "1920 by 1080", "2560 by 1440", "3840 by 2160".
     * - The SDK tests all these resolutions to find out which ones are supported. As a result, the method may be time-consuming.
     *
     * @returns A promise that resolves with an array of `Resolution` objects representing each supported resolution.
     */
    getAvailableResolutions(): Promise<Array<Resolution>>;
    /**
     * 'on()' is the wrapper of '_on()'.
     * @param event includes
     * @param listener
     * @ignore
     */
    private _on;
    /**
     * 'off()' is the wrapper of '_off()'.
     * @param event
     * @param listener
     * @ignore
     */
    private _off;
    /**
     * Registers an event listener for specific camera-related events.
     * This method allows you to respond to various changes and states in the camera lifecycle.
     * @param eventName The name of the event to listen for. Possible values include "cameraOpen", "cameraClose", "cameraChange", "resolutionChange", "played", "singleFrameAcquired", and "frameAddedToBuffer".
     * @param listener The callback function to be invoked when the event occurs.
     */
    on(eventName: "cameraOpen" | "cameraClose" | "cameraChange" | "resolutionChange" | "played" | "singleFrameAcquired" | "frameAddedToBuffer", listener: Function): void;
    /**
     * Removes an event listener previously registered with the `on` method.
     * @param eventName The name of the event for which to remove the listener.
     * @param listener The callback function that was originally registered for the event.
     */
    off(eventName: "cameraOpen" | "cameraClose" | "cameraChange" | "resolutionChange" | "played" | "singleFrameAcquired" | "frameAddedToBuffer", listener: Function): void;
    /**
     * Retrieves the current video settings applied to the camera stream.
     *
     * @returns The current `MediaStreamConstraints` object representing the video stream's settings.
     */
    getVideoSettings(): MediaStreamConstraints;
    /**
     * Updates the video settings for the camera stream with new constraints.
     * @param constraints The new `MediaStreamConstraints` to apply to the video stream.
     *
     * @returns A promise that resolves when the new `MediaStreamConstraints` is applied. It does not provide any value upon resolution.
     */
    updateVideoSettings(mediaStreamConstraints: MediaStreamConstraints): Promise<void>;
    /**
     * Gets the capabilities of the current camera.
     *
     * At present, this method only works in Edge, Safari, Chrome and other Chromium-based browsers (Firefox is not supported). Also, it should be called when a camera is open.
     * @returns A `MediaTrackCapabilities` object representing the capabilities of the camera's video track.
     */
    getCapabilities(): MediaTrackCapabilities;
    /**
     * Retrieves the current settings of the camera.
     *
     * @returns The `MediaTrackSettings` object representing the current settings of the camera's video track.
     */
    getCameraSettings(): MediaTrackSettings;
    /**
     * Turns on the camera's torch (flashlight) mode, if supported.
     * This method should be called when the camera is turned on. Note that it only works with Chromium-based browsers such as Edge and Chrome on Windows or Android. Other browsers such as Firefox or Safari are not supported. Note that all browsers on iOS (including Chrome) use WebKit as the rendering engine and are not supported.
     * @returns A promise that resolves when the torch has been successfully turned on. It does not provide any value upon resolution.
     */
    turnOnTorch(): Promise<void>;
    /**
     * Turns off the camera's torch (flashlight) mode.
     * This method should be called when the camera is turned on. Note that it only works with Chromium-based browsers such as Edge and Chrome on Windows or Android. Other browsers such as Firefox or Safari are not supported. Note that all browsers on iOS (including Chrome) use WebKit as the rendering engine and are not supported.
     *
     * @returns A promise that resolves when the torch has been successfully turned off. It does not provide any value upon resolution.
     */
    turnOffTorch(): Promise<void>;
    _taskid4AutoTorch: any;
    _delay4AutoTorch: number;
    grayThreshold4AutoTorch: number;
    maxDarkCount4AutoTroch: number;
    turnAutoTorch(delay?: number): Promise<void>;
    /**
     * Sets the color temperature of the camera's video feed.
     * This method should be called when the camera is turned on. Note that it only works with Chromium-based browsers such as Edge and Chrome on Windows or Android. Other browsers such as Firefox or Safari are not supported. Note that all browsers on iOS (including Chrome) use WebKit as the rendering engine and are not supported.
     * @param colorTemperature The desired color temperature in Kelvin.
     *
     * @returns A promise that resolves when the color temperature has been successfully set. It does not provide any value upon resolution.
     */
    setColorTemperature(value: number): Promise<void>;
    /**
     * Retrieves the current color temperature setting of the camera's video feed.
     *
     * This method should be called when the camera is turned on. Note that it only works with Chromium-based browsers such as Edge and Chrome on Windows or Android. Other browsers such as Firefox or Safari are not supported. Note that all browsers on iOS (including Chrome) use WebKit as the rendering engine and are not supported.
     *
     * @returns The current color temperature in Kelvin.
     */
    getColorTemperature(): number;
    /**
     * Sets the exposure compensation of the camera's video feed.
     * This method should be called when the camera is turned on. Note that it only works with Chromium-based browsers such as Edge and Chrome on Windows or Android. Other browsers such as Firefox or Safari are not supported. Note that all browsers on iOS (including Chrome) use WebKit as the rendering engine and are not supported.
     * @param exposureCompensation The desired exposure compensation value.
     *
     * @returns A promise that resolves when the exposure compensation has been successfully set. It does not provide any value upon resolution.
     */
    setExposureCompensation(value: number): Promise<void>;
    /**
     * Retrieves the current exposure compensation setting of the camera's video feed.
     * This method should be called when the camera is turned on. Note that it only works with Chromium-based browsers such as Edge and Chrome on Windows or Android. Other browsers such as Firefox or Safari are not supported. Note that all browsers on iOS (including Chrome) use WebKit as the rendering engine and are not supported.
     *
     * @returns The current exposure compensation value.
     */
    getExposureCompensation(): number;
    /**
     * 'setZoom()' is the wrapper of '_setZoom()'. '_setZoom()' can set the zoom center, which is not tested and there are no plans to make it open to clients.
     * @ignore
     */
    private _setZoom;
    /**
     * Sets the zoom level of the camera.
     *
     * - How it works:
     * 1. If the camera supports zooming and the zoom factor is within its supported range, zooming is done directly by the camera.
     * 2. If the camera does not support zooming, software-based magnification is used instead.
     * 3. If the camera supports zooming but the zoom factor is beyond what it supports, the camera's maximum zoom is used, and software-based magnification is used to do the rest. (In this case, you may see a brief video flicker between the two zooming processes).
     * @param settings An object containing the zoom settings.
     * @param settings.factor: A number specifying the zoom level. At present, it is the only available setting.
     *
     * @returns A promise that resolves when the zoom level has been successfully set. It does not provide any value upon resolution.
     */
    setZoom(settings: {
        factor: number;
    }): Promise<void>;
    /**
     * Retrieves the current zoom settings of the camera.
     *
     * @returns An object containing the current zoom settings. As present, it contains only the zoom factor.
     */
    getZoomSettings(): {
        factor: number;
    };
    /**
     * Resets the zoom level of the camera to its default value.
     *
     * @returns A promise that resolves when the zoom level has been successfully reset. It does not provide any value upon resolution.
     */
    resetZoom(): Promise<void>;
    /**
     * Sets the frame rate of the camera's video stream.
     * - At present, this method only works in Edge, Safari, Chrome and other Chromium-based browsers (Firefox is not supported). Also, it should be called when a camera is open.
     * - If you provide a value that exceeds the camera's capabilities, we will automatically adjust it to the maximum value that can be applied.
     *
     * @param rate The desired frame rate in frames per second (fps).
     *
     * @returns A promise that resolves when the frame rate has been successfully set. It does not provide any value upon resolution.
     */
    setFrameRate(value: number): Promise<void>;
    /**
     * Retrieves the current frame rate of the camera's video stream.
     *
     * @returns The current frame rate in frames per second (fps).
     */
    getFrameRate(): number;
    /**
     * Sets the focus mode of the camera. This method allows for both manual and continuous focus configurations, as well as specifying a focus area.
     * - This method should be called when the camera is turned on. Note that it only works with Chromium-based browsers such as Edge and Chrome on Windows or Android. Other browsers such as Firefox or Safari are not supported. Note that all browsers on iOS (including Chrome) use WebKit as the rendering engine and are not supported.
     * - Typically, `continuous` mode works best. `manual` mode based on a specific area helps the camera focus on that particular area which may seem blurry under `continuous` mode. `manual` mode with specified distances is for those rare cases where the camera distance must be fine-tuned to get the best results.
     * @param settings An object describing the focus settings. The structure of this object varies depending on the mode specified (`continuous`, `manual` with fixed `distance`, or `manual` with specific `area`).
     *
     * @returns A promise that resolves when the focus settings have been successfully applied. It does not provide any value upon resolution.
     */
    setFocus(settings: {
        mode: string;
    } | {
        mode: "manual";
        distance: number;
    } | {
        mode: "manual";
        area: {
            centerPoint: {
                x: string;
                y: string;
            };
            width?: string;
            height?: string;
        };
    }): Promise<void>;
    /**
     * Retrieves the current focus settings of the camera.
     *
     * @returns An object representing the current focus settings or null.
     */
    getFocusSettings(): Object;
    /**
     * Sets the auto zoom range for the camera.
     * `EF_AUTO_ZOOM` is one of the enhanced features that require a license, and is only effective when used in conjunction with other functional products of Dynamsoft.
     * This method allows for specifying the minimum and maximum zoom levels that the camera can automatically adjust to.
     *
     * @param range An object specifying the minimum and maximum zoom levels. Both `min` and `max` should be positive numbers, with `min` less than or equal to `max`. The default is `{min: 1, max: 999}`.
     */
    setAutoZoomRange(range: {
        min: number;
        max: number;
    }): void;
    /**
     * Retrieves the current auto zoom range settings for the camera.
     * `EF_AUTO_ZOOM` is one of the enhanced features that require a license, and is only effective when used in conjunction with other functional products of Dynamsoft.
     *
     * @returns An object representing the current auto zoom range, including the minimum and maximum zoom levels.
     */
    getAutoZoomRange(): {
        min: number;
        max: number;
    };
    /**
     * Enables one or more enhanced features.
     * This method allows for activating specific advanced capabilities that may be available.
     *
     * - The enhanced features require a license, and only take effect when used in conjunction with other functional products under the Dynamsoft Capture Vision（DCV）architecture.
     * - `EF_ENHANCED_FOCUS` and `EF_TAP_TO_FOCUS` only works with Chromium-based browsers such as Edge and Chrome on Windows or Android. Other browsers such as Firefox or Safari are not supported. Note that all browsers on iOS (including Chrome) use WebKit as the rendering engine and are not supported.
     * @param enhancedFeatures An enum value or a bitwise combination of `EnumEnhancedFeatures` indicating the features to be enabled.
     */
    enableEnhancedFeatures(enhancedFeatures: EnumEnhancedFeatures): void;
    /**
     * Disables one or more previously enabled enhanced features.
     * This method can be used to deactivate specific features that are no longer needed or to revert to default behavior.
     *
     * @param enhancedFeatures An enum value or a bitwise combination of `EnumEnhancedFeatures` indicating the features to be disabled.
     */
    disableEnhancedFeatures(enhancedFeatures: EnumEnhancedFeatures): void;
    /**
     * Differ from 'setScanRegion()', 'setScanRegion()' will update the UI in camera view, while '_setScanRegion()' not.
     * @param region
     * @ignore
     */
    private _setScanRegion;
    /**
     * Sets the scan region within the camera's view which limits the frame acquisition to a specific area of the video feed.
     *
     * Note: The region is always specified relative to the original video size, regardless of any transformations or zoom applied to the video display.
     *
     * @param region Specifies the scan region.
     */
    setScanRegion(region: DSRect | Rect): void;
    /**
     * Retrieves the current scan region set within the camera's view.
     *
     * Note: If no scan region has been explicitly set before calling this method, an error may be thrown, indicating the necessity to define a scan region beforehand.
     *
     * @returns A `DSRect` or `Rect` object representing the current scan region.
     *
     * @throws Error indicating that no scan region has been set, if applicable.
     */
    getScanRegion(): DSRect | Rect;
    /**
     * Sets an error listener to receive notifications about errors that occur during image source operations.
     *
     * @param listener An instance of `ImageSourceErrorListener` or its derived class to handle error notifications.
     */
    setErrorListener(listener: ImageSourceErrorListener): void;
    /**
     * Determines whether there are more images available to fetch.
     *
     * @returns Boolean indicating whether more images can be fetched. `false` means the image source is closed or exhausted.
     */
    hasNextImageToFetch(): boolean;
    /**
     * Starts the process of fetching images.
     */
    startFetching(): void;
    /**
     * Stops the process of fetching images.
     * to false, indicating that image fetching has been halted.
     */
    stopFetching(): void;
    /**
    * Toggles the mirroring of the camera's video stream.
    * This method flips the video stream horizontally when enabled, creating a mirror effect.
    * It is useful for applications using the front-facing camera where a mirrored view is more intuitive for users.
    *
    * @param enable - If true, enables the mirroring; if false, disables the mirroring.
    */
    toggleMirroring(enable: boolean): void;
    /**
     * Fetches the current frame from the camera's video feed.
     * This method is used to obtain the latest image captured by the camera.
     *
     * @returns A `DCEFrame` object representing the current frame.
     * The structure and content of this object will depend on the pixel format set by `setPixelFormat()` and other settings.
     */
    fetchImage(isUserCall?: boolean): DCEFrame;
    /**
     * Sets the interval at which images are continuously fetched from the camera's video feed.
     * This method allows for controlling how frequently new frames are obtained when `startFetching()` is invoked,
     * which can be useful for reducing computational load or for pacing the frame processing rate.
     *
     * @param interval The desired interval between fetches, specified in milliseconds.
     */
    setImageFetchInterval(interval: number): void;
    /**
     * Retrieves the current interval at which images are continuously fetched from the camera's video feed.
     *
     * @returns The current fetch interval, specified in milliseconds.
     */
    getImageFetchInterval(): number;
    /**
     * Sets the pixel format for the images fetched from the camera, which determines the format of the images added to the buffer when the `fetchImage()` or `startFetching()` method is called.
     * It can affect both the performance of image processing tasks and the compatibility with certain analysis algorithms.
     *
     * @param pixelFormat The desired pixel format for the images. Supported formats include `IPF_GRAYSCALED`, `IPF_ABGR_8888`.
     */
    setPixelFormat(format: EnumImagePixelFormat.IPF_GRAYSCALED | EnumImagePixelFormat.IPF_ABGR_8888): void;
    /**
     * Retrieves the current pixel format used for images fetched from the camera.
     *
     * @returns The current pixel format, which could be one of the following: `IPF_GRAYSCALED`, `IPF_ABGR_8888`, and `IPF_ARGB_8888`.
     */
    getPixelFormat(): EnumImagePixelFormat;
    /**
     * Initiates a sequence to capture a single frame from the camera, only valid when the camera was open. halting the video stream temporarily.
     * This method prompts the user to either select a local image or capture a new one using the system camera, similar to the behavior in `singleFrameMode` but without changing the mode.
     *
     * Note: This method is intended for use cases where capturing a single, user-obtained image is necessary while the application is otherwise utilizing a live video stream.
     *
     * Steps performed by `takePhoto`:
     * 1. Stops the video stream and releases the camera, if it was in use.
     * 2. Prompts the user to take a new image with the system camera (on desktop, it prompts the user to select an image from the disk). This behavior mirrors that of `singleFrameMode[=="camera"]`
     * 3. Returns the obtained image in a callback function, this differs from `singleFrameMode` which would display the image in the view.
     * NOTE: user should resume the video stream after the image has been obtained to keep the video stream going.
     * @param listener A callback function that is invoked with a `DCEFrame` object containing the obtained image.
     */
    takePhoto(listener: (dceFrame: DCEFrame) => void): void;
    /**
     * Converts coordinates from the video's coordinate system to coordinates relative to the whole page.
     * This is useful for overlaying HTML elements on top of specific points in the video, aligning with the page's layout.
     *
     * @param point A `Point` object representing the x and y coordinates within the video's coordinate system.
     *
     * @returns A `Point` object representing the converted x and y coordinates relative to the page.
     */
    convertToPageCoordinates(point: Point): Point;
    /**
     * Converts coordinates from the video's coordinate system to coordinates relative to the viewport.
     * This is useful for positioning HTML elements in relation to the video element on the screen, regardless of page scrolling.
     *
     * @param point A `Point` object representing the x and y coordinates within the video's coordinate system.
     *
     * @returns A `Point` object representing the converted x and y coordinates relative to the viewport.
     */
    convertToClientCoordinates(point: Point): Point;
    /**
     * Converts coordinates from the video's coordinate system to coordinates relative to the viewport.
     * This is useful for positioning HTML elements in relation to the video element on the screen, regardless of page scrolling.
     *
     * @param point A `Point` object representing the x and y coordinates within the video's coordinate system.
     *
     * @returns A `Point` object representing the converted x and y coordinates relative to the viewport.
     */
    convertToScanRegionCoordinates(point: Point): Point;
    /**
     * Converts coordinates from the video's coordinate system under `fit: cover` mode
     * back to coordinates under `fit: contain` mode.
     * This is useful when you need to map points detected in a cropped/resized video (cover)
     * back to the original video dimensions (contain).
     *
     * @param point A `Point` object representing the x and y coordinates within the video's `cover` coordinate system.
     *
     * @returns A `Point` object representing the converted x and y coordinates under `contain` mode.
     */
    convertToContainCoordinates(point: Point): Point;
    /**
     * Releases all resources used by the `CameraEnhancer` instance.
     */
    dispose(): void;
}

declare class CameraView extends View {
    #private;
    /**
     * @ignore
     */
    static _onLog: (message: any) => void;
    private static get engineResourcePath();
    private static _defaultUIElementURL;
    /**
     * Specifies the URL to a default UI definition file.
     * This URL is used as a fallback source for the UI of the `CameraView` class when the `createInstance()` method is invoked without specifying a `HTMLDivElement`.
     * This ensures that `CameraView` has a user interface even when no custom UI is provided.
     */
    static set defaultUIElementURL(value: string);
    static get defaultUIElementURL(): string;
    /**
     * Initializes a new instance of the `CameraView` class.
     * This method allows for optional customization of the user interface (UI) through a specified HTML element or an HTML file.
     */
    static createInstance(elementOrUrl?: HTMLElement | string): Promise<CameraView>;
    /**
     * Transform the coordinates from related to scan region to related to the whole video/image.
     * @param coord The coordinates related to scan region.
     * @param sx The x coordinate of scan region related to the whole video/image.
     * @param sy The y coordinate of scan region related to the whole video/image.
     * @param sWidth The width of scan region.
     * @param sHeight The height of scan region.
     * @param dWidth The width of cropped image. Its value is different from `sWidth` when the image is compressed.
     * @param dHeight The height of cropped image. Its value is different from `sHeight` when the image is compressed.
     * @ignore
     */
    static _transformCoordinates(coord: {
        x: number;
        y: number;
    }, sx: number, sy: number, sWidth: number, sHeight: number, dWidth: number, dHeight: number): void;
    cameraEnhancer: CameraEnhancer;
    /**
     * @ignore
     */
    eventHandler: EventHandler;
    private UIElement;
    private _poweredByVisible;
    /**
     * @ignore
     */
    containerClassName: string;
    _videoContainer: HTMLDivElement;
    private videoFit;
    /** @ignore */
    _hideDefaultSelection: boolean;
    /** @ignore */
    _divScanArea: any;
    /** @ignore */
    _divScanLight: any;
    /** @ignore */
    _bgLoading: any;
    /** @ignore */
    _selCam: any;
    /** @ignore */
    _bgCamera: any;
    /** @ignore */
    _selRsl: any;
    /** @ignore */
    _optGotRsl: any;
    /** @ignore */
    _btnClose: any;
    /** @ignore */
    _selMinLtr: any;
    /** @ignore */
    _optGotMinLtr: any;
    /** @ignore */
    _poweredBy: any;
    /** @ignore */
    _cvsSingleFrameMode: HTMLCanvasElement;
    private scanRegion;
    private _drawingLayerOfMask;
    private _maskBackRectStyleId;
    private _maskCenterRectStyleId;
    private regionMaskFillStyle;
    private regionMaskStrokeStyle;
    private regionMaskLineWidth;
    /**
     * @ignore
     */
    _userSetMaskVisible: boolean;
    /**
     * @ignore
     */
    _userSetLaserVisible: boolean;
    private _updateLayersTimeoutId;
    private _updateLayersTimeout;
    /**
     * Trigger when the css dimensions of the container of video element changed, or window changed.
     */
    private _videoResizeListener;
    private _windowResizeListener;
    private _resizeObserver;
    /**
     * @ignore
     */
    set _singleFrameMode(value: "disabled" | "camera" | "image");
    get _singleFrameMode(): "disabled" | "camera" | "image";
    _onSingleFrameAcquired: (canvas: HTMLCanvasElement) => void;
    private _singleFrameInputContainer;
    _clickIptSingleFrameMode: () => void;
    _capturedResultReceiver: any;
    /**
     * Returns whether the `CameraView` instance has been disposed of.
     *
     * @returns Boolean indicating whether the `CameraView` instance has been disposed of.
     */
    get disposed(): boolean;
    private constructor();
    /**
     * Differ from 'setUIElement()', 'setUIElement()' allow parameter of 'string' type, which means a url, '_setUIElement()' only accept parameter of 'HTMLElement' type.
     * @param element
     */
    private _setUIElement;
    setUIElement(elementOrUrl: HTMLElement | string): Promise<void>;
    getUIElement(): HTMLElement;
    private _bindUI;
    private _unbindUI;
    /**
     * Show loading animation.
     * @ignore
     */
    _startLoading(): void;
    /**
     * Hide loading animation.
     * @ignore
     */
    _stopLoading(): void;
    /**
     * Render cameras info in camera selection in default UI.
     * @ignore
     */
    _renderCamerasInfo(curCamera: {
        deviceId: string;
        label: string;
    }, cameraList: Array<{
        deviceId: string;
        label: string;
    }>): void;
    /**
     * Render resolution list in resolution selection in default UI.
     * @ignore
     */
    _renderResolutionInfo(curResolution: {
        width: number;
        height: number;
    }): void;
    /**
     * Retrieves the `HTMLVideoElement` that is currently being used for displaying the video in this `CameraView` instance.
     * This method allows access to the underlying video element, enabling direct interaction or further customization.
     *
     * @returns The `HTMLVideoElement` currently used by this `CameraView` instance for video display.
     */
    getVideoElement(): HTMLVideoElement;
    /**
     * tell if video is loaded.
     * @ignore
     */
    isVideoLoaded(): boolean;
    /**
     * Sets the `object-fit` CSS property of the `HTMLVideoElement` used by this `CameraView` instance.
     * The `object-fit` property specifies how the video content should be resized to fit the container in a way that maintains its aspect ratio.
     * @param objectFit The value for the `object-fit` property. At present, only "cover" and "contain" are allowed and the default is "contain".
     * Check out more on [object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit).
     */
    setVideoFit(value: "contain" | "cover"): void;
    /**
     * Retrieves the current value of the `object-fit` CSS property from the `HTMLVideoElement` used by this `CameraView` instance.
     * The `object-fit` property determines how the video content is resized to fit its container.
     *
     * @returns The current value of the `object-fit` property applied to the video element. At present, the value is limited to "cover" and "contain".
     * Check out more on [object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit).
     */
    getVideoFit(): "contain" | "cover";
    /**
     * Get dimensions of content(video, or image in single frame mode). It decides what dimensions the layers should be created.
     * @returns
     */
    protected getContentDimensions(): {
        width: number;
        height: number;
        objectFit: string;
    };
    /**
     * Update prop '#convertedRegion' and update related UI.
     * @param contentDimensions
     * @ignore
     */
    private updateConvertedRegion;
    /**
     * @ignore
     */
    getConvertedRegion(): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * @ignore
     */
    setScanRegion(region: DSRect | Rect): void;
    /**
     * @ignore
     */
    getScanRegion(): any;
    /**
     * Returns the region of the video that is currently visible to the user.
     * @param options [Optional] Specifies how the visible region should be returned.
     * @param options.inPixels [Optional] If `true`, the coordinates of the visible region are returned in pixels. If `false` or omitted, the coordinates are returned as a percentage of the video element's size.
     *
     * @returns An object representing the visible region of the video.
     */
    getVisibleRegionOfVideo(options: {
        inPixels?: boolean;
    }): Rect;
    private setScanRegionMask;
    private clearScanRegionMask;
    /**
     * Not used yet.
     * @ignore
     */
    private deleteScanRegionMask;
    /**
     *
     * @param visible
     * @ignore
     */
    _setScanRegionMaskVisible(visible: boolean): void;
    /**
     * Sets the visibility of the scan region mask. This can be used to show or hide the mask.
     * @param visible Boolean indicating whether the scan region mask should be visible (`true`) or not (`false`).
     */
    setScanRegionMaskVisible(visible: boolean): void;
    /**
     * Checks if the scan region mask is currently visible.
     *
     * @returns Boolean indicating whether the scan region mask is visible (`true`) or not (`false`).
     */
    isScanRegionMaskVisible(): boolean;
    /**
     * Sets the style of the scan region mask. This style includes the line width, stroke color, and fill color.
     * @param style An object containing the new style settings for the scan region mask.
     * @param style.lineWidth The width of the line used to draw the border of the scan region mask.
     * @param style.strokeStyle The color of the stroke (border) of the scan region mask.
     * @param style.fillStyle The fill color of the scan region mask.
     */
    setScanRegionMaskStyle(style: {
        lineWidth: number;
        strokeStyle: string;
        fillStyle: string;
    }): void;
    /**
     * Retrieves the current style of the scan region mask. This includes the line width, stroke color, and fill color.
     */
    getScanRegionMaskStyle(): {
        fillStyle: string;
        strokeStyle: string;
        lineWidth: number;
    };
    /**
     * @ignore
     */
    private _setScanLaserVisible;
    /**
     * Sets the visibility of the scan laser effect. This can be used to show or hide the scan laser.
     * @param visible Boolean indicating whether the scan laser should be visible (`true`) or not (`false`).
     */
    setScanLaserVisible(visible: boolean): void;
    /**
     * Checks if the scan laser effect is currently visible.
     *
     * @returns Boolean indicating whether the scan laser is visible (`true`) or not (`false`).
     */
    isScanLaserVisible(): boolean;
    /**
     * @ignore
     */
    _updateVideoContainer(): void;
    /**
     * Sets the visibility of the `power by Dynamsoft` message. This can be used to show or hide the message.
     * @param visible Boolean indicating whether the message should be visible (`true`) or not (`false`).
     */
    setPowerByMessageVisible(visible: boolean): void;
    /**
     * Checks if the `power by Dynamsoft` message is currently visible.
     *
     * @returns Boolean indicating whether the message is visible (`true`) or not (`false`).
     */
    isPowerByMessageVisible(): boolean;
    /**
     * Update all layers(scan laser, drawing layers, scan region mask). Not used yet.
     * @ignore
     */
    private updateLayers;
    /**
     * Clears all system-defined `DrawingItem` objects while keeping user-defined ones.
     */
    clearAllInnerDrawingItems(): void;
    /**
     * Remove added elements. Remove event listeners.
     */
    dispose(): void;
}


interface ParsedResultItem extends CapturedResultItem {
    /**
     * The code type of the parsed result.
     */
    codeType: string;
    /**
     * The parsed result represented as a JSON-formatted string.
     */
    jsonString: string;
    /**
     * Retrieves the value of a specified field.
     * @param fieldName The name of the field whose value is being requested.
     *
     * @returns The value of the field.
     */
    getFieldValue(fieldName: string): string;
    /**
     * Retrieves the value of a specified field from the parsed result, without mapping process.
     * @param fieldName The name of the field whose raw value is being requested.
     *
     * @returns The raw value of the field.
     */
    getFieldRawValue(fieldName: string): string;
    /**
     * Retrieves the mapping status for a specified field name.
     * @param fieldName The name of the field whose mapping status is being queried.
     *
     * @returns The mapping status of the specified field as an EnumMappingStatus value.
     */
    getFieldMappingStatus: (fieldName: string) => EnumMappingStatus;
    /**
     * Retrieves the validation status for a specified field name.
     * @param fieldName The name of the field whose validation status is being queried.
     *
     * @returns The validation status of the specified field as an EnumValidationStatus value.
     */
    getFieldValidationStatus: (fieldName: string) => EnumValidationStatus;
}

declare enum EnumMappingStatus {
    /**
     * Indicates that no mapping operation has been initiated.
     */
    MS_NONE = 0,
    /**
     * Indicates that the mapping operation was successfully completed.
     */
    MS_SUCCEEDED = 1,
    /**
     * Indicates that the mapping operation failed to complete.
     */
    MS_FAILED = 2
}

declare enum EnumValidationStatus {
    /**
     * Indicates that no validation has been performed.
     */
    VS_NONE = 0,
    /**
     * Indicates that the validation process was completed successfully.
     */
    VS_SUCCEEDED = 1,
    /**
     * Indicates that the validation process failed.
     */
    VS_FAILED = 2
}

interface ParsedResult extends CapturedResultBase {
    /**
     * An array of `ParsedResultItem` objects.
     */
    parsedResultItems: Array<ParsedResultItem>;
}



declare class DocumentNormalizerModule {
    /**
     * Returns the version of the DocumentNormalizer module.
     */
    static getVersion(): string;
}

/**
 * `EnumImageColourMode` determines the output colour mode of the normalized image.
 */
declare enum EnumImageColourMode {
    /** Output image in color mode. */
    ICM_COLOUR = 0,
    /** Output image in grayscale mode. */
    ICM_GRAYSCALE = 1,
    /** Output image in binary mode. */
    ICM_BINARY = 2
}

interface DetectedQuadResultItem extends CapturedResultItem {
    /** The location of the detected quadrilateral within the original image, represented as a quadrilateral shape. */
    location: Quadrilateral;
    /** A confidence score related to the detected quadrilateral's accuracy as a document boundary. */
    confidenceAsDocumentBoundary: number;
    /** Indicates whether the DetectedQuadResultItem has passed corss verification. */
    CrossVerificationStatus: EnumCrossVerificationStatus;
}

interface DeskewedImageResultItem extends CapturedResultItem {
    /** The image data for the deskewed image result. */
    imageData: DSImageData;
    /** The location where the deskewed image was extracted from within the input image image of the deskew section, represented as a quadrilateral. */
    sourceLocation: Quadrilateral;
    toCanvas: () => HTMLCanvasElement;
    toImage: (MIMEType: "image/png" | "image/jpeg") => HTMLImageElement;
    toBlob: (MIMEType: "image/png" | "image/jpeg") => Promise<Blob>;
}

interface EnhancedImageElement extends RegionObjectElement {
    /** The image data for the enhanced image. */
    imageData: DSImageData;
}

interface EnhancedImageResultItem extends CapturedResultItem {
    /** The image data for the enhanced image result. */
    imageData: DSImageData;
    /** Converts the enhanced image data into an HTMLCanvasElement for display or further manipulation in web applications. */
    toCanvas: () => HTMLCanvasElement;
    /** Converts the enhanced image data into an HTMLImageElement of a specified MIME type ('image/png' or 'image/jpeg'). */
    toImage: (MIMEType: "image/png" | "image/jpeg") => HTMLImageElement;
    /** Converts the enhanced image data into a Blob object of a specified MIME type ('image/png' or 'image/jpeg'). */
    toBlob: (MIMEType: "image/png" | "image/jpeg") => Promise<Blob>;
}

interface EnhancedImageUnit extends IntermediateResultUnit {
    /** An array of `EnhancedImageElement` objects, each representing a piece of the original image after enhancement. */
    enhancedImage: EnhancedImageElement;
}

interface CandidateQuadEdgesUnit extends IntermediateResultUnit {
    /** An array of candidate edges that may form quadrilaterals, identified during image processing. */
    candidateQuadEdges: Array<Edge>;
}

interface CornersUnit extends IntermediateResultUnit {
    /** An array of detected corners within the image, identified during image processing. */
    corners: Array<Corner>;
}

interface DetectedQuadElement extends RegionObjectElement {
    /** A confidence score measuring the certainty that the detected quadrilateral represents the boundary of a document. */
    confidenceAsDocumentBoundary: number;
}

interface DetectedQuadsUnit extends IntermediateResultUnit {
    /** An array of `DetectedQuadElement` objects, each representing a potential document or area of interest within the image. */
    detectedQuads: Array<DetectedQuadElement>;
}

interface LongLinesUnit extends IntermediateResultUnit {
    /** An array of long line segments detected within the image. */
    longLines: Array<LineSegment>;
}

interface LogicLinesUnit extends IntermediateResultUnit {
    /** An array of logic line segments detected within the image. */
    logicLines: Array<LineSegment>;
}

interface DeskewedImageElement extends RegionObjectElement {
    /** The image data for the deskewed image. */
    imageData: DSImageData;
    /** A reference to another `RegionObjectElement`. */
    referencedElement: RegionObjectElement;
}

interface DeskewedImageUnit extends IntermediateResultUnit {
    /** The `DeskewedImageElement` objects representing a piece of the original image after deskewing. */
    deskewedImage: DeskewedImageElement;
}

interface ProcessedDocumentResult extends CapturedResultBase {
    /** An array of `DetectedQuadResultItem` objects, each representing a quadrilateral after document detection. */
    detectedQuadResultItems: Array<DetectedQuadResultItem>;
    /** An array of `DeskewedImageResultItem` objects, each representing a piece of the original image after deskewing. */
    deskewedImageResultItems: Array<DeskewedImageResultItem>;
    /** An array of `EnhancedImageResultItem` objects, each representing a piece of the original image after enhancement. */
    enhancedImageResultItems: Array<EnhancedImageResultItem>;
}

/**
 * The `SimplifiedDocumentNormalizerSettings` interface defines simplified settings for document detection and normalization.
 */
interface SimplifiedDocumentNormalizerSettings {
    /** Grayscale enhancement modes to apply for improving detection in challenging conditions. */
    grayscaleEnhancementModes: Array<EnumGrayscaleEnhancementMode>;
    /** Grayscale transformation modes to apply, enhancing detection capability. */
    grayscaleTransformationModes: Array<EnumGrayscaleTransformationMode>;
    /** Color mode of the anticipated normalized page */
    colourMode: EnumImageColourMode;
    /** Width and height of the anticipated normalized page. */
    pageSize: [number, number];
    /** Anticipated brightness level of the normalized image. */
    brightness: number;
    /** Anticipated contrast level of the normalized image. */
    contrast: number;
    /**
     * Threshold for reducing the size of large images to speed up processing.
     * If the size of the image's shorter edge exceeds this threshold, the image may be downscaled to decrease processing time. The standard setting is 2300.
     */
    scaleDownThreshold: number;
    /** The minimum ratio between the target document area and the total image area. Only those exceedingthis value will be output (measured in percentages).*/
    minQuadrilateralAreaRatio: number;
    /** The number of documents expected to be detected.*/
    expectedDocumentsCount: number;
}


interface CharacterResult {
    /** The highest confidence character recognized. */
    characterH: string;
    /** The medium confidence character recognized. */
    characterM: string;
    /** The lowest confidence character recognized. */
    characterL: string;
    /** Confidence score for the highest confidence character. */
    characterHConfidence: number;
    /** Confidence score for the medium confidence character. */
    characterMConfidence: number;
    /** Confidence score for the lowest confidence character. */
    characterLConfidence: number;
    /** The location of the recognized character within the image. */
    location: Quadrilateral;
}

interface TextLineResultItem extends CapturedResultItem {
    /** The recognized text of the line. */
    text: string;
    /** The location of the text line within the image. */
    location: Quadrilateral;
    /** Confidence score for the recognized text line. */
    confidence: number;
    /** Results for individual characters within the text line. */
    characterResults: Array<CharacterResult>;
    /** The name of the TextLineSpecification object that generated this TextLineResultItem. */
    specificationName: string;
    /** The recognized raw text of the line. */
    rawText: string;
}

/**
 * Enumerates the status of a raw text line.
 */
declare enum EnumRawTextLineStatus {
    /** Localized but recognition not performed. */
    RTLS_LOCALIZED = 0,
    /** Recognition failed. */
    RTLS_RECOGNITION_FAILED = 1,
    /** Successfully recognized. */
    RTLS_RECOGNITION_SUCCEEDED = 2
}

interface LocalizedTextLineElement extends RegionObjectElement {
    /** Quadrilaterals for each character in the text line. */
    characterQuads: Array<Quadrilateral>;
    /** The row number of the text line, starting from 1. */
    rowNumber: number;
}

interface LocalizedTextLinesUnit extends IntermediateResultUnit {
    /** An array of `LocalizedTextLineElement` objects, each representing a localized text line. */
    localizedTextLines: Array<LocalizedTextLineElement>;
}

interface RecognizedTextLineElement extends RegionObjectElement {
    /** The recognized text of the line. */
    text: string;
    /** Confidence score for the recognized text line. */
    confidence: number;
    /** Results for individual characters within the text line. */
    characterResults: Array<CharacterResult>;
    /** The row number of the text line, starting from 1. */
    rowNumber: number;
    /** The name of the TextLineSpecification object that generated this RecognizedTextLineElement. */
    specificationName: string;
    /** The recognized raw text of the line. */
    rawText: string;
}

interface RecognizedTextLinesResult extends CapturedResultBase {
    /**
     * An array of `TextLineResultItem` objects, each representing a recognized text line within the original image.
     */
    textLineResultItems: Array<TextLineResultItem>;
}

interface SimplifiedLabelRecognizerSettings {
    /** Name of the character model used for recognition. */
    characterModelName: string;
    /** Regular expression pattern for validating recognized line strings. */
    lineStringRegExPattern: string;
    /** Grayscale transformation modes to apply, enhancing detection capability. */
    grayscaleTransformationModes: Array<EnumGrayscaleTransformationMode>;
    /** Grayscale enhancement modes to apply for improving detection in challenging conditions. */
    grayscaleEnhancementModes: Array<EnumGrayscaleEnhancementMode>;
    /**
     * Threshold for reducing the size of large images to speed up processing. If the size of the image's shorter edge exceeds this threshold, the image may be downscaled to decrease processing time. The standard setting is 2300. */
    scaleDownThreshold: number;
}

interface BufferedCharacterItem {
    /** The buffered character value. */
    character: string;
    /** The image data of the buffered character. */
    image: DSImageData;
    /**  An array of features, each feature object contains feature id and value of the buffered character.*/
    features: Map<number, number>;
}

interface CharacterCluster {
    /** The character value of the cluster. */
    character: string;
    /** The mean of the cluster. */
    mean: BufferedCharacterItem;
}

interface BufferedCharacterItemSet {
    /** An array of BufferedCharacterItem. */
    items: Array<BufferedCharacterItem>;
    /** An array of CharacterCluster. */
    characterClusters: Array<CharacterCluster>;
}

/**
 * The `RawTextLine` represents a text line in an image. It can be in one of the following states:
 * - `TLS_LOCALIZED`: Localized but recognition not performed.
 * - `TLS_RECOGNITION_FAILED`: Recognition failed.
 * - `TLS_RECOGNIZED_SUCCESSFULLY`: Successfully recognized.
 */
interface RawTextLine extends RegionObjectElement {
    /** The recognized text of the line. */
    text: string;
    /** Confidence score for the recognized text line. */
    confidence: number;
    /** Results for individual characters within the text line. */
    characterResults: Array<CharacterResult>;
    /** The row number of the text line, starting from 1. */
    rowNumber: number;
    /** The predefined specification name of this text line*/
    specificationName: string;
    /** The location of the text line */
    location: Quadrilateral;
    /** The status of a raw text line.*/
    status: EnumRawTextLineStatus;
}

interface RawTextLinesUnit extends IntermediateResultUnit {
    /** An array of RawTextLine. */
    rawTextlines: Array<RawTextLine>;
}

interface RecognizedTextLinesUnit extends IntermediateResultUnit {
    recognizedTextLines: Array<RecognizedTextLineElement>;
}


declare class LicenseModule {
    /**
     * Returns the version of the License module.
     */
    static getVersion(): string;
}

declare class LicenseManager {
    private static setLicenseServer;
    static _pLoad: any;
    static bPassValidation: boolean;
    static bCallInitLicense: boolean;
    private static _license;
    static get license(): string;
    static set license(license: string);
    /**
     * Specify the license server URL.
    */
    private static _licenseServer?;
    static get licenseServer(): string[] | string;
    static set licenseServer(value: string[] | string);
    private static _deviceFriendlyName;
    static get deviceFriendlyName(): string;
    static set deviceFriendlyName(value: string);
    /**
     * License the components.
     * @param license the license key to be used.
     * @remarks - for an online license, LicenseManager asks DLS for the license associated with the 'license' key and gets all usable modules
                - for an offline license, LicenseManager parses it to get a list of usable modules
     * @returns a promise resolving to true or false to indicate whether the license was initialized successfully.
    */
    static initLicense(license: string, options?: {
        executeNow: boolean;
    } | boolean): void | Promise<void>;
    /**
     * The following methods should be called before `initLicense`.
     */
    static setDeviceFriendlyName(name: string): void;
    static getDeviceFriendlyName(): string;
    /**
     * Returns the unique identifier of the device.
     *
     * @returns A promise which, upon resolution, yields a string corresponding to the device's UUID.
     */
    static getDeviceUUID(): Promise<string>;
}




declare class UtilityModule {
    /**
     * Returns the version of the Utility module.
     */
    static getVersion(): string;
}

type resultItemTypesString = "barcode" | "text_line" | "detected_quad" | "deskewed_image" | "enhanced_image";
type CapturedResultMap<T> = {
    [K in EnumCapturedResultItemType]?: T;
};

declare class MultiFrameResultCrossFilter implements CapturedResultFilter {
    #private;
    constructor();
    verificationEnabled: CapturedResultMap<boolean>;
    duplicateFilterEnabled: CapturedResultMap<boolean>;
    duplicateForgetTime: CapturedResultMap<number>;
    private _dynamsoft;
    /**
     * Enables or disables the verification of one or multiple specific result item types.
     * @param resultItemTypes Specifies one or multiple specific result item types, which can be defined using EnumCapturedResultItemType or a string. If using a string, only one type can be specified, and valid values include "barcode", "text_line", "detected_quad", and "normalized_image".
     * @param enabled Boolean to toggle verification on or off.
     */
    enableResultCrossVerification(resultItemTypes: EnumCapturedResultItemType | resultItemTypesString, enabled: boolean): void;
    /**
     * Checks if verification is active for a given result item type.
     * @param resultItemType Specifies the result item type, either with EnumCapturedResultItemType or a string. When using a string, the valid values include "barcode", "text_line", "detected_quad", and "normalized_image".
     * @returns Boolean indicating the status of verification for the specified type.
     */
    isResultCrossVerificationEnabled(resultItemTypes: EnumCapturedResultItemType | resultItemTypesString): boolean;
    /**
     * Enables or disables the deduplication process for one or multiple specific result item types.
     * @param resultItemTypes Specifies one or multiple specific result item types, which can be defined using EnumCapturedResultItemType or a string. If using a string, only one type can be specified, and valid values include "barcode", "text_line", "detected_quad", and "normalized_image".
     * @param enabled Boolean to toggle deduplication on or off.
     */
    enableResultDeduplication(resultItemTypes: EnumCapturedResultItemType | resultItemTypesString, enabled: boolean): void;
    /**
     * Checks if deduplication is active for a given result item type.
     * @param resultItemType Specifies the result item type, either with EnumCapturedResultItemType or a string. When using a string, the valid values include "barcode", "text_line", "detected_quad", and "normalized_image".
     * @returns Boolean indicating the deduplication status for the specified type.
     */
    isResultDeduplicationEnabled(resultItemTypes: EnumCapturedResultItemType | resultItemTypesString): boolean;
    /**
     * Sets the interval during which duplicates are disregarded for specific result item types.
     * @param resultItemTypes Specifies one or multiple specific result item types, which can be defined using EnumCapturedResultItemType or a string. If using a string, only one type can be specified, and valid values include "barcode", "text_line", "detected_quad", and "normalized_image".
     * @param time Time in milliseconds during which duplicates are disregarded.
     */
    setDuplicateForgetTime(resultItemTypes: EnumCapturedResultItemType | resultItemTypesString, time: number): void;
    /**
     * Retrieves the interval during which duplicates are disregarded for a given result item type.
     * @param resultItemType Specifies the result item type, either with EnumCapturedResultItemType or a string. When using a string, the valid values include "barcode", "text_line", "detected_quad", and "normalized_image".
     * @returns The set interval for the specified item type.
     */
    getDuplicateForgetTime(resultItemTypes: EnumCapturedResultItemType | resultItemTypesString): number;
    getFilteredResultItemTypes(): number;
    private overlapSet;
    private stabilityCount;
    private crossVerificationFrames;
    private latestOverlappingEnabled;
    private maxOverlappingFrames;
    /**
     * Enables or disables the deduplication process for one or multiple specific result item types.
     * @param resultItemTypes Specifies one or multiple specific result item types, which can be defined using EnumCapturedResultItemType or a string. If using a string, only one type can be specified, and valid values include "barcode", "text_line", "detected_quad", and "normalized_image".
     * @param enabled Boolean to toggle deduplication on or off.
     */
    enableLatestOverlapping(resultItemTypes: EnumCapturedResultItemType | resultItemTypesString, enabled: boolean): void;
    /**
     * Checks if deduplication is active for a given result item type.
     * @param resultItemType Specifies the result item type, either with EnumCapturedResultItemType or a string. When using a string, the valid values include "barcode", "text_line", "detected_quad", and "normalized_image".
     *
     * @returns Boolean indicating the deduplication status for the specified type.
     */
    isLatestOverlappingEnabled(resultItemType: EnumCapturedResultItemType | resultItemTypesString): boolean;
    /**
     * Set the max referencing frames count for the to-the-latest overlapping feature.
     *
     * @param resultItemTypes Specifies the result item type, either with EnumCapturedResultItemType or a string. When using a string, the valid values include "barcode", "text_line", "detected_quad", and "normalized_image".
     * @param maxOverlappingFrames The max referencing frames count for the to-the-latest overlapping feature.
     */
    setMaxOverlappingFrames(resultItemTypes: EnumCapturedResultItemType | resultItemTypesString, maxOverlappingFrames: number): void;
    /**
     * Get the max referencing frames count for the to-the-latest overlapping feature.
     * @param resultItemTypes Specifies the result item type, either with EnumCapturedResultItemType or a string. When using a string, the valid values include "barcode", "text_line", "detected_quad", and "normalized_image".
     * @return Returns the max referencing frames count for the to-the-latest overlapping feature.
     */
    getMaxOverlappingFrames(resultItemType: EnumCapturedResultItemType): number;
    latestOverlappingFilter(result: any): void;
}

declare class ImageIO {
    #private;
    /**
     * This method reads an image from a file. The file format is automatically detected based on the file extensioor content.
     *
     * @param file The file to read, as a File object.
     *
     * @returns A promise that resolves with the loaded image of type `DSImageData`.
     */
    readFromFile(file: File): Promise<DSImageData>;
    /**
     * This method saves an image in either PNG or JPG format. The desired file format is inferred from the filextension provided in the 'name' parameter. Should the specified file format be omitted or unsupported, thdata will default to being exported in PNG format.
     *
     * @param image The image to be saved, of type `DSImageData`.
     * @param name The name of the file, as a string, under which the image will be saved.
     * @param download An optional boolean flag that, when set to true, triggers the download of the file.
     *
     * @returns A promise that resolves with the saved File object.
     */
    saveToFile(image: DSImageData, name: string, download?: boolean): Promise<File>;
    /**
     * Reads image data from memory using the specified ID.
     *
     * @param id - The memory ID referencing a previously stored image.
     *
     * @returns A Promise that resolves to the `DSImageData` object.
     */
    readFromMemory(id: number): Promise<DSImageData>;
    /**
     * This method saves an image to memory. The desired file format is inferred from the 'format' parameter. Should the specified file format be omitted or unsupported, the data will default to being exported in PNG format.
     *
     * @param image A `Blob` representing the image to be saved.
     * @param fileFormat The desired image format.
     *
     * @returns A Promise that resolves to a memory ID which can later be used to retrieve the image via readFromMemory.
     */
    saveToMemory(image: Blob, fileFormat: EnumImageFileFormat): Promise<number>;
    /**
     * This method reads an image from a Base64-encoded string. The image format is automatically detected based on the content of the string.
     *
     * @param base64String The Base64-encoded string representing the image.
     *
     * @returns A promise that resolves with the loaded image of type `DSImageData`.
     */
    readFromBase64String(base64String: string): Promise<DSImageData>;
    /**
     * This method saves an image to a Base64-encoded string. The desired file format is inferred from the 'format' parameter. Should the specified file format be omitted or unsupported, the data will default to being exported in PNG format.
     *
     * @param image The image to be saved, of type `Blob`.
     * @param format The desired image format.
     *
     * @returns A promise that resolves with a Base64-encoded string representing the image.
     */
    saveToBase64String(image: Blob, fileFormat: EnumImageFileFormat): Promise<string>;
}

declare class ImageDrawer {
    /**
     * This method draws various shapes on an image, and save it in PNG format.
     *
     * @param image The image to be saved.
     * @param drawingItem An array of different shapes to draw on the image.
     * @param type The type of drawing shapes.
     * @param color The color to use for drawing. Defaults to 0xFFFF0000 (red).
     * @param thickness The thickness of the lines to draw. Defaults to 1.
     * @param download An optional boolean flag that, when set to true, triggers the download of the file.
     *
     * @returns A promise that resolves with the saved File object.
     */
    drawOnImage(image: Blob | string | DSImageData, drawingItem: Array<Quadrilateral> | Quadrilateral | Array<LineSegment> | LineSegment | Array<Contour> | Contour | Array<Corner> | Corner | Array<Edge> | Edge, type: "quads" | "lines" | "contours" | "corners" | "edges", color?: number, thickness?: number, name?: string, download?: boolean): Promise<DSImageData>;
}

declare enum EnumFilterType {
    /**High-pass filter: Enhances edges and fine details by attenuating low-frequency components.*/
    FT_HIGH_PASS = 0,
    /**Sharpen filter: Increases contrast along edges to make the image appear more defined.*/
    FT_SHARPEN = 1,
    /**Smooth (blur) filter: Reduces noise and detail by averaging pixel values, creating a softening effect.*/
    FT_SMOOTH = 2
}

declare class ImageProcessor {
    /**
     * Crops an image using a rectangle or quadrilateral.
     * @param image The image data to be cropped.
     * @param roi The rectangle or quadrilateral to be cropped.
     *
     * @returns A promise that resolves with the cropped image data.
     */
    cropImage(image: Blob, roi: DSRect): Promise<DSImageData>;
    /**
     * Adjusts the brightness of the image.
     * @param image The image data to be adjusted.
     * @param brightness Brightness adjustment value (range: [-100, 100]).
     *
     * @returns A promise that resolves with the adjusted image data.
     */
    adjustBrightness(image: Blob, brightness: number): Promise<DSImageData>;
    /**
     * Adjusts the contrast of the image.
     * @param image The image data to be adjusted.
     * @param contrast Contrast adjustment value (range: [-100, 100]).
     *
     * @returns A promise that resolves with the adjusted image data.
     */
    adjustContrast(image: Blob, contrast: number): Promise<DSImageData>;
    /**
     * Applies a specified image filter to an input image.
     * @param image The image data to be filtered.
     * @param filterType The type of filter to apply.
     * @returns A promise that resolves with the filtered image data.
     */
    filterImage(image: Blob, filterType: EnumFilterType): Promise<DSImageData>;
    /**
     * Converts a colour image to grayscale.
     * @param image The image data to be converted.
     * @param R [R=0.3] - Weight for the red channel.
     * @param G [G=0.59] - Weight for the green channel.
     * @param B [B=0.11] - Weight for the blue channel.
     * @returns A promise that resolves with the grayscale image data.
     */
    convertToGray(image: Blob, R?: number, G?: number, B?: number): Promise<DSImageData>;
    /**
     * Converts a grayscale image to a binary image using a global threshold.
     * @param image The grayscale image data.
     * @param threshold [threshold=-1] Global threshold for binarization (-1 for automatic calculation).
     * @param invert [invert=false] Whether to invert the binary image.
     * @returns A promise that resolves with the binary image data.
     */
    convertToBinaryGlobal(image: Blob, threshold?: number, invert?: boolean): Promise<DSImageData>;
    /**
     * Converts a grayscale image to a binary image using local (adaptive) binarization.
     * @param image The grayscale image data.
     * @param blockSize [blockSize=0] Size of the block for local binarization.
     * @param compensation [compensation=0] Adjustment value to modify the threshold.
     * @param invert [invert=false] Whether to invert the binary image.
     * @returns A promise that resolves with the binary image data.
     */
    convertToBinaryLocal(image: Blob, blockSize?: number, compensation?: number, invert?: boolean): Promise<DSImageData>;
    /**
     * Crops and deskews an image using a quadrilateral.
     * @param image The image data to be cropped and deskewed.
     * @param roi The quadrilateral defining the region of interest to be cropped and deskewed.
     *
     * @returns A promise that resolves with the cropped and deskewed image data.
     */
    cropAndDeskewImage(image: Blob, roi: Quadrilateral): Promise<DSImageData>;
}

/**
 * Enumeration of available view types in the Document Scanner system.
 *
 * @remarks
 * Scanner: camera view, Result: final view, Correction: boundary adjustment view.
 *
 * @public
 */
declare enum EnumDDSViews {
    /**
     * Main camera view for capturing documents.
     */
    Scanner = "scanner",
    /**
     * Final view displaying processed document results.
     */
    Result = "scan-result",
    /**
     * Intermediate view for adjusting detected document boundaries.
     */
    Correction = "correction"
}
/**
 * Capture Vision template names for document detection and normalization.
 *
 * @remarks
 * Override to self-host resources.
 * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting}
 *
 * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
 * @public
 */
interface UtilizedTemplateNames {
    detect: string;
    normalize: string;
}
/**
 * Enumeration of result status codes for document scanning operations.
 *
 * @remarks
 * RS_SUCCESS: successful scan, RS_CANCELLED: user cancelled, RS_FAILED: error occurred.
 *
 * @public
 */
declare enum EnumResultStatus {
    /**
     * Document was successfully captured and processed.
     */
    RS_SUCCESS = 0,
    /**
     * User cancelled the scanning operation.
     */
    RS_CANCELLED = 1,
    /**
     * Scanning or processing failed due to an error.
     */
    RS_FAILED = 2
}
/**
 * Enumeration of document scanning flow types indicating capture method.
 *
 * @remarks
 * Tracks how document was captured. Used by {@link shouldCorrectImage} to determine correction behavior.
 *
 * @public
 */
declare enum EnumFlowType {
    /**
     * User manually captured the document via camera button.
     */
    MANUAL = "manual",
    /**
     * Document was automatically captured when stable boundaries were detected.
     */
    SMART_CAPTURE = "smartCapture",
    /**
     * Document was detected and cropped automatically without user intervention.
     */
    AUTO_CROP = "autoCrop",
    /**
     * Document image was uploaded from device storage.
     */
    UPLOADED_IMAGE = "uploadedImage",
    /**
     * Document was loaded from a static file path or URL.
     */
    STATIC_FILE = "staticFile"
}
/**
 * Type representing the status of a document scanning operation.
 *
 * @remarks
 * Combines status code with optional error message.
 *
 * @example
 * ```typescript
 * if (result.status.code === EnumResultStatus.RS_SUCCESS) {
 *   console.log("Scan successful!");
 * } else if (result.status.code === EnumResultStatus.RS_FAILED) {
 *   console.error("Scan failed:", result.status.message);
 * }
 * ```
 *
 * @public
 */
type ResultStatus = {
    /**
     * Status code (success, cancellation, or failure).
     * @see {@link EnumResultStatus}
     */
    code: EnumResultStatus;
    /**
     * Optional error message (typically populated when failed).
     */
    message?: string;
};
/**
 * Represents the complete output of a document scanning operation.
 *
 * @remarks
 * Optional properties present only on successful scans.
 *
 * @example
 * ```typescript
 * const result = await scanner.scan();
 * if (result.status.code === EnumResultStatus.RS_SUCCESS) {
 *   const correctedImage = result.correctedImageResult;
 *   const originalImage = result.originalImageResult;
 *   const boundaries = result.detectedQuadrilateral;
 * }
 * ```
 *
 * @public
 */
interface DocumentResult {
    /**
     * Status of the scan operation.
     * @public
     */
    status: ResultStatus;
    /**
     * Perspective-corrected and enhanced image.
     * @public
     */
    correctedImageResult?: DeskewedImageResultItem;
    /**
     * Original captured image before processing.
     * @public
     */
    originalImageResult?: DSImageData;
    /**
     * Detected document boundaries (quadrilateral).
     * @public
     */
    detectedQuadrilateral?: Quadrilateral;
    /**
     * Internal property tracking capture method.
     * @internal
     */
    _flowType?: EnumFlowType;
}
/**
 * A simplified configuration type for toolbar buttons.
 *
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
 *     correctionViewConfig: {
 *         toolbarButtonsConfig: {
 *             fullImage: {
 *                 isHidden: true
 *             },
 *             detectBorders: {
 *                 icon: "path/to/new_icon.png", // Change to the actual path of the new icon
 *                 label: "Custom Label"
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
type ToolbarButtonConfig = Partial<Pick<ToolbarButton, "icon" | "label" | "className" | "isHidden">>;
/**
 * Interface defining toolbar button properties and behavior.
 *
 * @remarks
 * Used internally to create toolbar buttons. Customize via {@link ToolbarButtonConfig}.
 *
 * @public
 */
interface ToolbarButton {
    /**
     * Unique identifier for the button.
     *
     * @public
     */
    id: string;
    /**
     * Path or data URL to the button icon image.
     *
     * @public
     */
    icon: string;
    /**
     * Text label displayed below the button icon.
     *
     * @public
     */
    label: string;
    /**
     * Click handler function invoked when the button is clicked.
     *
     * @remarks
     * This handler can be synchronous or asynchronous. When provided through {@link ToolbarButtonConfig}, it overrides the button's default behavior.
     *
     * @public
     */
    onClick?: () => void | Promise<void>;
    /**
     * Additional CSS class name to apply to the button element.
     *
     * @public
     */
    className?: string;
    /**
     * Flag indicating whether the button is disabled (non-interactive).
     *
     * @defaultValue false
     *
     * @public
     */
    isDisabled?: boolean;
    /**
     * Flag indicating whether the button is hidden from the toolbar.
     *
     * @defaultValue false
     *
     * @public
     */
    isHidden?: boolean;
}

/**
 * Set the scan region within the {@link DocumentScannerView} viewfinder for document scanning from the {@link DocumentScannerViewConfig}.
 *
 * @remarks
 * MDS determines the scan region with the following steps:
 * 1. Use {@link ScanRegion.ratio} to set the height-to-width ratio of the rectangular scanning region, then scale the rectangle up to fit within the viewfinder.
 * 2. Translate the rectangle upward by the number of pixels specified by {@link ScanRegion.regionBottomMargin}.
 * 3. Create a visual border for the scanning region boundary on the viewfinder with a given stroke width in pixels and stroke color.
 *
 * @example
 * Create a scan region with a height-to-width ratio of 3:2, translated upwards by 20 pixels, with a green, 3 pixel-wide border in the viewfinder:
 *
 * ```javascript
 * scanRegion {
 *   ratio: {
 *     width: 2,
 *     height: 3,
 *   },
 *   regionBottomMargin: 20,
 *   style: {
 *     strokeWidth: 3,
 *     strokeColor: "green",
 *   },
 * }
 * ```
 *
 * @public
 */
interface ScanRegion {
    /**
     * The aspect ratio of the rectangular scan region.
     *
     * @public
     */
    ratio: {
        /**
         * The width of the rectangular scan region.
         */
        width: number;
        /**
         * The height of the rectangular scan region.
         *
         * @public
         */
        height: number;
    };
    /**
     * Bottom margin below the scan region measured in pixels.
     *
     * @public
     */
    regionBottomMargin: number;
    /**
     * The styling for the scan region outline in the viewfinder.
     *
     * @public
     */
    style: {
        /**
         * The pixel width of the outline of the scan region.
         *
         * @public
         */
        strokeWidth: number;
        /**
         * The color of the outline of the scan region.
         *
         * @public
         */
        strokeColor: string;
    };
}
/**
 * The `DocumentScannerViewConfig` interface passes settings to the {@link DocumentScanner} constructor through the {@link DocumentScannerConfig} to apply UI and business logic customizations for the {@link DocumentScannerView}.
 *
 * @remarks
 * Only rare and edge-case scenarios require editing the UI template or MDS source code. MDS uses sensible default values for all omitted properties.
 *
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace with your actual license key
 *     scannerViewConfig: {
 *         cameraEnhancerUIPath: "../dist/document-scanner.ui.xml", // Use the local file
 *     },
 * });
 ```
 
 @public
 */
interface DocumentScannerViewConfig {
    /**
     * @privateRemarks
     * Removes Smart Capture if the {@link DocumentCorrectionView} is not available.
     *
     * @internal
     */
    _showCorrectionView?: boolean;
    /**
     * @privateRemarks
     * Indicates if {@link DocumentResultView} is shown.
     *
     * @internal
     */
    _showResultView?: boolean;
    /**
     * Path to the Capture Vision template file for scanning configuration.
     *
     * @public
     */
    templateFilePath?: string;
    /**
     * Path to the UI definition file (`.xml`) for the {@link DocumentScannerView}.
     *
     * @remarks
     * This typically does not need to be set as MDS provides a default template for general use. You may set custom paths to self-host or customize the template, or fully self-host MDS.
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
     *
     * @defaultValue {@link DEFAULT_DCE_UI_PATH}
     *
     * @public
     */
    cameraEnhancerUIPath?: string;
    /**
     * The HTML container element or selector for the {@link DocumentScannerView} UI.
     *
     * @public
     */
    container?: HTMLElement | string;
    /**
     * Capture Vision template names for document detection and normalization.
     *
     * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
     *
     * @remarks
     * This typically does not need to be set as MDS provides a default template for general use. You may set custom names to self-host resources or fully self-host MDS.
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
     * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV templates}
     *
     * @public
     */
    utilizedTemplateNames?: UtilizedTemplateNames;
    /**
     * Set the document Bounds Detection mode effective upon entering the {@link DocumentScannerView} UI.
     *
     * @remarks
     * Bounds Detection mode gets enabled when Smart Capture mode is enabled.
     *
     * @defaultValue true
     *
     * @public
     */
    enableBoundsDetectionMode?: boolean;
    /**
     * Set the Smart Capture mode effective upon entering the {@link DocumentScannerView} UI.
     *
     * @remarks
     * Enabling Smart Capture mode also enables Bounds Detection mode. Smart Capture mode is enabled when Auto-Capture mode is enabled.
     *
     * @defaultValue false
     *
     * @public
     */
    enableSmartCaptureMode?: boolean;
    /**
     * Set the Auto-Crop mode effective upon entering the {@link DocumentScannerView} UI.
     *
     * @remarks
     * Enabling Auto-Crop mode also enables Smart Capture mode.
     *
     * @defaultValue false
     *
     * @public
     */
    enableAutoCropMode?: boolean;
    /**
     * Define the region within the viewport to detect documents.
     *
     * @see {@link ScanRegion}
     *
     * @public
     */
    scanRegion?: ScanRegion;
    /**
     * Set the minimum number of camera frames to detect document boundaries in Smart Capture mode.
     *
     * @remarks
     * Accepts integer values between 1 and 5, inclusive.
     *
     * @defaultValue 2
     *
     * @public
     */
    minVerifiedFramesForAutoCapture?: number;
    /**
     * Set the visibility of the mode selector menu.
     *
     * @defaultValue true
     *
     * @public
     */
    showSubfooter?: boolean;
    /**
     * Set the visibility of the Dynamsoft branding message.
     *
     * @defaultValue true
     *
     * @public
     */
    showPoweredByDynamsoft?: boolean;
    /**
     * Enable automatic frame verification for best quality capture.
     * When enabled, track clarity scores to find the clearest frame.
     *
     * @defaultValue true
     * @public
     */
    enableFrameVerification?: boolean;
}
declare class DocumentScannerView {
    private resources;
    private config;
    private boundsDetectionEnabled;
    private smartCaptureEnabled;
    private autoCropEnabled;
    private isCapturing;
    private isClosing;
    private resizeTimer;
    private crossVerificationCount;
    private lastCaptureTimestamp;
    private readonly CONTINUOUS_SCAN_COOLDOWN_MS;
    private frameVerificationEnabled;
    private currentFrameId;
    private maxClarity;
    private maxClarityTimestamp;
    private maxClarityImg;
    private maxClarityFrameId;
    private nonImprovingClarityFrameCount;
    private clearestFrameId;
    private clarityHistory;
    private capturedResultItems;
    private originalImageData;
    private initialized;
    private initializedDCE;
    private DCE_ELEMENTS;
    private currentScanResolver?;
    private loadingScreen;
    private toastObserver;
    /**
     * Display a loading overlay on top of the scanner view.
     *
     * @param message - Optional message to display in the loading overlay
     *
     * @remarks
     * Called during initialization and upload processing.
     *
     * @internal
     */
    private showScannerLoadingOverlay;
    /**
     * Hide the loading overlay displayed over the scanner view.
     *
     * @param hideContainer - Whether to also hide the scanner container element. Defaults to `false`.
     *
     * @remarks
     * This method removes the loading screen overlay created by {@link showScannerLoadingOverlay}.
     * If `hideContainer` is `true`, it also hides the entire scanner container element by setting
     * its display style to "none".
     *
     * Use `hideContainer: true` when the scanning operation is complete and you want to hide the
     * entire scanner view (e.g., after successful capture in single-scan mode).
     * Use `hideContainer: false` when you want to keep the scanner visible after removing the loading
     * overlay (e.g., after initialization or in continuous scanning mode).
     *
     * @see {@link showScannerLoadingOverlay} - To show the loading overlay
     *
     * @internal
     */
    private hideScannerLoadingOverlay;
    /**
     * Get the validated minimum number of verified frames required for automatic capture in Smart Capture mode.
     *
     * @returns The validated minimum verified frames count, clamped between 1 and 5
     *
     * @remarks
     * Higher values increase accuracy but require steadier hands. Lower values enable faster capture.
     *
     * @internal
     */
    private getMinVerifiedFramesForAutoCapture;
    constructor(resources: SharedResources, config: DocumentScannerViewConfig);
    initialize(): Promise<void>;
    /**
     * Initialize UI element references from the Camera Enhancer shadow DOM.
     *
     * @remarks
     * Locates shadow DOM, queries UI elements, attaches event handlers, configures visibility.
     * Called by {@link openCamera}.
     *
     * @throws {Error} If shadow root not found
     *
     * @internal
     */
    private initializeElements;
    /**
     * Attach event handlers to all interactive UI elements in the Camera Enhancer interface.
     *
     * @remarks
     * Sets up click handlers for buttons, prevents double-tap zoom on touch elements.
     * Called by {@link initializeElements}.
     *
     * @throws {Error} If required elements not found
     *
     * @internal
     */
    private assignDCEClickEvents;
    /**
     * Handle the "Done" button click in continuous scanning mode to complete the scanning session.
     *
     * @remarks
     * Closes camera and resolves with cancelled status. Prevents closing during capture.
     *
     * @internal
     */
    private handleContinuousScanDone;
    /**
     * Update the "Done" button visibility and text based on the number of completed scans.
     *
     * @remarks
     * Shows button if completedScansCount > 0, displays "Done (N)".
     *
     * @internal
     */
    private updateContinuousScanDoneButton;
    /**
     * Update the thumbnail preview image with the most recently scanned document.
     *
     * @param canvas - The canvas containing the corrected/cropped document image to display
     *
     * @remarks
     * Converts to JPEG data URL (0.8 quality), updates thumbnail image src. Only in continuous mode.
     *
     * @internal
     */
    private updateThumbnail;
    /**
     * Detect if device is running iOS.
     *
     * @returns `true` if iOS device
     *
     * @remarks
     * Checks user agent for iPad/iPhone/iPod, also detects iPad Pro (MacIntel + touch).
     *
     * @internal
     */
    private isIOS;
    /**
     * Toast message filter - temporary measure, can be removed when DCE updates toast behavior.
     *
     * @param shadowRoot - The shadow root containing the toast element to observe
     *
     * @remarks
     * Set up MutationObserver to control toast visibility based on device. Hides toast on desktop/iOS, shows on Android mobile, and also hides torch on desktop.
     *
     * @internal
     */
    private setupSmartToastFilter;
    /**
     * Animate a captured document image flying from the viewfinder to the thumbnail preview.
     *
     * @param canvas - The canvas containing the captured document image to animate
     * @returns Promise that resolves when the animation completes (after 500ms)
     *
     * @remarks
     * Calculates transform to move/scale floating image to thumbnail position. Uses CSS custom properties and requestAnimationFrame.
     *
     * @internal
     */
    private animateFloatingImage;
    /**
     * Handle the close button (X) click to cancel scanning and exit the scanner view.
     *
     * @remarks
     * Prevents closing during capture. Closes camera and resolves with cancelled status.
     *
     * @internal
     */
    handleCloseBtn(): Promise<void>;
    /**
     * Attach click event listeners to camera and resolution selection options.
     *
     * @remarks
     * Handles camera switching and resolution changes. Closes dropdown after selection.
     *
     * @internal
     */
    private attachOptionClickListeners;
    /**
     * Highlight the currently selected camera and resolution options in the settings dropdown.
     *
     * @remarks
     * This method visually indicates which camera and resolution are currently active by
     * applying a distinctive orange border (2px solid #fe814a) to the selected options.
     *
     * **Camera highlighting:**
     * - Queries the currently selected camera via {@link CameraEnhancer.getSelectedCamera}
     * - Compares the `deviceId` with each camera option's `data-device-id` attribute
     * - Applies border styling to the matching option
     *
     * **Resolution highlighting:**
     * - Queries the current resolution via {@link CameraEnhancer.getResolution}
     * - Finds the closest standard resolution level (480p, 720p, 1080p, 2k, 4k) using {@link findClosestResolutionLevel}
     * - Maps the resolution level to pixel height (e.g., "720p" → "720")
     * - Applies border styling to the option with matching `data-height` attribute
     *
     * The method handles the resolution mapping because cameras may report actual resolutions
     * (e.g., 1280x720) that need to be matched to standard preset options.
     *
     * Called by {@link toggleSelectCameraBox} before displaying the settings dropdown to
     * ensure the current selections are properly highlighted.
     *
     * @see {@link toggleSelectCameraBox} - Opens the settings dropdown
     * @see {@link attachOptionClickListeners} - Handles option selection
     * @see {@link findClosestResolutionLevel} - Utility to map actual resolution to preset level
     * @see {@link CameraEnhancer.getSelectedCamera} - Gets the active camera
     * @see {@link CameraEnhancer.getResolution} - Gets the current resolution
     *
     * @internal
     */
    private highlightCameraAndResolutionOption;
    /**
     * Toggle the visibility of the camera and resolution selection dropdown.
     *
     * @remarks
     * This method opens or closes the camera/resolution settings dropdown by simulating a
     * click on the settings box element. Before opening, it:
     * 1. Highlights the currently selected camera and resolution via {@link highlightCameraAndResolutionOption}
     * 2. Attaches click event listeners to all options via {@link attachOptionClickListeners}
     * 3. Updates the scan region guide via {@link toggleScanGuide}
     *
     * The dropdown allows users to:
     * - Switch between available cameras (front/back on mobile, multiple webcams on desktop)
     * - Change the camera resolution (480p, 720p, 1080p, 2k, 4k)
     *
     * Higher resolutions improve document detection accuracy but may reduce performance on
     * lower-end devices. The scanner defaults to 2k resolution (2560x1440) when the camera opens.
     *
     * The settings box element is provided by the Camera Enhancer UI template and contains
     * dynamically populated camera and resolution options.
     *
     * Called by the "Select Camera" button click handler set up in {@link assignDCEClickEvents}.
     *
     * @see {@link highlightCameraAndResolutionOption} - Highlights current selections
     * @see {@link attachOptionClickListeners} - Attaches option click handlers
     * @see {@link toggleScanGuide} - Updates the scan region overlay
     * @see {@link assignDCEClickEvents} - Where the select camera button handler is set up
     * @see {@link openCamera} - Sets default 2k resolution
     *
     * @internal
     */
    private toggleSelectCameraBox;
    /**
     * Open a file picker dialog to upload and process an image file for document scanning.
     *
     * @remarks
     * This method provides an alternative to camera capture by allowing users to select and
     * process existing image files from their device. The complete workflow includes:
     *
     * **File Selection:**
     * 1. Creates a hidden file input element accepting PNG and JPEG images
     * 2. Programmatically triggers the file picker dialog
     * 3. Validates the selected file is an image type
     *
     * **Image Processing:**
     * 1. Converts the file to a blob via {@link fileToBlob}
     * 2. Detects document boundaries using {@link CaptureVisionRouter.capture} with the detection template
     * 3. Falls back to full image bounds if no document is detected
     * 4. Performs perspective correction via {@link normalizeImage}
     * 5. Creates a {@link DocumentResult} with {@link EnumFlowType.UPLOADED_IMAGE} flow type
     *
     * **Mode-Specific Behavior:**
     *
     * **Single Scan Mode:**
     * - Closes the camera via {@link closeCamera}
     * - Hides the scanner container after processing
     * - Resolves the scan promise to route through correction/result views
     *
     * **Continuous Scan Mode:**
     * - Stops capturing during upload processing (resumes after)
     * - If no correction/result views: shows animation via {@link animateFloatingImage} and updates thumbnail via {@link updateThumbnail}
     * - If correction/result views enabled: routes through those views
     * - Keeps the scanner visible for additional captures
     *
     * Error handling includes user-friendly alerts and proper cleanup of the file input element.
     *
     * Called by the "Upload Image" button click handler set up in {@link assignDCEClickEvents}.
     *
     * @see {@link fileToBlob} - Converts File to Blob with image dimensions
     * @see {@link normalizeImage} - Performs perspective correction
     * @see {@link animateFloatingImage} - Animates the captured image (continuous mode)
     * @see {@link updateThumbnail} - Updates thumbnail preview (continuous mode)
     * @see {@link closeCamera} - Closes camera (single scan mode)
     * @see {@link EnumFlowType.UPLOADED_IMAGE} - The flow type for uploaded images
     * @see {@link assignDCEClickEvents} - Where the upload button handler is set up
     *
     * @internal
     */
    private uploadImage;
    /**
     * Convert an image File object to a Blob with extracted image dimensions.
     *
     * @param file - The File object to convert (must be an image file)
     * @returns Promise resolving to an object containing the blob, width, and height
     *
     * @remarks
     * This method converts an image file to a blob format suitable for processing by the
     * Dynamsoft Capture Vision SDK while preserving the original image format and dimensions.
     *
     * **Conversion Process:**
     * 1. Creates an {@link https://developer.mozilla.org/en-US/docs/Web/API/Image | Image} element and loads the file via {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static | URL.createObjectURL}
     * 2. Extracts the image's natural width and height once loaded
     * 3. Draws the image to a canvas at full resolution (no scaling)
     * 4. Converts the canvas to a blob using {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob}
     * 5. Preserves the original file's MIME type (e.g., "image/jpeg", "image/png")
     * 6. Returns the blob along with dimensions for downstream processing
     *
     * **Why This Approach:**
     * - The Dynamsoft SDK's {@link CaptureVisionRouter.capture} method accepts Blob inputs
     * - The canvas intermediate step ensures consistent processing across different browsers
     * - Extracting dimensions separately avoids redundant image analysis in later steps
     *
     * This method is called by {@link uploadImage} to prepare uploaded files for document
     * detection and normalization.
     *
     * @throws {Error} If the image fails to load or blob creation fails
     *
     * @see {@link uploadImage} - Calls this method to process uploaded files
     * @see {@link CaptureVisionRouter.capture} - Processes the blob for document detection
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob | Blob API} - The blob format returned
     *
     * @internal
     */
    private fileToBlob;
    /**
     * Toggle bounds detection mode to enable/disable real-time document boundary detection.
     *
     * @param enabled - Optional explicit state: `true` to enable, `false` to disable, `undefined` to toggle current state
     *
     * @remarks
     * Bounds detection mode uses the Dynamsoft Document Normalizer to detect document boundaries
     * in real-time as the camera captures frames. When enabled, detected boundaries are drawn
     * as an overlay on the camera view, helping users align their documents properly.
     *
     * **Mode Hierarchy and Dependencies:**
     * - **Bounds Detection** is the foundation for all automatic capture modes
     * - **Smart Capture** requires Bounds Detection to be enabled
     * - **Auto Crop** requires both Smart Capture and Bounds Detection to be enabled
     *
     * **Enabling Bounds Detection:**
     * - Starts frame capture via {@link CaptureVisionRouter.startCapturing} with the detection template
     * - Updates the scan region guide via {@link toggleScanGuide}
     * - Changes UI button color to orange (#fe814a) to indicate active state
     * - Swaps button icon from "off" to "on" state
     *
     * **Disabling Bounds Detection:**
     * - Automatically disables Smart Capture via {@link toggleSmartCapture}
     * - Also disables Auto Crop if {@link DocumentScannerViewConfig._showCorrectionView} is `false`
     * - Stops frame capture via {@link stopCapturing}
     * - Changes UI button color to white (#fff) to indicate inactive state
     *
     * This mode can be configured as the default via {@link DocumentScannerViewConfig.enableBoundsDetectionMode}.
     *
     * Called by:
     * - User clicking the Bounds Detection button (via {@link assignDCEClickEvents})
     * - {@link toggleSmartCapture} when Smart Capture is enabled (to ensure Bounds Detection is on)
     * - {@link toggleAutoCrop} when Auto Crop is enabled (to ensure Bounds Detection is on)
     * - {@link openCamera} to apply the initial configured mode
     *
     * @see {@link toggleSmartCapture} - The next level in the mode hierarchy
     * @see {@link toggleAutoCrop} - The highest level in the mode hierarchy
     * @see {@link DocumentScannerViewConfig.enableBoundsDetectionMode} - Default configuration
     * @see {@link stopCapturing} - Stops frame capture
     * @see {@link toggleScanGuide} - Updates scan region overlay
     *
     * @internal
     */
    toggleBoundsDetection(enabled?: boolean): Promise<void>;
    /**
     * Toggle Smart Capture mode to enable/disable automatic document capture when stable boundaries are detected.
     *
     * @param mode - Optional explicit state: `true` to enable, `false` to disable, `undefined` to toggle current state
     *
     * @remarks
     * Smart Capture mode automatically triggers document capture when the scanner detects consistent
     * document boundaries across multiple consecutive frames, eliminating the need for users to
     * manually press the capture button.
     *
     * **How Smart Capture Works:**
     * 1. Requires {@link DocumentScannerViewConfig.minVerifiedFramesForAutoCapture} consecutive frames (default: 2) with matching boundaries
     * 2. Uses Dynamsoft's {@link MultiFrameResultCrossFilter} for cross-verification of detected boundaries
     * 3. When verification count is reached, automatically calls {@link takePhoto}
     * 4. After capture, routes to {@link DocumentCorrectionView} for manual boundary adjustment (if enabled)
     *
     * **Mode Hierarchy and Dependencies:**
     * - **Requires:** Bounds Detection mode must be enabled
     * - **Optional:** Can be combined with Auto Crop mode
     * - **When disabled:** Also disables Auto Crop mode (if {@link DocumentScannerViewConfig._showCorrectionView} is not `false`)
     *
     * **Enabling Smart Capture:**
     * - Automatically enables Bounds Detection via {@link toggleBoundsDetection} if not already enabled
     * - Changes UI button color to orange (#fe814a) to indicate active state
     * - Swaps button icon from "off" to "on" state
     * - Resets {@link crossVerificationCount} to start fresh verification tracking
     *
     * **Disabling Smart Capture:**
     * - Automatically disables Auto Crop (when correction view is enabled)
     * - Changes UI button color to white (#fff) to indicate inactive state
     * - Resets {@link crossVerificationCount}
     *
     * This mode can be configured as the default via {@link DocumentScannerViewConfig.enableSmartCaptureMode}.
     * When {@link DocumentScannerViewConfig._showCorrectionView} is `false`, Smart Capture button is hidden from the UI.
     *
     * Called by:
     * - User clicking the Smart Capture button (via {@link assignDCEClickEvents})
     * - {@link toggleBoundsDetection} when Bounds Detection is disabled (to disable Smart Capture)
     * - {@link toggleAutoCrop} when Auto Crop is enabled/disabled (to ensure Smart Capture state)
     * - {@link openCamera} to apply the initial configured mode
     *
     * @see {@link toggleBoundsDetection} - The prerequisite mode
     * @see {@link toggleAutoCrop} - The next level in the mode hierarchy
     * @see {@link handleAutoCaptureMode} - Where auto-capture is triggered
     * @see {@link DocumentScannerViewConfig.enableSmartCaptureMode} - Default configuration
     * @see {@link DocumentScannerViewConfig.minVerifiedFramesForAutoCapture} - Verification frame count
     * @see {@link DocumentCorrectionView} - Where the user can adjust detected boundaries
     *
     * @internal
     */
    toggleSmartCapture(mode?: boolean): Promise<void>;
    /**
     * Toggle Auto Crop mode to enable/disable automatic capture with immediate perspective correction.
     *
     * @param mode - Optional explicit state: `true` to enable, `false` to disable, `undefined` to toggle current state
     *
     * @remarks
     * Auto Crop mode combines Smart Capture's automatic triggering with immediate perspective
     * correction, bypassing the {@link DocumentCorrectionView} for a fully automated scanning
     * experience. This is ideal for high-volume scanning workflows where speed is prioritized
     * over manual boundary adjustment.
     *
     * **How Auto Crop Works:**
     * 1. Detects stable document boundaries like Smart Capture mode
     * 2. Automatically captures the document when verification threshold is met
     * 3. Immediately performs perspective correction via {@link normalizeImage}
     * 4. Skips {@link DocumentCorrectionView} and routes directly to {@link DocumentResultView} (if enabled)
     * 5. In continuous mode without result view, shows animation and stays in scanner for next capture
     *
     * **Mode Hierarchy and Dependencies:**
     * - **Requires:** Both Bounds Detection and Smart Capture modes must be enabled
     * - **Highest level:** This is the most automated capture mode
     * - **When disabled and correction view is disabled:** Also disables Smart Capture mode
     *
     * **Enabling Auto Crop:**
     * - Automatically enables Bounds Detection via {@link toggleBoundsDetection} if not already enabled
     * - Automatically enables Smart Capture via {@link toggleSmartCapture} if not already enabled
     * - Changes UI button color to orange (#fe814a) to indicate active state
     * - Swaps button icon from "off" to "on" state
     *
     * **Disabling Auto Crop:**
     * - If {@link DocumentScannerViewConfig._showCorrectionView} is `false`, also disables Smart Capture
     * - Changes UI button color to white (#fff) to indicate inactive state
     *
     * This mode can be configured as the default via {@link DocumentScannerViewConfig.enableAutoCropMode}.
     * Enabling Auto Crop also enables Smart Capture and Bounds Detection automatically.
     *
     * **Use Cases:**
     * - High-volume document scanning (invoices, receipts, forms)
     * - Documents with clear, well-defined boundaries
     * - Workflows prioritizing speed over manual adjustment
     * - Continuous scanning of multiple similar documents
     *
     * Called by:
     * - User clicking the Auto Crop button (via {@link assignDCEClickEvents})
     * - {@link toggleBoundsDetection} when Bounds Detection is disabled (to disable Auto Crop if correction view disabled)
     * - {@link toggleSmartCapture} when Smart Capture is disabled (to disable Auto Crop if correction view enabled)
     * - {@link openCamera} to apply the initial configured mode
     *
     * @see {@link toggleBoundsDetection} - The foundational prerequisite mode
     * @see {@link toggleSmartCapture} - The intermediate prerequisite mode
     * @see {@link handleAutoCaptureMode} - Where auto-capture is triggered
     * @see {@link normalizeImage} - Performs perspective correction
     * @see {@link DocumentScannerViewConfig.enableAutoCropMode} - Default configuration
     * @see {@link DocumentResultView} - Where corrected images are displayed (if enabled)
     *
     * @internal
     */
    toggleAutoCrop(mode?: boolean): Promise<void>;
    /**
     * Handle viewport resize events by debouncing scan region recalculation.
     *
     * @remarks
     * This event handler responds to window resize events (e.g., device rotation, browser window
     * resizing, virtual keyboard appearance) by temporarily hiding the scan region guide and
     * recalculating its position after the resize operation stabilizes.
     *
     * **Debouncing Logic:**
     * 1. Immediately hides the scan region guide via {@link toggleScanGuide}(false) to prevent visual glitches
     * 2. Clears any existing resize timer to reset the debounce delay
     * 3. Sets a new timer that triggers after 500ms of resize inactivity
     * 4. When the timer fires, recalculates and re-shows the scan guide via {@link toggleScanGuide}(true)
     *
     * The 500ms delay ensures the guide isn't constantly recalculated during animated resizes
     * or smooth orientation changes, improving performance and preventing visual flickering.
     *
     * **Common Resize Triggers:**
     * - Device orientation change (portrait ↔ landscape)
     * - Browser window resizing on desktop
     * - Virtual keyboard appearing/disappearing on mobile
     * - Split-screen mode changes on tablets
     * - Fullscreen mode toggling
     *
     * This handler is attached during {@link openCamera} and removed during {@link closeCamera}
     * to ensure proper lifecycle management.
     *
     * @see {@link toggleScanGuide} - Shows/hides and recalculates the scan region
     * @see {@link calculateScanRegion} - Performs the actual region calculation
     * @see {@link openCamera} - Attaches this resize listener
     * @see {@link closeCamera} - Removes this resize listener
     *
     * @internal
     */
    private handleResize;
    /**
     * Toggle the visibility of the scan region guide and trigger recalculation if enabled.
     *
     * @param enabled - Whether to show the scan region guide. If `true` and a scan region ratio is configured, recalculates the region.
     *
     * @remarks
     * This method controls the scan region guide (the visual border/overlay indicating where
     * documents should be positioned within the viewfinder). It only operates when a scan region
     * ratio is configured via {@link DocumentScannerViewConfig.scanRegion}.
     *
     * **When enabled is `true`:**
     * - Checks if {@link ScanRegion.ratio} is configured (not empty)
     * - If configured, calls {@link calculateScanRegion} to compute and display the guide
     * - If not configured, does nothing (no guide to show)
     *
     * **When enabled is `false` or `undefined`:**
     * - Does nothing (guide remains hidden or in current state)
     *
     * The scan region guide helps users:
     * - Align documents properly within the viewfinder
     * - Understand where document detection will occur
     * - Ensure documents fit within the capture area
     * - Maintain consistent framing across multiple scans
     *
     * Called by:
     * - {@link handleResize} - To hide/show guide during resize events
     * - {@link toggleBoundsDetection} - To show guide when bounds detection is enabled
     * - {@link toggleSelectCameraBox} - To update guide after camera/resolution changes
     * - {@link attachOptionClickListeners} - To update guide after selecting camera/resolution options
     *
     * @see {@link calculateScanRegion} - Performs the scan region calculation
     * @see {@link ScanRegion} - The scan region configuration interface
     * @see {@link DocumentScannerViewConfig.scanRegion} - Where the region ratio is configured
     * @see {@link handleResize} - Debounced resize handler that calls this method
     *
     * @internal
     */
    private toggleScanGuide;
    /**
     * Calculate and apply the scan region guide based on configured aspect ratio and viewport dimensions.
     *
     * @remarks
     * This method performs complex calculations to determine the optimal scan region (the rectangular
     * guide overlay in the viewfinder) that helps users frame documents consistently. The calculation
     * adapts to different device orientations, screen sizes, and configured document aspect ratios.
     *
     * **Calculation Process:**
     *
     * 1. **Get Viewport Dimensions:**
     *    - Retrieves the visible region of the video feed (may be cropped by camera view styling)
     *    - Gets the full video dimensions from the video element
     *
     * 2. **Apply Bottom Margin:**
     *    - Subtracts {@link ScanRegion.regionBottomMargin} from visible height
     *    - Allows positioning the guide higher in the viewport (useful for avoiding UI elements)
     *
     * 3. **Calculate Base Unit (Orientation-Aware):**
     *    - **Landscape:** Uses 75% of effective height as constraint, scales to target aspect ratio
     *    - **Portrait:** Uses 90% of width as constraint, scales to target aspect ratio
     *    - Adjusts if calculated dimensions exceed viewport bounds
     *
     * 4. **Scale to Actual Dimensions:**
     *    - Multiplies base unit by {@link ScanRegion.ratio} width and height
     *    - Results in pixel dimensions that fit within viewport while maintaining aspect ratio
     *
     * 5. **Center the Region:**
     *    - Calculates offsets to horizontally center the region
     *    - Vertically centers within the effective height (after bottom margin)
     *
     * 6. **Convert to Percentage Coordinates:**
     *    - Transforms pixel coordinates to percentages relative to full video dimensions
     *    - Accounts for visible region offset (in case video is cropped)
     *    - Rounds percentages to integers for clean rendering
     *
     * 7. **Apply to Camera View:**
     *    - Makes the scan region mask visible via {@link CameraView.setScanRegionMaskVisible}
     *    - Sets the region bounds via {@link CameraEnhancer.setScanRegion}
     *    - The mask is styled with {@link ScanRegion.style} (border width and color)
     *
     * **Example Configuration:**
     * For a 3:2 aspect ratio document with 20px bottom margin and green 3px border:
     * ```typescript
     * scanRegion: {
     *   ratio: { width: 2, height: 3 },
     *   regionBottomMargin: 20,
     *   style: { strokeWidth: 3, strokeColor: "green" }
     * }
     * ```
     *
     * The method gracefully handles edge cases:
     * - Camera not open: exits early without calculation
     * - No visible region: exits early without calculation
     * - Extreme aspect ratios: adjusts to fit within viewport constraints
     *
     * Called by {@link toggleScanGuide} whenever the scan region needs to be shown or recalculated.
     *
     * @see {@link ScanRegion} - The scan region configuration interface
     * @see {@link DocumentScannerViewConfig.scanRegion} - Where the region is configured
     * @see {@link toggleScanGuide} - Controls when this calculation is triggered
     * @see {@link handleResize} - Triggers recalculation on viewport resize
     * @see {@link CameraView.setScanRegionMaskVisible} - Shows/hides the region overlay
     * @see {@link CameraEnhancer.setScanRegion} - Applies the calculated region bounds
     *
     * @internal
     */
    private calculateScanRegion;
    /**
     * Open and initialize the camera with configured capture modes and UI elements.
     *
     * @returns Promise that resolves when the camera is fully initialized and ready
     *
     * @remarks
     * This method is the primary entry point for camera initialization and performs comprehensive
     * setup of the camera, UI elements, capture modes, and event listeners.
     *
     * **Continuous Scanning Mode Optimization:**
     * When {@link SharedResources.enableContinuousScanning} is true and the camera is already open:
     * - Skips full reinitialization to improve performance
     * - Shows the scanner container
     * - Updates the continuous scan "Done" button via {@link updateContinuousScanDoneButton}
     * - Restarts frame capturing if it was stopped (when returning from correction/result views)
     * - Returns early without full initialization
     *
     * **Full Initialization Steps:**
     *
     * 1. **Display Loading Overlay:**
     *    - Shows "Initializing camera..." message via {@link showScannerLoadingOverlay}
     *    - Makes the scanner container visible
     *
     * 2. **Open Camera Feed:**
     *    - Appends Camera Enhancer UI element to container if not already present
     *    - Opens the camera via {@link CameraEnhancer.open}
     *    - Resumes camera if it was paused via {@link CameraEnhancer.resume}
     *    - Handles camera access errors (e.g., camera in use by another application)
     *
     * 3. **Set Default Resolution:**
     *    - Attempts to set 2K resolution (2560x1440) for optimal document detection
     *    - Gracefully handles resolution errors (logs warning, continues with available resolution)
     *
     * 4. **Initialize UI Elements:**
     *    - Calls {@link initializeElements} to query shadow DOM and attach event handlers
     *    - Only performed once (tracked by `initializedDCE` flag)
     *
     * 5. **Attach Resize Listener:**
     *    - Adds {@link handleResize} to window resize events for scan region recalculation
     *
     * 6. **Apply Capture Modes:**
     *    - Enables Bounds Detection via {@link toggleBoundsDetection} (based on configuration)
     *    - Enables Smart Capture via {@link toggleSmartCapture} (based on configuration)
     *    - Enables Auto Crop via {@link toggleAutoCrop} (based on configuration)
     *
     * 7. **Configure Continuous Scan UI:**
     *    - Shows/updates the "Done" button if there are completed scans
     *    - Hides the "Done" button if no scans completed yet
     *
     * 8. **Hide Loading Overlay:**
     *    - Removes the loading overlay via {@link hideScannerLoadingOverlay}
     *
     * **Error Handling:**
     * - Camera access errors show user-friendly messages (e.g., "camera in use")
     * - Resolution errors are logged but don't block initialization
     * - All errors trigger camera cleanup via {@link closeCamera}
     * - Scan promise resolves with {@link EnumResultStatus.RS_FAILED} status
     *
     * Called by {@link launch} when starting a scan operation.
     *
     * @throws {Error} If camera access is denied or camera initialization fails
     *
     * @see {@link closeCamera} - Closes the camera and releases resources
     * @see {@link initializeElements} - Initializes UI element references
     * @see {@link toggleBoundsDetection} - Enables bounds detection mode
     * @see {@link toggleSmartCapture} - Enables smart capture mode
     * @see {@link toggleAutoCrop} - Enables auto crop mode
     * @see {@link handleResize} - Handles viewport resize events
     * @see {@link CameraEnhancer.open} - Dynamsoft method to open camera
     * @see {@link CameraEnhancer.setResolution} - Dynamsoft method to set camera resolution
     *
     * @internal
     */
    openCamera(): Promise<void>;
    /**
     * Close the camera and clean up all associated resources and event listeners.
     *
     * @param hideContainer - Whether to hide the scanner container element. Defaults to `true`.
     *
     * @remarks
     * This method performs comprehensive cleanup of camera resources, UI elements, and event
     * listeners. It's designed to handle cleanup gracefully even if the camera is already closed.
     *
     * **Cleanup Steps:**
     *
     * 1. **Remove Event Listeners:**
     *    - Removes the window resize listener ({@link handleResize})
     *    - Clears any pending resize timer to prevent delayed execution
     *
     * 2. **Disconnect Observers:**
     *    - Disconnects the toast {@link MutationObserver} created by {@link setupToastObserver}
     *
     * 3. **Update Container Visibility:**
     *    - If `hideContainer` is `true`: Hides the scanner container (display: none)
     *    - If `hideContainer` is `false`: Keeps the container visible
     *
     * 4. **Remove Camera View UI:**
     *    - Removes the Camera Enhancer UI element from the DOM
     *    - Only removes if it's currently attached to a parent
     *
     * 5. **Close Camera:**
     *    - Closes the camera feed via {@link CameraEnhancer.close}
     *    - Gracefully handles errors (camera may already be closed)
     *    - Errors are logged as warnings but don't throw exceptions
     *
     * 6. **Stop Frame Capturing:**
     *    - Stops the Capture Vision Router from processing frames via {@link stopCapturing}
     *    - Clears any drawn overlays from the camera view
     *
     * **When to Use:**
     * - **hideContainer = true (default):** When exiting the scanner completely (scan complete, user cancelled)
     * - **hideContainer = false:** When keeping the scanner visible but closing the camera (e.g., processing uploaded file)
     *
     * **Error Handling:**
     * All camera-related errors are caught and logged as warnings instead of throwing, ensuring
     * cleanup completes even if the camera is in an unexpected state.
     *
     * Called by:
     * - {@link handleCloseBtn} - User clicks the close (X) button
     * - {@link handleContinuousScanDone} - User clicks the "Done" button in continuous mode
     * - {@link takePhoto} - After capture in single-scan mode
     * - {@link uploadImage} - On error or in single-scan mode
     * - {@link openCamera} - On initialization error (cleanup)
     *
     * @see {@link openCamera} - Opens the camera and initializes resources
     * @see {@link stopCapturing} - Stops frame capture and clears overlays
     * @see {@link pauseCamera} - Pauses the camera without full cleanup
     * @see {@link handleResize} - The resize handler that gets removed
     * @see {@link setupToastObserver} - Creates the observer that gets disconnected
     *
     * @internal
     */
    closeCamera(hideContainer?: boolean): void;
    /**
     * Pause the camera feed without releasing camera resources.
     *
     * @remarks
     * This method temporarily pauses the camera video stream while keeping the camera device
     * allocated. This is useful for temporarily suspending the video feed during processing
     * operations while maintaining the ability to quickly resume.
     *
     * **Use Cases:**
     * - Pausing during image normalization in continuous scanning mode
     * - Temporarily stopping video during animations
     * - Reducing resource usage during non-critical operations
     *
     * **Difference from {@link closeCamera}:**
     * - `pauseCamera`: Pauses the video stream, camera remains allocated, quick to resume
     * - `closeCamera`: Fully closes camera, releases device, requires full reinitialization
     *
     * The camera can be resumed via {@link CameraEnhancer.resume} or {@link openCamera}.
     *
     * Errors during pause are logged as warnings but don't throw exceptions, ensuring
     * the calling code can continue even if the camera is in an unexpected state.
     *
     * Called by {@link takePhoto} during image processing in continuous scanning mode.
     *
     * @see {@link openCamera} - Opens or resumes the camera
     * @see {@link closeCamera} - Fully closes the camera
     * @see {@link CameraEnhancer.pause} - Dynamsoft method to pause the camera
     * @see {@link CameraEnhancer.resume} - Dynamsoft method to resume the camera
     *
     * @internal
     */
    pauseCamera(): void;
    /**
     * Stop frame capturing and clear all visual overlays from the camera view.
     *
     * @remarks
     * This method stops the Capture Vision Router from processing camera frames and removes
     * all drawn overlays (such as detected document boundaries) from the camera view.
     *
     * **What it does:**
     * 1. Stops the {@link CaptureVisionRouter} from capturing and analyzing frames
     * 2. Clears all inner drawing items (boundary overlays, guides) from the {@link CameraView}
     *
     * **What it doesn't do:**
     * - Doesn't close the camera (video continues streaming)
     * - Doesn't release camera resources
     * - Doesn't remove event listeners or observers
     *
     * This method is typically called when:
     * - Bounds Detection mode is disabled (no need to analyze frames)
     * - The camera is being closed (as part of {@link closeCamera})
     * - Switching between different capture modes
     *
     * The camera view is cleared to remove stale boundary overlays that may no longer be
     * relevant after stopping frame analysis.
     *
     * Called by:
     * - {@link closeCamera} - During camera cleanup
     * - {@link toggleBoundsDetection} - When disabling bounds detection
     *
     * @see {@link toggleBoundsDetection} - Starts/stops bounds detection mode
     * @see {@link closeCamera} - Full camera cleanup including stopping capture
     * @see {@link CaptureVisionRouter.stopCapturing} - Dynamsoft method to stop frame capture
     * @see {@link CameraView.clearAllInnerDrawingItems} - Dynamsoft method to clear overlays
     *
     * @internal
     */
    stopCapturing(): void;
    /**
     * Determine the current capture flow type based on enabled capture modes.
     *
     * @returns The {@link EnumFlowType} representing the current capture workflow
     *
     * @remarks
     * This method returns the flow type that will be recorded in the {@link DocumentResult},
     * allowing downstream components to understand how the document was captured. The flow
     * type is determined by checking capture mode flags in priority order.
     *
     * **Priority Order (highest to lowest):**
     * 1. **Auto Crop** ({@link EnumFlowType.AUTO_CROP}): If {@link autoCropEnabled} is true
     * 2. **Smart Capture** ({@link EnumFlowType.SMART_CAPTURE}): If {@link smartCaptureEnabled} is true
     * 3. **Manual** ({@link EnumFlowType.MANUAL}): Default if no automatic modes are enabled
     *
     * The flow type provides context for:
     * - Analytics and usage tracking
     * - Determining which views to route through (correction, result)
     * - Understanding user behavior and mode preferences
     * - Debugging and support scenarios
     *
     * Called by {@link takePhoto} to set the `_flowType` property in the {@link DocumentResult}.
     *
     * @see {@link EnumFlowType} - All possible flow type values
     * @see {@link takePhoto} - Uses this method to determine the flow type
     * @see {@link DocumentResult._flowType} - Where the flow type is stored
     * @see {@link toggleAutoCrop} - Sets {@link autoCropEnabled}
     * @see {@link toggleSmartCapture} - Sets {@link smartCaptureEnabled}
     *
     * @internal
     */
    private getFlowType;
    /**
     * Track frame clarity scores to identify the clearest frame for optimal capture quality.
     *
     * @param result - The {@link CapturedResult} containing clarity information for the current frame
     *
     * @remarks
     * This method implements frame verification by analyzing clarity scores across multiple frames
     * to automatically select the clearest (sharpest) frame for capture. This significantly
     * improves capture quality by avoiding blurry frames caused by camera shake or poor focus.
     *
     * **Algorithm Overview:**
     *
     * 1. **Extract Clarity Score:**
     *    - Reads the internal `_clarity` property from the {@link CapturedResult}
     *    - Returns early if no clarity score is available
     *
     * 2. **Reset Max Clarity (Timeout):**
     *    - If 3 seconds have passed since the last max clarity update, resets to 0
     *    - Prevents stale clarity values from influencing new capture attempts
     *
     * 3. **Update Max Clarity:**
     *    - If current clarity exceeds the maximum, updates all tracking variables:
     *      - `maxClarity`: The highest clarity score seen
     *      - `maxClarityTimestamp`: When this max was recorded
     *      - `maxClarityImg`: The image data from this frame
     *      - `maxClarityFrameId`: The frame ID
     *      - Resets `nonImprovingClarityFrameCount` to 0
     *
     * 4. **Track Non-Improving Frames:**
     *    - Increments `nonImprovingClarityFrameCount` if clarity doesn't improve
     *    - Resets to 0 if clarity improves
     *    - Used to detect when clarity has stabilized
     *
     * 5. **Confirm Clearest Frame:**
     *    - After 1 second stabilization time
     *    - And 2+ consecutive non-improving frames
     *    - Sets `clearestFrameId` to `maxClarityFrameId`
     *    - This confirms the clearest frame is ready for capture
     *
     * 6. **Maintain Clarity History:**
     *    - Stores last 50 clarity scores in `clarityHistory`
     *    - Used for trend analysis and non-improving frame detection
     *
     * **Configuration Constants:**
     * - `maxClarityResetTimeoutMs`: 3000ms - Reset max clarity after this timeout
     * - `minStabilizationTimeMs`: 1000ms - Wait this long before confirming clearest frame
     * - `minNonImprovingClarityFramesToConfirm`: 2 - Require this many non-improving frames
     *
     * This feature is enabled by {@link DocumentScannerViewConfig.enableFrameVerification} (default: true).
     * When enabled, {@link takePhoto} uses `maxClarityImg` instead of the latest frame for
     * optimal quality.
     *
     * Called by {@link handleBoundsDetection} for each frame when frame verification is enabled.
     *
     * @see {@link takePhoto} - Uses the clearest frame image for capture
     * @see {@link handleBoundsDetection} - Calls this method for each processed frame
     * @see {@link DocumentScannerViewConfig.enableFrameVerification} - Configuration flag
     *
     * @internal
     */
    private trackFrameClarity;
    takePhoto(): Promise<void>;
    handleBoundsDetection(result: CapturedResult): Promise<void>;
    /**
     * Normalize an image with DDN given a set of points
     * @param points - points provided by either users or DDN's detect quad
     * @returns normalized image by DDN
     */
    private handleAutoCaptureMode;
    launch(): Promise<DocumentResult>;
    normalizeImage(points: Quadrilateral["points"], originalImageData: OriginalImageResultItem["imageData"]): Promise<DeskewedImageResultItem>;
}

/**
 * Configuration interface for customizing toolbar buttons in the {@link DocumentCorrectionView}.
 *
 * @remarks
 * This interface allows you to customize the appearance and behavior of the toolbar buttons displayed in the {@link DocumentCorrectionView}. Each button can be configured using a {@link ToolbarButtonConfig} object to modify its icon, label, CSS class, or visibility.
 *
 * The behaviors described for each button below are the default behaviors. You can override the default behavior by providing a custom {@link ToolbarButton.onClick} handler through the {@link ToolbarButtonConfig}.
 *
 * @example
 * Customize button appearance:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     correctionViewConfig: {
 *         toolbarButtonsConfig: {
 *             fullImage: {
 *                 isHidden: true
 *             },
 *             detectBorders: {
 *                 icon: "path/to/new_icon.png",
 *                 label: "Custom Label"
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @example
 * Override button behavior with custom onClick handler:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     correctionViewConfig: {
 *         toolbarButtonsConfig: {
 *             apply: {
 *                 label: "Confirm",
 *                 onClick: async () => {
 *                     // Custom confirmation logic
 *                     await validateBoundaries();
 *                     console.log("Boundaries confirmed!");
 *                 }
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
interface DocumentCorrectionViewToolbarButtonsConfig {
    /**
     * Configuration for the retake button. Default behavior: returns to the {@link DocumentScannerView} to capture a new image.
     *
     * @public
     */
    retake?: ToolbarButtonConfig;
    /**
     * Configuration for the full image button. Default behavior: sets the document boundaries to match the full image dimensions.
     *
     * @public
     */
    fullImage?: ToolbarButtonConfig;
    /**
     * Configuration for the detect borders button. Default behavior: automatically detects document boundaries using the document detection algorithm.
     *
     * @public
     */
    detectBorders?: ToolbarButtonConfig;
    /**
     * Configuration for the apply button. Default behavior: applies the current boundary adjustments and proceeds with the workflow.
     *
     * @remarks
     * In continuous scanning mode ({@link DocumentScannerConfig.enableContinuousScanning}) when {@link DocumentResultView} is disabled, this button is labeled "Keep Scan" by default and returns to the {@link DocumentScannerView} for the next scan. Otherwise, it is labeled "Apply" when {@link DocumentResultView} is shown, or labeled "Done" otherwise.
     *
     * @public
     */
    apply?: ToolbarButtonConfig;
}
/**
 * The `DocumentCorrectionViewConfig` interface passes settings to the {@link DocumentScanner} constructor through the {@link DocumentScannerConfig} to apply UI and business logic customizations for the {@link DocumentCorrectionView}.
 *
 * @remarks
 * Only rare and edge-case scenarios require editing MDS source code. MDS uses sensible default values for all omitted properties.
 *
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
 *     correctionViewConfig: {
 *         onFinish: (result) => {
 *             const canvas = result.correctedImageResult.toCanvas();
 *             resultContainer.appendChild(canvas);
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
interface DocumentCorrectionViewConfig {
    /**
     * The HTML container element or selector for the {@link DocumentCorrectionView} UI.
     *
     * @public
     */
    container?: HTMLElement | string;
    /**
     * Configure the appearance and labels of the buttons for the {@link DocumentCorrectionView} UI.
     *
     * @see {@link DocumentCorrectionViewToolbarButtonsConfig}
     *
     * @public
     */
    toolbarButtonsConfig?: DocumentCorrectionViewToolbarButtonsConfig;
    /**
     * Path to the Capture Vision template file for scanning configuration.
     *
     * @remarks
     * This typically does not need to be set as MDS provides a default template for general use. You may set custom paths to self-host resources or fully self-host MDS.
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
     * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV templates}
     *
     * @defaultValue {@link DEFAULT_DCE_UI_PATH}
     *
     * @public
     */
    templateFilePath?: string;
    /**
     * Capture Vision template names for document detection and normalization.
     *
     * @remarks
     * This typically does not need to be set as MDS provides a default template for general use. You may set custom names to self-host resources or fully self-host MDS.
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
     * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV templates}
     *
     * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
     *
     * @public
     */
    utilizedTemplateNames?: UtilizedTemplateNames;
    /**
     * Handler called when the user clicks the "Apply" button.
     *
     * @param result - The {@link DocumentResult} of the scan, including the original image, corrected image, detected boundaries, and scan status
     *
     * @public
     */
    onFinish?: (result: DocumentResult) => void;
    /**
     * @privateRemarks
     * Changes the label of the "Apply" button to "Done" if the {@link DocumentResultView} is not configured.
     *
     * @internal
     */
    _showResultView?: boolean;
}
declare class DocumentCorrectionView {
    private resources;
    private config;
    private scannerView;
    private imageEditorView;
    private layer;
    private currentCorrectionResolver?;
    constructor(resources: SharedResources, config: DocumentCorrectionViewConfig, scannerView: DocumentScannerView);
    initialize(): Promise<void>;
    /**
     * Configure the visual appearance of the drawing layer used to display and manipulate document boundaries.
     *
     * @remarks
     * Sets 5px orange (#FE8E14) stroke, transparent fill. Called by {@link initialize}.
     *
     * @internal
     */
    private setupDrawingLayerStyle;
    /**
     * Set up boundary constraints and cursor behavior for the document boundary quadrilateral.
     *
     * @remarks
     * Constrains corner points to canvas bounds during drag operations. Called by {@link initialize}.
     *
     * @internal
     */
    private setupQuadConstraints;
    /**
     * Retrieve the dimensions of the canvas used for rendering the document image and boundary overlay.
     *
     * @returns Canvas width and height in pixels
     *
     * @internal
     */
    private getCanvasBounds;
    /**
     * Add a quadrilateral boundary to the drawing layer for user manipulation.
     *
     * @param newQuad - The {@link QuadDrawingItem} representing the document boundary to display
     *
     * @remarks
     * This method configures and adds a quadrilateral boundary overlay to the {@link DrawingLayer},
     * allowing users to manually adjust document boundaries by dragging corner points. The process:
     *
     * 1. Clears any existing quadrilaterals from the layer
     * 2. Retrieves the Fabric.js object from the {@link QuadDrawingItem}
     * 3. Calculates corner control size as 10% of the smaller image dimension for touch-friendly interaction
     * 4. Locks the quadrilateral position (prevents dragging the entire shape)
     * 5. Configures corner controls to be draggable for boundary adjustment
     * 6. Sets up visual feedback: corners become transparent during drag, orange (#FE8E14) when released
     * 7. Adds the quadrilateral to the layer and makes it the active selection
     *
     * The quadrilateral corners can be manipulated by the user, but the constraints set up by
     * {@link setupQuadConstraints} ensure corners remain within the image bounds.
     *
     * Called by {@link setupInitialDetectedQuad}, {@link setFullImageBoundary}, and {@link setBoundaryAutomatically}
     * whenever the document boundary needs to be updated or reset.
     *
     * @see {@link QuadDrawingItem} - The drawing item type for quadrilateral boundaries
     * @see {@link DrawingLayer} - The layer where the quadrilateral is rendered
     * @see {@link setupQuadConstraints} - Ensures corner points stay within valid bounds
     * @see {@link setupDrawingLayerStyle} - Configures the visual appearance of the quadrilateral
     *
     * @internal
     */
    private addQuadToLayer;
    /**
     * Display the initial document boundary quadrilateral on the correction view.
     *
     * @remarks
     * This method sets up the initial document boundary overlay based on the scan result from
     * {@link DocumentScannerView}. It follows this logic:
     *
     * 1. If {@link DocumentResult.detectedQuadrilateral} exists (from automatic document detection),
     *    creates a {@link QuadDrawingItem} from the detected boundaries
     * 2. If no quadrilateral was detected, creates a default quadrilateral matching the full image
     *    dimensions, with corners at (0,0), (width,0), (width,height), and (0,height)
     *
     * The created quadrilateral is then added to the {@link DrawingLayer} via {@link addQuadToLayer},
     * where users can manually adjust the corner points to refine the document boundaries before
     * perspective correction is applied.
     *
     * This fallback to full image bounds ensures users always have a starting point for boundary
     * adjustment, even when automatic detection fails or is disabled.
     *
     * Called internally by {@link initialize} during view setup, after the {@link ImageEditorView}
     * and {@link DrawingLayer} have been configured.
     *
     * @see {@link DocumentResult} - Contains the detected quadrilateral from document scanning
     * @see {@link QuadDrawingItem} - The drawing item type for quadrilateral boundaries
     * @see {@link addQuadToLayer} - Adds the quadrilateral to the drawing layer
     * @see {@link SharedResources.result} - The current scan result
     *
     * @internal
     */
    private setupInitialDetectedQuad;
    /**
     * Create the toolbar control buttons for the correction view.
     *
     * @returns The HTML element containing all toolbar buttons
     *
     * @remarks
     * This method builds the correction view toolbar with four action buttons, each configurable
     * through {@link DocumentCorrectionViewToolbarButtonsConfig}:
     *
     * 1. **Retake Button**: Returns to {@link DocumentScannerView} to capture a new image
     *    - Default icon: {@link DDS_ICONS.retake}
     *    - Default label: "Re-take"
     *    - Handler: {@link handleRetake}
     *    - Disabled when no scanner view is available
     *
     * 2. **Full Image Button**: Sets document boundaries to match the full image dimensions
     *    - Default icon: {@link DDS_ICONS.fullImage}
     *    - Default label: "Full Image"
     *    - Handler: {@link setFullImageBoundary}
     *
     * 3. **Detect Borders Button**: Automatically detects document boundaries using DDN
     *    - Default icon: {@link DDS_ICONS.autoBounds}
     *    - Default label: "Detect Borders"
     *    - Handler: {@link setBoundaryAutomatically}
     *
     * 4. **Apply Button**: Confirms boundary adjustments and proceeds with the workflow
     *    - Default icon: {@link DDS_ICONS.finish} (or {@link DDS_ICONS.complete} if no result view)
     *    - Default label: Context-dependent ("Apply", "Done", or "Keep Scan")
     *    - Handler: {@link confirmCorrection}
     *
     * Each button's appearance and behavior can be customized through {@link ToolbarButtonConfig}.
     * The buttons are passed to the {@link createControls} utility function which generates the HTML.
     *
     * Called internally by {@link setupCorrectionControls} during view initialization.
     *
     * @see {@link DocumentCorrectionViewToolbarButtonsConfig} - Configuration interface for button customization
     * @see {@link ToolbarButton} - Button definition interface
     * @see {@link createControls} - Utility function that generates the toolbar HTML
     * @see {@link setupCorrectionControls} - Adds the created controls to the view container
     *
     * @internal
     */
    private createControls;
    /**
     * Add the correction toolbar controls to the view container.
     *
     * @throws {Error} If control setup fails
     *
     * @internal
     */
    private setupCorrectionControls;
    /**
     * Handle the retake button action to return to camera capture for a new scan.
     *
     * @throws {Error} If an error occurs during the retake workflow
     *
     * @remarks
     * This method implements the retake workflow, allowing users to discard the current image
     * and capture a new one using the {@link DocumentScannerView}. The process:
     *
     * 1. Validates that {@link DocumentScannerView} is available (required for camera capture)
     * 2. Hides the current correction view via {@link hideView}
     * 3. Shows the scanner view container and launches camera capture via {@link DocumentScannerView.launch}
     * 4. Handles the scan result:
     *    - **Cancelled/Failed**: Resolves the correction promise with the failed status and exits
     *    - **Success**: Updates {@link SharedResources.result}, stops capture, hides scanner view,
     *      reinitializes the correction view with new image data, and shows the refreshed correction view
     *
     * The method preserves the {@link currentCorrectionResolver} during reinitialization (via
     * {@link dispose} with `preserveResolver: true`) to ensure the correction workflow promise
     * chain remains intact.
     *
     * If any error occurs during the workflow, the promise is resolved with {@link EnumResultStatus.RS_FAILED}
     * status before re-throwing the error.
     *
     * Triggered by clicking the retake button created in {@link createControls}.
     *
     * @see {@link DocumentScannerView} - Handles camera capture for new scans
     * @see {@link SharedResources.result} - Updated with the new scan result
     * @see {@link hideView} - Hides the correction view
     * @see {@link initialize} - Reinitializes the view with new image data
     * @see {@link dispose} - Cleans up before reinitialization
     *
     * @internal
     */
    private handleRetake;
    /**
     * Reset the document boundary to match the full image dimensions.
     *
     * @throws {Error} If no captured image is available in {@link SharedResources.result}
     *
     * @remarks
     * This method creates a quadrilateral boundary that encompasses the entire image, effectively
     * disabling perspective correction. The quadrilateral corners are positioned at:
     * - Top-left: (0, 0)
     * - Top-right: (width, 0)
     * - Bottom-right: (width, height)
     * - Bottom-left: (0, height)
     *
     * This is useful when:
     * - The document occupies the entire image with no background visible
     * - Automatic boundary detection failed or detected incorrect boundaries
     * - Users want to skip perspective correction and use the original image dimensions
     *
     * The created quadrilateral is added to the {@link DrawingLayer} via {@link addQuadToLayer},
     * replacing any existing boundary. Users can still manually adjust the corners after reset.
     *
     * Triggered by clicking the "Full Image" button created in {@link createControls}.
     *
     * @see {@link SharedResources.result} - Contains the original image dimensions
     * @see {@link QuadDrawingItem} - The quadrilateral type added to the drawing layer
     * @see {@link addQuadToLayer} - Adds the full-image quadrilateral to the layer
     * @see {@link setBoundaryAutomatically} - Alternative method for automatic boundary detection
     *
     * @public
     */
    setFullImageBoundary(): void;
    /**
     * Automatically detect document boundaries using Dynamsoft Document Normalizer (DDN).
     *
     * @remarks
     * This method re-runs document boundary detection on the current image using the
     * {@link CaptureVisionRouter} and DDN (Dynamsoft Document Normalizer) engine. The process:
     *
     * 1. Initializes settings from {@link DocumentCorrectionViewConfig.templateFilePath} if provided
     * 2. Retrieves the detection template settings via {@link DocumentCorrectionViewConfig.utilizedTemplateNames}
     * 3. Configures the router to:
     *    - Output the original image for further processing
     *    - Process images at full resolution (no downscaling via `maxImageSideLength = Infinity`)
     * 4. Captures and analyzes the image to detect document boundaries
     * 5. Handles the detection result:
     *    - **Boundary detected**: Creates a {@link QuadDrawingItem} from the detected {@link Quadrilateral}
     *      and adds it to the layer via {@link addQuadToLayer}
     *    - **No boundary detected**: Falls back to {@link setFullImageBoundary} to use full image dimensions
     *
     * This allows users to retry automatic detection if:
     * - Manual adjustments were made but proved unsatisfactory
     * - Initial detection failed due to lighting or positioning issues that were later corrected
     * - The image was uploaded without initial detection
     *
     * Triggered by clicking the "Detect Borders" button created in {@link createControls}.
     *
     * @see {@link CaptureVisionRouter} - Processes the image for boundary detection
     * @see {@link DetectedQuadResultItem} - Contains the detected document boundaries
     * @see {@link addQuadToLayer} - Adds the detected quadrilateral to the drawing layer
     * @see {@link setFullImageBoundary} - Fallback when no boundaries are detected
     * @see {@link SharedResources.cvRouter} - The router instance used for detection
     *
     * @public
     */
    setBoundaryAutomatically(): Promise<void>;
    /**
     * Confirm the boundary adjustments and apply perspective correction to the image.
     *
     * @throws {Error} If no quadrilateral boundary is found on the drawing layer
     *
     * @remarks
     * Retrieves boundary, performs correction via {@link correctImage}, updates result, invokes callback, resolves promise.
     *
     * @public
     */
    confirmCorrection(): Promise<void>;
    launch(): Promise<DocumentResult>;
    /**
     * Hide the correction view by setting its container display to "none".
     *
     * @remarks
     * Sets container display to "none" without disposing resources.
     *
     * @public
     */
    hideView(): void;
    /**
     * Apply perspective correction to the document image using Dynamsoft Document Normalizer (DDN).
     *
     * @param points - The quadrilateral corner points defining the document boundary
     * @returns The perspective-corrected (deskewed) image, or undefined if correction fails
     *
     * @remarks
     * Configures ROI with quadrilateral points, processes image with normalization template.
     *
     * @public
     */
    correctImage(points: Quadrilateral["points"]): Promise<DeskewedImageResultItem>;
    /**
     * Clean up and release resources.
     *
     * @param preserveResolver - Whether to preserve the {@link currentCorrectionResolver} promise resolver
     *
     * @remarks
     * Disposes {@link ImageEditorView}, clears layer and container. Optionally preserves resolver for {@link handleRetake}.
     *
     * @public
     */
    dispose(preserveResolver?: boolean): void;
}

/**
 * Configuration interface for customizing toolbar buttons in the {@link DocumentResultView}.
 *
 * @remarks
 * This interface allows you to customize the appearance and behavior of the toolbar buttons displayed in the {@link DocumentResultView}. Each button can be configured using a {@link ToolbarButtonConfig} object to modify its icon, label, CSS class, or visibility.
 *
 * The behaviors described for each button below are the default behaviors. You can override the default behavior by providing a custom {@link ToolbarButton.onClick} handler through the {@link ToolbarButtonConfig}.
 *
 * @example
 * Customize button appearance:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     resultViewConfig: {
 *         toolbarButtonsConfig: {
 *             retake: {
 *                 isHidden: true
 *             },
 *             share: {
 *                 icon: "path/to/new_icon.png",
 *                 label: "Custom Label"
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @example
 * Override button behavior with custom onClick handler:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     resultViewConfig: {
 *         toolbarButtonsConfig: {
 *             done: {
 *                 label: "Save",
 *                 onClick: async () => {
 *                     // Custom save logic
 *                     await saveToServer(documentScanner.result);
 *                     console.log("Document saved!");
 *                 }
 *             },
 *             share: {
 *                 onClick: async () => {
 *                     // Custom share logic
 *                     await sendViaEmail(documentScanner.result);
 *                 }
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
interface DocumentResultViewToolbarButtonsConfig {
    /**
     * Configuration for the retake button. Default behavior: returns to the {@link DocumentScannerView} to capture a new image.
     *
     * @public
     */
    retake?: ToolbarButtonConfig;
    /**
     * Configuration for the correct button. Default behavior: enters the {@link DocumentCorrectionView} to adjust document boundaries.
     *
     * @public
     */
    correct?: ToolbarButtonConfig;
    /**
     * Configuration for the share button. Default behavior: shares or downloads the scanned document.
     *
     * @remarks
     * On mobile devices with Web Share API support, this button triggers the native share dialog. On desktop or devices without share support, it downloads the image instead.
     *
     * @public
     */
    share?: ToolbarButtonConfig;
    /**
     * Configuration for the upload button. Default behavior: triggers the {@link DocumentResultViewConfig.onUpload} callback.
     *
     * @remarks
     * This button is only visible when {@link DocumentResultViewConfig.onUpload} is defined.
     *
     * @public
     */
    upload?: ToolbarButtonConfig;
    /**
     * Configuration for the done button. Default behavior: completes the scanning workflow.
     *
     * @remarks
     * In continuous scanning mode ({@link DocumentScannerConfig.enableContinuousScanning}), this button is labeled "Keep Scan" by default and returns to the {@link DocumentScannerView} for the next scan.
     *
     * @public
     */
    done?: ToolbarButtonConfig;
}
/**
 * The `DocumentResultViewConfig` interface passes settings to the {@link DocumentScanner} constructor through the {@link DocumentScannerConfig} to apply UI and business logic customizations for the {@link DocumentResultView}.
 *
 * @remarks
 * Only rare and edge-case scenarios require editing MDS source code. MDS uses sensible default values for all omitted properties.
 *
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
 *     resultViewConfig: {
 *         onDone: async (result) =>
 *         {
 *             const canvas = result.correctedImageResult.toCanvas();
 *             resultContainer.appendChild(canvas);
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
interface DocumentResultViewConfig {
    /**
     * The HTML container element or selector for the {@link DocumentResultView} UI.
     *
     * @public
     */
    container?: HTMLElement | string;
    /**
     * Configure the appearance and labels of the buttons for the {@link DocumentResultView} UI.
     *
     * @see {@link DocumentResultViewToolbarButtonsConfig}
     *
     * @public
     */
    toolbarButtonsConfig?: DocumentResultViewToolbarButtonsConfig;
    /**
     * Handler called when the user clicks the "Done" button.
     *
     * @param result - The {@link DocumentResult} of the scan, including the original image, corrected image, detected boundaries, and scan status
     *
     * @public
     */
    onDone?: (result: DocumentResult) => Promise<void>;
    /**
     * Handler called when the user clicks the "Upload" button.
     *
     * @param result - The {@link DocumentResult} of the scan, including the original image, corrected image, detected boundaries, and scan status
     *
     * @public
     */
    onUpload?: (result: DocumentResult) => Promise<void>;
}
declare class DocumentResultView {
    private resources;
    private config;
    private scannerView;
    private correctionView;
    private currentScanResultViewResolver?;
    constructor(resources: SharedResources, config: DocumentResultViewConfig, scannerView: DocumentScannerView, correctionView: DocumentCorrectionView);
    launch(): Promise<DocumentResult>;
    /**
     * Handle upload or share button actions.
     *
     * @param mode - The action mode: "share" to share/download the image, "upload" to trigger the upload callback
     *
     * @returns Promise that resolves when the operation completes
     *
     * @remarks
     * Validates image exists, then invokes callback or delegates to {@link handleShare}.
     *
     * @internal
     */
    private handleUploadAndShareBtn;
    /**
     * Share or download the corrected document image.
     *
     * @returns Promise resolving to `true` if successful, `undefined` on error
     *
     * @remarks
     * This method attempts to share or download the corrected document image using platform-appropriate mechanisms:
     *
     * **On Mobile Devices:**
     * - Detects mobile platforms via user agent string
     * - Attempts to use the Web Share API ({@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share | navigator.share}) if available
     * - Checks file sharing support via {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare | navigator.canShare}
     * - Handles various error scenarios (AbortError, NotAllowedError, TypeError, DataError) gracefully
     * - Falls back to download if sharing is not supported or fails
     *
     * **On Desktop or Fallback:**
     * - Creates a temporary download link with a timestamped filename
     * - Triggers automatic download by simulating a click
     * - Cleans up the temporary object URL after download
     *
     * The corrected image is converted to a PNG blob using {@link DeskewedImageResultItem.toBlob} before sharing/downloading.
     * If the user cancels the share dialog (AbortError), the operation is considered successful and returns without error.
     *
     * @throws {Error} If no corrected image result is available
     * @throws {Error} If blob conversion fails
     *
     * @see {@link handleUploadAndShareBtn} which invokes this method in "share" mode
     * @see {@link DeskewedImageResultItem.toBlob} for image conversion
     * @see {@link SharedResources.result} for the source of the corrected image
     * @see {@link createControls} where the share button is configured
     *
     * @internal
     */
    private handleShare;
    /**
     * Launch the correction view to manually adjust document boundaries.
     *
     * @returns Promise that resolves when the correction is complete
     *
     * @remarks
     * Hides result view, launches {@link DocumentCorrectionView}, updates result and reinitializes on success.
     *
     * @internal
     */
    private handleCorrectImage;
    /**
     * Return to the scanner view to capture a new document.
     *
     * @returns Promise that resolves when the retake workflow completes
     *
     * @remarks
     * This method is invoked when the user clicks the "Re-take" button in the {@link DocumentResultView} toolbar.
     * It performs the following workflow:
     *
     * 1. **Validation**: Checks that {@link DocumentScannerView} is initialized
     * 2. **View Transition**: Hides the result view via {@link hideView} and shows the {@link DocumentScannerView}
     * 3. **Capture**: Launches {@link DocumentScannerView.launch} to capture a new document
     * 4. **Result Handling**:
     *    - If cancelled ({@link EnumResultStatus.RS_CANCELLED}) or failed ({@link EnumResultStatus.RS_FAILED}): Resolves with the status and exits
     *    - If successful ({@link EnumResultStatus.RS_SUCCESS}):
     *      - Updates {@link SharedResources.result} via {@link SharedResources.onResultUpdated}
     *      - Stops camera capture via {@link DocumentScannerView.stopCapturing}
     *      - Hides the {@link DocumentScannerView}
     *      - If {@link DocumentCorrectionView} is configured: Routes through correction view
     *      - Refreshes the result view with the new image via {@link dispose} and {@link initialize}
     *
     * **Correction View Integration:**
     * When {@link DocumentCorrectionView} is configured, the retake workflow automatically routes through the correction view
     * before returning to the result view. This allows the user to adjust boundaries on the newly captured document.
     * If the user cancels or encounters an error in the correction view, the workflow exits and resolves with the error status.
     *
     * @throws {Error} If the {@link DocumentScannerView} is not initialized
     * @throws {Error} If an error occurs during the retake workflow
     *
     * @see {@link DocumentScannerView} for the scanner view implementation
     * @see {@link DocumentScannerView.launch} which is called to capture a new document
     * @see {@link DocumentCorrectionView} for optional boundary adjustment after capture
     * @see {@link SharedResources.onResultUpdated} for result update notification
     * @see {@link createControls} where the retake button is created and this handler is attached
     *
     * @internal
     */
    private handleRetake;
    /**
     * Complete the scanning workflow and finalize the result.
     *
     * @returns Promise that resolves when the done handler completes
     *
     * @remarks
     * Invokes {@link DocumentResultViewConfig.onDone} callback, resolves promise, cleans up.
     *
     * @internal
     */
    private handleDone;
    /**
     * Create the toolbar controls for the result view.
     *
     * @returns The HTMLElement containing the toolbar with all configured buttons
     *
     * @remarks
     * Detects mobile/share capability, creates retake/correction/share/upload/done buttons. Customizable via {@link DocumentResultViewToolbarButtonsConfig}.
     *
     * @internal
     */
    private createControls;
    initialize(): Promise<void>;
    /**
     * Hide the result view by setting its container display to "none".
     *
     * @remarks
     * Sets container display to "none" without disposing contents.
     *
     * @internal
     */
    hideView(): void;
    /**
     * Dispose of the result view by cleaning up the container and optionally clearing the resolver.
     *
     * @param preserveResolver - If `true`, preserves the {@link currentScanResultViewResolver} for reuse; if `false`, clears it. Defaults to `false`.
     *
     * @remarks
     * Clears container contents. Optionally preserves resolver for {@link handleCorrectImage} and {@link handleRetake}.
     *
     * @internal
     */
    dispose(preserveResolver?: boolean): void;
}

/**
 * The `DocumentScannerConfig` interface passes settings to the {@link DocumentScanner} constructor to apply a comprehensive set of UI and business logic customizations.
 *
 * @remarks
 * Only advanced scenarios require editing the UI template or MDS source code. {@link DocumentScannerConfig.license} is the only property required to instantiate a {@link DocumentScanner} object. MDS uses sensible default values for all other omitted properties.
 *
 * @example
 * ```typescript
 * const config = {
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     scannerViewConfig: {
 *         cameraEnhancerUIPath: "./dist/document-scanner.ui.xml", // Use the local file
 *     },
 *     engineResourcePaths: {
 *         std: "./dist/libs/dynamsoft-capture-vision-std/dist/",
 *         dip: "./dist/libs/dynamsoft-image-processing/dist/",
 *         core: "./dist/libs/dynamsoft-core/dist/",
 *         license: "./dist/libs/dynamsoft-license/dist/",
 *         cvr: "./dist/libs/dynamsoft-capture-vision-router/dist/",
 *         ddn: "./dist/libs/dynamsoft-document-normalizer/dist/",
 *     },
 * };
 * ```
 *
 * @public
 * @stable
 */
interface DocumentScannerConfig {
    /**
     * The license key for using the {@link DocumentScanner}.
     *
     * @remarks
     * This is the only required property to instantiate a {@link DocumentScanner} object.
     *
     * @public
     * @stable
     */
    license?: string;
    /**
     * The container element or selector for the {@link DocumentScanner} UI.
     *
     * @public
     * @stable
     */
    container?: HTMLElement | string;
    /**
     * The file path to the Capture Vision template used for document scanning.
     *
     * @remarks
     * You may set custom paths to self-host the template or fully self-host MDS.
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
     *
     * @public
     * @stable
     */
    templateFilePath?: string;
    /**
     * Capture Vision template names for document detection and normalization.
     *
     * @remarks
     * This typically does not need to be set as MDS provides a default template for general use. You may set custom names to self-host resources or fully self-host MDS.
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
     * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV templates}
     *
     * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
     *
     * @public
     * @stable
     */
    utilizedTemplateNames?: UtilizedTemplateNames;
    /**
     * Paths to the necessary engine resources (such as `.wasm` files) for the scanning engine.
     *
     * @remarks
     * The default paths point to CDNs so this may be left unset. You may set custom paths to self-host resources or fully self-host MDS.
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
     *
     * @public
     * @stable
     */
    engineResourcePaths?: EngineResourcePaths;
    /**
     * Configuration settings for the {@link DocumentScannerView}.
     *
     * @remarks
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#workflow-customization | Workflow customization}
     *
     * @public
     * @stable
     */
    scannerViewConfig?: Omit<DocumentScannerViewConfig, "templateFilePath" | "utilizedTemplateNames" | "_showCorrectionView">;
    /**
     * Configuration settings for the {@link DocumentResultView}.
     *
     * @remarks
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#workflow-customization | Workflow customization}
     *
     * @public
     * @stable
     */
    resultViewConfig?: DocumentResultViewConfig;
    correctionViewConfig?: Omit<DocumentCorrectionViewConfig, "templateFilePath" | "utilizedTemplateNames" | "_showCorrectionView">;
    /**
     * Sets the visibility of the {@link DocumentResultView}.
     *
     * @defaultValue true
     * @public
     * @stable
     */
    showResultView?: boolean;
    /**
     * Sets the visibility of the {@link DocumentCorrectionView}.
     *
     * @defaultValue true
     * @public
     * @stable
     */
    showCorrectionView?: boolean;
    /**
     * Enable continuous scanning mode where the scanner loops back after each successful scan instead of exiting. {@link DocumentScanner.launch} only resolves to the last scanned result. Use {@link onDocumentScanned} callback to get scan results.
     *
     * @remarks
     * When enabled:
     * - The scanner automatically loops back to capture another document after each successful scan
     * - The {@link onDocumentScanned} callback triggers after each scan with the result; this is the only way to get the scanned results as {@link DocumentScanner.launch} only returns the last scanned result
     * - Users can exit by clicking the close button (X) or by calling {@link DocumentScanner.stopContinuousScanning}
     * - The DocumentScanner only retains the most recent scan result
     *
     * @defaultValue false
     * @public
     * @stable
     */
    enableContinuousScanning?: boolean;
    /**
     * Callback invoked after each successful scan in continuous scanning mode.
     *
     * @remarks
     * This callback is only called when {@link enableContinuousScanning} is true. The scanner loops back to capture another document after this callback completes. The callback receives a {@link DocumentResult} containing the original image, corrected image, detected boundaries, and scan status.
     *
     * @param result - The {@link DocumentResult} of the scan
     *
     * @example
     * ```javascript
     * const documentScanner = new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE",
     *     enableContinuousScanning: true,
     *     onDocumentScanned: async (result) => {
     *         // Process each scanned document
     *         const canvas = result.correctedImageResult.toCanvas();
     *         document.getElementById("results").appendChild(canvas);
     *     }
     * });
     * ```
     *
     * @public
     * @stable
     */
    onDocumentScanned?: (result: DocumentResult) => void | Promise<void>;
    /**
     * Callback invoked when the thumbnail preview is clicked in continuous scanning mode.
     *
     * @remarks
     * This callback is only invoked when:
     * - {@link enableContinuousScanning} is enabled
     * - {@link showCorrectionView} is disabled
     * - {@link showResultView} is disabled
     *
     * The thumbnail preview displays the most recently scanned document. By default, clicking it does nothing unless this callback is defined, allowing you to implement custom behavior such as re-editing the image.
     *
     * @param result - The {@link DocumentResult} of the last scanned document
     *
     * @example
     * ```javascript
     * const documentScanner = new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE",
     *     enableContinuousScanning: true,
     *     showCorrectionView: false,
     *     showResultView: false,
     *     onThumbnailClicked: async (result) => {
     *         // Handle thumbnail click event
     *         console.log('Thumbnail clicked', result);
     *         // Could open a custom editor, display metadata, etc.
     *     }
     * });
     * ```
     *
     * @public
     * @stable
     */
    onThumbnailClicked?: (result: DocumentResult) => void | Promise<void>;
    /**
     * Enable automatic frame verification for best quality capture.
     *
     * @remarks
     * When enabled, uses clarity detection and cross-filtering to automatically find the clearest frame.
     * This uses the same algorithm as the React reference implementation.
     *
     * @defaultValue true
     * @public
     * @stable
     */
    enableFrameVerification?: boolean;
}
/**
 * Internal interface for shared resources used across different views in the {@link DocumentScanner}.
 *
 * @remarks
 * This interface manages the coordination of resources between {@link DocumentScannerView}, {@link DocumentCorrectionView}, and {@link DocumentResultView}. It holds references to the Dynamsoft Capture Vision components, the current scan result, and callbacks for handling result updates and user interactions.
 *
 * @internal
 */
interface SharedResources {
    /**
     * The Capture Vision Router instance for processing images and detecting document boundaries.
     *
     * @internal
     */
    cvRouter?: CaptureVisionRouter;
    /**
     * The Camera Enhancer instance for camera control and video streaming.
     *
     * @internal
     */
    cameraEnhancer?: CameraEnhancer;
    /**
     * The Camera View instance for displaying the camera feed and UI overlays.
     *
     * @internal
     */
    cameraView?: CameraView;
    /**
     * The current document scan result containing the original image, corrected image, and detected boundaries.
     *
     * @internal
     */
    result?: DocumentResult;
    /**
     * Callback invoked when the scan result is updated.
     *
     * @param result - The updated {@link DocumentResult}
     *
     * @internal
     */
    onResultUpdated?: (result: DocumentResult) => void;
    /**
     * Flag indicating whether continuous scanning mode is enabled.
     *
     * @remarks
     * Corresponds to {@link DocumentScannerConfig.enableContinuousScanning}.
     *
     * @internal
     */
    enableContinuousScanning?: boolean;
    /**
     * Counter tracking the number of successfully completed scans in continuous scanning mode.
     *
     * @internal
     */
    completedScansCount?: number;
    /**
     * Callback invoked when the thumbnail preview is clicked in continuous scanning mode.
     *
     * @remarks
     * Corresponds to {@link DocumentScannerConfig.onThumbnailClicked}.
     *
     * @param result - The {@link DocumentResult} associated with the thumbnail
     *
     * @internal
     */
    onThumbnailClicked?: (result: DocumentResult) => void | Promise<void>;
}
/**
 * Main class for document scanning functionality with camera capture, document detection, perspective correction, and result management.
 *
 * @remarks
 * The `DocumentScanner` class provides a complete document scanning solution that integrates camera access, real-time document boundary detection, manual boundary adjustment, and image perspective correction. It orchestrates three main views:
 * - {@link DocumentScannerView}: Camera interface with document detection and capture modes
 * - {@link DocumentCorrectionView}: Manual boundary adjustment interface
 * - {@link DocumentResultView}: Result preview and action interface
 *
 * The class supports both single-scan and continuous scanning modes. In continuous mode, the scanner loops back after each successful scan, allowing multiple documents to be captured in sequence.
 *
 * @example
 * Basic usage with default configuration:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE"
 * });
 *
 * const result = await documentScanner.launch();
 * if (result?.correctedImageResult) {
 *     const canvas = result.correctedImageResult.toCanvas();
 *     document.body.appendChild(canvas);
 * }
 * ```
 *
 * @example
 * Continuous scanning mode:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     enableContinuousScanning: true,
 *     onDocumentScanned: async (result) => {
 *         // Process each scanned document
 *         await uploadToServer(result.correctedImageResult);
 *     }
 * });
 *
 * await documentScanner.launch();
 * ```
 *
 * @example
 * Process an existing image file:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE"
 * });
 *
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const result = await documentScanner.launch(file);
 * ```
 *
 * @public
 * @stable
 */
declare class DocumentScanner {
    private config;
    private scannerView?;
    private scanResultView?;
    private correctionView?;
    private resources;
    private isInitialized;
    private isCapturing;
    private shouldStopContinuousScanning;
    private loadingScreen;
    /**
     * Display a loading overlay on top of the {@link DocumentScannerView}.
     *
     * @param message - Optional message to display in the loading overlay
     *
     * @remarks
     * This method shows a loading screen over the scanner container with an optional custom message.
     * It also ensures the container is visible and properly positioned.
     *
     * Used internally during {@link initialize} and when processing uploaded files via {@link processUploadedFile}.
     * Call {@link hideScannerLoadingOverlay} to remove the overlay.
     *
     * @internal
     */
    private showScannerLoadingOverlay;
    /**
     * Hide the loading overlay displayed over the scanner view.
     *
     * @param hideContainer - Whether to also hide the scanner container.
     *
     * @remarks
     * This method removes the loading screen overlay created by {@link showScannerLoadingOverlay}.
     * If `hideContainer` is true, it also hides the entire scanner container element.
     *
     * @internal
     */
    private hideScannerLoadingOverlay;
    /**
     * Create a DocumentScanner instance with settings specified by a {@link DocumentScannerConfig} object.
     *
     * @param config - The {@link DocumentScannerConfig} to set all main configurations, including UI toggles, data workflow callbacks, etc. You must set a valid license key with the `license` property. See {@link DocumentScannerConfig} for a complete description.
     *
     * @example
     * HTML:
     * ```html
     * <div id="myDocumentScannerContainer" style="width: 80vw; height: 80vh;"></div>
     * ```
     * JavaScript:
     * ```javascript
     * const documentScanner = new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
     *     scannerViewConfig: {
     *         container: document.getElementById("myDocumentScannerViewContainer") // Use this container for the scanner view
     *     }
     * });
     * ```
     *
     * @public
     */
    constructor(config: DocumentScannerConfig);
    /**
     * Initialize the DocumentScanner by setting up Dynamsoft Capture Vision resources and view components.
     *
     * @remarks
     * **This method is called automatically by {@link launch} and typically does not need to be invoked manually.**
     *
     * This method performs the following initialization steps:
     * 1. Validates and processes the configuration provided to the constructor
     * 2. Initializes Dynamsoft Capture Vision engine resources (license, camera, router)
     * 3. Creates and initializes the configured view components (scanner, correction, result)
     * 4. Sets up shared resources and callbacks for communication between views
     *
     * The method is idempotent - calling it multiple times will return the same resources and components without re-initialization.
     *
     * @returns A promise that resolves to an object containing:
     * - `resources`: The {@link SharedResources} object containing camera, router, and state
     * - `components`: An object with references to the initialized view components ({@link DocumentScannerView | scannerView}, {@link DocumentCorrectionView | correctionView}, {@link DocumentResultView | scanResultView})
     *
     * @throws {Error} If initialization fails due to invalid configuration, missing license, or resource loading errors
     *
     * @example
     * Manual initialization (**rarely needed**):
     * ```javascript
     * const documentScanner = new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE"
     * });
     *
     * try {
     *     const { resources, components } = await documentScanner.initialize();
     *     console.log("Scanner initialized successfully");
     * } catch (error) {
     *     console.error("Initialization failed:", error);
     * }
     * ```
     *
     * @public
     */
    initialize(): Promise<{
        resources: SharedResources;
        components: {
            scannerView?: DocumentScannerView;
            correctionView?: DocumentCorrectionView;
            scanResultView?: DocumentResultView;
        };
    }>;
    /**
     * Initialize Dynamsoft Capture Vision (DCV) engine resources.
     *
     * @remarks
     * This method sets up the core Dynamsoft SDK components:
     * - Configures engine resource paths (WASM files and dependencies) using {@link DocumentScannerConfig.engineResourcePaths} or {@link DEFAULT_DCV_ENGINE_RESOURCE_PATHS}
     * - Initializes the license manager with the provided license key from {@link DocumentScannerConfig.license}
     * - Pre-loads WASM resources to reduce latency
     * - Creates instances of {@link CameraView}, {@link CameraEnhancer}, and {@link CaptureVisionRouter}
     * - Stores references in {@link SharedResources}
     *
     * The method customizes the trial license URL to specify the product type and deployment context.
     * Called automatically by {@link initialize}.
     *
     * @throws {Error} If resource initialization fails due to network issues, invalid license, or SDK errors
     *
     * @internal
     */
    private initializeDCVResources;
    /**
     * Determine whether to create a default container for the {@link DocumentScanner} instance automatically.
     *
     * @returns `true` if no containers are specified in the configuration, `false` otherwise
     *
     * @remarks
     * Returns true when no main container and no individual view containers are specified.
     *
     * @internal
     */
    private shouldCreateDefaultContainer;
    /**
     * Create a default container element for the {@link DocumentScanner}.
     *
     * @returns The created container element
     *
     * @remarks
     * This method creates a full-screen overlay container with the following characteristics:
     * - Class name: `dds-main-container`
     * - Positioned absolutely at the top-left corner of the viewport
     * - Full width and dynamic viewport height using {@link DEFAULT_CONTAINER_HEIGHT}
     * - High z-index (999) to appear above other page content
     * - Initially hidden (display: none)
     *
     * The container is automatically appended to the document body and serves as the
     * parent for all view containers when no custom container is provided.
     * Called by {@link initializeDDSConfig} when {@link shouldCreateDefaultContainer} returns true.
     *
     * @internal
     */
    private createDefaultDDSContainer;
    /**
     * Check if the provided license is a temporary/trial license and return an appropriate license key.
     *
     * @param license - The license key to check
     * @returns The validated license key or a default trial license
     *
     * @remarks
     * This method detects temporary/trial licenses by checking if the license:
     * - Is empty or undefined
     * - Starts with specific prefixes: "A", "L", "P", or "Y"
     *
     * If a temporary license is detected, it returns a default trial license key.
     * Otherwise, it returns the original license unchanged.
     *
     * Called by {@link initializeDDSConfig} during configuration initialization to check key from {@link DocumentScannerConfig.license}
     *
     * @internal
     */
    private checkForTemporaryLicense;
    /**
     * Validate that required view containers are properly configured.
     *
     * @throws {Error} If a view is enabled but has no container and no default container will be created
     *
     * @remarks
     * Ensures enabled views have valid containers when no main container and no default container will be created.
     *
     * @internal
     */
    private validateViewConfigs;
    /**
     * Determine whether the {@link DocumentCorrectionView} should be displayed.
     *
     * @returns `true` if the correction view should be shown
     *
     * @remarks
     * The correction view is shown when:
     * - {@link DocumentScannerConfig.showCorrectionView} is explicitly set to true, OR
     * - {@link DocumentScannerConfig.showCorrectionView} is undefined **AND** a {@link DocumentCorrectionViewConfig.container} is configured
     *
     * The correction view is **NOT** shown when:
     * - {@link DocumentScannerConfig.showCorrectionView} is explicitly set to false
     * - No main {@link DocumentScannerConfig.container} **AND** no {@link DocumentCorrectionViewConfig.container} is provided
     *
     * Called by {@link initializeDDSConfig} to determine whether to create the correction view configuration.
     *
     * @internal
     */
    private showCorrectionView;
    /**
     * Determine whether the {@link DocumentResultView} should be displayed.
     *
     * @returns true if the result view should be shown
     *
     * @remarks
     * The result view is shown when:
     * - {@link DocumentScannerConfig.showResultView} is explicitly set to true, **OR**
     * - {@link DocumentScannerConfig.showResultView} is undefined **AND** a {@link DocumentResultViewConfig.container} is configured
     *
     * The result view is NOT shown when:
     * - {@link DocumentScannerConfig.showResultView} is explicitly set to false
     * - No main {@link DocumentScannerConfig.container} **AND** no {@link DocumentResultViewConfig.container} is provided
     *
     * Called by {@link initializeDDSConfig} to determine whether to create the result view configuration.
     *
     * @internal
     */
    private showResultView;
    /**
     * Initialize and normalize the {@link DocumentScanner} configuration.
     *
     * @remarks
     * This method performs comprehensive configuration initialization:
     * 1. Validates view container requirements via {@link validateViewConfigs}
     * 2. Creates a default container if needed via {@link shouldCreateDefaultContainer} and {@link createDefaultDDSContainer}
     * 3. Creates individual view containers within the main container via {@link createViewContainers}
     * 4. Sets up base configuration (license via {@link checkForTemporaryLicense}, template names from {@link DocumentScannerConfig.utilizedTemplateNames}, template file path)
     * 5. Configures each view ({@link DocumentScannerView}, {@link DocumentCorrectionView}, {@link DocumentResultView}) with merged settings
     *
     * The configuration is normalized to ensure all views have proper containers,
     * default values are applied (like {@link DEFAULT_DCE_UI_PATH} for {@link DocumentScannerView} camera UI), and internal flags are set correctly.
     *
     * Called by {@link initialize} before creating view instances.
     *
     * @internal
     */
    private initializeDDSConfig;
    /**
     * Create individual view containers within the main container.
     *
     * @param mainContainer - The main container element
     * @returns A record mapping {@link EnumDDSViews} view names to their container elements
     *
     * @remarks
     * This method creates container elements for each enabled view:
     * - {@link DocumentScannerView} (always created)
     * - {@link DocumentCorrectionView} (if {@link showCorrectionView} returns true)
     * - {@link DocumentResultView} (if {@link showResultView} returns true)
     *
     * Each view container:
     * - Has a class name in the format `dds-{viewName}-view-container`
     * - Is initially hidden (display: none)
     * - Takes full width and height of the parent
     * - Is positioned relatively
     * - Has user selection disabled
     *
     * The main container is cleared before creating the view containers.
     * Called by {@link initializeDDSConfig} when a main container is available.
     *
     * @internal
     */
    private createViewContainers;
    /**
     * Stop continuous scanning and exit the scanning loop.
     *
     * @remarks
     * When called with {@link DocumentScannerConfig.enableContinuousScanning} enabled and {@link launch} running, signal the scanner to stop looping and return from {@link launch} with the last scanned result.
     *
     * This provides an alternative to using the close button (X) for exiting continuous scanning mode,
     * allowing you to implement custom exit logic based on conditions such as:
     * - Maximum number of scanned documents reached
     * - Time limits
     * - User interaction with custom UI elements
     * - External events or triggers
     *
     * @example
     * Stop after scanning 5 documents:
     * ```javascript
     * let scannedCount = 0;
     * const scanner = new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE",
     *     enableContinuousScanning: true,
     *     onDocumentScanned: async (result) => {
     *         scannedCount++;
     *         console.log(`Scanned document ${scannedCount}`);
     *
     *         if (scannedCount >= 5) {
     *             scanner.stopContinuousScanning();
     *         }
     *     }
     * });
     *
     * await scanner.launch(); // Exits after 5 scans
     * ```
     *
     * @example
     * Stop from external button:
     * ```javascript
     * const scanner = new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE",
     *     enableContinuousScanning: true,
     *     onDocumentScanned: async (result) => {
     *         // Process each scanned document
     *         saveDocument(result);
     *     }
     * });
     *
     * // Bind to custom stop button
     * document.getElementById('stopBtn').addEventListener('click', () => {
     *     scanner.stopContinuousScanning();
     * });
     *
     * await scanner.launch(); // Will exit when stopBtn is clicked
     * ```
     *
     * @public
     */
    stopContinuousScanning(): void;
    /**
     * Clean up and release all resources used by the DocumentScanner.
     *
     * @remarks
     * **This method is called automatically at the end of {@link launch}, so manual invocation is typically only needed if you want to clean up resources before the scanning workflow completes.**
     *
     * This method performs comprehensive cleanup by:
     * - Disposing all view components (scanner, correction, result)
     * - Releasing Dynamsoft Capture Vision resources (camera, router)
     * - Clearing all container elements
     * - Resetting internal state
     *
     * After calling dispose, you can create a new DocumentScanner instance if you need to scan again.
     *
     * @example
     * Manual cleanup:
     * ```javascript
     * const documentScanner = new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE"
     * });
     *
     * await documentScanner.launch();
     *
     * // Clean up is automatic after launch completes
     * // But you can also call it manually if needed:
     * documentScanner.dispose();
     * console.log("Scanner resources released");
     * ```
     *
     * @public
     */
    dispose(): void;
    /**
     * Process a File object to extract image information as a blob.
     *
     * @param file - The File object to process (must be an image file)
     * @returns Promise resolving to blob with dimensions
     *
     * @throws {Error} If the file is not an image or if blob creation fails
     *
     * @remarks
     * Validates MIME type, loads image, draws to canvas, and converts to blob.
     *
     * @internal
     */
    private processFileToBlob;
    /**
     * Process an uploaded image file for document detection and normalization.
     *
     * @param file - The image file to process
     * @returns Promise resolving to a {@link DocumentResult}
     *
     * @remarks
     * Converts to blob, detects boundaries (or uses full image), performs normalization, and updates shared result.
     * Returns failed status on error.
     *
     * @internal
     */
    private processUploadedFile;
    /**
     * Perform a single scan operation through the complete workflow.
     *
     * @param file - Optional image file to process instead of using camera
     * @returns Promise resolving to the {@link DocumentResult}
     *
     * @remarks
     * This method orchestrates a complete single-scan workflow:
     * 1. Initializes all components via {@link initialize} if not already initialized
     * 2. Shows the main container ({@link DocumentScannerConfig.container})
     * 3. If a file is provided, processes it via {@link processUploadedFile} instead of using the camera
     * 4. Routes through the enabled views in sequence:
     *    - {@link DocumentScannerView}: Camera capture and document detection
     *    - {@link DocumentCorrectionView}: Manual boundary adjustment (if enabled by {@link showCorrectionView})
     *    - {@link DocumentResultView}: Result preview and actions (if enabled by {@link showResultView})
     * 5. Returns the final {@link DocumentResult}
     *
     * The method handles various combinations of enabled/disabled views and ensures
     * proper transitions between them (stopping capture, hiding containers, etc.).
     *
     * Called by {@link launch} for single-scan mode, or repeatedly in continuous scanning mode
     * when {@link DocumentScannerConfig.enableContinuousScanning} is true.
     *
     * @internal
     */
    private performSingleScan;
    /**
     * Start the document scanning workflow.
     *
     * @remarks
     * This is the primary method for initiating document scanning. It performs the following:
     * 1. Automatically calls {@link initialize} if not already initialized
     * 2. Opens the camera and displays the {@link DocumentScannerView} (unless a file is provided)
     * 3. Guides the user through the configured workflow (scan → correction → result)
     * 4. Returns the final {@link DocumentResult} when the workflow completes
     * 5. Automatically calls {@link dispose} to clean up resources
     *
     * **Scanning Modes:**
     * - **Single-scan mode (default)**: Captures one document and returns the result
     * - **Continuous scanning mode** ({@link DocumentScannerConfig.enableContinuousScanning}): Loops after each scan, invoking {@link DocumentScannerConfig.onDocumentScanned} with each result. The loop continues until the user clicks the close button (X) or {@link stopContinuousScanning} is called. Returns the last scanned result.
     *
     * **File Processing:**
     * Passing a {@link File} object allows processing an existing image file, bypassing camera input and the {@link DocumentScannerView}.
     *
     * @param file - Optional image file to process instead of using the camera
     *
     * @returns Promise resolving to the {@link DocumentResult}, which includes:
     * - `status`: Scan status (success, cancelled, or failed)
     * - `correctedImageResult`: Perspective-corrected document image
     * - `originalImageResult`: Original captured image
     * - `detectedQuadrilateral`: Detected document boundaries
     *
     * @throws {Error} If a capture session is already in progress
     *
     * @example
     * Basic single-scan usage:
     * ```javascript
     * const documentScanner = new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE"
     * });
     *
     * const result = await documentScanner.launch();
     *
     * if (result?.correctedImageResult) {
     *     resultContainer.innerHTML = "";
     *     const canvas = result.correctedImageResult.toCanvas();
     *     resultContainer.appendChild(canvas);
     * } else {
     *     resultContainer.innerHTML = "<p>No image scanned. Please try again.</p>";
     * }
     * ```
     *
     * @example
     * Process an existing image file:
     * ```javascript
     * const documentScanner = new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE"
     * });
     *
     * const fileInput = document.querySelector('input[type="file"]');
     * const file = fileInput.files[0];
     * const result = await documentScanner.launch(file);
     * ```
     *
     * @example
     * Continuous scanning mode:
     * ```javascript
     * const scannedDocs = [];
     * const documentScanner = new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE",
     *     enableContinuousScanning: true,
     *     onDocumentScanned: async (result) => {
     *         scannedDocs.push(result);
     *         console.log(`Scanned ${scannedDocs.length} documents`);
     *     }
     * });
     *
     * // This will return the last scanned result when user exits
     * const lastResult = await documentScanner.launch();
     * ```
     *
     * @public
     */
    launch(file?: File): Promise<DocumentResult>;
}

declare const DDS: {
    DocumentScanner: typeof DocumentScanner;
    DocumentNormalizerView: typeof DocumentCorrectionView;
    DocumentScannerView: typeof DocumentScannerView;
    DocumentResultView: typeof DocumentResultView;
    EnumResultStatus: typeof EnumResultStatus;
    EnumFlowType: typeof EnumFlowType;
    EnumDDSViews: typeof EnumDDSViews;
};

export { CameraEnhancer, CameraEnhancerModule, CameraManager, CameraView, CaptureVisionRouter, CaptureVisionRouterModule, CapturedResultReceiver, CoreModule, DDS, DocumentNormalizerModule, DocumentCorrectionView as DocumentNormalizerView, DocumentResultView, DocumentScanner, DocumentScannerView, EnumBufferOverflowProtectionMode, EnumCapturedResultItemType, EnumErrorCode, EnumImagePixelFormat, EnumResultStatus, ImageDrawer, ImageIO, ImageProcessor, IntermediateResultReceiver, LicenseManager, LicenseModule, MultiFrameResultCrossFilter, UtilityModule, handleEngineResourcePaths, innerVersions, isDSImageData, isDSRect, isPoint, isQuad };
export type { CapturedResult, DSFile, DSImageData, DSRect, DeskewedImageResultItem, DetectedQuadResultItem, DocumentCorrectionViewConfig, DocumentCorrectionViewToolbarButtonsConfig, DocumentResult, DocumentResultViewConfig, DocumentResultViewToolbarButtonsConfig, DocumentScannerConfig, DocumentScannerViewConfig, EngineResourcePaths, OriginalImageResultItem, Point, Quadrilateral, ResultStatus, SharedResources, ToolbarButtonConfig, UtilizedTemplateNames };
