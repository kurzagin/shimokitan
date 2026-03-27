# PHASE_01: VISUAL RESONANCE // ILLUSTRATION SHARDS

## Context
### 1. Current Implementation
*   **Zine System:** Residents broadcast "Echoes" or "Memoirs" (text reflections) about specific artifacts (music, anime, etc.).
*   **Resonance (Ranking):** A numeric weight (`numeric(12,4)`) attached to every Zine. Currently, every Zine starts with a `baseEnergy` of `1.0`, modified by user-specific multipliers.
*   **UI Integration:** HomeClient displays spotlight artifacts as shards, but their "heat" (priority) is driven by these textual contributions.

### 2. Problems & Issues
*   **Textual Bias:** The platform is human-only and creator-focused, yet the current ranking system (Zines) only leverages narrative talent. Visual creators (illustrators) have no pathway to impact the system's "Resonance."
*   **Conventional Ranking:** While Zines are "non-conventional," the math behind them is currently linear. It doesn't differentiate between a 1-line text memoir and a high-effort visual illustration.
*   **Stagnant Discovery:** Artifact discovery is tied to "Shards" of text. Without visual Zines, the homepage remains a collection of artifacts, rather than a community-guided visual experience.

### 3. Goal
*   **Illustration Shards:** Enable residents to broadcast Image-based Zines (Illustrator exports, fan art, visual moodboards).
*   **Non-Conventional Algorithm:** Introduce "Energy Density" weighting where visual contributions carry significantly more "heat" than text memoirs.
*   **Visual Clustering:** Use Illustration Zines to shift from keyword search to **Aesthetic Discovery**, allowing the "Algorithm" to cluster artifacts by their community-contributed visual vibe.

---

## Overview
Currently, the **Zine System** serves as the primary "Ranking Engine" for the Shimokitan archive. These community-authored "Echoes" generate **Resonance**, which replaces traditional popularity-based algorithms. 

To move beyond conventional search/ranking, Phase 01 introduces **Illustration Zines** — mapping the emotional and aesthetic context of music/anime through visual contributions (Illustrator/Image-based shards).

---

## 1. THE NON-CONVENTIONAL ALGORITHM
Instead of simple hit-counts, the "Signal Weight" of a Zine is determined by its **Creative Intent** and **Effort Density**.

### Signal Calculation Formula
```ts
initialResonance = (UserMultiplier * BaseEnergy) * (StructureComplexity + 1)
```

| Shard Type | Base Energy | Description |
|---|---|---|
| **Memoir (Text)** | `1.0` | Standard textual reflection / memory. |
| **Notation (Data)** | `3.0` | Infographics, time-stamped annotations, or structural analysis. |
| **Visual (Illustration)** | `5.0` | High-effort fan art, moodboards, or visual interpretations. |

### Aesthetic Clustering
By transitioning to image-based Zines, the "Algorithm" can transition from keyword matching to **Aesthetic Resonance**:
- Users cluster artifacts based on visual styles (e.g., *lo-fi grunge*, *cyber-vibrant*, *nostalgic-sepia*).
- The "Spotlight" on the homepage (`HomeClient.tsx`) will prioritize artifacts receiving active **Visual Shards**, making the archive feel like a living, community-illustrated gallery.

---

## 2. PROPOSED CHANGES (CORE SYSTEM)

### Schema Updates (`db/schema.ts`)
We introduce a `nature` discriminator to the `zines` table to handle different media payloads.

```ts
export const zineNatureEnum = pgEnum("zine_nature", ["memoir", "notation", "illustration"]);

export const zines = pgTable("zines", {
    id: text("id").primaryKey(),
    artifactId: text("artifact_id").references(() => artifacts.id),
    authorId: text("author_id").references(() => users.id).notNull(),
    nature: zineNatureEnum("nature").default("memoir").notNull(),
    
    // Payload Reference
    mediaId: text("media_id").references(() => media.id), // For Illustration shards
    resonance: numeric("resonance", { precision: 12, scale: 4 }).default("0.0000"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    // ...
});
```

### UX Refinement (`ZineCreateForm.tsx`)
The broadcast interface evolves into a **Tabbed Shard Editor**:
1.  **[TAB_01: MEMOIR]**: Narrative focus (Textarea).
2.  **[TAB_02: SHARD]**: Visual focus (Drag & Drop Illustration / Illustrator Export).
3.  **[TAB_03: SIGNAL]**: Structural focus (Annotations / External Metadata).

---

## 3. LORE & TONE: "THE COLLECTIVE MEMORY FLOOR"
- **Illustrations as Shards:** An illustration isn't just "content"; it’s a high-energy **Shard** of memory.
- **Resonance as Heat:** High-energy shards generate "heat," causing the related Artifact to glow brighter in the **Sector** (homepage).
- **Non-Static:** The "Algorithm" is not static; it lives through the **Pulse** of the community.

---

## 4. NEXT STEPS (ACTION PLAN)
- [ ] **Infrastructure:** Add `zine_nature` enum to Postgres and migrate `zines` table.
- [ ] **Logic:** Update `broadcastZineAction` to assign `baseEnergy` based on `nature`.
- [ ] **UI:** Enhance `ZineModalDispatcher` to handle multiple creation paths.
- [ ] **Visualization:** Update `HomeClient.tsx` to display Illustration Shards in the "Featured" stack.
