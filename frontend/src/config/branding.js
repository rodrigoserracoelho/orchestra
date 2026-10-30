// Per-instance branding, baked in at build time (one image per orchestra).
// The deploy script passes these as Docker build args; see deploy/instances/.
//
//   VITE_ORG_NAME        short name, used in the header and login page
//   VITE_ORG_LEGAL_NAME  full/legal name, used in the public footer and home
//
// The logo and favicon are not variables: branding/<instance>/ is copied over
// frontend/public at build time, so logo.svg/logo-dark.svg resolve per instance.
export const ORG_NAME = import.meta.env.VITE_ORG_NAME || 'Orchestra';
export const ORG_LEGAL_NAME = import.meta.env.VITE_ORG_LEGAL_NAME || ORG_NAME;

// Logo shape and ink, because these differ per orchestra:
//
//   VITE_LOGO_WORDMARK  the logo already spells the name, so the text beside
//                       it is suppressed and the image is allowed to be wide.
//                       Default: a compact mark + text.
//
// Light/dark artwork is not a flag: each brand ships logo.<ext> and
// logo-dark.<ext>, and Brand.jsx shows the right one per theme.
//
//   VITE_LOGO_EXT  'svg' (default) or 'png' — brands supply what they have.
const flag = (v) => v === 'true' || v === true;
export const LOGO_WORDMARK = flag(import.meta.env.VITE_LOGO_WORDMARK);
export const LOGO_EXT = import.meta.env.VITE_LOGO_EXT || 'svg';
export const LOGO_LIGHT = `logo.${LOGO_EXT}`;
export const LOGO_DARK = `logo-dark.${LOGO_EXT}`;
