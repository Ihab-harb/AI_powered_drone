from ultralytics import YOLO
import cv2
import subprocess

model = YOLO("yolov8n.pt")
RTSP_INPUT = "rtsp://192.168.1.107:8554/stream"  # Replace <Pi_IP> with your Pi's IP

# FFmpeg command to re-stream YOLOv8 output
FFMPEG_CMD = [
    'ffmpeg',
    '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
    '-pix_fmt', 'bgr24', '-s', '640x480',
    '-r', '15', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-f', 'rtsp', 'rtsp://127.0.0.1:8554/yolov8_output'
]

ffmpeg_process = subprocess.Popen(FFMPEG_CMD, stdin=subprocess.PIPE)
cap = cv2.VideoCapture(RTSP_INPUT)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break

    # Resize and run YOLOv8
    frame = cv2.resize(frame, (640, 480))
    results = model(frame, stream=True)
    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cls = model.names[int(box.cls[0])]
            cv2.putText(frame, cls, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # Send to FFmpeg for re-streaming
    ffmpeg_process.stdin.write(frame.tobytes())

cap.release()
ffmpeg_process.stdin.close()