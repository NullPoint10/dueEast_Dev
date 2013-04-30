#add the lib to the search Path. This folder has all the extensions
import os
import sys
sys.path.append(os.path.join(os.path.abspath('.'), 'lib'))


import settings

from dE import create_app
from gae_mini_profiler import profiler, templatetags, config as profiler_config


# The function for creating app will be useful to initialize multiple instances. Useful for testing
app = create_app('settings')

#set up the gae mini profiler
profiler_config.enabled_profiler_emails = settings.ADMIN_EMAILS
app.jinja_env.add_extension('jinja2.ext.loopcontrols')

@app.context_processor
def inject_profiler():
    return dict(profiler_includes=templatetags.profiler_includes())
app = profiler.ProfilerWSGIMiddleware(app)