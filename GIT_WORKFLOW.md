# Git Workflow Guide

This document outlines the Git workflow and best practices for the DivvyUp project.

## Branching Strategy

### Main Branches
- **`main`**: Production-ready code, always deployable
- **`develop`**: Integration branch for features, staging environment

### Feature Branches
- **`feature/description`**: New features and enhancements
- **`bugfix/description`**: Bug fixes
- **`hotfix/description`**: Critical production fixes
- **`chore/description`**: Maintenance tasks, dependencies, tooling

### Branch Naming Convention
```
feature/user-authentication
bugfix/fix-login-validation
hotfix/critical-security-patch
chore/update-dependencies
docs/update-readme
test/add-unit-tests
```

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
type(scope): description

[optional body]

[optional footer(s)]
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **perf**: A code change that improves performance
- **revert**: Reverts a previous commit

### Examples
```bash
feat: add user authentication system
fix(api): resolve database connection timeout
docs: update API documentation
style: format code with prettier
refactor: extract user validation logic
test: add unit tests for auth service
chore: update dependencies
build: configure webpack for production
ci: add automated testing workflow
perf: optimize database queries
revert: revert "feat: add new feature"
```

## Pre-commit Hooks

The project includes pre-commit hooks that automatically run:

1. **TypeScript type checking**
2. **ESLint code quality checks**
3. **Prettier format validation**
4. **Test suite execution**
5. **Console.log detection**
6. **TODO/FIXME comment detection**
7. **Large file size warnings**

### Bypassing Hooks (Use with caution)
```bash
# Skip pre-commit hooks
git commit --no-verify -m "fix: emergency hotfix"

# Skip specific checks
SKIP_TESTS=1 git commit -m "docs: update README"
```

## Development Workflow

### 1. Starting a New Feature
```bash
# Switch to develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/user-authentication

# Make changes and commit
git add .
git commit -m "feat: add user login form"

# Push branch
git push origin feature/user-authentication
```

### 2. Code Review Process
1. Create Pull Request from feature branch to develop
2. Request review from team members
3. Address feedback and push updates
4. Merge after approval

### 3. Merging to Main
```bash
# Switch to develop
git checkout develop
git pull origin develop

# Merge to main
git checkout main
git pull origin main
git merge develop
git push origin main

# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## File Organization

### .gitignore
Comprehensive ignore rules for:
- Dependencies (`node_modules/`)
- Build outputs (`dist/`, `build/`)
- Environment files (`.env*`)
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Logs and temporary files
- Database files
- Certificate files

### .gitattributes
Consistent line ending handling:
- Text files: Auto-detect line endings
- Binary files: No conversion
- Specific file types: Explicit line ending rules

## Best Practices

### 1. Commit Frequency
- Commit early and often
- Each commit should represent a logical unit of work
- Use meaningful commit messages

### 2. Branch Management
- Keep branches up to date with main/develop
- Delete merged branches
- Use descriptive branch names

### 3. Code Quality
- All code must pass pre-commit hooks
- Write tests for new features
- Follow coding standards (ESLint, Prettier)

### 4. Security
- Never commit secrets or credentials
- Use environment variables for configuration
- Review sensitive changes carefully

### 5. Documentation
- Update README for significant changes
- Document API changes
- Keep commit messages descriptive

## Troubleshooting

### Pre-commit Hook Failures
```bash
# Run checks manually
npm run type-check
npm run lint
npm run format:check
npm run test

# Fix formatting
npm run format

# Fix linting
npm run lint:fix
```

### Merge Conflicts
```bash
# Resolve conflicts
git status
# Edit conflicted files
git add .
git commit -m "fix: resolve merge conflicts"
```

### Undoing Changes
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo changes to specific file
git checkout -- filename

# Undo all uncommitted changes
git reset --hard HEAD
```

### Branch Cleanup
```bash
# Delete local branch
git branch -d feature/branch-name

# Delete remote branch
git push origin --delete feature/branch-name

# List all branches
git branch -a

# Clean up merged branches
git branch --merged | grep -v main | xargs -n 1 git branch -d
```

## Git Configuration

### Recommended Global Settings
```bash
# Set up user information
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up default branch name
git config --global init.defaultBranch main

# Set up line ending handling
git config --global core.autocrlf input  # Mac/Linux
git config --global core.autocrlf true   # Windows

# Set up push behavior
git config --global push.default simple

# Set up pull behavior
git config --global pull.rebase false

# Set up editor
git config --global core.editor "code --wait"
```

### Project-Specific Settings
```bash
# Set up project-specific settings
git config user.name "DivvyUp Developer"
git config user.email "dev@divvyup.com"
```

## Release Process

### 1. Version Bumping
```bash
# Update version in package.json
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### 2. Release Notes
- Document breaking changes
- List new features
- Note bug fixes
- Include migration instructions

### 3. Deployment
- Tag releases
- Deploy to staging first
- Deploy to production after testing
- Monitor for issues

## Integration with CI/CD

The Git workflow integrates with:
- **GitHub Actions**: Automated testing and deployment
- **Docker**: Container builds on commits
- **Code Quality**: Automated linting and testing
- **Security**: Dependency vulnerability scanning

## Team Collaboration

### Code Review Guidelines
1. **Review Checklist**:
   - Code follows project standards
   - Tests are included and passing
   - Documentation is updated
   - No security vulnerabilities
   - Performance considerations

2. **Review Process**:
   - Assign reviewers
   - Request specific feedback
   - Address all comments
   - Approve when ready

3. **Communication**:
   - Use clear, constructive feedback
   - Explain the "why" behind suggestions
   - Be respectful and professional
   - Ask questions when unclear

This workflow ensures code quality, team collaboration, and smooth deployments while maintaining a clean Git history.
