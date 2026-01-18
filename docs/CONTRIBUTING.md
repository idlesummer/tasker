# Contributing

Hey! Thanks for wanting to contribute. This doc will help you get set up and explain how we do things around here.

## Important Note

This is a learning project! I'm figuring stuff out as I go, so:
- Don't stress about "perfect" code - we're all learning
- Ask questions if anything is confusing
- Expect bugs and rough edges
- Your contribution helps everyone learn, including me!

The goal is to learn and build something useful, not to create the perfect library. So jump in and have fun with it!

## Getting Started

### Prerequisites

You'll need:
- Node.js 18 or higher
- npm (comes with Node)
- Git

That's it!

### Setting Up

1. **Fork and clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tasker.git
   cd tasker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

If everything passes, you're good to go!

## Project Structure

Here's what's where:

```
tasker/
├── src/
│   ├── index.ts              # Main exports
│   ├── pipeline.ts           # Pipeline implementation
│   ├── format.ts             # Formatters
│   └── __tests__/            # Test files
├── docs/                     # Documentation
├── examples/                 # Example projects
├── dist/                     # Built files (don't edit these)
└── package.json
```

## Development Workflow

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b fix/something-broken
   # or
   git checkout -b feature/cool-new-thing
   ```

2. **Make your changes**

   Edit the files in `src/`. Don't edit files in `dist/` - those are auto-generated.

3. **Write tests**

   If you're adding a feature or fixing a bug, add tests in `src/__tests__/`.

   ```typescript
   it('should do the thing', () => {
     // Your test here
   })
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Lint your code**
   ```bash
   npm run lint
   ```

6. **Build to make sure nothing broke**
   ```bash
   npm run build
   ```

### Testing

We use Vitest for testing. Some useful commands:

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode (reruns on changes)
npm run test:ui       # Open the UI (pretty cool!)
npm run test:coverage # Check coverage
```

#### Writing Tests

Tests go in `src/__tests__/`. We try to test:
- Happy paths (things working correctly)
- Error cases (things breaking gracefully)
- Edge cases (empty inputs, weird values, etc.)

Example test structure:
```typescript
describe('featureName', () => {
  it('should do basic thing', () => {
    // Test code
  })

  it('should handle errors', () => {
    // Test error handling
  })

  it('should handle edge case', () => {
    // Test edge case
  })
})
```

### Code Style

We use ESLint to keep code consistent. Just run:

```bash
npm run lint
```

Some guidelines:
- Use TypeScript - no plain JS
- Prefer `const` over `let`
- Use async/await over promises
- Write descriptive variable names
- Add comments for tricky bits

## Commit Messages

Keep them clear and descriptive:

✅ Good:
```
Fix cross-platform glob pattern matching
Add duration tracking to pipeline
Update README with new examples
```

❌ Not so good:
```
fix stuff
updates
asdfjkl
```

We don't have a strict format, just make it understandable.

## Pull Requests

### Before Submitting

Make sure:
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build works (`npm run build`)
- [ ] You've tested your changes manually
- [ ] You've added tests for new features

### Creating the PR

1. **Push your branch**
   ```bash
   git push origin your-branch-name
   ```

2. **Open a PR on GitHub**

   Go to the repo and click "New Pull Request"

3. **Describe what you did**

   Write a clear description:
   - What problem does this solve?
   - How did you fix it?
   - Any breaking changes?
   - Screenshots if relevant

4. **Wait for review**

   Someone will review your code. Don't take feedback personally - we're all learning!

### Review Process

- We'll try to review within a few days
- We might ask for changes - totally normal
- Once approved, we'll merge it
- Your code will be in the next release!

## Adding Features

Thinking of adding a new feature? Cool! But first:

1. **Open an issue** to discuss it

   We can talk about:
   - Is this a good fit for the library?
   - How should it work?
   - Any potential issues?

2. **Wait for feedback**

   Don't spend a week coding something that might not fit the project goals

3. **Then build it!**

   Once we agree it's a good idea, go for it

## Reporting Bugs

Found a bug? Here's how to report it:

1. **Check if it's already reported**

   Search existing issues first

2. **Create a new issue**

   Include:
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
   - Your Node version (`node --version`)
   - Your OS (Windows, Mac, Linux)

3. **Minimal reproduction**

   A small code sample that shows the bug is super helpful:

   ```typescript
   import { pipe } from '@idlesummer/tasker'

   // This should work but doesn't
   const pipeline = pipe([
     // ...
   ])
   ```

## Documentation

Docs are in the `docs/` folder. They're written in Markdown.

If you're adding a feature, please update the docs:
- `API.md` - API reference
- `EXAMPLES.md` - Usage examples
- `README.md` - If needed

Write like you're explaining to a friend, not like you're writing a formal paper.

## Examples

The `examples/` folder has working example projects. If you're adding a feature, consider adding an example showing how to use it.

Each example is its own npm package that imports from the main package.

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update CHANGELOG (if we have one)
3. Commit: `git commit -m "Release vX.Y.Z"`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push && git push --tags`
6. Publish: `npm publish`

## Questions?

If you're stuck or confused about anything:
- Open an issue
- Ask in the PR
- Check existing issues/PRs

We're friendly, I promise!

## License

By contributing, you agree that your code will be licensed under MIT (same as the project).

---

Thanks for contributing! Even small fixes help make this better for everyone. 🎉
