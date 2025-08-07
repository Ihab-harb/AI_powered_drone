from ultralytics import YOLO
import cv2
import subprocess
import sys
import time

model = YOLO("yolov8n.pt")
RTSP_INPUT = "rtsp://192.168.1.106:8554/stream"  # Your Pi's stream

def restart_ffmpeg():
    """Safely restart FFmpeg process"""
    global ffmpeg_process
    try:
        if 'ffmpeg_process' in globals():
            ffmpeg_process.stdin.close()
            ffmpeg_process.terminate()
            ffmpeg_process.wait(timeout=2)
    except:
        pass
    
    FFMPEG_CMD = [
        r'C:\ffmpeg-2025-05-07-git-1b643e3f65-full_build\bin\ffmpeg.exe',  # Absolute path recommended
        '-re',                        # Real-time streaming
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-pix_fmt', 'bgr24',
        '-s', '640x480',
        '-r', '15',
        '-i', '-',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-f', 'rtsp',
        '-rtsp_transport', 'tcp',     # Force TCP for reliability
        'rtsp://127.0.0.1:8554/yolov8_output'  # Use 127.0.0.1 instead of localhost
    ]
    return subprocess.Popen(FFMPEG_CMD, stdin=subprocess.PIPE)

ffmpeg_process = restart_ffmpeg()
cap = cv2.VideoCapture(RTSP_INPUT)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("RTSP input error - reconnecting...")
        cap.release()
        time.sleep(1)
        cap = cv2.VideoCapture(RTSP_INPUT)
        continue

    try:
        # Process frame
        frame = cv2.resize(frame, (640, 480))
        results = model(frame, stream=True)
        
        # Draw detections
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cls = model.names[int(box.cls[0])]
                conf = float(box.conf[0])
                cv2.putText(frame, f"{cls} {conf:.2f}", (x1, y1-10), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)

        # Send to FFmpeg
        ffmpeg_process.stdin.write(frame.tobytes())
        
    except (BrokenPipeError, OSError) as e:
        print(f"Stream error: {e} - restarting FFmpeg...")
        ffmpeg_process = restart_ffmpeg()
    except Exception as e:
        print(f"Fatal error: {e}")
        break

cap.release()
ffmpeg_process.stdin.close()
ffmpeg_process.terminate()