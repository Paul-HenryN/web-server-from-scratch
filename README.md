# Web Server From Scratch

This project is a minimal HTTP/1.1 web server built from scratch using Node.js. It is designed as an educational tool to help understand the inner workings of HTTP servers without relying on frameworks like Express.

## Features

- Handles basic HTTP requests and responses
- Custom parsing of HTTP headers and request lines
- Modular structure for headers and request handling
- Includes test files for core modules

## Project Structure

```
index.js                # Main entry point
cmd/tcp-server.js       # TCP server implementation
internal/headers/       # HTTP headers logic and tests
internal/request/       # HTTP request logic and tests
tmp/                    # Temporary files for request data
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- pnpm (or npm/yarn)

### Installation

```
pnpm install
```

### Running the Server

```
pnpm start
```

Or directly:

```
node index.js
```

### Running Tests

You can run tests using:

```
pnpm test
```

## Learning Goals

- Understand TCP and HTTP protocol basics
- Learn how to parse and handle HTTP requests manually
- Explore modular code organization in Node.js

## License

MIT
