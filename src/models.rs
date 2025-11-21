use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JobEntry {
    pub key: u32,
    pub name: String,
    pub details: String,
    pub tools: String,
    pub screen: String,
    pub link: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobData {
    pub entries: Vec<JobEntry>,
}
