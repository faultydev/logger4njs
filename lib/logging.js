const conversion = require("./conversion");

class Logger {
  /** Logger
   * 
   * @param {{
   * output: NodeJS.WritableStream | {exclusivity: [level: string], stream: NodeJS.WritableStream, noColors: boolean},
   * outputs: NodeJS.WritableStream[] | Array<{exclusivity: [level: string], stream: NodeJS.WritableStream, noColors: boolean}>,
   * template: string,
   * levelsColors: {[level: string]: string},
   * historySize: number,
   * onHistoryFull: () => void,
   * argsPlaceholder: string,
   * defaultLevel: string,
   * dict: Map<string, string>
   * }} options
   */
  constructor(options = {})
  {
    this.output = options.output || process.stdout;
    this.outputs = options.outputs || [];
    this.template = options.template || "[{level} {timestamp}] {message}";
    this.levelsColors = options.levelsColors || { // no same colors
      debug: "\x1b[32m",
      info:  "\x1b[36m",
      warn:  "\x1b[33m",
    "warn;": "\x1b[33m",
      error: "\x1b[31m",
      fatal: "\x1b[35m"
    };
    this.dict = options.dict || null;
    this.argsPlaceholder = options.argsPlaceholder || "{}";
    this.defaultLevel = options.defaultLevel || "info";
    this.history = [];
    this.historySize = options.historySize || 100;
    this.onHistoryFull = options.onHistoryFull || function() {
      this.alog("warn;", "History is full, dropping 25 oldest entries.");
      this.history = this.history.slice(25);
    };
  }

  /** log 
   * 
   * @param {string} message
   * @param {any} ...args
   * 
   */
  log (message, ...args)
    {this.alog(this.defaultLevel, message, ...args);}

  /** alog 
   * 
   * @param {'debug' | 'info' | 'warn' | 'error' | 'fatal'} level
   * @param {string} message
   * @param {any} ...args
   * 
   */
  async alog(level, message, ...args)
  {
    //replace placeholders with args
    let msg = this.template;

    msg = msg.replace(/\{level\}/g, level.charAt(0).toUpperCase());
    // [I {timestamp}] {message}
    msg = msg.replace(/\{timestamp\}/g, new Date().toISOString());
    // [I 1/1/1970 00:00:00] {message}
    msg = msg.replace(/\{message\}/g, message);
    // [I 1/1/1970 00:00:00] spul {} {}

    //replace placeholders with args
    if (args.length > 0)
    {
      let argPH = this.argsPlaceholder;
      for (let arg of args) 
      {
        // detect if arg is an object and convert it to string if it is
        if (typeof arg === "object" || Array.isArray(arg) || arg.constructor === Object)
          arg = JSON.stringify(arg, null, 2);

        msg = msg.replace(argPH, arg);
      }
    }

    //replace dictionary keys
    if (this.dict)
      msg = conversion.dictionaryConversion(msg, this.dict);

    // add color
    let msgNoColors = msg;
    if (this.levelsColors && this.levelsColors[level])
      msg = this.levelsColors[level] + msg + "\x1b[0m";

    //log to output
    if (this.output.stream)
    {
      if (this.output.exclusivity)
      {
        if (this.output.exclusivity.includes(level))
          this.output.stream.write(this.output.noColors ? msgNoColors : msg);
      }
      else
        this.output.stream.write(this.output.noColors ? msgNoColors : msg);
    } else this.output.write(msg + "\n");

    //log to outputs
    for (let output of this.outputs)
    {
      if (output.stream) {
        if (output.exclusivity)
        {
          if (output.exclusivity.includes(level))
            output.stream.write(output.noColors ? msgNoColors : msg);
        } else
          output.stream.write(output.noColors ? msgNoColors : msg);
      } else output.write(msg + "\n");
    }

    //save to history
    this.history.push({
      level: level,
      message: message,
      args: args
    });
    if (this.history.length >= this.historySize && level !== "warn;")
      this.onHistoryFull();
  }
}

module.exports = Logger;