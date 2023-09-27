#[derive(Debug, Clone, serde::Serialize)]
pub struct Image {
    pub path: String,
    pub dpi: u32,
    pub width: u32,
    pub height: u32,
}
