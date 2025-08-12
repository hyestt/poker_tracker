# Development Guidelines

## Philosophy

### Core Beliefs
- **Incremental progress over big bangs** - Small changes that compile and pass tests
- **Learning from existing code** - Study and plan before implementing
- **Pragmatic over dogmatic** - Adapt to project reality
- **Clear intent over clever code** - Be boring and obvious

### Simplicity Means
- Single responsibility per function/class
- Avoid premature abstractions
- No clever tricks - choose the boring solution
- If you need to explain it, it's too complex

---

## Process

### 1. Planning & Staging
Break complex work into 3–5 stages. Document in `IMPLEMENTATION_PLAN.md`:

```markdown
## Stage N: [Name]
**Goal**: [Specific deliverable]  
**Success Criteria**: [Testable outcomes]  
**Tests**: [Specific test cases]  
**Status**: [Not Started|In Progress|Complete]
```
- Update status as you progress
- Remove file when all stages are done

---

### 2. Implementation Flow
1. **Understand** – Study existing patterns in codebase  
2. **Test** – Write test first (red)  
3. **Implement** – Minimal code to pass (green)  
4. **Refactor** – Clean up with tests passing  
5. **Commit** – With clear message linking to plan

---

### 3. When Stuck (After 3 Attempts)
**CRITICAL**: Maximum 3 attempts per issue, then STOP.

1. **Document what failed**:  
   - What you tried  
   - Specific error messages  
   - Why you think it failed  
2. **Research alternatives**:  
   - Find 2–3 similar implementations  
   - Note different approaches used  
3. **Question fundamentals**:  
   - Is this the right abstraction level?  
   - Can this be split into smaller problems?  
   - Is there a simpler approach entirely?  
4. **Try different angle**:  
   - Different library/framework feature?  
   - Different architectural pattern?  
   - Remove abstraction instead of adding?  

---

## Technical Standards

### Architecture Principles
- **Composition over inheritance** – Use dependency injection  
- **Interfaces over singletons** – Enable testing and flexibility  
- **Explicit over implicit** – Clear data flow and dependencies  
- **Test-driven when possible** – Never disable tests, fix them

---

### Code Quality
**Every commit must**:
- Compile successfully
- Pass all existing tests
- Include tests for new functionality
- Follow project formatting/linting

**Before committing**:
- Run formatters/linters
- Self-review changes
- Ensure commit message explains *why*

---

### Error Handling
- Fail fast with descriptive messages
- Include context for debugging
- Handle errors at appropriate level
- Never silently swallow exceptions

---

## Decision Framework
When multiple valid approaches exist, choose based on:

1. **Testability** – Can I easily test this?  
2. **Readability** – Will someone understand this in 6 months?  
3. **Consistency** – Does this match project patterns?  
4. **Simplicity** – Is this the simplest solution that works?  
5. **Reversibility** – How hard to change later?  

---

## Project Integration

### Learning the Codebase
- Find 3 similar features/components
- Identify common patterns and conventions
- Use same libraries/utilities when possible
- Follow existing test patterns

### Tooling
- Use project's existing build system
- Use project's test framework
- Use project's formatter/linter settings
- Don't introduce new tools without strong justification

---

## Quality Gates

### Definition of Done
- [ ] Tests written and passing
- [ ] Code follows project conventions
- [ ] No linter/formatter warnings
- [ ] Commit messages are clear
- [ ] Implementation matches plan
- [ ] No TODOs without issue numbers

### Test Guidelines
- Test behavior, not implementation
- One assertion per test when possible
- Clear test names describing scenario
- Use existing test utilities/helpers
- Tests should be deterministic

---

## Important Reminders

**NEVER**:
- Use `--no-verify` to bypass commit hooks
- Disable tests instead of fixing them
- Commit code that doesn't compile
- Make assumptions – verify with existing code

**ALWAYS**:
- Commit working code incrementally
- Update plan documentation as you go
- Learn from existing implementations
- Stop after 3 failed attempts and reassess

---

## Development Partnership

We build production code together.  
I handle implementation details while you guide architecture and catch complexity early.

---

## Core Workflow: Research → Plan → Implement → Validate
**Start every feature with:**  
"Let me research the codebase and create a plan before implementing."

1. **Research** – Understand existing patterns and architecture  
2. **Plan** – Propose approach and verify with you  
3. **Implement** – Build with tests and error handling  
4. **Validate** – ALWAYS run formatters, linters, and tests after implementation  
5. **TDD** – Follow test-driven development principles for new features

---

## Code Organization
- Keep functions small and focused:
  - If you need comments to explain sections, split into functions
  - Group related functionality into clear packages
  - Prefer many small files over few large ones

---

## Architecture Principles
- Always develop in a feature branch
- Delete old code completely – no deprecation needed
- No versioned names (`processV2`, `handleNew`, `ClientOld`)
- No migration code unless explicitly requested
- No "removed code" comments – just delete it

**Prefer explicit over implicit**:
- Clear function names over clever abstractions
- Obvious data flow over hidden magic
- Direct dependencies over service locators

---

## Maximize Efficiency
- **Parallel operations** – Run multiple searches, reads, and greps in single messages
- **Multiple agents** – Split complex tasks (tests vs. implementation)
- **Batch similar work** – Group related file edits together

---


## Required Patterns (for Go Development Standards)
- **Concrete types** – Not `interface{}` or `any` (interfaces hide bugs)  
- **Channels** – For synchronization, not `time.Sleep()`  
- **Early returns** – Reduce nesting  
- **Delete old code** – No versioned functions  
- **Error wrapping** – `fmt.Errorf("context: %w", err)`  
- **Table tests** – For complex logic  
- **Godoc** – All exported symbols

---

**Security**:
- Validate all inputs  
- Use `crypto/rand` for randomness  
- Use prepared SQL statements

**Performance**:
- Measure before optimizing. No guessing.

---

## Progress Tracking
- **TodoWrite** for task management
- **Clear naming** in all code
