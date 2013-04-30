from flask import Flask, render_template 
from flask_markdown import Markdown
from custom_jinja_templates import custom_templates

from home_page.views import home_module
from blog.views import blog_module
from admin.views import admin_module
from login.views import login_module



def create_app(config):    
	'''This initialises the app and import the custom jinja templates. It also adds support 
		for Markdown text to HTML syntax.
	
	Finally imports the bluerpints and defines the error handling templates
	
	'''
	app = Flask('dE')
	app.config.from_object(config)
	
	custom_templates(app)

	Markdown(app)

	

	app.register_blueprint(home_module, url_prefix="/")
	app.register_blueprint(admin_module, url_prefix="/admin")
	app.register_blueprint(login_module, url_prefix="/login")
	app.register_blueprint(blog_module, url_prefix="/blog")


	@app.errorhandler(404)
	def page_not_found(e):
		return render_template('404.html'), 404
	
	@app.errorhandler(500)
	def page_not_found(e):
		return render_template('500.html'), 500
		
	@app.route('/error/')
	def error_msg():
		return  render_template('error.html')
		
	return app

