import {
    OptionsMismatchWarning,
    VariablesNotSupportedInLanguageWarning,
    VariablesNotSupportedWithFragmentsWarning,
    VariablesWithInvalidDefaultsWarning
} from '../lib/errors';

it('Should generate a valid OptionsMismatchWarning class', () => {
    const message = 'Using a requires b to be enabled';
    const warning = new OptionsMismatchWarning(message);

    expect(warning.name).toEqual('OptionsMismatchWarning');
    expect(warning.message).toContain(message);
});

it('Should generate a valid VariablesNotSupportedInLanguageWarning class', () => {
    const language = 'scss';
    const warning = new VariablesNotSupportedInLanguageWarning(language);

    expect(warning.name).toEqual('VariablesNotSupportedInLanguageWarning');
    expect(warning.message).toContain(language.toUpperCase());
});

it('Should generate a valid VariablesNotSupportedWithFragmentsWarning class', () => {
    const warning = new VariablesNotSupportedWithFragmentsWarning();

    expect(warning.name).toEqual('VariablesNotSupportedWithFragmentsWarning');
    expect(warning.message).toContain('Variables');
    expect(warning.message).toContain('fragments');
});

it('Should generate a valid VariablesWithInvalidDefaultsWarning class', () => {
    const sprite = 'test';
    const name = 'name';
    const values = ['a', 'b'];
    const warning = new VariablesWithInvalidDefaultsWarning(sprite, name, values);

    expect(warning.name).toEqual('VariablesWithInvalidDefaultsWarning');
    expect(warning.message).toContain(`in sprite '${sprite}'`);
    expect(warning.message).toContain(`variable '${name}'`);
    expect(warning.message).toContain(`('${values.join('\', \'')}')`);
});
