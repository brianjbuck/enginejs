
from django.conf import settings
from django.conf.urls import patterns, include, url
from django.conf.urls.static import static

import views

urlpatterns = patterns('',
    url(r'^$', views.index, name="index"),
    url(r'^getjson/$', views.get_json),
    url(r'^getxml/$', views.get_xml),
)

if settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATICFILES_DIRS
    )
