from datetime import date,datetime

''' Define the custom jinja templates here'''

def custom_templates(app):
	
	@app.template_filter('date_expand')
	def date_expand_filter(input_date):
		'''This  function converts the date into HTML output format
			<p>10<sup>th</sup>  March,  2013</p>
		
		This will render the date as 10th March, 2013 etc	
			
		'''	
		tmp_day = int(input_date.strftime('%d'))
		if (4 <= tmp_day <= 20) or (24 <= tmp_day <= 30):
			suffix = "th"
		else:
			suffix = ["st", "nd", "rd"][tmp_day % 10 - 1]	
			
		date_string = str(tmp_day) + '<sup>'+suffix + '</sup> '+str(input_date.strftime('%B'))+', '+str(input_date.strftime('%Y'))
		
		return date_string