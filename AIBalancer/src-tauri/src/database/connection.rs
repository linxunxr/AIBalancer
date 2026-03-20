use rusqlite::{Connection, Result};
use std::path::PathBuf;

#[derive(Clone)]
pub struct Database {
    path: PathBuf,
}

impl Database {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    pub fn connect(&self) -> Result<Connection> {
        Connection::open(&self.path)
            .map_err(|e| e.into())
    }

    pub fn path(&self) -> &PathBuf {
        &self.path
    }
}
