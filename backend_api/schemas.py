from pydantic import BaseModel
from typing import List, Optional

# For /translate request
class TranslateRequest(BaseModel):
    code: str

# For individual mapping in /codes
class MappingItem(BaseModel):
    namaste_code: str
    namaste_display: str
    icd_code: str
    icd_display: str
    similarity: Optional[float] = None

# For /codes response
class CodesResponse(BaseModel):
    codes: List[MappingItem]