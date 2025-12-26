import pickle
import numpy as np
from pathlib import Path

class FaceRecognitionService:
    def __init__(self):
        self.embeddings_path = Path("models/embeddings_database.pkl")
        self.embeddings_db = None
        self.noms_etudiants = []
        self.seuil_distance = 0.9
    
    def load_embeddings(self):
        if self.embeddings_db is None:
            if self.embeddings_path.exists():
                with open(self.embeddings_path, 'rb') as f:
                    data = pickle.load(f)
                    self.embeddings_db = data['embeddings']
                    self.noms_etudiants = data['noms_etudiants']
                    self.seuil_distance = data['seuil_distance']
    
    def recognize_face(self, embedding):
        """
        Reconnaissance par distance euclidienne.
        Pas de SVM, juste comparaison de similarité.
        """
        self.load_embeddings()
        
        if self.embeddings_db is None:
            return None, 0.0
        
        # Calculer distances avec TOUS les embeddings
        distances = np.linalg.norm(self.embeddings_db - embedding, axis=1)
        
        # Trouver le plus proche
        min_idx = np.argmin(distances)
        min_distance = distances[min_idx]
        
        # Vérifier le seuil
        if min_distance > self.seuil_distance:
            return None, 0.0
        
        # Récupérer le nom
        label = self.embeddings_db['labels'][min_idx] if 'labels' in self.embeddings_db else min_idx
        nom = self.noms_etudiants[label]
        
        # Calculer confiance (1 = identique, 0 = seuil)
        confidence = 1 - (min_distance / self.seuil_distance)
        
        return nom, confidence

face_service = FaceRecognitionService()