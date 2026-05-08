#!/bin/bash

# Test script for Claude Code Routine API trigger
# Usage: ./test-routine-api.sh

# Configuration
ROUTINE_API_ENDPOINT="${ROUTINE_API_ENDPOINT:?Please set ROUTINE_API_ENDPOINT}"
ROUTINE_BEARER_TOKEN="${ROUTINE_BEARER_TOKEN:?Please set ROUTINE_BEARER_TOKEN}"
PAYLOAD_FILE="${1:-example-test-payload.json}"

# Check if payload file exists
if [ ! -f "$PAYLOAD_FILE" ]; then
  echo "Error: Payload file not found: $PAYLOAD_FILE"
  echo "Usage: $0 [payload-file.json]"
  echo "Default payload file: example-test-payload.json"
  exit 1
fi

echo "Testing Claude Code Routine API Trigger"
echo "========================================"
echo "Endpoint: $ROUTINE_API_ENDPOINT"
echo "Payload file: $PAYLOAD_FILE"
echo ""

# Make the API call
echo "Sending request..."
curl -X POST "$ROUTINE_API_ENDPOINT" \
  -H "Authorization: Bearer $ROUTINE_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d @"$PAYLOAD_FILE" \
  -v

echo ""
echo ""
echo "Request sent. Check Claude Code Routine logs for processing status."
echo "Google Tasks should be updated within 2-5 minutes."
