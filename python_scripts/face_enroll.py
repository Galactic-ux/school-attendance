import sys
import base64
import numpy as np
import face_recognition
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def enroll_face(image_data, student_id):
    """
    Enrolls a face by saving its encoding to the database.
    """
    try:
        # Get MongoDB connection string from environment variables
        mongo_uri = os.getenv("MONGO_URI")
        if not mongo_uri:
            print("Error: MONGO_URI not found in .env file")
            return

        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        db = client.get_database()
        students_collection = db.students

        # Decode the base64 image data
        image_data = image_data.split(",")[1]
        image_bytes = base64.b64decode(image_data)
        
        # Create a temporary file to store the image
        temp_image_path = f"temp_image_{student_id}.jpg"
        with open(temp_image_path, "wb") as f:
            f.write(image_bytes)
        
        # Load image using face_recognition library
        image = face_recognition.load_image_file(temp_image_path)
        
        # Find face encodings
        face_encodings = face_recognition.face_encodings(image)

        if len(face_encodings) > 0:
            # Take the first face found
            encoding = face_encodings[0]

            # Log the face encoding data
            print("Face encoding data:", encoding.tolist())

            # Update the student document with the face encoding
            students_collection.update_one(
                {"_id": ObjectId(student_id)},
                {"$set": {"faceEncoding": encoding.tolist()}}
            )
            print(f"Successfully enrolled face for student {student_id}")
        else:
            print("No face found in the image")

        # Clean up the temporary image file
        os.remove(temp_image_path)

    except Exception as e:
        print(f"Error enrolling face: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python face_enroll.py <image_data> <student_id>")
        sys.exit(1)

    image_data_arg = sys.argv[1]
    student_id_arg = sys.argv[2]
    enroll_face(image_data_arg, student_id_arg)
