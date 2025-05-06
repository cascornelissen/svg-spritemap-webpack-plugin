import fs from 'node:fs';
import path from 'node:path';

export const getTemplate = (filename: string) => {
    return fs.readFileSync(path.resolve(import.meta.dirname, '../templates/', filename), 'utf8').toString();
};
