# Datasets for Training

both labeled and unlabeled data

## Preprocessing

`scripts/` holds scripts for downloading and preprocessing datasets.

### Manga109

From [shinya7y/manga109api](https://github.com/shinya7y/manga109api)

```python
python scripts/convert_manga109_to_coco.py \
    --manga109_root_dir manga109 \
    --dataset_version v2021.12.31 \
    --label_filename_prefix manga109_coco \
    --add_manga109_info
```
