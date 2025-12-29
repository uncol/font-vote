#!/usr/bin/env bash
# Export data from Cloudflare D1 database

set -e

echo "Exporting data from Cloudflare D1..."

# Export collection1 table
echo "Exporting collection1..."
pnpm dlx wrangler d1 execute font-vote --remote --command "SELECT * FROM collection1" --json > export/collection1.json

# Export journal table
echo "Exporting journal..."
pnpm dlx wrangler d1 execute font-vote --remote --command "SELECT * FROM journal" --json > export/journal.json

echo "✓ Export completed!"
echo "Files saved to:"
echo "  - export/collection1.json"
echo "  - export/journal.json"
echo ""
echo "Run 'pnpm run import' to import into local database"
