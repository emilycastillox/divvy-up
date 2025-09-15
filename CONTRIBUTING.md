# Contributing to DivvyUp

Thank you for your interest in contributing to DivvyUp! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:
1. Check if the issue already exists
2. Use the issue templates
3. Provide detailed information about the problem
4. Include steps to reproduce the issue

### Suggesting Features

We welcome feature suggestions! Please:
1. Check if the feature has been requested before
2. Provide a clear description of the feature
3. Explain the use case and benefits
4. Consider implementation complexity

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run quality checks**
   ```bash
   npm run validate
   ```
5. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

## 📋 Development Guidelines

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Write meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing

- Write tests for new features
- Maintain or improve test coverage
- Test both happy path and edge cases
- Update tests when modifying existing code

### Git Workflow

- Use conventional commit messages
- Keep commits focused and atomic
- Write descriptive commit messages
- Squash commits when appropriate

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Update CHANGELOG.md** if applicable
4. **Ensure all checks pass**
5. **Request review** from maintainers
6. **Address feedback** promptly

## 🏗️ Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Docker Desktop
- Git

### Setup

```bash
# Clone your fork
git clone https://github.com/your-username/divvy-up.git
cd divvy-up

# Add upstream remote
git remote add upstream https://github.com/original-owner/divvy-up.git

# Install dependencies
npm run install:all

# Set up environment
cp .env.example .env
cp src/client/.env.example src/client/.env
cp src/server/.env.example src/server/.env

# Start development environment
npm run dev:full
```

### Development Workflow

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Make changes and test**
   ```bash
   npm run validate
   npm run test
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature
   ```

## 📝 Code Standards

### TypeScript

- Use strict type checking
- Define interfaces for all data structures
- Use proper typing for function parameters and return values
- Avoid `any` type unless absolutely necessary

### React Components

- Use functional components with hooks
- Implement proper prop types
- Use meaningful component names
- Keep components focused and reusable

### API Design

- Follow RESTful conventions
- Use proper HTTP status codes
- Implement proper error handling
- Document API endpoints

### Database

- Use proper migrations for schema changes
- Implement proper indexing
- Use transactions for complex operations
- Follow naming conventions

## 🧪 Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Test both success and error cases
- Aim for high test coverage

### Integration Tests

- Test API endpoints
- Test database operations
- Test service integrations
- Use test databases

### E2E Tests

- Test complete user workflows
- Test critical user paths
- Use realistic test data
- Test on different browsers

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain business logic
- Keep comments up to date

### README Updates

- Update setup instructions if needed
- Document new features
- Update API documentation
- Keep examples current

## 🐛 Bug Reports

### Before Reporting

1. Check if the bug has been reported
2. Try to reproduce the issue
3. Check the latest version
4. Gather relevant information

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

## ✨ Feature Requests

### Before Requesting

1. Check if the feature exists
2. Consider the scope and complexity
3. Think about implementation approach
4. Consider user impact

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions.

**Additional context**
Add any other context or screenshots about the feature request.
```

## 🏷️ Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Tagged and released

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Pull Request Comments**: Code review discussions

### Code Review Process

1. **Automated Checks**: All PRs must pass automated checks
2. **Manual Review**: At least one maintainer must approve
3. **Testing**: Changes must be tested
4. **Documentation**: Documentation must be updated

## 🎯 Areas for Contribution

### High Priority

- Bug fixes
- Performance improvements
- Security enhancements
- Documentation improvements

### Medium Priority

- New features
- UI/UX improvements
- Test coverage improvements
- Code refactoring

### Low Priority

- Experimental features
- Nice-to-have features
- Code style improvements
- Minor optimizations

## 📋 Contributor Checklist

Before submitting a contribution:

- [ ] Code follows project style guidelines
- [ ] Tests are added/updated and passing
- [ ] Documentation is updated
- [ ] Commit messages follow conventional format
- [ ] Pull request description is clear
- [ ] All automated checks pass
- [ ] Code is properly reviewed

## 🙏 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

## 📄 License

By contributing to DivvyUp, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to DivvyUp! 🎉
