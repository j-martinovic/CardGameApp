from flask import request, jsonify
from config import app, db
from models import User

@app.route("/get_users", methods=["GET"])
def get_users():
    users = User.query.all()
    json_users = list(map(lambda x: x.to_json(), users))
    return jsonify({"users": json_users})


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
    
    new_user = User(user_name=user_name,password=password,email=email)
    
    try:
        db.session.add(new_user)
        db.session.commit()

    except Exception as e:
        return jsonify({"message": str(e)}), 400
        
    return jsonify({"message": "User created!"}), 201


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

