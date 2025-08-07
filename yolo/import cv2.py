import cv2
import subprocess
from ultralytics import YOLO

# Initialize YOLOv8 model
model = YOLO("yolov8n.pt")  # Use yolov8n.pt for best performance

# HTTP Streaming Setup
HTTP_CMD = [
    'C:\\ffmpeg-2025-05-07-git-1b643e3f65-full_build\\bin\\ffmpeg.exe',  # Full path to ffmpeg
    '-f', 'rawvideo',              # Input format
    '-vcodec', 'rawvideo',
    '-pix_fmt', 'bgr24',          # Matches OpenCV format
    '-s', '640x480',              # Resolution
    '-r', '15',                   # FPS
    '-i', '-',                    # Read from stdin
    '-c:v', 'libx264',            # Output codec
    '-preset', 'ultrafast',       # Low latency
    '-tune', 'zerolatency',
    '-f', 'mpegts',               # HTTP streaming format
    'http://127.0.0.1:8080/yolov8'  # Output URL
]

# Start FFmpeg process
ffmpeg_process = subprocess.Popen(HTTP_CMD, stdin=subprocess.PIPE)

# Open camera stream (replace with your RTSP source if needed)
cap = cv2.VideoCapture(0)  # Webcam, or use "rtsp://..."

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Resize frame (optional)
    frame = cv2.resize(frame, (640, 480))
    
    # YOLOv8 Detection
    results = model(frame, stream=True)  # stream=True for video
    
    # Draw bounding boxes
    for r in results:
        boxes = r.boxes
        for box in boxes:
            # Extract box coordinates
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            # Draw rectangle
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            # Get class name and confidence
            cls_name = model.names[int(box.cls[0])]
            conf = float(box.conf[0])
            # Put text label
            label = f"{cls_name} {conf:.2f}"
            cv2.putText(frame, label, (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # Send frame to FFmpeg
    ffmpeg_process.stdin.write(frame.tobytes())

    # Display local preview (optional)
    #cv2.imshow('YOLOv8 Detection', frame)
  #  if cv2.waitKey(1) == ord('q'):
       # break

# Cleanup
cap.release()
cv2.destroyAllWindows()
ffmpeg_process.stdin.close()
ffmpeg_process.wait()