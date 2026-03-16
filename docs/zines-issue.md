# Issue Analysis: Resonance Fragmentation vs. IP Bubbling

## 1. The Core Tension
In the Current Shimokitan architecture, we have **Works** (IP Anchors) and **Artifacts** (Manifestations). Current `zines` (Echoes) contribute weight exclusively to the **Artifact** level. This creates a data-integrity problem regarding "Cultural Heat."

### The Problem Statement:
- If people write Zines on a **Game Trailer** (Artifact), the trailer hits the trending threshold, but the **Game** (Work) remains "cold."
- If we bubble 100% of the weight to the Work, **Standalone Artifacts** (like a Music Cover or Cosplay) might lose their individual identity or "submerge" too far into the original IP.

---

## 2. Content-Specific Nuances

### A. Fragments (Anime/Game)
*   **Examples:** Trailers, OPs, EDs, PVs, Teasers.
*   **Behavior:** These artifacts do not exist for their own sake; they serve the core title.
*   **Risk:** If the Trailer becomes the "Featured" item instead of the Game, the District looks like a "Trailer Hub" rather than a cultural archive.
*   **Requirement:** High weight bubbling (80-100%) to the parent **Work**.

### B. Manifestations (Music)
*   **Examples:** Original MVs, Official Covers, Fan Reinterpretations.
*   **Behavior:** A cover is a standalone performance by a Resident. 
*   **Risk:** If a cover artist's heat is fully absorbed by the original song, their individual effort is devalued.
*   **Requirement:** Partial weight bubbling (Shared Echo). The Artifact keeps the glory, but the Original Work gains "Cultural Context."

### C. Creative Echoes (Cosplay/Art)
*   **Examples:** Cosplay Sets, Fan Illustrations, Doujinshi.
*   **Behavior:** High human "Aura" from the contributor, low direct technical utility to the IP.
*   **Risk:** These are "Tributes."
*   **Requirement:** Trace weight bubbling (10-20%). Most weight stays on the Artist/Artifact.

---

## 3. Potential Solution: The Resonance Ratio Model

We need a system that isn't hardcoded but is governed by **Contextual Anchors**.

### Proposed Logic:
- **Resonance bubbling should be calculated based on `(Category + Nature + LinkType)`.**

| Relationship Type | Transfer Ratio | Artifact Impact | Work Impact |
| :--- | :---: | :--- | :--- |
| **Fragment** | 1.0 | High | Total |
| **Interpretation** | 0.5 | Total | Partial |
| **Tribute** | 0.2 | Total | Trace |

### UI Implications:
1.  **Home Page "Pulse":** Shows individual **Zines** (The human voice).
2.  **Home Page "High Heat":** Shows **Works** sorted by *Aggregate* weight (Sum of all planet-artifacts).
3.  **Home Page "Trending Echoes":** Shows **Artifacts** with high *Individual* spikes (Covers/Art).

---