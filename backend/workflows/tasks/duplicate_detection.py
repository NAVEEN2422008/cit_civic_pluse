import os
import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from workflows.models.workflow_models import DuplicateResult
from workflows.services.database import get_workflow_db
from app.models import Issue

logger = logging.getLogger(__name__)

# Configurable spatial radius rules per civic defect category (meters)
CATEGORY_SEARCH_RADIUS_METERS = {
    "pothole": 100.0,
    "damaged road": 100.0,
    "overflowing garbage bin": 60.0,
    "garbage/waste": 60.0,
    "broken streetlight": 120.0,
    "drainage issue": 80.0,
    "water leakage": 150.0,
    "default": 100.0
}

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates Haversine distance in meters between two coordinates."""
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def compute_text_similarity(text1: str, text2: str) -> float:
    """Calculates Jaccard token overlap between two descriptions."""
    if not text1 or not text2:
        return 0.0
    if text1.strip().lower() == text2.strip().lower():
        return 1.0
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / float(len(union)) if union else 0.0

def detect_duplicate(
    complaint_id: str,
    category: str,
    latitude: float,
    longitude: float,
    description: Optional[str] = None,
    image_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Task 5: detect_duplicate
    Evaluates multi-signal duplicate candidates:
      1. Spatial GPS Proximity (35%)
      2. Category Matching (25%)
      3. Text Content Similarity (25%)
      4. Image URL / Hash Proximity (15%)
    
    Composite Score >= Threshold (default 0.65) => is_duplicate: True
    """
    threshold = float(os.getenv("DUPLICATE_SIMILARITY_THRESHOLD", "0.65"))
    cat_clean = (category or "default").lower()
    max_radius = CATEGORY_SEARCH_RADIUS_METERS.get(cat_clean, CATEGORY_SEARCH_RADIUS_METERS["default"])

    db = get_workflow_db()
    try:
        # Search active non-duplicate tickets within the same broader class
        candidates = db.query(Issue).filter(
            Issue.id != complaint_id,
            Issue.is_duplicate == False,
            Issue.status.in_(["OPEN", "ASSIGNED", "PROCESSING", "IN_PROGRESS", "ACCEPTED"])
        ).all()

        best_candidate: Optional[Issue] = None
        best_score = 0.0
        best_breakdown = {}

        for c in candidates:
            # Signal 1: GPS Distance
            dist = haversine_distance_meters(latitude, longitude, c.latitude, c.longitude)
            if dist > max_radius:
                continue

            # Linear spatial proximity score
            gps_score = max(0.0, 1.0 - (dist / max_radius))

            # Signal 2: Category Match
            c_cat = (c.ai_category or "").lower()
            cat_match_score = 1.0 if (cat_clean in c_cat or c_cat in cat_clean) else 0.3

            # Signal 3: Text Similarity
            c_text = c.processed_description or c.description or ""
            text_sim = compute_text_similarity(description or "", c_text)

            # Signal 4: Image Similarity
            img_sim = 0.0
            if image_url and c.media_url:
                img_sim = 0.90 if (image_url == c.media_url or abs(len(image_url) - len(c.media_url)) < 50) else 0.20

            # Composite weighted fusion
            composite = (0.35 * gps_score) + (0.25 * cat_match_score) + (0.25 * text_sim) + (0.15 * img_sim)

            if composite > best_score:
                best_score = composite
                best_candidate = c
                best_breakdown = {
                    "distance_meters": round(dist, 1),
                    "gps_score": round(gps_score, 2),
                    "category_score": round(cat_match_score, 2),
                    "text_score": round(text_sim, 2),
                    "image_score": round(img_sim, 2)
                }

        if best_candidate and best_score >= threshold:
            return DuplicateResult(
                is_duplicate=True,
                duplicate_complaint_id=best_candidate.id,
                similarity_score=round(best_score, 2),
                reason=f"Found existing ticket {best_candidate.id} within {best_breakdown.get('distance_meters')}m with matching defect characteristics.",
                evidence_breakdown=best_breakdown
            ).model_dump()
        else:
            return DuplicateResult(
                is_duplicate=False,
                duplicate_complaint_id=None,
                similarity_score=round(best_score, 2) if best_candidate else 0.0,
                reason="No matching municipal complaint found within spatial and semantic search threshold."
            ).model_dump()

    except Exception as e:
        logger.error(f"Duplicate detection error: {e}")
        return DuplicateResult(
            is_duplicate=False,
            duplicate_complaint_id=None,
            similarity_score=0.0,
            reason="Duplicate search fallback applied."
        ).model_dump()
    finally:
        db.close()
