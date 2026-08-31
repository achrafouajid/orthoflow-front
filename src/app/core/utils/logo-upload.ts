/**
 * The cabinet-logo upload previously had no type check, no size check, and
 * no dimension check before reading the file into a base64 data URL and
 * writing it straight to localStorage (audit V.10) — the same origin quota
 * the clinical dental chart's offline write-ahead buffer depends on (audit
 * III.3), so an oversized logo could make the clinical record unsaveable.
 * Used identically by onboarding and settings, since both have their own
 * copy of this upload flow.
 */

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];
const MAX_SIZE_BYTES = 500 * 1024; // 500KB — a logo has no business being larger than this
const MAX_DIMENSION_PX = 2000;

export interface LogoValidationError {
  message: string;
}

/**
 * Validates type/size/dimensions and resolves to a data URL on success.
 * Rejects with a human-readable message on failure — never throws, so
 * callers can show it directly in a toast.
 */
export function readAndValidateLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject({ message: 'Logo must be a PNG, JPG, or SVG image.' } satisfies LogoValidationError);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      reject({ message: `Logo must be under ${MAX_SIZE_BYTES / 1024}KB (this file is ${Math.round(file.size / 1024)}KB).` } satisfies LogoValidationError);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject({ message: 'Could not read the selected file.' } satisfies LogoValidationError);
    reader.onload = () => {
      const dataUrl = reader.result as string;

      // SVGs have no fixed pixel dimensions to check via Image() the same
      // way — a 500KB cap already bounds them adequately, skip the
      // dimension check rather than failing every valid SVG.
      if (file.type === 'image/svg+xml') {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        if (img.width > MAX_DIMENSION_PX || img.height > MAX_DIMENSION_PX) {
          reject({ message: `Logo dimensions must be under ${MAX_DIMENSION_PX}×${MAX_DIMENSION_PX}px.` } satisfies LogoValidationError);
          return;
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject({ message: 'Could not read the selected file as an image.' } satisfies LogoValidationError);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
