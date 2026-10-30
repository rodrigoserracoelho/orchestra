import { ORG_NAME, LOGO_WORDMARK, LOGO_LIGHT, LOGO_DARK } from '../../config/branding';

// The logo lock-up.
//
// Two assets per brand rather than a CSS filter: inverting a white logo also
// inverts any accent colour (a gold note head turns blue), so each
// theme gets the artwork its designer intended.
//
//   branding/<name>/logo.<ext>       for light backgrounds (dark ink)
//   branding/<name>/logo-dark.<ext>  for dark backgrounds  (light ink)
//
// A wordmark already contains the name, so the text beside it is dropped and
// the image is given room to be wide.
export default function Brand({ variant = 'bar' }) {
  const hero = variant === 'hero';
  const size = LOGO_WORDMARK
    ? (hero ? 'h-12 max-w-[260px]' : 'h-8 max-w-[170px]')
    : (hero ? 'h-20' : 'h-10');
  const common = `${size} w-auto object-contain ${hero ? 'mx-auto' : ''}`;
  const base = import.meta.env.BASE_URL;

  return (
    <>
      <img src={`${base}${LOGO_LIGHT}`} alt={ORG_NAME} className={`${common} dark:hidden`} />
      <img src={`${base}${LOGO_DARK}`} alt={ORG_NAME} className={`${common} hidden dark:block`} />
      {!LOGO_WORDMARK && (hero ? (
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-3">{ORG_NAME}</h1>
      ) : (
        <span className="font-bold text-lg text-gray-800 dark:text-gray-100 hidden sm:inline">{ORG_NAME}</span>
      ))}
    </>
  );
}
