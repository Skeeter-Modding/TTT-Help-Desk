# TTT Help Desk
Professional Discord ticket bot for the TTT gaming community with a clean, easy-to-use dashboard.

## Features
- Panel channel with a dropdown for ticket types.
- Automatically opens a private staff discussion channel per ticket.
- Routes tickets to the correct staff role based on selection.
- Clean, dark dashboard UI with a red/black community theme.
- `/ticket` slash command that creates a ticket channel for the player.
- Automatically opens a private staff discussion channel per ticket.
- Clean, dark dashboard UI inspired by modern ticketing tools.
- Simple configuration via `.env`.

## Setup
1. Copy `.env.example` to `.env` and fill in your Discord IDs and bot token.
   - `PANEL_CHANNEL_ID` is the channel where the ticket dropdown is posted.
   - `TICKET_ROUTING` is a JSON array that maps dropdown choices to staff roles.
   - Optional: set `PANEL_MESSAGE_ID` if you want the bot to edit an existing panel message.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the bot:
   ```bash
   npm start
   ```

## Ticket Panel
The bot posts a dropdown menu in your panel channel. When a user selects a ticket type:
- A private ticket channel is created for the user + routed staff.
- A private staff discussion channel is created for internal notes.

## Dashboard
Run the dashboard server locally:
```bash
npm run dashboard
```
Then open `http://localhost:3000`.

### Dashboard Security
The dashboard displays sensitive ticket metrics and operations data intended for staff use only. To protect this information:

**Authentication:**
- Set `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` in your `.env` file to enable HTTP Basic Authentication.
- If these credentials are not configured, the dashboard will run without authentication and display a warning.
- Use strong, unique credentials and change them regularly.

**Deployment:**
- **For production use:** Always enable authentication and deploy the dashboard behind a secure network (VPN, firewall, or internal network).
- **For public-facing deployments:** Consider using additional security measures such as HTTPS, rate limiting, and IP whitelisting.
- **Local development only:** If running locally for testing, authentication is optional but still recommended.

⚠️ **Important:** The dashboard should never be exposed to the public internet without proper authentication and security measures in place.
