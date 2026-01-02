# Android App Specification: Shift Cycle Daily Planner

This document provides all technical requirements and logic details to recreate the "Shift Cycle Daily Planner" as a native Android application.

## 1. App Overview & Identity
- **Name:** Shift Planner Mobile
- **Core Functionality:** A specialized calendar for workers on a 2-Day, 2-Night, 4-Off rotating shift schedule.
- **Primary Tech Stack Recommendation:** Kotlin, Jetpack Compose, Room (Local DB), DataStore (Settings), WorkManager (Background Tasks).

## 2. Core Shift Logic (CRITICAL)
The app must follow this exact math to stay synchronized with the web version:

- **Reference Date:** July 1, 2025 (`2025-07-01T00:00:00Z`)
- **Cycle Length:** 8 days
- **Shift Sequence:** `N2`, `O1`, `O2`, `O3`, `O4`, `D1`, `D2`, `N1`
- **Crew Offsets (Days):**
  - Crew C: 0
  - Crew A: -4
  - Crew B: -6
- **Calculation Formula:** 
  `index = ( (DaysSinceReference + CrewOffset) % 8 + 8) % 8`

## 3. Data Schema (Room Database)
Store user-generated content in a local SQLite database using Room:

### Table: `DayEntries`
- `date` (String/Long, Primary Key): ISO format `YYYY-MM-DD`
- `note` (String): The user's text note.
- `isStarred` (Boolean): Important marker.
- `isCustomHoliday` (Boolean): Flag for highlighted vacation periods.

### DataStore (Preferences)
- `selectedCrew` (Enum: A, B, C)
- `crewNames` (Map: A->String, B->String, C->String)
- `floaterDays` (List of Strings): Default `['2025-10-08', '2026-04-08']`
- `workLocation` (Object): 
  - `lat` (Double)
  - `lng` (Double)
  - `radius` (Int)
  - `enabled` (Boolean)

## 4. UI/UX Requirements
### Themes
- **Light Mode:** Slate-50 background, Indigo-600 primary accents.
- **Dark Mode:** Slate-950 background, Indigo-400 primary accents.

### Components
1. **Header:** Current month/year display with crew badge and settings gear.
2. **Calendar Grid:** 
   - 7-column layout.
   - **Colors:**
     - Day Shift: Emerald/Green tinted background.
     - Night Shift: Rose/Red tinted background.
     - Off: Sky/Blue tinted background.
   - **Today Marker:** Indigo ring/outline.
3. **Note Editor:** Use a **Modal Bottom Sheet** instead of a central popup for better mobile ergonomics.
4. **Summary Cards:** Monthly stats (Days worked vs. Days off) and a list of starred notes for the month.

## 5. Native Feature Implementation
### Geolocation & WorkManager (OT Detection)
- Use `FusedLocationProviderClient`.
- Implement a `PeriodicWorkRequest` (e.g., every 4 hours) that checks:
  1. Is today a scheduled "OFF" day?
  2. Is the user currently within `radius` meters of the `workLocation`?
  3. If yes, trigger a **System Notification**: "You're at work on a day off! Mark as Overtime?"

### CSV Export
- Use the `Storage Access Framework` to allow users to save a `.csv` file to their "Downloads" or "Documents" folder.
- Format: `Date, Weekday, Shift, Starred, Notes`

### Holidays
- Hardcode the provided holiday list for 2025/2026 to ensure offline functionality.

## 6. User Settings Screen
- Crew Selection & Renaming (List with Edit icons).
- Work Location Picker: Use Google Maps API or a "Capture Current Location" button.
- Floater Day Selectors (Standard Android DatePickers).
- Custom Holiday Range: A start and end date selector that updates the `isCustomHoliday` flags in the DB.

## 7. Migration/Sync Path
- To allow users to move from the Web App to the Android App, implement a "JSON Import/Export" feature where the Web App `localStorage` can be pasted into the Android app.
