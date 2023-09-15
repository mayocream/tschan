import manga109api
import cv2
import os

def draw_rectangle(img, x0, y0, x1, y1, annotation_type):
    assert annotation_type in ["body", "face", "frame", "text"]
    color_map = {
        "body": (57, 128, 37),  # #258039
        "face": (65, 190, 245),  # #f5be41
        "frame": (184, 169, 49),  # #31a9b8
        "text": (33, 115, 207)   # #cf3721
    }
    cv2.rectangle(img, (x0, y0), (x1, y1), color_map[annotation_type], 10)

def process_book_folder(manga109_root_dir, book_name, output_folder):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    p = manga109api.Parser(root_dir=manga109_root_dir)
    annotation = p.get_annotation(book=book_name)

    book_dir = os.path.join(manga109_root_dir, 'images', book_name)

    for page_index, page_file in enumerate(sorted(os.listdir(book_dir))):
        if not page_file.endswith('.jpg'):
            continue

        img_path = os.path.join(book_dir, page_file)
        img = cv2.imread(img_path)

        page_annotations = annotation["page"][page_index]
        for annotation_type in ["body", "face", "frame", "text"]:
            rois = page_annotations.get(annotation_type, [])
            for roi in rois:
                draw_rectangle(img, roi["@xmin"], roi["@ymin"], roi["@xmax"], roi["@ymax"], annotation_type)

        cv2.imwrite(os.path.join(output_folder, f"{book_name}_{page_file}"), img)

if __name__ == "__main__":
    manga109_root_dir = "manga109"
    output_folder = "manga109_bbox"
    book_name = "ARMS"
    process_book_folder(manga109_root_dir, book_name, output_folder)
