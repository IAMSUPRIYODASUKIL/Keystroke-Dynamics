"""Import every model module so they register on Base.metadata before
`Base.metadata.create_all()` is called (see app/main.py)."""
from app.models.authentication_attempt import AuthenticationAttempt  # noqa: F401
from app.models.model_version import ModelVersion  # noqa: F401
from app.models.training_run import TrainingRun  # noqa: F401
from app.models.typing_feature import TypingFeature  # noqa: F401
from app.models.typing_sample import TypingSample  # noqa: F401
from app.models.user import User  # noqa: F401
