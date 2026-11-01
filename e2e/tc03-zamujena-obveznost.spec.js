// TC-03 – Sprememba stanja zamujene obveznosti v »Opravljeno« jo odstrani iz odprtih in zamujenih (F5, F10)
import { test, expect } from '@playwright/test';
import { resetDatabase } from './support/db.js';
import { DEMO, login, openMenu, section, statCard } from './support/app.js';

// Testni podatki
const TITLE = 'SQL vaje';
const COURSE = 'Podatkovne baze II';

// Predpogoji: S0 izveden ob zagonu testa (rok »SQL vaje« je 2 dni v preteklosti), 4 odprte, 1 zamujena obveznost.
test.beforeEach(() => resetDatabase());

test('TC-03 zamujena obveznost označena kot opravljena', async ({ page }) => {
  const row = page.locator('table tbody tr', { hasText: TITLE });
  const dueCell = row.locator('td').nth(2);
  const statusSelect = page.getByLabel(`Stanje ${TITLE}`);

  await test.step('1. Prijava in začetno stanje »Pregleda«', async () => {
    await login(page, DEMO);
    await expect(statCard(page, 'odprtih obveznosti')).toHaveText('4');
    await expect(statCard(page, 'zamujenih')).toHaveText('1');
    const overdue = section(page, 'Zamujeno').locator('li');
    await expect(overdue).toHaveCount(1);
    await expect(overdue).toContainText(`${TITLE} · Naloga`);
    await expect(overdue).toContainText(COURSE);
    await expect(overdue).toContainText('pred 2 dnevoma');
  });

  await test.step('2. Obveznosti – vrstica »SQL vaje«', async () => {
    await openMenu(page, 'Obveznosti');
    await expect(page.locator('table tbody tr')).toHaveCount(5);
    await expect(row).toContainText('Naloga · prioriteta nizka');
    await expect(row).toContainText(COURSE);
    await expect(dueCell).toHaveClass(/\berror\b/);
    await expect(statusSelect).toHaveValue('todo');
    await expect(statusSelect.locator('option:checked')).toHaveText('Za narediti');
  });

  await test.step('3. Izberi stanje »Opravljeno«', async () => {
    const saved = page.waitForResponse(
      (r) => r.url().includes('/status') && r.request().method() === 'PATCH',
    );
    await statusSelect.selectOption({ label: 'Opravljeno' });
    expect((await saved).ok()).toBe(true);
    await expect(statusSelect.locator('option:checked')).toHaveText('Opravljeno');
    await expect(dueCell).not.toHaveClass(/\berror\b/);
  });

  await test.step('4. Osveži stran', async () => {
    await page.reload();
    await expect(page.getByLabel(`Stanje ${TITLE}`).locator('option:checked')).toHaveText(
      'Opravljeno',
    );
  });

  await test.step('5. »Pregled« po spremembi', async () => {
    await page.getByRole('navigation').getByRole('link', { name: 'Pregled', exact: true }).click();
    await expect(statCard(page, 'odprtih obveznosti')).toHaveText('3');
    await expect(statCard(page, 'zamujenih')).toHaveText('0');
    await expect(section(page, 'Zamujeno')).toContainText('Nič ni zamujeno.');
  });
});
