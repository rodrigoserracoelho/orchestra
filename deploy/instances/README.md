# Deployment instances

One file per orchestra. `./deploy-new.sh <name>` sources `<name>.env` **as shell**,
so any value containing a space or an apostrophe must be double-quoted:
`ORG_NAME="L'Orchestre du Coin"`.

Only `example.env` is committed. The real `<name>.env` files are gitignored —
this repo is public and they name the server you deploy to. Start from the
template: `cp example.env <name>.env`.

Secrets are deliberately absent: the remote script reads `DB_USER`, `DB_PASSWORD`
and `DB_NAME` from `.env` in `REMOTE_PATH`, which never leaves the server.

Adding an instance:

1. `branding/<name>/` with `logo.<ext>`, `logo-dark.<ext>` and `favicon.ico`
2. `deploy/instances/<name>.env` — unique `STACK`, `REMOTE_PATH` and `DOMAIN`
3. `.env` on the server in `REMOTE_PATH` (own `JWT_SECRET`, DB credentials,
   `FRONTEND_URL`, and `STACK=<name>` so compose names the containers)
4. `deploy/proxy/conf.d/<domain>.conf` (from `site.example.conf`) + a
   certificate, then reload edge-nginx
5. `./deploy-new.sh <name>`
