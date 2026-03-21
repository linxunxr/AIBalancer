use regex::Regex;
use serde_json::Value;
use std::collections::HashSet;
use std::sync::LazyLock;

/// Sensitive field patterns that should be redacted
static SENSITIVE_FIELD_NAMES: LazyLock<HashSet<&'static str>> = LazyLock::new(|| {
    let mut set = HashSet::new();
    // Password related
    set.insert("password");
    set.insert("passwd");
    set.insert("pwd");
    set.insert("pass");
    // Token related
    set.insert("token");
    set.insert("access_token");
    set.insert("refresh_token");
    set.insert("auth_token");
    set.insert("bearer_token");
    // API keys
    set.insert("api_key");
    set.insert("apikey");
    set.insert("api_secret");
    set.insert("secret");
    set.insert("secret_key");
    // Credentials
    set.insert("credential");
    set.insert("credentials");
    set.insert("private_key");
    set.insert("privatekey");
    // Auth related
    set.insert("authorization");
    set.insert("auth");
    // Session
    set.insert("session_id");
    set.insert("sessionid");
    set.insert("cookie");
    set
});

/// Regex patterns for sensitive data in strings
static SENSITIVE_PATTERNS: LazyLock<Vec<(Regex, &'static str)>> = LazyLock::new(|| {
    vec![
        // Password patterns
        (Regex::new(r"(?i)(password|passwd|pwd)\s*[=:]\s*\S+").unwrap(), "$1=***"),
        // Token patterns
        (Regex::new(r"(?i)(token|access_token|refresh_token|auth_token)\s*[=:]\s*\S+").unwrap(), "$1=***"),
        // API key patterns
        (Regex::new(r"(?i)(api_key|apikey|api_secret|secret_key)\s*[=:]\s*\S+").unwrap(), "$1=***"),
        // Bearer token in Authorization header
        (Regex::new(r"(?i)Bearer\s+[A-Za-z0-9\-._~+/]+=*").unwrap(), "Bearer ***"),
        // JWT tokens
        (Regex::new(r"eyJ[A-Za-z0-9\-._~+/]+=*\.eyJ[A-Za-z0-9\-._~+/]+=*\.[A-Za-z0-9\-._~+/]+=*").unwrap(), "***JWT***"),
        // UUID-like tokens (when they appear after token/secret keywords)
        (Regex::new(r"(?i)(secret|token|key)[_-]?(id)?:\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}").unwrap(), "$1: ***"),
        // Email addresses (optional, can be enabled)
        // (Regex::new(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}").unwrap(), "***@***"),
    ]
});

/// Sensitive information filter
pub struct SensitiveFilter {
    /// Replacement string for redacted values
    replacement: String,
    /// Whether to filter JSON objects
    filter_json: bool,
    /// Whether to filter string content
    filter_strings: bool,
}

impl Default for SensitiveFilter {
    fn default() -> Self {
        Self {
            replacement: "***".to_string(),
            filter_json: true,
            filter_strings: true,
        }
    }
}

impl SensitiveFilter {
    /// Create a new sensitive filter with default settings
    pub fn new() -> Self {
        Self::default()
    }

    /// Create a builder for custom configuration
    pub fn builder() -> SensitiveFilterBuilder {
        SensitiveFilterBuilder::default()
    }

    /// Filter sensitive information from a string
    pub fn filter_string(&self, input: &str) -> String {
        if !self.filter_strings {
            return input.to_string();
        }

        let mut result = input.to_string();
        for (pattern, replacement) in SENSITIVE_PATTERNS.iter() {
            result = pattern.replace_all(&result, *replacement).to_string();
        }
        result
    }

    /// Filter sensitive information from a JSON value
    pub fn filter_json(&self, value: &Value) -> Value {
        if !self.filter_json {
            return value.clone();
        }

        match value {
            Value::Object(map) => {
                let filtered: serde_json::Map<String, Value> = map
                    .iter()
                    .map(|(k, v)| {
                        if self.is_sensitive_field(k) {
                            (k.clone(), Value::String(self.replacement.clone()))
                        } else {
                            (k.clone(), self.filter_json(v))
                        }
                    })
                    .collect();
                Value::Object(filtered)
            }
            Value::Array(arr) => {
                Value::Array(arr.iter().map(|v| self.filter_json(v)).collect())
            }
            Value::String(s) => {
                Value::String(self.filter_string(s))
            }
            _ => value.clone(),
        }
    }

