# Contributing to Desktop Portal

Thank you for your interest in contributing to Desktop Portal! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/guancyxx/desktop_portal/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node version)

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Possible implementation approach

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone git@github.com:your-username/desktop_portal.git
   cd desktop_portal
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the coding standards
   - Add tests if applicable
   - Update documentation

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type unless absolutely necessary

### Code Style

- Follow ESLint rules
- Use Prettier for formatting
- Run `npm run lint:fix` before committing

### Component Structure

```typescript
// Component template
import React from 'react';
import { ComponentProps } from '@types';

interface Props {
  // Define props
}

export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // Component logic
  
  return (
    // JSX
  );
};
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
```bash
feat: add user profile page
fix: resolve token refresh issue
docs: update README with new configuration
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch
```

### Writing Tests

- Write tests for new features
- Maintain test coverage > 80%
- Test edge cases and error scenarios

Example:
```typescript
import { render, screen } from '@testing-library/react';
import { AppCard } from './AppCard';

describe('AppCard', () => {
  it('renders app name', () => {
    render(<AppCard name="Test App" />);
    expect(screen.getByText('Test App')).toBeInTheDocument();
  });
});
```

## 📚 Documentation

### When to Update Documentation

- Adding new features
- Changing existing behavior
- Updating configuration
- Adding dependencies

### Documentation Standards

- Use clear and concise language
- Include code examples
- Add screenshots for UI changes
- Update README.md, CHANGELOG.md as needed

## 🔍 Code Review Process

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass and coverage is maintained
- [ ] Documentation is updated
- [ ] No console.log or debug code
- [ ] Changes are backward compatible
- [ ] Performance impact is considered

### Review Timeline

- Reviews are typically completed within 2-3 days
- Address reviewer feedback promptly
- Maintain discussion in PR comments

## 🚀 Development Workflow

### Setup Development Environment

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm start
```

### Development Server

- Runs on http://localhost:3000
- Hot reload enabled
- Auto-opens browser

### Before Submitting PR

```bash
# Check types
npm run type-check

# Run linter
npm run lint

# Run tests
npm test

# Build project
npm run build
```

## 🌐 Internationalization (i18n)

### Adding Translations

When i18n is implemented:

1. Add keys to language files
2. Use translation hooks in components
3. Test with different locales

## ♿ Accessibility

- Follow WCAG 2.1 Level AA guidelines
- Test with screen readers
- Ensure keyboard navigation
- Provide alt text for images
- Use semantic HTML

## 🔒 Security

### Security Best Practices

- Never commit secrets or credentials
- Validate all user input
- Follow OWASP guidelines
- Report security issues privately

### Reporting Security Issues

Email security concerns to: [security contact]

## 📋 Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `question` - Further information requested

## 🎯 Priorities

1. Security fixes
2. Critical bugs
3. Documentation
4. New features
5. Enhancements

## 💬 Communication

- Use GitHub Issues for bug reports and features
- Use Pull Request comments for code discussion
- Be respectful and constructive
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Desktop Portal! 🎉

