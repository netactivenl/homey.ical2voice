# iCalendar to Voice (current beta is compatible with Homey v2.x)
[<img align="right" src="https://github.com/netactivenl/com.logitech.harmony.hub/raw/master/assets/images/donate.png">](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=4XUDMSVD2EZ3J)
The iCalendar to Voice App is the missing link between your online (cloud) calendar and Athom's fantastic [Homey](http://www.athom.com) product.
This app adds flow cards and voice triggers that enable Homey to announce your (iCal) appointments and emit triggers so you can run flows based on appointments in your calendars.

## 1. Features
The iCalendar to Voice App enables your Homey to:

1. Trigger flows based on upcoming events in your calendar.
2. Announce your full schedule for today, tomorrow or a specific day of the week.
3. Announce your remaining schedule for today.
4. Announce your next appointment.
5. Announce your first appointment of tomorrow.

## 2. Supported Languages

The iCalendar to Voice App currently supports both English and Dutch languages. 
***
Please contact me, if you want to help translate the iCalendar to Voice App to other languages.
***

## 3. Native Voice Triggers (v0.1.4+)
The iCalendar to Voice App supports native voice triggers. Trigger keywords are in bold.

Try asking: **OK, Homey**:

* What is my **schedule/calendar** like?
* What is my **schedule/calendar** for **today/tomorrow/sunday/monday/tuesday/wednesday/thursday/friday/saturday**/?
* What is my **next appointment**?
* What is my **first appointment** for **tomorrow**?

You can alter the input to your liking, as long as you use the bolded **keywords** in the sentence.

## 4. Setup

### 4.1 Install the iCalendar to Voice app
On your Homey's interface go to "Apps". Hit the + sign in the top right corner. Then find and install the iCalendar to Voice app.
After the app is installed, you have access to its settings through the App's Settings screen and to the App itself from the Apps list on the Flows screen: iCalendar to Voice.

### 4.2 Configure your calendar(s)
On your Homey's interface go to "Apps" and click "iCalendar to Voice". Then click "Configure App". 
Add your calendar(s) by specifying a name and the link (URL) to your hosted calendar (ICS) file.
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/settings.png)

#### 4.2.1 Get a Google Calendar URL
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

### 4.3 Create flows
Add iCalendar to Voice from the Apps list to the "when..." or "...then" column of your flow and select the card you need.

**Let Homey announce your next appointment 30 minutes beforehand**
![](https://github.com/netactivenl/homey.ical2voice/raw/master/assets/images/example_flow3.png)

## 5. Backlog
* Add support for hourly recurring appointments.
* Add support for minutely recurring appointments.
* Add support for secondly recurring appointments.
* Add support for multiple recurrence cycles per appointment.
* Add support for exclusions.

## 6. Release history

### v1.0.0 (current)
* Fixed issue where app falsely reports recurring events.
* Added support for larger recurrence intervals.
* Added support for specific number of recurrences.

### v0.9.0 (current)
* Fixed issue due to internal Homey changes that made all calendar triggers fail.

### v0.1.4 (submitted, awaiting approval)
* Added support for native voice triggers.
* Added action flow card to announce your appointments for a specific day of the week.

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
