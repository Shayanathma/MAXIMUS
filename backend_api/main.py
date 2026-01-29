from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

import crud, schemas

app = FastAPI(title="NAMASTE-ICD11 FHIR Terminology Service")

# --- CORS Settings ---
origins = ["http://127.0.0.1:5500"]  # frontend URL

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- OAuth2 Mock Setup ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- In-memory storage for "logged-in" tokens ---
logged_in_tokens = set()


@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Mock login endpoint.
    Accepts username/password and returns a fake token.
    """
    # In real case: verify user from DB / ABHA auth
    token = form_data.username  # use username as mock token
    logged_in_tokens.add(token)
    return {"access_token": token, "token_type": "bearer"}


# --- Dependency to protect endpoints ---
def require_login(token: str = Depends(oauth2_scheme)):
    """
    Ensures that only logged-in users with a valid mock token can access endpoints.
    """
    if token not in logged_in_tokens:
        raise HTTPException(status_code=401, detail="Not logged in")
    return token

# --- Secured Endpoints ---
@app.get("/")
def root(token: str = Depends(require_login)):
    return {"message": "NAMASTE-ICD11 FHIR Terminology Service is running"}


@app.get("/health")
def health_check(token: str = Depends(require_login)):
    return {"status": "ok"}


@app.post("/translate")
def translate_code(request: schemas.TranslateRequest, token: str = Depends(require_login)):
    translations = crud.translate_code(request.code)
    if not translations:
        raise HTTPException(status_code=404, detail="Code not found")
    return {"result": True, "matches": translations}


@app.get("/codes", response_model=schemas.CodesResponse)
def list_all_codes(token: str = Depends(require_login)):
    codes = crud.list_codes()
    if not codes:
        raise HTTPException(status_code=404, detail="No codes found")
    return {"codes": codes}