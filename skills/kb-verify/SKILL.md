# kb-verify

Use this skill to run AlchemyLab MVP knowledge-base verification with isolated red-team / blue-team / judge phases.

## Inputs

- `conventions_path`: `CONVENTIONS.md`
- `registry_path`: `topics/topic-registry.md`
- `rule_codes`: parsed from the machine-readable YAML block in `CONVENTIONS.md`
- `fixture_kb_path`: `.verify/runs/{timestamp}/kb/`
- `existing_fixtures`: directories under `evals/fixtures/`
- `scope`: `[source-note, insight]`
- `artifacts_jsonl_path`: `{fixture_kb_path}/generated/artifacts.jsonl`
- `questions`: question list with only `id` and `text`

## Prompt Variables

`red-team.md` uses `{{conventions_path}}`, `{{rule_codes}}`, `{{registry_path}}`, `{{fixture_kb_path}}`, `{{existing_fixtures}}`, and `{{scope}}`.

`blue-team.md` uses `{{conventions_path}}`, `{{rule_codes}}`, `{{fixture_kb_path}}`, `{{artifacts_jsonl_path}}`, and `{{questions}}`.

`judge-report.md` uses `{{timestamp}}`, `{{pass_count}}`, `{{error_count}}`, `{{question_text}}`, `{{pass}}`, `{{fail}}`, and `{{review}}`.

## Execution Flow

1. Main thread runs `npm run kb:index`; diagnostics must pass before verification starts.
2. Main thread creates `.verify/runs/{timestamp}/kb/`, copies necessary formal knowledge-base samples and rule inputs into the isolated run context, and does not mutate the formal knowledge base.
3. Main thread spawns the red-team subthread with the fixture KB path, `CONVENTIONS.md` rules, the parsed `rule_code` table, and the red-team task.
4. Red team returns two outputs: adversarial artifact files written under the fixture/run KB, and a sealed answer key returned to the main thread.
5. Main thread reruns `node scripts/build-index.mjs --kb-root .verify/runs/{timestamp}/kb`; if diagnostics contains any error, the run stops before blue-team execution.
6. Main thread spawns the blue-team subthread with only the fixture KB path, `CONVENTIONS.md`, `artifacts.jsonl`, and questions. The answer key, red-team prompt, and main-thread analysis stay hidden.
7. Blue team answers each question using `artifacts.jsonl` as the first filter and returns cited artifacts plus structured exclusions.
8. Main thread generates `judge-report.md` by comparing the sealed answer key and blue-team output, then leaves final adjudication to the human.

## Boundaries

- Red-team artifacts are written only under `.verify/runs/{timestamp}/kb/`.
- Fixed regression fixtures live under `evals/fixtures/` and are not part of the formal knowledge base.
- Fixture and run artifacts must pass diagnostics; semantic ambiguity is the test target, not malformed frontmatter.
- The blue team must not read `.verify/` outside the current `fixture_kb_path`, `evals/`, answer keys, red-team prompts, or prior runs.
