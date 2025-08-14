export async function gradualScrollToBottom(page) {
  await page.evaluate(async () => {
    const scrollStep = () => {
      return new Promise(resolve => {
        let totalHeight = 0;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, 100);
          totalHeight += 100;

          if(totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    };
    
    await scrollStep();
  });

  await page.waitForTimeout(3000);
}