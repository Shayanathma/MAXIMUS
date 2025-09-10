import json
import os
from .schemas import ConceptMap

# Path to the JSON ConceptMap
concept_map_path = os.path.join(os.path.dirname(__file__), "..", "fhir.json")

# Load ConceptMap at startup
def load_conceptmaps():
    try:
        with open(concept_map_path, encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception as e:
        raise RuntimeError(f"Could not load ConceptMap: {e}")

concept_map_data = load_conceptmaps()

# ------------------------
# Translation function
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
                            similarity = ext.get("valueDecimal")
                    matches.append({
                        "code": target.get("code"),
                        "display": target.get("display"),
                        "equivalence": target.get("equivalence"),
                        "similarity": similarity
                    })
    return matches

# ------------------------
# Simple patient symptom search (by similarity)
# ------------------------
def search_symptom(symptom: str):
    results = []
    for group in concept_map_data.get("group", []):
        for element in group.get("element", []):
            if symptom.lower() in element.get("display", "").lower():
                results.append({
                    "code": element.get("code"),
                    "display": element.get("display")
                })
    return results

# ------------------------
# CRUD operations for ConceptMaps
# ------------------------
def get_all():
    return [concept_map_data]

def get_by_code(code: str):
    for group in concept_map_data.get("group", []):
        for element in group.get("element", []):
            if element.get("code") == code:
                return concept_map_data
    return None

def create_mapping(mapping: dict):
    # Append new element to first group
    if "group" not in concept_map_data:
        concept_map_data["group"] = [{"source": "namaste", "target": "icd11", "element": []}]
    concept_map_data["group"][0]["element"].append(mapping["group"][0]["element"][0])
    save()
    return mapping

def update_mapping(code: str, mapping: dict):
    for group in concept_map_data.get("group", []):
        for i, element in enumerate(group.get("element", [])):
            if element.get("code") == code:
                group["element"][i] = mapping["group"][0]["element"][0]
                save()
                return mapping
    return None

def delete_mapping(code: str):
    for group in concept_map_data.get("group", []):
        for i, element in enumerate(group.get("element", [])):
            if element.get("code") == code:
                group["element"].pop(i)
                save()
                return True
    return False

def save():
    with open(concept_map_path, "w", encoding="utf-8") as f:
        json.dump(concept_map_data, f, indent=2)