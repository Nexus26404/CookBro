.PHONY: all android ios build prebuild clean help

# Default platform is all
PLATFORM ?= all

# Helper variables
PREBUILD_DIR_ANDROID = android
PREBUILD_DIR_IOS = ios

help:
	@echo "CookBro Mobile App Local Native Build Script"
	@echo "=========================================="
	@echo "Usage:"
	@echo "  make build PLATFORM=<android|ios|all>"
	@echo ""
	@echo "Or use direct targets:"
	@echo "  make android   - Build Release Android APK"
	@echo "  make ios       - Build Release iOS app"
	@echo "  make all       - Build both Android and iOS release apps"
	@echo "  make prebuild  - Run expo prebuild to generate native folders"
	@echo "  make clean     - Clean native folders (android/ and ios/)"

build:
	@if [ "$(PLATFORM)" = "android" ]; then \
		$(MAKE) android; \
	elif [ "$(PLATFORM)" = "ios" ]; then \
		$(MAKE) ios; \
	elif [ "$(PLATFORM)" = "all" ]; then \
		$(MAKE) all; \
	else \
		echo "Error: Unknown platform '$(PLATFORM)'. Supported: android, ios, all"; \
		exit 1; \
	fi

prebuild:
	@if [ ! -d "$(PREBUILD_DIR_ANDROID)" ] || [ ! -d "$(PREBUILD_DIR_IOS)" ]; then \
		echo "Generating native android/ios folders via expo prebuild..."; \
		npx expo prebuild; \
	else \
		echo "Native folders already exist."; \
	fi

android: prebuild
	@echo "Checking Android SDK path..."
	@if [ ! -f "android/local.properties" ]; then \
		SDK_DIR="$$HOME/Library/Android/sdk"; \
		if [ -d "$$SDK_DIR" ]; then \
			echo "Auto-detected Android SDK at $$SDK_DIR. Writing to android/local.properties..."; \
			echo "sdk.dir=$$SDK_DIR" > android/local.properties; \
		else \
			echo "Warning: Default Android SDK location not found at $$SDK_DIR."; \
			echo "You may need to create android/local.properties manually or export ANDROID_HOME."; \
		fi; \
	fi
	@echo "Building Android Release APK..."
	cd android && ./gradlew assembleRelease
	@echo "Android Build Success!"
	@echo "APK file generated at: android/app/build/outputs/apk/release/app-release.apk"

ios: prebuild
	@echo "Building iOS Release App..."
	@if [ "$$(uname)" != "Darwin" ]; then \
		echo "Error: iOS compilation requires a macOS environment."; \
		exit 1; \
	fi
	cd ios && \
	WORKSPACE=$$(ls -d *.xcworkspace 2>/dev/null | head -n 1) && \
	SCHEME=$$(basename "$$WORKSPACE" .xcworkspace) && \
	echo "Found iOS Workspace: $$WORKSPACE (Scheme: $$SCHEME)" && \
	xcodebuild -workspace "$$WORKSPACE" -scheme "$$SCHEME" -configuration Release -sdk iphoneos build CODE_SIGNING_ALLOWED=NO
	@echo "iOS Build Success!"
	@echo "Xcode build output located in ios/build/"

all: android ios

clean:
	@echo "Cleaning native android/ and ios/ folders..."
	rm -rf android ios
	@echo "Clean completed!"
