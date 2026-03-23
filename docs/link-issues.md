# Registry Artifact Resource Link Issues

The current implementation of the artifact resource management form has several critical issues affecting user experience and data structure clarity.

### 1. Functional Redundancy in Selectors
The form currently requires three separate selections for a single resource: **Sector**, **Protocol**, and **Gateway**.
- **Issue**: Selecting a **Gateway** (e.g., YouTube) should already imply the **Sector** (Video) and the **Protocol** (Video Manifest) based on the `external_platforms` database table.
- **Impact**: Increased user friction and potential for selecting incompatible or nonsensical combinations.

### 2. Ambiguity Between Manifestations and Uplinks
There is no clear visual or functional distinction between a playable asset and an outbound link.
- **Issue**: Users cannot easily identify which resource will be consumed by the site’s Media Player (Embeds) versus what will be displayed as a social or commerce button.
- **Impact**: Confusion regarding "Source Links" vs. "Embed Links."

### 3. Terminology Confusion ("Hosted Vault" / "Junctions")
The current naming conventions for resource categories are inconsistent.
- **Issue**: Terms like "Hosted Vault" (intended for R2 assets) and "External Junctions" do not clearly communicate their functional purpose to the regular user.
- **Impact**: Steep learning curve for registry editors.

### 4. Decoupled Platform Metadata
The `external_platforms` table holds a `category` field, but the UI does not use this as the single source of truth for resource categorization.
- **Issue**: The form treats the "Sector" and "Platform" as independent fields, leading to duplicated logic in the application layer.
- **Impact**: Maintenance overhead when adding new platforms to the global registry.

### 5. Categorization Discrepancies
Specific commerce platforms like **BOOTH.pm** and **Fanbox** were not clearly isolated as a primary "Commerce Link Source."
- **Issue**: Logic for identifying these links and assigning them the correct `commerce` role was distributed across various hardcoded URL detection blocks.
- **Impact**: Inconsistent classification of creator-focused commerce platforms.
