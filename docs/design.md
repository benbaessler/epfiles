# Interface Design Guide: The Investigative Workbench

## Product Philosophy

### Target Audience
1.  **Investigative Journalists:** Seeking verification, leads, and document provenance.
2.  **Legal Professionals & E-Discovery Teams:** Searching for impeachment material and case law contradictions.
3.  **OSINT & Network Analysts:** Mapping hidden connections and "following the money/flights."
4.  **Compliance & Risk Officers:** Conducting deep-dive due diligence (KYC/AML).
5.  **Academic Historians:** Reconstructing historical timelines and power structures.

### Design Mantra & Emotional Goal
**"The Digital War Room"**

The interface must feel like a **Forensic Workbench**, not a customer support bot.
*   **Emotions to Evoke:** Precision, Authority, Focus, "Digging," Skepticism (verified by data).
*   **The Feeling:** The user is the lead investigator. The AI is the tireless junior analyst presenting raw evidence. The UI facilitates "deep work" and verification, effectively reducing the cognitive load of handling massive datasets.

---

## 1. Core Aesthetic: "The Investigative Darkroom"

A high-contrast **Dark Mode** is the default to reduce eye strain during long research sessions and establish a serious, professional tone.

### Color Palette
*   **Backgrounds:** Deep Zinc/Slate grays (e.g., `#18181b` to `#27272a`). Avoid "pure black" to prevent OLED smearing and reduce harsh contrast.
*   **Text:** Off-white (`#e4e4e7`) for primary readability.
*   **Primary Accent ("The Highlighter"):**
    *   **Highlighter Yellow/Amber** (e.g., `#facc15` or `#fbbf24`).
    *   *Usage:* Search hits, inline citations, key entities, and active states. Mimics the physical act of highlighting legal documents.
*   **Secondary Accent:**
    *   **Muted "Legal Blue"** (`#475569`).
    *   *Usage:* Structural elements, borders, secondary navigation.

---

## 2. Typography

Typefaces are chosen to distinguish between the "Tool" (UI), the "Story" (Evidence), and the "Data" (Metadata).

*   **UI & Chat Interface:** `Inter`
    *   Clean, legible, neutral. Keeps the chrome invisible.
*   **Document Content & Reading View:** `Merriweather` or `Source Serif`
    *   Evokes newspapers and legal briefs. Implies authority and "official record."
*   **Metadata, Dates, & Hash IDs:** `JetBrains Mono`
    *   Signals "raw data," precision, and technical accuracy.

---

## 3. Mockup Description

### Layout: "Split-Brain" Workspace
A **3-Pane Density Layout** to enable verification without context switching.

1.  **Left Pane (Context/Tools):**
    *   Collapsible File Tree / Source List.
    *   "Saved Entities" & "Active Investigation" focus.
2.  **Center Pane (The Interrogator):**
    *   The main Chat Interface.
    *   Stream of inquiry and synthesis.
3.  **Right Pane (The Evidence):**
    *   PDF Viewer / Document Preview.
    *   "Source of Truth" that auto-scrolls to citations.

### Component Details
*   **Header:** Minimal. Breadcrumbs of the current investigation focus (e.g., `Home > Flight Logs > 2002 > N909JE`).
*   **Chat Bubbles:**
    *   *User:* Simple, dark grey background (`#27272a`).
    *   *AI:* Transparent background or very dark slate. Text is **Serif** to distinguish synthesized narrative from UI.
*   **Citations:**
    *   Glowing **Gold/Yellow pills** (e.g., `[Doc 009: p.12]`).
    *   Clicking a pill instantly opens the specific page in the Right Pane.
*   **Action Bar:**
    *   Utilitarian actions: "Export to CSV", "Save to Case File", "Verify Source".

