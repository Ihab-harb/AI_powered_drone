import cv2
from ultralytics import YOLO
import argparse
import os

def parse_arguments():
    parser = argparse.ArgumentParser(description='YOLOv8 Live Detection')
    parser.add_argument('--weights', type=str, default='best.pt', 
                       help='C:\\Users\\Moe\\Desktop\\new trained\\train7\\weights\\best.pt')
    parser.add_argument('--yaml', type=str, default='args.yaml', 
                       help='C:\\Users\\Moe\\Desktop\\new trained\\train7\\args.yaml')
    parser.add_argument('--source', type=str, default='0', 
                       help='0')
    parser.add_argument('--conf', type=float, default=0.5, 
                       help='confidence threshold for detection')
    parser.add_argument('--save', action='store_true', 
                       help='save output video')
    parser.add_argument('--output', type=str, default='output.mp4', 
                       help='output video filename when saving')
    return parser.parse_args()

def main():
    args = parse_arguments()
    
    # Validate paths
    if not os.path.exists(args.weights):
        raise FileNotFoundError(f"Weights file not found: {args.weights}")
    if args.yaml and not os.path.exists(args.yaml):
        print(f"Warning: YAML file not found: {args.yaml}")
    
    try:
        # Load model
        model = YOLO(args.weights)
        
        # Open video source
        cap = cv2.VideoCapture(int(args.source) if args.source.isdigit() else args.source)
        if not cap.isOpened():
            raise IOError(f"Cannot open video source: {args.source}")
        
        # Video writer setup if saving
        if args.save:
            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            if fps <= 0:
                fps = 30  # default fps if not available
            
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(args.output, fourcc, fps, (frame_width, frame_height))
        
        print("Starting detection... Press 'q' to quit.")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Video ended or error reading frame.")
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
    
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        # Cleanup
        if 'cap' in locals() and cap.isOpened():
            cap.release()
        if args.save and 'out' in locals():
            out.release()
        cv2.destroyAllWindows()
        print("Resources released.")

if __name__ == "__main__":
    main()