wrangler.ensure:
	cargo install wrangler

docker.build:
	docker build -f Dockerfile -t holochain/bootstrap .
