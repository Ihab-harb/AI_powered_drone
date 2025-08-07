import cv2
from ultralytics import YOLO
import argparse
import os

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='YOLOv8 Video Detection')
    parser.add_argument(
        '--source', 
        type=str, 
        required=True,  # Force user to provide video path
        help='C:\\Users\\Moe\\Desktop\\videoss\\wide_both.mp4'
    )
    parser.add_argument(
        '--weights', 
        type=str, 
        default='best.pt',  # Default model if none specified
        help='C:\\Users\\Moe\\Desktop\\runs\\runs'
    )
    parser.add_argument(
        '--conf', 
        type=float, 
        default=0.5, 
        help='0.6'
    )
    parser.add_argument(
        '--save', 
        action='store_true', 
        help='Save output video to "output.mp4"'
    )
    return parser.parse_args()

def main():
    args = parse_arguments()
    
    # Validate video path
    if not os.path.exists(args.source):
        raise FileNotFoundError(f"Video file not found: {args.source}")
    
    # Load YOLOv8 model
    model = YOLO(args.weights)  
    
    # Open video file
    cap = cv2.VideoCapture(args.source)
    if not cap.isOpened():
        raise IOError(f"Could not open video: {args.source}")
    
    # Get video properties for saving output
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    # Video writer setup
    if args.save:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter('output.mp4', fourcc, fps, (frame_width, frame_height))
    
    print(f"Processing video: {args.source}")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break  # End of video
        
        # Run YOLOv8 inference
        results = model(frame, conf=args.conf)
        
        # Visualize results
        annotated_frame = results[0].plot()
        cv2.imshow("YOLOv8 Detection", annotated_frame)
        
        # Save frame if enabled
        if args.save:
            out.write(annotated_frame)
        
        # Exit on 'q' key
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    # Release resources
    cap.release()
    if args.save:
        out.release()
    cv2.destroyAllWindows()
    print("Processing complete!")

if __name__ == "__main__":
    main()