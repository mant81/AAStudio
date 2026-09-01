---
name: AAStudio Core
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006399'
  on-secondary: '#ffffff'
  secondary-container: '#7bc2ff'
  on-secondary-container: '#004f7b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#cde5ff'
  secondary-fixed-dim: '#94ccff'
  on-secondary-fixed: '#001d32'
  on-secondary-fixed-variant: '#004b74'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  surface-white: '#FFFFFF'
  accent-api: '#8B5CF6'
  accent-db: '#10B981'
  accent-logic: '#F59E0B'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  sidebar-width: 260px
  header-height: 64px
---

## Brand & Style

The design system is engineered for professional project management and studio collaboration, focusing on high-density data environments and complex workflows. The brand personality is **reliable, efficient, and sophisticated**, mirroring the precision required in architecture and software engineering studios.

The visual style follows a **Modern Enterprise** aesthetic:
- **Minimalism:** Use heavy white space and a "less is more" approach to allow complex data to breathe.
- **Precision Engineering:** UI elements are governed by strict grid alignments and razor-sharp clarity.
- **Functional Sophistication:** Subtle use of depth and high-quality typography conveys a sense of high-end toolsets without being distracting.
- **Contextual Vibrancy:** While the core shell remains neutral and professional, specific modules (API, DB Modeling) utilize high-saturation accent colors to provide immediate visual orientation.

## Colors

The palette is built on a foundation of **Deep Studio Blue** (`#0F172A`) for high-contrast text and primary navigation elements, paired with **Slate Grays** for UI scaffolding and secondary information.

- **Primary:** The dark slate blue is used for critical brand touchpoints and primary typography to ensure maximum authority and readability.
- **Secondary:** A vibrant professional blue (`#0369A1`) serves as the action color for links, primary buttons, and active states.
- **Neutral:** A crisp, off-white (`#F8FAFC`) background reduces eye strain during long sessions, while pure white (`#FFFFFF`) is reserved for card surfaces and input backgrounds.
- **Module Accents:** Use the named colors (Purple, Emerald, Amber) sparingly to differentiate functional modules like API docs or Database schemas.

## Typography

This design system utilizes a tiered typography strategy to balance editorial clarity with technical utility.

- **Geist** is used for headlines and titles to provide a modern, technical, and slightly condensed feel that maximizes horizontal space in dashboards.
- **Inter** is the primary workhorse for body text and interface labels, chosen for its exceptional legibility and neutral tone.
- **JetBrains Mono** is introduced for technical data, API endpoints, and database IDs, providing a clear distinction between human-readable content and system-generated data.

Use `body-md` (14px) as the default size for dense data tables and sidebars to maximize information density. Use `label-md` in all-caps only for small section headers or secondary meta-data.

## Layout & Spacing

The layout philosophy is based on a **Fixed Sidebar / Fluid Content** model. 

- **Grid:** On desktop, use a 12-column fluid grid for dashboard widgets. For data-heavy views, columns should be used as guides, but content may overflow into horizontal scrolling containers (specifically for Gantt charts or tables).
- **Rhythm:** A 4px baseline grid ensures vertical rhythm. Elements should be spaced in multiples of 4 (8px, 16px, 24px, 32px).
- **Breakpoints:**
  - **Mobile (<768px):** Sidebar collapses into a hamburger menu. Margins reduce to 16px.
  - **Tablet (768px - 1280px):** Sidebar may collapse to an icon-only "rail" to maximize workspace.
  - **Desktop (>1280px):** Full sidebar (260px) is persistent.

## Elevation & Depth

This design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows to maintain a clean, professional feel.

- **Level 0 (Base):** The main background (`#F8FAFC`). No elevation.
- **Level 1 (Cards/Sidebar):** Pure white (`#FFFFFF`) with a 1px border of `#E2E8F0`. 
- **Level 2 (Dropdowns/Popovers):** Pure white with a very soft, diffused shadow (`0 10px 15px -3px rgba(15, 23, 42, 0.08)`).
- **Active State:** Use a 2px left-border accent in the secondary blue for active sidebar items or navigation links to indicate focus without adding bulk.

## Shapes

The shape language is **Soft and Structural**. 

- **Elements:** Buttons, input fields, and small tags use a 0.25rem (4px) corner radius to feel precise. 
- **Containers:** Large cards and dashboard widgets use `rounded-lg` (8px) to soften the overall layout. 
- **Interactive Indicators:** Small circular pips (e.g., status indicators) remain fully rounded. 

Avoid "Pill" shapes for buttons to maintain a more serious, enterprise aesthetic.

## Components

- **Buttons:** Primary buttons use a solid `#0369A1` fill with white text. Secondary buttons use a transparent background with a 1px slate border. Use "Ghost" buttons (no border) for utility actions in toolbars.
- **Data Tables:** Use `body-md` for row content. Headers should be `label-md` with a subtle gray background (`#F1F5F9`) and a bottom border. Row hover states should use `#F8FAFC`.
- **Inputs:** Use white backgrounds with 1px slate borders. Focus states should use a 2px blue ring with 0% offset for high visibility.
- **Chips:** Used for "Tags" or "Status." These should be low-contrast (e.g., light blue background with dark blue text) to avoid visual clutter in list views.
- **Sidebar:** Dark theme (`#0F172A`) sidebar options are preferred to create a strong visual anchor on the left, contrasting with the light workspace.
- **Project Switcher:** A dropdown in the top-left sidebar that displays the studio logo and a chevron. On click, it reveals a searchable list of projects with small color-coded icons.