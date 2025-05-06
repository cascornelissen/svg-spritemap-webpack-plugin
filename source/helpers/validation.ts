import { z } from 'zod';

export const zFunction = z.custom<(...parameters: any[]) => any>((value): value is (...parameters: any[]) => any => { // eslint-disable-line @typescript-eslint/no-explicit-any
    return typeof value === 'function';
});
