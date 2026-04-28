#!/bin/sh
set -e

echo "▶  Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "▶  Starting TMIS API server..."
exec node dist/server.js
