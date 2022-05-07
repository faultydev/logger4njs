const conversion = require("./conversion");

class Logger {
  /** Logger
   * 
   * @param {{
   * output: NodeJS.WritableStream,
   * output2: NodeJS.WritableStream,
   * template: string,
   * levelsColors: {[level: string]: string},
   * historySize: number,
   * onHistoryFull: () => void,
   * argsPlaceholder: string,
   * dict: {[key: string]: string}
   * logFrom: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
   * logFrom2: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
   * }} options
   */
  constructor(options = {})
  {
    this.output = options.output || process.stdout;
    this.output2 = options.output2 || null;
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
    this.logFrom =  options.logFrom  ? options.logFrom.charAt(0).toUpperCase()  : "D"; // when to stop logging to output
    this.logFrom2 = options.logFrom2 ? options.logFrom2.charAt(0).toUpperCase() : "D"; // when to stop logging to output2
    // Order from least important to most: D, I, W, E, F
    this.logImportance = {
      D: 0, I: 1, W: 2, E: 3, F: 4
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

    //log (if important enough)
    if (this.logImportance[level.charAt(0).toUpperCase()] >= this.logImportance[this.logFrom])
      this.output.write(msg + "\n");
    if (this.output2 && this.logImportance[level.charAt(0).toUpperCase()] >= this.logImportance[this.logFrom2])
      this.output2.write(msgNoColors + "\n");

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