from flask import request, jsonify
from config import app, db
from models import User
from war_game import war_bp
from rooms import rooms_bp
from playground import playground_bp

app.register_blueprint(war_bp)
app.register_blueprint(rooms_bp)
app.register_blueprint(playground_bp)


@app.route("/logout", methods=["POST"])
def logout():
    id = request.json.get("id")

    if not id:
        return jsonify({"message": "You must include a user ID"}), 400

    user = User.query.get(id)

    if not user:
        return jsonify({"message": "User not found"}), 404

    user.logged_in = False
    db.session.commit()

    return jsonify({"message": "Logout successful"}), 200


@app.route("/login", methods=["POST"])
def login():
    userName = request.json.get("userName", "")
    password = request.json.get("password", "")

    if userName == "":
        return jsonify({"message": "You must include a user name"}), 400
    elif password == "":
        return jsonify({"message": "You must include a password"}), 400

    user = User.query.filter_by(user_name=userName).first()

    if not user or user.password != password:
        return jsonify({"message": "Invalid credentials"}), 401

    user.logged_in = True
    db.session.commit()

    return jsonify({"message": "Login successful", "user": user.to_json()}), 200


@app.route("/signup", methods=["POST"])
def create_user():
    user_name = request.json.get("userName")
    password = request.json.get("password")
    email = request.json.get("email")

    if not user_name:
        return (
            jsonify({"message": "You must include a user name"}),
            400,
        )
    elif not email:
        return (
            jsonify({"message": "You must include an email"}),
            400,
        )
    elif not password:
        return (
            jsonify({"message": "You must create a password"}),
            400,
        )
    
    new_user = User(user_name=user_name,password=password,email=email,logged_in=True)
    
    try:
        db.session.add(new_user)
        db.session.commit()

    except Exception as e:
        return jsonify({"message": str(e)}), 400
        
    return jsonify({"message": "User created!", "user": new_user.to_json()}), 201





# @app.route("/get_user/<string:email>", methods=["GET"])
# def get_user(email):
#     user = User.query.filter_by(email=email).first()
#     if not user:
#         return jsonify({"message": "User not found"}), 404
#     return jsonify({"user": user.to_json()}), 200



# @app.route("/get_users", methods=["GET"])
# def get_users():
#     users = User.query.all()
#     json_users = list(map(lambda x: x.to_json(), users))
#     return jsonify({"users": json_users})


@app.route("/update_user/<int:user_id>",methods=["PATCH"])
def update_user(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.json
    user.user_name = data.get("userName", user.user_name)
    user.password = data.get("password", user.password)
    user.email = data.get("email", user.email)

    db.session.commit()

    return jsonify({"message": "User updated"}), 201


@app.route("/delete_user/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User has been deleted"}), 200


if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(debug = True)

