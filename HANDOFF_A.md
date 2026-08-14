# Product & Design Specification: Issue Reporting & Ticket Tracking System (MVP)

**Document Version:** 1.0.0  
**Author:** Agent A (Product / Designer)  
**Target Audience:** Developer (Agent B) & QA (Agent C)  
**Status:** Approved for Implementation  

---

## 1. Overview & Architectural Decisions

### 1.1 Purpose
A lightweight, single-application Issue Reporting and Ticket Tracking MVP. The system allows reporters (end-users) to submit issues and track their progress, while handlers (support/admin staff) manage tickets through a defined lifecycle.

### 1.2 Explicit Technology Stack Choice
To enable fast setup without external database dependencies, the developer **MUST** implement the system using:
- **Backend:** Node.js with Express (`express`).
- **Data Persistence:** Local JSON file storage (`tickets.json`) with synchronous or asynchronous filesystem read/write helpers (or `lowdb` / lightweight local file store).
- **Frontend:** Single Page Application (SPA) using HTML5, Vanilla JavaScript (ES6+), and CSS3 (clean modern styling with CSS variables or standard flex/grid layout).
- **Runtime Command:** Running `npm start` must launch the server on port `3000` (serving both REST API and static frontend assets from a `public/` directory).

---

## 2. User Flows & Journeys

```
[ Reporter Journey ]
1. Open App -> 2. Fill "Submit Ticket" Form -> 3. Receive Ticket ID -> 4. Track Ticket Status anytime via Search ID

[ Handler Journey ]
1. Open Handler View -> 2. Browse/Filter Tickets -> 3. Select Ticket -> 4. Transition Status & Add Notes -> 5. Save Changes
```

### 2.1 Reporter Journey
1. **Accessing the Portal:** The reporter navigates to the application root (`/`).
2. **Submitting an Issue:** The reporter fills out the issue submission form (Title, Description, Reporter Name, Priority) and clicks **"Submit Ticket"**.
3. **Confirmation:** Upon successful submission, a confirmation banner appears presenting a generated unique Ticket ID (e.g. `TCK-1001`) and a direct link to track the issue.
4. **Tracking Progress:** The reporter enters their Ticket ID into the search bar at any time to view real-time status updates, handler notes, and status transition history.

### 2.2 Ticket Handler Journey
1. **Accessing the Dashboard:** The handler switches to the **"Handler View"** via top navigation.
2. **Reviewing Tickets:** The handler views a dashboard list showing all submitted tickets, filtered by status or priority.
3. **Managing a Ticket:** The handler clicks on a ticket to inspect details.
4. **Updating Status:** The handler transitions the ticket status to the next allowed stage (e.g. `REPORTED` -> `RECEIVED` -> `IN_PROGRESS` -> `DONE`) and optionally enters a resolution note.
5. **Persisting Changes:** The system updates the ticket status and logs the `updated_at` timestamp.

---

## 3. Screen Specifications & Layouts

The single-page application consists of two main views accessible via a top navigation bar:
1. **Submit & Track View (Reporter)**
2. **Dashboard View (Handler)**

---

### 3.1 Top Navigation Bar
- **App Title:** `Ticket Tracker MVP`
- **Navigation Links / Tabs:**
  - `[ Report Issue ]` (Default)
  - `[ Track Ticket ]`
  - `[ Handler Dashboard ]`

---

### 3.2 Reporter Screen 1: Submit Issue Form
**Route/View:** `#submit` (Default home view)

**UI Components & Form Fields:**
- **Title Header:** "Report an Issue"
- **Form Elements:**
  - **Reporter Name:** `<input type="text">` (Required, placeholder: "Your Name")
  - **Issue Title:** `<input type="text">` (Required, max 100 characters, placeholder: "Brief summary of the problem")
  - **Priority Selection:** `<select>` (Options: `Low`, `Medium`, `High`; Default: `Medium`)
  - **Description:** `<textarea>` (Required, rows=4, placeholder: "Provide details about the issue...")
  - **Submit Button:** `<button type="submit">` labeled **"Submit Ticket"**
- **Validation Messages:** Inline red text under required fields if submitted empty.
- **Success Banner (Post-submit):**
  - Text: "Ticket Submitted Successfully!"
  - Displays Ticket ID in bold (e.g., `TCK-1001`).
  - Button: `[ Copy Ticket ID ]` and `[ Track Status ]`.

---

### 3.3 Reporter Screen 2: Track Ticket Lookup
**Route/View:** `#track`

**UI Components:**
- **Search Header:** "Track Ticket Status"
- **Search Bar:**
  - `<input type="text">` (Placeholder: "Enter Ticket ID, e.g. TCK-1001")
  - `<button>` labeled **"Search"**
