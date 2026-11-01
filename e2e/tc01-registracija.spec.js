// TC-01 – Registracija novega uporabnika ustvari račun, s katerim se je mogoče prijaviti (F1)
import { test, expect } from '@playwright/test';
import { resetDatabase } from './support/db.js';
import { authSubtitle, HOME_URL, LOGIN_URL, section, statCard, userBar } from './support/app.js';

// Testni podatki
const ANA = { name: 'Ana Novak', email: 'ana.novak@studybuddy.test', password: 'AnaNovak123' };

// Predpogoji: S0 (sveža baza z demo podatki, Ana Novak ne obstaja); nov kontekst brskalnika = uporabnik ni prijavljen.
test.beforeEach(() => resetDatabase());

test('TC-01 registracija novega uporabnika in ponovna prijava', async ({ page }) => {
  await test.step('1. Odpri aplikacijo', async () => {
    await page.goto('/');
    await expect(page).toHaveURL(LOGIN_URL);
    await expect(page.getByRole('heading', { name: '📚 StudyBuddy' })).toBeVisible();
    await expect(authSubtitle(page)).toHaveText('Prijava');
    await expect(page.getByLabel('E-pošta')).toBeVisible();
    await expect(page.getByLabel('Geslo')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Prijava', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nimaš računa? Registriraj se' })).toBeVisible();
  });

  await test.step('2. Klikni »Nimaš računa? Registriraj se«', async () => {
    await page.getByRole('button', { name: 'Nimaš računa? Registriraj se' }).click();
    await expect(authSubtitle(page)).toHaveText('Registracija');
    await expect(page.getByLabel('Ime')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ustvari račun' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Že imaš račun? Prijava' })).toBeVisible();
  });

  await test.step('3. Vnesi ime, e-pošto in geslo', async () => {
    await page.getByLabel('Ime').fill(ANA.name);
    await page.getByLabel('E-pošta').fill(ANA.email);
    await page.getByLabel('Geslo').fill(ANA.password);
    await expect(page.getByLabel('Ime')).toHaveValue(ANA.name);
    await expect(page.getByLabel('E-pošta')).toHaveValue(ANA.email);
    // geslo je prikazano zakrito
    await expect(page.getByLabel('Geslo')).toHaveAttribute('type', 'password');
  });

  await test.step('4. Klikni »Ustvari račun«', async () => {
    await page.getByRole('button', { name: 'Ustvari račun' }).click();
    await expect(page).toHaveURL(HOME_URL);
    await expect(page.getByRole('heading', { name: 'Pregled' })).toBeVisible();
    await expect(userBar(page)).toContainText(ANA.name);
    await expect(userBar(page).getByRole('button', { name: 'Odjava' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  await test.step('5. Preberi kartice na »Pregledu«', async () => {
    await expect(statCard(page, 'odprtih obveznosti')).toHaveText('0');
    await expect(statCard(page, 'zamujenih')).toHaveText('0');
    await expect(statCard(page, 'učenja ta teden')).toHaveText('0 min');
    await expect(statCard(page, 'predmetov')).toHaveText('0');
    await expect(section(page, 'Prihajajoči roki')).toContainText('Ni prihajajočih rokov 🎉');
    await expect(section(page, 'Zamujeno')).toContainText('Nič ni zamujeno.');
  });

  await test.step('6. Klikni »Odjava«', async () => {
    await userBar(page).getByRole('button', { name: 'Odjava' }).click();
    await expect(page).toHaveURL(LOGIN_URL);
    await expect(authSubtitle(page)).toHaveText('Prijava');
  });

  await test.step('7. Ponovna prijava z istimi podatki', async () => {
    await page.getByLabel('E-pošta').fill(ANA.email);
    await page.getByLabel('Geslo').fill(ANA.password);
    await page.getByRole('button', { name: 'Prijava', exact: true }).click();
    await expect(page).toHaveURL(HOME_URL);
    await expect(page.getByRole('heading', { name: 'Pregled' })).toBeVisible();
    await expect(userBar(page)).toContainText(ANA.name);
  });
});
