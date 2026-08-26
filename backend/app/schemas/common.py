from typing import Literal

from pydantic import BaseModel, Field


class KeystrokeEvent(BaseModel):
    """One keydown/keyup event as captured by the browser."""
    key: str = Field(..., description="event.key value, e.g. 'a', ' ', '.'")
    type: Literal["keydown", "keyup"]
    t: float = Field(..., description="High-resolution timestamp in milliseconds (performance.now()).")


class KeystrokeEventsPayload(BaseModel):
    events: list[KeystrokeEvent]
