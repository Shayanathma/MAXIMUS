from pydantic import BaseModel, Field
from typing import List, Optional

# ------------------------
# Nested FHIR structures
# ------------------------
class TargetExtension(BaseModel):
    url: str
    valueDecimal: Optional[float] = None

class ElementTarget(BaseModel):
    code: str
    display: Optional[str] = None
    equivalence: Optional[str] = None
    extension: Optional[List[TargetExtension]] = None

class ConceptMapElement(BaseModel):
    code: str
    display: Optional[str] = None
    target: Optional[List[ElementTarget]] = None

class ConceptMapGroup(BaseModel):
    source: str
    target: str
    element: List[ConceptMapElement]

# ------------------------
# Full ConceptMap resource
# ------------------------
class ConceptMap(BaseModel):
    resourceType: str = Field(default="ConceptMap")
    id: str
    url: Optional[str] = None
    status: str
    version: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    date: Optional[str] = None
    publisher: Optional[str] = None
    group: List[ConceptMapGroup]

# ------------------------
# Requests
# ------------------------
class TranslateRequest(BaseModel):
    code: str
    system: str = "namaste"

class PatientSearchRequest(BaseModel):
    symptom: str