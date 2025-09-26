COMPOSE=docker-compose

up:
	$(COMPOSE) up --build

down:
	$(COMPOSE) down

clean:
	$(COMPOSE) down -v --remove-orphans

re: clean up