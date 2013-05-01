'''Admin View'''
from datetime import datetime
from flask import flash, request, Blueprint, render_template, url_for, redirect
from flask.views import MethodView
from ..blog.models import BlogModel
from ..blog.forms import BlogForm
from google.appengine.api import users
from google.appengine.api import memcache

import logging


admin_module = Blueprint("admin_module", __name__, template_folder="templates"
									, static_folder="static")


#Check of admin is logged in on Google using the google python API
@admin_module.before_request
def restrict_url_to_admins():
	if not users.is_current_user_admin():
		error_msg  = ('User ' + str(users.get_current_user()) + 
					' is not registered as an Administrator. Please logout and ' +
					'enter you administrator credentials at the following link :')
		flash(error_msg)
		return render_template('admin/admin_login_error.html')


class AdminMain(MethodView):	
	def get(self):
		posts = BlogModel.query().order(-BlogModel.date_created)
		return render_template('admin/admin_main.html', posts=posts)



class AdminBlogAdd(MethodView):
	def __init__(self):
		self.blog_form = BlogForm()

	def get(self):	
		self.blog_form.date_created.data = datetime.now()
		msg = {'title_msg': 'Add blog post',  'button_msg' : 'Add post'}			
		return render_template('admin/blog_modify.html', form=self.blog_form, msg = msg)

	def post(self):
		DeleteMemCache()
		return blog_save(self)
		
class AdminBlogEdit(MethodView):
	def __init__(self):
		self.blog_form = BlogForm()

	def get(self, blog_key):	
		msg = {'title_msg': 'Edit blog post',  'button_msg' : 'Save Edits'}	
		return blog_fetch(self, msg, blog_key)
		
	def post(self,blog_key):
		DeleteMemCache()
		return blog_save(self,blog_key)

class AdminBlogDelete(MethodView):
	def __init__(self):
		self.blog_form = BlogForm()

	def get(self, blog_key):	
		msg = {'title_msg': 'Delete blog post',  'button_msg' : 'Confirm Delete'}	
		return blog_fetch(self, msg, blog_key)
		
	def post(self,blog_key):
		DeleteMemCache()
		if blog_key:
			self.blog_model = BlogModel.get_by_id(blog_key)
			self.blog_model.key.delete()
		return redirect(url_for(".admin"))



admin_module.add_url_rule('/', view_func=AdminMain.as_view('admin'),methods=['GET',])
admin_module.add_url_rule('/blog/add/', 
				view_func=AdminBlogAdd.as_view('admin_blog_add'), methods=['GET','POST'])									
admin_module.add_url_rule('/blog/edit/<int:blog_key>', 
				view_func=AdminBlogEdit.as_view('admin_blog_edit'), methods=['GET','POST'])											
admin_module.add_url_rule('/blog/delete/<int:blog_key>', 
				view_func=AdminBlogDelete.as_view('admin_blog_delete'), methods=['GET','POST'])											


def DeleteMemCache():
	memcache.delete('main_blog_page')

def blog_save(self, blog_key=None):
	if self.blog_form.validate():
		if blog_key:
			self.blog_model = BlogModel.get_by_id(blog_key)
			self.blog_form.populate_obj(self.blog_model)
		else:
			self.blog_model = BlogModel(title=self.blog_form.title.data, date_created=self.blog_form.date_created.data, 
													entry=self.blog_form.entry.data)
		self.blog_model.put()
		flash('Post successfully saved.')
		return redirect(url_for(".admin"))
	else:
		msg = {'title_msg': 'Edit blog post',  'button_msg' : 'Save Edits'}
		return render_template('admin/blog_modify.html', form=self.blog_form, msg=msg)	

def blog_fetch(self, msg, blog_key=None,):
	if blog_key:
		self.blog_model = BlogModel.get_by_id(blog_key)
		if not self.blog_model:
			error_msg  = 'The blog id ' + str(blog_key) +' is not valid. Please enter a valid id or return to home page.'
			flash(error_msg)
			return redirect(url_for('error_msg'))
			
		self.blog_form = BlogForm(obj = self.blog_model)
		
	return render_template('admin/blog_modify.html', form=self.blog_form, msg = msg)
							