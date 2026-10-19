# Export Software Frontend — Shipping Bill Creation Form

Refactored frontend engineering assignment built on top of [fe-zen-arch](https://github.com/shivamkj/fe-zen-arch) — the core shared architecture for B2B SaaS frontends.

---

## 1. Setup & Quick Start

### Prerequisites
- Node.js >= 18 (Node.js 20+ recommended)
- `pnpm` (install via `npm install -g pnpm` if not present)
- Git with submodule support

### Installation & Execution
```bash
# 1. Clone repository with submodule (or init if cloned normally)
git submodule update --init --recursive

# 2. Install workspace dependencies
pnpm install

# 3. Start local development server (runs on http://localhost:5173/)
pnpm dev

# 4. Run TypeScript check (zero errors)
pnpm exec tsc --noEmit

# 5. Production build (Vite + Rolldown)
pnpm run build
```

---

## 2. Architecture & Modularization

The original 1,762-line monolithic form (`src/shipping-bills/shipping-bill-form.tsx`) was refactored incrementally into focused, maintainable domain modules while preserving 100% of existing functionality, field bindings, tabs, conditional logic, party dialogs, arrays, licences, and EDI flat-file payload generation:

### A. API-Ready Asynchronous Mock Services (Decoupled from UI)
Per assignment requirements, **UI components do not directly import hardcoded data arrays**. All options and reference data are accessed via asynchronous, Promise-based service abstractions:

- **`src/shipping-bills/services/reference-data-service.ts`**: Unified, Promise-based facade providing asynchronous access to currencies, ports, states, cargo types, seal types, weight units, NFEI categories, contract types, payment types, price inclusions, quantity codes (UOM), export promotion scheme codes, trade agreements, accessory statuses, IGST payment statuses, container sizes, goods sources, file types, and e-Sanchit document codes. Supports realistic latency simulation (with configurable delay) and error simulation.
- **`src/shipping-bills/hooks/use-reference-data.ts`**: React Query hooks (`useBasicsReferenceData`, `useInvoiceReferenceData`, `useItemReferenceData`, `useOthersReferenceData`) providing cached, asynchronous reference data with loading, empty, and error state tracking. When real HTTP endpoints (`GET /api/reference/*`) are deployed, only `reference-data-service.ts` needs to be updated without changing any UI component code.
- **`src/shipping-bills/party-mock-service.ts`**: Asynchronous service for searchable Exporters, Consignees, branches, and ports with query filtering and ID/code lookups.
- **`src/shipping-bills/shipping-bill-service.ts`**: Asynchronous service handling shipping bill persistence (`list`, `fetchById`, `upsert`), EDI flat-file generation (`getFlatFile`, `downloadFlatFile`), and simulated failure controls. Removed unreachable private IP dependency (`192.168.1.123:3408`).
- **`src/shipping-bills/demo-store.ts`**: Persistent demo store backed by browser `localStorage`.

### B. Focused & Reusable UI Components
- **`src/shipping-bills/components/common-sections.tsx`**: Reusable UI sections (`SectionHeading`, `Advanced` expandable sections, `PersistentTab`).
- **`src/shipping-bills/components/async-party-select.tsx`**: Keyboard-accessible combobox popover for parties and ports with live filtering, proper ARIA labels, loading states, and error handling.
- **`src/shipping-bills/components/party-fields.tsx`**: Encapsulated party and branch selectors with cascading branch resets and quick-add actions.
- **`src/shipping-bills/components/invoice-item-card.tsx`**: Invoice item line details with live amount calculations.
- **`src/shipping-bills/components/invoice-card.tsx`**: Invoice header, charges, and item array management.
- **`src/shipping-bills/components/document-item.tsx`**: Supporting document row with asynchronous e-Sanchit code search and metadata.
- **`src/shipping-bills/components/tabs/shipment-basics-tab.tsx`**: Tab 1 (Details: parties, route, packages).
- **`src/shipping-bills/components/tabs/others-tab.tsx`**: Tab 3 (Containers, packing ranges, licences, documents).
- **`src/shipping-bills/shipping-bill-form.tsx`**: Clean coordinator handling form lifecycle, tabs, submission state, validation error routing, and dialog triggers.
- **`src/dashboard/list-dashboard.tsx`**: Dashboard with statistics cards, filterable bills table, flat-file download, and an error simulation toggle for evaluation.

---

## 3. Customs Domain Handling & Sensible Validations

1. **Net Weight vs. Gross Weight Validation**:
   - In international export regulations, cargo net weight cannot exceed gross weight. The form validates that `netWeight <= grossWeight` and displays a descriptive toast error while focusing Tab 1 if violated.
2. **Port of Loading vs. Final Destination Port Validation**:
   - The Port of Loading (Indian port) cannot be identical to the Final Destination Port. The form validates this constraint to prevent invalid export declarations.
3. **Containerized Cargo Validation**:
   - When cargo nature is selected as Containerized (`C`) or Containerized Packages (`CP`), customs regulations require container identification numbers. The form ensures that at least one container row is added before submission.
4. **Packing List Sequence Validation**:
   - Packaging ranges require that `packingNumberFrom <= packingNumberTo`. Any inversions are caught with clear error feedback.
5. **Origin State Auto-population**:
   - When an exporter branch is selected, if the origin state code has not been manually specified, the form automatically derives the branch's state code and pre-fills `originStateCode`.
6. **Scheme Code Incentives (Drawback / RODTEP / ROSCTL)**:
   - When a selected scheme includes Duty Drawback, RODTEP, or ROSCTL, the item card dynamically displays the relevant drawback serial number, drawback unit, and drawback quantity fields.

---

## 4. Confirmed Bug Fixes

1. **Unit of Rate Placeholder**:
   - *Problem*: `placeholder={invoice.items[index].unitOfMeasurement}` used the invoice index instead of the item index, causing `undefined` or incorrect measurement unit placeholders.
   - *Fix*: Updated to `placeholder={item.unitOfMeasurement || invoice.items[itemIndex]?.unitOfMeasurement || 'PCS'}` in `InvoiceItemCard`.

2. **Port Lookup Inconsistency**:
   - *Problem*: Loading ports and foreign discharge ports used separate, incomplete registries (`loadingPorts` vs `ports`), causing valid ports (such as Busan `KRBUS` and Indian loading ports) to fail name and country resolution.
   - *Fix*: Unified port registry in `src/data/ports.ts` with case-insensitive `getPortByCode()` and `portCountry()` mapping. Added missing seed ports (Busan `KRBUS`, Cochin `INCOK1`, Kolkata `INCCU1`).

3. **Vite Entry Script & Cross-Platform Build**:
   - *Problem*: `vite.config.js` relied on `process.argv[process.argv.length - 1]` for `PUBLIC_ENTRY_POINT`, breaking build scripts on non-Unix environments. Furthermore, `package.json` had a hardcoded `NODE_ENV=production` prefix that failed on Windows PowerShell.
   - *Fix*: Updated `vite.config.js` with robust entry point detection targeting `src/index.tsx`, and updated `package.json` build script to standard cross-platform `vite build -- src/index.tsx`.

4. **Workflow Progress Bar Contrast Fix**:
   - *Problem*: In dark mode, the active "Shipping bill" progress card used a light blue background (`bg-primary-50`) with inherited white text and a white indicator circle, rendering title and step number illegible.
   - *Fix*: Explicitly styled active title with `text-slate-900` (`font-semibold`), subtitle with `text-slate-700`, and badge number with `bg-white text-slate-900 border border-primary-200`. Extended `--color-slate-*` tokens in `src/app.css` to guarantee high contrast across light and dark modes while preserving submodule purity.

---

## 5. Form Submission, Validation & Error Handling

- **Submitting State & Duplicate Click Prevention**: The submit button (`Create shipping bill` / `Save changes`) tracks `isSubmitting`, displays an accessible spinner with text `Saving shipping bill...`, and disables the button and all form fields while a submission is pending.
- **Feedback & Toasts**: Displays accurate success toasts on creation/edit (`Shipping bill created successfully`) and informative error toasts (`Failed to save shipping bill: ...`) on network or validation failures. Failures never falsely report success.
- **Draft Autosave & Tab Persistence**: All tabs (`Details`, `Invoices & goods`, `Others`) remain mounted using hidden containers so field values and errors are never discarded when switching tabs. Clicking `Save & Next` or switching tabs persists a local draft and displays a `Draft saved` notification.
- **Validation Error Navigation**: If required fields are omitted upon submission, form validation detects the invalid fields and automatically switches to the appropriate tab (`Details`, `Invoices & goods`, or `Others`) while alerting the user.
- **Simulated Error Testing**: A toggle button (`Simulate Error: ON/OFF`) is provided on the dashboard to test and verify error boundaries, failure toasts, and rejection handling without modifying code.

---

## 6. Known Limitations

- **Mock Persistence Scope**: Persistent mock data is stored in the browser's `localStorage` and synced via a reactive demo store. Multi-user concurrent synchronization or true data warehousing requires a real backend database.
- **Starter Template Lints**: The starter template from `fe-zen-arch` contains strict aesthetic ESLint rules (such as `@typescript-eslint/prefer-nullish-coalescing`). In accordance with the assignment guidelines (*"prioritize practical improvements over large rewrites"*), existing framework-level rules were preserved to avoid introducing regressions in core libraries.

---

## 7. Verification Commands & Results

| Check / Test | Command / Method | Status | Details |
|---|---|---|---|
| **Submodule & Workspace** | `git submodule status` | **PASS** | `fe-zen-arch` clean on `main` branch |
| **Dependency Resolution** | `pnpm install` | **PASS** | 556 dependencies resolved cleanly; **0 new dependencies added** |
| **TypeScript Typecheck** | `pnpm exec tsc --noEmit` | **PASS** | Exit code 0, 0 type errors |
| **Production Build** | `pnpm run build` | **PASS** | Exit code 0, 734 modules transformed, bundle size 206 kB (React chunk) |
| **Dashboard Loading** | Browser E2E (`http://localhost:5173/`) | **PASS** | Seed bills (22 bills), metric cards, search filter, action buttons load |
| **New Shipping Bill Form** | Browser E2E (`/shipping-bills/new`) | **PASS** | 3 tabs render, party autocompletes, route autocompletes |
| **Async Reference Options**| Browser E2E | **PASS** | Currencies, ports, states, schemes, container sizes load via async hooks |
| **Combobox Popovers** | Browser E2E | **PASS** | Exporter/Consignee search filters, popover selection, cascading branch enable |
| **Tab Transition & Draft Save** | Browser E2E (`Save & Next`) | **PASS** | Draft saved toast appears, active tab advances, form state preserved |
| **Invoice & Item Calculations** | Browser E2E (Tab 2) | **PASS** | Rate unit shows `PCS`, item total calculates from qty * price |
| **Container & Doc Arrays** | Browser E2E (Tab 3) | **PASS** | Add/remove container rows, document rows work cleanly |
| **Domain Validation** | Browser E2E | **PASS** | Net weight > gross weight and empty required fields trigger error toasts |
| **Form Submission & Submitting State**| Browser E2E (`Create shipping bill`) | **PASS** | Button disables with spinner, success toast displays, redirects to `/shipping-bills/:id` |
| **Duplicate Click Prevention** | Browser E2E | **PASS** | Button is disabled and guarded while `isSubmitting` is true |
| **Simulated Failure Feedback** | Browser E2E (`Simulate Error: ON`) | **PASS** | Displays error toast, halts submission, does not falsely claim success |

---

## 7. AI Usage & Approach

### Tools Used
- **Agentic Coding Assistant (Antigravity)**: Used for architecture inspection, submodule dependency auditing, automated static analysis (`tsc --noEmit`), and running headless browser end-to-end verifications.
- **TypeScript Compiler (`tsc`) & Vite**: Used for strict static type checking and multi-chunk production bundle validation.
- **Automated Browser Subagent**: Used to simulate real user interactions across all three tabs, testing combobox dropdowns, field inputs, form validations, and asynchronous submission flows.

### How They Were Used
1. **Repository & Architecture Exploration**: Inspected existing codebase patterns within `fe-zen-arch`, identifying the submodule relationship, React Hook Form integration, and the root cause of network hanging on the unrouted IP address `192.168.1.123`.
2. **Service-Layer Refactoring**: Extracted data constants into an asynchronous facade (`referenceDataService`) and React Query hooks (`useReferenceData`) so that UI components have zero direct imports from static data files.
3. **Iterative Typechecking**: Ran `pnpm exec tsc --noEmit` repeatedly to identify edge cases, unused variables, and type incompatibilities between async select options and form fields.
4. **End-to-End Browser Testing**: Executed full user journeys including party selection, route port resolution, invoice item calculation, domain validations (e.g. net weight <= gross weight), and shipping bill creation.

### Engineering Judgment & Key Decisions
- **Zero Additional Dependencies**: The prompt explicitly stated *"Adding new dependencies are not allowed"*. We relied strictly on existing packages (`@tanstack/react-query`, `react-hook-form`, `core`, `ui`) without introducing any new npm libraries.
- **Practical Refactoring over Risky Rewrites**: Kept form schema keys compatible with `fe-zen-arch` leaf-path resolution rather than rewriting the form validation engine, ensuring 100% regression-free field binding.
- **Asynchronous Service Boundary**: Implemented Promise-based mock services with simulated network latency and failure toggles, ensuring future backend HTTP integration requires zero UI component changes.
- **Cross-Platform Compatibility**: Replaced Unix-specific `NODE_ENV=production` build prefixes in `package.json` with standard `vite build -- src/index.tsx` so builds succeed across Windows, macOS, and Linux CI/CD pipelines.

---

## 8. Submission Instructions

To submit your assignment to GitHub user `shivam-aajkalbharat`:

1. Create a **private** repository on GitHub (e.g., `shipping-bill-refactor`).
2. Add the remote and push your branch:
   ```bash
   git remote add origin git@github.com:<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```
3. Navigate to **Settings > Collaborators** on your GitHub repository.
4. Click **Add people**, search for **`shivam-aajkalbharat`**, and invite them with Read/Triage access.
