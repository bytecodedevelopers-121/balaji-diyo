/** Small shared types with no natural home in a single feature. */

/** A value that is either present or explicitly not (avoids `T | null | undefined` sprawl). */
export type Maybe<T> = T | null;

/** Standard shape for a locally-known, resolvable image (as opposed to a raw external URL). */
export interface LocalImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}
