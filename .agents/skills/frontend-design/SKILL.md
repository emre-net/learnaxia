---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
triggers: [ui-design, frontend-component, styling, landing-page, mobile-screen-design]
outputs: [design-system, styled-components, visual-specs]
---

# Frontend Design

Approach this as the design lead at a design studio known for giving every client a distinct visual identity that is not mistaken for anyone else's. The project demands a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to LearnAxia, taking aesthetic risks when justified.

## Ground your designs in the subject matter

LearnAxia is an interactive, modern learning and study platform (Notes, Flashcards, Quizzes, Multiple Choice, Gap Fill, Drawing & Mind Maps). The design should balance high focus with vibrant engagement:
- Clean, distraction-free content areas for deep study sessions.
- Premium dark-mode aesthetics (deep slate/charcoal backgrounds rather than generic pitch black, subtle borders, luminous accents).
- High visual feedback for correctness, progress, and study streaks.

## Design principles

1. **The Hero & First Impression:** Open with the most characteristic element — an interactive flashcard, live study statistics, or a sleek modular canvas. Avoid generic SaaS-style badges or bland stat numbers.
2. **Typography with Personality:** Use intentional weights, widths, and spacing. Default to line lengths under 80 characters.
   - Avoid generic tells like accenting just a single random word in a title, using ALL-CAPS everywhere, or redundant small tags above headers.
3. **Visual Structure is Information:** Structural devices (outlines, borders, dividers, badges) must convey semantic meaning, not mere decoration.
4. **Micro-Animations & Motion:** Use motion deliberately to reward actions (flipping a card, selecting an option, completing a module). Avoid continuous distracting animations during reading.
5. **Color & Contrast:**
   - Define a tight palette: deep neutral background, elevated card surfaces, high-contrast readable text, and distinct semantic state colors (success/emerald, warning/amber, error/rose, accent/violet or cyan).

## Calibration (Avoid AI-Generated Tells)

Avoid these generic default traps:
- The generic "SaaS card kit" with identical large rounded corners and soft drop shadows applied uniformly to everything.
- Hairline borders with zero visual hierarchy.
- Tracked-out uppercase micro-labels above every single block.
- Gradient washes placed haphazardly without light-source logic.

## Process
1. Plan tokens (Colors, Typography, Elevation, Spacing).
2. Review against LearnAxia's dark premium aesthetic.
3. Build components with native accessibility and touch targets (minimum 44x44 pt on mobile).
4. Critique the result: does it feel like a polished, state-of-the-art educational app?
