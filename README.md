# MCP E-commerce Demo

A headless e-commerce automation MCP (Model Context Protocol) server that provides tools for interacting with Tokopedia. This server runs in Docker and uses Camoufox for browser automation.

## Features

- **Authentication**: Login to Tokopedia with email/password and handle 2FA verification
- **Product Search**: Search for products on Tokopedia
- **Transaction History**: Retrieve user's transaction history
- **Headless Operation**: Runs completely headless in Docker container
- **Session Management**: Maintains browser sessions for authenticated operations

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Claude Desktop

### 1. Build and Run the Container

```bash
# Clone the repository
git clone git@github.com:rvlewerissa/mcp-ecommerce-demo.git
cd mcp-ecommerce-demo

# Build and start the container in background
docker-compose up --build -d

# Verify container is running
docker-compose ps
```

### 2. Configure Claude Desktop

Add the following configuration to your `claude_desktop_config.json`:

**Location:**

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**

```json
{
  "mcpServers": {
    "ecommerce-demo": {
      "command": "docker",
      "args": ["exec", "-i", "mcp-ecommerce-demo", "node", "src/server.js"]
    }
  }
}
```

### 3. Restart Claude Desktop

Restart Claude Desktop to load the new MCP server configuration.

## Usage

Once configured, you can use the following tools in Claude:

### Search Products

```
Search for "laptop gaming" on Tokopedia
```

### Transaction History

```
Show my transaction history from Tokopedia
```

## Authentication & Session Management

The server uses persistent browser sessions to maintain authentication state:

```
Authentication Flow:

1. auth(email, password) → Creates browser session
2. [If 2FA] provide_verification_code() → Completes login
3. Session stored with unique ID
4. Future tools reuse existing session

Session Management:
┌─────────────┐
│ Claude User │ ──── auth() ────► Session A (authenticated)
└─────────────┘                        │
                                       ├─── search_history()
                                       └─── other_tools()
```

**Session Lifecycle:**

1. **Login Process**: Creates new browser session with unique ID
2. **2FA Handling**: Session pauses, waits for verification code
3. **Session Storage**: Authenticated sessions stored in `activeSessions` Map
4. **Session Reuse**: Subsequent tools use existing session by ID
5. **Auto Cleanup**: Sessions cleaned up on completion or error

Each session includes: browser instance, page context, user credentials, and authentication state.

## Available Tools

- **`auth`**: Authenticate with Tokopedia credentials
- **`provide_verification_code`**: Handle 2FA verification code
- **`search_product`**: Search for products (no authentication required)
- **`search_transaction_history`**: Retrieve transaction history (requires authentication)

## Example: Product Search

**Schema:**

```json
{
  "name": "search_product",
  "description": "Search for products in Tokopedia by name or description",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query to match against product name or description"
      },
      "discount": {
        "type": "boolean",
        "description": "Filter to show only discounted products"
      },
      "condition": {
        "type": "number",
        "description": "Filter by item condition: 1 for new items, 2 for used items",
        "enum": [1, 2]
      },
      "order_by": {
        "type": "string",
        "description": "Order search results by criteria",
        "enum": [
          "relevant",
          "rating",
          "newest",
          "highest_price",
          "lowest_price"
        ]
      },
      "min_price": {
        "type": "number",
        "description": "Minimum price filter"
      },
      "max_price": {
        "type": "number",
        "description": "Maximum price filter"
      }
    },
    "required": ["query"]
  }
}
```

**Call Payload:**

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "search_product",
    "arguments": {
      "query": "laptop gaming RTX 4060",
      "condition": 1,
      "order_by": "lowest_price",
      "max_price": 20000000
    }
  },
  "id": 1
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 20 products for 'laptop gaming RTX 4060':\n\n1. ASUS ROG Strix G15 RTX 4060\n   Price: Rp 15,999,000\n   Rating: 4.8/5 (150 reviews)\n   Store: ASUS Official Store\n\n2. Acer Predator Helios Neo RTX 4060\n   Price: Rp 14,500,000\n   Rating: 4.7/5 (89 reviews)\n   Store: Acer Official Store\n\n..."
      }
    ]
  },
  "id": 1
}
```

## Credits

- Camoufox integration to Node.js powered by [node-camoufox](https://github.com/DemonMartin/node-camoufox)
