import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np

# 1. Setup the AI Task
base_options = python.BaseOptions(model_asset_path='face_detector.tflite')
options = vision.FaceDetectorOptions(base_options=base_options)
detector = vision.FaceDetector.create_from_options(options)

cap = cv2.VideoCapture(0)

print("Modern AI Engine Started. Press 'q' to quit.")

while cap.isOpened():
    success, frame = cap.read()
    if not success: break

    # 2. Convert frame to MediaPipe Image format
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)

    # 3. Detect Faces
    detection_result = detector.detect(mp_image)

    # 4. Logic for ACTIVE / AWAY
    if detection_result.detections:
        status_text = "STATUS: ACTIVE"
        color = (0, 255, 0) # Green
        
        # Draw a simple box for the first face detected
        for detection in detection_result.detections:
            bbox = detection.bounding_box
            cv2.rectangle(frame, (bbox.origin_x, bbox.origin_y), 
                          (bbox.origin_x + bbox.width, bbox.origin_y + bbox.height), 
                          color, 2)
    else:
        status_text = "STATUS: AWAY"
        color = (0, 0, 255) # Red

    # 5. UI Overlay
    cv2.putText(frame, status_text, (20, 70), 
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 3)
    
    cv2.imshow('PresenceMetrics AI Engine', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()