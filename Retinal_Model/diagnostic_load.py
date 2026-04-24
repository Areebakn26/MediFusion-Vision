import tensorflow as tf
import traceback
import os

model_path = 'efficientnetb3-Eye Disease-91.47.h5'

print("TensorFlow Version:", tf.__version__)
print("Checking file presence:", os.path.exists(model_path))

try:
    print("Attempting to load model...")
    model = tf.keras.models.load_model(model_path, compile=False)
    print("✅ Success! Model loaded.")
    model.summary()
except Exception as e:
    print("❌ FAILED to load model.")
    traceback.print_exc()
