use tauri::api::dialog::FileDialogBuilder;
use tauri::utils::assets::EmbeddedAssets;
use tauri::{AboutMetadata, Context, CustomMenuItem, Menu, MenuItem, Submenu, WindowMenuEvent};

use crate::image;

pub fn init(context: &Context<EmbeddedAssets>) -> Menu {
    let app_name = &context.package_info().name;
    let mut menu = Menu::new();

    #[cfg(target_os = "macos")]
    {
        menu = menu.add_submenu(Submenu::new(
            app_name,
            Menu::new()
                .add_native_item(MenuItem::About(
                    app_name.to_string(),
                    AboutMetadata::default(),
                ))
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Services)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Hide)
                .add_native_item(MenuItem::HideOthers)
                .add_native_item(MenuItem::ShowAll)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Quit),
        ));
    }

    menu = menu.add_submenu(Submenu::new(
        "File",
        Menu::new()
            .add_item(CustomMenuItem::new("open_file", "Open...").accelerator("cmdOrControl+O"))
            .add_item(CustomMenuItem::new("open_folder", "Open Folder..."))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("save", "Save").accelerator("cmdOrControl+S"))
            .add_item(CustomMenuItem::new("save_file", "Save As...")),
    ));

    menu = menu.add_submenu(Submenu::new(
        "Window",
        Menu::with_items([
            MenuItem::Minimize.into(),
            #[cfg(target_os = "macos")]
            MenuItem::Zoom.into(),
        ]),
    ));

    menu = menu.add_submenu(Submenu::new(
        "Help",
        Menu::new().add_native_item(MenuItem::About(
            app_name.to_string(),
            AboutMetadata::default(),
        )),
    ));

    menu
}

pub fn handler(event: WindowMenuEvent) {
    let window = event.window().clone();
    match event.menu_item_id() {
        "open_file" => {
            FileDialogBuilder::new()
                .set_title("Open File")
                .add_filter("images", &["png", "jpg", "jpeg", "webp"])
                .pick_file(move |path| {
                    if let Some(path) = path {
                        let path = path.into_os_string().into_string().unwrap();
                        let info = image::info(&path);
                        match info {
                            Some(info) => {
                                window.emit("open_file", info).unwrap();
                            }
                            _ => {}
                        }
                    }
                });
        }
        _ => {}
    }
}
