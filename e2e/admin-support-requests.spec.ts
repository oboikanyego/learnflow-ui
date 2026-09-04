import { expect, test, type Page } from '@playwright/test';

const API = 'http://localhost:3000/api/v1';

function token(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'uat-admin', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`;
}

async function adminSession(page: Page) {
  await page.addInitScript(t => sessionStorage.setItem('learnflow_access_token', t), token());
  await page.route(`${API}/auth/me`, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'uat-admin', name: 'UAT Admin', email: 'admin.uat@example.com', role: 'admin', timezone: 'Africa/Johannesburg', entitlement: { plan: 'FREE', status: 'ACTIVE', source: 'SYSTEM' } }) }));
  await page.route(`${API}/auth/registration-policy`, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ minimumAge: 13 }) }));
  await page.route(`${API}/notifications`, route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

test('admin can view and resolve support requests', async ({ page }) => {
  await adminSession(page);
  let resolved = false;
  await page.route(`${API}/admin/support-requests?*`, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    items: [{ _id: 'support-1', name: 'UAT Learner', email: 'learner.uat@example.com', subject: 'Video will not play', message: 'The selected lesson video does not start.', category: 'VIDEO', status: resolved ? 'RESOLVED' : 'OPEN', resolutionNote: resolved ? 'Video source was refreshed.' : undefined, createdAt: new Date().toISOString() }],
    page: 1, pageSize: 12, total: 1, totalPages: 1, counts: resolved ? { RESOLVED: 1 } : { OPEN: 1 }
  }) }));
  await page.route(`${API}/admin/support-requests/support-1/status`, async route => {
    const body = route.request().postDataJSON() as { status: string };
    resolved = body.status === 'RESOLVED';
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Support request marked resolved.' }) });
  });

  page.on('dialog', dialog => dialog.accept('Video source was refreshed.'));
  await page.goto('/admin/support-requests');
  await expect(page.getByRole('heading', { name: 'Support requests' })).toBeVisible();
  await expect(page.getByText('Video will not play')).toBeVisible();
  await page.getByRole('button', { name: 'Resolve' }).click();
  await expect(page.getByText('Resolved')).toBeVisible();
});
