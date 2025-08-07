import cv2
import subprocess
from ultralytics import YOLO

# Initialize YOLOv8 (FP16 quantization for better performance)
model = YOLO("yolov8n.pt").half()  # Half-precision for RPi GPU

# Original libcamera-vid parameters with YOLO enhancements
FFMPEG_CMD = [
    'ffmpeg',
    '-hwaccel', 'v4l2m2m',          # Raspberry Pi hardware acceleration
    '-re',                           # Maintain input framerate
    '-f', 'h264',                    # Match libcamera's output
    '-i', '-',                       # Pipe input
    '-vf', 'scale=1280:720',         # Maintain original resolution
    '-c:v', 'h264_v4l2m2m',          # RPi hardware encoder
    '-b:v', '2M',                    # Bitrate matching libcamera
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-g', '30',                      # GOP size matching framerate
    '-f', 'rtsp',
    '-rtsp_transport', 'tcp',        # More reliable than UDP
    'rtsp://127.0.0.1:8554/yolov8_stream'     # Enhanced output stream
]

# Start FFmpeg with buffer optimizations
ffmpeg_process = subprocess.Popen(
    FFMPEG_CMD,
    stdin=subprocess.PIPE,
    stderr=subprocess.PIPE,
    bufsize=2**20  # 1MB buffer for smooth streaming
)

# Capture original stream with zero-copy optimization
cap = cv2.VideoCapture(
    'rtsp://127.0.0.1:8554/stream',
    apiPreference=cv2.CAP_FFMPEG,
    params=[
        cv2.CAP_PROP_HW_ACCELERATION, cv2.VIDEO_ACCELERATION_ANY,
        cv2.CAP_PROP_BUFFERSIZE, 1  # Minimal buffer for low latency
    ]
)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        continue  # Skip bad frames

    # YOLOv8 Inference (optimized for RPi)
    results = model(frame, imgsz=640, half=True)  # Reduced resolution for speed
    annotated_frame = results[0].plot()            # Draw detections

    # Send to FFmpeg with error handling
    try:
        ffmpeg_process.stdin.write(
            cv2.imencode('.h264', annotated_frame)[1].tobytes()
        )
    except BrokenPipeError:
        # Auto-restart FFmpeg if crashed
        ffmpeg_process = subprocess.Popen(FFMPEG_CMD, stdin=subprocess.PIPE)