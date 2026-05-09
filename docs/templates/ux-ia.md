# UX Information Architecture Template

## Scope

- Initiative:
- In-scope surfaces:
- Out-of-scope surfaces:

## Personas And Primary Jobs

| Persona | Primary Job | Frequency | Criticality |
|---|---|---|---|
| | | | |

## Navigation Model

- Entry points:
- Primary navigation:
- Secondary navigation:
- Global actions:

## View Inventory

| View / Surface | Purpose | Entry Path | Primary Actions | Dependencies |
|---|---|---|---|---|
| Lifecycle Webview | Phase guidance and AI execution | Sidebar -> Lifecycle Phases -> Open Phase Guide | Read guide, run prompt, open checklist | docs/lifecycle, docs/prompts |
| Checklist Panel | Phase execution checklist | Open checklist command | Validate readiness and handoff | docs/checklists |
| Lifecycle Tree View | Phase navigation and context actions | Activity bar -> AI-Native DevOps | Open phase, run prompt, open checklist | vscode-extension/src/lifecycleProvider.ts |
| Status Bar Item | Dashboard quick entry | Status bar -> AI DevOps | Open dashboard | vscode-extension/src/extension.ts |
| Command Palette | Global command access | Command Palette -> AI DevOps commands | Provider selection, automation, scaffolding | package.json contributes.commands |

## Task Flows

### Flow 1: Open phase and run prompt

1. Open lifecycle phase from tree view.
2. Review lifecycle and prompt tabs.
3. Run AI prompt with default or custom input.
4. Review output and open checklist.

Success criteria:

- User reaches run action in <= 2 clicks from sidebar.
- User understands where outputs should be created.

### Flow 2: Handle missing required outputs

1. Open phase guide.
2. Review required output files in requirements card.
3. Create missing file from requirements action.
4. Continue work without leaving context.

Success criteria:

- Missing output files can be created in one click.
- No raw file-not-found errors are shown.

## Information Hierarchy

- Level 1: Phase selection.
- Level 2: Lifecycle, prompt, agent, and run tabs.
- Level 3: Contextual actions (open, create, run, checklist).

## Content Design Rules

- Use action-oriented labels.
- Keep command names consistent: AI DevOps: <Action>.
- Show next-step guidance in empty states and error messages.
- Keep technical details in output channels, not modal errors.

## Accessibility Requirements

- Keyboard-only access for all primary actions.
- Screen reader readable labels for all interactive elements.
- Contrast target at least 4.5:1 for text.
- No color-only meaning in status messages.

## Theming Requirements

- Use VS Code theme variables only.
- Validate light, dark, and high-contrast themes.
- Use Codicons for iconography consistency.

## Metrics And Validation

| Metric | Baseline | Target | Measurement Method |
|---|---|---|---|
| Task completion rate | TBD | +20% | Moderated usability test |
| Time to first successful prompt run | TBD | -30% | Timed task study |
| Error recovery success rate | TBD | +25% | Scenario-based test |
| Accessibility violations | TBD | 0 critical | Automated plus manual audit |

## Risks

- Scope creep across too many UI surfaces.
- Accessibility validation environment availability.
- Regressions introduced by layout changes.

## Approval And Sign-Off

- Product / Engineering Lead:
- Design Reviewer:
- Accessibility Reviewer:
- Date:
