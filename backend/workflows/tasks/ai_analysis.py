import logging
from typing import Dict, Any, Optional
from workflows.services.ai_provider import ai_provider
from workflows.models.workflow_models import ImageAnalysisResult, TextAnalysisResult, SeverityResult

logger = logging.getLogger(__name__)

def analyze_image(image_url: Optional[str]) -> Dict[str, Any]:
    """
    Task 2: analyze_image
    Input: image_url
    Output: { detected_objects, problem_category, visual_description, confidence }
    """
    try:
        res: ImageAnalysisResult = ai_provider.analyze_image(image_url)
        return res.model_dump()
    except Exception as e:
        logger.error(f"Image analysis error: {e}. Falling back to default.")
        return {
            "detected_objects": [],
            "problem_category": "other",
            "visual_description": f"Image analysis encountered temporary error: {str(e)}",
            "confidence": 0.50,
            "hazard_signals": []
        }

def analyze_text(description: Optional[str], voice_transcript: Optional[str] = None) -> Dict[str, Any]:
    """
    Task 3: analyze_text
    Input: description, voice_transcript
    Output: { problem_category, intent, entities, summary, confidence }
    """
    try:
        res: TextAnalysisResult = ai_provider.analyze_text(description, voice_transcript)
        return res.model_dump()
    except Exception as e:
        logger.error(f"Text analysis error: {e}. Falling back to default.")
        return {
            "problem_category": "other",
            "intent": "uncertain",
            "entities": [],
            "summary": "Text classification temporarily degraded.",
            "confidence": 0.50,
            "detected_language": "English"
        }

def assess_severity(
    image_result: Optional[Dict[str, Any]], 
    text_result: Optional[Dict[str, Any]],
    latitude: float,
    longitude: float
) -> Dict[str, Any]:
    """
    Task 4: assess_severity
    Input: image + text context + location
    Output: { severity: LOW|MEDIUM|HIGH|CRITICAL, severity_score: 0-100, reason, confidence }
    """
    try:
        img_model = ImageAnalysisResult(**image_result) if image_result else None
        txt_model = TextAnalysisResult(**text_result) if text_result else None
        res: SeverityResult = ai_provider.assess_severity(img_model, txt_model, latitude, longitude)
        return res.model_dump()
    except Exception as e:
        logger.error(f"Severity calculation error: {e}.")
        return {
            "severity": "MEDIUM",
            "severity_score": 60,
            "reason": "Standard fallback severity applied due to calculation error.",
            "confidence": 0.60
        }
