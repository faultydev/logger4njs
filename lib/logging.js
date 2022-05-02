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
    {this.alog(this.defaultLevel, message, args);}

  /** alog 
   * 
   * @param {string} level
   * @param {string} message
   * @param {any} ...args
   * 
   */
  alog(level, message, args = [])
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
    let argPlaceholder = this.argsPlaceholder;
    let matches = (msg.match(new RegExp(argPlaceholder, "g")) || []).length;
    let argsFilled = 0;
    args.forEach((v, i, a) => {
      if (Buffer.isBuffer(v))
        v = conversion.properHex(v).str;
      if (typeof v === 'object')
        v = "\x1b[0m" + JSON.stringify(v, null, 2) + "\x1b[0m";

      msg = msg.replace(argPlaceholder, v);
      argsFilled++;
      console.log(`${argPlaceholder} -> ${v}`);
    });

    if (matches !== argsFilled && args.length >= matches)
      console.log("warn;", "Not all placeholders were replaced.\n" +
        "Placeholders: " + matches + "\n" +
        "Args: " + args.length + "\n" +
        "Args filled: " + argsFilled + "\n" +
        "Message: " + msg);


    if (matches < args.length)
      msg += ` (${args.length - matches} args overflow.)`;
    else if (matches > args.length)
      msg += ` (${matches - args.length} args missing.)`;

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
    if (this.history.length >= this.historySize && level !== "warn;")
      this.onHistoryFull();
  }
}

module.exports = Logger;