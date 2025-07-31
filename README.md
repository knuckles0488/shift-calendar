# Shift Cycle Daily Planner

A simple, offline-first daily planner designed for a 2-day, 2-night, 4-off rotating shift schedule. This Progressive Web App (PWA) allows you to view your shift schedule, add daily notes, mark important days, and manage custom holiday periods, all stored locally in your browser.

## Features

- **Full Year Schedule:** View your complete shift schedule from July 2025 to June 2026.
- **Monthly Calendar View:** Easily navigate through months.
- **Shift Highlighting:** Days are color-coded based on Day, Night, or Off shifts.
- **Daily Notes:** Click on any day to add and save notes.
- **Star Important Days:** Mark any day with a star for easy reference.
- **Holiday & Event Overlays:** Automatically displays statutory holidays and special "Floater" days.
- **Custom Holiday Ranges:** Add your own vacation or holiday periods which will be highlighted on the calendar.
- **PDF Export:** Generate a PDF summary of your notes for any month.
- **Offline First:** As a PWA, the app works entirely offline after the first visit.
- **Responsive Design:** Looks great on desktop, tablets, and mobile devices.

## Run Locally

This project is a standalone frontend application and does not require any backend or API keys.

**Prerequisites:**
- [Node.js](https://nodejs.org/) (for using a local development server)
- A modern web browser

**Instructions:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/knuckles0488/shift-calendar.git
    cd shift-calendar
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open your browser and navigate to the local address provided (usually `http://localhost:5173`).

## Hosting

This app is built with static files (HTML, CSS, TSX) and can be hosted on any static site hosting service like GitHub Pages, Netlify, or Vercel. No special build step is required for the current setup.
