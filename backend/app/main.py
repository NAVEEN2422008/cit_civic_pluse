from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import MockIdentity
from app.auth import hash_identity
from app.middleware.security_middleware import SecurityHeadersAndRateLimitMiddleware
from app.routers import auth_router, user_router, citizen_router, issue_router

# Create DB tables
Base.metadata.create_all(bind=engine)

# Seed Mock Identity Table with Synthetic Demo Aadhaar Numbers
def seed_mock_identities():
    db = SessionLocal()
    try:
        for idx, demo_num in enumerate(settings.DEMO_IDENTITIES):
            identity_hash = hash_identity(demo_num)
            existing = db.query(MockIdentity).filter(MockIdentity.mock_identity_hash == identity_hash).first()
            if not existing:
                mock_ref = f"MOCK-REF-90010000{1234 + idx}"
                new_mock = MockIdentity(
                    identity_reference=mock_ref,
                    mock_identity_hash=identity_hash,
                    is_registered=False
                )
                db.add(new_mock)
        db.commit()
    finally:
        db.close()

seed_mock_identities()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI Backend for CivicPulse — Complete Citizen Platform Modules 1 through 10",
    version="10.0.0"
)

# Module 10 Rate Limiting & Security Headers Middleware
app.add_middleware(SecurityHeadersAndRateLimitMiddleware)

# CORS middleware for Next.js / Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(user_router.router, prefix="/api/v1")
app.include_router(citizen_router.router, prefix="/api/v1")
app.include_router(issue_router.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": "10.0.0",
        "security": "ENFORCED",
        "docs": "/docs"
    }
