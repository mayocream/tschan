import supervision as sv
import os
import json
import tempfile
import glob

# trick
def flatten_dir_with_links(src_img_directory, src_json_directory):
    # Create the main temp directory
    main_tmp_dir = tempfile.mkdtemp()

    # Create "images" and "annotations" subdirectories under the main temp directory
    tmp_img_dir = os.path.join(main_tmp_dir, "images")
    os.makedirs(tmp_img_dir)

    tmp_json_dir = os.path.join(main_tmp_dir, "annotations")
    os.makedirs(tmp_json_dir)

    # Create soft links in the "images" temp directory to flatten the directory structure of images
    for subdir, _, files in os.walk(src_img_directory):
        for file in files:
            src_path = os.path.join(subdir, file)
            new_filename = "{}_{}".format(os.path.basename(subdir), file)
            dest_path = os.path.join(tmp_img_dir, new_filename)
            os.symlink(os.path.abspath(src_path), dest_path)

    # Read .json files from the source directory and replace paths
    for json_file in glob.glob(os.path.join(src_json_directory, "*.json")):
        with open(json_file, 'r') as f:
            data = json.load(f)

            for image_data in data["images"]:
                folder, file = os.path.split(image_data["file_name"])
                new_filename = "{}_{}".format(folder, file)
                image_data["file_name"] = new_filename

            # Extract the desired suffix from the original filename
            filename_suffix = next(suffix for suffix in ["test", "val", "train"] if suffix in json_file)
            if filename_suffix:
                new_json_filename = f'{filename_suffix}.json'
                # Write the updated data to a new json file in tmp_json_dir with the new name
                with open(os.path.join(tmp_json_dir, new_json_filename), 'w') as out_f:
                    json.dump(data, out_f, indent=4)

    return main_tmp_dir

if __name__ == '__main__':
    # Convert the Manga109 dataset from COCO format to YOLO format
    fixed_coco_dir = flatten_dir_with_links('manga109/images', 'manga109/annotations_coco_format')

    for typ in ['train', 'val', 'test']:
        sv.DetectionDataset.from_coco(
            images_directory_path=f'{fixed_coco_dir}',
            annotations_path=f'{fixed_coco_dir}/annotations/{typ}.json',
            force_masks=False
        ).as_yolo(
            images_directory_path=f'manga109/yolo_format/images/{typ}',
            annotations_directory_path=f'manga109/yolo_format/labels/{typ}',
            data_yaml_path='manga109/yolo_format/manga109.yaml'
        )

    # takes a while...
