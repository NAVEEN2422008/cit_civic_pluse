from app.database import SessionLocal, get_db, Base, engine
import app.models # Ensure all models are registered

# Ensure tables including workflow_runs and decision_logs are created
Base.metadata.create_all(bind=engine)

def get_workflow_db():
    """Provides a transactional database session for workflow task execution."""
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise

