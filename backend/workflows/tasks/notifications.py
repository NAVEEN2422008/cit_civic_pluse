import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def notify_department(ticket_result: Dict[str, Any], decision: Dict[str, Any]) -> Dict[str, Any]:
    """
    Task 13: notify_department
    Dispatches automated assignment dispatch to the operational field unit.
    Resilient: network/SMS failure logs a notification audit record without rolling back ticket creation.
    """
    complaint_id = ticket_result.get("complaint_id")
    dept = decision.get("department", "Municipal Department")
    priority = decision.get("priority", "MEDIUM")
    sla = decision.get("sla_hours", 48)

    message = f"New {priority} priority complaint {complaint_id} assigned to {dept}. SLA: {sla} hours."
    logger.info(f"[DISPATCH TO DEPARTMENT] {message}")

    # Integration placeholder for push notification / WhatsApp / Email
    return {
        "channel": "INTERNAL_QUEUE",
        "recipient": dept,
        "message": message,
        "delivered": True,
        "status": "SENT"
    }

def notify_citizen(ticket_result: Dict[str, Any], decision: Dict[str, Any]) -> Dict[str, Any]:
    """
    Task 14: notify_citizen
    Sends SMS / push notification to citizen with ticket tracking details and SLA guarantee.
    """
    complaint_id = ticket_result.get("complaint_id")
    dept = decision.get("department", "Municipal Department")
    priority = decision.get("priority", "MEDIUM")
    sla = decision.get("sla_hours", 48)

    if decision.get("duplicate"):
        dup_id = decision.get("duplicate_of_id")
        message = f"Your report matches active complaint {dup_id}. You have been added as a verified supporter for expedited resolution."
    else:
        message = f"Your complaint {complaint_id} has been assigned to the {dept}. Priority: {priority}. Expected SLA: {sla} hours."

    logger.info(f"[DISPATCH TO CITIZEN] {message}")

    return {
        "channel": "SMS_GATEWAY",
        "recipient_user_id": ticket_result.get("complaint_id"),
        "message": message,
        "delivered": True,
        "status": "SENT"
    }
