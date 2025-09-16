#!/bin/sh

while ! nc -z "$DB_HOST" "$DB_PORT"; do
    echo "Waiting for the DB..."
    sleep 3
done

python manage.py makemigrations users
python manage.py migrate
python manage.py collectstatic --noinput

python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
email = '$POSTGRES_SUPER_EMAIL';
password = '$POSTGRES_SUPER_PASSWORD';
if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(email=email, password=password);
    print(f'Superuser with email \"{email}\" created.');
"

exec "$@"