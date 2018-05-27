const regex = new RegExp(/var:([^\s.]+)\.?(\S*)="(.*?(?=\"))"/, 'gi');

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
    findDefaultValueMismatches: (svg) => {
        const valuesByName = finder(svg).reduce((accumulator, value) => {
            const existing = typeof accumulator[value.name] !== 'undefined' ? accumulator[value.name] : [];

            return Object.assign(accumulator, {
                [value.name]: existing.concat([value.value])
            });
        }, {});

        return Object.keys(valuesByName).reduce((accumulator, key) => {
            if ( valuesByName[key].every((value) => value === valuesByName[key][0]) ) {
                return accumulator;
            }

            return [...accumulator, {
                name: key,
                values: valuesByName[key]
            }];
        }, []);
    },
    rewriteVariables: rewriter,
    stripVariables: (svg) => {
        return rewriter(svg, (name, attribute, value) => {
            return `${attribute}="${value}"`;
        })
    }
};
