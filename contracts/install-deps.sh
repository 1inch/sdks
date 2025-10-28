#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the contracts directory
cd "$SCRIPT_DIR"

# Install forge dependencies
forge install

# Install yarn dependencies in aqua-protocol
cd "$SCRIPT_DIR/lib/aqua-protocol" && yarn --prod
