import { expect } from '@playwright/test';

export const DEMO = { name: 'Demo Student', email: 'demo@studybuddy.si', password: 'demo1234' };

/** URL je korenska stran aplikacije (»/«). */
export const HOME_URL = /^https?:\/\/[^/]+\/$/;
/** URL je prijavna stran (»/login«). */
export const LOGIN_URL = /\/login$/;

/** Podnaslov na prijavni strani (»Prijava« oz. »Registracija«). */
export function authSubtitle(page) {
  return page.locator('.auth p.muted');
}

/** Zgornja vrstica z imenom uporabnika in gumbom »Odjava«. */
export function userBar(page) {
  return page.locator('header.topbar .user');
}

/** Vrednost statistične kartice na »Pregledu« (npr. »odprtih obveznosti«). */
export function statCard(page, text) {
  return page.locator('.card.stat', { hasText: text }).locator('.big');
}

/** Razdelek na »Pregledu« z danim naslovom (npr. »Zamujeno«). */
export function section(page, title) {
  return page.locator('section.card', { has: page.getByRole('heading', { name: title }) });
}

/** Klik na povezavo v zgornjem meniju. */
export async function openMenu(page, label) {
  await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: label })).toBeVisible();
}

/** Prijava z vnosom e-pošte in gesla na prijavni strani; preveri, da se odpre »Pregled«. */
export async function login(page, { name, email, password }) {
  await page.goto('/');
  await expect(page).toHaveURL(LOGIN_URL);
  await page.getByLabel('E-pošta').fill(email);
  await page.getByLabel('Geslo').fill(password);
  await page.getByRole('button', { name: 'Prijava', exact: true }).click();
  await expect(page).toHaveURL(HOME_URL);
  await expect(page.getByRole('heading', { name: 'Pregled' })).toBeVisible();
  await expect(userBar(page)).toContainText(name);
}

/** Zahtevek na API z žetonom, ki ga uporablja vmesnik (enako kot ukaza K1/K2 v konzoli). */
export function apiAsCurrentUser(page, url) {
  return page.evaluate(async (u) => {
    const r = await fetch(u, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('studybuddy_token') },
    });
    return { status: r.status, body: await r.text() };
  }, url);
}
