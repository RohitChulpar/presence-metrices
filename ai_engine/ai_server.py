from flask import Flask, jsonify
from flask_cors import CORS
import cv2
import threading
import mediapipe as mp
import time
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from pynput import keyboard, mouse  # Added mouse for global tracking

app = Flask(__name__)
CORS(app)

presence_status = {"status": "OFFLINE"}
is_running = False

# --- GLOBAL ACTIVITY TRACKING (Keyboard + Mouse) ---
global_activity_score = 0

# Function to catch keystrokes
def on_press(key):
    global global_activity_score
    global_activity_score += 1

# Function to catch mouse movement
def on_move(x, y):
    global global_activity_score
    global_activity_score += 1

# Function to catch mouse clicks
def on_click(x, y, button, pressed):
    if pressed:
        global global_activity_score
        global_activity_score += 1

# Start the listeners in background threads
key_listener = keyboard.Listener(on_press=on_press)
mouse_listener = mouse.Listener(on_move=on_move, on_click=on_click)

key_listener.start()
mouse_listener.start()

# --- MEDIAPIPE AI SETUP ---
base_options = python.BaseOptions(model_asset_path='face_landmarker.task')
options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=1)
detector = vision.FaceLandmarker.create_from_options(options)

def run_vision():
    global presence_status, is_running
    cap = cv2.VideoCapture(0)
    
    while is_running:
        success, frame = cap.read()
        if not success: break

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        detection_result = detector.detect(mp_image)

        if detection_result.face_landmarks:
            presence_status["status"] = "ACTIVE"
        else:
            presence_status["status"] = "AWAY"

        cv2.imshow('PresenceMetrics AI Core', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'): break
            
    cap.release()
    cv2.destroyAllWindows()
    presence_status["status"] = "OFFLINE"

@app.route('/start-ai', methods=['GET'])
def start_ai():
    global is_running
    if not is_running:
        is_running = True
        threading.Thread(target=run_vision, daemon=True).start()
    return jsonify({"message": "AI Started"})

@app.route('/stop-ai', methods=['GET'])
def stop_ai():
    global is_running
    is_running = False
    return jsonify({"message": "AI Stopped"})

@app.route('/get-status', methods=['GET'])
def get_status():
    global global_activity_score
    # We return the sum of all keyboard and mouse interactions
    data = {
        "status": presence_status["status"], 
        "activity": global_activity_score
    }
    # Reset score after each poll so the Manager sees real-time "intensity"
    global_activity_score = 0 
    return jsonify(data)

if __name__ == '__main__':
    app.run(port=5001)