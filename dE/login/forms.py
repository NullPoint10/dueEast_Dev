from flask.ext.wtf import Form, TextField, TextAreaField, DateField,PasswordField
from flask.ext.wtf import DataRequired,Length
import datetime

from wtforms.ext.csrf.session import SessionSecureForm

	
class LoginForm(Form):
	username = TextField('Username', [DataRequired()])
	password = PasswordField('Password', [DataRequired()])
	