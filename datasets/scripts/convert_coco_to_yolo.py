from ultralytics.data.converter import convert_coco
import os
import json
import tempfile
import glob
import shutil

def flatten_dir_with_links(manga109_directory, annotations_directory):
    # Create the main temp directory
    main_tmp_dir = tempfile.mkdtemp()

    # Create 'annotations' subdirectory under the main temp directory
    tmp_json_dir = os.path.join(main_tmp_dir, 'annotations')
    os.makedirs(tmp_json_dir)

    # Read .json files from the source directory and replace paths
    for json_file in glob.glob(os.path.join(annotations_directory, '*.json')):
        # Create a specific subdirectory under 'images' based on the JSON file name (without extension)
        json_file_basename = os.path.splitext(os.path.basename(json_file))[0]
        tmp_img_subdir = os.path.join(main_tmp_dir, 'images', json_file_basename)
        os.makedirs(tmp_img_subdir, exist_ok=True)

        with open(json_file, 'r') as f:
            data = json.load(f)

            for image_data in data['images']:
                # e.g. 'images/HealingPlanet', '000.jpg'
                folder, file = os.path.split(image_data['file_name'])
                src_path = os.path.join(manga109_directory, folder, file)

                new_filename = f'{folder}_{file}'.removeprefix('images/')
                dest_path = os.path.join(tmp_img_subdir, new_filename)
                os.symlink(os.path.abspath(src_path), dest_path)

                image_data['file_name'] = new_filename

            # Write the updated data to a new json file in tmp_json_dir
            with open(os.path.join(tmp_json_dir, os.path.basename(json_file)), 'w') as out_f:
                json.dump(data, out_f, indent=4)

    return main_tmp_dir


# Convert the Manga109 dataset from COCO format to YOLO format
if __name__ == '__main__':
    fixed_coco_dir = flatten_dir_with_links('manga109', 'manga109/annotations_coco_format')

    os.chdir('manga109')
    convert_coco(labels_dir=f'{fixed_coco_dir}/annotations')

    # moves the symlinks to the `yolo_labels/images`
    shutil.rmtree('yolo_labels/images')
    shutil.move(f'{fixed_coco_dir}/images', 'yolo_labels')
