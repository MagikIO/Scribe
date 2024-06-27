const tseslint = require('typescript-eslint');
const { LintGolem } = require('@magik_io/lint_golem');

const Golem = new LintGolem({
  rootDir: __dirname,
  tsconfigPaths: ['tsconfig.json'],
  ignoreGlobs: [
    'node_modules/**', '*.lock', 'node_modules', '*.d.ts'
  ],
  disableTypeCheckOn: ['node_modules/**', '*.d.ts'],
  disabledRules: ['no-shadow'],
  ecmaVersion: 2022,
});

console.info({ Golem });

module.exports = tseslint.config(
  ...Golem.config
)
