.PHONY: build
build:
	docker compose build

.PHONY: test
test: compile
	./minils testdir

.PHONY: compile
compile:
	docker compose run deno bash -c "cd /app && deno compile --target x86_64-apple-darwin --allow-read --allow-run minils.ts"
