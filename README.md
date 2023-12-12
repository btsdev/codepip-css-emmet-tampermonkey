# codepip-css-emmet-tampermonkey
Tampermonkey script for the Codepip [Flexbox Froggy](https://codepip.com/games/flexbox-froggy/) game.

## Installation
Simply install tampermonkey from the chrome store, and add the code from main.js as a user snippet.

## Browser support
So far, I've only tested on Windows 10 with the Chrome browser.

## Usage
With this snippet enabled, you can use the tab key to expand emmet CSS abbreviations while playing the Flexbox Froggy Pro game.

You may want to adjust the matching whitelist urls for the user snippet to have it run on other games that use CSS inputs. By default it is only targetting the Flexbox Froggy and Flexbox Froggy Pro games.

Note, that I've only tested it on the Flexbox Froggy and Flexbox Froggy Pro games so far. It might work just fine on the other CSS games though.

## How this was built
I'm merely injecting and using the expand and extract functionality from the [emmet](https://github.com/emmetio/emmet) npm package (which I used [esbuild](https://www.npmjs.com/package/esbuild) to make browser-ready) as part of the user snippet to enable the following code snippet to work:

```js
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
```