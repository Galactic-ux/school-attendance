import sys
import base64
import numpy as np
import face_recognition
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

def recognize_face(image_data, class_id):
    try:
        mongo_uri = os.getenv("MONGO_URI")
        client = MongoClient(mongo_uri)
        db = client.get_database()
        students_collection = db.students

        # Get all students in the class with face encodings
        students = list(students_collection.find({"classId": ObjectId(class_id), "faceEncoding": {"$exists": True}}))
        
        if not students:
            print("No students with face encodings found in this class.")
            return

        known_face_encodings = [np.array(s["faceEncoding"]) for s in students]
        known_face_ids = [s["_id"] for s in students]

        # Decode the base64 image data
        image_data = image_data.split(",")[1]
        image_bytes = base64.b64decode(image_data)
        
        temp_image_path = "temp_recognition_image.jpg"
        with open(temp_image_path, "wb") as f:
            f.write(image_bytes)
        
        unknown_image = face_recognition.load_image_file(temp_image_path)
        unknown_encodings = face_recognition.face_encodings(unknown_image)

        os.remove(temp_image_path)

        if len(unknown_encodings) > 0:
            unknown_encoding = unknown_encodings[0]
            matches = face_recognition.compare_faces(known_face_encodings, unknown_encoding)
            
            if True in matches:
                first_match_index = matches.index(True)
                matched_student_id = known_face_ids[first_match_index]
                print(f"MATCH:{matched_student_id}")
            else:
                print("NOMATCH")
        else:
            print("NOFACE")

    except Exception as e:
        print(f"Error recognizing face: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python face_recognize.py <image_data> <class_id>")
        sys.exit(1)

    image_data_arg = sys.argv[1]
    class_id_arg = sys.argv[2]
    recognize_face(image_data_arg, class_id_arg)
