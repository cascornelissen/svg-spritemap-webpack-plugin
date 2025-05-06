import { groupBy, uniq, uniqBy } from 'lodash-es';

// Constants
import { VAR_NAMESPACE, VAR_NAMESPACE_REGEX, VAR_NAMESPACE_VALUE, VAR_REGEX } from '../constants.js';

// Types
import { Variable, VariableDefaultValueMismatch, VariableRewriter } from '../types.js';

const matchToVariable = (match: string[]) => {
    return {
        /* eslint-disable unicorn/prefer-at */
        name: match[1],
        attribute: match[2] || match[1],
        value: match[3]
        /* eslint-enable unicorn/prefer-at */
    };
};

export const findVariables = (content: string | undefined): Variable[] => {
    const variables: Variable[] = [];

    if (!content) {
        return variables;
    }

    return [...content.matchAll(VAR_REGEX)].map((match) => {
        return matchToVariable(match);
    });
};

export const findUniqueVariables = (content: string | undefined): Variable[] => {
    return uniqBy(findVariables(content), 'name');
};

export const findDefaultVariableValueMismatches = (content: string | undefined): VariableDefaultValueMismatch[] => {
    return Object.entries(groupBy(findVariables(content), 'name')).filter(([, variables]) => {
        return uniq(variables.map((variable) => {
            return variable.value;
        })).length > 1;
    }).map(([name, variables]) => {
        return {
            name,
            values: variables.map((variable) => {
                return variable.value;
            })
        };
    });
};

export const rewriteVariables = (content: string, rewriter: VariableRewriter) => {
    return content.replace(VAR_REGEX, (...match) => {
        return rewriter(matchToVariable(match));
    }).replace(VAR_NAMESPACE_REGEX, '');
};

export const stripVariables = (content: string) => {
    return rewriteVariables(content, (variable) => {
        return `${variable.attribute}="${variable.value}"`;
    });
};

export const hasVariables = (content: string | string[] | undefined) => {
    return !!findVariables([content].flat().join('\n')).length;
};

export const addVariablesNamespace = (content: string) => {
    if (VAR_NAMESPACE_REGEX.test(content)) {
        return content;
    }

    return content.replace(/<svg/i, `<svg xmlns:${VAR_NAMESPACE}="${VAR_NAMESPACE_VALUE}"`);
};
