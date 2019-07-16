function register ({ registerHook }) {
  registerHook({
    target: 'filter:video-watch.video-plugin-metadata.result',

    handler: (metadata, { video }) => {
      const pluginData = video.pluginData
      if (!pluginData?.eventUrl) return metadata

      metadata.push({
        label: 'Event URL',
        safeHTML: `<a target="_blank" rel="noopener noreferrer" href="${pluginData.eventUrl}">${pluginData.eventUrl}</a>`
      })

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
          value: pluginData.eventLocation
        })
      }

      if (pluginData.eventOrganizer) {
        metadata.push({
          label: 'Event organizer',
          value: pluginData.eventOrganizer
        })
      }

      if (Array.isArray(pluginData.eventPerformers)) {
        metadata.push({
          label: 'Event performers',
          value: pluginData.eventPerformers.join(', ')
        })
      }

      return metadata
    }
  })
}

export {
  register
}
