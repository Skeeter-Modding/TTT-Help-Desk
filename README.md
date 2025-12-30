# TTT Help Desk
Professional Discord ticket bot for the TTT gaming community with a clean, easy-to-use dashboard.

## Features
- Panel channel with a dropdown for ticket types.
- Automatically opens a private staff discussion channel per ticket.
- Routes tickets to the correct staff role based on selection.
- Clean, dark dashboard UI with a red/black community theme.
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
