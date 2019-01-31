"use strict";

const Homey = require("homey");
const ical = require("ical");
const moment = require("moment");
const async = require("async");

var app = null;
var enableSpeech = false;
var calendars = [];
var refreshIntervalInMinutes = 5;
var updateCalendarsIntervalId = null;

// Code in repo:    https://github.com/netactivenl/homey.ical2voice
// SDK docs:        https://apps.developer.athom.com

module.exports = {
    init: function(appRef) {
        app = appRef;
        //enableSpeech = true;
        calendars = [];
        refreshIntervalInMinutes = 5;
        updateCalendarsIntervalId = null;
        
        // Set calendar locale.
        moment.locale(Homey.__("moment_locale"));

        // Read calendars from settings.
        calendars = Homey.ManagerSettings.get("calendars") || [];
        app.log("Loaded " + calendars.length + " calendar(s) from settings.");

        // Listen for flow triggers.
        let nextAppointmentInTrigger = new Homey.FlowCardTrigger("next_appointment_in");
        nextAppointmentInTrigger.registerRunListener(next_appointment_in_trigger).register();

        let todaysScheduleAction = new Homey.FlowCardAction("todays_schedule");
        todaysScheduleAction.registerRunListener(todays_schedule_action).register();

        let todaysRemainingScheduleAction = new Homey.FlowCardAction("todays_remaining_schedule");
        todaysRemainingScheduleAction.registerRunListener(todays_remaining_schedule_action).register();

        let nextAppointmentAction = new Homey.FlowCardAction("next_appointment");
        nextAppointmentAction.register().registerRunListener(next_appointment_action);

        let tomorrowsScheduleAction = new Homey.FlowCardAction("tomorrows_schedule");
        tomorrowsScheduleAction.registerRunListener(tomorrows_schedule_action).register();

        let tomorrowsFirstAppointmentAction = new Homey.FlowCardAction("tomorrows_first_appointment");
        tomorrowsFirstAppointmentAction.register().registerRunListener(tomorrows_first_appointment_action);

        let dayOfWeekAction = new Homey.FlowCardAction("weekday_schedule");
        dayOfWeekAction.register().registerRunListener(dow_schedule_action);

        // Listen for speech triggers.
        // TODO: Homey.manager('speech-input').on('speech', speech_in_trigger);

        // Update calendars after 2 seconds and every X minutes.
        setTimeout(updateCalendars, 2000);
        refreshIntervalInMinutes =
            Homey.ManagerSettings.get("calendar_refresh_interval") || refreshIntervalInMinutes;
        updateCalendarsIntervalId = 
            setInterval(updateCalendars, refreshIntervalInMinutes * 60 * 1000);

        // Check each calendar's next event every 1 minute.
        setInterval(triggerNextEventPerCalendar, 60 * 1000);
    },
    updateSettings: updateSettings
}

