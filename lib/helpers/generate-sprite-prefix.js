module.exports = (prefix, file) => {
    if ( typeof prefix === 'function' ) {
        return prefix(file);
    }

    return prefix;
};