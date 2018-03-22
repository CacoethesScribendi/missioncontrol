all:

build:
	@docker-compose build

up: build
	@docker-compose up

down:
	@docker-compose down

flush:
	@docker exec -it missioncontrol_redis_1 redis-cli FLUSHALL

aql:
	@docker exec -it missioncontrol_aerospike_1 aql

log:
	@docker logs missioncontrol_missioncontrol_1 -f

create-aws-stg-env:
	## create aerospike instance
	aws ec2 run-instances \
		--image-id ami-a6ef04db \
		--count 1 \
		--instance-type r4.large \
		--key-name aerospike \
		--region us-east-1 \
		--security-group-ids sg-1163ff67 \
		--block-device-mappings file://aerospike-mapping.json

	## after instance created run the following (only once)

	#sudo chkconfig aerospike
	#sudo service aerospike start

	# and associate elastic IP

	## create redis instance
	@aws elasticache create-cache-cluster \
		--cache-cluster-id mcontrol-redis-stg \
		--cache-node-type cache.t2.small \
		--engine redis \
		--engine-version 3.2.4 \
		--num-cache-nodes 1 \
		--cache-parameter-group default.redis3.2

	@eb init missioncontrol

	@eb create missioncontrol-stg --cname missioncontrol-stg -k missioncontrol-key

deploy-aws-stg-env:
	@eb deploy --profile eb-cli-dav --staged

publish: build
	@aws ecr get-login --no-include-email --region us-east-1 | bash
	@docker tag missioncontrol_missioncontrol:latest 649725598653.dkr.ecr.us-east-1.amazonaws.com/missioncontrol:latest
	@docker push 649725598653.dkr.ecr.us-east-1.amazonaws.com/missioncontrol:latest
