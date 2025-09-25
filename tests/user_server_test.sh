#!/bin/bash

set -e

echo "--- Health Check Begin ---"

echo "Waiting for server to start..."
sleep 10 # The user-server with Django might take a bit longer to start

echo "Send Request to http://localhost:8000/"
RESPONSE=$(curl -s http://localhost:8000/)
EXPECTED_RESPONSE='{"status":"ok"}'

echo "Received response: $RESPONSE"

if [ "$RESPONSE" == "$EXPECTED_RESPONSE" ]; then
	echo "Health Check PASSED"
	exit 0
else
	echo "Health Check FAILED"
	exit 1
fi