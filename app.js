"use strict";

var ical2voice = require('./lib/ical2voice.js');
const Homey = require('homey');

class iCal2Voice extends Homey.App {
    onInit() {
        this.log("Initializing iCalendar to Voice app...");
        ical2voice.init(this);
        this.log("Initializing iCalendar to Voice app completed.");
    }
    updateSettings(args, callback) {
        ical2voice.updateSettings(args, callback);
    }
    removeCalendar(args, callback) {
        ical2voice.removeCalendar(args, callback);
    }
}

module.exports = iCal2Voice;