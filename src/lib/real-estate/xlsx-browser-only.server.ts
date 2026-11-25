/** SSR boundary for the existing browser-only spreadsheet file-input parser.
 * The actual read-excel-file/browser module remains in the client build.
 */
export function readSheet(): never {
  throw new Error("Property spreadsheet intake must run in the browser.");
}
