import { expect, test } from '@playwright/test';

test.describe('SouNativo Marketplace E2E', () => {
  test('renders landing page, LGPD cookie banner, and navigates to catalog', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/SouNativo/i);
    await expect(page.getByRole('navigation', { name: /navegação principal/i })).toBeVisible();

    await page.getByRole('link', { name: /explorar viagens/i }).first().click();
    await expect(page).toHaveURL(/\/trips/);
    await expect(page.getByRole('heading', { name: /todas as experiências/i })).toBeVisible();
  });

  test('opens trip details with interactive map, spot inventory, and dynamic SEO tags', async ({
    page,
  }) => {
    await page.goto('/trips');

    const firstTripLink = page.getByRole('link', { name: /ver pacote/i }).first();
    await expect(firstTripLink).toBeVisible();
    await firstTripLink.click();

    await expect(page).toHaveURL(/\/viagem\//);
    await expect(
      page.getByRole('heading', { name: /localização & pontos de embarque/i })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /avaliações de viajantes/i })).toBeVisible();

    const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonicalHref).toContain('/viagem/');
  });

  test('navigates verified agencies, local guides, and auth gate on dashboard', async ({
    page,
  }) => {
    await page.goto('/agencies');
    await expect(page.getByRole('heading', { name: /agências verificadas/i })).toBeVisible();

    await page.goto('/guides');
    await expect(page.getByRole('heading', { name: /guias de turismo locais/i })).toBeVisible();

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: /acesse seu painel sounativo/i })
    ).toBeVisible();
  });
});
