const SVGSpritemapPlugin = require('../..');
// Icons file is formatted as follow:
// "Name use in html": "filename"
// See icons.json for an example
const icons = require('./icons.json');

// Read the icons.json file return an array of filename
function getIcons () {
    let list = [];
    for (let patternName in icons) {
        if (icons.hasOwnProperty(patternName)) {
            list.push(`src/sprites/${icons[patternName]}.svg`);
        }
    }
    return list;
}

// Create the ID based on the keys in icons.json
function createID (srcName) {
    let name = srcName;
    for (let patternName in icons) {
        if (icons.hasOwnProperty(patternName)) {
            if (icons[patternName] !== null && icons[patternName] === srcName) {
                name = patternName;
                delete icons[patternName];
                break;
            }
        }
    }
    return name;
}

module.exports = {
    plugins: [
        new SVGSpritemapPlugin(getIcons(), {
            output: {
                allowDuplicateItems: true
            },
            sprite: {
                idify: (filename) => {
                    return createID(filename)
                }
            }
        })
    ]
};
