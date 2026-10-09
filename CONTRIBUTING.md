# Contributing

Thank you for your interest. This is an **unsupported** commercetools-labs project (see [SUPPORT.md](./SUPPORT.md)):
issues and pull requests are welcome, but there is **no promise that they will be read, reviewed or merged**.

## Ground rules

- By contributing you agree that your contribution is licensed under the [MIT licence](./LICENSE).
- Do not include secrets, customer data, real project keys or personal data in code, tests, issues or screenshots.
- Do not add GitHub Actions workflows. This project is built and hosted with commercetools Connect.
- Every new source file needs the SPDX header used in the other files
  (`SPDX-License-Identifier: MIT`, copyright line, "Freely available, AS IS and UNSUPPORTED. See LICENSE.").

## Develop locally

~~~shell
cd visualizer
npm ci
npm start            # needs a Merchant Center custom application registered for http://localhost:3001 (see README)
npm run typecheck && npm run lint && npm test && npm run build
~~~

## Pull requests

1. Fork, create a branch, keep the change small and focused.
2. Run the four commands above; they must pass.
3. Describe what and why. Add or update tests for changed behaviour.
