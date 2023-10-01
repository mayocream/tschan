import argparse
import datetime
import json
import os

import numpy as np
import manga109api


class Manga109COCOConverter():

    def __init__(self,
                 manga109_root_dir,
                 year=2021,
                 version="",
                 book_limit=None,
                 page_limit=None,
                 add_manga109_info=False,
                 add_coco_info=True):
        """
        Parameters
        ----------
        add_manga109_info : bool
            include additional information out of original COCO format.
        add_coco_info : bool
            include information in original COCO format,
            but out of Manga109 Dataset.
            if set to False, COCO compatibility breaks.
        """
        self.book_limit = book_limit
        self.page_limit = page_limit
        self.add_manga109_info = add_manga109_info
        self.add_coco_info = add_coco_info

        self.parser = manga109api.Parser(root_dir=manga109_root_dir)
        self.init_coco_format_info(year=year, version=version)
        self.reset_converter()

    def reset_converter(self):
        self.img_index = 0
        self.img_dicts = []
        self.annotation_dicts = []
        self.characters = []

    def init_coco_format_info(self, year, version):
        self.dataset_info = {
            "year": year,
            "version": version,
            "description": "Manga109 Dataset or Manga109-s Dataset",
            "contributor": "Aizawa Yamasaki Matsui Lab., The University of Tokyo",
            "url": "http://www.manga109.org/",
            "date_created": datetime.datetime.utcnow().isoformat(' '),
        }
        self.licenses = [{
            "id": 1,
            "name": "Manga109 Dataset License or Manga109-s Dataset License",
            "url": "http://www.manga109.org/",
        }]
        self.target_categories = [
            {
                "id": 1,
                "name": "frame",
                "supercategory": "art",
            },
            {
                "id": 2,
                "name": "text",
                "supercategory": "text",
            },
        ]
        self.category_name_to_id = {category['name']: category['id'] for category in self.target_categories}

    def get_books(self):
        return self.parser.books

    def process_dataset(self, books=None):
        if books is None:
            books = self.parser.books
        if self.book_limit is not None:
            books = books[:self.book_limit]
        for book in books:
            self.process_book(book=book)

    def process_book(self, book):
        print('processing', book)
        annotation = self.parser.get_annotation(book=book, separate_by_tag=False)
        book_title = annotation['title']

        page_annotations = annotation['page']
        if self.page_limit is not None:
            page_annotations = page_annotations[:self.page_limit]
        for page_index, page_annotation in enumerate(page_annotations):
            img_filename = os.path.join('images', book, f'{page_index:03d}.jpg')
            img_height = page_annotation['@height']
            img_width = page_annotation['@width']
            page_index = page_annotation['@index']
            self.add_coco_img_dict(
                img_filename, height=img_height, width=img_width, book_title=book_title, page_index=page_index)
            self.add_coco_annotation_dict(page_annotation['contents'])
            # increment img_index after adding annotations
            self.img_index += 1

    def add_coco_img_dict(self, file_name, height=None, width=None, book_title=None, page_index=None):
        if height is None or width is None:
            raise ValueError
        img_dict = {
            "id": self.img_index,
            "width": width,
            "height": height,
            "file_name": file_name,
            "license": 1,
        }
        if self.add_coco_info:
            img_dict["flickr_url"] = ""
            img_dict["coco_url"] = ""
            img_dict["date_captured"] = ""
        if self.add_manga109_info:
            img_dict["book_title"] = book_title
            img_dict["page_index"] = page_index

        self.img_dicts.append(img_dict)

    def add_coco_annotation_dict(self, contents):
        annotation_dicts = []
        for content in contents:
            # skip non-text and non-frame
            if content['type'] != 'text' and content['type'] != 'frame':
                continue

            annotation_id = int(content['@id'], 16)
            xmin = content['@xmin']
            xmax = content['@xmax']
            ymin = content['@ymin']
            ymax = content['@ymax']
            category_id = self.category_name_to_id[content['type']]
            width = xmax - xmin
            height = ymax - ymin

            annotation_dict = {
                "id": annotation_id,
                "image_id": self.img_index,
                "category_id": category_id,
                "segmentation": None,
                "area": width * height,
                "bbox": [xmin, ymin, width, height],
                "iscrowd": 0,
            }
            if self.add_manga109_info:
                if '#text' in content:
                    annotation_dict["text"] = content['#text']

            annotation_dicts.append(annotation_dict)
        self.annotation_dicts.extend(annotation_dicts)

    def write_coco(self, label_path, json_indent=None):
        output_dict = {
            "info": self.dataset_info,
            "licenses": self.licenses,
            "categories": self.target_categories,
            "images": self.img_dicts,
        }
        print('Total images:', len(self.img_dicts))
        if self.annotation_dicts:
            print('Total annotations:', len(self.annotation_dicts))
            output_dict["annotations"] = self.annotation_dicts
            # verify whether annotation ids are unique
            annotation_ids = [anno['id'] for anno in self.annotation_dicts]
            annotation_unique_ids = np.unique(np.array(annotation_ids))
            if len(self.annotation_dicts) != len(annotation_unique_ids):
                raise RuntimeError('non-unique annotation id found')

        with open(label_path, mode='w') as f:
            # dump with a trick for rounding float
            json.dump(
                json.loads(json.dumps(output_dict), parse_float=lambda x: round(float(x), 6)),
                f,
                indent=json_indent,
                sort_keys=False)


