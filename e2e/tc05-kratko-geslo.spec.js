// TC-05 – Registracija z geslom dolžine 7 znakov je zavrnjena s sporočilom o napaki (F1, F11)
import { test, expect } from '@playwright/test';
import { resetDatabase } from './support/db.js';
import { authSubtitle, LOGIN_URL } from './support/app.js';

// Testni podatki
const MARKO = { name: 'Marko Kos', email: 'marko.kos@studybuddy.test', password: 'Marko12' };

// Predpogoji: S0, uporabnik ni prijavljen, marko.kos@studybuddy.test ne obstaja.
test.beforeEach(() => resetDatabase());

test('TC-05 registracija z geslom 7 znakov je zavrnjena', async ({ page }) => {
  expect(MARKO.password).toHaveLength(7); // mejna vrednost 8 − 1

  await test.step('1. Odpri aplikacijo', async () => {
    await page.goto('/');
    await expect(page).toHaveURL(LOGIN_URL);
    await expect(authSubtitle(page)).toHaveText('Prijava');
  });

  await test.step('2. Klikni »Nimaš računa? Registriraj se«', async () => {
    await page.getByRole('button', { name: 'Nimaš računa? Registriraj se' }).click();
    await expect(authSubtitle(page)).toHaveText('Registracija');
    await expect(page.getByLabel('Ime')).toBeVisible();
    await expect(page.getByLabel('E-pošta')).toBeVisible();
    await expect(page.getByLabel('Geslo')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ustvari račun' })).toBeVisible();
  });

  await test.step('3. Vnesi podatke', async () => {
    await page.getByLabel('Ime').fill(MARKO.name);
    await page.getByLabel('E-pošta').fill(MARKO.email);
    await page.getByLabel('Geslo').fill(MARKO.password);
    await expect(page.getByLabel('Ime')).toHaveValue(MARKO.name);
    await expect(page.getByLabel('E-pošta')).toHaveValue(MARKO.email);
    await expect(page.getByLabel('Geslo')).toHaveValue(MARKO.password);
  });

  await test.step('4. Klikni »Ustvari račun«', async () => {
    await page.getByRole('button', { name: 'Ustvari račun' }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'Validation failed: password – Password must be at least 8 characters',
    );
    await expect(page).toHaveURL(LOGIN_URL);
    await expect(authSubtitle(page)).toHaveText('Registracija');
    await expect(page.getByRole('navigation')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Odjava' })).toHaveCount(0);
  });

  await test.step('5. Klikni »Že imaš račun? Prijava«', async () => {
    await page.getByRole('button', { name: 'Že imaš račun? Prijava' }).click();
    await expect(authSubtitle(page)).toHaveText('Prijava');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByLabel('E-pošta')).toHaveValue(MARKO.email);
    await expect(page.getByLabel('Geslo')).toHaveValue(MARKO.password);
  });

  await test.step('6. Klikni »Prijava«', async () => {
    await page.getByRole('button', { name: 'Prijava', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(LOGIN_URL);
  });
});
