# `ml/` — artifact storage, not a second copy of the ML code

The actual feature-extraction, training, and inference **code** lives in
`backend/app/ml/`, where it can be imported directly by the FastAPI API layer
(`POST /api/ml/train`, login-time verification, etc.) without duplicating logic
between a "library" version and an "API" version.

This directory is where that code **writes its artifacts**:

- `saved_models/` — persisted `.joblib` pipelines (`StandardScaler` + classifier),
  one subfolder per user (`user_<id>/`) plus `global/` for the multi-class
  classification model. Referenced by file path from the `model_versions` database
  table, alongside its accuracy/F1/FAR/FRR and confusion matrix.
- `datasets/` — reserved for exported dataset snapshots (e.g. a CSV dump of
  `typing_features` for offline analysis in a notebook). Empty by default; the
  live dataset lives in the application database.

Both directories are gitignored except for a `.gitkeep` placeholder — trained
models and exported datasets are run artifacts, not source code, and will differ
on every machine this project is run on.
