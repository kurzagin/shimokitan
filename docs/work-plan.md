# Shimokitan Dashboard: IP Metadata & Manifestation Work Plan

## 🎯 Objective
Refine the separation between **Works** (Canonical IP Anchors) and **Artifacts** (Manifestation Records) to ensure a high-fidelity, professional registry experience. Fix UI chaos in the IP Anchors panel and prune redundant metadata from manifestations.

---

## 🛠️ Phase 1: Refining the Work Record Panel (IP Anchors)
**Issue:** The current `WorkForm` layout is perceived as chaotic and lacks visual hierarchy.

### Actions:
- [ ] **Structural Reorganization**: Group form fields into distinct, high-contrast modules:
    - **Identity Module**: Slug, Category, and Master IDs.
    - **Branding Module**: Portrait Portrait (2:3) vs Landscape Hero (16:9).
    - **Authority Module**: Creative Nature, Registry Status, and Authority Domain.
- [ ] **Visual Polish**:
    - Implement a consistent grid system (leveraging the 4-column layout more effectively).
    - Add semantic headers with micro-labels to provide context for "Resident_Registry_Link" and other specialized inputs.
    - Ensure the "Localization Matrix" feels like a background process rather than a foreground distraction.
- [ ] **UX Improvements**:
    - Improved validation feedback for required fields.
    - Better spacing between the Credits (Contributors) and Specs (Metadata) sections.

---

## 🛠️ Phase 2: Pruning the Artifact Manifestation Form
**Issue:** Manifestations (Artifacts) still contain "core attributes" and "metadata" that should be exclusively managed at the Work level.

### Actions:
- [ ] **Metadata Decoupling**:
    - Remove the `MetadataSection` (Specs & Tags) from the `ArtifactForm` entirely.
    - Manifestations will inherit taxonomy (Tags) and technical specs (Specs) from their parent `WorkId`.
- [ ] **Editorial Focus**:
    - Restrict `ArtifactForm` to presentation-layer data:
        - **Visuals**: Thumbnail, Poster, Vinyl art.
        - **Content**: Title (Locale-specific), Description (Editorial text).
        - **Credits**: Manifesto-specific collaborators (e.g., MV Director, Cover Artist).
- [ ] **Relationship Enforcement**:
    - Ensure every Artifact is linked to a Work to facilitate data inheritance.
    - Provide a "View Canonical Source" link within the Artifact form for quick navigation back to the IP Anchor.

---

## 📋 Status Tracking
- [done] **Data Architecture**: Canonical fields moved to `Work` tables.
- [done] **Work Form UI**: Redesign for clarity and hierarchy.
- [done] **Artifact Form Cleanup**: Remove redundant `MetadataSection`.
- [done] **Storage Logic**: R2 paths standardized for `works/` and `artifacts/`.
