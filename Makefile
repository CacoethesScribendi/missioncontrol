all:

build:
	@docker-compose build

up: build
	@docker-compose up

down:
	@docker-compose down

flush:
	@docker exec -it missioncontrol_redis_1 redis-cli FLUSHALL

log:
	@docker logs missioncontrol_missioncontrol_1 -f

publish: build
	@aws ecr get-login --no-include-email --region us-east-1 | bash
	@docker tag missioncontrol_missioncontrol:latest 649725598653.dkr.ecr.us-east-1.amazonaws.com/missioncontrol:latest
	@docker push 649725598653.dkr.ecr.us-east-1.amazonaws.com/missioncontrol:latest
