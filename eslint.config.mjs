import typescriptParser from '@typescript-eslint/parser';

export default [
	{
		files: ['src/**/*.ts', 'test/**/*.ts'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
		rules: {},
	},
];
