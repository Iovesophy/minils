.PHONY: build
build:
	docker compose build

.PHONY: test
test:
	docker compose run deno bash -c "cd /app && deno run --allow-read --allow-run minils.ts testdir"

.PHONY: compile
compile:
	docker compose run deno bash -c "cd /app && deno compile --target x86_64-apple-darwin --allow-read --allow-run minils.ts"
