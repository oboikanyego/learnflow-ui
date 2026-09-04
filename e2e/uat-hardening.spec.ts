import { expect, test, type Page } from '@playwright/test';

type Role = 'learner' | 'admin';
const API = 'http://localhost:3000/api/v1';

function token(expOffsetSeconds = 3600): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'uat-user', role: 'learner', exp: Math.floor(Date.now() / 1000) + expOffsetSeconds })}.signature`;
}

function user(role: Role = 'learner') {
  return { id: 'uat-user', name: role === 'admin' ? 'UAT Admin' : 'UAT Learner', email: `${role}.uat@example.com`, role, timezone: 'Africa/Johannesburg', dateOfBirth: '2000-01-15T00:00:00.000Z', entitlement: { plan: 'FREE', status: 'ACTIVE', source: 'SYSTEM' } };
}

async function setToken(page: Page, value: string) {
  await page.addInitScript(t => sessionStorage.setItem('learnflow_access_token', t), value);
}

async function mockSession(page: Page, role: Role = 'learner') {
  await page.route(`${API}/auth/me`, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user(role)) }));
  await page.route(`${API}/auth/registration-policy`, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ minimumAge: 13 }) }));
  await page.route(`${API}/notifications`, route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

test('logged-out users are redirected away from protected routes', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login\?.*returnUrl=%2Fprofile/);
  await expect(page.getByRole('heading', { name: 'Sign in to LearnFlow' })).toBeVisible();
});

test('expired JWTs are cleared and redirected to sign in', async ({ page }) => {
  await setToken(page, token(-60));
  await page.goto('/today');
  await expect(page).toHaveURL(/\/login/);
  const stored = await page.evaluate(() => sessionStorage.getItem('learnflow_access_token'));
  expect(stored).toBeNull();
});

test('server-rejected sessions are terminated globally', async ({ page }) => {
  await setToken(page, token());
  await page.route(`${API}/auth/me`, route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Token expired' }) }));
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login/);
  const stored = await page.evaluate(() => sessionStorage.getItem('learnflow_access_token'));
  expect(stored).toBeNull();
});

test('learners cannot render admin-only routes', async ({ page }) => {
  await setToken(page, token());
  await mockSession(page, 'learner');
  await page.route(`${API}/**`, route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/admin');
  await expect(page).not.toHaveURL(/\/admin(?:\/|$)/);
});

test('admins can enter admin routes', async ({ page }) => {
  await setToken(page, token());
  await mockSession(page, 'admin');
  await page.route(`${API}/admin/overview`, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) }));
  await page.route(`${API}/admin/**`, route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin$/);
});

test('sign in returns the user to the originally requested protected page', async ({ page }) => {
  await page.route(`${API}/auth/login`, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: token(), user: user('learner') }) }));
  await mockSession(page, 'learner');
  await page.goto('/login?returnUrl=%2Fprofile');
  await page.getByLabel('Email').fill('learner.uat@example.com');
  await page.getByLabel('Password').fill('StrongUatPassword123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'Profile & security' })).toBeVisible();
});

for (const viewport of [{ width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
  test(`authenticated profile has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await setToken(page, token());
    await mockSession(page, 'learner');
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile & security' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('Video Finder shows a useful empty state when no lessons exist', async ({ page }) => {
  await setToken(page, token());
  await mockSession(page, 'learner');
  await page.route(`${API}/videos/lessons**`, route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/videos');
  await expect(page.getByText('No lessons matched your search.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Select a lesson first' })).toBeVisible();
});
