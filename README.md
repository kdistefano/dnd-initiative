# D&D Initiative Tracker

A modern web application for Dungeon Masters to track initiative in D&D games. This system is designed for DM-only use, allowing you to manage all initiative entries, including player characters and NPCs.

## Purpose

This initiative tracker is specifically designed for Dungeon Masters to manage combat encounters in D&D games. It provides a clean, intuitive interface where DMs can:
- Create and manage encounters with multiple creatures
- Track initiative for both player characters and NPCs
- Manage initiative order in real-time during combat
- Save encounters for future use

## Features

### Encounter Management
- Create and save encounters with multiple creatures
- Edit existing encounters
- Start/stop combat encounters
- Real-time initiative tracking
- DM-only information management

### Initiative Tracking
- Add both player characters and NPCs to initiative order
- Roll initiative for NPCs automatically
- Manually input initiative for player characters
- Edit initiative values during combat
- Visual highlighting of current turn
- Real-time updates across multiple browser windows

### Creature Management
- Track player characters separately from NPCs
- Add/remove creatures during combat
- Save creatures for reuse in future encounters

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express
- Real-time updates: WebSocket
- Styling: Tailwind CSS
- Database: SQLite (for simplicity)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Start the development servers:
   ```bash
   # Start backend server (from backend directory)
   npm run dev

   # Start frontend server (from frontend directory)
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
.
├── frontend/           # React frontend application
├── backend/           # Node.js/Express backend server
└── README.md          # Project documentation
```

## Usage Guide

### Creating an Encounter
1. Click "New Encounter" to create a new encounter
2. Add creatures to the encounter:
   - Add player characters with their initiative values
   - Add NPCs with their initiative modifiers
3. Save the encounter for future use

### Running Combat
1. Start the encounter
2. During initiative setup:
   - Input initiative values for player characters
   - Roll initiative for NPCs
   - Add any additional creatures as needed
3. Begin combat:
   - Use "Next Turn" to advance through initiative order
   - Edit initiative values if needed
   - Add/remove creatures as the situation changes
4. End combat when finished

### Managing Encounters
- View all saved encounters
- Edit existing encounters
- Delete encounters
- Start new encounters from saved templates

## Known Limitations

While the application provides a robust solution for D&D initiative tracking, there are some known limitations and edge cases to be aware of:

- Some display issues may occur with very long creature names or when many creatures are in the initiative order
- Real-time updates may occasionally have a slight delay depending on network conditions
- The application is optimized for desktop use and may not provide the best experience on mobile devices
- Very large encounters (20+ creatures) may experience performance issues
- Browser refresh during an active encounter will reset the initiative order

## License

MIT 

## Additional Instructions

To get started with the application:

1. Make sure you have Node.js installed (v18 or higher)
2. Run the setup script:
   ```bash
   ./setup.sh
   ```
3. The application will be available at:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5050

Would you like me to explain any part of the application in more detail or make any adjustments to the current implementation? 