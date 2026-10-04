import {test,expect} from '@playwright/test';
test('poster start, blank setup, ten real template previews and newsletter loading',async({page})=>{
 await page.goto('./#/poster');await expect(page.getByRole('heading',{name:'Poster Maker',exact:true})).toBeVisible();await expect(page.locator('canvas')).toHaveCount(0);
 await page.getByRole('button',{name:'Create Blank Poster',exact:true}).click();await page.getByLabel('Size',{exact:true}).selectOption('square');await page.getByLabel('Style',{exact:true}).selectOption('dark');await page.getByRole('button',{name:'Create Poster',exact:true}).click();
 await expect(page.getByLabel('Canvas size')).toHaveValue('square');await expect(page.locator('.layer-list button')).toHaveCount(0);await expect(page.locator('canvas')).toBeVisible();
 await page.getByRole('link',{name:'Browse templates'}).click();await expect(page.getByRole('button',{name:/Use template:/})).toHaveCount(10);await expect(page.locator('.real-template-preview canvas').first()).toBeVisible();
 await page.getByRole('button',{name:'Use template: Check-In Newsletter',exact:true}).click();await expect(page.getByLabel('Poster template')).toHaveValue('newsletter');await expect(page.locator('.layer-list button')).toHaveCount(10);
});
