# AIRules.md (CRITICAL — NON-NEGOTIABLE ENFORCEMENT)

This file defines STRICT rules that MUST always be followed.

---

## CORE ENFORCEMENT RULES

You MUST ALWAYS follow:
- checklistBackend.md
- namingConventions.md
- AIRules.md itself

You MUST:
- Update checklistBackend.md AFTER EVERY change
- Update LearningGuide.md AFTER EVERY change
- Follow namingConventions.md EXACTLY

You are NOT allowed to:
- Ignore naming conventions
- Skip documentation updates
- Generate inconsistent or messy code
- Make large unstructured changes

If a task conflicts with these rules:
→ FOLLOW THE RULES FIRST

---

## DEVELOPMENT RULES

- Work step-by-step (no large jumps)
- Prefer incremental updates over full rewrites
- NEVER overwrite working code unless necessary
- Keep code clean, modular, and production-ready

---

## NAMING ENFORCEMENT (VERY IMPORTANT)

- ALL code MUST strictly follow namingConventions.md
- NO exceptions
- If existing code violates conventions:
  - Gradually refactor it to comply
- Consistency > speed

Before writing code, you MUST validate:
- Does this follow namingConventions.md?
- Is this aligned with checklistBackend.md?
- Will LearningGuide.md be updated after this?

If ANY answer is NO → STOP and fix it first.

---

## CHECKLIST ENFORCEMENT (CONTROLLED FLEXIBILITY)

- checklistBackend.md is the PRIMARY source of truth

You MUST:
1. Follow checklistBackend.md in order by default
2. Always know which step you are on
3. Mark tasks complete immediately after finishing them

---

## CONDITIONAL SKIPPING RULE (RARE)

You are allowed to temporarily skip ahead ONLY IF:
- It is REQUIRED to complete the current task
- OR it unblocks progress that cannot continue otherwise

---

## IF YOU SKIP AHEAD, YOU MUST:

1. Clearly state:
   - What step you are skipping
   - Why it is necessary

2. Complete ONLY what is required (no extra work)

3. Immediately update checklistBackend.md:
   - Add the skipped work in the correct order
   - Reflect what was done

4. Return back to the correct checklist order after

---

## STRICT PROHIBITIONS

- You MUST NOT:
  - Skip steps for convenience
  - Jump multiple phases ahead unnecessarily
  - Do large amounts of unplanned work

---

## PRINCIPLE

Structure > speed
But progress > rigidity

Every deviation from checklistBackend.md must be justified and documented.

---

## LEARNING GUIDE ENFORCEMENT (MANDATORY)

- LearningGuide.md MUST be updated AFTER EVERY STEP

Each update MUST include:
- What was done
- Why it was done
- How it works (simple explanation)
- Key concepts (if applicable)
- Best practices
- Mistakes to avoid

You are NOT allowed to skip this.

---
