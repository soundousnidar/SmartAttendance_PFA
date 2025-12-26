import cv2
import numpy as np
from mtcnn import MTCNN
from keras_facenet import FaceNet

class EmbeddingExtractor:
    def __init__(self):
        self.mtcnn = MTCNN()
        self.facenet = FaceNet()
    
    def extract_from_image(self, image_bytes):
        # Décoder l'image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None
        
        # Détecter visage avec MTCNN
        try:
            detections = self.mtcnn.detect_faces(img)
        except Exception as e:
            print(f"MTCNN error: {e}")
            return None
        
        if not detections:
            return None
        
        # Prendre la détection avec la meilleure confiance
        best_detection = max(detections, key=lambda d: d['confidence'])
        
        if best_detection['confidence'] < 0.9:
            return None
        
        # Extraire bbox
        x, y, w, h = best_detection['box']
        
        # Vérifier que bbox est valide
        if w <= 0 or h <= 0:
            return None
        
        # S'assurer que bbox est dans l'image
        x = max(0, x)
        y = max(0, y)
        w = min(w, img.shape[1] - x)
        h = min(h, img.shape[0] - y)
        
        if w < 48 or h < 48:  # Taille minimale
            return None
        
        face = img[y:y+h, x:x+w]
        
        if face.size == 0:
            return None
        
        # Resize 160x160
        face_resized = cv2.resize(face, (160, 160))
        
        # BGR → RGB
        face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
        
        # Ajouter dimension batch
        face_batch = np.expand_dims(face_rgb, axis=0)
        
        # Extraire embedding
        embedding = self.facenet.embeddings(face_batch)[0]
        
        return embedding

extractor = EmbeddingExtractor()