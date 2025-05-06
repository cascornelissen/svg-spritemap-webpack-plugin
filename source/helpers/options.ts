import { merge } from 'webpack-merge';
import { PartialDeep } from 'type-fest';

// Constants
import { DEFAULT_OPTIONS, OPTIONS_SCHEMA } from '../constants.js';

// Types
import { Options, OptionsWithStyles } from '../types.js';

export const formatOptions = (options: PartialDeep<Options>): Options => {
    const result = OPTIONS_SCHEMA.safeParse(merge(DEFAULT_OPTIONS, options));

    if (!result.success) {
        throw new Error(`Invalid options: ${result.error.message}`);
    }

    return result.data;
};

export const isOptionsWithStyles = (options: Options): options is OptionsWithStyles => {
    return options.styles.filename !== undefined;
};
