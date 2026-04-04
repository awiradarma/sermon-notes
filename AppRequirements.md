# AppRequirements.md: SanctuaryNotes PWA

## 1. Project Vision
A specialized Progressive Web App (PWA) for taking sermon notes. It must be high-performance, mobile-first, and "offline-perfect" to handle the spotty connectivity often found inside church buildings.

## 2. Technical Stack
* **Framework:** React or Next.js (Client-side focused for PWA performance)
* **Database & Auth:** Firebase (Firestore + Firebase Auth)
* **Offline Support:** Firestore Persistence (IndexedDB) + Service Workers
* **Styling:** Tailwind CSS (Mobile-first, utility-based)
* **Editor:** Lightweight Markdown-based block editor

## 3. Core Functional Requirements

### A. The "Smart" Sermon Entry
* **Title:** Required field for the sermon name.
* **Preacher Selection:** A searchable dropdown component. If a user types a name not in their history, it should automatically be saved to their personal "Preacher List" for future use.
* **Date Management:** Automatically set to "Today" by default. Provide a date picker for manual overrides (back-dating notes).
* **Verse Auto-complete:** A specific input field for "Key Verses." As the user types, it must suggest the 66 books of the Bible (e.g., "Gen" -> "Genesis").
* **Automatic Tagging:** A listener on the Verse field that extracts the book name and adds it as a tag (e.g., "John 3:16" automatically adds a `#john` tag).

### B. The Writing Experience (Canvas)
* **Minimalist Editor:** A clean, wide-open canvas that uses the full width/height of the mobile screen.
* **Markdown Triggers:** Support `#` for headers, `*` for bullets, and standard bold/italics shortcuts.
* **Formatting Toolbar:** A persistent, low-profile toolbar above the mobile keyboard for one-tap access to Bold, Italics, and Lists.
* **Distraction-Free Mode:** When scrolling or typing in the body, the metadata headers (Preacher, Date, etc.) should collapse or fade to maximize vertical space.

### C. Offline-First Architecture
* **Sync Logic:** Use `enableIndexedDbPersistence`. All writes must be local-first.
* **Status Indicators:** Provide a subtle visual cue (e.g., a small green dot or cloud icon) to show if changes have successfully synced to the cloud.
* **App Shell:** Ensure the UI/Navigation loads instantly without a network connection.

### D. Organization & Social
* **Library Filters:** A dashboard to group notes by:
    * **Time Period** (Recent, Last Month, etc.)
    * **Preacher** (Filter by the growing list)
    * **Book/Tag** (Filter by the auto-generated Bible book tags)
* **Public Publishing:** A toggle on each note (Default: Private).
* **Public Feed:** A "Community" tab showing notes published by other users.
* **Reactions:** Simple "Heart" emoji interaction on public notes using Firestore increments.

## 4. Data Model (Firestore)

```json
{
  "notes": {
    "docId": {
      "userId": "string",
      "title": "string",
      "preacher": "string",
      "sermonDate": "timestamp",
      "verses": ["string"],
      "tags": ["string"],
      "content": "markdown_text",
      "isPublic": false,
      "heartCount": 0,
      "updatedAt": "serverTimestamp"
    }
  },
  "userProfiles": {
    "userId": {
      "knownPreachers": ["string"],
      "displayName": "string"
    }
  }
}