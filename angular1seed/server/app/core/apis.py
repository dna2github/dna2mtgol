import json

from django.contrib.auth import authenticate
from django.conf.urls import url
from django.http import HttpResponse
from django.contrib.auth.models import User
from tastypie.resources import ModelResource
from tastypie.authentication import Authentication, ApiKeyAuthentication
from tastypie.authorization import Authorization, ReadOnlyAuthorization
from tastypie.api import Api
from tastypie.http import HttpUnauthorized
from tastypie.utils import trailing_slash

from .models import (
    UserProfile,
    Bom,
)


class UserResource(ModelResource):
    class Meta:
        resource_name = "user"
        queryset = UserProfile.objects.filter(apikey=None)
        authentication = Authentication()
        authroization = Authorization()

    def prepend_urls(self):
        return [
            url(r"^(?P<resource_name>%s)/login%s$" %
                (self._meta.resource_name, trailing_slash()),
                self.wrap_view('login'),
                name="login")
            ]

    def login(self, request, **kwargs):
        self.method_check(request, allowed=['post'])
        data = self.deserialize(
            request,
            request.body,
            format=request.META.get('CONTENT_TYPE', 'application/json')
        )
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return self.create_response(request, {}, HttpUnauthorized)

        user = authenticate(username=username, password=password)
        if user:
            return self.create_response(request, {
                "username": user.username,
                "apikey": UserProfile.objects.get(user=user).apikey
            })
        else:
            return self.create_response(request, {}, HttpUnauthorized)


v1_api = Api(api_name="v1")
v1_api.register(UserResource())
