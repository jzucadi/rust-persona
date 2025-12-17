mod models;

use anyhow::{Context, Result};
use askama::Template;
use axum::{
    extract::State,
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use models::{JobData, JobEntry};
use std::{env, fs, sync::Arc};
use tower_http::services::ServeDir;

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate<'a> {
    jobs: &'a [JobEntry],
    year: i32,
}

struct AppState {
    jobs: Vec<JobEntry>,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let job_data = load_jobs().context("Failed to load job data from db.json")?;

    let state = Arc::new(AppState {
        jobs: job_data.entries,
    });

    let app = Router::new()
        .route("/", get(index_handler))
        .nest_service("/static", ServeDir::new("static"))
        .with_state(state);

    let addr = env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:3000".to_string());
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .with_context(|| format!("Failed to bind to {}", addr))?;

    tracing::info!("Server listening on http://{}", addr);

    axum::serve(listener, app)
        .await
        .context("Server error")?;

    Ok(())
}

async fn index_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let current_year = chrono::Datelike::year(&chrono::Local::now());

    let template = IndexTemplate {
        jobs: &state.jobs,
        year: current_year,
    };

    match template.render() {
        Ok(html) => Html(html).into_response(),
        Err(err) => {
            tracing::error!("Template rendering error: {}", err);
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Internal Server Error",
            )
                .into_response()
        }
    }
}

fn load_jobs() -> Result<JobData> {
    let data = fs::read_to_string("db.json").context("Could not read db.json")?;
    let job_data: JobData = serde_json::from_str(&data).context("Invalid JSON in db.json")?;
    Ok(job_data)
}
