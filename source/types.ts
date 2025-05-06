import { z } from 'zod';
import { SetRequired } from 'type-fest';

// Constants
import { OPTIONS_SCHEMA } from './constants.js';

export type Patterns = string[];

export interface Options extends z.infer<typeof OPTIONS_SCHEMA> {}

export interface OptionsWithStyles extends Omit<Options, 'styles'> {
    styles: SetRequired<Options['styles'], 'filename'>;
}

export enum StylesType {
    Directory = 'directory',
    Module = 'module',
    Asset = 'asset'
}

export enum Output {
    Spritemap = 'spritemap',
    Styles = 'styles'
}

export interface Variable {
    name: string;
    attribute: string;
    value: string;
}

export interface VariableDefaultValueMismatch extends Pick<Variable, 'name'> {
    values: Variable['value'][];
}

export type VariableRewriter = (variable: Variable) => string;
