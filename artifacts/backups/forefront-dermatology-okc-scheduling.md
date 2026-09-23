# Forefront Dermatology â€” OKC Scheduling

**Application Name:** Forefront Dermatology Staff Scheduling System  
**Location:** North & South Clinics â€” Oklahoma City  
**Purpose:** Manage physician, PA, and Mohs surgeon schedules with medical assistant staffing needs

## Overview

A comprehensive scheduling application for Forefront Dermatology's two Oklahoma City clinic locations. The system helps coordinate provider schedules, manage medical assistant assignments, and track time off across both locations.

## Features

### Providers Tab
- Add/manage physicians, PAs, and Mohs surgeons
- Set individual hours, location, and staffing needs
- Color-coded provider cards for easy identification
- Quick removal of providers

### My Schedule Tab (Self-Service)
- Each provider sets their own weekly pattern
- Split days into Morning (AM) and Afternoon (PM) blocks
- Configure per block:
  - Type: Clinic or Surgery
  - Location: North or South
  - Hours: Start and end times
  - Medical assistants needed
  - Required skills (optional, e.g., "surgery")
  - Minimum skilled staff required
- Save and load weekly templates (e.g., "Fall Schedule", "Holiday")

### Medical Assistants Tab
- Maintain pool of active medical assistants
- Set skills (e.g., "surgery", "mohs")
- Configure preferred provider and location (soft preferences)
- Define availability hours per day (hard constraints)
- Toggle active/inactive status

### Weekly Schedule Tab
- Auto-generated suggestions for MA assignments
- Manual override capability (add/remove MAs from any slot)
- Real-time warnings for under-staffed blocks
- Visual color-coding by provider
- Slot details: type, location, time, required skills
- One-click MA assignment/removal

### Year Calendar Tab
- Month-by-month overview
- Visual indicators of provider schedules
- Click any day to jump to that week's detailed view
- Time-off and leave status visible at a glance

### Time Off & Leave
- Cross-tab time-off management
- Works for both providers and medical assistants
- Define date ranges and labels (Vacation, Conference, etc.)
- Prevents auto-assignment during leave periods

## Auto-Assignment Logic

The system generates smart medical assistant assignments:

1. **Block Priority:** Harder-to-fill blocks go first
   - Blocks with skill requirements prioritized
   - Larger staffing needs come next

2. **Skill-First Matching:**
   - Fill skill minimum first (e.g., "2 surgery-trained MAs")
   - Select from qualified, available candidates
   - Prefer candidates with soft preferences (provider/location)

3. **Availability Constraints:**
   - Only suggests MAs available during block hours
   - Respects time-off entries
   - Avoids double-booking same MA in same block
   - Allows MA to work AM then PM same day

4. **Warning System:**
   - Flags under-staffed blocks clearly
   - Indicates when skill minimums aren't met
   - Shows exact gap (e.g., "Short 2" or "Needs 2 surgery-trained, has 1")

## Data Persistence

- Auto-save to cloud database (if connected)
- Browser local storage fallback
- Weekly schedule auto-generation on first view
- State migration for backward compatibility

## Design

- Clean, professional dermatology branding (teal and neutral palette)
- Mobile-responsive layout
- Dark mode support
- Accessibility-focused (semantic HTML, proper contrast)
- Fast, snappy interactions with visual feedback

## Technology Stack

- Vanilla JavaScript (no frameworks)
- Claude Artifacts database (optional cloud sync)
- Client-side rendering with real-time UI updates
- Responsive CSS Grid/Flexbox layout

---

**Last Updated:** September 22, 2026  
**Version:** Current  
**Type:** Interactive Web Application
