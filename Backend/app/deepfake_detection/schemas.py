from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class DeepfakePredictResponse(BaseModel):
    verdict: Literal["Likely Authentic", "Needs Review", "Likely Manipulated", "Error"]
    risk_level: Literal["Low Risk", "Needs Review", "High Risk"]
    message: str
    media_type: Literal["image", "video", "unknown"]
