# Atlassian Rovo MCP Server Setup Guide

This guide walks you through setting up the Atlassian Rovo MCP Server in your IDE (Cursor, VS Code, or other MCP-compatible editors) to enable AI-powered interactions with your Atlassian Cloud products (Jira, Confluence, etc.).

## What is Atlassian Rovo MCP Server?

The Atlassian Rovo MCP Server allows you to interact with your Atlassian Cloud workspace directly from your IDE through the Model Context Protocol (MCP). You can search, create, and manage Jira issues and Confluence pages without leaving your development environment.

## Prerequisites

Before you begin, ensure you have:

- **Node.js v18 or later** installed
- **npx** available (comes with Node.js)
- An **Atlassian Cloud site** with Jira and/or Confluence
- A supported IDE (Cursor, VS Code, or other MCP-compatible editor)
- A modern browser to complete the OAuth authentication flow

## Setup for Cursor IDE

### Configuration

1. **Open Cursor Settings**
   - Go to `Cursor Settings` > `Features` > `Model Context Protocol`
   - Or use Command Palette (Cmd/Ctrl + Shift + P) and search for "MCP Settings"

2. **Add Atlassian Rovo MCP Server Configuration**
   
   Add the following configuration to your MCP settings:

   **For newer versions of Cursor:**
   ```json
   {
     "mcpServers": {
       "Atlassian-MCP-Server": {
         "url": "https://mcp.atlassian.com/v1/sse"
       }
     }
   }
   ```

   **For older versions of Cursor:**
   ```json
   {
     "mcpServers": {
       "mcp-atlassian-api": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "https://mcp.atlassian.com/v1/sse"
         ]
       }
     }
   }
   ```

3. **Save and Restart**
   - Save the configuration
   - Restart Cursor's AI assistant or reload the window

## Setup for VS Code

### Option 1: Using the MCP Extension UI

1. Visit [VS Code MCP marketplace](https://code.visualstudio.com/mcp)
2. Search for and install the **Atlassian Rovo MCP provider**

### Option 2: Using Command Palette

1. Open the Command Palette (Cmd/Ctrl + Shift + P)
2. Run: `MCP: Add Server`
3. Select **Http** or **Server-sent Events** as the connection type
4. Enter server URL: `https://mcp.atlassian.com/v1/sse`
5. Provide a name: `atlassian-mcp-server`

### Option 3: Manual Configuration

Create or edit an `mcp.json` file in your workspace or home directory:

```json
{
  "servers": {
    "atlassian-mcp-server": {
      "url": "https://mcp.atlassian.com/v1/sse",
      "type": "http"
    }
  },
  "inputs": []
}
```

## Setup for Other IDEs

For custom or legacy MCP-compatible IDEs:

1. **Open your terminal and run:**
   ```bash
   npx -y mcp-remote https://mcp.atlassian.com/v1/sse
   ```

   **Note:** If you encounter version issues, specify an older version:
   ```bash
   npx -y mcp-remote@0.1.13 https://mcp.atlassian.com/v1/sse
   ```

2. **Configure your IDE's MCP settings:**
   ```json
   {
     "mcp.servers": {
       "atlassian": {
         "command": "npx",
         "args": ["-y", "mcp-remote", "https://mcp.atlassian.com/v1/sse"]
       }
     }
   }
   ```

3. Keep the terminal session running while using the IDE

## Authentication

The authentication process uses OAuth and is handled automatically when you first use the MCP server:

1. **Initial Connection**: When you first try to use an Atlassian MCP tool, you'll be prompted to authenticate
2. **Browser Authentication**: A browser window will open directing you to Atlassian's OAuth page
3. **Grant Permissions**: 
   - Log in to your Atlassian account
   - Review the permissions requested by the MCP server
   - Click "Accept" or "Allow" to grant access
4. **Token Storage**: The authentication token will be stored locally
5. **Token Expiration**: If your token expires, you'll be prompted to re-authenticate

### Troubleshooting Authentication

- **Terminal must stay open**: If using `mcp-remote`, keep the terminal session running
- **Token expired**: Re-run the `mcp-remote` command or restart your IDE's MCP connection
- **Permission issues**: Ensure your Atlassian account has appropriate permissions for the sites you're trying to access

## Available Features

Once connected, you can interact with Atlassian products using natural language:

### Jira Operations

- **Search issues**: "Find all issues assigned to me in the last 7 days"
- **Get issue details**: "Show me the details of issue PROJ-123"
- **Create issues**: "Create a bug with title 'Login page not loading'"
- **Update issues**: "Update PROJ-456 status to In Progress"
- **Transition issues**: "Move issue PROJ-789 to Done"
- **Add comments**: "Add a comment to PROJ-123 about the fix"

### Confluence Operations

- **Search pages**: "Find all pages about API documentation"
- **Get page content**: "Show me the content of the Engineering Roadmap page"
- **Create pages**: "Create a page titled 'Q4 Engineering Roadmap' in the Engineering space"
- **Update pages**: "Update the Sprint 45 page with new goals"
- **Manage comments**: "Get comments on the Architecture page"
- **Link pages**: "Link the two most recent bugs to the 'Sprint 45' page"

### Rovo Search

- **Cross-product search**: "Search for information about authentication across all Atlassian products"
- **Fetch by ARI**: Get specific resources using Atlassian Resource Identifiers

## Tips for Success

1. **Keep sessions active**: Maintain terminal sessions when using `mcp-remote`
2. **Token management**: Re-authenticate if tokens expire
3. **Enable MCP tooling**: Ensure your IDE's MCP support is installed and enabled
4. **Check permissions**: Verify your Atlassian account has necessary permissions
5. **Stay updated**: IDEs update frequently; check official documentation for latest features

## Common Issues and Solutions

### Issue: "MCP server not responding"
- **Solution**: Restart your IDE and ensure the terminal (if using `mcp-remote`) is still running

### Issue: "Authentication failed"
- **Solution**: Clear cached tokens and re-authenticate through the OAuth flow

### Issue: "Permission denied"
- **Solution**: Check your Atlassian account permissions and ensure you have access to the requested resources

### Issue: "Command not found: npx"
- **Solution**: Install or update Node.js to version 18 or later

## Additional Resources

- [Official Atlassian Rovo MCP Server Documentation](https://support.atlassian.com/atlassian-rovo-mcp-server/)
- [Atlassian Rovo MCP Server - Getting Started](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-rovo-mcp-server/)
- [VS Code MCP Documentation](https://code.visualstudio.com/mcp)
- [Cursor MCP Documentation](https://www.cursor.com/mcp)
- [Atlassian Community Support](https://community.atlassian.com/)

## Security and Privacy

- Authentication uses OAuth 2.0 for secure access
- Tokens are stored locally on your machine
- The MCP server communicates over HTTPS
- Review requested permissions carefully during OAuth flow
- Tokens can be revoked from your Atlassian account settings

## Support

Need help? 
- Visit [Atlassian Support](https://support.atlassian.com/)
- Ask questions in the [Atlassian Community](https://community.atlassian.com/)
- Check the [troubleshooting guide](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/troubleshooting-and-verifying-your-setup/)

