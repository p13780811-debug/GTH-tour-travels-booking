/**
 * Server-compilation boundary for the browser-only PDF listing intake parser.
 * The real pdfjs-dist package remains in the browser build; no PDF processing
 * is performed by this module. If a future server caller tries to parse a PDF,
 * fail explicitly rather than silently returning an empty or invented result.
 */
export const GlobalWorkerOptions: {workerSrc: string} = {workerSrc: ""};

export function getDocument(): never {
  throw new Error("Property PDF intake must run in the browser.");
}
