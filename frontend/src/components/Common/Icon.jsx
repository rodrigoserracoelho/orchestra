// One geometric family on a 24px grid at 1.75 stroke, drawn with currentColor
// so a tile recolours with its container. Replaces the emoji, which rendered as
// multi-colour clip-art at inconsistent weights.
const PATHS = {
  seasons: (
    <>
      <path d="M9.5 18V6.2l10-2.2V16" />
      <circle cx="6.8" cy="18" r="2.7" />
      <circle cx="16.8" cy="16" r="2.7" />
    </>
  ),
  locations: (
    <>
      <path d="M12 21.2s7-5.6 7-11.2a7 7 0 1 0-14 0c0 5.6 7 11.2 7 11.2Z" />
      <circle cx="12" cy="9.8" r="2.6" />
    </>
  ),
  manage: (
    <>
      <path d="M14.5 20v-1.6a4 4 0 0 0-4-4h-5a4 4 0 0 0-4 4V20" />
      <circle cx="8" cy="7" r="3.4" />
      <path d="M19 7.5v6M22 10.5h-6" />
    </>
  ),
  musicians: (
    <>
      <path d="M15.5 20v-1.6a4 4 0 0 0-4-4h-5a4 4 0 0 0-4 4V20" />
      <circle cx="9" cy="7" r="3.4" />
      <path d="M21.5 20v-1.6a4 4 0 0 0-3-3.86" />
      <path d="M16.2 3.7a4 4 0 0 1 0 7.05" />
    </>
  ),
  messages: (
    <>
      <path d="M21.4 3.6 2.6 10.3l7.2 2.6 2.6 7.2 9-16.5Z" />
      <path d="M9.8 12.9 21.4 3.6" />
    </>
  ),
  news: (
    <>
      <path d="M4 5h13a1 1 0 0 1 1 1v12a2 2 0 0 0 2 2H5.5A2.5 2.5 0 0 1 3 17.5V6a1 1 0 0 1 1-1Z" />
      <path d="M18 8.5h1.5A1.5 1.5 0 0 1 21 10v8a2 2 0 0 1-2 2" />
      <path d="M7 9h7M7 12.5h7M7 16h4.5" />
    </>
  ),
  pages: (
    <>
      <path d="M14 3.2H7.5a2 2 0 0 0-2 2v13.6a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.2l-4.5-5Z" />
      <path d="M14 3.2v5h4.5" />
      <path d="M9 13h6M9 16.5h4" />
    </>
  ),
  polls: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="M8.8 15.4l2.2 2.2 4.2-4.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  inbox: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M3.2 7.4l8 5.3a2 2 0 0 0 2.2 0l7.9-5.3" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3.1" />
      <path d="M6.2 18.6a7 7 0 0 1 11.6 0" />
    </>
  ),
};

export default function Icon({ name, size = 22, className = '' }) {
  const paths = PATHS[name];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
