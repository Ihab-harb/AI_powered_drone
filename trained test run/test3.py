import cv2
from ultralytics import YOLO
import argparse

def parse_arguments():
    parser = argparse.ArgumentParser(description='YOLOv8 Live Detection')
    parser.add_argument('--weights', type=str, default='best.pt', help='C:\\Users\\Moe\\Desktop\\runs\\runs')
    parser.add_argument('--yaml', type=str, default='args.yaml', help='C:\\Users\\Moe\\Desktop\\runs\\runs')
    parser.add_argument('--source', type=str, default='wide_both.mp4', help='C:\\Users\\Moe\\Desktop\\videoss')
    parser.add_argument('--conf', type=float, default=0.5, help='0.6')
    parser.add_argument('--save', action='store_true', help='save output video')
    return parser.parse_args()

def main():
    args = parse_arguments()
    
    # Load model
    model = YOLO(args.weights)
    
    # Open video source
    cap = cv2.VideoCapture(int(args.source) if args.source.isdigit() else cv2.VideoCapture(args.source))
    if not cap.isOpened():
        print("Error opening video stream")
        return
    
    # Video writer setup if saving
    if args.save:
        frame_width = int(cap.get(3))
        frame_height = int(cap.get(4))
        out = cv2.VideoWriter('output.mp4', cv2.VideoWriter_fourcc(*'mp4v'), 30, (frame_width, frame_height))
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Perform detection
        results = model(frame, conf=args.conf)
        
        # Display results
        annotated_frame = results[0].plot()
        cv2.imshow("YOLOv8 Detection", annotated_frame)
        
        # Save frame if enabled
        if args.save:
            out.write(annotated_frame)
        
        # Exit on 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    # Cleanup
    cap.release()
    if args.save:
        out.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()