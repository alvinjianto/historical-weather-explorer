import { test, expect } from '@playwright/test';

test('app loads and renders the main heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WeatherHistory' })).toBeVisible();
});

test('shows default London location on load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('input[placeholder="Search city..."]')).toHaveValue('London, United Kingdom');
});

test('shows Sign in with Google button when auth is enabled', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});

test('shows auth error banner on ?error=auth', async ({ page }) => {
  await page.goto('/?error=auth');
  await expect(page.getByText('Sign-in failed. Please try again.')).toBeVisible();
});
