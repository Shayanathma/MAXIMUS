from fastapi import FastAPI, HTTPException
from . import crud, schemas
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NAMASTE-ICD11 FHIR Terminology Service")

# Allow requests from frontend
origins = ["http://127.0.0.1:5500"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "NAMASTE-ICD11 FHIR Terminology Service is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/translate")
def translate_code(request: schemas.TranslateRequest):
    translations = crud.translate_code(request.code)
    if not translations:
        raise HTTPException(status_code=404, detail="Code not found")
    return {"result": True, "matches": translations}

@app.get("/codes", response_model=schemas.CodesResponse)
def list_all_codes():
    codes = crud.list_codes()
    if not codes:
        raise HTTPException(status_code=404, detail="No codes found")
    return {"codes": codes}