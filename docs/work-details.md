# Shimokitan IP Architecture: Works vs. Artifacts

This document outlines the rationale and implementation strategy for the separation of **Works** (IP Anchors) and **Artifacts** (Manifestations) within the Shimokitan ecosystem.

## 🏗️ The Core Paradigm: Anchor & Manifestation

To maintain an enterprise-grade registry, we distinguish between the **Creative Idea** and its **Physical Reality**.

- **Work (IP Anchor)**: The canonical entry for a piece of intellectual property. It is the "source of truth" for immutable metadata.
- **Artifact (Manifestation)**: A specific version, release, or presence of that IP in the world (e.g., a YouTube MV, a Spotify stream, a physical CD).

### 🎯 Why Separate? (The "Frieren" Example)

If we treat every video or link as its own standalone entry, we encounter "Data Rot" and "UI Chaos."

**Scenario: Anime Series S1 vs. S2**
1.  **The Work (S1)**: Stores `Status: Finished`, `Season: Fall 2023`, `Format: TV`.
2.  **The Artifact (S1 Trailer)**: Links to the S1 Work. It inherits the status and season.
3.  **The Artifact (S1 OP)**: Links to the S1 Work. It also inherits the status and season.

**The Benefit**: If you realize the Season was actually "Winter", you update the **Work** once. Every artifact linked to it is automatically corrected.

## 🛠️ Implementation Strategy

### 1. Data Inheritance
Artifacts should prioritize data inherited from their parent `workId`. In the database, both tables have `specs` and `tags`, but the **Work** is the master.
- **Works**: Store "Core Attributes" (BPM, Key, Anime Season, Genre Tags).
- **Artifacts**: Store "Presentation Data" (Specific Thumbnail, Director for that specific MV, Platform-specific links).

### 2. UI Behavior (The "Pruning")

#### WorkForm (IP Anchor)
- **Identity Module**: Slug, Category (Music/Anime/Game).
- **Branding Module**: Canonical Portrait vs. Landscape assets.
- **Authority Module**: Nature (Original/Cover), Status (Live/Archived/Pit).
- **IP Specs**: The master list of metadata.

#### ArtifactForm (Manifestation)
- **Inheritance Check**: When a `WorkId` is selected:
    - **Hide** the `MetadataSection` (Specs & Tags).
    - **Show** a message: *"Inheriting metadata from [Work Title]"*.
    - Focus exclusively on **Credits** (who made *this* specific manifestation) and **Visuals**.

### 3. Granularity Rules
- **Anime**: A "Work" represents a **Production Unit** (Season 1, Season 2, Movie). This handles changes in studio or staff between seasons.
- **Music**: A "Work" represents the **Composition**. Artifacts represent the Official MV, the Acoustic Version, or the Remix.

---
*Last Updated: 2026-03-15*
