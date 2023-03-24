let isUpdatingForm = false

function register ({ registerVideoField, registerHook, peertubeHelpers }) {
  buildFormInputs(registerVideoField)

  autoUpdateUploadForm(registerHook, peertubeHelpers)
}

export {
  register
}

// ---------------------------------------------------------------------------

function buildFormInputs (registerVideoField) {
  for (const type of [ 'upload', 'update' ]) {

    // Event URL in main tab
    {
      const videoFormOptions = { type, tab: 'main' }

      registerVideoField({
        name: 'eventUrl',
        label: 'Event page URL',
        descriptionHTML: type === 'upload'
          ? 'Copy the event page URL so PeerTube will automatically import event metadata'
          : undefined,

        type: 'input'
      }, videoFormOptions)

      registerVideoField({
        type: 'html',
        html: 'Fetching event metadata to fill the form...',
        hidden: () => !isUpdatingForm
      }, videoFormOptions)
    }

    // Other event metadata in plugin settings tab
    {
      const videoFormOptions = { type }

      registerVideoField({
        name: 'eventName',
        label: 'Event name',
        type: 'input'
      }, videoFormOptions)

      registerVideoField({
        name: 'eventStartDate',
        label: 'Event start date',
        type: 'input'
      }, videoFormOptions)

      registerVideoField({
        name: 'eventEndDate',
        label: 'Event end date',
        type: 'input'
      }, videoFormOptions)

      registerVideoField({
        name: 'eventLocation',
        label: 'Event location',
        descriptionHTML: 'Markdown is supported',
        type: 'input'
      }, videoFormOptions)

      registerVideoField({
        name: 'eventOrganizer',
        label: 'Event organizer',
        descriptionHTML: 'Markdown is supported',
        type: 'input'
      }, videoFormOptions)

      registerVideoField({
        name: 'eventPerformers',
        label: 'Event performers',
        descriptionHTML: 'Multiple performers are separated by a , character. Markdown is supported',
        type: 'input'
      }, videoFormOptions)

      registerVideoField({
        name: 'eventSuperEvent',
        label: 'Super event',
        descriptionHTML: 'Markdown is supported',
        type: 'input'
      }, videoFormOptions)
    }
  }
}

// ---------------------------------------------------------------------------

function autoUpdateUploadForm (registerHook, peertubeHelpers) {
  const supportedType = 'upload'

  let updateEditForm
  let previousEventUrl
  let debounceTimer

  registerHook({
    target: 'action:video-edit.init',
    handler: ({ type, updateForm }) => {
      if (type !== supportedType) return

      updateEditForm = updateForm
    }
  })

  registerHook({
    target: 'action:video-edit.form.updated',
    handler: ({ type, formValues }) => {
      if (type !== supportedType) return

      const eventUrl = formValues.pluginData?.eventUrl
      if (!eventUrl || eventUrl === previousEventUrl) return

      previousEventUrl = eventUrl

      if (debounceTimer) clearTimeout(debounceTimer)

      debounceTimer = setTimeout(() => {
        fillForm({ peertubeHelpers, updateEditForm, eventUrl })
      }, 250);
    }
  })
}

function fillForm (options) {
  const { eventUrl, peertubeHelpers, updateEditForm} = options

  console.log('Fetching event metadata')
  isUpdatingForm = true

  const headers = { 'Content-Type': 'application/json' }
  const body = JSON.stringify({ eventUrl })

  fetch(peertubeHelpers.getBaseRouterRoute() + '/parse-event', { method: 'POST', headers, body })
    .then(response => {
      return response.json()
        .then(json => ({ response, json }))
    })
    .then(({ response, json }) => {
      if (!response.ok) {
        peertubeHelpers.notifier.error('Cannot update event metadata: ' + json.error)
        return
      }

      updateEditForm({
        name: json.name,
        description: json.description,
        language: json.language,
        pluginData: {
          eventName: json.name,
          eventStartDate: json.startDate,
          eventEndDate: json.endDate,
          eventLocation: json.location,
          eventOrganizer: json.organizer,
          eventPerformers: json.performers.join(','),
          eventSuperEvent: json.superEvent,
        }
      })
    })
    .catch(err => {
      console.error(err)
      peertubeHelpers.notifier.error('Cannot update event metadata: ' + err.message)
    })
    .finally(() => {
      isUpdatingForm = false
    })
}
