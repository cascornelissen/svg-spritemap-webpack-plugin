module.exports = (svg) => {
    const re = new RegExp(/var:([^\s.]*)\.?(\S*)="(.*)"/, 'gi');

    return svg.replace(re, (match, name, attribute, value) => {
        if ( !attribute ) {
            attribute = name;
        }

        return `${attribute}="${value}"`;
    });
};
