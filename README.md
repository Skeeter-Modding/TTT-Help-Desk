# TTT Help Desk
Professional Discord ticket bot for the TTT gaming community with a clean, easy-to-use dashboard.

## Features
- `/ticket` slash command that creates a ticket channel for the player.
- Automatically opens a private staff discussion channel per ticket.
- Clean, dark dashboard UI inspired by modern ticketing tools.
- Simple configuration via `.env`.

## Setup
1. Copy `.env.example` to `.env` and fill in your Discord IDs and bot token.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the bot:
   ```bash
   npm start
   ```

## Dashboard
Run the dashboard server locally:
```bash
npm run dashboard
```
Then open `http://localhost:3000`.
