# Stanje testiranja in zagotavljanja kakovosti

Stanje na dan 7. 10. 2026. Vse aktivnosti se zaženejo lokalno (ukazi v [README](../README.md#testi-in-kakovost-kode))
in samodejno v CI ob vsakem pushu na `main` in pull requestu.

## Povzetek

| Del                  | Testov                           | Pokritost vrstic                                         |
| -------------------- | -------------------------------- | -------------------------------------------------------- |
| Backend (`server/`)  | 49 (13 enotskih, 36 API)         | 88,6 % (routes 97,5 %, services 100 %, middleware 100 %) |
| Frontend (`client/`) | 25 (16 enotskih, 9 komponentnih) | 25,6 %                                                   |
| **Skupaj**           | **74, vsi uspešni**              |                                                          |

## Aktivnosti

### 1. Enotsko testiranje – backend

- **Vrsta aktivnosti:** enotsko (unit) testiranje
- **Stanje:** prisotno, 13 testov, vsi uspešni
- **Pokriti del rešitve:** poslovna logika v `server/src/services/` – uteženo povprečje in povprečje, uteženo z ECTS (F9); začetek tedna, dni do roka, minute po dnevih (F10). Vključeni robni primeri: prazen seznam, utež 0, zaokroževanje, nedelja/ponedeljek, zamujen rok. Pokritost 100 %.
- **Orodja in ogrodja:** Vitest 3, `@vitest/coverage-v8`
- **Datoteke:** `server/tests/grades.unit.test.js`, `server/tests/stats.unit.test.js`

### 2. Integracijsko (API) testiranje – backend

- **Vrsta aktivnosti:** integracijsko testiranje REST API-ja (HTTP → Express → SQLite)
- **Stanje:** prisotno, 36 testov, vsi uspešni
- **Pokriti del rešitve:** vse končne točke (F1–F5, F7–F11): registracija/prijava, zaščitene poti brez/z neveljavnim žetonom, CRUD vseh virov, filtri, validacija (napačni enumi, datumi, lestvica ocen), kaskadno brisanje, **izolacija med uporabniki** (dostop do tujih podatkov vrne 404), neveljaven JSON, neznane poti. Vsak test uporablja svežo SQLite bazo v pomnilniku (`createDb(':memory:')`), zato so testi neodvisni.
- **Orodja in ogrodja:** Vitest 3, Supertest 7
- **Datoteke:** `server/tests/*.api.test.js`, pomožne funkcije v `server/tests/helpers.js`
- **Nepokrito:** `index.js` in `seed.js` (zagonski skripti), del vej filtrov (`course_id`, `type`) in iskanje zapiskov po predmetu.

### 3. Enotsko testiranje – frontend

- **Vrsta aktivnosti:** enotsko testiranje
- **Stanje:** prisotno, 16 testov, vsi uspešni
- **Pokriti del rešitve:** funkcije za formatiranje (`relativeDays`, `formatMinutes`, `formatClock`) in API odjemalec (pošiljanje žetona, obravnava 204, pretvorba napak, samodejna odjava ob 401) – F1, F11. `fetch` je nadomeščen z mock funkcijo.
- **Orodja in ogrodja:** Vitest 3 (okolje jsdom)
- **Datoteke:** `client/tests/format.test.js`, `client/tests/api.test.js`

### 4. Komponentno testiranje – frontend

- **Vrsta aktivnosti:** testiranje komponent uporabniškega vmesnika
- **Stanje:** delno, 9 testov, vsi uspešni
- **Pokriti del rešitve:** Pomodoro časovnik (F6) – odštevanje, pavza, menjava dolžine, shranjevanje ob koncu in ob predčasni prekinitvi (z lažnimi časovniki `vi.useFakeTimers`); prijavna stran (F1) – prikaz napake strežnika, preklop na registracijo, shranjevanje žetona.
- **Orodja in ogrodja:** React Testing Library 16, `@testing-library/user-event`, `@testing-library/jest-dom`, jsdom
- **Datoteke:** `client/tests/StudyTimer.test.jsx`, `client/tests/LoginPage.test.jsx`
- **Nepokrito:** strani Pregled, Predmeti, Obveznosti, Učenje, Zapiski, Ocene ter komponente Layout, CourseSelect, CourseTag, Status.

### 5. Statična analiza kode

- **Vrsta aktivnosti:** statična analiza (linting)
- **Stanje:** prisotno, 0 napak
- **Pokriti del rešitve:** celotna koda (server, client, testi)
- **Orodja in ogrodja:** ESLint 9 (`@eslint/js` recommended, `eslint-plugin-react-hooks`), konfiguracija `eslint.config.mjs`

### 6. Enotno oblikovanje kode

- **Vrsta aktivnosti:** preverjanje sloga kode
- **Stanje:** konfigurirano (`.prettierrc.json`, ukaz `npm run format:check`), v CI še ni vključeno
- **Pokriti del rešitve:** celotna koda
- **Orodja in ogrodja:** Prettier 3

### 7. Validacija vhodnih podatkov (zagotavljanje kakovosti v kodi)

- **Vrsta aktivnosti:** obrambno programiranje / validacija
- **Stanje:** prisotno na vseh končnih točkah, preverjeno z API testi
- **Pokriti del rešitve:** vsi vnosi v API (telo zahteve, parametri poizvedbe, ID-ji poti); omejitve tudi v shemi baze (`CHECK`, `NOT NULL`, tuji ključi s `ON DELETE CASCADE`)
- **Orodja in ogrodja:** Zod 3, SQLite omejitve

### 8. Neprekinjena integracija (CI)

- **Vrsta aktivnosti:** avtomatsko izvajanje preverjanj
- **Stanje:** konfigurirano (`.github/workflows/ci.yml`); začne delovati ob prvem pushu na GitHub
- **Pokriti del rešitve:** ob vsakem pushu/PR: `npm ci` → lint → vsi testi s pokritostjo → produkcijski build frontenda
- **Orodja in ogrodja:** GitHub Actions, Node.js 24

### 9. Ročno dimno (smoke) testiranje

- **Vrsta aktivnosti:** ročno/skriptno preverjanje delovanja celotne aplikacije
- **Stanje:** izvedeno enkratno, ni avtomatizirano
- **Pokriti del rešitve:** zagon strežnika na demo podatkih (`npm run seed`), prijava, `/api/dashboard`, `/api/grades/summary`, serviranje zgrajenega frontenda
- **Orodja in ogrodja:** curl

## Česa še ni (predlogi za nadaljnje vaje)

- End-to-end (E2E) testi v brskalniku (npr. Playwright)
- Komponentni testi preostalih strani
- Prag pokritosti v CI (npr. ≥ 80 % za backend)
- Testi zmogljivosti / obremenitve, varnostni pregled (npr. `npm audit` v CI, omejevanje poskusov prijave)

## Uporaba umetne inteligence

| Orodje                                                    | Za kaj je bilo uporabljeno                                                                                                                                                      | Kako je bil rezultat preverjen                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code (Anthropic), model Claude Opus 5.5, v VS Code | Generiranje kode aplikacije (backend, frontend), testov, konfiguracije (ESLint, Prettier, CI) in osnutka te dokumentacije ("vibe coding" – razvoj z agentom na podlagi navodil) | Zagon vseh testov (74/74 uspešnih), ESLint brez napak, uspešen produkcijski build, ročni dimni test API-ja na demo podatkih, ročni pregled delovanja v brskalniku [DOPOLNI: datum in kaj si preverila]. Agent je med razvojem sam odkril in popravil napako v testnem okolju (Node 26 globalni `localStorage` je prekril jsdom implementacijo). |

> Opomba: testi so bili generirani z istim orodjem kot koda, zato potrjujejo predvsem, da se koda obnaša tako,
> kot je bila zasnovana – ne nujno, da je zasnova pravilna. Pričakovane vrednosti v enotskih testih
> (npr. povprečje 7,2 za ocene 10 (30 %) in 6 (70 %)) so bile preverjene ročno.
