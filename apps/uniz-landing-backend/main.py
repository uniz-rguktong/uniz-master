from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import home, institute, notifications, academics, departments

app = FastAPI(
    title="Uniz-Landing-Page-API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(home.router)
app.include_router(institute.router)
app.include_router(notifications.router)
app.include_router(academics.router)
app.include_router(departments.router)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"❌ Validation Error: {exc.errors()}") # This prints to your terminal
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.get("/health", tags=["system"])
def health_check():
    return {"status": "healthy", "service": "Uniz Landing Page API"}