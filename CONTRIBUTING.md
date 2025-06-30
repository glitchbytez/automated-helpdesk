# 🤝 Contributing to Campus Support Helpdesk System

Thank you for considering contributing to our project! We welcome contributions from everyone and are grateful for every contribution, no matter how small.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [How to Contribute](#-how-to-contribute)
- [Pull Request Process](#-pull-request-process)
- [Coding Standards](#-coding-standards)
- [Testing Guidelines](#-testing-guidelines)
- [Documentation](#-documentation)

## 🌟 Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/campus-support-helpdesk.git
   cd campus-support-helpdesk
   ```
3. **Set up the development environment** (see [Development Setup](#-development-setup))
4. **Create a branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.8+ (for Rasa development)
- Git

### Environment Setup

1. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Start development environment**:
   ```bash
   # Option 1: Full Docker environment
   docker compose up -d
   
   # Option 2: Hybrid (infrastructure in Docker, services local)
   docker compose up mongodb milvus etcd minio -d
   # Then run individual services locally
   ```

3. **Verify setup**:
   ```bash
   curl http://localhost:5500/api/health
   curl http://localhost:5502/api/health
   ```

## 🎯 How to Contribute

### Types of Contributions

- 🐛 **Bug Reports**: Help us identify and fix issues
- 💡 **Feature Requests**: Suggest new features or improvements
- 📝 **Documentation**: Improve our documentation
- 🧪 **Testing**: Add or improve tests
- 🔧 **Code**: Fix bugs or implement features

### Reporting Bugs

Before submitting a bug report:

1. **Check existing issues** to avoid duplicates
2. **Use the latest version** of the project
3. **Test in a clean environment** if possible

When submitting a bug report, include:

- **Clear title** and description
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (OS, Docker version, etc.)
- **Logs and error messages**
- **Screenshots** if applicable

### Suggesting Features

Feature requests are welcome! Please:

1. **Check existing issues** for similar suggestions
2. **Provide a clear use case** and rationale
3. **Consider the scope** and alignment with project goals
4. **Be open to discussion** and iteration

## 🔄 Pull Request Process

### Before Submitting

1. **Update your fork**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Test your changes**:
   ```bash
   # Run tests for affected services
   cd helpdesk-backend && npm test
   cd helpdesk-frontend && npm test
   
   # Test Docker builds
   docker compose build your-changed-service
   ```

3. **Update documentation** if needed

### Submitting the PR

1. **Push your changes**:
   ```bash
   git push origin your-feature-branch
   ```

2. **Create a Pull Request** on GitHub with:
   - **Clear title** describing the change
   - **Detailed description** of what was changed and why
   - **Reference to issues** if applicable
   - **Screenshots** for UI changes
   - **Testing notes** for reviewers

### PR Requirements

- ✅ **Builds successfully** in CI
- ✅ **Tests pass** (if applicable)
- ✅ **Documentation updated** (if needed)
- ✅ **Code follows style guidelines**
- ✅ **No merge conflicts**

## 📏 Coding Standards

### General Guidelines

- **Write clear, readable code** with meaningful names
- **Keep functions small** and focused on single responsibilities
- **Add comments** for complex logic
- **Follow existing patterns** and conventions
- **Consider performance** and scalability implications

### JavaScript/Node.js

- Use **ES6+** features appropriately
- Follow **ESLint** configuration (if present)
- Use **async/await** for asynchronous operations
- Handle errors appropriately
- Use **meaningful variable names**

### React/Next.js

- Use **functional components** with hooks
- Implement **proper error boundaries**
- Follow **React best practices**
- Use **TypeScript** when possible
- Ensure **accessibility** standards

### Python/Rasa

- Follow **PEP 8** style guidelines
- Use **type hints** where appropriate
- Write **docstrings** for functions and classes
- Follow **Rasa best practices** for training data

### Docker

- **Optimize image sizes** and build times
- Use **multi-stage builds** when appropriate
- **Minimize layers** and clean up after operations
- Include **health checks** for services

## 🧪 Testing Guidelines

### Test Types

1. **Unit Tests**: Individual component/function testing
2. **Integration Tests**: Service interaction testing
3. **E2E Tests**: Full user workflow testing
4. **API Tests**: REST endpoint testing

### Running Tests

```bash
# Backend unit tests
cd helpdesk-backend && npm test

# Frontend tests
cd helpdesk-frontend && npm test

# Integration tests
docker compose -f docker-compose.test.yml up --abort-on-container-exit

# Manual testing
docker compose up -d
# Test workflows manually
```

### Writing Tests

- **Test the happy path** and edge cases
- **Use descriptive test names**
- **Keep tests isolated** and independent
- **Mock external dependencies** appropriately
- **Aim for good coverage** without over-testing

## 📚 Documentation

### Types of Documentation

- **README**: Project overview and quick start
- **API Documentation**: Endpoint specifications
- **User Guides**: How-to instructions for end users
- **Technical Documentation**: Architecture and implementation details
- **Inline Comments**: Code explanation and rationale

### Documentation Standards

- **Keep it current** with code changes
- **Use clear, simple language**
- **Include examples** and code snippets
- **Test documentation** by following it yourself
- **Structure logically** with good navigation

### Where to Document

- **README.md**: Main project documentation
- **docs/**: Detailed documentation files
- **Code comments**: Complex logic explanation
- **JSDoc/docstrings**: Function and API documentation

## 🏷️ Commit Messages

Use clear, descriptive commit messages:

```
type(scope): short description

Longer description if needed

Fixes #issue-number
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
```
feat(auth): add JWT refresh token support
fix(tickets): resolve status update race condition
docs(api): update authentication endpoint documentation
```

## 🔍 Code Review

All contributions go through code review. Reviewers will check:

- **Functionality**: Does it work as intended?
- **Code Quality**: Is it well-written and maintainable?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security concerns?
- **Testing**: Is it adequately tested?
- **Documentation**: Is documentation updated?

## 🆘 Getting Help

If you need help:

1. **Check the documentation** first
2. **Search existing issues** for similar questions
3. **Join our discussions** for community support
4. **Create an issue** with the `question` label

## 🎉 Recognition

Contributors will be:

- **Listed in the README** (if desired)
- **Credited in release notes** for significant contributions
- **Invited to become maintainers** for ongoing contributors

## 📞 Contact

For questions about contributing:

- **Create an issue** with the `question` label
- **Start a discussion** in the repository
- **Join our community** channels (if available)

---

Thank you for contributing to the Campus Support Helpdesk System! 🙏 