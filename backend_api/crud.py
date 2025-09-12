import json
import os

# Path to the JSON ConceptMap
concept_map_path = os.path.join(os.path.dirname(__file__), "..", "fhir.json")

# Load ConceptMap at startup
def load_conceptmap():
    try:
        with open(concept_map_path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise RuntimeError(f"Could not load ConceptMap: {e}")

concept_map_data = load_conceptmap()


# ------------------------
# Translate code
# ------------------------
def translate_code(code: str):
    matches = []
    for group in concept_map_data.get("group", []):
        for element in group.get("element", []):
            if element.get("code") == code:
                for target in element.get("target", []):
                    similarity = None
                    for ext in target.get("extension", []):
                        if ext.get("url", "").endswith("similarity"):
                            similarity = ext.get("valueDecimal", 0.0)
                    matches.append({
                        "code": target.get("code"),
                        "display": target.get("display"),
                        "equivalence": target.get("equivalence"),
                        "similarity": similarity
                    })
    return matches


# ------------------------
# List all codes with full mapping details
# ------------------------
def list_codes():
    codes = []
    for group in concept_map_data.get("group", []):
        for element in group.get("element", []):
            namaste_code = element.get("code")
            namaste_display = element.get("display")
            for target in element.get("target", []):
                similarity = None
                for ext in target.get("extension", []):
                    if ext.get("url", "").endswith("similarity"):
                        similarity = ext.get("valueDecimal", 0.0)
                codes.append({
                    "namaste_code": namaste_code,
                    "namaste_display": namaste_display,
                    "icd_code": target.get("code"),
                    "icd_display": target.get("display"),
                    "similarity": similarity
                })
    return codes


# ------------------------
# Get all mappings (same as list_codes but can be used separately if needed)
# ------------------------
def get_all_mappings():
    return list_codes()