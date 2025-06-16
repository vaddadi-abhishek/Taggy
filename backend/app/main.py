from fastapi import FastAPI
from app.database import engine, Base
from app import models

app = FastAPI()

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"msg": "Taggy backend is running 🚀"}