    /// Check if a field name is sensitive
    pub fn is_sensitive_field(&self, field_name: &str) -> bool {
        let normalized = field_name.to_lowercase().replace('_', "").replace('-', "");
        SENSITIVE_FIELD_NAMES.iter().any(|&name| {
            let normalized_name = name.replace('_', "");
            normalized == normalized_name || normalized.contains(&normalized_name)
        })
    }

    /// Filter a map/dictionary
    pub fn filter_map(&self, map: &std::collections::HashMap<String, String>) -> std::collections::HashMap<String, String> {
        map.iter()
            .map(|(k, v)| {
                if self.is_sensitive_field(k) {
                    (k.clone(), self.replacement.clone())
                } else {
                    (k.clone(), self.filter_string(v))
                }
            })
            .collect()
    }
}

/// Builder for SensitiveFilter
#[derive(Default)]
pub struct SensitiveFilterBuilder {
    replacement: Option<String>,
    filter_json: Option<bool>,
    filter_strings: Option<bool>,
}

impl SensitiveFilterBuilder {
    pub fn replacement(mut self, replacement: impl Into<String>) -> Self {
        self.replacement = Some(replacement.into());
        self
    }

    pub fn filter_json(mut self, enabled: bool) -> Self {
        self.filter_json = Some(enabled);
        self
    }

    pub fn filter_strings(mut self, enabled: bool) -> Self {
        self.filter_strings = Some(enabled);
        self
    }

    pub fn build(self) -> SensitiveFilter {
        SensitiveFilter {
            replacement: self.replacement.unwrap_or_else(|| "***".to_string()),
            filter_json: self.filter_json.unwrap_or(true),
            filter_strings: self.filter_strings.unwrap_or(true),
        }
    }
}

/// Global sensitive filter instance
pub static SENSITIVE_FILTER: LazyLock<SensitiveFilter> = LazyLock::new(SensitiveFilter::new);

/// Convenience function to filter a string
pub fn filter_sensitive_string(input: &str) -> String {
    SENSITIVE_FILTER.filter_string(input)
}

/// Convenience function to filter a JSON value
pub fn filter_sensitive_json(value: &Value) -> Value {
    SENSITIVE_FILTER.filter_json(value)
}

/// Convenience function to check if a field is sensitive
pub fn is_sensitive_field(field_name: &str) -> bool {
    SENSITIVE_FILTER.is_sensitive_field(field_name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_filter_password() {
        let filter = SensitiveFilter::new();
        let input = "password=secret123";
        let result = filter.filter_string(input);
        assert_eq!(result, "password=***");
    }

    #[test]
    fn test_filter_api_key() {
        let filter = SensitiveFilter::new();
        let input = r#"{"api_key": "sk-1234567890", "name": "test"}"#;
        let json: Value = serde_json::from_str(input).unwrap();
        let filtered = filter.filter_json(&json);
        assert_eq!(filtered["api_key"], "***");
        assert_eq!(filtered["name"], "test");
    }

    #[test]
    fn test_filter_bearer_token() {
        let filter = SensitiveFilter::new();
        let input = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
        let result = filter.filter_string(input);
        assert!(result.contains("Bearer ***"));
    }

    #[test]
    fn test_is_sensitive_field() {
        let filter = SensitiveFilter::new();
        assert!(filter.is_sensitive_field("password"));
        assert!(filter.is_sensitive_field("API_KEY"));
        assert!(filter.is_sensitive_field("api-secret"));
        assert!(!filter.is_sensitive_field("username"));
        assert!(!filter.is_sensitive_field("email"));
    }

    #[test]
    fn test_nested_json() {
        let filter = SensitiveFilter::new();
        let json = json!({
            "user": {
                "name": "test",
                "password": "secret123",
                "credentials": {
                    "token": "abc123"
                }
            }
        });
        let filtered = filter.filter_json(&json);
        assert_eq!(filtered["user"]["name"], "test");
        assert_eq!(filtered["user"]["password"], "***");
        assert_eq!(filtered["user"]["credentials"]["token"], "***");
    }
}
