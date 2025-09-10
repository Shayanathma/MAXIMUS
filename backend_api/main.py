from fastapi import FastAPI, HTTPException
from typing import List
from . import crud
from .schemas import ConceptMap, TranslateRequest, PatientSearchRequest
import json

app = FastAPI(title="NAMASTE-ICD11 FHIR Terminology Service")

# ------------------------
# Load the FHIR ConceptMap prototype JSON
# ------------------------
with open("fhir.json", "r", encoding="utf-8") as f:
    concept_map = json.load(f)

# Helper functions for prototype
def prototype_translate_code(code: str):
    results = []
    for group in concept_map.get("group", []):
        for element in group.get("element", []):
            if element.get("code") == code:
                for target in element.get("target", []):
                    results.append({
                        "targetCode": target.get("code"),
                        "display": target.get("display"),
                        "equivalence": target.get("equivalence"),
                        "similarity": target.get("extension", [{}])[0].get("valueDecimal")
                    })
    return results

def prototype_search_symptom(term: str):
    results = []
    for group in concept_map.get("group", []):
        for element in group.get("element", []):
            if term.lower() in element.get("display", "").lower():
                results.append({
                    "sourceCode": element.get("code"),
                    "display": element.get("display"),
                    "targets": [
                        {
                            "targetCode": t.get("code"),
                            "display": t.get("display"),
                            "equivalence": t.get("equivalence"),
                            "similarity": t.get("extension", [{}])[0].get("valueDecimal")
                        }
                        for t in element.get("target", [])
                    ]
                })
    return results

# ------------------------
# Root & health endpoints
# ------------------------
@app.get("/")
def root():
    return {"message": "NAMASTE-ICD11 FHIR Terminology Service is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# ------------------------
# Translation endpoint
# ------------------------
@app.post("/ConceptMap/$translate")
def translate_code(request: TranslateRequest):
    if request.system.lower() != "namaste":
        raise HTTPException(status_code=400, detail="Only 'namaste' system supported")
    # Use prototype function for now
    translations = prototype_translate_code(request.code)
    if not translations:
        raise HTTPException(status_code=404, detail="Code not found")
    return {"result": True, "matches": translations}

# ------------------------
# Patient search endpoint
# ------------------------
@app.post("/patients/search")
def patient_search(request: PatientSearchRequest):
    # Use prototype function for now
    matches = prototype_search_symptom(request.symptom)
    if not matches:
        raise HTTPException(status_code=404, detail="No matches found")
    return {"matches": matches}

# ------------------------
# CRUD ConceptMaps endpoints
# ------------------------
@app.get("/conceptmaps", response_model=List[ConceptMap])
def list_conceptmaps():
    return crud.get_all()

@app.get("/conceptmaps/{code}", response_model=ConceptMap)
def get_conceptmap(code: str):
    cm = crud.get_by_code(code)
    if not cm:
        raise HTTPException(status_code=404, detail="ConceptMap not found")
    return cm

@app.post("/conceptmaps", response_model=ConceptMap)
def create_conceptmap(cm: ConceptMap):
    try:
        return crud.create_mapping(cm.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/conceptmaps/{code}", response_model=ConceptMap)
def update_conceptmap(code: str, cm: ConceptMap):
    updated = crud.update_mapping(code, cm.dict())
    if not updated:
        raise HTTPException(status_code=404, detail="ConceptMap not found")
    return updated

@app.delete("/conceptmaps/{code}")
def delete_conceptmap(code: str):
    success = crud.delete_mapping(code)
    if not success:
        raise HTTPException(status_code=404, detail="ConceptMap not found")
    return {"deleted": True}