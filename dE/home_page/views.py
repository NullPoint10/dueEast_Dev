from flask import current_app, Blueprint, render_template, redirect, url_for
from flask.views import View

home_module = Blueprint("home_module", __name__, template_folder="templates", static_folder="static")

class HomepageView(View):
	def dispatch_request(self):
		return  redirect(url_for("blog_module.blog_main"),307)

class AboutView(View):
	def dispatch_request(self):
		return render_template('home_page/about.html')	
	
home_module.add_url_rule('/', view_func=HomepageView.as_view('index_page'))
home_module.add_url_rule('about', view_func=AboutView.as_view('about_page'))