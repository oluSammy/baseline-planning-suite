# Baseline Planning Suite

Baseline is an application for a delivery organisation: helps identify who is working on what, for how
long, and what it costs. Managers plan people onto work packages month by month, see when
someone is committed beyond their contracted hours, and price the plan at the cost rates
those people are paid, even when a rate changes in the middle of a month.

It is three federated React applications built as if by two teams that ship on their own
schedules and never import each other's source:

| App          | Role   | Owns                                                                                |
| ------------ | ------ | ----------------------------------------------------------------------------------- |
| **Shell**    | host   | Navigation, display currency, active user. Loads the remotes at runtime.            |
| **People**   | remote | The employee register: roles, weekly hours, effective-dated cost rates.             |
| **Delivery** | remote | The work breakdown and the month-by-month staffing grid that spends People's rates. |

## Run it

```bash
docker compose up --build
```

| URL                                                                            | What                                           |
| ------------------------------------------------------------------------------ | ---------------------------------------------- |
| [http://localhost:8080](http://localhost:8080)                                 | The suite: shell hosting People and Delivery   |
| [http://localhost:8080/people](http://localhost:8080/people), /delivery        | Deep links into either app                     |
| [http://localhost:8081](http://localhost:8081)                                 | People standalone, same build                  |
| [http://localhost:8082](http://localhost:8082)                                 | Delivery standalone, same build                |
| [http://localhost:8080/remotes/people/](http://localhost:8080/remotes/people/) | People standalone through the shell's nginx    |
| [http://localhost:8080/config.json](http://localhost:8080/config.json)         | The remote URLs the shell resolved at start-up |

Edits are saved in the browser and survive a reload. Each app has a **Reset to seed** button
that restores the shipped sample data for that app.
Note that browser storage is per origin,
so `localhost:8080` and `localhost:8081` keep separate data.

## Break a remote on purpose

The shell must stay alive and say so in place of the panel. Three ways to prove it:

1. **A query parameter.** Open [http://localhost:8080/delivery?break=people](http://localhost:8080/delivery?break=people) (or
   `?break=delivery`). The panel shows "Delivery is unavailable" with the error. the header, the other
   app, and your data are untouched.
2. **A real outage.** `docker compose stop people`, then reload [http://localhost:8080/people](http://localhost:8080/people).
   Same panel. Switch to Delivery: it loads, the title row shows "People register unavailable",
   person rows show employee IDs instead of names, and the Hours and cost units are disabled
   because they need rates. Person-months and percent still edit. `docker compose start people`
   and reload brings everything back.
3. **A wrong URL at runtime.** Change `PEOPLE_REMOTE_URL` in `docker-compose.yml` to any bad
   path and `docker compose up -d` without `--build`.

## Repository map

```
apps/
  shell/        Host. bootstrap.tsx is the composition root: fetches config.json, registers
                remotes, loads each remote's ./api and hands it to the other remote's ./mount.
                RemotePanel.tsx isolates a remote's failure. store/ holds currency + active user.
  people/       Remote. features/register (search), features/employee (rate history editing).
                store/ is a Redux Toolkit store: employees, rateRecords, plus read-only copies
                of Delivery's capacity data and the shell's host state. api.ts is what it publishes.
  delivery/     Remote. features/breakdown (tree), features/grid (staffing grid, cell editor,
                cell inspector). store/ holds projects, breakdownItems, allocations, plus copies
                of People's register and the host state. api.ts is what it publishes.
packages/
  domain/       TypeScript, no React, no DOM (the tsconfig removes the DOM lib). business rule lives here: calendar,
                 effective-dated rates, pricing, unit
                conversion, largest-remainder rounding, tree rules, cross-project capacity.
  contracts/    The published interfaces between the apps: PeopleApi, AllocationsApi,
                HostContext, MountContext. Types only. Apps depend on this, not on each other directly.
  fixtures/     The seed file, a validating loader, and fixture implementations of the two
                APIs used when a remote runs standalone.
  persistence/  A three-method storage adapter (load/save/clear) with localStorage and
                in-memory implementations.
  theme/        Design tokens and base CSS shared by the three apps. No components.
tooling/        Shared webpack factory (Module Federation, swc, css) and ambient type shims.
docker/         nginx configs and the entrypoint that writes config.json from env vars.
Dockerfile      One build stage (pnpm verify + build), three nginx stages, one per app.
```

Boundaries are enforced by tooling, ESLint forbids any app importing another
app, and forbids React, Redux, or app code inside `domain` and `contracts`. The domain package
cannot reference `window`, because its TypeScript config has no DOM library.

## Decisions

The brief leaves five things to the candidate. Here is what was chosen and why.

### Who computes cost: Delivery, from People's rate records

Delivery needs to show what a month of someone's work costs. To do that it needs two things: how many
hours the person works that month, which Delivery knows, and what that person costs per hour, which
People knows. There are two ways to get the answer.

This is the decision the brief says it assesses. People could have exposed "what does this
cost?" and Delivery could have asked. Instead People publishes its rate records through
`PeopleApi` (snapshot plus subscribe, read-only), and Delivery prices its own grid with the
pure functions in `@baseline/domain`.

- Option A, ask People for the answer. Delivery sends "how much does 88 hours of Okafor in March cost?"
  and People replies "€7,880".
- Option B, ask People for the ingredients. Delivery asks "what are Okafor's rates and dates?" and
  People replies "€80 from January 2025, €95 from 12 March 2026". Delivery then does the maths itself.

I chose option B, here is why:

Four reasons:

1. **Delivery has to work on its own.** With Option A, Delivery alone cannot show a single cost because nobody is there to answer. With
   Option B, Delivery just needs a copy of the rates, which it can load from a sample file when running
   alone.
2. **The maths calculation belongs to Delivery.** Splitting a month at 12 March into 8 days at the old rate and 14 days
   at the new rate depends on how Delivery spreads hours across working days. If People did the
   calculation, People would have to understand Delivery's rules about months and working days.
3. **Failure isolation.** If People crashes, Delivery keeps working. With Option B, Delivery still shows hours and
   person-months, and just puts "rates unavailable" in the cost column. With Option A, every cost cell
   would break the moment People went down.
4. **A small, stable contract.** Option B only needs People to hand over a list of rate records
   and say "tell me when they change". That is a tiny agreement that rarely needs to change. Option A
   would be a bigger

The trade-off: the rule "which rate applies on which day" lives in a shared library rather
than exclusively inside People. The library is pure, versioned, has no state and no React,
and People uses the same functions for its own rate preview, so there is one implementation
rather than two

## Tests

```bash
pnpm test
pnpm test pricing      # the reference calculation
pnpm verify
```
