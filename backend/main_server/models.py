from config import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    user_name = db.Column(db.String(80), unique = False, nullable = False)
    password = db.Column(db.String(80), unique = False, nullable = False)
    email = db.Column(db.String(120), unique = True, nullable = False)
    
    def to_json(self):
        return {
            "id": self.id,
            "userName": self.user_name,
            "password": self.password,
            "email": self.email,
        }
    

