# Rust Portfolio

A portfolio website built with Rust, Axum, and Askama, recreated from the original Nuxt v2 version.

## Features

- **Rust-powered**: Fast, type-safe backend using Rust
- **Axum web framework**: Modern, ergonomic web framework built on Tokio
- **Askama templates**: Type-safe template rendering
- **Static file serving**: Serves CSS, images, and other assets
- **Dynamic job entries**: Loads portfolio entries from `db.json`
- **Health endpoint**: JSON health check at `/health`
- **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- **Configurable**: Bind address and log level via environment variables
- **Async I/O**: Non-blocking file operations using Tokio

## Project Structure

```
rust-persona/
├── .github/
│   └── workflows/
│       └── rust.yml        # CI workflow (fmt, clippy, build, test)
├── src/
│   ├── main.rs             # Application entry point and handlers
│   └── models.rs           # Data models for job entries
├── templates/
│   ├── base.html           # Base layout template
│   ├── index.html          # Home page template
│   └── partials/
│       └── job.html        # Job entry partial template
├── static/
│   ├── css/                # Stylesheets
│   └── images/             # Static images and SVGs
├── db.json                 # Job entries database
├── Cargo.toml              # Rust dependencies
└── README.md
```

## Prerequisites

- Rust 1.70 or later
- Cargo (comes with Rust)

## Installation

1. Clone the repository

2. Build the project:
   ```bash
   cargo build
   ```

## Running the Application

1. Start the server:
   ```bash
   cargo run
   ```

2. Open your browser and navigate to:
   ```
   http://127.0.0.1:3000
   ```

## Configuration

The application supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `BIND_ADDR` | Address and port to bind the server | `127.0.0.1:3000` |
| `RUST_LOG` | Log level (trace, debug, info, warn, error) | `info` |

Example:
```bash
BIND_ADDR=0.0.0.0:8080 RUST_LOG=debug cargo run
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Portfolio home page (HTML) |
| `/health` | GET | Health check (JSON: `{"status": "healthy"}`) |
| `/static/*` | GET | Static assets (CSS, images) |

## Development

To run in development mode with auto-reloading:

```bash
cargo install cargo-watch
cargo watch -x run
```

## Testing

Run the test suite:

```bash
cargo test
```

The project includes 14 tests covering:
- JSON parsing (valid, invalid, empty, missing fields)
- Template rendering
- HTTP handlers (status codes, response content)
- Security headers

## Code Quality

```bash
cargo fmt --check    # Check formatting
cargo clippy         # Lint checks
cargo test           # Run tests
```

## Modifying Job Entries

Edit the `db.json` file to add, remove, or modify portfolio entries:

```json
{
  "entries": [
    {
      "key": 1,
      "name": "Project Name",
      "details": "Project description",
      "tools": "Technologies used",
      "screen": "/static/images/screenshot.png",
      "link": "https://project-url.com/"
    }
  ]
}
```

Restart the server after making changes.

## Technologies Used

- **Rust**: Systems programming language
- **Axum**: Web framework
- **Askama**: Type-safe template engine
- **Tokio**: Async runtime
- **Tower-HTTP**: HTTP middleware (static files, security headers)
- **Serde**: Serialization/deserialization
- **Chrono**: Date and time library
- **Tracing**: Structured logging
- **Anyhow**: Error handling
