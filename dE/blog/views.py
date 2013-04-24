from flask import Blueprint, render_template, flash, redirect, url_for
from flask.views import MethodView
from models import BlogModel
from google.appengine.datastore.datastore_query import Cursor
import logging

POSTS_PER_PAGE = 4

blog_module = Blueprint("blog_module", __name__, template_folder="templates",static_folder = "static")


'''The main blog view. This is what is visible to everyone'''
class BlogMain(MethodView):
	def get(self, curs):
		

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

		
		
		return render_template('blog/blog_main.html', posts=posts, next_curs=next_curs, prev_curs = prev_curs)


class BlogSinglePost(MethodView):
	def get(self,post_key):
		if post_key:
			self.blog_model = BlogModel.get_by_id(post_key)
			logging.info(self.blog_model.title)
		if not self.blog_model:
			error_msg  = 'The blog id ' + str(post_key) +' is not valid. Please enter a valid id or return to home page.'
			flash(error_msg)
			return redirect(url_for('error_msg'))
	
		return render_template('blog/blog_single_post.html', post = self.blog_model)
		
#class BlogTest(MethodView):
#	def get(self):
#		return render_template('blog/test.html')
	

# the defaults value below is used to redirect /page/1 to the root /	
blog_view = BlogMain.as_view('blog_main')
blog_module.add_url_rule('/',defaults={'curs': None}, 
								view_func=blog_view, methods=['GET',])
blog_module.add_url_rule('/page/<curs>/', view_func=blog_view, methods=['GET',])

blog_module.add_url_rule('/entry/<int:post_key>/', 
							view_func=BlogSinglePost.as_view('blog_single_post'),methods=['GET',])									
#blog_module.add_url_rule('/test/', view_func=BlogTest.as_view('blog_test'))
