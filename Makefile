ENV ?= staging

ifeq ($(ENV),prod)
	IMAGE_NAME=hayuah-backend-main
	SERVICE_NAME=hayuah-backend-main
	SYSTEMCTL_CMD=sudo systemctl
	JOURNALCTL_CMD=sudo journalctl
else
	IMAGE_NAME=hayuah-backend-main
	SERVICE_NAME=hayuah-backend-main
	SYSTEMCTL_CMD=systemctl --user
	JOURNALCTL_CMD=journalctl --user
endif

build:
	@echo "▶ Building image for $(ENV)..."
	@podman build --no-cache \
		--secret id=npm_token,env=NPM_TOKEN \
		--network host \
		-t $(IMAGE_NAME):latest .

deploy: build
	@echo "▶ Reloading systemd and restarting $(ENV) service..."
	@$(SYSTEMCTL_CMD) daemon-reload
	@$(SYSTEMCTL_CMD) enable $(SERVICE_NAME).service
	@$(SYSTEMCTL_CMD) restart $(SERVICE_NAME).service
	@echo "✅ Deploy $(ENV) finished!"

status:
	$(SYSTEMCTL_CMD) status $(SERVICE_NAME).service

logs:
	$(JOURNALCTL_CMD) -u $(SERVICE_NAME).service -f