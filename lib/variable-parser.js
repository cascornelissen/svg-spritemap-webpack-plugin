const VAR_NAMESPACE = 'var';
const VAR_NAMESPACE_VALUE = 'https://github.com/cascornelissen/svg-spritemap-webpack-plugin/';
const VAR_REGEX = new RegExp(`${VAR_NAMESPACE}:([^\\s.]+)\\.?(\\S*)="(.*?(?=\\"))"`, 'gi');
const NAMESPACE_REGEX = new RegExp(`xmlns:${VAR_NAMESPACE}=('|")[^'"]*('|")`, 'gi');

const finder = (svg) => {
    let variables = [];
    let match = VAR_REGEX.exec(svg);
    while ( match !== null ) {
        variables.push({
            name: match[1],
            attribute: match[2] || match[1],
            value: match[3]
        });

        match = VAR_REGEX.exec(svg);
    }

    return variables;
};

const rewriter = (svg, fn) => {
    return svg.replace(VAR_REGEX, (match, name, attribute, value) => {
        // Name is optional and should be equal to the attribute if it's not provided
        if ( !attribute ) {
            attribute = name;
        }

        return fn(name, attribute, value);
    }).replace(NAMESPACE_REGEX, ''); // Strip the automatically added namespaces as well
};

module.exports = {
    // Constants
    VAR_NAMESPACE: VAR_NAMESPACE,
    VAR_NAMESPACE_VALUE: VAR_NAMESPACE_VALUE,

    // Functions
    findVariables: finder,
    hasVariables: (svg) => {
        return !!finder(svg).length;
    },
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
        });
    },
    hasVarNamespace: (svg) => {
        return !!NAMESPACE_REGEX.exec(svg);
    },
    addVarNamespace: (svg) => {
        return svg.replace(/<svg/i, `<svg xmlns:${VAR_NAMESPACE}="${VAR_NAMESPACE_VALUE}"`);
    }
};
