from flask_login import LoginManager, UserMixin, \
    login_required, login_user, logout_user
from flask import *
from config import *
from db import *
from random import *
import string
from flask_cors import cross_origin


# silly user model
class User(UserMixin):
    def __init__(self, id, email):
        self.id = id
        self.email = email

    def __repr__(self):
        return "%d" % (self.id)


class MyLoginManager():
    def __init__(self, app, db, eng):
        self.db = db
        self.eng = eng
        self.login_manager = LoginManager()
        self.login_manager.init_app(app)
        self.login_manager.login_view = "login"
        self.login_manager.user_loader(self.load_user)

    @cross_origin(supports_credentials=True)
    def login(self):
        if request.method == 'POST':
            req = request.get_json(force=True)
            email = req['email']
            password = req['password']

            r = self.eng.execute("SELECT * FROM users WHERE email='{}'"
                                 .format(email)).first()
            if not r is None:
                # user exists
                if r.password == password:
                    user = User(r.id, r.email)
                    login_user(user)
                    return jsonify({"status":"ok","email":r.email}), 200
                else:
                    return jsonify({"status":"wrong password"}), 400
            else:
                # user doesn't exist
                return jsonify({"status":"no user"}), 404
        else:
            return jsonify({"status":"need to login"}), 401

    @cross_origin(supports_credentials=True)
    def new_user(self):
        req = request.get_json(force=True)
        email = req['email']
        password = req['password']

        #check whether user exists
        r = self.eng.execute("SELECT * FROM users WHERE email='{}'".format(email)).first()

        if not r is None:
            if r.password == password:  # existing user with correct password tried to register
                user = User(r.id, email)
                login_user(user)
                return jsonify({"status": "user logged", "email": email}), 200
            else:
                return jsonify({"status":"Email already exists"}), 400

        self.db.users.insert().values(email=email, password=password).execute()
        r = self.eng.execute("SELECT * FROM users WHERE email='{}'".format(email)).first()
        if r is None:
            #must not be
            return jsonify({"status": "unexpected error during registration", "email": email}), 500
        else:
            user = User(r.id, email)
            login_user(user)
            return jsonify({"status":"user registered","email":email}), 200

    @login_required
    @cross_origin(supports_credentials=True)
    def logout(self):
        logout_user()
        return jsonify({"status":"user logged out"}), 200

    # callback to reload the user object
    def load_user(self, userid):
        r = select([self.db.users]).where(self.db.users.c.id == userid).execute().fetchone()
        return User(r.id, r.email)
