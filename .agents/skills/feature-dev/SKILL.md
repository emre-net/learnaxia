---
name: feature-dev
description: Structured feature development workflow with phases for discovery, architecture design, cross-platform checks, and implementation. Use when planning and building non-trivial features.
triggers: [new-feature, build-feature, feature-plan, implement-screen]
outputs: [feature-architecture, implementation-plan, verified-code]
---

# Feature Development Workflow

A structured workflow for building new features in LearnAxia, ensuring clean design and seamless integration across Web, Mobile, and Shared packages.

## The 5-Phase Workflow

### Phase 1: Discovery & Requirements
- Understand the core user problem and learning objective.
- Identify the affected layers:
  - Database schema (`prisma/schema.prisma`)
  - Shared domain types & Zod schemas (`packages/shared/`)
  - Backend API routes (`apps/web/app/api/`)
  - Web UI (`apps/web/`)
  - Mobile UI (`apps/mobile/`)
- Ask clarifying questions if requirements or UX flows are ambiguous.

### Phase 2: Architecture & Cross-Platform Alignment
- Check existing patterns to prevent architectural drift (consult `architecture-consistency-enforcer`).
- Adhere to `cross-platform-guard.md`: Never implement a backend change or new data type without synchronizing both Web and Mobile consumers.
- Define the contract first (shared types, schemas, and API contracts).

### Phase 3: Incremental Implementation
- Build the foundation first: shared schemas and DB migrations.
- Implement and test backend endpoints.
- Build UI components using dedicated design tokens and existing styles.
- Wire frontend logic with error handling and loading states.

### Phase 4: Simplification & Cleanup
- Run the `code-simplifier` principles:
  - Remove dead code, redundant re-renders, and excessive nesting.
  - Ensure type safety across all props and state.

### Phase 5: Verification & Review
- Verify error cases (network failures, invalid inputs, empty states).
- Confirm dark mode contrast and responsive layout.
- Check mobile safe area insets and keyboard dismiss handling.
