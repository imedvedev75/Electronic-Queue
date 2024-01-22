from flask import *
from flask_login import LoginManager, login_required, login_user, logout_user, current_user
import sys
import os
import configparser
my_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(my_path)
from config import *
from db import *
from login import MyLoginManager, User
import json
from utils import *
from flask_cors import CORS, cross_origin
from uuid import *
from flask_socketio import *
from time import *
import sys
from exceptions import *
from pyfcm import FCMNotification


class Server():

    def __init__(self):
        self.app = Flask(__name__)
        self.sio = SocketIO(self.app)

        CORS(self.app, supports_credentials=True)

        #init DB
        config = configparser.ConfigParser()
        config.read('config.ini')
        username = config['settings']['username']
        password = config['settings']['password']
        server = config['settings']['server']
        secret_key = config['settings']['secret_key']
        self.eng = create_engine(f'mysql+mysqldb://{username}:{password}!@{server}/eq?charset=utf8mb4', pool_pre_ping=True)
        self.metadata = MetaData(self.eng)
        self.db = DB(metadata=self.metadata)

        #init login manager
        self.login_manager = MyLoginManager(self.app, self.db, self.eng)

        # config
        self.app.config.update(DEBUG=True, SECRET_KEY=secret_key)
        # socket IO
        self.sio.on_event('connect', self.onConnect)
        self.sio.on_event('disconnect', self.onDisconnect)
        self.sio.on_event('client-connected', self.onClientConnected)
        self.sio.on_event('client-disconnected', self.onClientDisconnected)
        #app routes
        self.app.route('/', methods=['GET'])(self.home)
        self.app.route('/home', methods=['POST'])(self.home)
        self.app.route('/join', methods=['POST'])(self.join)
        self.app.route('/leave', methods=['POST'])(self.leave)
        self.app.route('/get_queue', methods=['POST'])(self.get_queue)
        self.app.route('/status', methods=['POST'])(self.status)
        self.app.route('/process', methods=['POST'])(self.process)
        self.app.route('/status_queue', methods=['POST'])(self.status_queue)
        self.app.route('/login', methods=['GET','POST'])(self.login_manager.login)
        self.app.route('/new_user', methods=['GET', 'POST'])(self.login_manager.new_user)
        self.app.route('/logout', methods=['GET'])(self.login_manager.logout)
        self.app.route('/get_my_queues', methods=['POST'])(self.get_my_queues)
        self.app.route('/add_queue', methods=['POST'])(self.add_queue)
        self.app.route('/update_queue', methods=['POST'])(self.update_queue)
        self.app.route('/reset_queue', methods=['POST'])(self.reset_queue)
        self.app.route('/delete_queue', methods=['POST'])(self.delete_queue)
        self.app.route('/check_login', methods=['GET'])(self.check_login)
        self.app.route('/search', methods=['POST'])(self.search)
        self.app.errorhandler(Exception)(self.handle_error)


    def execAndRetMulti(self, stmt):
        res = self.eng.execute(stmt)
        ret = []
        for r in res:
            ret.append(dict(r))
        return jsonify(ret), 200


    #@login_required
    #@cross_origin(supports_credentials=True)
    def home(self):
        return "Welcome to electronic queue", 200


    @cross_origin(supports_credentials=True)
    def search(self):
        data = request.get_json(force=True)
        lat = data["geo"]["lat"]
        longit = data["geo"]["longit"]
        dist = data["dist"]
        ret = self.eng.execute("SELECT name, queue_uuid, lat, longit FROM queues WHERE lat IS NOT NULL and longit IS NOT NULL")
        res = []
        for r in ret:
            if r.lat is not None and r.longit is not None:
                if distanceBetween(lat, longit, r.lat, r.longit) < dist:
                    res.append({"name":r.name, "queue_uuid":r.queue_uuid})
        return jsonify(res), 200


    @login_required
    @cross_origin(supports_credentials=True)
    def add_queue(self):
        data = request.get_json(force=True)
        self.eng.execute("INSERT INTO queues (name, queue_uuid, userid, ts, lat, longit) VALUES  \
                       ('{}', '{}', {}, {}, {}, {})".format(data["name"], uuid4().hex, current_user.id, getTS(),
                       data['latitude'], data['longitude']))
        return jsonify({}), 200


    @login_required
    @cross_origin(supports_credentials=True)
    def update_queue(self):
        data = request.get_json(force=True)
        self.eng.execute("UPDATE queues SET name='{}', lat={}, longit={} WHERE queue_uuid='{}'"
                             .format(data['name'], data['lat'], data['longit'], data['queue_uuid']))
        return jsonify({}), 200


    @login_required
    @cross_origin(supports_credentials=True)
    def reset_queue(self):
        data = request.get_json(force=True)
        self.eng.execute("DELETE FROM queue WHERE queue_uuid='{}'".format(data["queue_uuid"]))
        self.eng.execute("UPDATE queues SET curr_num=null, client_uuid=null, next_num=1 WHERE queue_uuid='{}'".format(data["queue_uuid"]))
        return jsonify({}), 200


    @login_required
    @cross_origin(supports_credentials=True)
    def delete_queue(self):
        data = request.get_json(force=True)
        self.eng.execute("DELETE FROM queues WHERE queue_uuid='{}'".format(data["queue_uuid"]))
        return jsonify({}), 200


    @login_required
    @cross_origin(supports_credentials=True)
    def check_login(self):
        return jsonify({}), 200


    @login_required
    @cross_origin(supports_credentials=True)
    def get_my_queues(self):
        return self.execAndRetMulti("SELECT name, queue_uuid FROM queues WHERE userid={}".format(current_user.id))


    def join(self):
        data = request.get_json(force=True)
        # check whether client is in the queue already
        stmt = "SELECT num FROM queue WHERE queue_uuid='{}' AND client_uuid='{}'"\
            .format(data['queue_uuid'], data['client_uuid'])
        ret = self.eng.execute(stmt).first()
        if ret is not None:    #client is in queue
            num = ret[0]
        else:
            conn = self.eng.connect()
            trans = conn.begin()
            try:
                #conn.execute("LOCK TABLES queue WRITE")
                stmt = "SELECT next_num FROM queues WHERE queue_uuid = '{}'".format(data['queue_uuid'])
                ret = conn.execute(stmt).first()
                num = ret.next_num
                ts = getTS()
                stmt = "INSERT INTO queue (queue_uuid, client_uuid, ts, num) VALUES  \
                       ('{}', '{}', {}, {})".format(data["queue_uuid"], data["client_uuid"], ts, num)
                conn.execute(stmt)
                conn.execute("UPDATE queues SET next_num={} WHERE queue_uuid='{}'"
                             .format(num + 1, data['queue_uuid']))
                #conn.execute("UNLOCK TABLES")
            except Exception as ex:
                trans.rollback()
                conn.close()
                #conn.execute("UNLOCK TABLES")
                raise ex
            trans.commit()
            conn.close()
        return jsonify({'num':num}), 200

    def leave(self):
        data = request.get_json(force=True)
        self.eng.execute("DELETE FROM queue WHERE queue_uuid = '{}' AND client_uuid = '{}'".\
                         format(data['queue_uuid'], data['client_uuid']))
        return jsonify({}), 200

    def get_queue(self):
        data = request.get_json(force=True)
        stmt = "SELECT queue_uuid, name, curr_num, lat, longit FROM queues WHERE queue_uuid='{}'".format(data['queue_uuid'])
        ret = self.eng.execute(stmt).first()
        if ret is None: #no queue
            return jsonify({'message':'queue not found'}), 404
        else:
            return jsonify(dict(ret)), 200

    @cross_origin(supports_credentials=True)
    def status(self):
        data = request.get_json(force=True)
        stmt = "SELECT curr_num, client_uuid FROM queues WHERE queue_uuid='{}'".format(data['queue_uuid'])
        ret = self.eng.execute(stmt).first()
        if ret is None: #haven't found the queue
            return jsonify({'message':'queue not found'}), 404
        #check whether client still in queue
        stmt = "SELECT num FROM queue WHERE queue_uuid = '{}' AND client_uuid = '{}'".\
            format(data['queue_uuid'], data['client_uuid'])
        ret2 = self.eng.execute(stmt).first()
        num = ret2.num if ret2 != None else None
        your_turn = False
        if ret.client_uuid==data['client_uuid']:
            your_turn = True
            num = ret.curr_num
        return jsonify({'curr_num':ret.curr_num, 'your_turn': your_turn, 'num':num}), 200

    @cross_origin(supports_credentials=True)
    def status_queue(self):
        data = request.get_json(force=True)
        stmt = "SELECT curr_num FROM queues WHERE queue_uuid='{}'".format(data['queue_uuid'])
        ret = self.eng.execute(stmt).first()
        if ret is None: #haven't found the queue
            return jsonify({'message':'queue not found'}), 404
        #check how many numbers still in queue
        stmt = "SELECT count(num) as count_num FROM queue WHERE queue_uuid = '{}'".\
            format(data['queue_uuid'])
        ret2 = self.eng.execute(stmt).first()
        count_num = ret2.count_num if ret2 != None else None
        return jsonify({'curr_num':ret.curr_num, 'count_num':count_num}), 200


    def process(self):
        data = request.get_json(force=True)
        ret = self.eng.execute("SELECT num, client_uuid FROM queue WHERE queue_uuid='{}' ORDER BY num"
                         .format(data['queue_uuid'])).first()
        if ret.num is not None:
            conn = self.eng.connect()
            ret2 = conn.execute("SELECT sid FROM queue WHERE queue_uuid='{}'".format(data['queue_uuid']))
            trans = conn.begin()
            try:
                conn.execute("DELETE FROM queue WHERE queue_uuid='{}' AND num={}".format(data['queue_uuid'], ret.num))
                conn.execute("UPDATE queues SET curr_num={}, client_uuid='{}' WHERE queue_uuid='{}'"
                                 .format(ret.num, ret.client_uuid, data['queue_uuid']))
            except Exception as ex:
                trans.rollback()
                conn.close()
                raise ex
            trans.commit()
            conn.close()
            for r in ret2:
                self.sio.emit("status", None, room=r.sid)

        return jsonify({'num_to_process':ret.num}), 200


    def get_chats(self):
        data = request.get_json(force=True)
        uuids = "'" + "','".join(data["wish_uuids"]) + "'"
        stmt_sel = "SELECT c.wish_text, c.starter_nick, c.chat_uuid, c.inbox_uuid, c.outbox_uuid FROM chats c \
               LEFT JOIN wishes w ON (w.uuid=c.wish_uuid) WHERE w.uuid IN ({})\
               ORDER BY ts DESC".format(uuids)
        r = self.eng.execute(stmt_sel)
        chats = []
        chat_uuids = []
        for c in r:
            chat_uuids.append(c.chat_uuid)
            chats.append(dict(c))
        chat_uuids = "','".join(chat_uuids)
        self.eng.execute("DELETE FROM chats WHERE chat_uuid IN ('{}')".format(chat_uuids))   #delete all chats
        return jsonify({"chats":chats}), 200


    def del_chat(self):
        data = request.get_json(force=True)
        self.eng.execute("DELETE FROM chats WHERE chat_uuid='{}'".format(data["chat_uuid"]))
        return jsonify({}), 200

    @login_required
    @cross_origin(supports_credentials=True)
    def my_wishes(self):
        r = select([self.db.wishes])\
            .where(self.db.wishes.c.user_id == current_user.id) \
            .order_by(self.db.wishes.c.ts.desc()).execute().fetchall()
        wishes = []
        for w in r:
            wishes.append({"id":w.id, "wish_title": w.title, "text":w.text, "price":w.price})
        params = {"wishes":wishes}
        return jsonify(wishes), 200

    @login_required
    @cross_origin(supports_credentials=True)
    def inbox(self):
        folder = request.args.get('folder')
        messages = []

        if not folder in ["received", "sent"]:
            return jsonify(messages), 200

        stmt = "SELECT i.id, i.text, i.user_id, i.from_id, i.wish_id, u.nickname as 'to_nickname', uu.nickname as " \
               "'from_nickname', w.title \
                  from (inbox i) \
                  LEFT  JOIN users u ON (i.user_id=u.id) \
                  LEFT  JOIN users uu ON (i.from_id=uu.id) \
                  LEFT  JOIN wishes w ON (i.wish_id=w.id) "
        if folder=="received":
            stmt += "WHERE i.user_id=" + str(current_user.id)
        elif folder=="sent":
            stmt += "WHERE i.from_id=" + str(current_user.id)
        stmt += " ORDER BY i.ts DESC"
        r = self.eng.execute(stmt)
        for m in r:
            recip_id = m.from_id if folder=="received" else m.user_id
            recip_nickname = m.from_nickname if folder == "received" else m.to_nickname
            messages.append({"id": m.id, "recip_id": recip_id, "recip_nickname": recip_nickname,
                             "text": m.text, "wish_title": m.title, "wish_id": m.wish_id})
        return jsonify(messages), 200


    @login_required
    @cross_origin(supports_credentials=True)
    def read_message(self):
        id = int(request.args.get('id'))

        if id <= 0:
            return jsonify({"status":"wrong id"}), 200

        stmt = "UPDATE inbox SET isread=1 WHERE id=" + str(id)
        self.eng.execute(stmt)
        return jsonify({"status":"message read"}), 200


    @login_required
    @cross_origin(supports_credentials=True)
    def num_unread(self):
        stmt = "SELECT COUNT(*) FROM inbox WHERE user_id={} AND isread=0".format(current_user.id)
        r = self.eng.execute(stmt)
        for c in r:
            return jsonify({"num_unread":c[0]}), 200


    #@login_required
    #@cross_origin(supports_credentials=True)
    def new_wish(self):
        data = request.get_json(force=True)

        if data["id"] == -1:
            uid = uuid4().hex
            uid_admin = uuid4().hex
            ts = getTS()
            print("new wish uuid: " + uid)
            stmt = "INSERT INTO wishes (text, price, nickname, email, user_uuid, uuid, admin_uuid, ts) VALUES  \
                   ('{}', '{}', '{}', '{}', '{}', '{}', '{}', {})".format(data["text"], data["price"], data["nickname"],
                    data["email"], data["user_uuid"], uid, uid_admin, ts)
            self.eng.execute(stmt)
            ret = {"admin_uuid": uid_admin, "wish_uuid":uid, "ts":ts}
            return jsonify(ret), 200
        else:
            self.db.wishes.update().where((self.db.wishes.c.id==data["id"]) and (self.db.wishes.c.user_id==current_user.id)).\
                values(text=data["text"], title=data["title"], price=data["price"]).execute()
        return jsonify({"status":"wish added/updated"}), 200


    def get_wish(self):
        data = request.get_json(force=True)
        uuids = data["uuid"].split(';')
        uuids = ["'" + uuid + "'" for uuid in uuids]
        inClause = ",".join(uuids)
        stmt = "SELECT * FROM wishes WHERE admin_uuid IN (" + inClause + ")"
        r = self.eng.execute(stmt)
        wishes = [{"nickname": w.nickname, "text": w.text, "price": w.price} for w in r]
        return jsonify(wishes), 200


    @login_required
    @cross_origin(supports_credentials=True)
    def del_wish(self):
        data = request.get_json(force=True)
        id = data["id"]
        self.db.wishes.delete().where(self.db.wishes.c.id == data["id"]).execute()
        return jsonify({"status":"wish deleted"}), 200


    @login_required
    @cross_origin(supports_credentials=True)
    def del_message(self):
        data = request.get_json(force=True)
        id = data["id"]
        self.db.inbox.delete().where(self.db.inbox.c.id == data["id"]).execute()
        return jsonify({"status":"message deleted"}), 200


    def new_chat(self):
        data = request.get_json(force=True)
        new_chat_uuid = uuid4().hex
        inbox_uuid = uuid4().hex
        outbox_uuid = uuid4().hex
        conn = self.eng.connect()
        trans = conn.begin()
        try:
            stmt = "INSERT INTO chats (wish_uuid, chat_uuid, starter_nick, inbox_uuid, outbox_uuid, wish_text) \
                   VALUES ('{}', '{}', '{}', '{}', '{}', '{}')".format(data["wish_uuid"], new_chat_uuid, data["starter_nick"],
                    inbox_uuid, outbox_uuid, data["wish_text"])
            conn.execute(stmt)
            ts = getTS()
            stmt = "INSERT INTO messages (text, chat_uuid, box_uuid, ts) VALUES ('{}', '{}', '{}', {})".format(
                data["message_text"], new_chat_uuid, outbox_uuid, ts)
            conn.execute(stmt)
        except Exception as ex:
            trans.rollback()
            conn.close()
            raise ex
        trans.commit()
        conn.close()
        self.pingNewMessage(data["wish_uuid"], data["message_text"])
        return jsonify({"chat_uuid": new_chat_uuid, "inbox_uuid":inbox_uuid,
                                "outbox_uuid":outbox_uuid, "ts":ts}), 200


    def find_chat(self):
        data = request.get_json(force=True)
        r = self.eng.execute("SELECT uuid from chats WHERE wish_uuid='{}' and (part1_uuid='{}' OR part2_uuid='{}')"
                .format(data["wish_uuid"], data["user_uuid"], data["user_uuid"])).first()
        chat_uuid = ""
        if not r is None:
            chat_uuid = r.chat_uuid
        return jsonify({"chat_uuid": chat_uuid}), 200


    def get_chat(self):
        data = request.get_json(force=True)
        chat = self.eng.execute("SELECT * from chats WHERE uuid='{}'".format(data["chat_uuid"])).first()
        chat_uuid = ""
        messages = []
        if not chat is None:
            chat_uuid = chat.uuid
            r_mess = self.eng.execute("SELECT * from messages WHERE chat_uuid='{}'".format(chat_uuid))
            messages = [dict(m) for m in r_mess]
        return jsonify({"chat": dict(chat), "messages": messages}), 200


    def get_userID(self):
        data = request.get_json(force=True)
        stmt1 = "SELECT id FROM users WHERE uuid='{}'".format(data["uuid"])
        user_id = self.eng.execute(stmt1).first()
        if user_id is None:
            stmt2 = "INSERT INTO users (uuid) VALUES ('{}')".format(data["uuid"])
            self.eng.execute(stmt2)
            user_id = self.eng.execute(stmt1).first()
        return jsonify({"userID": user_id.id}), 200


    def send_message(self):
        ts = getTS()
        data = request.get_json(force=True)
        image_file = ""
        if "image" in data.keys():
            image_file = uuid4().hex
            with open('images/'+image_file, 'wb') as f:
                f.write(bytes([x+128 for x in data["image"]]))
        stmt = "INSERT INTO messages (text, box_uuid, chat_uuid, ts, image_file) VALUES ('{}', '{}', '{}', {}, '{}')"\
            .format(data["text"], data["box_uuid"], data["chat_uuid"], ts, image_file)
        self.eng.execute(stmt)
        self.pingNewMessage(data["box_uuid"], data["text"])
        return jsonify({"ts":ts}), 200


    def addMessageImages(self, msgs):
        for msg in msgs:
            if msg["image_file"]:
                with open("images/"+msg["image_file"], 'rb') as f:
                    lst = list(f.read())
                    msg["image"] = [x - 128 for x in lst]


    def deleteImageFiles(self, msgs):
        for msg in msgs:
            try:
                os.remove('images/' + msg["image_file"])
                print("File deleted: ", msg["image_file"])
            except Exception as ex:
                print("Error deleting file: ", msg["image_file"])


    def get_new_messages(self):
        data = request.get_json(force=True)
        box_uuids = "','".join(data["box_uuids"])
        conn = self.eng.connect()
        trans = conn.begin()
        try:
            stmt = "SELECT * from messages WHERE box_uuid in ('{}')".format(box_uuids)
            r = conn.execute(stmt)
            conn.execute("DELETE FROM messages WHERE box_uuid in ('{}')".format(box_uuids))
            msgs = [dict(m) for m in r]
            self.addMessageImages(msgs)
        except Exception as ex:
            trans.rollback()
            conn.close()
            raise ex
        trans.commit()
        conn.close()
        self.deleteImageFiles(msgs)
        return jsonify({"messages":msgs}), 200


    def get_new_data(self):
        data = request.get_json(force=True)
        box_uuids = data["box_uuids"]
        stmt_sel = "SELECT * FROM chats c WHERE c.wish_uuid IN ('{}')".\
            format("','".join(data["wish_uuids"]))
        conn = self.eng.connect()
        trans = conn.begin()
        try:
            r = conn.execute(stmt_sel)
            chats = []
            chat_uuids = []
            for c in r:
                chat_uuids.append(c.chat_uuid)
                box_uuids.append(c.outbox_uuid)
                chats.append(dict(c))
            chat_uuids = "','".join(chat_uuids)
            conn.execute("DELETE FROM chats WHERE chat_uuid IN ('{}')".format(chat_uuids))   #delete all chats
            #get all new messages
            box_uuids = "','".join(box_uuids)
            stmt = "SELECT * from messages WHERE box_uuid in ('{}')".format(box_uuids)
            r = conn.execute(stmt)
            conn.execute("DELETE FROM messages WHERE box_uuid in ('{}')".format(box_uuids))
            msgs = [dict(m) for m in r]
            self.addMessageImages(msgs)
        except Exception as ex:
            trans.rollback()
            conn.close()
            raise ex
        trans.commit()
        conn.close()
        self.deleteImageFiles(msgs)
        return json.dumps({"chats":chats, "messages":msgs}), 200


    def handle_error(self, ex):
        print("Error type: ", type(ex), ", error: ", ex)
        response = jsonify({"type":str(type(ex)), "message":str(ex)})
        response.status_code = 500
        return response


    def onUuids(self, message):
        uuids = message.split(',')
        for uuid in uuids:
            self.eng.execute("INSERT INTO sockets (uuid, sid) VALUES ('{}', '{}')".format(uuid, request.sid))
            #self.socket_dict[uuid] = request.sid


    def sendSocketMessage(self, uuid, type, text):
        ret = self.eng.execute("SELECT sid FROM sockets WHERE uuid='{}'".format(uuid))
        for r in ret:
            self.sio.emit(type, text, room=r.sid)


    def onStartTyping(self, box_uuid):
        self.sendSocketMessage(box_uuid, "startTyping", "")
        #if box_uuid in self.socket_dict:
        #    self.sio.emit("startTyping", "", room=self.socket_dict[box_uuid])


    def onStopTyping(self, box_uuid):
        self.sendSocketMessage(box_uuid, "stopTyping", "")
        #if box_uuid in self.socket_dict:
        #    self.sio.emit("stopTyping", "", room=self.socket_dict[box_uuid])


    def onConnect(self):
        print("connect request from {}".format(request.sid))


    def onDisconnect(self):
        print("disconnect request from {}".format(request.sid))


    def onClientConnected(self, client_uuid):
        print('onClientConnected', client_uuid)
        self.eng.execute("UPDATE queue SET sid='{}' WHERE client_uuid='{}'"
                         .format(request.sid, client_uuid))


    def onClientDisconnected(self, client_uuid):
        self.eng.execute("UPDATE queue SET sid=NULL WHERE client_uuid='{}'"
                         .format(client_uuid))


    def pingNewChat(self, uuid):
        self.sendSocketMessage(uuid, "newChat", "")
        #if uuid in self.socket_dict:
        #    self.sio.emit("newChat", "", room=self.socket_dict[uuid])


    def pingNewMessage(self, uuid, text):
        self.sendSocketMessage(uuid, "newMessage", text)
        #if uuid in self.socket_dict:
        #    self.sio.emit("newMessage", text, room=self.socket_dict[uuid])


    def run(self):
        #self.sio.run(host="0.0.0.0", port=5002)
        if "HETZNER" in os.environ:
            print('running on server')
            self.sio.run(self.app, host='0.0.0.0', port=5002, debug=True, use_reloader=True,
                    certfile='/etc/letsencrypt/live/www.a-i-m.tech/fullchain.pem',
                    keyfile='/etc/letsencrypt/live/www.a-i-m.tech/privkey.pem')
        else:
            print('running locally')
            self.sio.run(self.app, host='0.0.0.0', port=5002, debug=True, use_reloader=True,
                     certfile='cert/cert.pem', keyfile='cert/key.pem')


#if __name__ == "__main__":
serv = Server()
application = serv.app
serv.run()
import pydevd
sys.path.append('pycharm-debug-py3k.egg')
os.environ["PYCHARM_DEBUG"] = "TRUE"
#pydevd.settrace('localhost', port=5001, stdoutToServer=True, stderrToServer=True)