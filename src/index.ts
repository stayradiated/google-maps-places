import * as process from 'node:process'
import puppeteer from 'puppeteer-core'
import type { Page } from 'puppeteer-core'

let globalNextIndex = 0
const debug = async (page: Page) => {
  const index = globalNextIndex
  globalNextIndex += 1
  const filename = `screenshot_${index}.png`
  await page.screenshot({ path: filename })
}

const consent = async (page: Page) => {
  await debug(page)

  const button = await page.$(
    'form[action="https://consent.google.com/save"]:nth-of-type(2) button',
  )
  if (!button) {
    throw new Error('Could not find accept consent button!')
  }

  await button.click()
  await debug(page)

  await page.waitForNavigation()
  await debug(page)
}

const exportSavedPlaces = async (page: Page) => {
  await debug(page)

  const result = await page.evaluate(() => {
    const button = document.querySelector(`button[jsaction='pane.follow']`)
    const list =
      button?.parentElement?.parentElement?.querySelector(`div[tabindex='-1']`)
    if (!list) {
      return []
    }

    return Array.from(list.children)
      .map((item) => {
        if (item.getAttribute('role') === 'presentation') {
          return undefined
        }

        const title = item.querySelector('h3')?.textContent ?? ''
        const description =
          item.querySelector('p.fontBodyMedium')?.textContent ?? ''

        return {
          title,
          description,
        }
      })
      .filter(Boolean)
  })

  console.log({ result })

  return result
}

void (async function () {
  const url = process.argv[2]
  if (typeof url !== 'string' || !url.startsWith('https://goo.gl/maps/')) {
    throw new Error('Must pass Google URL as argument!')
  }

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--lang=en-US,en'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  await page.goto(url)

  if (page.url().startsWith('https://consent.google.com')) {
    await consent(page)
  }

  await exportSavedPlaces(page)

  await browser.close()
})()
