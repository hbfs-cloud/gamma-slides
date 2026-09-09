/** Follow the same visible M → action path a reader uses. */
export async function orbitBranch(page,name){
 if(await page.locator('.gamma-orbit-panel').isVisible())await page.locator('.gamma-orbit-hub').click();
 else if(await page.locator('.gamma-orbit').getAttribute('data-open')!=='true')await page.locator('.gamma-orbit-hub').click();
 await page.locator('[data-orbit='+name+']').click();
}
export async function orbitAction(page,source){
 if(!await page.locator('.gamma-orbit-panel').isVisible())await orbitBranch(page,'actions');
 const id=await source.getAttribute('data-gamma-orbit-id');if(!id)throw new Error('Source action has no menu registration');
 return page.locator('[data-orbit-source="'+id+'"]');
}
