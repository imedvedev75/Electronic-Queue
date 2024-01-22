from flask.json import JSONEncoder
from datetime import date
from time import *

class MyJSONEncoder(JSONEncoder):

    def default(self, obj):
        try:
            if isinstance(obj, date):
                return mktime(obj.timetuple()) * 1000
            iterable = iter(obj)
        except TypeError:
            pass
        else:
            return list(iterable)
        return JSONEncoder.default(self, obj)