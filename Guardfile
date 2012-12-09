#!/usr/bin/env python
from livereload.task import Task
from livereload.compiler import lessc

Task.add('*.html')
Task.add('static/js/*.js')
Task.add(
    'static/css/style.less',
    lessc('static/css/style.less', 'static/css/style.css')
)
