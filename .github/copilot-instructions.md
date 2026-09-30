# Copilot Instructions: Codebase Unification (Event Insight)

## Context
This project was built iteratively, partly with the help of various
AI tools working independently across sessions. As a result there are
structural inconsistencies:
- Multiple functions with identical or very similar logic, rewritten
  from scratch in different places instead of being reused
- Inconsistent naming conventions (camelCase/snake_case mixed,
  inconsistent prefixes/suffixes)
- Repeated API-call patterns instead of shared helper functions/hooks
- Inconsistent error handling (sometimes try/catch, sometimes .catch(),
  sometimes none at all)
- Likely code duplication between the admin and end-user interfaces
  that should actually be shared components/utilities

Goal: increase consistency, reusability, and maintainability —
**without changing existing behavior.**

## Non-negotiable guardrails

1. **Don't change behavior.** Refactoring means: same input →
   same output. No "improvements" to logic on the side, no new
   features, no changes to API contracts (request/response formats)
   without explicitly flagging it to me first.
2. **One module/domain per step.** Don't touch the whole repo in a
   single pass. Order: shared utilities first, then backend routes,
   then frontend components (admin and end-user interface separately).
3. **Must stay runnable after every step.** After each change, the app
   must still start and the affected functionality must be manually
   testable. If you're unsure whether a change is safe, ask instead of
   guessing.
4. **Keep diffs small and traceable.** Prefer 10 small, clearly
   described commits/suggestions over one giant rewrite.

## Phase 1: Inventory (read-only, change nothing)

Before rewriting anything:

1. Search the repository for functions with similar purpose but
   different names/implementations. Likely candidates in this project:
   - Date/time formatting
   - API fetch wrappers (Axios calls with error handling)
   - Speed/position calculation for participants
   - GPX parsing logic
   - Form validation (e.g. the API link pattern check for
     `https://api.raceresult.com/...`)
   - Auth header handling / token management
2. Produce a list (as a markdown table) with: function name(s), file
   path(s), short description, estimated duplicated line count.
3. Show me this list before starting Phase 2.

## Phase 2: Establish conventions

Before consolidating any code, define (and then strictly follow):

- **Naming:** camelCase for variables/functions, PascalCase for React
  components, SCREAMING_SNAKE_CASE for constants
- **File structure:** where shared utilities belong (e.g.
  `frontend/src/utils/`, `frontend/src/hooks/`,
  `backend/src/services/`)
- **API calls:** a single centralized Axios client with interceptors
  for auth/error handling instead of scattered `axios.get(...)` calls
- **Error handling:** one consistent pattern (e.g. centralized
  try/catch with a shared error-handler function, consistent error
  response shape in the backend)
- **Component structure:** consistent (e.g. props destructuring, hook
  ordering, when to use local state vs. context)

Write these conventions into a short `CONVENTIONS.md` so they remain
traceable for future changes.

## Phase 3: Consolidation (step by step)

For each duplicate group from Phase 1:

1. Pick the best/most robust implementation as the base (or write a
   new, clearly tested version if none of the existing ones is good
   enough).
2. Move it to the centralized location defined in Phase 2.
3. Replace all call sites with imports of the centralized function.
4. Delete the old duplicates only **after** all call sites have been
   migrated and verified.
5. Short summary per step: what was consolidated, how many call sites
   affected, what was deleted.

## Phase 4: Structural simplification

Only after duplicates have been eliminated:

- Check for unnecessarily nested conditionals, dead code paths,
  unused imports/variables
- Unify comment style and remove commented-out legacy code
- If the admin and end-user interfaces have structurally similar
  components (e.g. map rendering), assess whether a shared base
  component with prop-based variation makes sense — but only propose
  it, don't merge unasked, in case the interfaces are intentionally
  kept separate

## What you must NOT do

- Don't swap out dependencies (libraries) or bump versions as part of
  this refactor
- No database schema changes
- No changes to the SimpleAPI integration logic without an explicit
  request
- No blanket automated "formatting passes" over the whole repo (e.g.
  running Prettier on everything) — that produces huge, unreviewable
  diffs. Request formatting separately and explicitly.

## Process

Work phase by phase. After Phase 1, and after each completed duplicate
group in Phase 3, wait for my confirmation before continuing.