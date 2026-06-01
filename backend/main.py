import asyncio
import io
import json

from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolov8m.pt")

clients: list[WebSocket] = []

TARGETS = [
    "cell phone",
    "book",
    "laptop",
    "person",
    "mouse",
    "keyboard",
    "scissors",
    "knife",
    "bottle",
    "handbag",
    "cup",
    "remote",
    "backpack",
]

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    print(f"Dashboard connected. Total clients: {len(clients)}")
    try:
        while True:
            await asyncio.sleep(10)
            await websocket.send_text(json.dumps({"ping": True}))
    except WebSocketDisconnect:
        clients.remove(websocket)
        print("Dashboard disconnected.")

@app.post("/detect")
async def detect(file: UploadFile = File(...)) -> dict[str, object]:
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    results: list = model(image)  # type: ignore

    all_seen: list[str] = []
    detected: list[dict[str, object]] = []

    for r in results:
        for box in r.boxes:
            label: str = model.names[int(box.cls[0])]
            confidence = float(box.conf[0])

            all_seen.append(f"{label} ({round(confidence * 100)}%)")

            if label in TARGETS and confidence > 0.60:
                detected.append({"label": label, "confidence": round(confidence * 100)})

    print("All YOLO sees:", all_seen)
    print("Filtered:", detected)

    if detected:
        alert = {"weapon_detected": True, "objects": detected}
        for client in clients.copy():
            try:
                await client.send_text(json.dumps(alert))
            except Exception:
                clients.remove(client)

    return {"weapon_detected": len(detected) > 0, "objects": detected}