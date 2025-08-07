import cv2
import asyncio
import numpy as np
from av import VideoFrame
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from ultralytics import YOLO
from aiohttp import web

model = YOLO("yolov8n.pt")  # Load YOLOv8 model

class YOLOVideoStreamTrack(VideoStreamTrack):
    """
    Custom video track that applies YOLOv8 object detection
    """
    def __init__(self, camera_source=0):
        super().__init__()
        self.cap = cv2.VideoCapture(camera_source)  # Or RTSP URL
        self.frame_rate = 15

    async def recv(self):
        pts, time_base = await self.next_timestamp()

        ret, frame = self.cap.read()
        if not ret:
            raise Exception("Camera read failed")

        # YOLOv8 Processing
        results = model(frame)
        annotated_frame = results[0].plot()  # Draw detections

        # Convert to WebRTC compatible format
        frame = VideoFrame.from_ndarray(annotated_frame, format="bgr24")
        frame.pts = pts
        frame.time_base = time_base
        return frame

async def offer(request):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pc.addTrack(YOLOVideoStreamTrack("rtsp://192.168.1.106:8554/stream"))  # Or 0 for webcam

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.json_response({
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    })

async def index(request):
    with open("for_rtc.html") as f:
        return web.Response(text=f.read(), content_type="text/html")

app = web.Application()
app.router.add_get("/", index)
app.router.add_post("/offer", offer)

if __name__ == "__main__":
    web.run_app(app, port=8080)