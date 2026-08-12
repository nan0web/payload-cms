---
description: Plugin development pipeline, testing standards in testing-app, and production project migration protocol
---

# 🚀 Plugin Development Pipeline & Production Migration Protocol

This document defines the standardized pipeline for developing, testing `@nan0web/payload-*` ecosystem plugins in integration, and safely migrating changes to production projects.

---

## 1. Context Isolation & Project Isolation Rules

1. **Stabilization in `testing-app` Before Production**:
   - Every plugin or architectural modification MUST first be developed, packaged, and fully tested in the `testing-app` sandbox.
   - Proceeding to real production sites is FORBIDDEN until `pnpm test` (unit tests) and `pnpm test:int` (integration tests in `testing-app`) pass 100% cleanly without errors.

2. **Single Chat / Session Per Production Project**:
   - Developing or migrating multiple production projects within a single dialogue session/chat is STRICTLY PROHIBITED.
   - A **dedicated chat session** MUST be created for each production project.
   - Work MUST take place strictly within that project's working directory (`/path/to/specific-project`).

---

## 2. Mandatory Media Migration Protocol

When migrating media files (considering `payload-self-storage`, folder metadata, physical disk hierarchy, and WebP optimization), follow a strict two-stage process:

### Stage I: Read-Only Audit (No Data Mutation)

Before executing any modifying commands, perform a complete 10-point audit:

1. **Payload CMS Version** (e.g., `3.87.1`).
2. **Database Adapter** (`postgresAdapter`, `mongooseAdapter`, `sqliteAdapter`).
3. **`Media` Collection Configuration** (fields, hooks, restrictions).
4. **Folders Configuration** (checking `folders: true` and relation to `payload-folders`).
5. **Image Sizes (`imageSizes`)** (list of width, height, crop, format options).
6. **Current Storage Layout** (`staticDir`, `publicUrlPrefix`, physical disk path).
7. **Document & File Statistics** (DB document count vs physical disk file count).
8. **Issue Detection** (duplicate filenames, orphan files, missing originals or thumbnails).
9. **Backup Availability & Recovery Options** (DB dump presence & storage file archive).
10. **Total Data Volume** (DB size and physical storage size in bytes/GB).

### Stage II: Migration Plan, Dry-Run, & Safe Execution Cycle

1. **Documentation Preparation**:
   - Create `migration_plan.md` outlining all execution steps.
   - Prepare a **Dry-Run** script (test run without writing to DB or disk, logging proposed changes).
   - Prepare a **Rollback Plan** (rapid restore instructions from backup).
2. **Obtain Explicit Confirmation**:
   - Stop execution and wait for **explicit user approval**.
3. **Execution on Staging / Copy**:
   - Execute first migration **exclusively on a database & storage copy (Staging)**.
   - Apply to production ONLY after successful validation on Staging.

---

## 3. Payload CMS Plugin Best Practices

Based on official Payload CMS specifications (`payloadcms.com/llms.txt`), plugin development adheres to:

1. **Strict 100% Coverage Rule**:
   - **Total Logic Isolation (TLI)**: All pure plugin logic (URL manipulation, redirect handling, data formatting, path calculation) MUST be implemented as **Environment-Agnostic** Standard JS/TS functions (runnable in Browser, Node.js, Deno, Bun, Edge Workers), completely isolated from UI components and Payload server instances.
   - **100% Test Coverage for Core Logic**: Core plugin logic in `src/` MUST achieve 100% unit test coverage (statement, branch, function) using native `node:test`.
   - **Three-Layer Verification Conveyor**:
     - **Layer 1 (Unit Tests & TLI)**: `pnpm test` in plugin package (`node:test`) without DB or Next.js.
     - **Layer 2 (Contract & Packaging)**: `pnpm pack:check` verifies subpath export integrity and ESM compatibility.
     - **Layer 3 (Integration & E2E)**: `pnpm test:int` and `pnpm test:e2e` in `testing-app` verify plugin operation in a real environment with Postgres and Next.js.

2. **Testing Framework Standards**:
   - **`node:test` (Native Node Test Runner)**: Used in autonomous backend packages (`packages/payload-*`) for unit tests with zero external dependencies (`pnpm test`).
   - **`vitest`**: Used in UI/Next.js projects (`testing-app`) for integration tests (`environment: 'node'`) and React/DOM components (`environment: 'jsdom'`).

3. **Payload Config Lifecycle**:
   - **1. Incoming Config Validation**: Inspects basic structure passed to `buildConfig({ ... })`.
   - **2. Plugins Array Execution (`plugins`)**: Payload sequentially invokes plugin functions from `plugins: [...]`. Each plugin receives current `config`, mutates/adds collections, fields, or hooks, and returns the updated config.
   - **3. Default Options Integration**: Payload populates missing options with system defaults (default locale, i18n, system collections like `payload-migrations`).
   - **4. Sanitization**: Validates collection slug uniqueness, normalizes fields, verifies schemas, and constructs `importMap` for React Admin UI.
   - **5. Final Runtime Initialization**: Instantiates ready Payload instance (connects DB, registers REST/GraphQL, and boots server).

4. **Autonomy & Isolation (OLMUI & Subpath Exports)**:
   - Plugin core logic (`src/index.js`) MUST NOT import or depend on React Admin UI components.
   - Admin UI components are exported via explicit subpaths (e.g., `@nan0web/payload-self-storage/admin`).

5. **Clean String Component Identifiers**:
   - All React Admin UI components are registered in Payload config exclusively using string paths (`'package-name/subpath#ExportName'`).

6. **Local API Usage (`getPayload`)**:
   - All server-side operations and scripts are built using the balanced Local API with proper `context` and `overrideAccess` configurations.
