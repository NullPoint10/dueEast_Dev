'''login view'''
from flask import Blueprint, render_template, url_for, redirect
from flask.views import MethodView
from forms import LoginForm
from google.appengine.api import users

import logging


login_module = Blueprint("login_module", __name__, template_folder="templates"
									, static_folder="static")

class LoginPage(MethodView):
	def __init__(self):
		tmp=1
		#self.form = LoginForm(csrf_enabled=False)
		
	def get(self):
		return redirect(users.create_login_url(dest_url='/admin', _auth_domain=None, federated_identity=None))
	
	'''def post(self):
		if self.form.validate():
			return redirect(url_for("admin.admin"))
		return redirect(url_for("admin.admin"))			
	'''	
login_module.add_url_rule('/', view_func=LoginPage.as_view('login_page')
									,methods=['GET',])

