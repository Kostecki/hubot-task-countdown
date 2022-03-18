// Description:
//   A hubot script for announcing task countdowns and allowing user snoozing.
//
// Dependencies:
//   node-schedule: ^1.3.2
//   yargs: ^13.2.4
//
// Commands:
//   hubot start timer (opts) -- Start timer with specified options.
//   hubot timer help -- Provide example and list all available options.
//
// Options:
//
//   -n : Name of timer.
//   -t : Length of timer in the following format: hh:mm:ss
//   -m : Message to be sent when timer is complete.
//
// Configuration:
//   HUBOT_TASK_DEFAULT_SECONDS : Seconds to use when setting and snoozing timers. Default: 600
//
// Author:
//   kwandrews7
//

const schedule = require("node-schedule");
const yargs = require("yargs")
  .option("n", {
    alias: "name",
    description: "Name of the timer.",
  })
  .option("t", {
    alias: "time",
    description: "Length of timer in the following format: hh:mm:ss",
    default: process.env.HUBOT_TASK_DEFAULT_SECONDS || "600",
  })
  .option("m", {
    alias: "message",
    description: "Message to be sent when timer is complete.",
  })
  .option("channel", {
    description: "Announce timer completion using `@channel` tag.",
    type: "boolean",
  })
  .option("here", {
    description: "Announce timer completion using `@here` tag.",
    type: "boolean",
  });

const hmsToSecondsOnly = (str) => {
  if (!isNaN(str)) {
    return str;
  }

  var p = str.split(":"),
    s = 0,
    m = 1;

  while (p.length > 0) {
    s += m * parseInt(p.pop(), 10);
    m *= 60;
  }

  return s;
};

const secondsToHms = (seconds) => {
  return new Date(seconds * 1000).toISOString().substr(11, 8);
};

const removeFromArray = (element) =>
  (countdowns = countdowns.filter((item) => item !== element));

let countdowns = [];

module.exports = function (robot) {
  if (!robot.brain.data.task_countdown) {
    robot.brain.data.task_countdown = {};
  }

  robot.respond(/start timer/i, function (msg) {
    robot.logger.debug("HERE!!!");
    let parsedYargs = yargs.parse(msg.message.text);
    const { time, name, message, channel, here } = parsedYargs;

    if (countdowns.includes(name)) {
      msg.send(
        `A timer with the name ${name} is already running. Be more creative`
      );

      return;
    }

    const seconds = hmsToSecondsOnly(time);
    let date = new Date(Date.now() + seconds * 1000);

    schedule.scheduleJob(name, date, function () {
      var response = [];
      if (channel) {
        response.push("@channel");
      }
      if (here) {
        response.push("@here");
      }
      response.push(`Timer "${name}" has elapsed!`);
      if (message) {
        response.push(message);
      }

      removeFromArray(name);

      msg.send(`${response.join("\n")}`);
    });

    countdowns.push(name);

    msg.send(
      `Timer "${name}" has started and will expire in ${secondsToHms(seconds)}.`
    );
  });

  robot.respond(/stop timer/i, function (msg) {
    const parsedYargs = yargs.parse(msg.message.text);
    const { name } = parsedYargs;

    const countdown = schedule.scheduledJobs[name];
    countdown.cancel();
    removeFromArray(name);

    msg.send(`Timer "${name} has been cancelled`);
  });

  robot.respond(/timers/i, function (msg) {
    console.log(countdowns);
  });

  robot.respond(/timer help/i, function (msg) {
    let help = [
      "Example Usage: Start 15 minute timer for deploying a new version into UAT.",
      '`jarvis start timer -n "Example timer"`',
      "Example Usage: Stop running timer by name",
      '`jarvis stop timer -n "Example timer"`',
      "```Options:",
      "-n, --name     Name of the timer.",
      "-t, --time     Length of timer in the following format: hh:mm:ss.",
      "-m, --message  Message to be sent when timer is complete.",
      "--channel      Announce timer completion using @channel tag.",
      "--here         Announce timer completion using @here tag.```",
    ];
    msg.send(help.join("\n"));
  });
};
