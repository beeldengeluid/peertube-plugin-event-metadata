# PeerTube plugin Event Metadata

This plugin for the PeerTube platform gives the option to add event data to a video upload by importing structured event data from an event page URL. The event data is fetched and parsed from JSON+LD linked event metadata or added manually if the event page doesn't contain a linked data meta tag.

### Main tab on video upload/edit

Form field:

* Event page URL

### Plugin settings tab on video upload/edit

Form fields:

* Event name
* Event start date (ISO 8601 date format)
* Event end date (ISO 8601 date format)
* Event location (Markdown is supported)
* Event organizer (Markdown is supported)
* Event performers (Multiple performers are separated by a , character. Markdown is supported)
* Super event (Markdown is supported)

https://schema.org/Event

### How to use

* Log in as admin in your PeerTube instance
* Go to Plugin/Themes in the Administration section
* Search plugins for 'event-metadata'
* Click on Install
