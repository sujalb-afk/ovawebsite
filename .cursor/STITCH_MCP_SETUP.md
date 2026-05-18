# Stitch MCP Server – Setup Instructions

The Stitch MCP server is configured in [`.cursor/mcp.json`](mcp.json). Complete these steps so Cursor can use it for UI generation.

## 1. Set your Google Cloud project ID

**You must use a real Google Cloud project ID.** The error `Project ID not found. Set GOOGLE_CLOUD_PROJECT env var` means this is still the placeholder.

- **Get your project ID:** Open [Google Cloud Console](https://console.cloud.google.com/) → select or create a project → the **Project ID** is in the dashboard (e.g. `my-app-12345`). It is not the project name.
- **Edit** `.cursor/mcp.json` and replace `YOUR_PROJECT_ID` with that value in `env.GOOGLE_CLOUD_PROJECT`.

To test from PowerShell before using Cursor:
```powershell
$env:GOOGLE_CLOUD_PROJECT = "your-actual-project-id"
npx -y stitch-mcp
```
Replace `your-actual-project-id` with your real project ID.

## 2. Google Cloud setup

Use a project that has (or will have) the Stitch API enabled. In a terminal:

```bash
# Sign in to Google Cloud
gcloud auth login

# Set the project (use your real project ID)
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default set-quota-project YOUR_PROJECT_ID

# Enable the Stitch API
gcloud beta services mcp enable stitch.googleapis.com
```

## 3. Application default credentials

So that `stitch-mcp` can call Google on your behalf:

```bash
gcloud auth application-default login
```

## 4. Restart Cursor

Restart Cursor so it loads the Stitch MCP server. In **Settings → Tools & MCP** (or **MCP**), confirm that the **stitch** server is listed and has no error.

## Tools available after setup

Once connected, the AI can use Stitch tools such as:

- **generate_screen_from_text** – Generate a new screen from a text prompt
- **fetch_screen_code** – Get HTML/frontend code for a screen
- **fetch_screen_image** – Get a high-res screenshot
- **extract_design_context** – Extract design context (fonts, colors, layout) from a screen
- **list_projects** / **list_screens** – List projects and screens
- **create_project** – Create a new Stitch project

## Troubleshooting

**"Project ID not found. Set GOOGLE_CLOUD_PROJECT env var"**  
You still have the placeholder or no project set. Do step 1 above: get your project ID from [Google Cloud Console](https://console.cloud.google.com/) and set it in `.cursor/mcp.json` (and restart Cursor). When testing from a terminal, set the env var first (e.g. PowerShell: `$env:GOOGLE_CLOUD_PROJECT = "your-project-id"`).

## References

- [stitch-mcp on npm](https://www.npmjs.com/package/stitch-mcp)
- [stitch-mcp GitHub](https://github.com/Kargatharaakash/stitch-mcp)
