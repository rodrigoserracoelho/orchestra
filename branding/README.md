# Per-instance branding

One directory per deployment. Its contents are copied over `frontend/public/`
at image build time (`--build-arg BRANDING=<dir>`), so whatever is here wins.

    branding/<name>/logo.<ext>       light backgrounds — dark ink
    branding/<name>/logo-dark.<ext>  dark backgrounds  — light ink
    branding/<name>/favicon.ico

`<ext>` is `svg` by default; set `LOGO_EXT=png` in the instance config for a
brand that only has raster artwork. Both logo files must use the same
extension.

**Both logo files are required.** `Brand.jsx` renders each and shows the one
matching the theme. Two assets rather than a CSS filter: inverting a white logo
also inverts its accent colour — a gold note head turns blue — so each
theme gets the artwork the designer intended. A brand with a single theme-neutral
mark can point both names at the same file.

Names are build args, not files — see `deploy/instances/*.env`: `ORG_NAME`
(short, header/login), `ORG_LEGAL_NAME` (full, footer/public home), and
`LOGO_WORDMARK=true` when the logo already spells the name, which suppresses the
text beside it.

To add an orchestra: copy a directory here, drop in its artwork, and create the
matching `deploy/instances/<name>.env`.
