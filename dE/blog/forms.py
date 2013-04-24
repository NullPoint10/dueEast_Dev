from flask.ext.wtf import Form, TextField, TextAreaField, DateTimeField
from flask.ext.wtf import DataRequired,Length
from datetime import datetime

class BlogForm(Form):
	title = TextField('Title', [Length(max=75), DataRequired()])
	entry = TextAreaField('Entry',  [DataRequired()])
	date_created = DateTimeField('Date', format='%d/%m/%Y %H:%M:%S ')
