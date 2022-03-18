// Description:
//   A hubot script for announcing task countdowns and allowing user snoozing.
//
// Dependencies:
//   node-schedule: ^1.3.2
//   yargs: ^13.2.4
//
// Commands:
//   hubot start timer (opts) -- Start timer with specified options.
//   hubot stop timer (opts) -- Stop a running timer (-n is required).
//   hubot timers - Show list of running timers.
//   hubot timer help -- Provide example and list all available options.
//
// Options:
//
//   -n : Name of timer.
//   -t : Length of timer in the following format: hh:mm:ss
//   -m : Message to be sent when timer is complete.
//   -c : Announce timer completion using @channel tag.
//   -h : Announce timer completion using @here tag.
//
// Configuration:
//   HUBOT_TASK_DEFAULT_SECONDS : Seconds to use when setting and snoozing timers. Default: 600
//
// Author:
//   kwandrews7
// Forked:
//   kostecki
//
const randomWords = require("random-words");
const dayjs = require("dayjs");
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
  .option("c", {
    alias: "channel",
    description: "Announce timer completion using `@channel` tag.",
    type: "boolean",
  })
  .option("h", {
    alias: "here",
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

const removeFromArray = (element) => {
  countdowns.splice(
    countdowns.findIndex((item) => item.name !== element),
    1
  );
};

const countdowns = [];

module.exports = function (robot) {
  if (!robot.brain.data.task_countdown) {
    robot.brain.data.task_countdown = {};
  }

  robot.respond(/start timer/i, function (msg) {
    const parsedYargs = yargs.parse(msg.message.text);
    const { time, name: passedName, message, channel, here } = parsedYargs;

    const name =
      passedName ||
      randomWords({ exactly: 1, wordsPerString: 2, separator: "-" })[0];

    if (countdowns.some((c) => c.name === name)) {
      msg.send(
        `A timer with the name ${name} is already running. Be more creative`
      );

      return;
    }

    const seconds = hmsToSecondsOnly(time);
    const prettyHMS = secondsToHms(seconds);
    const date = new Date(Date.now() + seconds * 1000);

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

    countdowns.push({
      name,
      date: dayjs(date).format("HH:mm:ss"),
      seconds: prettyHMS,
    });

    msg.send(`Timer "${name}" has started and will expire in ${prettyHMS}.`);
  });

  robot.respond(/stop timer/i, function (msg) {
    const name = msg.message.text.includes('"')
      ? msg.message.text.match(/"([^"]*)"/)[1]
      : msg.message.text.split(" ")[3];

    const countdown = schedule.scheduledJobs[name];
    if (countdown) {
      countdown.cancel();
      removeFromArray(name);

      msg.send(`Timer "${name} has been cancelled`);
    } else {
      msg.send(`Couldn't find any timers with the name "${name}`);
    }
  });

  robot.respond(/timers/i, function (msg) {
    const response = countdowns.length
      ? ["Currently active countdowns: "]
      : ["No active countdowns"];
    countdowns.forEach((timer) =>
      response.push(
        `${timer.name} (Timer: ${timer.seconds}, Ends: ${timer.date})`
      )
    );

    msg.send(response.join("\n"));
  });

  robot.respond(/timer help/i, function (msg) {
    const help = [
      "Example Usage: Start 15 minute timer for deploying a new version into UAT.",
      '`jarvis start timer -n "Example timer"`',
      "Example Usage: Stop running timer by name",
      '`jarvis stop timer "Example timer"`',
      "Exmaple Usage: Get names of current timers",
      "`jarvis timers`",
      "",
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
