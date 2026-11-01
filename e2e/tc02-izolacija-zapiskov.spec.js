// TC-02 – Uporabnik ne vidi in ne more odpreti zapiska drugega uporabnika (F2)
import { test, expect } from '@playwright/test';
import { resetDatabase } from './support/db.js';
import {
  apiAsCurrentUser,
  authSubtitle,
  DEMO,
  LOGIN_URL,
  login,
  openMenu,
  statCard,
  userBar,
} from './support/app.js';

// Testni podatki
const B = { name: 'Tester B', email: 'tester.b@studybuddy.test', password: 'TesterB123' };
const COURSE_B = 'Predmet B';
const SEARCH = 'Piramida';
const FOREIGN_NOTE_ID = 1;

// Predpogoji: S0 – demo ima zapisek »Piramida testiranja« z ID 1, uporabnik B ne obstaja.
test.beforeEach(() => resetDatabase());

test('TC-02 uporabnik B ne vidi zapiska uporabnika demo', async ({ page }) => {
  const noteCards = page.locator('article.card');

  await test.step('1. Prijava kot demo', async () => {
    await login(page, DEMO);
  });

  await test.step('2. Zapiski uporabnika demo', async () => {
    await openMenu(page, 'Zapiski');
    await expect(noteCards).toHaveCount(2);
    await expect(noteCards.filter({ hasText: 'Piramida testiranja' })).toContainText(
      'Enotski > integracijski > E2E testi.',
    );
    await expect(noteCards.filter({ hasText: 'useEffect' })).toHaveCount(1);
  });

  await test.step('3. K1 – tuji zapisek ima ID 1', async () => {
    const res = await apiAsCurrentUser(page, '/api/notes');
    expect(res.status).toBe(200);
    const notes = JSON.parse(res.body).map((n) => `${n.id} ${n.title}`);
    expect(notes).toEqual(
      expect.arrayContaining([`${FOREIGN_NOTE_ID} Piramida testiranja`, '2 useEffect']),
    );
  });

  await test.step('4. Odjava', async () => {
    await userBar(page).getByRole('button', { name: 'Odjava' }).click();
    await expect(page).toHaveURL(LOGIN_URL);
    await expect(authSubtitle(page)).toHaveText('Prijava');
  });

  await test.step('5. Registracija uporabnika B', async () => {
    await page.getByRole('button', { name: 'Nimaš računa? Registriraj se' }).click();
    await page.getByLabel('Ime').fill(B.name);
    await page.getByLabel('E-pošta').fill(B.email);
    await page.getByLabel('Geslo').fill(B.password);
    await page.getByRole('button', { name: 'Ustvari račun' }).click();
    await expect(page.getByRole('heading', { name: 'Pregled' })).toBeVisible();
    await expect(userBar(page)).toContainText(B.name);
    await expect(statCard(page, 'predmetov')).toHaveText('0');
  });

  await test.step('6. Zapiski – B nima predmetov', async () => {
    await page.getByRole('navigation').getByRole('link', { name: 'Zapiski' }).click();
    await expect(page.getByText('Najprej dodaj predmet na strani Predmeti.')).toBeVisible();
    await expect(page.getByText('Piramida testiranja')).toHaveCount(0);
  });

  await test.step('7. Predmeti – demo predmeti niso vidni', async () => {
    await openMenu(page, 'Predmeti');
    await expect(page.getByText('Dodaj svoj prvi predmet.')).toBeVisible();
    await expect(page.locator('article.card')).toHaveCount(0);
    for (const name of [
      'Zanesljivost in testiranje IS',
      'Spletne tehnologije',
      'Podatkovne baze II',
    ]) {
      await expect(page.getByText(name)).toHaveCount(0);
    }
  });

  await test.step('8. Dodaj predmet »Predmet B«', async () => {
    await page.getByLabel('Ime predmeta').fill(COURSE_B);
    await page.getByRole('button', { name: 'Dodaj' }).click();
    const courses = page.locator('article.card');
    await expect(courses).toHaveCount(1);
    await expect(courses.getByRole('heading')).toHaveText(COURSE_B);
    await expect(courses).toContainText('6 ECTS');
    await expect(courses).toContainText('Povprečje: — · Odprte obveznosti: 0');
  });

  await test.step('9. Zapiski – prazen seznam', async () => {
    await openMenu(page, 'Zapiski');
    await expect(page.getByPlaceholder('Išči po zapiskih…')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nov zapisek' })).toBeVisible();
    await expect(page.getByText('Ni zapiskov.')).toBeVisible();
    await expect(noteCards).toHaveCount(0);
  });

  await test.step('10. Iskanje »Piramida«', async () => {
    // Namesto fiksne pavze (»počakaj 1 s«) počakamo na odgovor iskalnega zahtevka.
    const searched = page.waitForResponse(
      (r) => r.url().includes(`/api/notes?q=${SEARCH}`) && r.request().method() === 'GET',
    );
    await page.getByPlaceholder('Išči po zapiskih…').fill(SEARCH);
    expect((await searched).status()).toBe(200);
    await expect(page.getByText('Ni zapiskov.')).toBeVisible();
    await expect(noteCards).toHaveCount(0);
    await expect(page.getByText('Piramida testiranja')).toHaveCount(0);
  });

  await test.step('11. K2 – neposreden dostop do zapiska z ID 1', async () => {
    const res = await apiAsCurrentUser(page, `/api/notes/${FOREIGN_NOTE_ID}`);
    expect(res.status).toBe(404);
    expect(JSON.parse(res.body)).toEqual({ error: 'Not found' });
  });
});
