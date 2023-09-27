// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod menu;
mod image;
mod api;

fn main() {
    let context = tauri::generate_context!();
    tauri::Builder::default()
        .menu(menu::init(&context))
        .on_menu_event(menu::handler)
        .run(context)
        .expect("error while running tauri application");
}
