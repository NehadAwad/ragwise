# Contributing to ragwise

Thank you for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/NehadAwad/ragwise.git
cd ragwise
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run tests |
| `npm run typecheck` | Type-check without emitting |
| `npm run build` | Build with tsup |
| `npm run pack:dry` | Preview npm package contents |

## Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `npm test` and `npm run typecheck`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Code Style

- TypeScript strict mode
- 2-space indentation
- No trailing whitespace
- LF line endings

## Reporting Issues

Please use [GitHub Issues](https://github.com/NehadAwad/ragwise/issues) to report bugs or request features. Include:

- Node.js version
- ragwise version
- Minimal reproduction steps
- Expected vs actual behavior
