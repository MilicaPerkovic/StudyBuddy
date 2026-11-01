// TC-04 – Spodnja meja lestvice ocen: ocena 4.5 je zavrnjena, ocena 5 je sprejeta in upoštevana (F9)
import { test, expect } from '@playwright/test';
import { resetDatabase } from './support/db.js';
import { DEMO, login, openMenu } from './support/app.js';

// Testni podatki
const COURSE = 'Zanesljivost in testiranje IS';
const LABEL = 'Kolokvij 1';
const WEIGHT = '100';
const BELOW = '4.5';
const ON_BOUNDARY = '5';

// Predpogoji: S0 – skupno povprečje 8.68, ZITS brez ocen, PB2 9.5, ST 8.
test.beforeEach(() => resetDatabase());

test('TC-04 ocena 4.5 je zavrnjena, ocena 5 sprejeta', async ({ page }) => {
  const overall = page.locator('.card.stat .big');
  const card = (name) => page.locator('article.card', { has: page.getByRole('heading', { name }) });
  const average = (name) => card(name).locator('p strong');
  const gradeInput = page.getByLabel('Ocena');
  const labelInput = page.getByLabel('Opis');

  // Beleženje zahtevkov za shranjevanje ocene (dokaz, da 4.5 ni bila poslana strežniku).
  const gradePosts = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && new URL(r.url()).pathname === '/api/grades') gradePosts.push(r);
  });

  await test.step('1. Prijava kot demo', async () => {
    await login(page, DEMO);
  });

  await test.step('2. Ocene – začetno stanje', async () => {
    await openMenu(page, 'Ocene');
    await expect(overall).toHaveText('8.68');
    await expect(average(COURSE)).toHaveText('—');
    await expect(card(COURSE)).toContainText('· 6 ECTS');
    await expect(card(COURSE).locator('li')).toHaveCount(0);
  });

  await test.step('3. Vnos podatkov z oceno 4.5', async () => {
    // Popravek iz 3. naloge: izbirnik nima vidne oznake »Predmet«, prvi predmet je že izbran.
    await page.getByRole('combobox', { name: 'Predmet' }).selectOption({ label: COURSE });
    await labelInput.fill(LABEL);
    await gradeInput.fill(BELOW);
    await page.getByLabel('Utež %').fill(WEIGHT);
    await expect(labelInput).toHaveValue(LABEL);
    await expect(gradeInput).toHaveValue(BELOW);
  });

  await test.step('4. Klikni »Dodaj« – brskalnik prepreči oddajo', async () => {
    await page.getByRole('button', { name: 'Dodaj' }).click();
    // Brskalnikova validacija: vrednost pod min="5" (besedilo opozorila je odvisno od brskalnika, zato ga ne preverjamo).
    expect(await gradeInput.evaluate((el) => el.validity.rangeUnderflow)).toBe(true);
    expect(await gradeInput.evaluate((el) => el.validationMessage)).not.toBe('');
    await expect(labelInput).toHaveValue(LABEL);
    expect(gradePosts).toHaveLength(0);
    await expect(card(COURSE).locator('li')).toHaveCount(0);
    await expect(average(COURSE)).toHaveText('—');
    await expect(overall).toHaveText('8.68');
  });

  await test.step('5. Vnesi oceno 5 in klikni »Dodaj«', async () => {
    const saved = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/grades' && r.request().method() === 'POST',
    );
    await gradeInput.fill(ON_BOUNDARY);
    await page.getByRole('button', { name: 'Dodaj' }).click();
    expect((await saved).status()).toBe(201);
    await expect(labelInput).toHaveValue('');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  await test.step('6. Kartice predmetov in skupno povprečje', async () => {
    const items = card(COURSE).locator('li');
    await expect(items).toHaveCount(1);
    await expect(items).toContainText(`${LABEL}: 5 (100 %)`);
    await expect(average(COURSE)).toHaveText('5');
    await expect(overall).toHaveText('7.38');
    await expect(average('Podatkovne baze II')).toHaveText('9.5');
    await expect(average('Spletne tehnologije')).toHaveText('8');
  });
});