def parse_args():
    default_val = ["HealingPlanet", "LoveHina_vol14", "SeisinkiVulnus", "That'sIzumiko"]
    default_test = [
        "Akuhamu", "BakuretsuKungFuGirl", "DollGun", "EvaLady", "HinagikuKenzan", "KyokugenCyclone", "LoveHina_vol01",
        "MomoyamaHaikagura", "TennenSenshiG", "UchiNoNyan'sDiary", "UnbalanceTokyo", "YamatoNoHane", "YoumaKourin",
        "YumeNoKayoiji", "YumeiroCooking"
    ]

    parser = argparse.ArgumentParser()
    parser.add_argument('--manga109_root_dir', required=True, type=str)
    parser.add_argument('--dataset_year', default=2021, type=int)
    parser.add_argument('--dataset_version', default="", type=str)
    parser.add_argument('--label_dirname', default='annotations_coco_format', type=str)
    parser.add_argument('--label_filename_prefix', default='manga109_coco', type=str)
    parser.add_argument('--json_indent', default=None, type=int)
    parser.add_argument('--add_manga109_info', action='store_true')
    parser.add_argument('--book_limit', default=None, type=int, help='limit number of books. useful for debug.')
    parser.add_argument('--page_limit', default=None, type=int, help='limit number of pages. useful for debug.')
    parser.add_argument('--val_books', nargs='*', default=default_val, type=str)
    parser.add_argument('--test_books', nargs='*', default=default_test, type=str)

    args = parser.parse_args()
    return args


def main():
    args = parse_args()
    label_dir = os.path.join(args.manga109_root_dir, args.label_dirname)
    os.makedirs(label_dir, exist_ok=True)

    converter = Manga109COCOConverter(
        args.manga109_root_dir,
        year=args.dataset_year,
        version=args.dataset_version,
        book_limit=args.book_limit,
        page_limit=args.page_limit,
        add_manga109_info=args.add_manga109_info)

    all_books = converter.get_books()
    print('Total books:', len(all_books))
    train_books = all_books.copy()
    for non_train_books in args.val_books + args.test_books:
        train_books.remove(non_train_books)

    splits = {
        f'{len(args.val_books)}val': args.val_books,
        f'{len(args.test_books)}test': args.test_books,
        f'{len(train_books)}train': train_books
    }

    for split_names, split_books in splits.items():
        if not split_books:
            continue
        print(split_names, '*' * 70)
        label_filename = f'{args.label_filename_prefix}_{split_names}.json'
        label_path = os.path.join(label_dir, label_filename)
        converter.reset_converter()
        converter.process_dataset(books=split_books)
        converter.write_coco(label_path, json_indent=args.json_indent)


if __name__ == "__main__":
    main()
