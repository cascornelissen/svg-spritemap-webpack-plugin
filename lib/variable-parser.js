const regex = new RegExp(/var:([^\s.]*)\.?(\S*)="(.*)"/, 'gi');

const finder = (svg) => {
    let variables = [];
    let match = regex.exec(svg);
    while ( match !== null ) {
        variables.push({
            name: match[1],
            attribute: match[2] || match[1],
            value: match[3],
        });

        match = regex.exec(svg);
    }

    return variables;
};

const rewriter = (svg, fn) => {
    return svg.replace(regex, (match, name, attribute, value) => {
        // Name is optional and should be equal to the attribute if it's not provided
        if ( !attribute ) {
            attribute = name;
        }

        return fn(name, attribute, value);
    }).replace(/xmlns:var=""\s/g, ''); // Strip the automatically added namespaces as well
};

module.exports = {
    findVariables: finder,
    findUniqueVariables: (svg) => {
        return finder(svg).filter((variable, i, variables) => {
            return variables.findIndex((v) => v.name === variable.name) === i;
        });
    },
    rewriteVariables: rewriter,
    stripVariables: (svg) => {
        return rewriter(svg, (name, attribute, value) => {
            return `${attribute}="${value}"`;
        })
    }
};
