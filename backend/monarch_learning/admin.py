"""
Custom admin site configuration
"""

from django.contrib import admin


class MonarchLearningAdminSite(admin.AdminSite):
    """Custom admin site with enhanced branding"""

    site_header = "Monarch Learning Administration"
    site_title = "Monarch Learning Admin"
    index_title = "Welcome to Monarch Learning Administration"


# Use custom admin site (optional - can keep default)
# admin_site = MonarchLearningAdminSite(name='monarch_admin')
