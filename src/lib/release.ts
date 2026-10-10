/**
 * Server-side release gates.
 * Public indexing stays disabled unless production explicitly opts in.
 */
export const publicIndexingEnabled = process.env.GTH_PUBLIC_INDEXING === "true"
