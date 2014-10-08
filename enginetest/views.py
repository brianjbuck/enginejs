from datetime import datetime
from json import dumps as encode

from django.http import HttpResponse
from django.shortcuts import render

def index(request):
    return render(request, "index.html", {"now": datetime.now()})


def get_json(request):
    response_data = {"now": str(datetime.now())}
    return HttpResponse(encode(response_data), content_type="application/json")


def get_xml(request):
    response_data = "<xml><now>{}</now></xml>".format(datetime.now())
    return HttpResponse(response_data, content_type="text/xml")
