import { expect, test, type Page } from '@playwright/test';

const API = 'http://localhost:3000/api/v1';
function token(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'admin-uat', role: 'admin', exp: Math.floor(Date.now()/1000)+3600 })}.signature`;
}
async function adminSession(page: Page) {
  await page.addInitScript(t => sessionStorage.setItem('learnflow_access_token', t), token());
  await page.addInitScript(() => localStorage.setItem('learnflow_product_tour_v1', 'completed'));
  await page.route(`${API}/auth/me`, route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:'admin-uat',name:'UAT Admin',email:'admin.uat@example.com',role:'admin',timezone:'Africa/Johannesburg',dateOfBirth:'1990-01-01T00:00:00.000Z',entitlement:{plan:'PRO',status:'ACTIVE',source:'SYSTEM'}})}));
  await page.route(`${API}/notifications`, route => route.fulfill({status:200,contentType:'application/json',body:'[]'}));
}
const managedUser = {
  _id:'66a000000000000000000001',name:'Inactive Learner',email:'inactive@example.com',role:'learner',timezone:'Africa/Johannesburg',createdAt:'2026-01-01T00:00:00.000Z',lastSeenAt:'2026-05-01T00:00:00.000Z',
  entitlement:{plan:'PRO',status:'ACTIVE',source:'ADMIN',startsAt:'2026-01-01T00:00:00.000Z',endsAt:'2026-12-31T00:00:00.000Z'},capabilities:{},
  presence:{isOnline:false,lastSeenAt:'2026-05-01T00:00:00.000Z'},inactivity:{days:126,cleanupThresholdDays:90,eligible:true},
  aiUsage:{month:{total:18,succeeded:17,plans:4,coach:14,rejectedQuota:1}},subscription:{durationDays:364,daysRemaining:118,progressPercent:68}
};

test('admin sees activity, AI, subscription and cleanup status in one table', async ({page}) => {
  await adminSession(page);
  await page.route(`${API}/admin/users**`, route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([managedUser])}));
  await page.goto('/admin/entitlements');
  await expect(page.getByRole('heading',{name:'User management'})).toBeVisible();
  await expect(page.getByText('Inactive Learner')).toBeVisible();
  await expect(page.getByText('Offline')).toBeVisible();
  await expect(page.getByText('4 plans · 14 coach')).toBeVisible();
  await expect(page.getByText('118 days remaining')).toBeVisible();
  await expect(page.getByText('126 days')).toBeVisible();
  await expect(page.getByText('Eligible',{exact:true})).toBeVisible();
});

test('eligible inactive user can be cleared only after reason and explicit confirmation', async ({page}) => {
  await adminSession(page);
  await page.route(`${API}/admin/users**`, route => {
    if(route.request().method()==='DELETE') return;
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([managedUser])});
  });
  let deleteBody:any=null;
  await page.route(`${API}/admin/users/${managedUser._id}`, async route => {
    if(route.request().method()==='DELETE') {
      deleteBody=route.request().postDataJSON();
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({message:'Inactive account and owned application data were cleared.'})});
    } else await route.continue();
  });
  let dialogCount=0;
  page.on('dialog', async dialog => { dialogCount++; await dialog.accept(dialog.type()==='prompt'?'Inactive for UAT cleanup':undefined); });
  await page.goto('/admin/entitlements');
  await page.getByRole('button',{name:'Clear account'}).click();
  await expect.poll(()=>dialogCount).toBe(2);
  await expect.poll(()=>deleteBody).not.toBeNull();
  expect(deleteBody).toEqual({reason:'Inactive for UAT cleanup',confirmation:'DELETE'});
});
