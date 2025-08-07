from ultralytics import YOLO

# Load the YOLOv8 model
model = YOLO("yolov8n.pt")

# Perform detection on a video or webcam
results = model.predict(
    source= 0,  # or 0 for webcam
    show=True,  # Display results in real-time
    save=True,  # Save results to disk
    conf=0.5,   # Confidence threshold
)

print("Detection completed! Check 'runs/detect' for saved output.")