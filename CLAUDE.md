# PromptWars Competition — Claude Instructions

## Competition Context

This project is an entry in the **PromptWars Competition** (Google for Developers × H2S × Build with AI).
The repository is evaluated automatically. Final score is the **sum of all 6 parameters — no category is ignored.**

| Criterion | Impact | Note |
|---|---|---|
| Code Quality | **High** | Clean, readable & well-structured code |
| Problem Statement Alignment | **High** | Targets core challenge, user needs & objectives |
| Security | **Medium** | Safe practices, avoids common vulnerabilities |
| Efficiency | **Medium** | Optimal use of time & memory |
| Testing | **Low** | Easily testable & maintainable code |
| Accessibility | **Low** | Usable for diverse users & environments |

**Strategy:**
- Get **Code Quality** and **Problem Statement Alignment** right first — they carry the most weight.
- **Security** and **Efficiency** still matter. A strong solution with poor security loses points you could've kept.
- When scores are close, **Testing** and **Accessibility** are what separate you from the next rank — don't leave points on the table.

---

## 1. Problem Statement Alignment (High Impact)

- Before writing any code, re-read the problem statement. Every feature, function, and file must trace back to a stated requirement.
- Do not add features that are not asked for. Gold-plating is penalised — scope creep dilutes alignment score.
- If the problem statement is ambiguous, pick the interpretation that produces the most useful solution and document the assumption in a single inline comment.
- The output (UI, API, CLI, data) must exactly match the format or shape the problem demands. Do not substitute a different output format because it is "easier."
- Validate your solution against each listed acceptance criterion before marking a task done.

---

## 2. Code Quality (High Impact)

### Correctness
- Code must produce the correct output for all stated inputs. Test mentally against edge cases before committing.
- Prefer explicit over implicit. A reader should understand what a function does without running it.

### Structure
- One responsibility per function. If a function needs a comment to explain what it does, it should be split.
- Keep files focused. A file that does three unrelated things should be three files.
- No dead code, no unused imports, no commented-out blocks.

### Naming
- Names must be self-explanatory: `parseInvoiceDate` not `parse`, `userEmailInput` not `val`.
- Booleans: `isLoading`, `hasError`, `canSubmit` — always a predicate.
- No abbreviations unless they are universal (`id`, `url`, `http`, `api`).

### Comments
- Write comments only when the **why** is non-obvious. Never comment what the code already says.
- Do not reference the current task, issue number, or PR in comments — put that in commit messages.

### Formatting
- Follow the formatter/linter already configured in the project. If none exists, set one up before writing production code.
- Consistent indentation, trailing newlines, no trailing whitespace.

---

## 3. Security (Medium Impact)

- **Never trust user input.** Validate and sanitise at every system boundary.
- **Never construct queries, shell commands, or HTML by string concatenation.** Use parameterised queries, argument arrays, and safe templating APIs.
- **No secrets in source.** API keys, tokens, passwords → `.env` file, never committed. Provide `.env.example` with placeholder values.
- **Least privilege by default.** Request only the permissions/scopes the feature actually needs.
- **Dependency hygiene.** Prefer well-maintained, widely used packages. Audit before adding a new dependency.
- Default HTTP responses must not leak stack traces, internal paths, or sensitive identifiers.
- For web: set correct `Content-Security-Policy`, `X-Content-Type-Options`, and `X-Frame-Options` headers where applicable.
- For auth: use established libraries (e.g. `bcrypt`, `jsonwebtoken`). Never roll your own crypto.

---

## 4. Efficiency (Medium Impact)

### Algorithmic
- Choose the right data structure first: Map/Set over Array when membership or lookup is the dominant operation.
- Avoid O(n²) where O(n log n) or O(n) is achievable without sacrificing readability.
- Memoize or cache results that are expensive to recompute and are called with the same inputs repeatedly.

### I/O and Network
- Batch requests where possible — never fan out N individual calls when a single bulk call exists.
- Lazy-load data that is not needed on the critical path.
- Do not fetch the same data twice in a single request/render cycle.

### Rendering (UI)
- Avoid unnecessary re-renders: key lists correctly, memoize callbacks and derived state where profiling justifies it.
- Never block the main thread with synchronous I/O or heavy computation — offload to a worker or async pipeline.

### Bundle / Build
- Import only what you use. No `import * as lib` when you only need two functions.
- Remove all dev-only dependencies from production bundles.

---

## 5. Testing (Low Impact — don't skip)

- Write at least one unit test per non-trivial utility function.
- Focus tests on correctness of the core domain logic, not implementation details.
- Tests must be runnable with a single command (`npm test`, `pytest`, etc.) and must pass cleanly.
- Do not over-mock. Real integrations are acceptable and often preferable.
- Name test cases as sentences: `it("returns empty array when input is null")`.
- Structure code so it is testable from the start — pure functions, injected dependencies, no hidden globals.

---

## 6. Accessibility (Low Impact — tiebreaker)

If building a UI, apply the following without significant extra effort:

- All interactive elements must be reachable via keyboard (`Tab`, `Enter`, `Space`, arrow keys where expected).
- Every `<img>` has a meaningful `alt` attribute.
- Form inputs have associated `<label>` elements — not just placeholder text.
- Colour contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text.
- Use semantic HTML elements (`<nav>`, `<main>`, `<button>`, `<article>`) before reaching for a generic `<div>`.
- Do not suppress focus outlines without providing a visible alternative.
- ARIA attributes only when native semantics are insufficient — don't layer ARIA onto elements that already carry the right role.

---

## General Rules (Always Enforced)

1. **Align first.** If implementing a feature would hurt alignment with the problem statement, raise the conflict before proceeding.
2. **No premature abstraction.** Three similar lines is better than a wrong abstraction. Abstract only when a pattern appears three or more times and the abstraction clearly reduces complexity.
3. **No half-finished code.** Do not leave `TODO`, `FIXME`, or stub implementations in committed code unless the problem statement explicitly defers that feature.
4. **No unnecessary dependencies.** Every new package must be justified. If the standard library covers it, use the standard library.
5. **Commit-ready at every step.** Each completed task must leave the repository in a working, non-broken state.
6. **Validate before reporting done.** Run the app or relevant tests, confirm the acceptance criterion is satisfied, then mark the task complete. Do not claim success from reading code alone.
7. **Security over convenience.** If a shortcut introduces a security risk, take the longer path.
8. **Efficiency is not optional at Medium impact.** Profile before optimising, but never ship obviously inefficient algorithms or redundant I/O.
