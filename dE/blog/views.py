from flask import Blueprint, render_template, flash, redirect, url_for
from flask.views import MethodView
from models import BlogModel
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.api import memcache
import logging


POSTS_PER_PAGE = 4

blog_module = Blueprint("blog_module", __name__, template_folder="templates",static_folder = "static")


'''The main blog view. This is what is visible to everyone'''
class BlogMain(MethodView):
	def get(self, curs):

		blog_page = memcache.get('main_blog_page')
		
		if blog_page is not None:
			logging.info('cache hit ----------------')
			return blog_page
		else:
			curs1 = Cursor(urlsafe = curs)
			query_forward = BlogModel.query().order(-BlogModel.date_created)
			query_reverse = BlogModel.query().order(BlogModel.date_created)
			
			posts, next_curs, next_more = query_forward.fetch_page(POSTS_PER_PAGE, start_cursor=curs1)
			rev_posts, prev_curs, prev_more = query_reverse.fetch_page(POSTS_PER_PAGE, start_cursor=curs1)
			
			
			if next_curs and next_more:
				next_curs = next_curs.urlsafe()
			else:
				next_curs = ''	

			if curs == None:
				prev_curs = ''	
			elif prev_curs and prev_more:
				prev_curs = prev_curs.urlsafe()
			else:
				prev_curs = 'MainPage'	

			blog_page = render_template('blog/blog_main.html', posts=posts, next_curs=next_curs, prev_curs = prev_curs)
			if not memcache.add('main_blog_page', blog_page, 86400):
				logging.error('Memcache set failed.')
			logging.info('cache miss ----*********---------')	
			return blog_page

class BlogSinglePost(MethodView):
	def get(self,post_key):
		if post_key:
			self.blog_model = BlogModel.get_by_id(post_key)
		if not self.blog_model:
			error_msg  = 'The blog id ' + str(post_key) +' is not valid. Please enter a valid id or return to home page.'
			flash(error_msg)
			return redirect(url_for('error_msg'))
	
		return render_template('blog/blog_single_post.html', post = self.blog_model)
			
blog_view = BlogMain.as_view('blog_main')
blog_module.add_url_rule('/',defaults={'curs': None}, 
								view_func=blog_view, methods=['GET',])
blog_module.add_url_rule('/page/<curs>/', view_func=blog_view, methods=['GET',])

blog_module.add_url_rule('/entry/<int:post_key>/', 
							view_func=BlogSinglePost.as_view('blog_single_post'),methods=['GET',])									

