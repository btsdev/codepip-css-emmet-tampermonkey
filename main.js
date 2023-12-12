// ==UserScript==
// @name         Codepip CSS Game emmet support
// @namespace    http://tampermonkey.net/
// @version      2023-12-12
// @description  Add CSS emmet support to the css games (like flexbox-froggy-pro)
// @author       btsdev
// @match        https://codepip.com/games/flexbox-froggy*/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=codepip.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    (() => {
        // node_modules/.pnpm/emmet@2.4.6/node_modules/emmet/dist/emmet.es.js
        function isNumber$1(code2) {
          return code2 > 47 && code2 < 58;
        }
        function isAlpha$1(code2, from, to) {
          from = from || 65;
          to = to || 90;
          code2 &= ~32;
          return code2 >= from && code2 <= to;
        }
        function isAlphaNumericWord(code2) {
          return isNumber$1(code2) || isAlphaWord(code2);
        }
        function isAlphaWord(code2) {
          return code2 === 95 || isAlpha$1(code2);
        }
        function isUmlaut(code2) {
          return code2 === 196 || code2 == 214 || code2 === 220 || code2 === 228 || code2 === 246 || code2 === 252;
        }
        function isWhiteSpace$3(code2) {
          return code2 === 32 || code2 === 9 || code2 === 160;
        }
        function isSpace(code2) {
          return isWhiteSpace$3(code2) || code2 === 10 || code2 === 13;
        }
        function isQuote$2(code2) {
          return code2 === 39 || code2 === 34;
        }
        var Scanner = class _Scanner {
          constructor(str, start, end) {
            if (end == null && typeof str === "string") {
              end = str.length;
            }
            this.string = str;
            this.pos = this.start = start || 0;
            this.end = end || 0;
          }
          /**
           * Returns true only if the stream is at the end of the file.
           */
          eof() {
            return this.pos >= this.end;
          }
          /**
           * Creates a new stream instance which is limited to given `start` and `end`
           * range. E.g. its `eof()` method will look at `end` property, not actual
           * stream end
           */
          limit(start, end) {
            return new _Scanner(this.string, start, end);
          }
          /**
           * Returns the next character code in the stream without advancing it.
           * Will return NaN at the end of the file.
           */
          peek() {
            return this.string.charCodeAt(this.pos);
          }
          /**
           * Returns the next character in the stream and advances it.
           * Also returns <code>undefined</code> when no more characters are available.
           */
          next() {
            if (this.pos < this.string.length) {
              return this.string.charCodeAt(this.pos++);
            }
          }
          /**
           * `match` can be a character code or a function that takes a character code
           * and returns a boolean. If the next character in the stream 'matches'
           * the given argument, it is consumed and returned.
           * Otherwise, `false` is returned.
           */
          eat(match) {
            const ch = this.peek();
            const ok = typeof match === "function" ? match(ch) : ch === match;
            if (ok) {
              this.next();
            }
            return ok;
          }
          /**
           * Repeatedly calls <code>eat</code> with the given argument, until it
           * fails. Returns <code>true</code> if any characters were eaten.
           */
          eatWhile(match) {
            const start = this.pos;
            while (!this.eof() && this.eat(match)) {
            }
            return this.pos !== start;
          }
          /**
           * Backs up the stream n characters. Backing it up further than the
           * start of the current token will cause things to break, so be careful.
           */
          backUp(n) {
            this.pos -= n || 1;
          }
          /**
           * Get the string between the start of the current token and the
           * current stream position.
           */
          current() {
            return this.substring(this.start, this.pos);
          }
          /**
           * Returns substring for given range
           */
          substring(start, end) {
            return this.string.slice(start, end);
          }
          /**
           * Creates error object with current stream state
           */
          error(message, pos = this.pos) {
            return new ScannerError(`${message} at ${pos + 1}`, pos, this.string);
          }
        };
        var ScannerError = class extends Error {
          constructor(message, pos, str) {
            super(message);
            this.pos = pos;
            this.string = str;
          }
        };
        function tokenScanner$1(tokens) {
          return {
            tokens,
            start: 0,
            pos: 0,
            size: tokens.length
          };
        }
        function peek$3(scanner) {
          return scanner.tokens[scanner.pos];
        }
        function next(scanner) {
          return scanner.tokens[scanner.pos++];
        }
        function slice(scanner, from = scanner.start, to = scanner.pos) {
          return scanner.tokens.slice(from, to);
        }
        function readable$1(scanner) {
          return scanner.pos < scanner.size;
        }
        function consume$2(scanner, test) {
          const token = peek$3(scanner);
          if (token && test(token)) {
            scanner.pos++;
            return true;
          }
          return false;
        }
        function error$1(scanner, message, token = peek$3(scanner)) {
          if (token && token.start != null) {
            message += ` at ${token.start}`;
          }
          const err = new Error(message);
          err["pos"] = token && token.start;
          return err;
        }
        function abbreviation(abbr, options = {}) {
          const scanner = tokenScanner$1(abbr);
          const result = statements(scanner, options);
          if (readable$1(scanner)) {
            throw error$1(scanner, "Unexpected character");
          }
          return result;
        }
        function statements(scanner, options) {
          const result = {
            type: "TokenGroup",
            elements: []
          };
          let ctx = result;
          let node;
          const stack = [];
          while (readable$1(scanner)) {
            if (node = element$2(scanner, options) || group(scanner, options)) {
              ctx.elements.push(node);
              if (consume$2(scanner, isChildOperator)) {
                stack.push(ctx);
                ctx = node;
              } else if (consume$2(scanner, isSiblingOperator$1)) {
                continue;
              } else if (consume$2(scanner, isClimbOperator)) {
                do {
                  if (stack.length) {
                    ctx = stack.pop();
                  }
                } while (consume$2(scanner, isClimbOperator));
              }
            } else {
              break;
            }
          }
          return result;
        }
        function group(scanner, options) {
          if (consume$2(scanner, isGroupStart)) {
            const result = statements(scanner, options);
            const token = next(scanner);
            if (isBracket$2(token, "group", false)) {
              result.repeat = repeater$1(scanner);
            }
            return result;
          }
        }
        function element$2(scanner, options) {
          let attr;
          const elem = {
            type: "TokenElement",
            name: void 0,
            attributes: void 0,
            value: void 0,
            repeat: void 0,
            selfClose: false,
            elements: []
          };
          if (elementName(scanner, options)) {
            elem.name = slice(scanner);
          }
          while (readable$1(scanner)) {
            scanner.start = scanner.pos;
            if (!elem.repeat && !isEmpty(elem) && consume$2(scanner, isRepeater)) {
              elem.repeat = scanner.tokens[scanner.pos - 1];
            } else if (!elem.value && text(scanner)) {
              elem.value = getText(scanner);
            } else if (attr = shortAttribute(scanner, "id", options) || shortAttribute(scanner, "class", options) || attributeSet(scanner)) {
              if (!elem.attributes) {
                elem.attributes = Array.isArray(attr) ? attr.slice() : [attr];
              } else {
                elem.attributes = elem.attributes.concat(attr);
              }
            } else {
              if (!isEmpty(elem) && consume$2(scanner, isCloseOperator)) {
                elem.selfClose = true;
                if (!elem.repeat && consume$2(scanner, isRepeater)) {
                  elem.repeat = scanner.tokens[scanner.pos - 1];
                }
              }
              break;
            }
          }
          return !isEmpty(elem) ? elem : void 0;
        }
        function attributeSet(scanner) {
          if (consume$2(scanner, isAttributeSetStart)) {
            const attributes = [];
            let attr;
            while (readable$1(scanner)) {
              if (attr = attribute(scanner)) {
                attributes.push(attr);
              } else if (consume$2(scanner, isAttributeSetEnd)) {
                break;
              } else if (!consume$2(scanner, isWhiteSpace$2)) {
                throw error$1(scanner, `Unexpected "${peek$3(scanner).type}" token`);
              }
            }
            return attributes;
          }
        }
        function shortAttribute(scanner, type, options) {
          if (isOperator$1(peek$3(scanner), type)) {
            scanner.pos++;
            let count = 1;
            while (isOperator$1(peek$3(scanner), type)) {
              scanner.pos++;
              count++;
            }
            const attr = {
              name: [createLiteral$1(type)]
            };
            if (count > 1) {
              attr.multiple = true;
            }
            if (options.jsx && text(scanner)) {
              attr.value = getText(scanner);
              attr.expression = true;
            } else {
              attr.value = literal$1$1(scanner) ? slice(scanner) : void 0;
            }
            return attr;
          }
        }
        function attribute(scanner) {
          if (quoted(scanner)) {
            return {
              value: slice(scanner)
            };
          }
          if (literal$1$1(scanner, true)) {
            const name = slice(scanner);
            let value;
            if (consume$2(scanner, isEquals)) {
              if (quoted(scanner) || literal$1$1(scanner, true)) {
                value = slice(scanner);
              }
            }
            return { name, value };
          }
        }
        function repeater$1(scanner) {
          return isRepeater(peek$3(scanner)) ? scanner.tokens[scanner.pos++] : void 0;
        }
        function quoted(scanner) {
          const start = scanner.pos;
          const quote2 = peek$3(scanner);
          if (isQuote$1(quote2)) {
            scanner.pos++;
            while (readable$1(scanner)) {
              if (isQuote$1(next(scanner), quote2.single)) {
                scanner.start = start;
                return true;
              }
            }
            throw error$1(scanner, "Unclosed quote", quote2);
          }
          return false;
        }
        function literal$1$1(scanner, allowBrackets) {
          const start = scanner.pos;
          const brackets = {
            attribute: 0,
            expression: 0,
            group: 0
          };
          while (readable$1(scanner)) {
            const token = peek$3(scanner);
            if (brackets.expression) {
              if (isBracket$2(token, "expression")) {
                brackets[token.context] += token.open ? 1 : -1;
              }
            } else if (isQuote$1(token) || isOperator$1(token) || isWhiteSpace$2(token) || isRepeater(token)) {
              break;
            } else if (isBracket$2(token)) {
              if (!allowBrackets) {
                break;
              }
              if (token.open) {
                brackets[token.context]++;
              } else if (!brackets[token.context]) {
                break;
              } else {
                brackets[token.context]--;
              }
            }
            scanner.pos++;
          }
          if (start !== scanner.pos) {
            scanner.start = start;
            return true;
          }
          return false;
        }
        function elementName(scanner, options) {
          const start = scanner.pos;
          if (options.jsx && consume$2(scanner, isCapitalizedLiteral)) {
            while (readable$1(scanner)) {
              const { pos } = scanner;
              if (!consume$2(scanner, isClassNameOperator) || !consume$2(scanner, isCapitalizedLiteral)) {
                scanner.pos = pos;
                break;
              }
            }
          }
          while (readable$1(scanner) && consume$2(scanner, isElementName$1)) {
          }
          if (scanner.pos !== start) {
            scanner.start = start;
            return true;
          }
          return false;
        }
        function text(scanner) {
          const start = scanner.pos;
          if (consume$2(scanner, isTextStart)) {
            let brackets = 0;
            while (readable$1(scanner)) {
              const token = next(scanner);
              if (isBracket$2(token, "expression")) {
                if (token.open) {
                  brackets++;
                } else if (!brackets) {
                  break;
                } else {
                  brackets--;
                }
              }
            }
            scanner.start = start;
            return true;
          }
          return false;
        }
        function getText(scanner) {
          let from = scanner.start;
          let to = scanner.pos;
          if (isBracket$2(scanner.tokens[from], "expression", true)) {
            from++;
          }
          if (isBracket$2(scanner.tokens[to - 1], "expression", false)) {
            to--;
          }
          return slice(scanner, from, to);
        }
        function isBracket$2(token, context, isOpen) {
          return Boolean(token && token.type === "Bracket" && (!context || token.context === context) && (isOpen == null || token.open === isOpen));
        }
        function isOperator$1(token, type) {
          return Boolean(token && token.type === "Operator" && (!type || token.operator === type));
        }
        function isQuote$1(token, isSingle) {
          return Boolean(token && token.type === "Quote" && (isSingle == null || token.single === isSingle));
        }
        function isWhiteSpace$2(token) {
          return Boolean(token && token.type === "WhiteSpace");
        }
        function isEquals(token) {
          return isOperator$1(token, "equal");
        }
        function isRepeater(token) {
          return Boolean(token && token.type === "Repeater");
        }
        function isLiteral$2(token) {
          return token.type === "Literal";
        }
        function isCapitalizedLiteral(token) {
          if (isLiteral$2(token)) {
            const ch = token.value.charCodeAt(0);
            return ch >= 65 && ch <= 90;
          }
          return false;
        }
        function isElementName$1(token) {
          return token.type === "Literal" || token.type === "RepeaterNumber" || token.type === "RepeaterPlaceholder";
        }
        function isClassNameOperator(token) {
          return isOperator$1(token, "class");
        }
        function isAttributeSetStart(token) {
          return isBracket$2(token, "attribute", true);
        }
        function isAttributeSetEnd(token) {
          return isBracket$2(token, "attribute", false);
        }
        function isTextStart(token) {
          return isBracket$2(token, "expression", true);
        }
        function isGroupStart(token) {
          return isBracket$2(token, "group", true);
        }
        function createLiteral$1(value) {
          return { type: "Literal", value };
        }
        function isEmpty(elem) {
          return !elem.name && !elem.value && !elem.attributes;
        }
        function isChildOperator(token) {
          return isOperator$1(token, "child");
        }
        function isSiblingOperator$1(token) {
          return isOperator$1(token, "sibling");
        }
        function isClimbOperator(token) {
          return isOperator$1(token, "climb");
        }
        function isCloseOperator(token) {
          return isOperator$1(token, "close");
        }
        var Chars$3;
        (function(Chars2) {
          Chars2[Chars2["CurlyBracketOpen"] = 123] = "CurlyBracketOpen";
          Chars2[Chars2["CurlyBracketClose"] = 125] = "CurlyBracketClose";
          Chars2[Chars2["Escape"] = 92] = "Escape";
          Chars2[Chars2["Equals"] = 61] = "Equals";
          Chars2[Chars2["SquareBracketOpen"] = 91] = "SquareBracketOpen";
          Chars2[Chars2["SquareBracketClose"] = 93] = "SquareBracketClose";
          Chars2[Chars2["Asterisk"] = 42] = "Asterisk";
          Chars2[Chars2["Hash"] = 35] = "Hash";
          Chars2[Chars2["Dollar"] = 36] = "Dollar";
          Chars2[Chars2["Dash"] = 45] = "Dash";
          Chars2[Chars2["Dot"] = 46] = "Dot";
          Chars2[Chars2["Slash"] = 47] = "Slash";
          Chars2[Chars2["Colon"] = 58] = "Colon";
          Chars2[Chars2["Excl"] = 33] = "Excl";
          Chars2[Chars2["At"] = 64] = "At";
          Chars2[Chars2["Underscore"] = 95] = "Underscore";
          Chars2[Chars2["RoundBracketOpen"] = 40] = "RoundBracketOpen";
          Chars2[Chars2["RoundBracketClose"] = 41] = "RoundBracketClose";
          Chars2[Chars2["Sibling"] = 43] = "Sibling";
          Chars2[Chars2["Child"] = 62] = "Child";
          Chars2[Chars2["Climb"] = 94] = "Climb";
          Chars2[Chars2["SingleQuote"] = 39] = "SingleQuote";
          Chars2[Chars2["DoubleQuote"] = 34] = "DoubleQuote";
        })(Chars$3 || (Chars$3 = {}));
        function escaped(scanner) {
          if (scanner.eat(Chars$3.Escape)) {
            scanner.start = scanner.pos;
            if (!scanner.eof()) {
              scanner.pos++;
            }
            return true;
          }
          return false;
        }
        function tokenize$1(source) {
          const scanner = new Scanner(source);
          const result = [];
          const ctx = {
            group: 0,
            attribute: 0,
            expression: 0,
            quote: 0
          };
          let ch = 0;
          let token;
          while (!scanner.eof()) {
            ch = scanner.peek();
            token = getToken$1(scanner, ctx);
            if (token) {
              result.push(token);
              if (token.type === "Quote") {
                ctx.quote = ch === ctx.quote ? 0 : ch;
              } else if (token.type === "Bracket") {
                ctx[token.context] += token.open ? 1 : -1;
              }
            } else {
              throw scanner.error("Unexpected character");
            }
          }
          return result;
        }
        function getToken$1(scanner, ctx) {
          return field$2(scanner, ctx) || repeaterPlaceholder(scanner) || repeaterNumber(scanner) || repeater(scanner) || whiteSpace$1(scanner) || literal$2(scanner, ctx) || operator$1(scanner) || quote(scanner) || bracket$1(scanner);
        }
        function literal$2(scanner, ctx) {
          const start = scanner.pos;
          const expressionStart2 = ctx.expression;
          let value = "";
          while (!scanner.eof()) {
            if (escaped(scanner)) {
              value += scanner.current();
              continue;
            }
            const ch = scanner.peek();
            if (ch === Chars$3.Slash && !ctx.quote && !ctx.expression && !ctx.attribute) {
              const prev = scanner.string.charCodeAt(scanner.pos - 1);
              const next2 = scanner.string.charCodeAt(scanner.pos + 1);
              if (isNumber$1(prev) && isNumber$1(next2)) {
                value += scanner.string[scanner.pos++];
                continue;
              }
            }
            if (ch === ctx.quote || ch === Chars$3.Dollar || isAllowedOperator(ch, ctx)) {
              break;
            }
            if (expressionStart2) {
              if (ch === Chars$3.CurlyBracketOpen) {
                ctx.expression++;
              } else if (ch === Chars$3.CurlyBracketClose) {
                if (ctx.expression > expressionStart2) {
                  ctx.expression--;
                } else {
                  break;
                }
              }
            } else if (!ctx.quote) {
              if (!ctx.attribute && !isElementName(ch)) {
                break;
              }
              if (isAllowedSpace(ch, ctx) || isAllowedRepeater(ch, ctx) || isQuote$2(ch) || bracketType(ch)) {
                break;
              }
            }
            value += scanner.string[scanner.pos++];
          }
          if (start !== scanner.pos) {
            scanner.start = start;
            return {
              type: "Literal",
              value,
              start,
              end: scanner.pos
            };
          }
        }
        function whiteSpace$1(scanner) {
          const start = scanner.pos;
          if (scanner.eatWhile(isSpace)) {
            return {
              type: "WhiteSpace",
              start,
              end: scanner.pos,
              value: scanner.substring(start, scanner.pos)
            };
          }
        }
        function quote(scanner) {
          const ch = scanner.peek();
          if (isQuote$2(ch)) {
            return {
              type: "Quote",
              single: ch === Chars$3.SingleQuote,
              start: scanner.pos++,
              end: scanner.pos
            };
          }
        }
        function bracket$1(scanner) {
          const ch = scanner.peek();
          const context = bracketType(ch);
          if (context) {
            return {
              type: "Bracket",
              open: isOpenBracket$2(ch),
              context,
              start: scanner.pos++,
              end: scanner.pos
            };
          }
        }
        function operator$1(scanner) {
          const op = operatorType$1(scanner.peek());
          if (op) {
            return {
              type: "Operator",
              operator: op,
              start: scanner.pos++,
              end: scanner.pos
            };
          }
        }
        function repeater(scanner) {
          const start = scanner.pos;
          if (scanner.eat(Chars$3.Asterisk)) {
            scanner.start = scanner.pos;
            let count = 1;
            let implicit = false;
            if (scanner.eatWhile(isNumber$1)) {
              count = Number(scanner.current());
            } else {
              implicit = true;
            }
            return {
              type: "Repeater",
              count,
              value: 0,
              implicit,
              start,
              end: scanner.pos
            };
          }
        }
        function repeaterPlaceholder(scanner) {
          const start = scanner.pos;
          if (scanner.eat(Chars$3.Dollar) && scanner.eat(Chars$3.Hash)) {
            return {
              type: "RepeaterPlaceholder",
              value: void 0,
              start,
              end: scanner.pos
            };
          }
          scanner.pos = start;
        }
        function repeaterNumber(scanner) {
          const start = scanner.pos;
          if (scanner.eatWhile(Chars$3.Dollar)) {
            const size = scanner.pos - start;
            let reverse = false;
            let base = 1;
            let parent = 0;
            if (scanner.eat(Chars$3.At)) {
              while (scanner.eat(Chars$3.Climb)) {
                parent++;
              }
              reverse = scanner.eat(Chars$3.Dash);
              scanner.start = scanner.pos;
              if (scanner.eatWhile(isNumber$1)) {
                base = Number(scanner.current());
              }
            }
            scanner.start = start;
            return {
              type: "RepeaterNumber",
              size,
              reverse,
              base,
              parent,
              start,
              end: scanner.pos
            };
          }
        }
        function field$2(scanner, ctx) {
          const start = scanner.pos;
          if ((ctx.expression || ctx.attribute) && scanner.eat(Chars$3.Dollar) && scanner.eat(Chars$3.CurlyBracketOpen)) {
            scanner.start = scanner.pos;
            let index;
            let name = "";
            if (scanner.eatWhile(isNumber$1)) {
              index = Number(scanner.current());
              name = scanner.eat(Chars$3.Colon) ? consumePlaceholder$2(scanner) : "";
            } else if (isAlpha$1(scanner.peek())) {
              name = consumePlaceholder$2(scanner);
            }
            if (scanner.eat(Chars$3.CurlyBracketClose)) {
              return {
                type: "Field",
                index,
                name,
                start,
                end: scanner.pos
              };
            }
            throw scanner.error("Expecting }");
          }
          scanner.pos = start;
        }
        function consumePlaceholder$2(stream) {
          const stack = [];
          stream.start = stream.pos;
          while (!stream.eof()) {
            if (stream.eat(Chars$3.CurlyBracketOpen)) {
              stack.push(stream.pos);
            } else if (stream.eat(Chars$3.CurlyBracketClose)) {
              if (!stack.length) {
                stream.pos--;
                break;
              }
              stack.pop();
            } else {
              stream.pos++;
            }
          }
          if (stack.length) {
            stream.pos = stack.pop();
            throw stream.error(`Expecting }`);
          }
          return stream.current();
        }
        function isAllowedOperator(ch, ctx) {
          const op = operatorType$1(ch);
          if (!op || ctx.quote || ctx.expression) {
            return false;
          }
          return !ctx.attribute || op === "equal";
        }
        function isAllowedSpace(ch, ctx) {
          return isSpace(ch) && !ctx.expression;
        }
        function isAllowedRepeater(ch, ctx) {
          return ch === Chars$3.Asterisk && !ctx.attribute && !ctx.expression;
        }
        function bracketType(ch) {
          if (ch === Chars$3.RoundBracketOpen || ch === Chars$3.RoundBracketClose) {
            return "group";
          }
          if (ch === Chars$3.SquareBracketOpen || ch === Chars$3.SquareBracketClose) {
            return "attribute";
          }
          if (ch === Chars$3.CurlyBracketOpen || ch === Chars$3.CurlyBracketClose) {
            return "expression";
          }
        }
        function operatorType$1(ch) {
          return ch === Chars$3.Child && "child" || ch === Chars$3.Sibling && "sibling" || ch === Chars$3.Climb && "climb" || ch === Chars$3.Dot && "class" || ch === Chars$3.Hash && "id" || ch === Chars$3.Slash && "close" || ch === Chars$3.Equals && "equal" || void 0;
        }
        function isOpenBracket$2(ch) {
          return ch === Chars$3.CurlyBracketOpen || ch === Chars$3.SquareBracketOpen || ch === Chars$3.RoundBracketOpen;
        }
        function isElementName(ch) {
          return isAlphaNumericWord(ch) || isUmlaut(ch) || ch === Chars$3.Dash || ch === Chars$3.Colon || ch === Chars$3.Excl;
        }
        var operators = {
          child: ">",
          class: ".",
          climb: "^",
          id: "#",
          equal: "=",
          close: "/",
          sibling: "+"
        };
        var tokenVisitor = {
          Literal(token) {
            return token.value;
          },
          Quote(token) {
            return token.single ? "'" : '"';
          },
          Bracket(token) {
            if (token.context === "attribute") {
              return token.open ? "[" : "]";
            } else if (token.context === "expression") {
              return token.open ? "{" : "}";
            } else {
              return token.open ? "(" : "}";
            }
          },
          Operator(token) {
            return operators[token.operator];
          },
          Field(token, state) {
            if (token.index != null) {
              return token.name ? `\${${token.index}:${token.name}}` : `\${${token.index}`;
            } else if (token.name) {
              return state.getVariable(token.name);
            }
            return "";
          },
          RepeaterPlaceholder(token, state) {
            let repeater2;
            for (let i = state.repeaters.length - 1; i >= 0; i--) {
              if (state.repeaters[i].implicit) {
                repeater2 = state.repeaters[i];
                break;
              }
            }
            state.inserted = true;
            return state.getText(repeater2 && repeater2.value);
          },
          RepeaterNumber(token, state) {
            let value = 1;
            const lastIx = state.repeaters.length - 1;
            const repeater2 = state.repeaters[lastIx];
            if (repeater2) {
              value = token.reverse ? token.base + repeater2.count - repeater2.value - 1 : token.base + repeater2.value;
              if (token.parent) {
                const parentIx = Math.max(0, lastIx - token.parent);
                if (parentIx !== lastIx) {
                  const parentRepeater = state.repeaters[parentIx];
                  value += repeater2.count * parentRepeater.value;
                }
              }
            }
            let result = String(value);
            while (result.length < token.size) {
              result = "0" + result;
            }
            return result;
          },
          WhiteSpace(token) {
            return token.value;
          }
        };
        function stringify$1(token, state) {
          if (!tokenVisitor[token.type]) {
            throw new Error(`Unknown token ${token.type}`);
          }
          return tokenVisitor[token.type](token, state);
        }
        var urlRegex = /^((https?:|ftp:|file:)?\/\/|(www|ftp)\.)[^ ]*$/;
        var emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,5}$/;
        function convert(abbr, options = {}) {
          let textInserted = false;
          let cleanText;
          if (options.text) {
            if (Array.isArray(options.text)) {
              cleanText = options.text.filter((s) => s.trim());
            } else {
              cleanText = options.text;
            }
          }
          const result = {
            type: "Abbreviation",
            children: convertGroup(abbr, {
              inserted: false,
              repeaters: [],
              text: options.text,
              cleanText,
              repeatGuard: options.maxRepeat || Number.POSITIVE_INFINITY,
              getText(pos) {
                var _a;
                textInserted = true;
                let value;
                if (Array.isArray(options.text)) {
                  if (pos !== void 0 && pos >= 0 && pos < cleanText.length) {
                    return cleanText[pos];
                  }
                  value = pos !== void 0 ? options.text[pos] : options.text.join("\n");
                } else {
                  value = (_a = options.text) !== null && _a !== void 0 ? _a : "";
                }
                return value;
              },
              getVariable(name) {
                const varValue = options.variables && options.variables[name];
                return varValue != null ? varValue : name;
              }
            })
          };
          if (options.text != null && !textInserted) {
            const deepest = deepestNode(last$1(result.children));
            if (deepest) {
              const text2 = Array.isArray(options.text) ? options.text.join("\n") : options.text;
              insertText(deepest, text2);
              if (deepest.name === "a" && options.href) {
                insertHref(deepest, text2);
              }
            }
          }
          return result;
        }
        function convertStatement(node, state) {
          let result = [];
          if (node.repeat) {
            const original = node.repeat;
            const repeat = Object.assign({}, original);
            repeat.count = repeat.implicit && Array.isArray(state.text) ? state.cleanText.length : repeat.count || 1;
            let items;
            state.repeaters.push(repeat);
            for (let i = 0; i < repeat.count; i++) {
              repeat.value = i;
              node.repeat = repeat;
              items = isGroup(node) ? convertGroup(node, state) : convertElement(node, state);
              if (repeat.implicit && !state.inserted) {
                const target = last$1(items);
                const deepest = target && deepestNode(target);
                if (deepest) {
                  insertText(deepest, state.getText(repeat.value));
                }
              }
              result = result.concat(items);
              if (--state.repeatGuard <= 0) {
                break;
              }
            }
            state.repeaters.pop();
            node.repeat = original;
            if (repeat.implicit) {
              state.inserted = true;
            }
          } else {
            result = result.concat(isGroup(node) ? convertGroup(node, state) : convertElement(node, state));
          }
          return result;
        }
        function convertElement(node, state) {
          let children = [];
          const elem = {
            type: "AbbreviationNode",
            name: node.name && stringifyName(node.name, state),
            value: node.value && stringifyValue$1(node.value, state),
            attributes: void 0,
            children,
            repeat: node.repeat && Object.assign({}, node.repeat),
            selfClosing: node.selfClose
          };
          let result = [elem];
          for (const child of node.elements) {
            children = children.concat(convertStatement(child, state));
          }
          if (node.attributes) {
            elem.attributes = [];
            for (const attr of node.attributes) {
              elem.attributes.push(convertAttribute(attr, state));
            }
          }
          if (!elem.name && !elem.attributes && elem.value && !elem.value.some(isField$1)) {
            result = result.concat(children);
          } else {
            elem.children = children;
          }
          return result;
        }
        function convertGroup(node, state) {
          let result = [];
          for (const child of node.elements) {
            result = result.concat(convertStatement(child, state));
          }
          if (node.repeat) {
            result = attachRepeater(result, node.repeat);
          }
          return result;
        }
        function convertAttribute(node, state) {
          let implied = false;
          let isBoolean = false;
          let valueType = node.expression ? "expression" : "raw";
          let value;
          const name = node.name && stringifyName(node.name, state);
          if (name && name[0] === "!") {
            implied = true;
          }
          if (name && name[name.length - 1] === ".") {
            isBoolean = true;
          }
          if (node.value) {
            const tokens = node.value.slice();
            if (isQuote$1(tokens[0])) {
              const quote2 = tokens.shift();
              if (tokens.length && last$1(tokens).type === quote2.type) {
                tokens.pop();
              }
              valueType = quote2.single ? "singleQuote" : "doubleQuote";
            } else if (isBracket$2(tokens[0], "expression", true)) {
              valueType = "expression";
              tokens.shift();
              if (isBracket$2(last$1(tokens), "expression", false)) {
                tokens.pop();
              }
            }
            value = stringifyValue$1(tokens, state);
          }
          return {
            name: isBoolean || implied ? name.slice(implied ? 1 : 0, isBoolean ? -1 : void 0) : name,
            value,
            boolean: isBoolean,
            implied,
            valueType,
            multiple: node.multiple
          };
        }
        function stringifyName(tokens, state) {
          let str = "";
          for (let i = 0; i < tokens.length; i++) {
            str += stringify$1(tokens[i], state);
          }
          return str;
        }
        function stringifyValue$1(tokens, state) {
          const result = [];
          let str = "";
          for (let i = 0, token; i < tokens.length; i++) {
            token = tokens[i];
            if (isField$1(token)) {
              if (str) {
                result.push(str);
                str = "";
              }
              result.push(token);
            } else {
              str += stringify$1(token, state);
            }
          }
          if (str) {
            result.push(str);
          }
          return result;
        }
        function isGroup(node) {
          return node.type === "TokenGroup";
        }
        function isField$1(token) {
          return typeof token === "object" && token.type === "Field" && token.index != null;
        }
        function last$1(arr) {
          return arr[arr.length - 1];
        }
        function deepestNode(node) {
          return node.children.length ? deepestNode(last$1(node.children)) : node;
        }
        function insertText(node, text2) {
          if (node.value) {
            const lastToken = last$1(node.value);
            if (typeof lastToken === "string") {
              node.value[node.value.length - 1] += text2;
            } else {
              node.value.push(text2);
            }
          } else {
            node.value = [text2];
          }
        }
        function insertHref(node, text2) {
          var _a;
          let href = "";
          if (urlRegex.test(text2)) {
            href = text2;
            if (!/\w+:/.test(href) && !href.startsWith("//")) {
              href = `http://${href}`;
            }
          } else if (emailRegex.test(text2)) {
            href = `mailto:${text2}`;
          }
          const hrefAttribute = (_a = node.attributes) === null || _a === void 0 ? void 0 : _a.find((attr) => attr.name === "href");
          if (!hrefAttribute) {
            if (!node.attributes) {
              node.attributes = [];
            }
            node.attributes.push({ name: "href", value: [href], valueType: "doubleQuote" });
          } else if (!hrefAttribute.value) {
            hrefAttribute.value = [href];
          }
        }
        function attachRepeater(items, repeater2) {
          for (const item of items) {
            if (!item.repeat) {
              item.repeat = Object.assign({}, repeater2);
            }
          }
          return items;
        }
        function parseAbbreviation(abbr, options) {
          try {
            const tokens = typeof abbr === "string" ? tokenize$1(abbr) : abbr;
            return convert(abbreviation(tokens, options), options);
          } catch (err) {
            if (err instanceof ScannerError && typeof abbr === "string") {
              err.message += `
      ${abbr}
      ${"-".repeat(err.pos)}^`;
            }
            throw err;
          }
        }
        var OperatorType;
        (function(OperatorType2) {
          OperatorType2["Sibling"] = "+";
          OperatorType2["Important"] = "!";
          OperatorType2["ArgumentDelimiter"] = ",";
          OperatorType2["ValueDelimiter"] = "-";
          OperatorType2["PropertyDelimiter"] = ":";
        })(OperatorType || (OperatorType = {}));
        var Chars$2;
        (function(Chars2) {
          Chars2[Chars2["Hash"] = 35] = "Hash";
          Chars2[Chars2["Dollar"] = 36] = "Dollar";
          Chars2[Chars2["Dash"] = 45] = "Dash";
          Chars2[Chars2["Dot"] = 46] = "Dot";
          Chars2[Chars2["Colon"] = 58] = "Colon";
          Chars2[Chars2["Comma"] = 44] = "Comma";
          Chars2[Chars2["Excl"] = 33] = "Excl";
          Chars2[Chars2["At"] = 64] = "At";
          Chars2[Chars2["Percent"] = 37] = "Percent";
          Chars2[Chars2["Underscore"] = 95] = "Underscore";
          Chars2[Chars2["RoundBracketOpen"] = 40] = "RoundBracketOpen";
          Chars2[Chars2["RoundBracketClose"] = 41] = "RoundBracketClose";
          Chars2[Chars2["CurlyBracketOpen"] = 123] = "CurlyBracketOpen";
          Chars2[Chars2["CurlyBracketClose"] = 125] = "CurlyBracketClose";
          Chars2[Chars2["Sibling"] = 43] = "Sibling";
          Chars2[Chars2["SingleQuote"] = 39] = "SingleQuote";
          Chars2[Chars2["DoubleQuote"] = 34] = "DoubleQuote";
          Chars2[Chars2["Transparent"] = 116] = "Transparent";
          Chars2[Chars2["Slash"] = 47] = "Slash";
        })(Chars$2 || (Chars$2 = {}));
        function tokenize(abbr, isValue2) {
          let brackets = 0;
          let token;
          const scanner = new Scanner(abbr);
          const tokens = [];
          while (!scanner.eof()) {
            token = getToken(scanner, brackets === 0 && !isValue2);
            if (!token) {
              throw scanner.error("Unexpected character");
            }
            if (token.type === "Bracket") {
              if (!brackets && token.open) {
                mergeTokens(scanner, tokens);
              }
              brackets += token.open ? 1 : -1;
              if (brackets < 0) {
                throw scanner.error("Unexpected bracket", token.start);
              }
            }
            tokens.push(token);
            if (shouldConsumeDashAfter(token) && (token = operator(scanner))) {
              tokens.push(token);
            }
          }
          return tokens;
        }
        function getToken(scanner, short) {
          return field$1(scanner) || customProperty(scanner) || numberValue(scanner) || colorValue(scanner) || stringValue(scanner) || bracket(scanner) || operator(scanner) || whiteSpace(scanner) || literal$1(scanner, short);
        }
        function field$1(scanner) {
          const start = scanner.pos;
          if (scanner.eat(Chars$2.Dollar) && scanner.eat(Chars$2.CurlyBracketOpen)) {
            scanner.start = scanner.pos;
            let index;
            let name = "";
            if (scanner.eatWhile(isNumber$1)) {
              index = Number(scanner.current());
              name = scanner.eat(Chars$2.Colon) ? consumePlaceholder$1(scanner) : "";
            } else if (isAlpha$1(scanner.peek())) {
              name = consumePlaceholder$1(scanner);
            }
            if (scanner.eat(Chars$2.CurlyBracketClose)) {
              return {
                type: "Field",
                index,
                name,
                start,
                end: scanner.pos
              };
            }
            throw scanner.error("Expecting }");
          }
          scanner.pos = start;
        }
        function consumePlaceholder$1(stream) {
          const stack = [];
          stream.start = stream.pos;
          while (!stream.eof()) {
            if (stream.eat(Chars$2.CurlyBracketOpen)) {
              stack.push(stream.pos);
            } else if (stream.eat(Chars$2.CurlyBracketClose)) {
              if (!stack.length) {
                stream.pos--;
                break;
              }
              stack.pop();
            } else {
              stream.pos++;
            }
          }
          if (stack.length) {
            stream.pos = stack.pop();
            throw stream.error(`Expecting }`);
          }
          return stream.current();
        }
        function literal$1(scanner, short) {
          const start = scanner.pos;
          if (scanner.eat(isIdentPrefix)) {
            scanner.eatWhile(start ? isKeyword : isLiteral$1);
          } else if (scanner.eat(isAlphaWord)) {
            scanner.eatWhile(short ? isLiteral$1 : isKeyword);
          } else {
            scanner.eat(Chars$2.Dot);
            scanner.eatWhile(isLiteral$1);
          }
          if (start !== scanner.pos) {
            scanner.start = start;
            return createLiteral(scanner, scanner.start = start);
          }
        }
        function createLiteral(scanner, start = scanner.start, end = scanner.pos) {
          return {
            type: "Literal",
            value: scanner.substring(start, end),
            start,
            end
          };
        }
        function numberValue(scanner) {
          const start = scanner.pos;
          if (consumeNumber(scanner)) {
            scanner.start = start;
            const rawValue = scanner.current();
            scanner.start = scanner.pos;
            scanner.eat(Chars$2.Percent) || scanner.eatWhile(isAlphaWord);
            return {
              type: "NumberValue",
              value: Number(rawValue),
              rawValue,
              unit: scanner.current(),
              start,
              end: scanner.pos
            };
          }
        }
        function stringValue(scanner) {
          const ch = scanner.peek();
          const start = scanner.pos;
          let finished = false;
          if (isQuote$2(ch)) {
            scanner.pos++;
            while (!scanner.eof()) {
              if (scanner.eat(ch)) {
                finished = true;
                break;
              } else {
                scanner.pos++;
              }
            }
            scanner.start = start;
            return {
              type: "StringValue",
              value: scanner.substring(start + 1, scanner.pos - (finished ? 1 : 0)),
              quote: ch === Chars$2.SingleQuote ? "single" : "double",
              start,
              end: scanner.pos
            };
          }
        }
        function colorValue(scanner) {
          const start = scanner.pos;
          if (scanner.eat(Chars$2.Hash)) {
            const valueStart = scanner.pos;
            let color2 = "";
            let alpha = "";
            if (scanner.eatWhile(isHex)) {
              color2 = scanner.substring(valueStart, scanner.pos);
              alpha = colorAlpha(scanner);
            } else if (scanner.eat(Chars$2.Transparent)) {
              color2 = "0";
              alpha = colorAlpha(scanner) || "0";
            } else {
              alpha = colorAlpha(scanner);
            }
            if (color2 || alpha || scanner.eof()) {
              const { r, g, b, a } = parseColor(color2, alpha);
              return {
                type: "ColorValue",
                r,
                g,
                b,
                a,
                raw: scanner.substring(start + 1, scanner.pos),
                start,
                end: scanner.pos
              };
            } else {
              return createLiteral(scanner, start);
            }
          }
          scanner.pos = start;
        }
        function colorAlpha(scanner) {
          const start = scanner.pos;
          if (scanner.eat(Chars$2.Dot)) {
            scanner.start = start;
            if (scanner.eatWhile(isNumber$1)) {
              return scanner.current();
            }
            return "1";
          }
          return "";
        }
        function whiteSpace(scanner) {
          const start = scanner.pos;
          if (scanner.eatWhile(isSpace)) {
            return {
              type: "WhiteSpace",
              start,
              end: scanner.pos
            };
          }
        }
        function customProperty(scanner) {
          const start = scanner.pos;
          if (scanner.eat(Chars$2.Dash) && scanner.eat(Chars$2.Dash)) {
            scanner.start = start;
            scanner.eatWhile(isKeyword);
            return {
              type: "CustomProperty",
              value: scanner.current(),
              start,
              end: scanner.pos
            };
          }
          scanner.pos = start;
        }
        function bracket(scanner) {
          const ch = scanner.peek();
          if (isBracket$1(ch)) {
            return {
              type: "Bracket",
              open: ch === Chars$2.RoundBracketOpen,
              start: scanner.pos++,
              end: scanner.pos
            };
          }
        }
        function operator(scanner) {
          const op = operatorType(scanner.peek());
          if (op) {
            return {
              type: "Operator",
              operator: op,
              start: scanner.pos++,
              end: scanner.pos
            };
          }
        }
        function consumeNumber(stream) {
          const start = stream.pos;
          stream.eat(Chars$2.Dash);
          const afterNegative = stream.pos;
          const hasDecimal = stream.eatWhile(isNumber$1);
          const prevPos = stream.pos;
          if (stream.eat(Chars$2.Dot)) {
            const hasFloat = stream.eatWhile(isNumber$1);
            if (!hasDecimal && !hasFloat) {
              stream.pos = prevPos;
            }
          }
          if (stream.pos === afterNegative) {
            stream.pos = start;
          }
          return stream.pos !== start;
        }
        function isIdentPrefix(code2) {
          return code2 === Chars$2.At || code2 === Chars$2.Dollar;
        }
        function operatorType(ch) {
          return ch === Chars$2.Sibling && OperatorType.Sibling || ch === Chars$2.Excl && OperatorType.Important || ch === Chars$2.Comma && OperatorType.ArgumentDelimiter || ch === Chars$2.Colon && OperatorType.PropertyDelimiter || ch === Chars$2.Dash && OperatorType.ValueDelimiter || void 0;
        }
        function isHex(code2) {
          return isNumber$1(code2) || isAlpha$1(code2, 65, 70);
        }
        function isKeyword(code2) {
          return isAlphaNumericWord(code2) || code2 === Chars$2.Dash;
        }
        function isBracket$1(code2) {
          return code2 === Chars$2.RoundBracketOpen || code2 === Chars$2.RoundBracketClose;
        }
        function isLiteral$1(code2) {
          return isAlphaWord(code2) || code2 === Chars$2.Percent || code2 === Chars$2.Slash;
        }
        function parseColor(value, alpha) {
          let r = "0";
          let g = "0";
          let b = "0";
          let a = Number(alpha != null && alpha !== "" ? alpha : 1);
          if (value === "t") {
            a = 0;
          } else {
            switch (value.length) {
              case 0:
                break;
              case 1:
                r = g = b = value + value;
                break;
              case 2:
                r = g = b = value;
                break;
              case 3:
                r = value[0] + value[0];
                g = value[1] + value[1];
                b = value[2] + value[2];
                break;
              default:
                value += value;
                r = value.slice(0, 2);
                g = value.slice(2, 4);
                b = value.slice(4, 6);
            }
          }
          return {
            r: parseInt(r, 16),
            g: parseInt(g, 16),
            b: parseInt(b, 16),
            a
          };
        }
        function shouldConsumeDashAfter(token) {
          return token.type === "ColorValue" || token.type === "NumberValue" && !token.unit;
        }
        function mergeTokens(scanner, tokens) {
          let start = 0;
          let end = 0;
          while (tokens.length) {
            const token = last(tokens);
            if (token.type === "Literal" || token.type === "NumberValue") {
              start = token.start;
              if (!end) {
                end = token.end;
              }
              tokens.pop();
            } else {
              break;
            }
          }
          if (start !== end) {
            tokens.push(createLiteral(scanner, start, end));
          }
        }
        function last(arr) {
          return arr[arr.length - 1];
        }
        function tokenScanner(tokens) {
          return {
            tokens,
            start: 0,
            pos: 0,
            size: tokens.length
          };
        }
        function peek$2(scanner) {
          return scanner.tokens[scanner.pos];
        }
        function readable(scanner) {
          return scanner.pos < scanner.size;
        }
        function consume$1(scanner, test) {
          if (test(peek$2(scanner))) {
            scanner.pos++;
            return true;
          }
          return false;
        }
        function error(scanner, message, token = peek$2(scanner)) {
          if (token && token.start != null) {
            message += ` at ${token.start}`;
          }
          const err = new Error(message);
          err["pos"] = token && token.start;
          return err;
        }
        function parser(tokens, options = {}) {
          const scanner = tokenScanner(tokens);
          const result = [];
          let property2;
          while (readable(scanner)) {
            if (property2 = consumeProperty(scanner, options)) {
              result.push(property2);
            } else if (!consume$1(scanner, isSiblingOperator)) {
              throw error(scanner, "Unexpected token");
            }
          }
          return result;
        }
        function consumeProperty(scanner, options) {
          let name;
          let important = false;
          let valueFragment;
          const value = [];
          const token = peek$2(scanner);
          const valueMode = !!options.value;
          if (!valueMode && isLiteral(token) && !isFunctionStart(scanner)) {
            scanner.pos++;
            name = token.value;
            consume$1(scanner, isValueDelimiter);
          }
          if (valueMode) {
            consume$1(scanner, isWhiteSpace$1);
          }
          while (readable(scanner)) {
            if (consume$1(scanner, isImportant)) {
              important = true;
            } else if (valueFragment = consumeValue(scanner, valueMode)) {
              value.push(valueFragment);
            } else if (!consume$1(scanner, isFragmentDelimiter)) {
              break;
            }
          }
          if (name || value.length || important) {
            return { name, value, important };
          }
        }
        function consumeValue(scanner, inArgument) {
          const result = [];
          let token;
          let args;
          while (readable(scanner)) {
            token = peek$2(scanner);
            if (isValue(token)) {
              scanner.pos++;
              if (isLiteral(token) && (args = consumeArguments(scanner))) {
                result.push({
                  type: "FunctionCall",
                  name: token.value,
                  arguments: args
                });
              } else {
                result.push(token);
              }
            } else if (isValueDelimiter(token) || inArgument && isWhiteSpace$1(token)) {
              scanner.pos++;
            } else {
              break;
            }
          }
          return result.length ? { type: "CSSValue", value: result } : void 0;
        }
        function consumeArguments(scanner) {
          const start = scanner.pos;
          if (consume$1(scanner, isOpenBracket$1)) {
            const args = [];
            let value;
            while (readable(scanner) && !consume$1(scanner, isCloseBracket$1)) {
              if (value = consumeValue(scanner, true)) {
                args.push(value);
              } else if (!consume$1(scanner, isWhiteSpace$1) && !consume$1(scanner, isArgumentDelimiter)) {
                throw error(scanner, "Unexpected token");
              }
            }
            scanner.start = start;
            return args;
          }
        }
        function isLiteral(token) {
          return token && token.type === "Literal";
        }
        function isBracket(token, open) {
          return token && token.type === "Bracket" && (open == null || token.open === open);
        }
        function isOpenBracket$1(token) {
          return isBracket(token, true);
        }
        function isCloseBracket$1(token) {
          return isBracket(token, false);
        }
        function isWhiteSpace$1(token) {
          return token && token.type === "WhiteSpace";
        }
        function isOperator(token, operator2) {
          return token && token.type === "Operator" && (!operator2 || token.operator === operator2);
        }
        function isSiblingOperator(token) {
          return isOperator(token, OperatorType.Sibling);
        }
        function isArgumentDelimiter(token) {
          return isOperator(token, OperatorType.ArgumentDelimiter);
        }
        function isFragmentDelimiter(token) {
          return isArgumentDelimiter(token);
        }
        function isImportant(token) {
          return isOperator(token, OperatorType.Important);
        }
        function isValue(token) {
          return token.type === "StringValue" || token.type === "ColorValue" || token.type === "NumberValue" || token.type === "Literal" || token.type === "Field" || token.type === "CustomProperty";
        }
        function isValueDelimiter(token) {
          return isOperator(token, OperatorType.PropertyDelimiter) || isOperator(token, OperatorType.ValueDelimiter);
        }
        function isFunctionStart(scanner) {
          const t1 = scanner.tokens[scanner.pos];
          const t2 = scanner.tokens[scanner.pos + 1];
          return t1 && t2 && isLiteral(t1) && t2.type === "Bracket";
        }
        function parse$2(abbr, options) {
          try {
            const tokens = typeof abbr === "string" ? tokenize(abbr, options && options.value) : abbr;
            return parser(tokens, options);
          } catch (err) {
            if (err instanceof ScannerError && typeof abbr === "string") {
              err.message += `
      ${abbr}
      ${"-".repeat(err.pos)}^`;
            }
            throw err;
          }
        }
        function mergeAttributes(node, config) {
          if (!node.attributes) {
            return;
          }
          const attributes = [];
          const lookup = {};
          for (const attr of node.attributes) {
            if (attr.name) {
              const attrName2 = attr.name;
              if (attrName2 in lookup) {
                const prev = lookup[attrName2];
                if (attrName2 === "class") {
                  prev.value = mergeValue(prev.value, attr.value, " ");
                } else {
                  mergeDeclarations(prev, attr, config);
                }
              } else {
                attributes.push(lookup[attrName2] = Object.assign({}, attr));
              }
            } else {
              attributes.push(attr);
            }
          }
          node.attributes = attributes;
        }
        function mergeValue(prev, next2, glue) {
          if (prev && next2) {
            if (prev.length && glue) {
              append(prev, glue);
            }
            for (const t of next2) {
              append(prev, t);
            }
            return prev;
          }
          const result = prev || next2;
          return result && result.slice();
        }
        function mergeDeclarations(dest, src, config) {
          dest.name = src.name;
          if (!config.options["output.reverseAttributes"]) {
            dest.value = src.value;
          }
          if (!dest.implied) {
            dest.implied = src.implied;
          }
          if (!dest.boolean) {
            dest.boolean = src.boolean;
          }
          if (dest.valueType !== "expression") {
            dest.valueType = src.valueType;
          }
          return dest;
        }
        function append(tokens, value) {
          const lastIx = tokens.length - 1;
          if (typeof tokens[lastIx] === "string" && typeof value === "string") {
            tokens[lastIx] += value;
          } else {
            tokens.push(value);
          }
        }
        function walk$1(node, fn, state) {
          const ancestors = [node];
          const callback = (ctx) => {
            fn(ctx, ancestors, state);
            ancestors.push(ctx);
            ctx.children.forEach(callback);
            ancestors.pop();
          };
          node.children.forEach(callback);
        }
        function findDeepest(node) {
          let parent;
          while (node.children.length) {
            parent = node;
            node = node.children[node.children.length - 1];
          }
          return { parent, node };
        }
        function isNode(node) {
          return node.type === "AbbreviationNode";
        }
        function resolveSnippets(abbr, config) {
          const stack = [];
          const reversed = config.options["output.reverseAttributes"];
          const resolve = (child) => {
            const snippet = child.name && config.snippets[child.name];
            if (!snippet || stack.includes(snippet)) {
              return null;
            }
            const snippetAbbr = parseAbbreviation(snippet, config);
            stack.push(snippet);
            walkResolve(snippetAbbr, resolve);
            stack.pop();
            for (const topNode of snippetAbbr.children) {
              if (child.attributes) {
                const from = topNode.attributes || [];
                const to = child.attributes || [];
                topNode.attributes = reversed ? to.concat(from) : from.concat(to);
              }
              mergeNodes(child, topNode);
            }
            return snippetAbbr;
          };
          walkResolve(abbr, resolve);
          return abbr;
        }
        function walkResolve(node, resolve, config) {
          let children = [];
          for (const child of node.children) {
            const resolved = resolve(child);
            if (resolved) {
              children = children.concat(resolved.children);
              const deepest = findDeepest(resolved);
              if (isNode(deepest.node)) {
                deepest.node.children = deepest.node.children.concat(walkResolve(child, resolve));
              }
            } else {
              children.push(child);
              child.children = walkResolve(child, resolve);
            }
          }
          return node.children = children;
        }
        function mergeNodes(from, to) {
          if (from.selfClosing) {
            to.selfClosing = true;
          }
          if (from.value != null) {
            to.value = from.value;
          }
          if (from.repeat) {
            to.repeat = from.repeat;
          }
        }
        var expressionStart = "{";
        var expressionEnd = "}";
        function createOutputStream(options, level = 0) {
          return {
            options,
            value: "",
            level,
            offset: 0,
            line: 0,
            column: 0
          };
        }
        function push(stream, text2) {
          const processText = stream.options["output.text"];
          _push(stream, processText(text2, stream.offset, stream.line, stream.column));
        }
        function pushString(stream, value) {
          const lines = splitByLines$1(value);
          for (let i = 0, il = lines.length - 1; i <= il; i++) {
            push(stream, lines[i]);
            if (i !== il) {
              pushNewline(stream, true);
            }
          }
        }
        function pushNewline(stream, indent) {
          const baseIndent = stream.options["output.baseIndent"];
          const newline = stream.options["output.newline"];
          push(stream, newline + baseIndent);
          stream.line++;
          stream.column = baseIndent.length;
          if (indent) {
            pushIndent(stream, indent === true ? stream.level : indent);
          }
        }
        function pushIndent(stream, size = stream.level) {
          const indent = stream.options["output.indent"];
          push(stream, indent.repeat(Math.max(size, 0)));
        }
        function pushField(stream, index, placeholder) {
          const field2 = stream.options["output.field"];
          _push(stream, field2(index, placeholder, stream.offset, stream.line, stream.column));
        }
        function tagName(name, config) {
          return strCase(name, config.options["output.tagCase"]);
        }
        function attrName(name, config) {
          return strCase(name, config.options["output.attributeCase"]);
        }
        function attrQuote(attr, config, isOpen) {
          if (attr.valueType === "expression") {
            return isOpen ? expressionStart : expressionEnd;
          }
          return config.options["output.attributeQuotes"] === "single" ? "'" : '"';
        }
        function isBooleanAttribute(attr, config) {
          return attr.boolean || config.options["output.booleanAttributes"].includes((attr.name || "").toLowerCase());
        }
        function selfClose(config) {
          switch (config.options["output.selfClosingStyle"]) {
            case "xhtml":
              return " /";
            case "xml":
              return "/";
            default:
              return "";
          }
        }
        function isInline(node, config) {
          if (typeof node === "string") {
            return config.options.inlineElements.includes(node.toLowerCase());
          }
          return node.name ? isInline(node.name, config) : Boolean(node.value && !node.attributes);
        }
        function splitByLines$1(text2) {
          return text2.split(/\r\n|\r|\n/g);
        }
        function _push(stream, text2) {
          stream.value += text2;
          stream.offset += text2.length;
          stream.column += text2.length;
        }
        function strCase(str, type) {
          if (type) {
            return type === "upper" ? str.toUpperCase() : str.toLowerCase();
          }
          return str;
        }
        var elementMap = {
          p: "span",
          ul: "li",
          ol: "li",
          table: "tr",
          tr: "td",
          tbody: "tr",
          thead: "tr",
          tfoot: "tr",
          colgroup: "col",
          select: "option",
          optgroup: "option",
          audio: "source",
          video: "source",
          object: "param",
          map: "area"
        };
        function implicitTag(node, ancestors, config) {
          if (!node.name && node.attributes) {
            resolveImplicitTag(node, ancestors, config);
          }
        }
        function resolveImplicitTag(node, ancestors, config) {
          const parent = getParentElement(ancestors);
          const contextName = config.context ? config.context.name : "";
          const parentName = lowercase(parent ? parent.name : contextName);
          node.name = elementMap[parentName] || (isInline(parentName, config) ? "span" : "div");
        }
        function lowercase(str) {
          return (str || "").toLowerCase();
        }
        function getParentElement(ancestors) {
          for (let i = ancestors.length - 1; i >= 0; i--) {
            const elem = ancestors[i];
            if (isNode(elem)) {
              return elem;
            }
          }
        }
        var latin = {
          "common": ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipisicing", "elit"],
          "words": [
            "exercitationem",
            "perferendis",
            "perspiciatis",
            "laborum",
            "eveniet",
            "sunt",
            "iure",
            "nam",
            "nobis",
            "eum",
            "cum",
            "officiis",
            "excepturi",
            "odio",
            "consectetur",
            "quasi",
            "aut",
            "quisquam",
            "vel",
            "eligendi",
            "itaque",
            "non",
            "odit",
            "tempore",
            "quaerat",
            "dignissimos",
            "facilis",
            "neque",
            "nihil",
            "expedita",
            "vitae",
            "vero",
            "ipsum",
            "nisi",
            "animi",
            "cumque",
            "pariatur",
            "velit",
            "modi",
            "natus",
            "iusto",
            "eaque",
            "sequi",
            "illo",
            "sed",
            "ex",
            "et",
            "voluptatibus",
            "tempora",
            "veritatis",
            "ratione",
            "assumenda",
            "incidunt",
            "nostrum",
            "placeat",
            "aliquid",
            "fuga",
            "provident",
            "praesentium",
            "rem",
            "necessitatibus",
            "suscipit",
            "adipisci",
            "quidem",
            "possimus",
            "voluptas",
            "debitis",
            "sint",
            "accusantium",
            "unde",
            "sapiente",
            "voluptate",
            "qui",
            "aspernatur",
            "laudantium",
            "soluta",
            "amet",
            "quo",
            "aliquam",
            "saepe",
            "culpa",
            "libero",
            "ipsa",
            "dicta",
            "reiciendis",
            "nesciunt",
            "doloribus",
            "autem",
            "impedit",
            "minima",
            "maiores",
            "repudiandae",
            "ipsam",
            "obcaecati",
            "ullam",
            "enim",
            "totam",
            "delectus",
            "ducimus",
            "quis",
            "voluptates",
            "dolores",
            "molestiae",
            "harum",
            "dolorem",
            "quia",
            "voluptatem",
            "molestias",
            "magni",
            "distinctio",
            "omnis",
            "illum",
            "dolorum",
            "voluptatum",
            "ea",
            "quas",
            "quam",
            "corporis",
            "quae",
            "blanditiis",
            "atque",
            "deserunt",
            "laboriosam",
            "earum",
            "consequuntur",
            "hic",
            "cupiditate",
            "quibusdam",
            "accusamus",
            "ut",
            "rerum",
            "error",
            "minus",
            "eius",
            "ab",
            "ad",
            "nemo",
            "fugit",
            "officia",
            "at",
            "in",
            "id",
            "quos",
            "reprehenderit",
            "numquam",
            "iste",
            "fugiat",
            "sit",
            "inventore",
            "beatae",
            "repellendus",
            "magnam",
            "recusandae",
            "quod",
            "explicabo",
            "doloremque",
            "aperiam",
            "consequatur",
            "asperiores",
            "commodi",
            "optio",
            "dolor",
            "labore",
            "temporibus",
            "repellat",
            "veniam",
            "architecto",
            "est",
            "esse",
            "mollitia",
            "nulla",
            "a",
            "similique",
            "eos",
            "alias",
            "dolore",
            "tenetur",
            "deleniti",
            "porro",
            "facere",
            "maxime",
            "corrupti"
          ]
        };
        var ru = {
          "common": ["\u0434\u0430\u043B\u0435\u043A\u043E-\u0434\u0430\u043B\u0435\u043A\u043E", "\u0437\u0430", "\u0441\u043B\u043E\u0432\u0435\u0441\u043D\u044B\u043C\u0438", "\u0433\u043E\u0440\u0430\u043C\u0438", "\u0432 \u0441\u0442\u0440\u0430\u043D\u0435", "\u0433\u043B\u0430\u0441\u043D\u044B\u0445", "\u0438 \u0441\u043E\u0433\u043B\u0430\u0441\u043D\u044B\u0445", "\u0436\u0438\u0432\u0443\u0442", "\u0440\u044B\u0431\u043D\u044B\u0435", "\u0442\u0435\u043A\u0441\u0442\u044B"],
          "words": [
            "\u0432\u0434\u0430\u043B\u0438",
            "\u043E\u0442 \u0432\u0441\u0435\u0445",
            "\u043E\u043D\u0438",
            "\u0431\u0443\u043A\u0432\u0435\u043D\u043D\u044B\u0445",
            "\u0434\u043E\u043C\u0430\u0445",
            "\u043D\u0430 \u0431\u0435\u0440\u0435\u0433\u0443",
            "\u0441\u0435\u043C\u0430\u043D\u0442\u0438\u043A\u0430",
            "\u0431\u043E\u043B\u044C\u0448\u043E\u0433\u043E",
            "\u044F\u0437\u044B\u043A\u043E\u0432\u043E\u0433\u043E",
            "\u043E\u043A\u0435\u0430\u043D\u0430",
            "\u043C\u0430\u043B\u0435\u043D\u044C\u043A\u0438\u0439",
            "\u0440\u0443\u0447\u0435\u0435\u043A",
            "\u0434\u0430\u043B\u044C",
            "\u0436\u0443\u0440\u0447\u0438\u0442",
            "\u043F\u043E \u0432\u0441\u0435\u0439",
            "\u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0438\u0432\u0430\u0435\u0442",
            "\u0435\u0435",
            "\u0432\u0441\u0435\u043C\u0438",
            "\u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u044B\u043C\u0438",
            "\u043F\u0440\u0430\u0432\u0438\u043B\u0430\u043C\u0438",
            "\u044D\u0442\u0430",
            "\u043F\u0430\u0440\u0430\u0434\u0438\u0433\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F",
            "\u0441\u0442\u0440\u0430\u043D\u0430",
            "\u043A\u043E\u0442\u043E\u0440\u043E\u0439",
            "\u0436\u0430\u0440\u0435\u043D\u043D\u044B\u0435",
            "\u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F",
            "\u0437\u0430\u043B\u0435\u0442\u0430\u044E\u0442",
            "\u043F\u0440\u044F\u043C\u043E",
            "\u0440\u043E\u0442",
            "\u0434\u0430\u0436\u0435",
            "\u0432\u0441\u0435\u043C\u043E\u0433\u0443\u0449\u0430\u044F",
            "\u043F\u0443\u043D\u043A\u0442\u0443\u0430\u0446\u0438\u044F",
            "\u043D\u0435",
            "\u0438\u043C\u0435\u0435\u0442",
            "\u0432\u043B\u0430\u0441\u0442\u0438",
            "\u043D\u0430\u0434",
            "\u0440\u044B\u0431\u043D\u044B\u043C\u0438",
            "\u0442\u0435\u043A\u0441\u0442\u0430\u043C\u0438",
            "\u0432\u0435\u0434\u0443\u0449\u0438\u043C\u0438",
            "\u0431\u0435\u0437\u043E\u0440\u0444\u043E\u0433\u0440\u0430\u0444\u0438\u0447\u043D\u044B\u0439",
            "\u043E\u0431\u0440\u0430\u0437",
            "\u0436\u0438\u0437\u043D\u0438",
            "\u043E\u0434\u043D\u0430\u0436\u0434\u044B",
            "\u043E\u0434\u043D\u0430",
            "\u043C\u0430\u043B\u0435\u043D\u044C\u043A\u0430\u044F",
            "\u0441\u0442\u0440\u043E\u0447\u043A\u0430",
            "\u0440\u044B\u0431\u043D\u043E\u0433\u043E",
            "\u0442\u0435\u043A\u0441\u0442\u0430",
            "\u0438\u043C\u0435\u043D\u0438",
            "lorem",
            "ipsum",
            "\u0440\u0435\u0448\u0438\u043B\u0430",
            "\u0432\u044B\u0439\u0442\u0438",
            "\u0431\u043E\u043B\u044C\u0448\u043E\u0439",
            "\u043C\u0438\u0440",
            "\u0433\u0440\u0430\u043C\u043C\u0430\u0442\u0438\u043A\u0438",
            "\u0432\u0435\u043B\u0438\u043A\u0438\u0439",
            "\u043E\u043A\u0441\u043C\u043E\u043A\u0441",
            "\u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0430\u043B",
            "\u043E",
            "\u0437\u043B\u044B\u0445",
            "\u0437\u0430\u043F\u044F\u0442\u044B\u0445",
            "\u0434\u0438\u043A\u0438\u0445",
            "\u0437\u043D\u0430\u043A\u0430\u0445",
            "\u0432\u043E\u043F\u0440\u043E\u0441\u0430",
            "\u043A\u043E\u0432\u0430\u0440\u043D\u044B\u0445",
            "\u0442\u043E\u0447\u043A\u0430\u0445",
            "\u0437\u0430\u043F\u044F\u0442\u043E\u0439",
            "\u043D\u043E",
            "\u0442\u0435\u043A\u0441\u0442",
            "\u0434\u0430\u043B",
            "\u0441\u0431\u0438\u0442\u044C",
            "\u0441\u0435\u0431\u044F",
            "\u0442\u043E\u043B\u043A\u0443",
            "\u043E\u043D",
            "\u0441\u043E\u0431\u0440\u0430\u043B",
            "\u0441\u0435\u043C\u044C",
            "\u0441\u0432\u043E\u0438\u0445",
            "\u0437\u0430\u0433\u043B\u0430\u0432\u043D\u044B\u0445",
            "\u0431\u0443\u043A\u0432",
            "\u043F\u043E\u0434\u043F\u043E\u044F\u0441\u0430\u043B",
            "\u0438\u043D\u0438\u0446\u0438\u0430\u043B",
            "\u0437\u0430",
            "\u043F\u043E\u044F\u0441",
            "\u043F\u0443\u0441\u0442\u0438\u043B\u0441\u044F",
            "\u0434\u043E\u0440\u043E\u0433\u0443",
            "\u0432\u0437\u043E\u0431\u0440\u0430\u0432\u0448\u0438\u0441\u044C",
            "\u043F\u0435\u0440\u0432\u0443\u044E",
            "\u0432\u0435\u0440\u0448\u0438\u043D\u0443",
            "\u043A\u0443\u0440\u0441\u0438\u0432\u043D\u044B\u0445",
            "\u0433\u043E\u0440",
            "\u0431\u0440\u043E\u0441\u0438\u043B",
            "\u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439",
            "\u0432\u0437\u0433\u043B\u044F\u0434",
            "\u043D\u0430\u0437\u0430\u0434",
            "\u0441\u0438\u043B\u0443\u044D\u0442",
            "\u0441\u0432\u043E\u0435\u0433\u043E",
            "\u0440\u043E\u0434\u043D\u043E\u0433\u043E",
            "\u0433\u043E\u0440\u043E\u0434\u0430",
            "\u0431\u0443\u043A\u0432\u043E\u0433\u0440\u0430\u0434",
            "\u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A",
            "\u0434\u0435\u0440\u0435\u0432\u043D\u0438",
            "\u0430\u043B\u0444\u0430\u0432\u0438\u0442",
            "\u043F\u043E\u0434\u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A",
            "\u0441\u0432\u043E\u0435\u0433\u043E",
            "\u043F\u0435\u0440\u0435\u0443\u043B\u043A\u0430",
            "\u0433\u0440\u0443\u0441\u0442\u043D\u044B\u0439",
            "\u0440\u0435\u0442\u043E\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0439",
            "\u0432\u043E\u043F\u0440\u043E\u0441",
            "\u0441\u043A\u0430\u0442\u0438\u043B\u0441\u044F",
            "\u0435\u0433\u043E",
            "\u0449\u0435\u043A\u0435",
            "\u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u043B",
            "\u0441\u0432\u043E\u0439",
            "\u043F\u0443\u0442\u044C",
            "\u0434\u043E\u0440\u043E\u0433\u0435",
            "\u0432\u0441\u0442\u0440\u0435\u0442\u0438\u043B",
            "\u0440\u0443\u043A\u043E\u043F\u0438\u0441\u044C",
            "\u043E\u043D\u0430",
            "\u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0434\u0438\u043B\u0430",
            "\u043C\u043E\u0435\u0439",
            "\u0432\u0441\u0435",
            "\u043F\u0435\u0440\u0435\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442\u0441\u044F",
            "\u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E",
            "\u0440\u0430\u0437",
            "\u0435\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435",
            "\u0447\u0442\u043E",
            "\u043C\u0435\u043D\u044F",
            "\u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C",
            "\u044D\u0442\u043E",
            "\u043F\u0440\u0438\u0441\u0442\u0430\u0432\u043A\u0430",
            "\u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0439\u0441\u044F",
            "\u0442\u044B",
            "\u043B\u0443\u0447\u0448\u0435",
            "\u0441\u0432\u043E\u044E",
            "\u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u0443\u044E",
            "\u0441\u0442\u0440\u0430\u043D\u0443",
            "\u043F\u043E\u0441\u043B\u0443\u0448\u0430\u0432\u0448\u0438\u0441\u044C",
            "\u0440\u0443\u043A\u043E\u043F\u0438\u0441\u0438",
            "\u043D\u0430\u0448",
            "\u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u043B",
            "\u0441\u0432\u043E\u0439",
            "\u043F\u0443\u0442\u044C",
            "\u0432\u0441\u043A\u043E\u0440\u0435",
            "\u0435\u043C\u0443",
            "\u043F\u043E\u0432\u0441\u0442\u0440\u0435\u0447\u0430\u043B\u0441\u044F",
            "\u043A\u043E\u0432\u0430\u0440\u043D\u044B\u0439",
            "\u0441\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044C",
            "\u0440\u0435\u043A\u043B\u0430\u043C\u043D\u044B\u0445",
            "\u0442\u0435\u043A\u0441\u0442\u043E\u0432",
            "\u043D\u0430\u043F\u043E\u0438\u0432\u0448\u0438\u0439",
            "\u044F\u0437\u044B\u043A\u043E\u043C",
            "\u0440\u0435\u0447\u044C\u044E",
            "\u0437\u0430\u043C\u0430\u043D\u0438\u0432\u0448\u0438\u0439",
            "\u0441\u0432\u043E\u0435",
            "\u0430\u0433\u0435\u043D\u0442\u0441\u0442\u0432\u043E",
            "\u043A\u043E\u0442\u043E\u0440\u043E\u0435",
            "\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043B\u043E",
            "\u0441\u043D\u043E\u0432\u0430",
            "\u0441\u043D\u043E\u0432\u0430",
            "\u0441\u0432\u043E\u0438\u0445",
            "\u043F\u0440\u043E\u0435\u043A\u0442\u0430\u0445",
            "\u0435\u0441\u043B\u0438",
            "\u043F\u0435\u0440\u0435\u043F\u0438\u0441\u0430\u043B\u0438",
            "\u0442\u043E",
            "\u0436\u0438\u0432\u0435\u0442",
            "\u0442\u0430\u043C",
            "\u0434\u043E",
            "\u0441\u0438\u0445",
            "\u043F\u043E\u0440"
          ]
        };
        var sp = {
          "common": ["mujer", "uno", "dolor", "m\xE1s", "de", "poder", "mismo", "si"],
          "words": [
            "ejercicio",
            "preferencia",
            "perspicacia",
            "laboral",
            "pa\xF1o",
            "suntuoso",
            "molde",
            "namibia",
            "planeador",
            "mirar",
            "dem\xE1s",
            "oficinista",
            "excepci\xF3n",
            "odio",
            "consecuencia",
            "casi",
            "auto",
            "chicharra",
            "velo",
            "elixir",
            "ataque",
            "no",
            "odio",
            "temporal",
            "cu\xF3rum",
            "dign\xEDsimo",
            "facilismo",
            "letra",
            "nihilista",
            "expedici\xF3n",
            "alma",
            "alveolar",
            "aparte",
            "le\xF3n",
            "animal",
            "como",
            "paria",
            "belleza",
            "modo",
            "natividad",
            "justo",
            "ataque",
            "s\xE9quito",
            "pillo",
            "sed",
            "ex",
            "y",
            "voluminoso",
            "temporalidad",
            "verdades",
            "racional",
            "asunci\xF3n",
            "incidente",
            "marejada",
            "placenta",
            "amanecer",
            "fuga",
            "previsor",
            "presentaci\xF3n",
            "lejos",
            "necesariamente",
            "sospechoso",
            "adiposidad",
            "quind\xEDo",
            "p\xF3cima",
            "voluble",
            "d\xE9bito",
            "sinti\xF3",
            "accesorio",
            "falda",
            "sapiencia",
            "volutas",
            "queso",
            "permacultura",
            "laudo",
            "soluciones",
            "entero",
            "pan",
            "litro",
            "tonelada",
            "culpa",
            "libertario",
            "mosca",
            "dictado",
            "reincidente",
            "nascimiento",
            "dolor",
            "escolar",
            "impedimento",
            "m\xEDnima",
            "mayores",
            "repugnante",
            "dulce",
            "obcecado",
            "monta\xF1a",
            "enigma",
            "total",
            "delet\xE9reo",
            "d\xE9cima",
            "c\xE1bala",
            "fotograf\xEDa",
            "dolores",
            "molesto",
            "olvido",
            "paciencia",
            "resiliencia",
            "voluntad",
            "molestias",
            "magn\xEDfico",
            "distinci\xF3n",
            "ovni",
            "marejada",
            "cerro",
            "torre",
            "y",
            "abogada",
            "manantial",
            "corporal",
            "agua",
            "crep\xFAsculo",
            "ataque",
            "desierto",
            "laboriosamente",
            "angustia",
            "afortunado",
            "alma",
            "encefalograma",
            "materialidad",
            "cosas",
            "o",
            "renuncia",
            "error",
            "menos",
            "conejo",
            "abad\xEDa",
            "analfabeto",
            "remo",
            "fugacidad",
            "oficio",
            "en",
            "alm\xE1cigo",
            "vos",
            "pan",
            "represi\xF3n",
            "n\xFAmeros",
            "triste",
            "refugiado",
            "trote",
            "inventor",
            "corchea",
            "repelente",
            "magma",
            "recusado",
            "patr\xF3n",
            "expl\xEDcito",
            "paloma",
            "s\xEDndrome",
            "inmune",
            "autoinmune",
            "comodidad",
            "ley",
            "vietnamita",
            "demonio",
            "tasmania",
            "repeler",
            "ap\xE9ndice",
            "arquitecto",
            "columna",
            "yugo",
            "computador",
            "mula",
            "a",
            "prop\xF3sito",
            "fantas\xEDa",
            "alias",
            "rayo",
            "tenedor",
            "deleznable",
            "ventana",
            "cara",
            "anemia",
            "corrupto"
          ]
        };
        var vocabularies = { ru, sp, latin };
        var reLorem = /^lorem([a-z]*)(\d*)(-\d*)?$/i;
        function lorem(node, ancestors, config) {
          let m;
          if (node.name && (m = node.name.match(reLorem))) {
            const db = vocabularies[m[1]] || vocabularies.latin;
            const minWordCount = m[2] ? Math.max(1, Number(m[2])) : 30;
            const maxWordCount = m[3] ? Math.max(minWordCount, Number(m[3].slice(1))) : minWordCount;
            const wordCount = rand(minWordCount, maxWordCount);
            const repeat = node.repeat || findRepeater(ancestors);
            node.name = node.attributes = void 0;
            node.value = [paragraph(db, wordCount, !repeat || repeat.value === 0)];
            if (node.repeat && ancestors.length > 1) {
              resolveImplicitTag(node, ancestors, config);
            }
          }
        }
        function rand(from, to) {
          return Math.floor(Math.random() * (to - from) + from);
        }
        function sample(arr, count) {
          const len = arr.length;
          const iterations = Math.min(len, count);
          const result = [];
          while (result.length < iterations) {
            const str = arr[rand(0, len)];
            if (!result.includes(str)) {
              result.push(str);
            }
          }
          return result;
        }
        function choice(val) {
          return val[rand(0, val.length - 1)];
        }
        function sentence(words, end) {
          if (words.length) {
            words = [capitalize(words[0])].concat(words.slice(1));
          }
          return words.join(" ") + (end || choice("?!..."));
        }
        function capitalize(word) {
          return word[0].toUpperCase() + word.slice(1);
        }
        function insertCommas(words) {
          if (words.length < 2) {
            return words;
          }
          words = words.slice();
          const len = words.length;
          const hasComma = /,$/;
          let totalCommas = 0;
          if (len > 3 && len <= 6) {
            totalCommas = rand(0, 1);
          } else if (len > 6 && len <= 12) {
            totalCommas = rand(0, 2);
          } else {
            totalCommas = rand(1, 4);
          }
          for (let i = 0, pos; i < totalCommas; i++) {
            pos = rand(0, len - 2);
            if (!hasComma.test(words[pos])) {
              words[pos] += ",";
            }
          }
          return words;
        }
        function paragraph(dict, wordCount, startWithCommon) {
          const result = [];
          let totalWords = 0;
          let words;
          if (startWithCommon && dict.common) {
            words = dict.common.slice(0, wordCount);
            totalWords += words.length;
            result.push(sentence(insertCommas(words), "."));
          }
          while (totalWords < wordCount) {
            words = sample(dict.words, Math.min(rand(2, 30), wordCount - totalWords));
            totalWords += words.length;
            result.push(sentence(insertCommas(words)));
          }
          return result.join(" ");
        }
        function findRepeater(ancestors) {
          for (let i = ancestors.length - 1; i >= 0; i--) {
            const element2 = ancestors[i];
            if (element2.type === "AbbreviationNode" && element2.repeat) {
              return element2.repeat;
            }
          }
        }
        function xsl(node) {
          if (matchesName(node.name) && node.attributes && (node.children.length || node.value)) {
            node.attributes = node.attributes.filter(isAllowed);
          }
        }
        function isAllowed(attr) {
          return attr.name !== "select";
        }
        function matchesName(name) {
          return name === "xsl:variable" || name === "xsl:with-param";
        }
        var reElement = /^(-+)([a-z0-9]+[a-z0-9-]*)/i;
        var reModifier = /^(_+)([a-z0-9]+[a-z0-9-_]*)/i;
        var blockCandidates1 = (className) => /^[a-z]\-/i.test(className);
        var blockCandidates2 = (className) => /^[a-z]/i.test(className);
        function bem(node, ancestors, config) {
          expandClassNames(node);
          expandShortNotation(node, ancestors, config);
        }
        function expandClassNames(node) {
          const data = getBEMData(node);
          const classNames = [];
          for (const cl of data.classNames) {
            const ix = cl.indexOf("_");
            if (ix > 0 && !cl.startsWith("-")) {
              classNames.push(cl.slice(0, ix));
              classNames.push(cl.slice(ix));
            } else {
              classNames.push(cl);
            }
          }
          if (classNames.length) {
            data.classNames = classNames.filter(uniqueClass);
            data.block = findBlockName(data.classNames);
            updateClass(node, data.classNames.join(" "));
          }
        }
        function expandShortNotation(node, ancestors, config) {
          const data = getBEMData(node);
          const classNames = [];
          const { options } = config;
          const path = ancestors.slice(1).concat(node);
          for (let cl of data.classNames) {
            let prefix = "";
            let m;
            const originalClass = cl;
            if (m = cl.match(reElement)) {
              prefix = getBlockName(path, m[1].length, config.context) + options["bem.element"] + m[2];
              classNames.push(prefix);
              cl = cl.slice(m[0].length);
            }
            if (m = cl.match(reModifier)) {
              if (!prefix) {
                prefix = getBlockName(path, m[1].length);
                classNames.push(prefix);
              }
              classNames.push(`${prefix}${options["bem.modifier"]}${m[2]}`);
              cl = cl.slice(m[0].length);
            }
            if (cl === originalClass) {
              classNames.push(originalClass);
            }
          }
          const arrClassNames = classNames.filter(uniqueClass);
          if (arrClassNames.length) {
            updateClass(node, arrClassNames.join(" "));
          }
        }
        function getBEMData(node) {
          if (!node._bem) {
            let classValue = "";
            if (node.attributes) {
              for (const attr of node.attributes) {
                if (attr.name === "class" && attr.value) {
                  classValue = stringifyValue(attr.value);
                  break;
                }
              }
            }
            node._bem = parseBEM(classValue);
          }
          return node._bem;
        }
        function getBEMDataFromContext(context) {
          if (!context._bem) {
            context._bem = parseBEM(context.attributes && context.attributes.class || "");
          }
          return context._bem;
        }
        function parseBEM(classValue) {
          const classNames = classValue ? classValue.split(/\s+/) : [];
          return {
            classNames,
            block: findBlockName(classNames)
          };
        }
        function getBlockName(ancestors, depth = 0, context) {
          const maxParentIx = 0;
          let parentIx = Math.max(ancestors.length - depth, maxParentIx);
          do {
            const parent = ancestors[parentIx];
            if (parent) {
              const data = getBEMData(parent);
              if (data.block) {
                return data.block;
              }
            }
          } while (maxParentIx < parentIx--);
          if (context) {
            const data = getBEMDataFromContext(context);
            if (data.block) {
              return data.block;
            }
          }
          return "";
        }
        function findBlockName(classNames) {
          return find(classNames, blockCandidates1) || find(classNames, blockCandidates2) || void 0;
        }
        function find(classNames, filter) {
          for (const cl of classNames) {
            if (reElement.test(cl) || reModifier.test(cl)) {
              break;
            }
            if (filter(cl)) {
              return cl;
            }
          }
        }
        function updateClass(node, value) {
          for (const attr of node.attributes) {
            if (attr.name === "class") {
              attr.value = [value];
              break;
            }
          }
        }
        function stringifyValue(value) {
          let result = "";
          for (const t of value) {
            result += typeof t === "string" ? t : t.name;
          }
          return result;
        }
        function uniqueClass(item, ix, arr) {
          return !!item && arr.indexOf(item) === ix;
        }
        function walk(abbr, visitor, state) {
          const callback = (ctx, index, items) => {
            const { parent, current } = state;
            state.parent = current;
            state.current = ctx;
            visitor(ctx, index, items, state, next2);
            state.current = current;
            state.parent = parent;
          };
          const next2 = (node, index, items) => {
            state.ancestors.push(state.current);
            callback(node, index, items);
            state.ancestors.pop();
          };
          abbr.children.forEach(callback);
        }
        function createWalkState(config) {
          return {
            // @ts-ignore: Will set value in iterator
            current: null,
            parent: void 0,
            ancestors: [],
            config,
            field: 1,
            out: createOutputStream(config.options)
          };
        }
        var caret = [{ type: "Field", index: 0, name: "" }];
        function isSnippet(node) {
          return node ? !node.name && !node.attributes : false;
        }
        function isInlineElement(node, config) {
          return node ? isInline(node, config) : false;
        }
        function isField(token) {
          return typeof token === "object" && token.type === "Field";
        }
        function pushTokens(tokens, state) {
          const { out } = state;
          let largestIndex = -1;
          for (const t of tokens) {
            if (typeof t === "string") {
              pushString(out, t);
            } else {
              pushField(out, state.field + t.index, t.name);
              if (t.index > largestIndex) {
                largestIndex = t.index;
              }
            }
          }
          if (largestIndex !== -1) {
            state.field += largestIndex + 1;
          }
        }
        function splitByLines(tokens) {
          const result = [];
          let line = [];
          for (const t of tokens) {
            if (typeof t === "string") {
              const lines = t.split(/\r\n?|\n/g);
              line.push(lines.shift() || "");
              while (lines.length) {
                result.push(line);
                line = [lines.shift() || ""];
              }
            } else {
              line.push(t);
            }
          }
          line.length && result.push(line);
          return result;
        }
        function shouldOutputAttribute(attr) {
          return !attr.implied || attr.valueType !== "raw" || !!attr.value && attr.value.length > 0;
        }
        var TemplateChars;
        (function(TemplateChars2) {
          TemplateChars2[TemplateChars2["Start"] = 91] = "Start";
          TemplateChars2[TemplateChars2["End"] = 93] = "End";
          TemplateChars2[TemplateChars2["Underscore"] = 95] = "Underscore";
          TemplateChars2[TemplateChars2["Dash"] = 45] = "Dash";
        })(TemplateChars || (TemplateChars = {}));
        function template(text2) {
          const tokens = [];
          const scanner = { pos: 0, text: text2 };
          let placeholder;
          let offset = scanner.pos;
          let pos = scanner.pos;
          while (scanner.pos < scanner.text.length) {
            pos = scanner.pos;
            if (placeholder = consumePlaceholder(scanner)) {
              if (offset !== scanner.pos) {
                tokens.push(text2.slice(offset, pos));
              }
              tokens.push(placeholder);
              offset = scanner.pos;
            } else {
              scanner.pos++;
            }
          }
          if (offset !== scanner.pos) {
            tokens.push(text2.slice(offset));
          }
          return tokens;
        }
        function consumePlaceholder(scanner) {
          if (peek$1(scanner) === TemplateChars.Start) {
            const start = ++scanner.pos;
            let namePos = start;
            let afterPos = start;
            let stack = 1;
            while (scanner.pos < scanner.text.length) {
              const code2 = peek$1(scanner);
              if (isTokenStart(code2)) {
                namePos = scanner.pos;
                while (isToken(peek$1(scanner))) {
                  scanner.pos++;
                }
                afterPos = scanner.pos;
              } else {
                if (code2 === TemplateChars.Start) {
                  stack++;
                } else if (code2 === TemplateChars.End) {
                  if (--stack === 0) {
                    return {
                      before: scanner.text.slice(start, namePos),
                      after: scanner.text.slice(afterPos, scanner.pos++),
                      name: scanner.text.slice(namePos, afterPos)
                    };
                  }
                }
                scanner.pos++;
              }
            }
          }
        }
        function peek$1(scanner, pos = scanner.pos) {
          return scanner.text.charCodeAt(pos);
        }
        function isTokenStart(code2) {
          return code2 >= 65 && code2 <= 90;
        }
        function isToken(code2) {
          return isTokenStart(code2) || code2 > 47 && code2 < 58 || code2 === TemplateChars.Underscore || code2 === TemplateChars.Dash;
        }
        function createCommentState(config) {
          const { options } = config;
          return {
            enabled: options["comment.enabled"],
            trigger: options["comment.trigger"],
            before: options["comment.before"] ? template(options["comment.before"]) : void 0,
            after: options["comment.after"] ? template(options["comment.after"]) : void 0
          };
        }
        function commentNodeBefore(node, state) {
          if (shouldComment(node, state) && state.comment.before) {
            output(node, state.comment.before, state);
          }
        }
        function commentNodeAfter(node, state) {
          if (shouldComment(node, state) && state.comment.after) {
            output(node, state.comment.after, state);
          }
        }
        function shouldComment(node, state) {
          const { comment } = state;
          if (!comment.enabled || !comment.trigger || !node.name || !node.attributes) {
            return false;
          }
          for (const attr of node.attributes) {
            if (attr.name && comment.trigger.includes(attr.name)) {
              return true;
            }
          }
          return false;
        }
        function output(node, tokens, state) {
          const attrs = {};
          const { out } = state;
          for (const attr of node.attributes) {
            if (attr.name && attr.value) {
              attrs[attr.name.toUpperCase()] = attr.value;
            }
          }
          for (const token of tokens) {
            if (typeof token === "string") {
              pushString(out, token);
            } else if (attrs[token.name]) {
              pushString(out, token.before);
              pushTokens(attrs[token.name], state);
              pushString(out, token.after);
            }
          }
        }
        var htmlTagRegex = /^<([\w\-:]+)[\s>]/;
        var reservedKeywords = /* @__PURE__ */ new Set([
          "for",
          "while",
          "of",
          "async",
          "await",
          "const",
          "let",
          "var",
          "continue",
          "break",
          "debugger",
          "do",
          "export",
          "import",
          "in",
          "instanceof",
          "new",
          "return",
          "switch",
          "this",
          "throw",
          "try",
          "catch",
          "typeof",
          "void",
          "with",
          "yield"
        ]);
        function html(abbr, config) {
          const state = createWalkState(config);
          state.comment = createCommentState(config);
          walk(abbr, element$1, state);
          return state.out.value;
        }
        function element$1(node, index, items, state, next2) {
          const { out, config } = state;
          const format = shouldFormat$1(node, index, items, state);
          const level = getIndent(state);
          out.level += level;
          format && pushNewline(out, true);
          if (node.name) {
            const name = tagName(node.name, config);
            commentNodeBefore(node, state);
            pushString(out, `<${name}`);
            if (node.attributes) {
              for (const attr of node.attributes) {
                if (shouldOutputAttribute(attr)) {
                  pushAttribute(attr, state);
                }
              }
            }
            if (node.selfClosing && !node.children.length && !node.value) {
              pushString(out, `${selfClose(config)}>`);
            } else {
              pushString(out, ">");
              if (!pushSnippet(node, state, next2)) {
                if (node.value) {
                  const innerFormat = node.value.some(hasNewline) || startsWithBlockTag(node.value, config);
                  innerFormat && pushNewline(state.out, ++out.level);
                  pushTokens(node.value, state);
                  innerFormat && pushNewline(state.out, --out.level);
                }
                node.children.forEach(next2);
                if (!node.value && !node.children.length) {
                  const innerFormat = config.options["output.formatLeafNode"] || config.options["output.formatForce"].includes(node.name);
                  innerFormat && pushNewline(state.out, ++out.level);
                  pushTokens(caret, state);
                  innerFormat && pushNewline(state.out, --out.level);
                }
              }
              pushString(out, `</${name}>`);
              commentNodeAfter(node, state);
            }
          } else if (!pushSnippet(node, state, next2) && node.value) {
            pushTokens(node.value, state);
            node.children.forEach(next2);
          }
          if (format && index === items.length - 1 && state.parent) {
            const offset = isSnippet(state.parent) ? 0 : 1;
            pushNewline(out, out.level - offset);
          }
          out.level -= level;
        }
        function pushAttribute(attr, state) {
          const { out, config } = state;
          if (attr.name) {
            const attributes = config.options["markup.attributes"];
            const valuePrefix = config.options["markup.valuePrefix"];
            let { name, value } = attr;
            let lQuote = attrQuote(attr, config, true);
            let rQuote = attrQuote(attr, config);
            if (attributes) {
              name = getMultiValue(name, attributes, attr.multiple) || name;
            }
            name = attrName(name, config);
            if (config.options["jsx.enabled"] && attr.multiple) {
              lQuote = expressionStart;
              rQuote = expressionEnd;
            }
            const prefix = valuePrefix ? getMultiValue(attr.name, valuePrefix, attr.multiple) : null;
            if (prefix && (value === null || value === void 0 ? void 0 : value.length) === 1 && typeof value[0] === "string") {
              const val = value[0];
              value = [isPropKey(val) ? `${prefix}.${val}` : `${prefix}['${val}']`];
              if (config.options["jsx.enabled"]) {
                lQuote = expressionStart;
                rQuote = expressionEnd;
              }
            }
            if (isBooleanAttribute(attr, config) && !value) {
              if (!config.options["output.compactBoolean"]) {
                value = [name];
              }
            } else if (!value) {
              value = caret;
            }
            pushString(out, " " + name);
            if (value) {
              pushString(out, "=" + lQuote);
              pushTokens(value, state);
              pushString(out, rQuote);
            } else if (config.options["output.selfClosingStyle"] !== "html") {
              pushString(out, "=" + lQuote + rQuote);
            }
          }
        }
        function pushSnippet(node, state, next2) {
          if (node.value && node.children.length) {
            const fieldIx = node.value.findIndex(isField);
            if (fieldIx !== -1) {
              pushTokens(node.value.slice(0, fieldIx), state);
              const line = state.out.line;
              let pos = fieldIx + 1;
              node.children.forEach(next2);
              if (state.out.line !== line && typeof node.value[pos] === "string") {
                pushString(state.out, node.value[pos++].trimLeft());
              }
              pushTokens(node.value.slice(pos), state);
              return true;
            }
          }
          return false;
        }
        function shouldFormat$1(node, index, items, state) {
          const { config, parent } = state;
          if (!config.options["output.format"]) {
            return false;
          }
          if (index === 0 && !parent) {
            return false;
          }
          if (parent && isSnippet(parent) && items.length === 1) {
            return false;
          }
          if (isSnippet(node)) {
            const format = isSnippet(items[index - 1]) || isSnippet(items[index + 1]) || node.value.some(hasNewline) || node.value.some(isField) && node.children.length;
            if (format) {
              return true;
            }
          }
          if (isInline(node, config)) {
            if (index === 0) {
              for (let i = 0; i < items.length; i++) {
                if (!isInline(items[i], config)) {
                  return true;
                }
              }
            } else if (!isInline(items[index - 1], config)) {
              return true;
            }
            if (config.options["output.inlineBreak"]) {
              let adjacentInline = 1;
              let before = index;
              let after = index;
              while (isInlineElement(items[--before], config)) {
                adjacentInline++;
              }
              while (isInlineElement(items[++after], config)) {
                adjacentInline++;
              }
              if (adjacentInline >= config.options["output.inlineBreak"]) {
                return true;
              }
            }
            for (let i = 0, il = node.children.length; i < il; i++) {
              if (shouldFormat$1(node.children[i], i, node.children, state)) {
                return true;
              }
            }
            return false;
          }
          return true;
        }
        function getIndent(state) {
          const { config, parent } = state;
          if (!parent || isSnippet(parent) || parent.name && config.options["output.formatSkip"].includes(parent.name)) {
            return 0;
          }
          return 1;
        }
        function hasNewline(value) {
          return typeof value === "string" && /\r|\n/.test(value);
        }
        function startsWithBlockTag(value, config) {
          if (value.length && typeof value[0] === "string") {
            const matches = htmlTagRegex.exec(value[0]);
            if ((matches === null || matches === void 0 ? void 0 : matches.length) && !config.options["inlineElements"].includes(matches[1].toLowerCase())) {
              return true;
            }
          }
          return false;
        }
        function getMultiValue(key, data, multiple) {
          return multiple && data[`${key}*`] || data[key];
        }
        function isPropKey(name) {
          return !reservedKeywords.has(name) && /^[a-zA-Z_$][\w_$]*$/.test(name);
        }
        function indentFormat(abbr, config, options) {
          const state = createWalkState(config);
          state.options = options || {};
          walk(abbr, element, state);
          return state.out.value;
        }
        function element(node, index, items, state, next2) {
          const { out, options } = state;
          const { primary, secondary } = collectAttributes(node);
          const level = state.parent ? 1 : 0;
          out.level += level;
          if (shouldFormat(node, index, items, state)) {
            pushNewline(out, true);
          }
          if (node.name && (node.name !== "div" || !primary.length)) {
            pushString(out, (options.beforeName || "") + node.name + (options.afterName || ""));
          }
          pushPrimaryAttributes(primary, state);
          pushSecondaryAttributes(secondary.filter(shouldOutputAttribute), state);
          if (node.selfClosing && !node.value && !node.children.length) {
            if (state.options.selfClose) {
              pushString(out, state.options.selfClose);
            }
          } else {
            pushValue(node, state);
            node.children.forEach(next2);
          }
          out.level -= level;
        }
        function collectAttributes(node) {
          const primary = [];
          const secondary = [];
          if (node.attributes) {
            for (const attr of node.attributes) {
              if (isPrimaryAttribute(attr)) {
                primary.push(attr);
              } else {
                secondary.push(attr);
              }
            }
          }
          return { primary, secondary };
        }
        function pushPrimaryAttributes(attrs, state) {
          for (const attr of attrs) {
            if (attr.value) {
              if (attr.name === "class") {
                pushString(state.out, ".");
                const tokens = attr.value.map((t) => typeof t === "string" ? t.replace(/\s+/g, ".") : t);
                pushTokens(tokens, state);
              } else {
                pushString(state.out, "#");
                pushTokens(attr.value, state);
              }
            }
          }
        }
        function pushSecondaryAttributes(attrs, state) {
          if (attrs.length) {
            const { out, config, options } = state;
            options.beforeAttribute && pushString(out, options.beforeAttribute);
            for (let i = 0; i < attrs.length; i++) {
              const attr = attrs[i];
              pushString(out, attrName(attr.name || "", config));
              if (isBooleanAttribute(attr, config) && !attr.value) {
                if (!config.options["output.compactBoolean"] && options.booleanValue) {
                  pushString(out, "=" + options.booleanValue);
                }
              } else {
                pushString(out, "=" + attrQuote(attr, config, true));
                pushTokens(attr.value || caret, state);
                pushString(out, attrQuote(attr, config));
              }
              if (i !== attrs.length - 1 && options.glueAttribute) {
                pushString(out, options.glueAttribute);
              }
            }
            options.afterAttribute && pushString(out, options.afterAttribute);
          }
        }
        function pushValue(node, state) {
          if (!node.value && node.children.length) {
            return;
          }
          const value = node.value || caret;
          const lines = splitByLines(value);
          const { out, options } = state;
          if (lines.length === 1) {
            if (node.name || node.attributes) {
              push(out, " ");
            }
            pushTokens(value, state);
          } else {
            const lineLengths = [];
            let maxLength = 0;
            for (const line of lines) {
              const len = valueLength(line);
              lineLengths.push(len);
              if (len > maxLength) {
                maxLength = len;
              }
            }
            out.level++;
            for (let i = 0; i < lines.length; i++) {
              pushNewline(out, true);
              options.beforeTextLine && push(out, options.beforeTextLine);
              pushTokens(lines[i], state);
              if (options.afterTextLine) {
                push(out, " ".repeat(maxLength - lineLengths[i]));
                push(out, options.afterTextLine);
              }
            }
            out.level--;
          }
        }
        function isPrimaryAttribute(attr) {
          return attr.name === "class" || attr.name === "id";
        }
        function valueLength(tokens) {
          let len = 0;
          for (const token of tokens) {
            len += typeof token === "string" ? token.length : token.name.length;
          }
          return len;
        }
        function shouldFormat(node, index, items, state) {
          if (!state.parent && index === 0) {
            return false;
          }
          return !isSnippet(node);
        }
        function haml(abbr, config) {
          return indentFormat(abbr, config, {
            beforeName: "%",
            beforeAttribute: "(",
            afterAttribute: ")",
            glueAttribute: " ",
            afterTextLine: " |",
            booleanValue: "true",
            selfClose: "/"
          });
        }
        function slim(abbr, config) {
          return indentFormat(abbr, config, {
            beforeAttribute: " ",
            glueAttribute: " ",
            beforeTextLine: "| ",
            selfClose: "/"
          });
        }
        function pug(abbr, config) {
          return indentFormat(abbr, config, {
            beforeAttribute: "(",
            afterAttribute: ")",
            glueAttribute: ", ",
            beforeTextLine: "| ",
            selfClose: config.options["output.selfClosingStyle"] === "xml" ? "/" : ""
          });
        }
        var formatters = { html, haml, slim, pug };
        function parse$1(abbr, config) {
          let oldTextValue;
          if (typeof abbr === "string") {
            const parseOpt = Object.assign({}, config);
            if (config.options["jsx.enabled"]) {
              parseOpt.jsx = true;
            }
            if (config.options["markup.href"]) {
              parseOpt.href = true;
            }
            abbr = parseAbbreviation(abbr, parseOpt);
            oldTextValue = config.text;
            config.text = void 0;
          }
          abbr = resolveSnippets(abbr, config);
          walk$1(abbr, transform, config);
          config.text = oldTextValue !== null && oldTextValue !== void 0 ? oldTextValue : config.text;
          return abbr;
        }
        function stringify(abbr, config) {
          const formatter = formatters[config.syntax] || html;
          return formatter(abbr, config);
        }
        function transform(node, ancestors, config) {
          implicitTag(node, ancestors, config);
          mergeAttributes(node, config);
          lorem(node, ancestors, config);
          if (config.syntax === "xsl") {
            xsl(node);
          }
          if (config.options["bem.enabled"]) {
            bem(node, ancestors, config);
          }
        }
        var CSSSnippetType;
        (function(CSSSnippetType2) {
          CSSSnippetType2["Raw"] = "Raw";
          CSSSnippetType2["Property"] = "Property";
        })(CSSSnippetType || (CSSSnippetType = {}));
        var reProperty = /^([a-z-]+)(?:\s*:\s*([^\n\r;]+?);*)?$/;
        var opt = { value: true };
        function createSnippet(key, value) {
          const m = value.match(reProperty);
          if (m) {
            const keywords = {};
            const parsed = m[2] ? m[2].split("|").map(parseValue) : [];
            for (const item of parsed) {
              for (const cssVal of item) {
                collectKeywords(cssVal, keywords);
              }
            }
            return {
              type: CSSSnippetType.Property,
              key,
              property: m[1],
              value: parsed,
              keywords,
              dependencies: []
            };
          }
          return { type: CSSSnippetType.Raw, key, value };
        }
        function nest(snippets) {
          snippets = snippets.slice().sort(snippetsSort);
          const stack = [];
          let prev;
          for (const cur of snippets.filter(isProperty)) {
            while (stack.length) {
              prev = stack[stack.length - 1];
              if (cur.property.startsWith(prev.property) && cur.property.charCodeAt(prev.property.length) === 45) {
                prev.dependencies.push(cur);
                stack.push(cur);
                break;
              }
              stack.pop();
            }
            if (!stack.length) {
              stack.push(cur);
            }
          }
          return snippets;
        }
        function snippetsSort(a, b) {
          if (a.key === b.key) {
            return 0;
          }
          return a.key < b.key ? -1 : 1;
        }
        function parseValue(value) {
          return parse$2(value.trim(), opt)[0].value;
        }
        function isProperty(snippet) {
          return snippet.type === CSSSnippetType.Property;
        }
        function collectKeywords(cssVal, dest) {
          for (const v of cssVal.value) {
            if (v.type === "Literal") {
              dest[v.value] = v;
            } else if (v.type === "FunctionCall") {
              dest[v.name] = v;
            } else if (v.type === "Field") {
              const value = v.name.trim();
              if (value) {
                dest[value] = { type: "Literal", value };
              }
            }
          }
        }
        function scoreMatch(str1, str2, partialMatch = false) {
          str1 = str1.toLowerCase();
          str2 = str2.toLowerCase();
          if (str1 === str2) {
            return 1;
          }
          if (!str1 || !str2 || str1.charCodeAt(0) !== str2.charCodeAt(0)) {
            return 0;
          }
          const str1Len = str1.length;
          const str2Len = str2.length;
          if (!partialMatch && str1Len > str2Len) {
            return 0;
          }
          const minLength = Math.min(str1Len, str2Len);
          const maxLength = Math.max(str1Len, str2Len);
          let i = 1;
          let j = 1;
          let score = maxLength;
          let ch1 = 0;
          let ch2 = 0;
          let found = false;
          let acronym = false;
          while (i < str1Len) {
            ch1 = str1.charCodeAt(i);
            found = false;
            acronym = false;
            while (j < str2Len) {
              ch2 = str2.charCodeAt(j);
              if (ch1 === ch2) {
                found = true;
                score += maxLength - (acronym ? i : j);
                break;
              }
              acronym = ch2 === 45;
              j++;
            }
            if (!found) {
              if (!partialMatch) {
                return 0;
              }
              break;
            }
            i++;
          }
          const matchRatio = i / maxLength;
          const delta = maxLength - minLength;
          const maxScore = sum(maxLength) - sum(delta);
          return score * matchRatio / maxScore;
        }
        function sum(n) {
          return n * (n + 1) / 2;
        }
        function color(token, shortHex) {
          if (!token.r && !token.g && !token.b && !token.a) {
            return "transparent";
          } else if (token.a === 1) {
            return asHex(token, shortHex);
          }
          return asRGB(token);
        }
        function asHex(token, short) {
          const fn = short && isShortHex(token.r) && isShortHex(token.g) && isShortHex(token.b) ? toShortHex : toHex;
          return "#" + fn(token.r) + fn(token.g) + fn(token.b);
        }
        function asRGB(token) {
          const values = [token.r, token.g, token.b];
          if (token.a !== 1) {
            values.push(frac(token.a, 8));
          }
          return `${values.length === 3 ? "rgb" : "rgba"}(${values.join(", ")})`;
        }
        function frac(num, digits = 4) {
          return num.toFixed(digits).replace(/\.?0+$/, "");
        }
        function isShortHex(hex) {
          return !(hex % 17);
        }
        function toShortHex(num) {
          return (num >> 4).toString(16);
        }
        function toHex(num) {
          return pad(num.toString(16), 2);
        }
        function pad(value, len) {
          while (value.length < len) {
            value = "0" + value;
          }
          return value;
        }
        var CSSAbbreviationScope = {
          /** Include all possible snippets in match */
          Global: "@@global",
          /** Include raw snippets only (e.g. no properties) in abbreviation match */
          Section: "@@section",
          /** Include properties only in abbreviation match */
          Property: "@@property",
          /** Resolve abbreviation in context of CSS property value */
          Value: "@@value"
        };
        function css(abbr, config) {
          var _a;
          const out = createOutputStream(config.options);
          const format = config.options["output.format"];
          if (((_a = config.context) === null || _a === void 0 ? void 0 : _a.name) === CSSAbbreviationScope.Section) {
            abbr = abbr.filter((node) => node.snippet);
          }
          for (let i = 0; i < abbr.length; i++) {
            if (format && i !== 0) {
              pushNewline(out, true);
            }
            property(abbr[i], out, config);
          }
          return out.value;
        }
        function property(node, out, config) {
          const isJSON = config.options["stylesheet.json"];
          if (node.name) {
            const name = isJSON ? toCamelCase(node.name) : node.name;
            pushString(out, name + config.options["stylesheet.between"]);
            if (node.value.length) {
              propertyValue(node, out, config);
            } else {
              pushField(out, 0, "");
            }
            if (isJSON) {
              push(out, ",");
            } else {
              outputImportant(node, out, true);
              push(out, config.options["stylesheet.after"]);
            }
          } else {
            for (const cssVal of node.value) {
              for (const v of cssVal.value) {
                outputToken(v, out, config);
              }
            }
            outputImportant(node, out, node.value.length > 0);
          }
        }
        function propertyValue(node, out, config) {
          const isJSON = config.options["stylesheet.json"];
          const num = isJSON ? getSingleNumeric(node) : null;
          if (num && (!num.unit || num.unit === "px")) {
            push(out, String(num.value));
          } else {
            const quote2 = getQuote(config);
            isJSON && push(out, quote2);
            for (let i = 0; i < node.value.length; i++) {
              if (i !== 0) {
                push(out, ", ");
              }
              outputValue(node.value[i], out, config);
            }
            isJSON && push(out, quote2);
          }
        }
        function outputImportant(node, out, separator) {
          if (node.important) {
            if (separator) {
              push(out, " ");
            }
            push(out, "!important");
          }
        }
        function outputValue(value, out, config) {
          for (let i = 0, prevEnd = -1; i < value.value.length; i++) {
            const token = value.value[i];
            if (i !== 0 && (token.type !== "Field" || token.start !== prevEnd)) {
              push(out, " ");
            }
            outputToken(token, out, config);
            prevEnd = token["end"];
          }
        }
        function outputToken(token, out, config) {
          if (token.type === "ColorValue") {
            push(out, color(token, config.options["stylesheet.shortHex"]));
          } else if (token.type === "Literal" || token.type === "CustomProperty") {
            pushString(out, token.value);
          } else if (token.type === "NumberValue") {
            pushString(out, frac(token.value, 4) + token.unit);
          } else if (token.type === "StringValue") {
            const quote2 = token.quote === "double" ? '"' : "'";
            pushString(out, quote2 + token.value + quote2);
          } else if (token.type === "Field") {
            pushField(out, token.index, token.name);
          } else if (token.type === "FunctionCall") {
            push(out, token.name + "(");
            for (let i = 0; i < token.arguments.length; i++) {
              if (i) {
                push(out, ", ");
              }
              outputValue(token.arguments[i], out, config);
            }
            push(out, ")");
          }
        }
        function getSingleNumeric(node) {
          if (node.value.length === 1) {
            const cssVal = node.value[0];
            if (cssVal.value.length === 1 && cssVal.value[0].type === "NumberValue") {
              return cssVal.value[0];
            }
          }
        }
        function toCamelCase(str) {
          return str.replace(/\-(\w)/g, (_, letter) => letter.toUpperCase());
        }
        function getQuote(config) {
          return config.options["stylesheet.jsonDoubleQuotes"] ? '"' : "'";
        }
        var gradientName = "lg";
        function parse(abbr, config) {
          var _a;
          const snippets = ((_a = config.cache) === null || _a === void 0 ? void 0 : _a.stylesheetSnippets) || convertSnippets(config.snippets);
          if (config.cache) {
            config.cache.stylesheetSnippets = snippets;
          }
          if (typeof abbr === "string") {
            abbr = parse$2(abbr, { value: isValueScope(config) });
          }
          const filteredSnippets = getSnippetsForScope(snippets, config);
          for (const node of abbr) {
            resolveNode(node, filteredSnippets, config);
          }
          return abbr;
        }
        function convertSnippets(snippets) {
          const result = [];
          for (const key of Object.keys(snippets)) {
            result.push(createSnippet(key, snippets[key]));
          }
          return nest(result);
        }
        function resolveNode(node, snippets, config) {
          if (!resolveGradient(node, config)) {
            const score = config.options["stylesheet.fuzzySearchMinScore"];
            if (isValueScope(config)) {
              const propName = config.context.name;
              const snippet = snippets.find((s) => s.type === CSSSnippetType.Property && s.property === propName);
              resolveValueKeywords(node, config, snippet, score);
              node.snippet = snippet;
            } else if (node.name) {
              const snippet = findBestMatch(node.name, snippets, score, true);
              node.snippet = snippet;
              if (snippet) {
                if (snippet.type === CSSSnippetType.Property) {
                  resolveAsProperty(node, snippet, config);
                } else {
                  resolveAsSnippet(node, snippet);
                }
              }
            }
          }
          if (node.name || config.context) {
            resolveNumericValue(node, config);
          }
          return node;
        }
        function resolveGradient(node, config) {
          let gradientFn = null;
          const cssVal = node.value.length === 1 ? node.value[0] : null;
          if (cssVal && cssVal.value.length === 1) {
            const v = cssVal.value[0];
            if (v.type === "FunctionCall" && v.name === gradientName) {
              gradientFn = v;
            }
          }
          if (gradientFn || node.name === gradientName) {
            if (!gradientFn) {
              gradientFn = {
                type: "FunctionCall",
                name: "linear-gradient",
                arguments: [cssValue(field(0, ""))]
              };
            } else {
              gradientFn = Object.assign(Object.assign({}, gradientFn), { name: "linear-gradient" });
            }
            if (!config.context) {
              node.name = "background-image";
            }
            node.value = [cssValue(gradientFn)];
            return true;
          }
          return false;
        }
        function resolveAsProperty(node, snippet, config) {
          const abbr = node.name;
          const inlineValue = getUnmatchedPart(abbr, snippet.key);
          if (inlineValue) {
            if (node.value.length) {
              return node;
            }
            const kw = resolveKeyword(inlineValue, config, snippet);
            if (!kw) {
              return node;
            }
            node.value.push(cssValue(kw));
          }
          node.name = snippet.property;
          if (node.value.length) {
            resolveValueKeywords(node, config, snippet);
          } else if (snippet.value.length) {
            const defaultValue = snippet.value[0];
            node.value = snippet.value.length === 1 || defaultValue.some(hasField) ? defaultValue : defaultValue.map((n) => wrapWithField(n, config));
          }
          return node;
        }
        function resolveValueKeywords(node, config, snippet, minScore) {
          for (const cssVal of node.value) {
            const value = [];
            for (const token of cssVal.value) {
              if (token.type === "Literal") {
                value.push(resolveKeyword(token.value, config, snippet, minScore) || token);
              } else if (token.type === "FunctionCall") {
                const match = resolveKeyword(token.name, config, snippet, minScore);
                if (match && match.type === "FunctionCall") {
                  value.push(Object.assign(Object.assign({}, match), { arguments: token.arguments.concat(match.arguments.slice(token.arguments.length)) }));
                } else {
                  value.push(token);
                }
              } else {
                value.push(token);
              }
            }
            cssVal.value = value;
          }
        }
        function resolveAsSnippet(node, snippet) {
          let offset = 0;
          let m;
          const reField = /\$\{(\d+)(:[^}]+)?\}/g;
          const inputValue = node.value[0];
          const outputValue2 = [];
          while (m = reField.exec(snippet.value)) {
            if (offset !== m.index) {
              outputValue2.push(literal(snippet.value.slice(offset, m.index)));
            }
            offset = m.index + m[0].length;
            if (inputValue && inputValue.value.length) {
              outputValue2.push(inputValue.value.shift());
            } else {
              outputValue2.push(field(Number(m[1]), m[2] ? m[2].slice(1) : ""));
            }
          }
          const tail = snippet.value.slice(offset);
          if (tail) {
            outputValue2.push(literal(tail));
          }
          node.name = void 0;
          node.value = [cssValue(...outputValue2)];
          return node;
        }
        function findBestMatch(abbr, items, minScore = 0, partialMatch = false) {
          let matchedItem = null;
          let maxScore = 0;
          for (const item of items) {
            const score = scoreMatch(abbr, getScoringPart(item), partialMatch);
            if (score === 1) {
              return item;
            }
            if (score && score >= maxScore) {
              maxScore = score;
              matchedItem = item;
            }
          }
          return maxScore >= minScore ? matchedItem : null;
        }
        function getScoringPart(item) {
          return typeof item === "string" ? item : item.key;
        }
        function getUnmatchedPart(abbr, str) {
          for (let i = 0, lastPos = 0; i < abbr.length; i++) {
            lastPos = str.indexOf(abbr[i], lastPos);
            if (lastPos === -1) {
              return abbr.slice(i);
            }
            lastPos++;
          }
          return "";
        }
        function resolveKeyword(kw, config, snippet, minScore) {
          let ref;
          if (snippet) {
            if (ref = findBestMatch(kw, Object.keys(snippet.keywords), minScore)) {
              return snippet.keywords[ref];
            }
            for (const dep of snippet.dependencies) {
              if (ref = findBestMatch(kw, Object.keys(dep.keywords), minScore)) {
                return dep.keywords[ref];
              }
            }
          }
          if (ref = findBestMatch(kw, config.options["stylesheet.keywords"], minScore)) {
            return literal(ref);
          }
          return null;
        }
        function resolveNumericValue(node, config) {
          const aliases = config.options["stylesheet.unitAliases"];
          const unitless = config.options["stylesheet.unitless"];
          for (const v of node.value) {
            for (const t of v.value) {
              if (t.type === "NumberValue") {
                if (t.unit) {
                  t.unit = aliases[t.unit] || t.unit;
                } else if (t.value !== 0 && !unitless.includes(node.name)) {
                  t.unit = t.rawValue.includes(".") ? config.options["stylesheet.floatUnit"] : config.options["stylesheet.intUnit"];
                }
              }
            }
          }
        }
        function cssValue(...args) {
          return {
            type: "CSSValue",
            value: args
          };
        }
        function literal(value) {
          return { type: "Literal", value };
        }
        function field(index, name) {
          return { type: "Field", index, name };
        }
        function hasField(value) {
          for (const v of value.value) {
            if (v.type === "Field" || v.type === "FunctionCall" && v.arguments.some(hasField)) {
              return true;
            }
          }
          return false;
        }
        function wrapWithField(node, config, state = { index: 1 }) {
          let value = [];
          for (const v of node.value) {
            switch (v.type) {
              case "ColorValue":
                value.push(field(state.index++, color(v, config.options["stylesheet.shortHex"])));
                break;
              case "Literal":
                value.push(field(state.index++, v.value));
                break;
              case "NumberValue":
                value.push(field(state.index++, `${v.value}${v.unit}`));
                break;
              case "StringValue":
                const q = v.quote === "single" ? "'" : '"';
                value.push(field(state.index++, q + v.value + q));
                break;
              case "FunctionCall":
                value.push(field(state.index++, v.name), literal("("));
                for (let i = 0, il = v.arguments.length; i < il; i++) {
                  value = value.concat(wrapWithField(v.arguments[i], config, state).value);
                  if (i !== il - 1) {
                    value.push(literal(", "));
                  }
                }
                value.push(literal(")"));
                break;
              default:
                value.push(v);
            }
          }
          return Object.assign(Object.assign({}, node), { value });
        }
        function isValueScope(config) {
          if (config.context) {
            return config.context.name === CSSAbbreviationScope.Value || !config.context.name.startsWith("@@");
          }
          return false;
        }
        function getSnippetsForScope(snippets, config) {
          if (config.context) {
            if (config.context.name === CSSAbbreviationScope.Section) {
              return snippets.filter((s) => s.type === CSSSnippetType.Raw);
            }
            if (config.context.name === CSSAbbreviationScope.Property) {
              return snippets.filter((s) => s.type === CSSSnippetType.Property);
            }
          }
          return snippets;
        }
        var markupSnippets = {
          "a": "a[href]",
          "a:blank": "a[href='http://${0}' target='_blank' rel='noopener noreferrer']",
          "a:link": "a[href='http://${0}']",
          "a:mail": "a[href='mailto:${0}']",
          "a:tel": "a[href='tel:+${0}']",
          "abbr": "abbr[title]",
          "acr|acronym": "acronym[title]",
          "base": "base[href]/",
          "basefont": "basefont/",
          "br": "br/",
          "frame": "frame/",
          "hr": "hr/",
          "bdo": "bdo[dir]",
          "bdo:r": "bdo[dir=rtl]",
          "bdo:l": "bdo[dir=ltr]",
          "col": "col/",
          "link": "link[rel=stylesheet href]/",
          "link:css": "link[href='${1:style}.css']",
          "link:print": "link[href='${1:print}.css' media=print]",
          "link:favicon": "link[rel='shortcut icon' type=image/x-icon href='${1:favicon.ico}']",
          "link:mf|link:manifest": "link[rel='manifest' href='${1:manifest.json}']",
          "link:touch": "link[rel=apple-touch-icon href='${1:favicon.png}']",
          "link:rss": "link[rel=alternate type=application/rss+xml title=RSS href='${1:rss.xml}']",
          "link:atom": "link[rel=alternate type=application/atom+xml title=Atom href='${1:atom.xml}']",
          "link:im|link:import": "link[rel=import href='${1:component}.html']",
          "meta": "meta/",
          "meta:utf": "meta[http-equiv=Content-Type content='text/html;charset=UTF-8']",
          "meta:vp": "meta[name=viewport content='width=${1:device-width}, initial-scale=${2:1.0}']",
          "meta:compat": "meta[http-equiv=X-UA-Compatible content='${1:IE=7}']",
          "meta:edge": "meta:compat[content='${1:ie=edge}']",
          "meta:redirect": "meta[http-equiv=refresh content='0; url=${1:http://example.com}']",
          "meta:refresh": "meta[http-equiv=refresh content='${1:5}']",
          "meta:kw": "meta[name=keywords content]",
          "meta:desc": "meta[name=description content]",
          "style": "style",
          "script": "script",
          "script:src": "script[src]",
          "script:module": "script[type=module src]",
          "img": "img[src alt]/",
          "img:s|img:srcset": "img[srcset src alt]",
          "img:z|img:sizes": "img[sizes srcset src alt]",
          "picture": "picture",
          "src|source": "source/",
          "src:sc|source:src": "source[src type]",
          "src:s|source:srcset": "source[srcset]",
          "src:t|source:type": "source[srcset type='${1:image/}']",
          "src:z|source:sizes": "source[sizes srcset]",
          "src:m|source:media": "source[media='(${1:min-width: })' srcset]",
          "src:mt|source:media:type": "source:media[type='${2:image/}']",
          "src:mz|source:media:sizes": "source:media[sizes srcset]",
          "src:zt|source:sizes:type": "source[sizes srcset type='${1:image/}']",
          "iframe": "iframe[src frameborder=0]",
          "embed": "embed[src type]/",
          "object": "object[data type]",
          "param": "param[name value]/",
          "map": "map[name]",
          "area": "area[shape coords href alt]/",
          "area:d": "area[shape=default]",
          "area:c": "area[shape=circle]",
          "area:r": "area[shape=rect]",
          "area:p": "area[shape=poly]",
          "form": "form[action]",
          "form:get": "form[method=get]",
          "form:post": "form[method=post]",
          "label": "label[for]",
          "input": "input[type=${1:text}]/",
          "inp": "input[name=${1} id=${1}]",
          "input:h|input:hidden": "input[type=hidden name]",
          "input:t|input:text": "inp[type=text]",
          "input:search": "inp[type=search]",
          "input:email": "inp[type=email]",
          "input:url": "inp[type=url]",
          "input:p|input:password": "inp[type=password]",
          "input:datetime": "inp[type=datetime]",
          "input:date": "inp[type=date]",
          "input:datetime-local": "inp[type=datetime-local]",
          "input:month": "inp[type=month]",
          "input:week": "inp[type=week]",
          "input:time": "inp[type=time]",
          "input:tel": "inp[type=tel]",
          "input:number": "inp[type=number]",
          "input:color": "inp[type=color]",
          "input:c|input:checkbox": "inp[type=checkbox]",
          "input:r|input:radio": "inp[type=radio]",
          "input:range": "inp[type=range]",
          "input:f|input:file": "inp[type=file]",
          "input:s|input:submit": "input[type=submit value]",
          "input:i|input:image": "input[type=image src alt]",
          "input:b|input:btn|input:button": "input[type=button value]",
          "input:reset": "input:button[type=reset]",
          "isindex": "isindex/",
          "select": "select[name=${1} id=${1}]",
          "select:d|select:disabled": "select[disabled.]",
          "opt|option": "option[value]",
          "textarea": "textarea[name=${1} id=${1} cols=${2:30} rows=${3:10}]",
          "marquee": "marquee[behavior direction]",
          "menu:c|menu:context": "menu[type=context]",
          "menu:t|menu:toolbar": "menu[type=toolbar]",
          "video": "video[src]",
          "audio": "audio[src]",
          "html:xml": "html[xmlns=http://www.w3.org/1999/xhtml]",
          "keygen": "keygen/",
          "command": "command/",
          "btn:s|button:s|button:submit": "button[type=submit]",
          "btn:r|button:r|button:reset": "button[type=reset]",
          "btn:b|button:b|button:button": "button[type=button]",
          "btn:d|button:d|button:disabled": "button[disabled.]",
          "fst:d|fset:d|fieldset:d|fieldset:disabled": "fieldset[disabled.]",
          "bq": "blockquote",
          "fig": "figure",
          "figc": "figcaption",
          "pic": "picture",
          "ifr": "iframe",
          "emb": "embed",
          "obj": "object",
          "cap": "caption",
          "colg": "colgroup",
          "fst": "fieldset",
          "btn": "button",
          "optg": "optgroup",
          "tarea": "textarea",
          "leg": "legend",
          "sect": "section",
          "art": "article",
          "hdr": "header",
          "ftr": "footer",
          "adr": "address",
          "dlg": "dialog",
          "str": "strong",
          "prog": "progress",
          "mn": "main",
          "tem": "template",
          "fset": "fieldset",
          "datal": "datalist",
          "kg": "keygen",
          "out": "output",
          "det": "details",
          "sum": "summary",
          "cmd": "command",
          "data": "data[value]",
          "meter": "meter[value]",
          "time": "time[datetime]",
          "ri:d|ri:dpr": "img:s",
          "ri:v|ri:viewport": "img:z",
          "ri:a|ri:art": "pic>src:m+img",
          "ri:t|ri:type": "pic>src:t+img",
          "!!!": "{<!DOCTYPE html>}",
          "doc": "html[lang=${lang}]>(head>meta[charset=${charset}]+meta:vp+title{${1:Document}})+body",
          "!|html:5": "!!!+doc",
          "c": "{<!-- ${0} -->}",
          "cc:ie": "{<!--[if IE]>${0}<![endif]-->}",
          "cc:noie": "{<!--[if !IE]><!-->${0}<!--<![endif]-->}"
        };
        var stylesheetSnippets = {
          "@f": "@font-face {\n	font-family: ${1};\n	src: url(${2});\n}",
          "@ff": "@font-face {\n	font-family: '${1:FontName}';\n	src: url('${2:FileName}.eot');\n	src: url('${2:FileName}.eot?#iefix') format('embedded-opentype'),\n		 url('${2:FileName}.woff') format('woff'),\n		 url('${2:FileName}.ttf') format('truetype'),\n		 url('${2:FileName}.svg#${1:FontName}') format('svg');\n	font-style: ${3:normal};\n	font-weight: ${4:normal};\n}",
          "@i|@import": "@import url(${0});",
          "@kf": "@keyframes ${1:identifier} {\n	${2}\n}",
          "@m|@media": "@media ${1:screen} {\n	${0}\n}",
          "ac": "align-content:start|end|flex-start|flex-end|center|space-between|space-around|stretch|space-evenly",
          "ai": "align-items:start|end|flex-start|flex-end|center|baseline|stretch",
          "anim": "animation:${1:name} ${2:duration} ${3:timing-function} ${4:delay} ${5:iteration-count} ${6:direction} ${7:fill-mode}",
          "animdel": "animation-delay:time",
          "animdir": "animation-direction:normal|reverse|alternate|alternate-reverse",
          "animdur": "animation-duration:${1:0}s",
          "animfm": "animation-fill-mode:both|forwards|backwards",
          "animic": "animation-iteration-count:1|infinite",
          "animn": "animation-name",
          "animps": "animation-play-state:running|paused",
          "animtf": "animation-timing-function:linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier(${1:0.1}, ${2:0.7}, ${3:1.0}, ${3:0.1})",
          "ap": "appearance:none",
          "as": "align-self:start|end|auto|flex-start|flex-end|center|baseline|stretch",
          "b": "bottom",
          "bd": "border:${1:1px} ${2:solid} ${3:#000}",
          "bdb": "border-bottom:${1:1px} ${2:solid} ${3:#000}",
          "bdbc": "border-bottom-color:${1:#000}",
          "bdbi": "border-bottom-image:url(${0})",
          "bdbk": "border-break:close",
          "bdbli": "border-bottom-left-image:url(${0})|continue",
          "bdblrs": "border-bottom-left-radius",
          "bdbri": "border-bottom-right-image:url(${0})|continue",
          "bdbrrs": "border-bottom-right-radius",
          "bdbs": "border-bottom-style",
          "bdbw": "border-bottom-width",
          "bdc": "border-color:${1:#000}",
          "bdci": "border-corner-image:url(${0})|continue",
          "bdcl": "border-collapse:collapse|separate",
          "bdf": "border-fit:repeat|clip|scale|stretch|overwrite|overflow|space",
          "bdi": "border-image:url(${0})",
          "bdl": "border-left:${1:1px} ${2:solid} ${3:#000}",
          "bdlc": "border-left-color:${1:#000}",
          "bdlen": "border-length",
          "bdli": "border-left-image:url(${0})",
          "bdls": "border-left-style",
          "bdlw": "border-left-width",
          "bdr": "border-right:${1:1px} ${2:solid} ${3:#000}",
          "bdrc": "border-right-color:${1:#000}",
          "bdri": "border-right-image:url(${0})",
          "bdrs": "border-radius",
          "bdrst": "border-right-style",
          "bdrw": "border-right-width",
          "bds": "border-style:none|hidden|dotted|dashed|solid|double|dot-dash|dot-dot-dash|wave|groove|ridge|inset|outset",
          "bdsp": "border-spacing",
          "bdt": "border-top:${1:1px} ${2:solid} ${3:#000}",
          "bdtc": "border-top-color:${1:#000}",
          "bdti": "border-top-image:url(${0})",
          "bdtli": "border-top-left-image:url(${0})|continue",
          "bdtlrs": "border-top-left-radius",
          "bdtri": "border-top-right-image:url(${0})|continue",
          "bdtrrs": "border-top-right-radius",
          "bdts": "border-top-style",
          "bdtw": "border-top-width",
          "bdw": "border-width",
          "bbs": "border-block-start",
          "bbe": "border-block-end",
          "bis": "border-inline-start",
          "bie": "border-inline-end",
          "bfv": "backface-visibility:hidden|visible",
          "bg": "background:${1:#000}",
          "bg:n": "background: none",
          "bga": "background-attachment:fixed|scroll",
          "bgbk": "background-break:bounding-box|each-box|continuous",
          "bgc": "background-color:${1:#fff}",
          "bgcp": "background-clip:padding-box|border-box|content-box|no-clip",
          "bgi": "background-image:url(${0})",
          "bgo": "background-origin:padding-box|border-box|content-box",
          "bgp": "background-position:${1:0} ${2:0}",
          "bgpx": "background-position-x",
          "bgpy": "background-position-y",
          "bgr": "background-repeat:no-repeat|repeat-x|repeat-y|space|round",
          "bgsz": "background-size:contain|cover",
          "bs": "block-size",
          "bxsh": "box-shadow:${1:inset }${2:hoff} ${3:voff} ${4:blur} ${5:#000}|none",
          "bxsz": "box-sizing:border-box|content-box|border-box",
          "c": "color:${1:#000}",
          "cr": "color:rgb(${1:0}, ${2:0}, ${3:0})",
          "cra": "color:rgba(${1:0}, ${2:0}, ${3:0}, ${4:.5})",
          "cl": "clear:both|left|right|none",
          "cm": "/* ${0} */",
          "cnt": "content:'${0}'|normal|open-quote|no-open-quote|close-quote|no-close-quote|attr(${0})|counter(${0})|counters(${0})",
          "coi": "counter-increment",
          "colm": "columns",
          "colmc": "column-count",
          "colmf": "column-fill",
          "colmg": "column-gap",
          "colmr": "column-rule",
          "colmrc": "column-rule-color",
          "colmrs": "column-rule-style",
          "colmrw": "column-rule-width",
          "colms": "column-span",
          "colmw": "column-width",
          "cor": "counter-reset",
          "cp": "clip:auto|rect(${1:top} ${2:right} ${3:bottom} ${4:left})",
          "cps": "caption-side:top|bottom",
          "cur": "cursor:pointer|auto|default|crosshair|hand|help|move|pointer|text",
          "d": "display:block|none|flex|inline-flex|inline|inline-block|grid|inline-grid|subgrid|list-item|run-in|contents|table|inline-table|table-caption|table-column|table-column-group|table-header-group|table-footer-group|table-row|table-row-group|table-cell|ruby|ruby-base|ruby-base-group|ruby-text|ruby-text-group",
          "ec": "empty-cells:show|hide",
          "f": "font:${1:1em} ${2:sans-serif}",
          "fd": "font-display:auto|block|swap|fallback|optional",
          "fef": "font-effect:none|engrave|emboss|outline",
          "fem": "font-emphasize",
          "femp": "font-emphasize-position:before|after",
          "fems": "font-emphasize-style:none|accent|dot|circle|disc",
          "ff": "font-family:serif|sans-serif|cursive|fantasy|monospace",
          "fft": 'font-family:"Times New Roman", Times, Baskerville, Georgia, serif',
          "ffa": 'font-family:Arial, "Helvetica Neue", Helvetica, sans-serif',
          "ffv": "font-family:Verdana, Geneva, sans-serif",
          "fl": "float:left|right|none",
          "fs": "font-style:italic|normal|oblique",
          "fsm": "font-smoothing:antialiased|subpixel-antialiased|none",
          "fst": "font-stretch:normal|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded",
          "fv": "font-variant:normal|small-caps",
          "fvs": "font-variation-settings:normal|inherit|initial|unset",
          "fw": "font-weight:normal|bold|bolder|lighter",
          "fx": "flex",
          "fxb": "flex-basis:fill|max-content|min-content|fit-content|content",
          "fxd": "flex-direction:row|row-reverse|column|column-reverse",
          "fxf": "flex-flow",
          "fxg": "flex-grow",
          "fxsh": "flex-shrink",
          "fxw": "flex-wrap:nowrap|wrap|wrap-reverse",
          "fsz": "font-size",
          "fsza": "font-size-adjust",
          "g": "gap",
          "gtc": "grid-template-columns:repeat(${0})|minmax()",
          "gtr": "grid-template-rows:repeat(${0})|minmax()",
          "gta": "grid-template-areas",
          "gt": "grid-template",
          "gg": "grid-gap",
          "gcg": "grid-column-gap",
          "grg": "grid-row-gap",
          "gac": "grid-auto-columns:auto|minmax()",
          "gar": "grid-auto-rows:auto|minmax()",
          "gaf": "grid-auto-flow:row|column|dense|inherit|initial|unset",
          "gd": "grid",
          "gc": "grid-column",
          "gcs": "grid-column-start",
          "gce": "grid-column-end",
          "gr": "grid-row",
          "grs": "grid-row-start",
          "gre": "grid-row-end",
          "ga": "grid-area",
          "h": "height",
          "is": "inline-size",
          "jc": "justify-content:start|end|stretch|flex-start|flex-end|center|space-between|space-around|space-evenly",
          "ji": "justify-items:start|end|center|stretch",
          "js": "justify-self:start|end|center|stretch",
          "l": "left",
          "lg": "background-image:linear-gradient(${1})",
          "lh": "line-height",
          "lis": "list-style",
          "lisi": "list-style-image",
          "lisp": "list-style-position:inside|outside",
          "list": "list-style-type:disc|circle|square|decimal|decimal-leading-zero|lower-roman|upper-roman",
          "lts": "letter-spacing:normal",
          "m": "margin",
          "mah": "max-height",
          "mar": "max-resolution",
          "maw": "max-width",
          "mb": "margin-bottom",
          "mih": "min-height",
          "mir": "min-resolution",
          "miw": "min-width",
          "ml": "margin-left",
          "mr": "margin-right",
          "mt": "margin-top",
          "mbs": "margin-block-start",
          "mbe": "margin-block-end",
          "mis": "margin-inline-start",
          "mie": "margin-inline-end",
          "ol": "outline",
          "olc": "outline-color:${1:#000}|invert",
          "olo": "outline-offset",
          "ols": "outline-style:none|dotted|dashed|solid|double|groove|ridge|inset|outset",
          "olw": "outline-width:thin|medium|thick",
          "op|opa": "opacity",
          "ord": "order",
          "ori": "orientation:landscape|portrait",
          "orp": "orphans",
          "ov": "overflow:hidden|visible|hidden|scroll|auto",
          "ovs": "overflow-style:scrollbar|auto|scrollbar|panner|move|marquee",
          "ovx": "overflow-x:hidden|visible|hidden|scroll|auto",
          "ovy": "overflow-y:hidden|visible|hidden|scroll|auto",
          "p": "padding",
          "pb": "padding-bottom",
          "pgba": "page-break-after:auto|always|left|right",
          "pgbb": "page-break-before:auto|always|left|right",
          "pgbi": "page-break-inside:auto|avoid",
          "pl": "padding-left",
          "pos": "position:relative|absolute|relative|fixed|static",
          "pr": "padding-right",
          "pt": "padding-top",
          "pbs": "padding-block-start",
          "pbe": "padding-block-end",
          "pis": "padding-inline-start",
          "pie": "padding-inline-end",
          "spbs": "scroll-padding-block-start",
          "spbe": "scroll-padding-block-end",
          "spis": "scroll-padding-inline-start",
          "spie": "scroll-padding-inline-end",
          "q": "quotes",
          "qen": "quotes:'\\201C' '\\201D' '\\2018' '\\2019'",
          "qru": "quotes:'\\00AB' '\\00BB' '\\201E' '\\201C'",
          "r": "right",
          "rsz": "resize:none|both|horizontal|vertical",
          "t": "top",
          "ta": "text-align:left|center|right|justify",
          "tal": "text-align-last:left|center|right",
          "tbl": "table-layout:fixed",
          "td": "text-decoration:none|underline|overline|line-through",
          "te": "text-emphasis:none|accent|dot|circle|disc|before|after",
          "th": "text-height:auto|font-size|text-size|max-size",
          "ti": "text-indent",
          "tj": "text-justify:auto|inter-word|inter-ideograph|inter-cluster|distribute|kashida|tibetan",
          "to": "text-outline:${1:0} ${2:0} ${3:#000}",
          "tov": "text-overflow:ellipsis|clip",
          "tr": "text-replace",
          "trf": "transform:${1}|skewX(${1:angle})|skewY(${1:angle})|scale(${1:x}, ${2:y})|scaleX(${1:x})|scaleY(${1:y})|scaleZ(${1:z})|scale3d(${1:x}, ${2:y}, ${3:z})|rotate(${1:angle})|rotateX(${1:angle})|rotateY(${1:angle})|rotateZ(${1:angle})|translate(${1:x}, ${2:y})|translateX(${1:x})|translateY(${1:y})|translateZ(${1:z})|translate3d(${1:tx}, ${2:ty}, ${3:tz})",
          "trfo": "transform-origin",
          "trfs": "transform-style:preserve-3d",
          "trs": "transition:${1:prop} ${2:time}",
          "trsde": "transition-delay:${1:time}",
          "trsdu": "transition-duration:${1:time}",
          "trsp": "transition-property:${1:prop}",
          "trstf": "transition-timing-function:${1:fn}",
          "tsh": "text-shadow:${1:hoff} ${2:voff} ${3:blur} ${4:#000}",
          "tt": "text-transform:uppercase|lowercase|capitalize|none",
          "tw": "text-wrap:none|normal|unrestricted|suppress",
          "us": "user-select:none",
          "v": "visibility:hidden|visible|collapse",
          "va": "vertical-align:top|super|text-top|middle|baseline|bottom|text-bottom|sub",
          "w": "width",
          "whs": "white-space:nowrap|pre|pre-wrap|pre-line|normal",
          "whsc": "white-space-collapse:normal|keep-all|loose|break-strict|break-all",
          "wid": "widows",
          "wm": "writing-mode:lr-tb|lr-tb|lr-bt|rl-tb|rl-bt|tb-rl|tb-lr|bt-lr|bt-rl",
          "wob": "word-break:normal|keep-all|break-all",
          "wos": "word-spacing",
          "wow": "word-wrap:none|unrestricted|suppress|break-word|normal",
          "z": "z-index",
          "zom": "zoom:1"
        };
        var xslSnippets = {
          "tm|tmatch": "xsl:template[match mode]",
          "tn|tname": "xsl:template[name]",
          "call": "xsl:call-template[name]",
          "ap": "xsl:apply-templates[select mode]",
          "api": "xsl:apply-imports",
          "imp": "xsl:import[href]",
          "inc": "xsl:include[href]",
          "ch": "xsl:choose",
          "wh|xsl:when": "xsl:when[test]",
          "ot": "xsl:otherwise",
          "if": "xsl:if[test]",
          "par": "xsl:param[name]",
          "pare": "xsl:param[name select]",
          "var": "xsl:variable[name]",
          "vare": "xsl:variable[name select]",
          "wp": "xsl:with-param[name select]",
          "key": "xsl:key[name match use]",
          "elem": "xsl:element[name]",
          "attr": "xsl:attribute[name]",
          "attrs": "xsl:attribute-set[name]",
          "cp": "xsl:copy[select]",
          "co": "xsl:copy-of[select]",
          "val": "xsl:value-of[select]",
          "for|each": "xsl:for-each[select]",
          "tex": "xsl:text",
          "com": "xsl:comment",
          "msg": "xsl:message[terminate=no]",
          "fall": "xsl:fallback",
          "num": "xsl:number[value]",
          "nam": "namespace-alias[stylesheet-prefix result-prefix]",
          "pres": "xsl:preserve-space[elements]",
          "strip": "xsl:strip-space[elements]",
          "proc": "xsl:processing-instruction[name]",
          "sort": "xsl:sort[select order]",
          "choose": "xsl:choose>xsl:when+xsl:otherwise",
          "xsl": "!!!+xsl:stylesheet[version=1.0 xmlns:xsl=http://www.w3.org/1999/XSL/Transform]>{\n|}",
          "!!!": '{<?xml version="1.0" encoding="UTF-8"?>}'
        };
        var pugSnippets = {
          "!!!": "{doctype html}"
        };
        var variables = {
          "lang": "en",
          "locale": "en-US",
          "charset": "UTF-8",
          "indentation": "	",
          "newline": "\n"
        };
        var defaultSyntaxes = {
          markup: "html",
          stylesheet: "css"
        };
        var defaultOptions$1 = {
          "inlineElements": [
            "a",
            "abbr",
            "acronym",
            "applet",
            "b",
            "basefont",
            "bdo",
            "big",
            "br",
            "button",
            "cite",
            "code",
            "del",
            "dfn",
            "em",
            "font",
            "i",
            "iframe",
            "img",
            "input",
            "ins",
            "kbd",
            "label",
            "map",
            "object",
            "q",
            "s",
            "samp",
            "select",
            "small",
            "span",
            "strike",
            "strong",
            "sub",
            "sup",
            "textarea",
            "tt",
            "u",
            "var"
          ],
          "output.indent": "	",
          "output.baseIndent": "",
          "output.newline": "\n",
          "output.tagCase": "",
          "output.attributeCase": "",
          "output.attributeQuotes": "double",
          "output.format": true,
          "output.formatLeafNode": false,
          "output.formatSkip": ["html"],
          "output.formatForce": ["body"],
          "output.inlineBreak": 3,
          "output.compactBoolean": false,
          "output.booleanAttributes": [
            "contenteditable",
            "seamless",
            "async",
            "autofocus",
            "autoplay",
            "checked",
            "controls",
            "defer",
            "disabled",
            "formnovalidate",
            "hidden",
            "ismap",
            "loop",
            "multiple",
            "muted",
            "novalidate",
            "readonly",
            "required",
            "reversed",
            "selected",
            "typemustmatch"
          ],
          "output.reverseAttributes": false,
          "output.selfClosingStyle": "html",
          "output.field": (index, placeholder) => placeholder,
          "output.text": (text2) => text2,
          "markup.href": true,
          "comment.enabled": false,
          "comment.trigger": ["id", "class"],
          "comment.before": "",
          "comment.after": "\n<!-- /[#ID][.CLASS] -->",
          "bem.enabled": false,
          "bem.element": "__",
          "bem.modifier": "_",
          "jsx.enabled": false,
          "stylesheet.keywords": ["auto", "inherit", "unset", "none"],
          "stylesheet.unitless": ["z-index", "line-height", "opacity", "font-weight", "zoom", "flex", "flex-grow", "flex-shrink"],
          "stylesheet.shortHex": true,
          "stylesheet.between": ": ",
          "stylesheet.after": ";",
          "stylesheet.intUnit": "px",
          "stylesheet.floatUnit": "em",
          "stylesheet.unitAliases": { e: "em", p: "%", x: "ex", r: "rem" },
          "stylesheet.json": false,
          "stylesheet.jsonDoubleQuotes": false,
          "stylesheet.fuzzySearchMinScore": 0
        };
        var defaultConfig = {
          type: "markup",
          syntax: "html",
          variables,
          snippets: {},
          options: defaultOptions$1
        };
        var syntaxConfig = {
          markup: {
            snippets: parseSnippets(markupSnippets)
          },
          xhtml: {
            options: {
              "output.selfClosingStyle": "xhtml"
            }
          },
          xml: {
            options: {
              "output.selfClosingStyle": "xml"
            }
          },
          xsl: {
            snippets: parseSnippets(xslSnippets),
            options: {
              "output.selfClosingStyle": "xml"
            }
          },
          jsx: {
            options: {
              "jsx.enabled": true,
              "markup.attributes": {
                "class": "className",
                "class*": "styleName",
                "for": "htmlFor"
              },
              "markup.valuePrefix": {
                "class*": "styles"
              }
            }
          },
          vue: {
            options: {
              "markup.attributes": {
                "class*": ":class"
              }
            }
          },
          svelte: {
            options: {
              "jsx.enabled": true
            }
          },
          pug: {
            snippets: parseSnippets(pugSnippets)
          },
          stylesheet: {
            snippets: parseSnippets(stylesheetSnippets)
          },
          sass: {
            options: {
              "stylesheet.after": ""
            }
          },
          stylus: {
            options: {
              "stylesheet.between": " ",
              "stylesheet.after": ""
            }
          }
        };
        function parseSnippets(snippets) {
          const result = {};
          Object.keys(snippets).forEach((k) => {
            for (const name of k.split("|")) {
              result[name] = snippets[k];
            }
          });
          return result;
        }
        function resolveConfig(config = {}, globals = {}) {
          const type = config.type || "markup";
          const syntax = config.syntax || defaultSyntaxes[type];
          return Object.assign(Object.assign(Object.assign({}, defaultConfig), config), {
            type,
            syntax,
            variables: mergedData(type, syntax, "variables", config, globals),
            snippets: mergedData(type, syntax, "snippets", config, globals),
            options: mergedData(type, syntax, "options", config, globals)
          });
        }
        function mergedData(type, syntax, key, config, globals = {}) {
          const typeDefaults = syntaxConfig[type];
          const typeOverride = globals[type];
          const syntaxDefaults = syntaxConfig[syntax];
          const syntaxOverride = globals[syntax];
          return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, defaultConfig[key]), typeDefaults && typeDefaults[key]), syntaxDefaults && syntaxDefaults[key]), typeOverride && typeOverride[key]), syntaxOverride && syntaxOverride[key]), config[key]);
        }
        function backwardScanner(text2, start = 0) {
          return { text: text2, start, pos: text2.length };
        }
        function sol(scanner) {
          return scanner.pos === scanner.start;
        }
        function peek(scanner, offset = 0) {
          return scanner.text.charCodeAt(scanner.pos - 1 + offset);
        }
        function previous(scanner) {
          if (!sol(scanner)) {
            return scanner.text.charCodeAt(--scanner.pos);
          }
        }
        function consume(scanner, match) {
          if (sol(scanner)) {
            return false;
          }
          const ok = typeof match === "function" ? match(peek(scanner)) : match === peek(scanner);
          if (ok) {
            scanner.pos--;
          }
          return !!ok;
        }
        function consumeWhile(scanner, match) {
          const start = scanner.pos;
          while (consume(scanner, match)) {
          }
          return scanner.pos < start;
        }
        var Chars$1;
        (function(Chars2) {
          Chars2[Chars2["SingleQuote"] = 39] = "SingleQuote";
          Chars2[Chars2["DoubleQuote"] = 34] = "DoubleQuote";
          Chars2[Chars2["Escape"] = 92] = "Escape";
        })(Chars$1 || (Chars$1 = {}));
        function isQuote(c) {
          return c === Chars$1.SingleQuote || c === Chars$1.DoubleQuote;
        }
        function consumeQuoted(scanner) {
          const start = scanner.pos;
          const quote2 = previous(scanner);
          if (isQuote(quote2)) {
            while (!sol(scanner)) {
              if (previous(scanner) === quote2 && peek(scanner) !== Chars$1.Escape) {
                return true;
              }
            }
          }
          scanner.pos = start;
          return false;
        }
        var Brackets;
        (function(Brackets2) {
          Brackets2[Brackets2["SquareL"] = 91] = "SquareL";
          Brackets2[Brackets2["SquareR"] = 93] = "SquareR";
          Brackets2[Brackets2["RoundL"] = 40] = "RoundL";
          Brackets2[Brackets2["RoundR"] = 41] = "RoundR";
          Brackets2[Brackets2["CurlyL"] = 123] = "CurlyL";
          Brackets2[Brackets2["CurlyR"] = 125] = "CurlyR";
        })(Brackets || (Brackets = {}));
        var bracePairs = {
          [Brackets.SquareL]: Brackets.SquareR,
          [Brackets.RoundL]: Brackets.RoundR,
          [Brackets.CurlyL]: Brackets.CurlyR
        };
        var Chars;
        (function(Chars2) {
          Chars2[Chars2["Tab"] = 9] = "Tab";
          Chars2[Chars2["Space"] = 32] = "Space";
          Chars2[Chars2["Dash"] = 45] = "Dash";
          Chars2[Chars2["Slash"] = 47] = "Slash";
          Chars2[Chars2["Colon"] = 58] = "Colon";
          Chars2[Chars2["Equals"] = 61] = "Equals";
          Chars2[Chars2["AngleLeft"] = 60] = "AngleLeft";
          Chars2[Chars2["AngleRight"] = 62] = "AngleRight";
        })(Chars || (Chars = {}));
        function isHtml(scanner) {
          const start = scanner.pos;
          if (!consume(scanner, Chars.AngleRight)) {
            return false;
          }
          let ok = false;
          consume(scanner, Chars.Slash);
          while (!sol(scanner)) {
            consumeWhile(scanner, isWhiteSpace);
            if (consumeIdent(scanner)) {
              if (consume(scanner, Chars.Slash)) {
                ok = consume(scanner, Chars.AngleLeft);
                break;
              } else if (consume(scanner, Chars.AngleLeft)) {
                ok = true;
                break;
              } else if (consume(scanner, isWhiteSpace)) {
                continue;
              } else if (consume(scanner, Chars.Equals)) {
                if (consumeIdent(scanner)) {
                  continue;
                }
                break;
              } else if (consumeAttributeWithUnquotedValue(scanner)) {
                ok = true;
                break;
              }
              break;
            }
            if (consumeAttribute(scanner)) {
              continue;
            }
            break;
          }
          scanner.pos = start;
          return ok;
        }
        function consumeAttribute(scanner) {
          return consumeAttributeWithQuotedValue(scanner) || consumeAttributeWithUnquotedValue(scanner);
        }
        function consumeAttributeWithQuotedValue(scanner) {
          const start = scanner.pos;
          if (consumeQuoted(scanner) && consume(scanner, Chars.Equals) && consumeIdent(scanner)) {
            return true;
          }
          scanner.pos = start;
          return false;
        }
        function consumeAttributeWithUnquotedValue(scanner) {
          const start = scanner.pos;
          const stack = [];
          while (!sol(scanner)) {
            const ch = peek(scanner);
            if (isCloseBracket(ch)) {
              stack.push(ch);
            } else if (isOpenBracket(ch)) {
              if (stack.pop() !== bracePairs[ch]) {
                break;
              }
            } else if (!isUnquotedValue(ch)) {
              break;
            }
            scanner.pos--;
          }
          if (start !== scanner.pos && consume(scanner, Chars.Equals) && consumeIdent(scanner)) {
            return true;
          }
          scanner.pos = start;
          return false;
        }
        function consumeIdent(scanner) {
          return consumeWhile(scanner, isIdent);
        }
        function isIdent(ch) {
          return ch === Chars.Colon || ch === Chars.Dash || isAlpha(ch) || isNumber(ch);
        }
        function isAlpha(ch) {
          ch &= ~32;
          return ch >= 65 && ch <= 90;
        }
        function isNumber(ch) {
          return ch > 47 && ch < 58;
        }
        function isWhiteSpace(ch) {
          return ch === Chars.Space || ch === Chars.Tab;
        }
        function isUnquotedValue(ch) {
          return !isNaN(ch) && ch !== Chars.Equals && !isWhiteSpace(ch) && !isQuote(ch);
        }
        function isOpenBracket(ch) {
          return ch === Brackets.CurlyL || ch === Brackets.RoundL || ch === Brackets.SquareL;
        }
        function isCloseBracket(ch) {
          return ch === Brackets.CurlyR || ch === Brackets.RoundR || ch === Brackets.SquareR;
        }
        var code = (ch) => ch.charCodeAt(0);
        var specialChars = "#.*:$-_!@%^+>/".split("").map(code);
        var defaultOptions = {
          type: "markup",
          lookAhead: true,
          prefix: ""
        };
        function extractAbbreviation(line, pos = line.length, options = {}) {
          const opt2 = Object.assign(Object.assign({}, defaultOptions), options);
          pos = Math.min(line.length, Math.max(0, pos == null ? line.length : pos));
          if (opt2.lookAhead) {
            pos = offsetPastAutoClosed(line, pos, opt2);
          }
          let ch;
          const start = getStartOffset(line, pos, opt2.prefix || "");
          if (start === -1) {
            return void 0;
          }
          const scanner = backwardScanner(line, start);
          scanner.pos = pos;
          const stack = [];
          while (!sol(scanner)) {
            ch = peek(scanner);
            if (stack.includes(Brackets.CurlyR)) {
              if (ch === Brackets.CurlyR) {
                stack.push(ch);
                scanner.pos--;
                continue;
              }
              if (ch !== Brackets.CurlyL) {
                scanner.pos--;
                continue;
              }
            }
            if (isCloseBrace(ch, opt2.type)) {
              stack.push(ch);
            } else if (isOpenBrace(ch, opt2.type)) {
              if (stack.pop() !== bracePairs[ch]) {
                break;
              }
            } else if (stack.includes(Brackets.SquareR) || stack.includes(Brackets.CurlyR)) {
              scanner.pos--;
              continue;
            } else if (isHtml(scanner) || !isAbbreviation(ch)) {
              break;
            }
            scanner.pos--;
          }
          if (!stack.length && scanner.pos !== pos) {
            const abbreviation2 = line.slice(scanner.pos, pos).replace(/^[*+>^]+/, "");
            return {
              abbreviation: abbreviation2,
              location: pos - abbreviation2.length,
              start: options.prefix ? start - options.prefix.length : pos - abbreviation2.length,
              end: pos
            };
          }
        }
        function offsetPastAutoClosed(line, pos, options) {
          if (isQuote(line.charCodeAt(pos))) {
            pos++;
          }
          while (isCloseBrace(line.charCodeAt(pos), options.type)) {
            pos++;
          }
          return pos;
        }
        function getStartOffset(line, pos, prefix) {
          if (!prefix) {
            return 0;
          }
          const scanner = backwardScanner(line);
          const compiledPrefix = prefix.split("").map(code);
          scanner.pos = pos;
          let result;
          while (!sol(scanner)) {
            if (consumePair(scanner, Brackets.SquareR, Brackets.SquareL) || consumePair(scanner, Brackets.CurlyR, Brackets.CurlyL)) {
              continue;
            }
            result = scanner.pos;
            if (consumeArray(scanner, compiledPrefix)) {
              return result;
            }
            scanner.pos--;
          }
          return -1;
        }
        function consumePair(scanner, close, open) {
          const start = scanner.pos;
          if (consume(scanner, close)) {
            while (!sol(scanner)) {
              if (consume(scanner, open)) {
                return true;
              }
              scanner.pos--;
            }
          }
          scanner.pos = start;
          return false;
        }
        function consumeArray(scanner, arr) {
          const start = scanner.pos;
          let consumed = false;
          for (let i = arr.length - 1; i >= 0 && !sol(scanner); i--) {
            if (!consume(scanner, arr[i])) {
              break;
            }
            consumed = i === 0;
          }
          if (!consumed) {
            scanner.pos = start;
          }
          return consumed;
        }
        function isAbbreviation(ch) {
          return ch > 64 && ch < 91 || ch > 96 && ch < 123 || ch > 47 && ch < 58 || specialChars.includes(ch);
        }
        function isOpenBrace(ch, syntax) {
          return ch === Brackets.RoundL || syntax === "markup" && (ch === Brackets.SquareL || ch === Brackets.CurlyL);
        }
        function isCloseBrace(ch, syntax) {
          return ch === Brackets.RoundR || syntax === "markup" && (ch === Brackets.SquareR || ch === Brackets.CurlyR);
        }
        function expandAbbreviation(abbr, config) {
          const resolvedConfig = resolveConfig(config);
          return resolvedConfig.type === "stylesheet" ? stylesheet(abbr, resolvedConfig) : markup(abbr, resolvedConfig);
        }
        function markup(abbr, config) {
          return stringify(parse$1(abbr, config), config);
        }
        function stylesheet(abbr, config) {
          return css(parse(abbr, config), config);
        }
      
        // client_src/main.mjs
        window.expand = expandAbbreviation;
        window.extract = extractAbbreviation;
      })();
      

    // define a handler
    var main_selector="#code";
    function emmetResolve(expansion_type) {
        var userInput = jQuery(main_selector).val();
        var lines = userInput.split("\n");
        var line = null;
        var extraction = null;
        var expansion = null;
        for(var i = 0; i < lines.length; i++) {
            extraction = extract(lines[i], lines[i].length + 1);
            // If it's not falsy, then let's proceed with expanding the emmet abbreviation.
            if(extraction) {
                expansion = expand(extraction.abbreviation, expansion_type);
                lines[i] = lines[i].substring(0, extraction.start) + expansion + lines[i].substring(extraction.end, lines[i].length);
            }
        }
        // Place the resulting expanded text back into the input or textarea.
        jQuery(main_selector).val(lines.join("\n"));
    }
    function emmetHandler(e) {
        if (e.key == "Tab") {
            emmetResolve( { type: "stylesheet" } ); // use { type: "html" } for HTML.
        }
    }
    function emmetHandlerTabTrapper(e) {
        if (e.key == "Tab") {
            e.preventDefault();
        }
    }
    // register the handler 
    document.querySelector(main_selector).addEventListener('keyup', emmetHandler, false);
    document.querySelector(main_selector).addEventListener('keydown', emmetHandlerTabTrapper, false);

    console.log("%cTampermonkey CSS emmet support script enabled!", "color: #0C0;");
})();