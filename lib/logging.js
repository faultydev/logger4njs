const conversion = require("./conversion");

class Logger {
  /** Logger
   * 
   * @param {{
   * output: NodeJS.WritableStream, 
   * template: string, 
   * argsPlaceholder: string, 
   * historySize: number, 
   * defaultLevel: string
   * }} options
   */
  constructor(options = {})
  {
    this.output = options.output || process.stdout;
    this.template = options.template || "[{level} {timestamp}] {message}";
    this.levelsColors = { // no same colors
      debug: "\x1b[32m",
      info:  "\x1b[36m",
      warn:  "\x1b[33m",
      error: "\x1b[31m",
      fatal: "\x1b[35m"
    };
    this.dict = options.dict || null;
    this.argsPlaceholder = options.argsPlaceholder || "{}";
    this.defaultLevel = options.defaultLevel || "info";
    this.history = [];
    this.historySize = options.historySize || 100;
    this.onHistoryFull = options.onHistoryFull || function() {
      // TODO: implement
    };
  }

  /** log 
   * 
   * @param {string} message
   * @param {any} ...args
   * 
   */
  log (message, ...args)
  {
    this.alog(this.defaultLevel, message, ...args);
  }

  /** alog 
   * 
   * @param {string} level
   * @param {string} message
   * @param {any} ...args
   * 
   */
  alog(level, message, ...args)
  {
    //replace placeholders with args
    let msg = this.template;

    msg = msg.replace(/\{timestamp\}/g, new Date().toISOString());
    msg = msg.replace(/\{level\}/g, level.charAt(0).toUpperCase());
    msg = msg.replace(/\{message\}/g, message);

    //replace placeholders with args
    let argPlaceholder = this.argsPlaceholder;
    let regex = new RegExp(argPlaceholder, "g");
    let stringArgCount = (regex.exec(msg) || []).length;
    args.forEach((v, i, a) => {
      if (Buffer.isBuffer(v))
      {
        v = conversion.properHex(v).str;
      }
      if (typeof v === 'object')
      {
        v = JSON.stringify(v);
      }

      msg = msg.replace(argPlaceholder, v);
    });
    if (stringArgCount < args.length)
      msg += ` (${args.length - stringArgCount} args overflow.)`;
    else if (stringArgCount > args.length)
      msg += ` (${stringArgCount - args.length} args missing.)`;

    //replace dictionary keys
    if (this.dict)
      msg = dictionaryConversion(msg, this.dict);

    // add color
    msg = this.levelsColors[level] + msg + "\x1b[0m";

    //log
    this.output.write(msg + "\n");

    //save to history
    this.history.push({
      level: level,
      message: message,
      args: args
    });
    if (this.history.length >= this.historySize)
      this.onHistoryFull();
  }
}

module.exports = Logger;