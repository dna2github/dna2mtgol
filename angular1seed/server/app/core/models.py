from __future__ import unicode_literals

from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(User)
    apikey = models.CharField(max_length=255, unique=True)
    is_admin = models.BooleanField(default=False)

    class Meta:
        permissions = (
            ('is_admin', 'B.O.M Administrator'),
        )

