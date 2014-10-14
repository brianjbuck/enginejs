enginejs
========

Description
===========

EngineJS is a lightweight library for performing AJAX requests. With a simple API you can access web resources that return either JSON or XML without having to include a heavy-weight library such as jQuery or manipulating XmlHttpRequest objects yourself.

Usage
=====

    <script src="engine.js"></script>
    <script type="text/javascript">
    function makeGetRequest() {
    	var url = "http://myurl.com/resource/";
    	http.get(url, callback);
    }

    function makePostRequest() {
    	var url = "http://myurl.com/resource/";
    	var params = new Object();
    	params["data_item_1"] = "this is some data";
    	http.post(url, callback, params);
    }

    function callback(obj) {
    	console.log(obj);
    }
    </script>
