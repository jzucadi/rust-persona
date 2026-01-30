use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct JobEntry {
    /// Unique identifier for ordering entries in the JSON database.
    /// Currently used for deserialization ordering; may be used for sorting/filtering in the future.
    #[allow(dead_code)]
    pub key: u32,
    pub name: String,
    pub details: String,
    pub tools: String,
    pub screen: String,
    pub link: String,
}

#[derive(Debug, Deserialize)]
pub struct JobData {
    pub entries: Vec<JobEntry>,
}
