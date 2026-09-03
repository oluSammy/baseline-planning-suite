#!/bin/sh
set -eu

: "${PEOPLE_REMOTE_URL:?PEOPLE_REMOTE_URL is required}"
: "${DELIVERY_REMOTE_URL:?DELIVERY_REMOTE_URL is required}"

cat > /usr/share/nginx/html/config.json <<EOF
{
"remotes": {
    "people": "${PEOPLE_REMOTE_URL}",
    "delivery": "${DELIVERY_REMOTE_URL}"
}
}
EOF

echo "shell: config.json written (people=${PEOPLE_REMOTE_URL}, delivery=${DELIVERY_REMOTE_URL})"