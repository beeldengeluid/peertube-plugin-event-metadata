function register ({ registerHook, peertubeHelpers }) {
  const { markdownRenderer } = peertubeHelpers

  const markdownToHTML = async (str) => {
    const result = await markdownRenderer.textMarkdownToHTML(str)
    if (!result) return result

    return result.replace(/^\s*<p>/, '')
                 .replace(/<\/p>\s*$/, '')
  }

  registerHook({
    target: 'filter:video-watch.video-plugin-metadata.result',

    handler: async (metadata, { video }) => {
      const pluginData = video.pluginData
      if (!pluginData?.eventUrl) return metadata

      metadata.push({
        label: 'Event name',
        safeHTML: `<a target="_blank" rel="noopener noreferrer" href="${pluginData.eventUrl}">${pluginData.eventName}</a>`
      })

      if (pluginData.eventSuperEvent) {
        metadata.push({
          label: 'Super event',
          safeHTML: await markdownToHTML(pluginData.eventSuperEvent)
        })
      }

      if (pluginData.eventStartDate) {
        metadata.push({
          label: 'Event start date',
          value: new Date(pluginData.eventStartDate).toLocaleString()
        })
      }

      if (pluginData.eventEndDate) {
        metadata.push({
          label: 'Event end date',
          value: new Date(pluginData.eventEndDate).toLocaleString()
        })
      }

      if (pluginData.eventLocation) {
        metadata.push({
          label: 'Event location',
          safeHTML: await markdownToHTML(pluginData.eventLocation)
        })
      }

      if (pluginData.eventOrganizer) {
        metadata.push({
          label: 'Event organizer',
          safeHTML: await markdownToHTML(pluginData.eventOrganizer)
        })
      }

      if (Array.isArray(pluginData.eventPerformers) && pluginData.eventPerformers.length !== 0) {
        const promises = pluginData.eventPerformers
          .map(p => markdownToHTML(p))

        metadata.push({
          label: 'Event performers',
          safeHTML: (await Promise.all(promises)).join(', ')
        })
      }

      return metadata
    }
  })
}

export {
  register
}
