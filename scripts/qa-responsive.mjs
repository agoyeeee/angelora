import { firefox } from '@playwright/test'

const BASE = 'http://localhost:5173'
const WIDTHS = [360, 390, 768, 1024, 1440]
const ROUTES = ['/', '/privacy', '/this-page-does-not-exist']

const browser = await firefox.launch()
const page = await browser.newPage()

const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message))

const report = []

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: width < 500 ? 780 : 900 })
    await page.goto(BASE + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(450) // let enter animations settle

    const metrics = await page.evaluate(() => {
      const de = document.documentElement
      const inner = window.innerWidth
      const offenders = []
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue
        if (r.right > inner + 1.5 || r.left < -1.5) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.getAttribute('class') || '').slice(0, 70),
            left: Math.round(r.left),
            right: Math.round(r.right),
          })
        }
      }
      return {
        inner,
        docScrollWidth: de.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        docClientWidth: de.clientWidth,
        offenders: offenders.slice(0, 8),
        offenderCount: offenders.length,
      }
    })

    const overflow = metrics.docScrollWidth - metrics.inner
    report.push({
      route,
      width,
      overflowPx: overflow,
      offenderCount: metrics.offenderCount,
      sample: metrics.offenders,
    })

    const tag = route === '/' ? 'landing' : route === '/privacy' ? 'privacy' : 'notfound'
    await page.screenshot({
      path: `/tmp/opencode/qa-${tag}-${width}.png`,
      fullPage: route !== '/' || width < 500,
    })
  }
}

console.log(JSON.stringify(report, null, 2))
console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors, null, 2))

await browser.close()
