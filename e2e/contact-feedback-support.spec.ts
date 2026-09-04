import { expect, test, type Page } from '@playwright/test';

const API = 'http://localhost:3000/api/v1';

function token(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'uat-user', role: 'learner', exp: Math.floor(Date.now()/1000)+3600 })}.signature`;
}

async function authenticated(page: Page) {
  await page.addInitScript(t => sessionStorage.setItem('learnflow_access_token', t), token());
  await page.addInitScript(() => localStorage.setItem('learnflow_product_tour_v1', 'completed'));
  await page.route(`${API}/auth/me`, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id:'uat-user', name:'UAT Learner', email:'learner.uat@example.com', role:'learner', timezone:'Africa/Johannesburg', entitlement:{plan:'FREE',status:'ACTIVE',source:'SYSTEM'} }) }));
  await page.route(`${API}/notifications`, route => route.fulfill({ status:200, contentType:'application/json', body:'[]' }));
}

test('home Contact link opens working public contact form and submits message', async ({ page }) => {
  let payload: any = null;
  await page.route(`${API}/messages/contact`, async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status:201, contentType:'application/json', body:JSON.stringify({ id:'msg-1', message:'Thanks — your message has been received.', notificationStatus:'SENT' }) });
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Contact' }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await page.getByLabel('Name').fill('Website Visitor');
  await page.getByLabel('Email').fill('visitor@example.com');
  await page.getByLabel('Subject').fill('LearnFlow question');
  await page.getByLabel('Message').fill('I would like to know more about LearnFlow.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Thanks — your message has been received.')).toBeVisible();
  expect(payload).toEqual({ name:'Website Visitor', email:'visitor@example.com', subject:'LearnFlow question', message:'I would like to know more about LearnFlow.' });
});

test('signed-in user can submit a five-star feedback rating', async ({ page }) => {
  await authenticated(page);
  let payload:any=null;
  await page.route(`${API}/messages/feedback`, async route => { payload=route.request().postDataJSON(); await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({message:'Thank you for rating LearnFlow. Your feedback has been received.'})}); });
  await page.goto('/feedback');
  await page.getByRole('button',{name:'5 stars'}).click();
  await page.getByLabel('Feedback area').click();
  await page.getByRole('option',{name:'Usability'}).click();
  await page.getByLabel('Tell me more').fill('The workflow is clear and easy to follow.');
  await page.getByRole('button',{name:'Send feedback'}).click();
  await expect(page.getByText('Thank you for rating LearnFlow. Your feedback has been received.')).toBeVisible();
  expect(payload.rating).toBe(5);
  expect(payload.category).toBe('USABILITY');
});

test('signed-in user can submit a support request', async ({ page }) => {
  await authenticated(page);
  let payload:any=null;
  await page.route(`${API}/messages/support`, async route => { payload=route.request().postDataJSON(); await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({message:'Your support request has been received.'})}); });
  await page.goto('/support');
  await page.getByLabel('Area').click();
  await page.getByRole('option',{name:'AI features'}).click();
  await page.getByLabel('Subject').fill('Planner did not finish');
  await page.getByLabel('What happened?').fill('The planner stayed in a loading state after I submitted my goal.');
  await page.getByRole('button',{name:'Send support request'}).click();
  await expect(page.getByText('Your support request has been received.')).toBeVisible();
  expect(payload).toEqual({category:'AI',subject:'Planner did not finish',message:'The planner stayed in a loading state after I submitted my goal.'});
});
