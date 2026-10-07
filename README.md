# StudyBuddy

Spletna aplikacija za načrtovanje študija: predmeti, obveznosti (naloge, izpiti, projekti),
beleženje časa učenja s Pomodoro časovnikom, zapiski in ocene z izračunom povprečja.

- **Backend:** Node.js, Express 5, SQLite (vgrajen modul `node:sqlite`), JWT avtentikacija, Zod validacija
- **Frontend:** React 19, React Router 7, Vite 6
- **Testiranje:** Vitest, Supertest, React Testing Library, ESLint, Prettier, GitHub Actions

Seznam funkcionalnosti: [docs/FUNKCIONALNOSTI.md](docs/FUNKCIONALNOSTI.md)
Stanje testiranja: [docs/STANJE_TESTIRANJA.md](docs/STANJE_TESTIRANJA.md)

## Vzpostavitev

### Predpogoji

- **Node.js ≥ 22.13** (zaradi vgrajenega modula `node:sqlite`; preverjeno na Node 26). Preveri z `node -v`.
- npm (priložen Node.js). Ločena namestitev baze ni potrebna – SQLite datoteka se ustvari sama.

### Namestitev

```bash
git clone <url-repozitorija> StudyBuddy
cd StudyBuddy
npm install          # namesti odvisnosti za server/ in client/ (npm workspaces)
npm run seed         # (neobvezno) demo uporabnik in vzorčni podatki
```

Demo prijava po `npm run seed`: **demo@studybuddy.si / demo1234**

### Zagon v razvojnem načinu

```bash
npm run dev
```

- API: http://localhost:3001 (preverjanje: http://localhost:3001/api/health)
- Spletni vmesnik: http://localhost:5173 (Vite posreduje `/api` zahteve na port 3001)

### Produkcijski zagon

```bash
npm start            # zgradi client/dist in zažene strežnik, ki servira tudi frontend
```

Aplikacija je nato dostopna na http://localhost:3001.

### Okoljske spremenljivke (neobvezno)

| Spremenljivka | Privzeto                    | Opis                                                    |
| ------------- | --------------------------- | ------------------------------------------------------- |
| `PORT`        | `3001`                      | Port strežnika                                          |
| `JWT_SECRET`  | `dev-secret-change-me`      | Skrivnost za podpis JWT (v produkciji obvezno spremeni) |
| `DB_FILE`     | `server/data/studybuddy.db` | Pot do SQLite datoteke                                  |

### Testi in kakovost kode

```bash
npm test                 # vsi testi (server + client)
npm run test:coverage    # testi s poročilom o pokritosti (server/coverage, client/coverage)
npm run lint             # ESLint
npm run format:check     # Prettier
```

## Struktura projekta

```
server/
  src/
    app.js            Express aplikacija (createApp(db) – omogoča testiranje z bazo v pomnilniku)
    index.js          vstopna točka
    db.js             shema SQLite
    seed.js           demo podatki
    middleware/       JWT avtentikacija
    routes/           REST API (auth, courses, assignments, sessions, notes, grades, dashboard)
    services/         čista poslovna logika (povprečja, statistika)
  tests/              enotski in API (integracijski) testi
client/
  src/
    pages/            strani aplikacije
    components/       komponente (Layout, StudyTimer, …)
    utils/            API odjemalec, avtentikacija, formatiranje
  tests/              enotski in komponentni testi
.github/workflows/    CI (lint, testi s pokritostjo, build)
docs/                 dokumentacija
```

## REST API (povzetek)

Vse poti razen `/api/auth/register`, `/api/auth/login` in `/api/health` zahtevajo glavo
`Authorization: Bearer <token>`.

| Metoda         | Pot                                                  | Opis                                             |
| -------------- | ---------------------------------------------------- | ------------------------------------------------ |
| POST           | `/api/auth/register`                                 | registracija                                     |
| POST           | `/api/auth/login`                                    | prijava                                          |
| GET            | `/api/auth/me`                                       | trenutni uporabnik                               |
| GET/POST       | `/api/courses`                                       | seznam / nov predmet                             |
| GET/PUT/DELETE | `/api/courses/:id`                                   | predmet                                          |
| GET/POST       | `/api/assignments?status=&course_id=&type=&overdue=` | seznam s filtri / nova obveznost                 |
| GET/PUT/DELETE | `/api/assignments/:id`                               | obveznost                                        |
| PATCH          | `/api/assignments/:id/status`                        | sprememba stanja                                 |
| GET/POST       | `/api/sessions?from=&to=`                            | seje učenja                                      |
| DELETE         | `/api/sessions/:id`                                  | izbris seje                                      |
| GET/POST       | `/api/notes?q=&course_id=`                           | zapiski (z iskanjem)                             |
| GET/PUT/DELETE | `/api/notes/:id`                                     | zapisek                                          |
| GET/POST       | `/api/grades?course_id=`                             | ocene                                            |
| GET            | `/api/grades/summary`                                | povprečja po predmetih + skupno (uteženo z ECTS) |
| DELETE         | `/api/grades/:id`                                    | izbris ocene                                     |
| GET            | `/api/dashboard`                                     | pregledna plošča                                 |

## Znane omejitve

- Seje učenja in ocen ni mogoče urejati (samo dodajanje in brisanje).
- Časovni pas: tedenska statistika in "dni do roka" se računajo v UTC.
- Frontend komponente strani (razen prijave) še nimajo avtomatskih testov.
