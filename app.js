"use strict";
var ical = require("ical");
var moment = require("moment");
var async = require("async");

var self = module.exports = {
    enableSpeech: true,
    calendars: [],
    refreshIntervalInMinutes: 5,
    updateCalendarsIntervalId: null,

    init: function() {
        self.log("Initializing iCalendar to Voice app...");

        // Set calendar locale.
        moment.locale(__("moment_locale"));

        // Read calendars from settings.
        self.calendars = Homey.manager("settings").get("calendars") || [];
        self.log("Loaded " + self.calendars.length + " calendar(s) from settings.");

        // Listen for flow triggers.
        Homey.manager("flow").on("trigger.next_appointment_in", self.next_appointment_in_trigger);
        Homey.manager("flow").on("action.todays_schedule", self.todays_schedule_action);
        Homey.manager("flow").on("action.todays_remaining_schedule", self.todays_remaining_schedule_action);
        Homey.manager("flow").on("action.next_appointment", self.next_appointment_action);
        Homey.manager("flow").on("action.tomorrows_schedule", self.tomorrows_schedule_action);
        Homey.manager("flow").on("action.tomorrows_first_appointment", self.tomorrows_first_appointment_action);

        // Update calendars after 2 seconds and every X minutes.
        setTimeout(self.updateCalendars, 2000);
        self.refreshIntervalInMinutes = Homey.manager("settings").get("calendar_refresh_interval") || self.refreshIntervalInMinutes;
        self.updateCalendarsIntervalId = setInterval(self.updateCalendars.bind(this), self.refreshIntervalInMinutes * 60 * 1000);
        
        // Check each calendar's next event every 1 minute.
        setInterval(self.triggerNextEventPerCalendar.bind(this), 60 * 1000);

        self.log("Initializing iCalendar to Voice app completed.");
    },
    updateCalendars: function() {
        if (self.calendars) {
            self.calendars.forEach(function(calendar) {
                self.updateCalendarEvents(calendar, function(error, events) {
                    if (error) {
                        self.log(error);
                    } else {
                        self.log("Calendar '" + calendar.name + "' updated, " + events.length + " event(s) found. Next update in " + self.refreshIntervalInMinutes + " minute(s).");
                    }
                });
            });
        }
    },
    triggerNextEventPerCalendar: function () {
        self.log("Triggering next event per calendar...");
        if (self.calendars) {
            self.calendars.forEach(function(calendar) {
                var nextEvent = self.getNextEvent(calendar.events);

                if (nextEvent) {
                    var tokens = {
                        calendar: calendar.name,
                        date: nextEvent.start.format("YYYY-MM-DD"),
                        time: nextEvent.start.format("HH:mm"),
                        summary: nextEvent.summary,
                        location: nextEvent.location
                    };

                    var state = nextEvent.departure || nextEvent.start;

                    //console.log("Next appointment's tokens: " + JSON.stringify(tokens));

                    Homey.manager("flow").trigger("next_appointment_in", tokens, state);
                }
            });
        }
    },
    next_appointment_in_trigger: function(callback, args, state) {
        self.log("trigger.next_appointment_in");

        if (args.timespan_number !== "" && args.timespan_unit !== "" && state) {
            var timespanInMinutes = parseInt(args.timespan_number);
            if (args.timespan_unit === "hours") {
                timespanInMinutes *= 60;
            }

            var eventStart = moment(state);
            var triggerMoment = moment().add(timespanInMinutes, "m");

            var isSameMoment = eventStart.isSame(triggerMoment, "minute");
            if (isSameMoment) {
                self.log("trigger.next_appointment_in continued.");
            }

            callback(null, isSameMoment);
        } else {
            callback(null, false);
        }
    },
    todays_schedule_action: function(callback, args) {
        self.log("action.todays_schedule");

        self.getEventsForDate(moment(), function(error, events) {
            if (error) {
                callback(error, false);
            } else {
                if (events.length === 0) {
                    self.announce(__("speech_no_appointments_today"));
                } else if (events.length === 1) {
                    self.announce(__("speech_one_appointment_today"));
                    self.announceEvent(events[0]);
                } else {
                    var sortedEvents = self.sortArray(events, "start");
                    self.announce(__("speech_multiple_appointments_today").replace("{0}", sortedEvents.length));
                    sortedEvents.forEach(function(event) {
                        self.announceEvent(event);
                    });
                }

                callback(null, true);
            }
        });
    },
    todays_remaining_schedule_action: function(callback, args) {
        self.log("action.todays_remaining_schedule");

        self.getEventsForDate(moment(), function(error, events) {
            if (error) {
                callback(error, false);
            } else {
                // Filter for remaining events only.
                var todaysRemainingEvents = [];
                events.forEach(function(event) {
                    if (event.start.isAfter(moment())) {
                        todaysRemainingEvents.push(event);
                    }
                });

                if (todaysRemainingEvents.length === 0) {
                    self.announce(__("speech_no_more_appointments_today"));
                } else if (todaysRemainingEvents.length === 1) {
                    self.announce(__("speech_one_more_appointment_today"));
                    self.announceEvent(todaysRemainingEvents[0]);
                } else {
                    var sortedEvents = self.sortArray(todaysRemainingEvents, "start");
                    self.announce(__("speech_multiple_appointments_remaining_today").replace("{0}", sortedEvents.length));
                    sortedEvents.forEach(function(event) {
                        self.announceEvent(event);
                    });
                }

                callback(null, true);
            }
        });
    },
    next_appointment_action: function(callback, args) {
        self.log("action.next_appointment");

        self.getEvents(function(error, events) {
            if (error) {
                callback(error, false);
            } else {
                var nextEvent = self.getNextEvent(events);
                if (nextEvent) {
                    self.announce(__("speech_next_appointment").replace("{0}", self.toLocal(nextEvent.start).calendar()));
                    self.announce(nextEvent.summary);
                } else {
                    self.announce(__("speech_no_appointments"));
                }

                callback(null, true);
            }
        });
    },
    tomorrows_schedule_action: function(callback, args) {
        self.log("action.tomorrows_schedule");

        self.getEventsForDate(moment().add(1, "days"), function(error, events) {
            if (error) {
                callback(error, false);
            } else {
                if (events.length === 0) {
                    self.announce(__("speech_no_appointments_tomorrow"));
                } else if (events.length === 1) {
                    self.announce(__("speech_one_appointment_tomorrow"));
                    self.announceEvent(events[0]);
                } else {
                    var sortedEvents = self.sortArray(events, "start");
                    self.announce(__("speech_multiple_appointments_tomorrow").replace("{0}", sortedEvents.length));
                    sortedEvents.forEach(function(event) {
                        self.announceEvent(event);
                    });
                }

                callback(null, true);
            }
        });
    },
    tomorrows_first_appointment_action: function(callback, args) {
        self.log("action.tomorrows_first_appointment");

        var tomorrowsFirstEvent = null;
        self.getEventsForDate(moment().add(1, "days"), function(error, events) {
            if (error) {
                callback(error, false);
            } else {
                // Find tommorow's first
                events.forEach(function(event) {
                    if (event.start.isAfter(moment()) && (tomorrowsFirstEvent === null || event.start.isBefore(tomorrowsFirstEvent.start))) {
                        tomorrowsFirstEvent = event;
                    }
                });

                if (tomorrowsFirstEvent !== null) {
                    self.announce(__("speech_tomorrows_first_appointment").replace("{0}", self.toLocal(tomorrowsFirstEvent.start).format("LT")));
                    self.announce(tomorrowsFirstEvent.summary);
                } else {
                    self.announce(__("speech_no_appointments_tomorrow"));
                }

                callback(null, true);
            }
        });
    },
    toLocal: function(dateTime) {
        var localDateTime = moment(dateTime);
        localDateTime.local();
        return localDateTime;
    },
    getNextEvent: function(events) {
        var nextEvent = null;

        if (events) {
            events.forEach(function (event) {
                var eventMoment = self.toLocal(event.departure || event.start);
                var nextEventMoment = null;
                if (nextEvent) {
                    nextEventMoment = self.toLocal(nextEvent.departure || nextEvent.start);
                }
                if (eventMoment.isAfter(moment()) && (nextEventMoment === null || eventMoment.isBefore(nextEventMoment))) {
                    nextEvent = event;
                }
            });
        }

        return nextEvent;
    },
    getEventsForDate: function(date, callback) {
        self.getEvents(function(error, events) {
            if (error) {
                callback(error, null);
            } else {
                var eventsForDate = [];
                
                events.forEach(function (event) {
                    // TODO: Add support for recurring events on date!
                    if (self.toLocal(event.start).isSame(date, "day")) {
                        eventsForDate.push(event);
                    }
                });

                callback(null, eventsForDate);
            }
        });
    },
    getEvents: function(callback) {
        if (self.calendars && self.calendars.length && self.calendars.length > 0) {
            async.map(self.calendars,
                function(calendar, innerCallback) {
                    innerCallback(null, calendar.events);
                },
                function(error, events) {
                    callback(error, [].concat.apply([], events));
                });
        } else {
            callback(__("no_ical_calendars_configured"), null);
        }
    },
    updateCalendarEvents: function(calendar, callback) {
        ical.fromURL(calendar.url, {}, function(error, data) {
            //self.log(JSON.stringify(data));
            if (error) {
                callback(error, false);
            } else {
                // We return all events since this morning.
                var today = moment().startOf("day");
                
                // Clear any previous events in the calendar.
                if (calendar.events) {
                    calendar.events.length = 0;
                }
                else {
                    calendar.events = [];
                }

                for (var k in data) {
                    if (data.hasOwnProperty(k)) {
                        var event = data[k];

                        if (event.type === "VEVENT" && event.start) {
                            var occurrences;
                            if (event.rrule) {
                                // Recurring event, determine any relevant ocurrences.
                                occurrences = self.getRelevantEventOccurrences(event);
                                //if (occurrences)
                                //    self.log("Found " + occurrences.length + " occurrences for '" + event.summary + "' in the next year.");
                                //else
                                //    self.log("Found no occurrences for '" + event.summary + "' in the next year.");
                            } else {
                                // Single occurrence.
                                occurrences = [moment.utc(event.start).local()];
                            }

                            if (occurrences) {
                                for (var i = 0; i < occurrences.length; i++) {
                                    (function(e, start) {
                                        if (start.isSameOrAfter(today)) {
                                            var eventDurationInMilliseconds = moment.utc(e.end).diff(moment.utc(e.start));
                                            var eventDuration = moment.duration(eventDurationInMilliseconds);

                                            var end = moment.utc(e.start).local();
                                            end.add(eventDuration);

                                            //self.log(JSON.stringify(event));

                                            var eventDetails = {
                                                id: e.uid,
                                                start: start,
                                                end: end,
                                                summary: e.summary,
                                                description: e.description,
                                                location: e.location,
                                                departure: null
                                            };

                                            if (e.location && e.location.length > 0) {
                                                // If event has a location, we can try determine the approximate travel time.
                                                self.setTravelTimeInMinutes(eventDetails);
                                            }

                                            calendar.events.push(eventDetails);
                                        }
                                    })(event, occurrences[i]);
                                }
                            }
                        }
                    }
                }

                //self.log(events.length + " events retrieved from ical: " + calendar.url);
                callback(null, calendar.events);
            }
        });
    },
    setTravelTimeInMinutes: function (event) {
        if (!event.location || event.location.length <= 0) {
            return;
        }

        // TODO: Determine travel time.
        var travelTimeInMinutes = null;

        // If we found the travel time, we can set the departure time.
        if (travelTimeInMinutes) {
            event.departure = moment(event.start).substract(travelTimeInMinutes, "minutes");
        }
    },
    getRelevantEventOccurrences: function(event) {
        var now = moment().startOf("day");
        var lastAcceptedOccurrence = moment(now).add(1, "y");
        if (event.rrule.options.until !== null && moment.utc(event.rrule.options.until).isBefore(now)) {
            //self.log("No more reccurrences for event '" + event.summary + "' (ended: " + moment(event.rrule.options.until).format() + ").");
            return null;
        }

        //self.log("Determining next recurrence for event '" + event.summary + "'...");

        // Get next yearly recurrence.
        if (event.rrule.options.freq === 0) {
            var nextYearlyRecurrence = moment.utc(event.start).year(now.year());
            if (nextYearlyRecurrence.isBefore(now)) {
                nextYearlyRecurrence.add(1, "y");
            }

            return [nextYearlyRecurrence];
        }

        // Get monthly recurrences during the next year.
        if (event.rrule.options.freq === 1) {
            var monthlyOccurrences = [];
            var nextMonthlyRecurrence = moment.utc(event.start).year(now.year()).month(now.month());
            while (nextMonthlyRecurrence.isSameOrBefore(lastAcceptedOccurrence)) {
                if (nextMonthlyRecurrence.isSameOrAfter(now)) {
                    monthlyOccurrences.push(nextMonthlyRecurrence);
                }
                nextMonthlyRecurrence.add(1, "M");
            }

            return monthlyOccurrences;
        }

        // Get weekly recurrences during the next year.
        if (event.rrule.options.freq === 2) {
            //if (event.summary === "Raymond: VRIJ") self.log(JSON.stringify(event));
            var firstWeeklyOccurrence = moment(event.start);
            var dow = [firstWeeklyOccurrence.day()];
            if (event.rrule.options.byweekday && event.rrule.options.byweekday.length > 1) {
                dow = [];
                event.rrule.options.byweekday.forEach(function(byweekday) {
                    // BUG: Correct byweekday (must shift one day of week).
                    byweekday++;
                    if (byweekday > 7) {
                        byweekday -= 7;
                    }
                    dow.push(byweekday);
                });
            }

            //self.log("valid dow: " + JSON.stringify(dow));
            
            var weeklyOccurrences = [];
            var nextWeeklyRecurrence = moment();
            nextWeeklyRecurrence.hour(firstWeeklyOccurrence.hour());
            nextWeeklyRecurrence.minute(firstWeeklyOccurrence.minute());
            nextWeeklyRecurrence.second(firstWeeklyOccurrence.second());
            while (nextWeeklyRecurrence.isSameOrBefore(lastAcceptedOccurrence)) {
                if (nextWeeklyRecurrence.isSameOrAfter(now) && dow.indexOf(nextWeeklyRecurrence.day()) > -1) {
                    weeklyOccurrences.push(moment(nextWeeklyRecurrence).utc());
                }
                nextWeeklyRecurrence.add(1, "d");
            }

            return weeklyOccurrences;
        }

        // Get daily recurrences during the next year.
        if (event.rrule.options.freq === 3) {
            var firstOccurrence = moment(event.start);

            var dailyOccurrences = [];
            var nextDailyRecurrence = moment();
            nextDailyRecurrence.hour(firstOccurrence.hour());
            nextDailyRecurrence.minute(firstOccurrence.minute());
            nextDailyRecurrence.second(firstOccurrence.second());
            
            while (nextDailyRecurrence.isSameOrBefore(lastAcceptedOccurrence)) {
                if (nextDailyRecurrence.isSameOrAfter(now)) {
                    dailyOccurrences.push(nextDailyRecurrence);
                }
                nextDailyRecurrence.add(1, "d");
            }
            
            return dailyOccurrences;
        }
        
        // TODO: Add support for hourly recurrences.
        // TODO: Add support for minutely recurrences.
        // TODO: Add support for secondly recurrences.

        // TODO: Add support for larger recurrence intervals (now 1 is assumed for each event).
        // TODO: Add support for specific number of recurrences.
        // TODO: Add support for multiple recurrence cycles.
        // TODO: Add support for exclusions.

        self.log("No recurrence found for event '" + event.summary + " (start: " + moment.utc(event.start).format() + "): " + JSON.stringify(event.rrule.options));

        return null;
    },
    announceEvent: function (event) {
        var announcement = __("speech_appointment_at").replace("{0}", event.summary).replace("{1}", self.toLocal(event.start).format("LT"));
        self.announce(announcement);
    },
    announce: function(announcement) {
        self.log("[VOICE] " + announcement);
        if (self.enableSpeech) {
            Homey.manager("speech-output").say(announcement);
        }
    },
    updateSettings: function (settings, callback) {
        // Update settings.
        self.calendars = settings.calendars;
        self.refreshIntervalInMinutes = parseInt(settings.refreshIntervalInMinutes);
        //self.log("Settings updated: " + JSON.stringify(settings));
        
        // Stop/start calendar updates using new interval.
        if (self.updateCalendarsIntervalId) {
            clearInterval(self.updateCalendarsIntervalId);
        }
        
        // Update calendars after 2 seconds and every X minutes.
        setTimeout(self.updateCalendars, 2000);
        self.updateCalendarsIntervalId = setInterval(self.updateCalendars.bind(this), self.refreshIntervalInMinutes * 60 * 1000);

        // Return success
        if (callback) callback(null, true);
    },
    sortArray: function(arr, param) {
        return arr.slice(0).sort(function(a, b) {
            return (a[param] > b[param]) ? 1 : (a[param] < b[param]) ? -1 : 0;
        });
    },
    log: function(message) {
        Homey.log(moment().format("HH:mm:ss.SSS") + " - " + message);
    }
};