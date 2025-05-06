import { z } from 'zod';
import { identity } from 'lodash-es';

// Helpers
import { idify } from './helpers/idify.js';
import { zFunction } from './helpers/validation.js';

// Types
import { Options } from './types.js';

export const VAR_NAMESPACE = 'var';
export const VAR_NAMESPACE_VALUE = 'https://github.com/cascornelissen/svg-spritemap-webpack-plugin/';
export const VAR_NAMESPACE_REGEX = new RegExp(`xmlns:${VAR_NAMESPACE}=(['"])[^'"]*(['"])`, 'gi');
export const VAR_REGEX = new RegExp(`${VAR_NAMESPACE}:([^\\s.]+)\\.?(\\S*)="(.*?(?="))"`, 'gi');
export const SPRITE_NAME_ATTRIBUTE = 'data-svg-spritemap-webpack-plugin-name';
export const SPRITE_LOCATION_ATTRIBUTE = 'data-svg-spritemap-webpack-plugin-location';

export const PLUGIN = {
    name: 'SVGSpritemapPlugin'
};

export const OPTIONS_SCHEMA = z.strictObject({
    input: z.object({
        options: z.record(z.string(), z.any()),
        allowDuplicates: z.boolean()
    }),
    output: z.object({
        filename: z.string(),
        svg: z.object({
            sizes: z.boolean(),
            attributes: z.record(z.string(), z.string())
        }),
        chunk: z.object({
            name: z.string(),
            keep: z.boolean()
        }),
        svg4everybody: z.union([
            z.boolean(),
            z.record(z.string(), z.any())
        ]),
        svgo: z.union([
            z.boolean(),
            z.record(z.string(), z.any())
        ])
    }),
    sprite: z.object({
        prefix: z.union([
            z.string(),
            z.literal(false),
            zFunction
        ]),
        idify: z.union([
            z.literal(false),
            zFunction
        ]),
        gutter: z.number(),
        generate: z.object({
            title: z.boolean(),
            dimensions: z.boolean(),
            use: z.boolean(),
            symbol: z.union([
                z.boolean(),
                z.string()
            ]),
            view: z.union([
                z.boolean(),
                z.string()
            ])
        })
    }),
    styles: z.object({
        filename: z.string().optional(),
        attributes: z.object({
            keep: z.boolean()
        }),
        selectors: z.object({
            prefix: z.boolean()
        }),
        format: z.union([
            z.literal('data'),
            z.literal('fragment')
        ]),
        variables: z.object({
            sprites: z.string(),
            sizes: z.string(),
            variables: z.string(),
            mixin: z.string()
        }),
        callback: zFunction
    })
});

export const DEFAULT_OPTIONS: Options = {
    input: {
        options: {},
        allowDuplicates: false
    },
    output: {
        filename: 'spritemap.svg',
        svg: {
            sizes: false,
            attributes: {}
        },
        chunk: {
            name: 'spritemap',
            keep: false
        },
        svg4everybody: false,
        svgo: true
    },
    sprite: {
        prefix: 'sprite-',
        idify: idify,
        gutter: 0,
        generate: {
            title: true,
            symbol: true,
            use: false,
            view: false,
            dimensions: false
        }
    },
    styles: {
        attributes: {
            keep: false
        },
        selectors: {
            prefix: false
        },
        format: 'data',
        variables: {
            mixin: 'get',
            sizes: 'sizes',
            sprites: 'sprites',
            variables: 'variables'
        },
        callback: identity
    }
};
