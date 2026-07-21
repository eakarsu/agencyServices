#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "${NODE_ENV:-development}" = test ] && [ -n "${RUNTIME_PROJECT_SOURCE:-}" ] && [ -d "$RUNTIME_PROJECT_SOURCE" ]; then ROOT_DIR="$RUNTIME_PROJECT_SOURCE";fi
ENV_FILE="$ROOT_DIR/.env"; MIGRATION_DIR="$ROOT_DIR/prisma/migrations"
read_env(){ awk -F= -v key="$1" '$0 !~ /^[[:space:]]*#/ && $1==key {value=substr($0,index($0,"=")+1);gsub(/^[[:space:]]+|[[:space:]]+$/,"",value);gsub(/^["\047]|["\047]$/,"",value);print value;exit}' "$ENV_FILE"; }
load_key(){ local key="$1" parsed;[ -n "${!key-}" ]&&return 0;[ -f "$ENV_FILE" ]||return 0;parsed="$(read_env "$key")";[ -z "$parsed" ]||export "$key=$parsed"; }
for key in DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL ALLOW_SCHEMA_MIGRATION BACKEND_PORT;do load_key "$key";done
fail(){ printf 'error: %s\n' "$*" >&2;exit 1; }
check(){ local secret="${NEXTAUTH_SECRET:-}";[ -n "${DATABASE_URL:-}" ]||fail "DATABASE_URL is required";[ "${#secret}" -ge 32 ]||fail "NEXTAUTH_SECRET must contain at least 32 characters";[[ "${BACKEND_PORT:-}" =~ ^[0-9]+$ ]]||fail "BACKEND_PORT must be an explicit integer";[ "$BACKEND_PORT" -ge 1024 ]&&[ "$BACKEND_PORT" -le 65535 ]||fail "BACKEND_PORT must be between 1024 and 65535";if [ "${NODE_ENV:-development}" = test ];then NEXTAUTH_URL="http://127.0.0.1:$BACKEND_PORT";export NEXTAUTH_URL;fi;[ -n "${NEXTAUTH_URL:-}" ]||fail "NEXTAUTH_URL is required";command -v node >/dev/null||fail "node is required";command -v npm >/dev/null||fail "npm is required";printf 'configuration valid\n'; }
migrate(){ check;[ "${ALLOW_SCHEMA_MIGRATION:-0}" = 1 ]||fail "set ALLOW_SCHEMA_MIGRATION=1";command -v psql >/dev/null||fail "psql is required";for file in "$MIGRATION_DIR"/*/migration.sql;do [ -f "$file" ]&&psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file";done; }
start(){ check;[ -d "$ROOT_DIR/node_modules" ]||fail "dependencies are missing; install explicitly";lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1&&fail "assigned port $BACKEND_PORT is occupied";cd "$ROOT_DIR";exec npm run dev -- -H 127.0.0.1 -p "$BACKEND_PORT"; }
case "${1:-check}" in check)check;;migrate)migrate;;start)start;;*)fail "usage: $0 {check|migrate|start}";;esac
