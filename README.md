# Wigvana

# Introduction

Wigvana is a fullstack e-commerce web application that connects sellers and buyers of
hair extensions.

# Tools used

1. turbo monorepo management.
2. pnpm for fast and efficient package management.

# How to run

To run the front-end dev mode:

```bash

pnpm --filter=wigvana-react run dev

```

## Notes

- Used `openssl rand -hex 48` to generate secrets for jwt generation.
- Used `joi` to validate incoming environmental variables.
- Used `morgan` to log incoming http requests.
- Used `pino` for high performance multi transport logging.