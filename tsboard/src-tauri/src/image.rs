use image::io::Reader as ImageReader;
use std::fs::File;
use std::io::{BufReader, Seek, SeekFrom};

use crate::api::Image;
use exif::{In, Reader, Tag, Value};

// returns (width, height)
fn dimensions(file: &mut File) -> (u32, u32) {
    let reader = ImageReader::new(BufReader::new(file)).with_guessed_format().unwrap();
    let dimensions = reader.into_dimensions().unwrap();
    (dimensions.0, dimensions.1)
}

fn dpi(file: &mut File) -> u32 {
    let default = 72;
    match Reader::new().read_from_container(&mut BufReader::new(file)) {
        Ok(exif) => match exif.get_field(Tag::XResolution, In::PRIMARY) {
            Some(field) => match &field.value {
                Value::Rational(v) => {
                    if !v.is_empty() {
                        return v[0].to_f32() as u32;
                    }
                    default
                }
                _ => default,
            },
            None => default,
        },
        Err(_) => default,
    }
}

pub fn info(path: &str) -> Option<Image> {
    match File::open(path) {
        Ok(mut file) => {
            let (width, height) = dimensions(&mut file);
            file.seek(SeekFrom::Start(0)).unwrap(); // Reset the file's position
            let dpi_val = dpi(&mut file);
            Some(Image {
                path: path.to_string(),
                dpi: dpi_val,
                width,
                height,
            })
        }
        Err(_) => None,
    }
}
