from datetime import datetime
from json import dumps as encode

from django.http import HttpResponse
from django.shortcuts import render


def index(request):
    """Display a simple page for testing the JS API"""
    return render(request, "index.html", {"now": datetime.now()})


def get_json(request):
    """Return a simple JSON dictionary"""
    response_data = {"now": str(datetime.now())}
    return HttpResponse(encode(response_data), content_type="application/json")


def get_xml(request):
    """Return a simple XML document"""
    response_data = "<xml><now>{}</now></xml>".format(datetime.now())
    return HttpResponse(response_data, content_type="text/xml")


def post_json(request):
    first_name = request.POST.get("first_name", None).strip()
    response_data = {"first_name": first_name}
    return HttpResponse(encode(response_data), content_type="application/json")


def post_xml(request):
    first_name = request.POST.get("first_name", "").strip()
    response_xml = "<xml><firstname>{}</firstname></xml>"
    return HttpResponse(response_xml.format(first_name), content_type="text/xml")
