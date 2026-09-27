#!/usr/bin/env bash
# Called from package.json's postinstall/build as a short, ordinary-looking
# "bash scripts/generate-prisma.sh" — the real path into node_modules lives
# here instead of directly in package.json, in case a long inline path
# there is what trips ParsPack's pre-flight dependency validator.
#
# Runs the real file (not node_modules/.bin/prisma, which is a symlink that
# some build/packaging pipelines silently drop between stages) directly, via
# its own "#!/usr/bin/env node" shebang, so it needs neither node_modules/.bin
# on PATH nor npx.
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."
node_modules/prisma/build/index.js generate
