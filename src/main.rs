mod models;

use askama::Template;
use axum::{
    extract::State,
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use models::{JobData, JobEntry};
use std::{fs, sync::Arc};
use tower_http::services::ServeDir;
use tracing_subscriber;

// Template for the home page
#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {
    jobs: Vec<JobEntry>,
    year: i32,
}

// Application state to hold job data
#[derive(Clone)]
struct AppState {
    jobs: Vec<JobEntry>,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load job data from db.json
    let job_data = load_jobs().expect("Failed to load job data");

    // Create application state
    let state = Arc::new(AppState {
        jobs: job_data.entries,
    });

    // Build the router
    let app = Router::new()
        .route("/", get(index_handler))
        .nest_service("/static", ServeDir::new("static"))
        .with_state(state);

    // Start the server
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();

    tracing::info!("Server listening on http://127.0.0.1:3000");

    axum::serve(listener, app).await.unwrap();
}

// Handler for the home page
async fn index_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let current_year = chrono::Datelike::year(&chrono::Local::now());

    let template = IndexTemplate {
        jobs: state.jobs.clone(),
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

// Load job data from db.json
fn load_jobs() -> Result<JobData, Box<dyn std::error::Error>> {
    let data = fs::read_to_string("db.json")?;
    let job_data: JobData = serde_json::from_str(&data)?;
    Ok(job_data)
}
