#!/bin/sh

while ! nc -z "$DB_HOST" "$DB_PORT"; do
    echo "Waiting for the DB..."
    sleep 3
done

python manage.py makemigrations users
python manage.py migrate
python manage.py collectstatic --noinput

exec "$@"
