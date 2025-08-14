#!/bin/bash

# Start the MCP server based on environment variable
if [ "$MCP_MODE" = "daemon" ]; then
    echo "Starting MCP server in daemon mode..."
    # Keep container alive for external connections
    node src/server.js &
    tail -f /dev/null
else
    echo "Starting MCP server in stdio mode..."
    # Normal stdio mode
    node src/server.js
fi