- **Ticket Detail Card (Visible when ticket found):**
  - **Header Row:** Ticket ID (`TCK-1001`), Priority Badge (`Low` / `Medium` / `High`), Status Badge (`REPORTED` / `RECEIVED` / `IN_PROGRESS` / `DONE` / `CLOSED`).
  - **Title:** Issue Title
  - **Reporter:** Name of submitter
  - **Created At:** Formatted local timestamp
  - **Updated At:** Formatted local timestamp
  - **Description Box:** Full issue description text.
  - **Status Progress Indicator:** Visual lifecycle tracker showing current step.
  - **Handler Notes Section:** Displays notes left by the handler (if any).
- **Error State:** Red callout message "Ticket ID not found. Please verify your ID."

---

### 3.4 Handler Screen: Dashboard & Ticket Management
**Route/View:** `#dashboard`

**UI Components:**
- **Metrics Summary Cards:**
  - `Total Tickets` count
  - `Reported` count
  - `Received` count
  - `In Progress` count
  - `Done` count
- **Filter Controls Bar:**
  - **Status Filter:** Dropdown (`All Statuses`, `REPORTED`, `RECEIVED`, `IN_PROGRESS`, `DONE`, `CLOSED`)
  - **Priority Filter:** Dropdown (`All Priorities`, `Low`, `Medium`, `High`)
  - **Search Input:** Filter table by Ticket ID or Title text.
- **Ticket Table:**
  - **Columns:** `Ticket ID`, `Title`, `Reporter`, `Priority`, `Status`, `Created At`, `Actions`.
  - **Row Action:** `[ Manage ]` button to open detail modal/drawer.
- **Ticket Management Modal / Drawer:**
  - Displays full ticket details (ID, Reporter, Title, Description, Created/Updated timestamps).
  - **Status Transition Selector:** Dropdown or buttons presenting **ONLY** valid next status transitions based on current status.
  - **Handler Notes Input:** `<textarea>` for resolution or progress comments.
  - **Save Button:** `[ Update Status ]`.

---

## 4. Data Model & State Lifecycle

### 4.1 Ticket Entity Schema
The `Ticket` entity represents an issue.

```json
{
  "id": "TCK-1001",
  "title": "Login page returns 500 error",
  "description": "Clicking the login button with valid credentials throws an internal server error.",
  "reporter_name": "John Doe",
  "priority": "High",
  "status": "IN_PROGRESS",
  "handler_notes": "Investigating server logs in authentication service.",
  "created_at": "2026-08-08T21:00:00.000Z",
  "updated_at": "2026-08-08T21:15:00.000Z"
}
```

| Field | Data Type | Validation Rules | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Unique string, format `TCK-XXXX` (auto-increment numeric ID prefixed with `TCK-`) | Unique Ticket Identifier |
| `title` | String | Required, non-empty, trim whitespace, max 100 chars | Summary title of the issue |
| `description` | String | Required, non-empty, trim whitespace | Detailed description of the problem |
| `reporter_name`| String | Required, non-empty, trim whitespace | Name of the person reporting |
| `priority` | String Enum | Allowed values: `"Low"`, `"Medium"`, `"High"`. Default: `"Medium"` | Severity/priority level |
| `status` | String Enum | Allowed values: `"REPORTED"`, `"RECEIVED"`, `"IN_PROGRESS"`, `"DONE"`, `"CLOSED"`. Default: `"REPORTED"` | Current state in lifecycle |
| `handler_notes`| String | Optional. Default: `""` | Comments or resolution notes added by ticket handler |
| `created_at` | String (ISO 8601) | Auto-generated UTC timestamp on creation | Submission timestamp |
| `updated_at` | String (ISO 8601) | Auto-generated UTC timestamp on creation & updates | Last modified timestamp |

---

### 4.2 Status Lifecycle & Transition Matrix

The ticket status follows a strictly enforced state machine:

```
[ REPORTED ] ──> [ RECEIVED ] ──> [ IN_PROGRESS ] ──> [ DONE ] ──> [ CLOSED ]
      │               │                │                 │
      └──> [ CLOSED ] └──> [ REPORTED ] └──> [ RECEIVED ] └──> [ IN_PROGRESS ]
```

#### Allowed Transition Rules Table:

| Current Status | Allowed Target Statuses | Trigger / Meaning |
| :--- | :--- | :--- |
| **`REPORTED`** | `RECEIVED`, `CLOSED` | Handler acknowledges receipt OR rejects invalid ticket (`CLOSED`). |
| **`RECEIVED`** | `IN_PROGRESS`, `REPORTED` | Handler starts working (`IN_PROGRESS`) OR unassigns back to `REPORTED`. |
| **`IN_PROGRESS`** | `DONE`, `RECEIVED` | Handler resolves issue (`DONE`) OR pauses work (`RECEIVED`). |
| **`DONE`** | `CLOSED`, `IN_PROGRESS` | Handler/Reporter closes ticket (`CLOSED`) OR re-opens (`IN_PROGRESS`). |
| **`CLOSED`** | `IN_PROGRESS` | Handler re-opens closed ticket (`IN_PROGRESS`). |

