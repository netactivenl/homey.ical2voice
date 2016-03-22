# iCalendar to Voice
The iCalendar to Voice App if the missing link between your online (cloud) calendar and Athom's fantastic [Homey](http://www.athom.com) product. 

## 1. Features
The iCalendar to Voice App (v0.1.3) enables your Homey to:

1. Trigger flows based on upcoming events in your calendar.
2. Announce your schedule for today.
3. Announce your remaining schedule for today.
4. Announce your next appointment.
5. Announce your schedule for tomorrow.
6. Announce your first appointment of tomorrow.

## 2. Supported Languages

The iCalendar to Voice App supports both English and Dutch. 
***
Please contact me, if you want to help translate the App to other languages.
***
## 3. Setup

### 3.1 Install the iCalendar to Voice app
On your Homey's interface go to "Setting > Apps" and find and install the iCalendar to Voice app.
After the app is installed, you have access to its settings through the Settings screen and to the App itself from the Apps list on the Flows screen: iCalendar to Voice.

### 3.2 Configure your calendar(s)
On your Homey's interface go to "Settings". Select the iCalendar to Voice App. 
Add your calendar(s) by specifying a name and the link (URL) to your hosted calendar (ICS) file.
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/settings.png)

#### 3.2.1 Get a Google Calendar URL
You can find the link to your Google Calendar through the following steps:

**1. Open Google Calendar and go to Settings:**
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/settings_menu.png)

**2. Go to the Calendars tab and click the calendar you want:**
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/calendar_settings.png)

**3. Right click the green ICAL button and get the Private Address of your calendar by copying the address:**
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/ical.png)

***
Other ICS calenders should also work. Please let me know if you've tested the App with another online calendar service!
***

### 3.3 Create flows
Drag iCalendar to Voice from the Apps list in the sidebar into the "when..." or "...then" column of your flow and select the card you need.

**Ask Homey for your next appointment** 
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/example_flow.png)

**Let Homey announce your next appointment one minute beforehand**
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/example_flow2.png)

## Backlog
* Add support for native voice triggers.
* Add support for announcement of the schedule for a specific weekday.
* Add support for hourly recurring appointments.
* Add support for minutely recurring appointments.
* Add support for secondly recurring appointments.
* Add support for larger recurrence intervals (now 1 is assumed for each event).
* Add support for specific number of recurrences.
* Add support for multiple recurrence cycles per appointment.
* Add support for exclusions.

## Release history

### v0.1.3 (current)
* Added support for yearly, monthly, weekly and daily recurring appointments.
* Added location to next appointment trigger flow card.
* Fixed announcement of multiple events for today's schedule, today's remaining schedule and tomorrow's schedule.

### v0.1.2
* Added trigger flow card for next appointment.

### v0.1.0
* Added action flow card to announce your next appointment.
* Added action flow card to announce your schedule for today.
* Added action flow card to announce your remaining schedule for today.
* Added action flow card to announce your schedule for tomorrow.
* Added action flow card to announce your first appointment for tomorrow.

#### Credits
Kudo's for the node.js lib to parse iCal files go to [@peterbraden](https://github.com/peterbraden).
