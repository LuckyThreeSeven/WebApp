from fastapi import FastAPI, HTTPException, status

app = FastAPI()


@app.get("/")
def health_check():
    return {"status": "ok"}