function speech_in_trigger(speech, callback) {

        app.log(JSON.stringify(speech));

        ///*
        //`speech` looks something like this:

        //{
        //    "transcript": "what is the weather tomorrow", (everything Homey has heard after 'OK Homey' until silence)
        //    "language": "en", // the spoken language
        //    "triggers": [
        //        {
        //            "id": "weather", // this ID corresponds with the ID in your app.json
        //            "position": 12, // position of first character in the complete sentence
        //            "text": "weather"
        //        },
        //        {
        //            "id": "tomorrow",
        //            "position": 20,
        //            "text": "tomorrow"
        //        }
        //    ],
        //    "zones": [], // list of zone ID's, when found some
        //    "time": false, // contain a time when a time or date has been found in the sentence
        //    "agent": "homey:app:com.athom.weather" // your app's URI
        //}
        //*/

        // Loop all triggers
        var triggers = [];
        speech.triggers.forEach(function(trigger) {
            triggers.push(trigger.id);
        });
        
        // Draw conclusions based on received triggers.
        if (triggers.indexOf("schedule") >= 0 || triggers.indexOf("calendar") >= 0) {
            if (triggers.indexOf("today") >= 0) {
                todays_schedule_action(function (err, result) {
                    // null, true when speech was meant for this app
                    callback(null, true);
                });
            } else {
                if (triggers.indexOf("tomorrow") >= 0) {
                    tomorrows_schedule_action(function(err, result) {
                        // null, true when speech was meant for this app
                        callback(null, true);
                    });
                } else {
                    if (triggers.indexOf("sunday") >= 0) {
                        dow_schedule_action(function(err, result) {
                            // null, true when speech was meant for this app
                            callback(null, true);
                        }, { dow: 0 });
                    } else {
                        if (triggers.indexOf("monday") >= 0) {
                            dow_schedule_action(function(err, result) {
                                // null, true when speech was meant for this app
                                callback(null, true);
                            }, { dow: 1 });
                        } else {
                            if (triggers.indexOf("tuesday") >= 0) {
                                dow_schedule_action(function(err, result) {
                                    // null, true when speech was meant for this app
                                    callback(null, true);
                                }, { dow: 2 });
                            } else {
                                if (triggers.indexOf("wednesday") >= 0) {
                                    dow_schedule_action(function(err, result) {
                                        // null, true when speech was meant for this app
                                        callback(null, true);
                                    }, { dow: 3 });
                                } else {
                                    if (triggers.indexOf("thursday") >= 0) {
                                        dow_schedule_action(function(err, result) {
                                            // null, true when speech was meant for this app
                                            callback(null, true);
                                        }, { dow: 4 });
                                    } else {
                                        if (triggers.indexOf("friday") >= 0) {
                                            dow_schedule_action(function(err, result) {
                                                // null, true when speech was meant for this app
                                                callback(null, true);
                                            }, { dow: 5 });
                                        } else {
                                            if (triggers.indexOf("saturday") >= 0) {
                                                dow_schedule_action(function(err, result) {
                                                    // null, true when speech was meant for this app
                                                    callback(null, true);
                                                }, { dow: 6 });
                                            } else {
                                                todays_remaining_schedule_action(function(err, result) {
                                                    // null, true when speech was meant for this app
                                                    callback(null, true);
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (triggers.indexOf("next_appointment") >= 0) {
            next_appointment_action(function (err, result) {
                // null, true when speech was meant for this app
                callback(null, true);
            });
        }
        
        if (triggers.indexOf("first_appointment") >= 0 && triggers.indexOf("tomorrow") >= 0) {
            tomorrows_first_appointment_action(function (err, result) {
                // null, true when speech was meant for this app
                callback(null, true);
            });
        }

        // true, null when speech wasn't meant for this app
        callback(true, null);
    }
function updateCalendars() {
    if (calendars) {
        calendars.forEach(function(calendar) {
            updateCalendarEvents(calendar, function(error, events) {
                if (error) {
                    app.log(error);
                } else {
                    app.log("Calendar '" + calendar.name + "' updated, " + events.length + " event(s) found. Next update in " + refreshIntervalInMinutes + " minute(s).");
                }
            });
        });
    }
}
function triggerNextEventPerCalendar() {
    app.log("Triggering next event per calendar...");
    if (calendars) {
        calendars.forEach(function(calendar) {
            var nextEvent = getNextEvent(calendar.events);
            if (nextEvent) {
                app.log("Next event found for calendar " + calendar.name + ": " + nextEvent.summary + " @" + nextEvent.start.format("HH:mm"));

                var tokens = {
                    calendar: calendar.name,
                    date: JSON.stringify(nextEvent.start.format("YYYY-MM-DD")),
                    time: nextEvent.start.format("HH:mm"),
                    summary: nextEvent.summary,
                    location: nextEvent.location
                };

                var state = { moment: nextEvent.departure || nextEvent.start };

                //console.app.log("Next appointment's tokens: " + JSON.stringify(tokens));
                //console.app.log("Next appointment's state: " + JSON.stringify(state));

                var nextAppointmentInTrigger = Homey.ManagerFlow.getCard("trigger", "next_appointment_in");
                nextAppointmentInTrigger
                    .trigger(tokens, state)
                    .catch(app.error);
            }
        });
    }
}
function next_appointment_in_trigger(args, state) {
    app.log("trigger.next_appointment_in");

    app.log("args: " + JSON.stringify(args));
    app.log("state: " + JSON.stringify(state));
    
    if (args.timespan_number !== "" && args.timespan_unit !== "" && state.moment) {
        var timespanInMinutes = parseInt(args.timespan_number);
        if (args.timespan_unit === "hours") {
            timespanInMinutes *= 60;
        }

        var eventStart = moment(state.moment);
        var triggerMoment = moment().add(timespanInMinutes, "m");

        var isSameMoment = eventStart.isSame(triggerMoment, "minute");
        if (isSameMoment) {
            app.log("trigger.next_appointment_in continued.");
        } else {
            app.log("trigger.next_appointment_in discontinued.");
        }

        return Promise.resolve(isSameMoment);
    } else {
        app.log("trigger.next_appointment_in abandoned.");
        return Promise.resolve(false);
    }
}
function todays_schedule_action(args, state) {
    app.log("action.todays_schedule");

    getEventsForDate(moment(), function(error, events) {
        if (error) {
            return Promise.resolve(false);
        } else {
            if (events.length === 0) {
                announce(Homey.__("speech_no_appointments_today"));
            } else if (events.length === 1) {
                announce(Homey.__("speech_one_appointment_today"));
                announceEvent(events[0]);
            } else {
                var sortedEvents = sortArray(events, "start");
                announce(Homey.__("speech_multiple_appointments_today").replace("{0}", sortedEvents.length));
                sortedEvents.forEach(function(event) {
                    announceEvent(event);
                });
            }
            
            return Promise.resolve(true);
        }
    });

    return Promise.resolve(true);
}
function todays_remaining_schedule_action(args, state) {
    app.log("action.todays_remaining_schedule");

    getEventsForDate(moment(), function(error, events) {
        if (error) {
            return Promise.resolve(false);
        } else {
            // Filter for remaining events only.
            var todaysRemainingEvents = [];
            events.forEach(function(event) {
                if (event.start.isAfter(moment())) {
                    todaysRemainingEvents.push(event);
                }
            });

            if (todaysRemainingEvents.length === 0) {
                announce(Homey.__("speech_no_more_appointments_today"));
            } else if (todaysRemainingEvents.length === 1) {
                announce(Homey.__("speech_one_more_appointment_today"));
                announceEvent(todaysRemainingEvents[0]);
            } else {
                var sortedEvents = sortArray(todaysRemainingEvents, "start");
                announce(Homey.__("speech_multiple_appointments_remaining_today").replace("{0}", sortedEvents.length));
                sortedEvents.forEach(function(event) {
                    announceEvent(event);
                });
            }

            return Promise.resolve(true);
        }
    });

    return Promise.resolve(true);
}
function next_appointment_action(args, state) {
    app.log("action.next_appointment");

    getEvents(function(error, events) {
        if (error) {
            return Promise.resolve(false);
        } else {
            var nextEvent = getNextEvent(events);
            if (nextEvent) {
                announce(Homey.__("speech_next_appointment").replace("{0}", toLocal(nextEvent.start).calendar()));
                announce(nextEvent.summary);
            } else {
                announce(Homey.__("speech_no_appointments"));
            }

            app.log("action.next_appointment abandoned.");
            return Promise.resolve(true);
        }
    });

    return Promise.resolve(true);
}
function tomorrows_schedule_action(args, state) {
    app.log("action.tomorrows_schedule");

    getEventsForDate(moment().add(1, "days"), function(error, events) {
        if (error) {
            return Promise.resolve(false);
        } else {
            if (events.length === 0) {
                announce(Homey.__("speech_no_appointments_tomorrow"));
            } else if (events.length === 1) {
                announce(Homey.__("speech_one_appointment_tomorrow"));
                announceEvent(events[0]);
            } else {
                var sortedEvents = sortArray(events, "start");
                announce(Homey.__("speech_multiple_appointments_tomorrow").replace("{0}", sortedEvents.length));
                sortedEvents.forEach(function(event) {
                    announceEvent(event);
                });
            }

            return Promise.resolve(true);
        }
    });

    return Promise.resolve(true);
}
function tomorrows_first_appointment_action(args, state) {
    app.log("action.tomorrows_first_appointment");

    var tomorrowsFirstEvent = null;
    getEventsForDate(moment().add(1, "days"), function(error, events) {
        if (error) {
            return Promise.resolve(false);
        } else {
            // Find tommorow's first
            events.forEach(function(event) {
                if (event.start.isAfter(moment()) && (tomorrowsFirstEvent === null || event.start.isBefore(tomorrowsFirstEvent.start))) {
                    tomorrowsFirstEvent = event;
                }
            });

            if (tomorrowsFirstEvent !== null) {
                announce(Homey.__("speech_tomorrows_first_appointment").replace("{0}", toLocal(tomorrowsFirstEvent.start).format("LT")));
                announce(tomorrowsFirstEvent.summary);
            } else {
                announce(Homey.__("speech_no_appointments_tomorrow"));
            }

            return Promise.resolve(true);
        }
    });

    return Promise.resolve(true);
}
function dow_schedule_action(args, status) {
    app.log("action.dow_schedule: " + args.dow);

    var dayOffset = moment().startOf("day").day() < parseInt(args.dow) ? parseInt(args.dow) : parseInt(args.dow) + 7;
    var dow = moment().startOf("day").day(dayOffset);

    app.log(dow.format());

    getEventsForDate(dow, function (error, events) {
        if (error) {
            return Promise.resolve(false);
        } else {
            if (events.length === 0) {
                announce(Homey.__("speech_no_appointments_for_dow").replace("{0}", dow.format("dddd")));
            } else if (events.length === 1) {
                announce(Homey.__("speech_one_appointment_for_dow").replace("{0}", dow.format("dddd")));
                announceEvent(events[0]);
            } else {
                var sortedEvents = sortArray(events, "start");
                announce(Homey.__("speech_multiple_appointments_for_dow").replace("{0}", sortedEvents.length).replace("{1}", dow.format("dddd")));
                sortedEvents.forEach(function (event) {
                    announceEvent(event);
                });
            }
            
            return Promise.resolve(true);
        }
    });

    return Promise.resolve(true);
}
function toLocal(dateTime) {
    var localDateTime = moment(dateTime);
    localDateTime.local();
    return localDateTime;
}
function getNextEvent(events) {
    var nextEvent = null;

    if (events) {
        events.forEach(function(event) {
            var eventMoment = toLocal(event.departure || event.start);
            var nextEventMoment = null;
            if (nextEvent) {
                nextEventMoment = toLocal(nextEvent.departure || nextEvent.start);
            }
            if (eventMoment.isAfter(moment()) && (nextEventMoment === null || eventMoment.isBefore(nextEventMoment))) {
                nextEvent = event;
            }
        });
    }

    return nextEvent;
}
function getEventsForDate(date, callback) {
    getEvents(function(error, events) {
        if (error) {
            callback(error, null);
        } else {
            var eventsForDate = [];
            events.forEach(function(event) {
                if (toLocal(event.start).isSame(date, "day")) {
                    eventsForDate.push(event);
                }
            });

            callback(null, eventsForDate);
        }
    });
}
function getEvents(callback) {
    if (calendars && calendars.length && calendars.length > 0) {
        async.map(calendars,
            function(calendar, innerCallback) {
                innerCallback(null, calendar.events);
            },
            function(error, events) {
                callback(error, [].concat.apply([], events));
            });
    } else {
        callback(Homey.__("no_ical_calendars_configured"), null);
    }
}
function updateCalendarEvents(calendar, callback) {
    ical.fromURL(calendar.url, {}, function(error, data) {
        //app.log(JSON.stringify(data));
        if (error) {
            callback(error, false);
        } else {
            // We return all events since this morning.
            var today = moment().startOf("day");

            // Clear any previous events in the calendar.
            if (calendar.events) {
                calendar.events.length = 0;
            } else {
                calendar.events = [];
            }

            for (var k in data) {
                if (data.hasOwnProperty(k)) {
                    var event = data[k];

                    if (event.type === "VEVENT" && event.start) {
                        var occurrences;
                        if (event.rrule) {
                            // Recurring event, determine any relevant ocurrences.
                            occurrences = getRelevantEventOccurrences(event);
                            //if (occurrences)
                            //    app.log("Found " + occurrences.length + " occurrences for '" + event.summary + "' in the next year.");
                            //else
                            //    app.log("Found no occurrences for '" + event.summary + "' in the next year.");
                        } else {
                            // Single occurrence.
                            occurrences = [moment.utc(event.start).local()];
                        }

                        if (occurrences) {
                            for (var i = 0; i < occurrences.length; i++) {
                                (function (e, start) {
                                    //app.log(JSON.stringify(start) + " isSameOrAfter " + JSON.stringify(today));
                                    if (start.isSameOrAfter(today)) {
                                        var eventDurationInMilliseconds = moment.utc(e.end).diff(moment.utc(e.start));
                                        var eventDuration = moment.duration(eventDurationInMilliseconds);

                                        var end = moment.utc(e.start).local();
                                        end.add(eventDuration);

                                        //app.log(JSON.stringify(event));

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
                                            setTravelTimeInMinutes(eventDetails);
                                        }

                                        calendar.events.push(eventDetails);
                                    }
                                })(event, occurrences[i]);
                            }
                        }
                    }
                }
            }

            //app.log(calendar.events.length + " events retrieved from ical: " + calendar.url);
            callback(null, calendar.events);
        }
    });
}
function setTravelTimeInMinutes(event) {
    if (!event.location || event.location.length <= 0) {
        return;
    }

    // TODO: Determine travel time.
    var travelTimeInMinutes = null;

    // If we found the travel time, we can set the departure time.
    if (travelTimeInMinutes) {
        event.departure = moment(event.start).substract(travelTimeInMinutes, "minutes");
    }
}
function getRelevantEventOccurrences(event) {
    var now = moment().startOf("day");
    var lastAcceptedOccurrence = moment(now).add(1, "y");
    if (event.rrule.options.until !== null && moment.utc(event.rrule.options.until).isBefore(now)) {
        //app.log("No more reccurrences for event '" + event.summary + "' (ended: " + moment(event.rrule.options.until).format() + ").");
        return null;
    }

    //app.log("Determining next recurrence for event '" + event.summary + "'...");

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
        //if (event.summary === "Raymond: VRIJ") app.log(JSON.stringify(event));
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

        //app.log("valid dow: " + JSON.stringify(dow));

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

    app.log("No recurrence found for event '" + event.summary + " (start: " + moment.utc(event.start).format() + "): " + JSON.stringify(event.rrule.options));

    return null;
}
function announceEvent(event) {
    var announcement = Homey.__("speech_appointment_at").replace("{0}", event.summary).replace("{1}", toLocal(event.start).format("LT"));
    announce(announcement);
}
function announce(announcement) {
    app.log("[VOICE] " + announcement);
    if (enableSpeech) {
        Homey.ManagerSpeechOutput.say(announcement);
    }
}
function updateSettings(settings, callback) {
    // Update settings.
    calendars = settings.calendars;
    refreshIntervalInMinutes = parseInt(settings.refreshIntervalInMinutes);
    //app.log("Settings updated: " + JSON.stringify(settings));

    // Stop/start calendar updates using new interval.
    if (updateCalendarsIntervalId) {
        clearInterval(updateCalendarsIntervalId);
    }

    // Update calendars after 2 seconds and every X minutes.
    setTimeout(updateCalendars, 2000);
    updateCalendarsIntervalId = setInterval(updateCalendars, refreshIntervalInMinutes * 60 * 1000);

    // Return success
    if (callback) callback(null, true);
}
function sortArray(arr, param) {
    return arr.slice(0).sort(function(a, b) {
        return (a[param] > b[param]) ? 1 : (a[param] < b[param]) ? -1 : 0;
    });
}