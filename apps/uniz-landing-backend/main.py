from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager
from database import engine, Base
from routers import home, institute, academics, departments, notifications, analytics

from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

# --- ASYNC TABLE CREATION ---
@asynccontextmanager
async def lifespan(app: FastAPI):

    FastAPICache.init(InMemoryBackend())
    # --- 1. STARTUP LOGIC ---
    print("Server starting up: Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # --- 2. APP IS RUNNING ---
    yield 
    
    # --- 3. SHUTDOWN LOGIC ---
    print("Server shutting down: Closing database connections...")
    await engine.dispose()  # Safely closes all DB connections

app = FastAPI(title="Uniz-Landing-Page-API", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all the endpoints
app.include_router(home.router)
app.include_router(institute.router)
app.include_router(academics.router)
app.include_router(departments.router)
app.include_router(notifications.router)
app.include_router(analytics.router)



@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "healthy", "service": "Uniz Landing Page API"}

@app.get("/", response_class=HTMLResponse, tags=["system"])
async def read_root():
    return """
    <html>
    <head>
        <title>Uniz Landing API</title>
        <style>
            body { background:#0f172a; color:#e5e7eb; font-family:sans-serif;
                   display:flex; flex-direction:column; align-items:center;
                   justify-content:center; height:100vh; }
            a { color:#38bdf8; text-decoration:none; margin-top:12px; font-size: 20px;}
        </style>
    </head>
    <body>
        <h2>Database-Backed College API</h2>
        <a href="/docs">View Swagger Docs →</a>
    </body>
    </html>
    """