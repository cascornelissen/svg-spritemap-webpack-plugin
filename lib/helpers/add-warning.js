module.exports = (warning, compilation) => {
    if (!compilation || typeof compilation.warnings === 'undefined') {
        return;
    }

    compilation.warnings.push(warning);
}
