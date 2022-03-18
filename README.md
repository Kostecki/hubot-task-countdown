# hubot-task-countdown

A quick fork that adds features i needed:

- Pass time as hh:mm:ss, mm:ss or ss
- Ability to stop running timers by name
- Command to show running timers

## Commands

- `hubot start timer (opts)` - Start timer with specified options.
- `hubot stop timer "timer name"` - Stop a running timer (name is required)
- `hubot timers` - Show list of running timers
- `hubot timer help` - Provide example and list all available options.

### Options:

- -n, --name : Name of timer. If no name a random one will be assigned to the timer.
- -s, --seconds : Length of timer in the following format: hh:mm:ss, mm:ss or ss.
- -m, --message : Message to be sent when timer is complete.
- -c, --channel : Announce timer completion using @channel tag.
- -h, --here : Announce timer completion using @here tag.

### Configuration:

- HUBOT_TASK_DEFAULT_SECONDS : Seconds to use when setting and snoozing timers. Default: 600

## Installation

Run the following command

    $ npm install hubot-task-countdown --save

To enable the script, add a `hubot-task-countdown` entry to the `external-scripts.json`
file (you may need to create this file).

    ["hubot-task-countdown"]

## Dependencies

- dayjs: ^1.11.0
- node-schedule: ^1.3.2
- random-words: ^1.1.2
- yargs: ^13.2.4
