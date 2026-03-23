# SHIMOKITAN_SIGNAL // Operation Magazine Plan

## Vibe & Objective
Transform `apps/signal` from a static placeholder into a "living editorial" for the district. It will function as a high-concept magazine/bulletin board where operational issues (Anomalies) meet cultural storytelling (Editorials).

**Core Philosophy:**
- **Magazine Aesthetic:** Bento-box grids with full-bleed media and bold typography.
- **Operational Transparency:** Real-time link between system health and resident feedback.
- **High-Fidelity Interaction:** "Arguments" and "Spectrums" instead of simple comment sections.

---

## 1. Database Schema Evolution
The current `transmissions` table needs to expand from a technical status log to a social communication hub.

### 1.1 Enumeration Expansion
Expand `transmission_type` to include:
- `announcement`: Official alerts.
- `editorial`: Long-form magazine pieces/blogs.
- `changelog`: System/District updates.
- `forum`: Community-driven discussion threads.
- `qna`: Direct resident-to-founder questions.
- `event`: Time-bound occurrences with metadata location.

### 1.2 Interactive Layer (New Tables)
- **`transmission_interactions`**: 
    - `type`: `reaction` | `comment` | `vote` | `argument`
    - `value`: Stores emoji, markdown text, or vote direction.
    - `spectrum`: (For arguments) A -1 to 1 value representing the community's stance.
- **`transmission_media`**:
    - Bridge table to allow multiple R2 assets per article.
    - Support for `gallery`, `inline`, and `hero` roles.

---

## 2. Application Architecture

### 2.1 Signal (The Public Magazine)
- **Homepage:** A dynamic `BentoGrid` where prominence is driven by `resonance` and `severity`.
- **Feed Logic:**
    - High-Severity Issues are "glitched" and red-bordered.
    - High-Resonance Editorials use large full-screen "Zine" layouts.
- **Navigation:** Deep-links per sector (e.g., `signal.live/issues`, `signal.live/magazine`).

### 2.2 Dashboard (The Transmission Factory)
- **Command Center:** A dedicated module to view a "Heatmap" of community resonance.
- **Composer:**
    - Magazine-grade editor with multi-asset R2 upload.
    - Metadata controls (Severity, Effected Sectors, Tags).
- **Moderation:** Resolve "Arguments" or pin "Decisive Verdicts" in the forum.

---

## 3. UI/UX Design System
Utilize `packages/ui` to build dedicated Signal components:
- **Mag-Bento:** A card variant that handles various media aspect ratios naturally.
- **Spectral HUD:** A visualization component for debate outcomes.
- **Transmission-Header:** High-contrast technical overlays for magazine titles.

---