> **Rule:** Any attempt to perform an unauthorized status transition (e.g. `REPORTED` -> `DONE` directly) **MUST** be rejected by the backend with HTTP `400 Bad Request`.

---

## 5. REST API Specification

The developer must expose the following RESTful endpoints:

### 5.1 Create Ticket
- **Endpoint:** `POST /api/tickets`
- **Request Body:**
  ```json
  {
    "title": "UI alignment issue on mobile",
    "description": "Buttons overlap on screens smaller than 375px.",
    "reporter_name": "Alice Smith",
    "priority": "Low"
  }
  ```
- **Response (201 Created):** Returns full created `Ticket` object.
- **Response (400 Bad Request):** Validation failure (missing required fields).

### 5.2 List Tickets
- **Endpoint:** `GET /api/tickets`
- **Query Parameters (Optional):**
  - `status` (e.g., `?status=IN_PROGRESS`)
  - `priority` (e.g., `?priority=High`)
- **Response (200 OK):** Array of `Ticket` objects.

### 5.3 Get Single Ticket
- **Endpoint:** `GET /api/tickets/:id`
- **Response (200 OK):** `Ticket` object.
- **Response (404 Not Found):** `{"error": "Ticket not found"}`

### 5.4 Update Ticket Status
- **Endpoint:** `PATCH /api/tickets/:id/status`
- **Request Body:**
  ```json
  {
    "status": "RECEIVED",
    "handler_notes": "Acknowledged ticket, assigning to support engineer."
  }
  ```
- **Response (200 OK):** Returns updated `Ticket` object with refreshed `updated_at`.
- **Response (400 Bad Request):** Invalid status transition attempted.
- **Response (404 Not Found):** Ticket ID does not exist.

---

## 6. Acceptance Criteria (QA Verification Checklist)

This concrete checklist will be evaluated by QA (Agent C). Every test case must pass for approval.

### Category A: Ticket Submission (Reporter)
- [ ] **AC-A1:** Submitting the form with valid `title`, `description`, `reporter_name`, and `priority` creates a ticket and returns HTTP 201 with a generated `id` (e.g. `TCK-1001`).
- [ ] **AC-A2:** Submitting without selecting a priority defaults `priority` to `"Medium"`.
- [ ] **AC-A3:** Submitting with empty `title`, empty `description`, or empty `reporter_name` fails validation, returns HTTP 400, and displays inline error messages.
- [ ] **AC-A4:** Newly created ticket has `status` set to `"REPORTED"`.
- [ ] **AC-A5:** `created_at` and `updated_at` timestamps are generated in valid ISO 8601 format and are initially identical.

### Category B: Ticket Lookup & Tracking (Reporter)
- [ ] **AC-B1:** Entering a valid Ticket ID into the search input displays the exact title, description, reporter name, priority badge, status badge, and timestamps.
- [ ] **AC-B2:** Entering a non-existent Ticket ID displays a clear "Ticket Not Found" error banner.
- [ ] **AC-B3:** Updating a ticket's status on the handler side immediately reflects when the reporter re-searches or refreshes the tracking view.

### Category C: Dashboard & Filtering (Handler)
- [ ] **AC-C1:** The handler dashboard lists all existing tickets sorted by `created_at` descending (newest first).
- [ ] **AC-C2:** Filtering by status (e.g. `REPORTED`) displays only tickets with `status === "REPORTED"`.
- [ ] **AC-C3:** Filtering by priority (e.g. `High`) displays only tickets with `priority === "High"`.
- [ ] **AC-C4:** Summary counter cards display accurate counts matching actual ticket states.

### Category D: Lifecycle & Transition Enforcement (Handler & API)
- [ ] **AC-D1:** Valid transition `REPORTED` -> `RECEIVED` succeeds (200 OK), updates status, and updates `updated_at`.
- [ ] **AC-D2:** Valid transition `RECEIVED` -> `IN_PROGRESS` succeeds (200 OK).
- [ ] **AC-D3:** Valid transition `IN_PROGRESS` -> `DONE` succeeds (200 OK).
- [ ] **AC-D4:** Valid transition `DONE` -> `CLOSED` succeeds (200 OK).
- [ ] **AC-D5:** Invalid direct transition attempt (e.g. `REPORTED` -> `DONE` or `REPORTED` -> `IN_PROGRESS`) is blocked in the UI (option disabled/hidden) and returns HTTP 400 Bad Request if requested directly via API.
- [ ] **AC-D6:** Updating status allows providing `handler_notes`, which are saved to the ticket and visible on both dashboard and reporter lookup views.

### Category E: Stack & Execution Setup
- [ ] **AC-E1:** The project contains a `package.json` file with `scripts.start` defined.
- [ ] **AC-E2:** Running `npm start` initializes the server on port 3000 without errors.
- [ ] **AC-E3:** Accessing `http://localhost:3000` loads the web interface directly.
- [ ] **AC-E4:** Ticket data persists across server restarts in local file `tickets.json`.

---
*End of Specification Document HANDOFF_A.md*
