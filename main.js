const htmlParser = require('node-html-parser')
const fetch = require('node-fetch')
const urlUtils = require('url')

async function register ({
  registerHook,
  storageManager,
  getRouter
}) {

  {
    const router = getRouter()
    router.post('/parse-event', parseEvent)
  }

  // Store and restore event metadata
  {
    registerHook({
      target: 'action:api.video.updated',
      handler: ({ video, body }) => {
        const pluginData = body.pluginData
        if (!pluginData || !pluginData.eventUrl) return

        let eventPerformers = []
        if (Array.isArray(pluginData.eventPerformers)) {
          eventPerformers = pluginData.eventPerformers
        } else if (typeof pluginData.eventPerformers === 'string' && pluginData.eventPerformers) {
          eventPerformers = pluginData.eventPerformers.split(',')
        }

        const json = {
          eventUrl: pluginData.eventUrl,
          eventName: pluginData.eventName,
          eventStartDate: pluginData.eventStartDate,
          eventEndDate: pluginData.eventEndDate,
          eventLocation: pluginData.eventLocation,
          eventOrganizer: pluginData.eventOrganizer,
          eventSuperEvent: pluginData.eventSuperEvent,
          eventPerformers
        }

        storageManager.storeData('event-metadata-' + video.uuid, json)
      }
    })

    registerHook({
      target: 'filter:api.video.get.result',
      handler: async (video) => {
        if (!video) return video
        if (!video.pluginData) video.pluginData = {}

        const result = await storageManager.getData('event-metadata-' + video.uuid)
        if (result) Object.assign(video.pluginData, result)

        return video
      }
    })

    // JSONLD recordedAt

    registerHook({
      target: 'filter:activity-pub.video.json-ld.build.result',
      handler: async (jsonld, { video }) => {
        if (!video) return video
        if (!video.pluginData) video.pluginData = {}

        const result = await storageManager.getData('event-metadata-' + video.uuid)
        if (result && result.eventUrl) Object.assign(jsonld, { recordedAt: result.eventUrl })

        return jsonld
      }
    })

    registerHook({
      target: 'filter:activity-pub.activity.context.build.result',
      handler: jsonld => {
        return jsonld.concat([ { recordedAt: 'https://schema.org/recordedAt' } ])
      }
    })

    // JSONLD in client HTML page

    registerHook({
      target: 'filter:html.client.json-ld.result',
      handler: async (jsonld, context) => {
        if (!context || !context.video) return jsonld

        const result = await storageManager.getData('event-metadata-' + context.video.uuid)
        if (result && result.eventUrl) Object.assign(jsonld, { recordedAt: result.eventUrl })

        return jsonld
      }
    })
  }
}

async function unregister () {
  return
}

module.exports = {
  register,
  unregister
}


// ---------------------------------------------------------------------------

function parseEvent (req, res) {
  const eventUrl = req.body.eventUrl

  if (!eventUrl) {
    return res.status(400).json({ error: 'No event URL provided' })
  }

  fetch(eventUrl)
    .then(response => response.text())
    .then(html => {
      const parsed = htmlParser.parse(html)
      const el = parsed.querySelector('script[type="application/ld+json"]')

      if (!el) {
        return res.status(400).json({ error: 'No JSON LD found in webpage' })
      }

      const jsonLD = JSON.parse(el.innerText)

      return res.json({
        name: jsonLD.name,
        description: jsonLD.description,

        language: jsonLD.inLanguage?.alternateName,

        startDate: jsonLD.startDate,
        endDate: jsonLD.endDate,
        location: jsonLD.location?.name,

        superEvent: jsonLD.superEvent
          ? toMarkdownUrl(eventUrl, jsonLD.superEvent.name, jsonLD.superEvent.url)
          : undefined,

        organizer: jsonLD.organizer
          ? toMarkdownUrl(eventUrl, jsonLD.organizer.name, jsonLD.organizer.url)
          : undefined,

        performers: Array.isArray(jsonLD.performers)
          ? jsonLD.performers.map(p => toMarkdownUrl(eventUrl, p.name, p.url))
          : []
      })
    })
    .catch(err => {
      res.status(500).json({ error: err.toString() })
    })
}

function toMarkdownUrl (webpageUrl, label, url) {
  if (!url) return label

  const absoluteUrl = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : new URL(url, webpageUrl)

  return '[' + label + '](' + absoluteUrl + ')'
}
