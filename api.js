"use strict";
const Homey = require("homey");

module.exports = [
    {
        description: "Update settings",
        method: "PUT",
        path: "/settings/",
        fn: function(args, callback) {
            Homey.app.updateSettings(args.body, callback);
        }
    }
];