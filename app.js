"use strict";
var ical = require("ical");
var moment = require("moment");
var async = require("async");
var enableSpeech = true;

var self = module.exports = {
    init: function() {
        console.log("Initializing iCalendar to Voice app...");
        
        // Set calendar locale.
        moment.locale(__("moment_locale"));
        
        // Read calendars from settings.
        self.calendars = Homey.manager("settings").get("calendars") || [];
        //console.log(self.calendars);

        // Listen for flow triggers.
        self.listenForTriggers();

        console.log("Initializing iCalendar to Voice app completed.");
    },
    listenForTriggers: function() {
        // On triggered flow

        Array.prototype.sortBy = function(p) {
            return this.slice(0).sort(function(a, b) {
                return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
            });
        }

        Homey.manager("flow").on("action.todays_schedule", function (callback, args) {
            self.getEventsForDate(moment(), function (error, events) {
                if (error) {
                    callback(error, false);
                } else {
                    if (events.length === 0) {
                        self.announce(__("speech_no_appointments_today"));
                    } else if (events.length === 1) {
                        self.announce(__("speech_one_appointment_today"));
                        self.announceEvent(events[0]);
                    } else {
                        var sortedEvents = events.sortBy("start");
                        self.announce(__("speech_multiple_appointments_today").replace("{0}", sortedEvents.length));
                        sortedEvents.forEach(function (event) {
                            self.announceEvent(event);
                        });
                    }
                    
                    callback(null, true);
                }
            });
        });
        
        Homey.manager("flow").on("action.todays_remaining_schedule", function (callback, args) {
            self.getEventsForDate(moment(), function (error, events) {
                if (error) {
                    callback(error, false);
                } else {
                    // Filter for remaining events only.
                    var todaysRemainingEvents = [];
                    events.forEach(function (event) {
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
                        var sortedEvents = todaysRemainingEvents.sortBy("start");
                        self.announce(__("speech_multiple_appointments_remaining_today").replace("{0}", sortedEvents.length));
                        sortedEvents.forEach(function (event) {
                            self.announceEvent(event);
                        });
                    }
                    
                    callback(null, true);
                }
            });
        });
        
        Homey.manager("flow").on("action.next_appointment", function(callback, args) {
            var nextEvent = null;
            self.getEvents(function (error, events) {
                if (error) {
                    callback(error, false);
                } else {
                    // Find next event
                    events.forEach(function (event) {
                        if (event.start.isAfter(moment()) && (nextEvent === null || event.start.isBefore(nextEvent.start))) {
                            nextEvent = event;
                        }
                    });

                    if (nextEvent !== null) {
                        self.announce(__("speech_next_appointment").replace("{0}", nextEvent.start.calendar()));
                        self.announce(nextEvent.event.summary);
                    } else {
                        self.announce(__("speech_no_appointments"));
                    }

                    callback(null, true);
                }
            });
        });

        Homey.manager("flow").on("action.tomorrows_schedule", function(callback, args) {
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
                        var sortedEvents = events.sortBy("start");
                        self.announce(__("speech_multiple_appointments_tomorrow").replace("{0}", sortedEvents.length));
                        sortedEvents.forEach(function(event) {
                            self.announceEvent(event);
                        });
                    }

                    callback(null, true);
                }
            });
        });

        Homey.manager("flow").on("action.tomorrows_first_appointment", function (callback, args) {
            var tomorrowsFirstEvent = null;
            self.getEventsForDate(moment().add(1, "days"), function(error, events) {
                if (error) {
                    callback(error, false);
                } else {
                    // Find next event
                    events.forEach(function (event) {
                        if (event.start.isAfter(moment()) && (tomorrowsFirstEvent === null || event.start.isBefore(tomorrowsFirstEvent.start))) {
                            tomorrowsFirstEvent = event;
                        }
                    });
                    
                    if (tomorrowsFirstEvent !== null) {
                        self.announce(__("speech_tomorrows_first_appointment").replace("{0}", tomorrowsFirstEvent.start.format("LT")));
                        self.announce(tomorrowsFirstEvent.event.summary);
                    } else {
                        self.announce(__("speech_no_appointments_tomorrow"));
                    }
                    
                    callback(null, true);
                }
            });
        });
    },
    getEventsForDate: function(date, callback) {
        self.getEvents(function(error, events) {
            if (error) {
                callback(error, null);
            } else {
                var eventsForDate = [];

                events.forEach(function(event) {
                    if (event.start.isSame(date, "day")) {
                        eventsForDate.push(event);
                    }
                });

                callback(null, eventsForDate);
            }
        });
    },
    getEvents: function (callback) {
        function getCalendarEvents(calendar, callback) {
            ical.fromURL(calendar.url, {}, function(error, data) {
                var events = [];
                if (error) {
                    callback(error, null);
                } else {
                    // We return all events since this morning.
                    var today = moment(0, "HH");

                    for (var k in data) {
                        if (data.hasOwnProperty(k)) {
                            var event = data[k];
                            if (event.type === "VEVENT" && event.start) {
                                var start = moment.utc(event.start).local();
                                if (start.isSameOrAfter(today)) {
                                    events.push({ calendar: calendar, start: start, event: event });
                                }
                            }
                        }
                    }

                    //console.log(events.length + " events retrieved from ical: " + calendar.url);

                    callback(null, events);
                }
            });
        }

        if (self.calendars && self.calendars.length && self.calendars.length > 0) {
            async.map(self.calendars, getCalendarEvents, function (error, results) {
                var events = [].concat.apply([], results);
                callback(error, events);
            });
        } else {
            callback(__("no_ical_calendars_configured"), null);
        }
    },
    announceEvent: function(e) {
        var announcement = __("speech_appointment_at").replace("{0}", e.event.summary).replace("{1}", e.start.format("LT"));
        self.announce(announcement);
    },
    announce: function(announcement) {
        console.log(announcement);
        if (enableSpeech) {
            Homey.manager("speech-output").say(announcement);
        }
    },
    updateSettings: function (settings, callback) {
        self.calendars = settings;

        // Return success
        if (callback) callback(null, true);
    }
};