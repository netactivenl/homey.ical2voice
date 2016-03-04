# nl.netactive.homey.ical2voice #
This repo containing the sources of the iCalendar to Voice App for Athom's fantastic [Homey](http://www.athom.com) product.

### 1. Install the iCalendar to Voice app ###
On your Homey's interface go to "Setting > Apps" and find and install the iCalendar to Voice app.
After the app is installed, you have access to its settings through the Settings screen and to the App itself from the Apps list on the Flows screen: iCalendar to Voice.

### 2. Setup your calendars ###
On your Homey's interface go to "Settings". Select the iCalendar to Voice App. Add your calendars by specifying a name and the link (URL) to your hosted calendar file.
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/settings.png)

#### 2.1 Google Calendars ####
You can find the link to your Google Calendar through the following steps:

1. Open Google Calendar and go to Settings:
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/settings_menu.png)

2. Then go to the Calendars tab and click the calendar you want:
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/calendar_settings.png)

3. Right click the green ICAL button and get the Private Address of your calendar by copying the address:
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/ical.png)

### 3. Create a flow using one of the iCalendar to Voice cards ###
Drag iCalendar to Voice from the Apps list in the sidebar into the "...then" column of your flow and select the card you need. 
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/example_flow.png)

## Next release ##

Nothing planned yet.

## Release history ##

### v0.1.0 (submitted, awaiting approval) ###
* Added flow card to announce your next appointment.
* Added flow card to announce your schedule for today.
* Added flow card to announce your remaining schedule for today.
* Added flow card to announce your schedule for tomorrow.
* Added flow card to announce your first appointment for tomorrow.

#### Credits ####
Kudo's for the node.js lib to parse iCal files go to [@peterbraden](https://github.com/peterbraden).
