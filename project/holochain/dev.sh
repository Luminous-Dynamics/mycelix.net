#!/usr/bin/env bash

# Mycelix Holochain Development Script
# Automates common development tasks

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DNA_DIR="$SCRIPT_DIR/mycelix-dna"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function print_header() {
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}🍄 Mycelix Holochain Development${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
}

function print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

function print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

function print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

function print_error() {
    echo -e "${RED}✗${NC} $1"
}

function check_dependencies() {
    print_info "Checking dependencies..."
    
    # Check for Rust
    if ! command -v rustc &> /dev/null; then
        print_error "Rust not found. Please install Rust."
        exit 1
    fi
    
    # Check for Cargo
    if ! command -v cargo &> /dev/null; then
        print_error "Cargo not found. Please install Rust."
        exit 1
    fi
    
    # Check for wasm target
    if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
        print_warning "Installing wasm32-unknown-unknown target..."
        rustup target add wasm32-unknown-unknown
    fi
    
    print_success "All dependencies found"
}

function build_zomes() {
    print_info "Building Holochain zomes..."
    cd "$DNA_DIR"
    
    cargo build --release --target wasm32-unknown-unknown
    
    print_success "Zomes built successfully"
}

function package_dna() {
    print_info "Packaging DNA..."
    cd "$DNA_DIR"
    
    # Check if hc is installed
    if ! command -v hc &> /dev/null; then
        print_warning "Holochain CLI not found. Installing..."
        cargo install holochain_cli_bundle --version 0.5.0
    fi
    
    # Create DNA manifest if it doesn't exist
    if [ ! -f "dna.yaml" ]; then
        cat > dna.yaml <<EOF
---
manifest_version: "1"
name: mycelix
integrity:
  network_seed: "mycelix-consciousness-network"
  properties: ~
  origin_time: "2025-01-01T00:00:00.000000Z"
  zomes:
    - name: consciousness_integrity
      bundled: target/wasm32-unknown-unknown/release/consciousness_integrity.wasm
coordinator:
  zomes:
    - name: consciousness
      bundled: target/wasm32-unknown-unknown/release/consciousness.wasm
      dependencies:
        - name: consciousness_integrity
EOF
        print_success "Created dna.yaml"
    fi
    
    hc dna pack . --output mycelix.dna
    print_success "DNA packaged as mycelix.dna"
}

function start_sandbox() {
    print_info "Starting Holochain sandbox..."
    
    if [ ! -d "$SCRIPT_DIR/.sandbox" ]; then
        print_info "Generating sandbox..."
        hc sandbox generate --root "$SCRIPT_DIR/.sandbox" --num-sandboxes 2 mycelix-network
    fi
    
    print_info "Starting conductor on port 8888..."
    hc sandbox run --root "$SCRIPT_DIR/.sandbox" --ports 8888
}

function run_tests() {
    print_info "Running tests..."
    cd "$DNA_DIR"
    
    # Run Rust tests
    cargo test
    
    print_success "All tests passed"
}

function clean() {
    print_info "Cleaning build artifacts..."
    cd "$DNA_DIR"
    cargo clean
    rm -f mycelix.dna mycelix.happ
    rm -rf "$SCRIPT_DIR/.sandbox"
    print_success "Clean complete"
}

function show_menu() {
    echo
    echo "What would you like to do?"
    echo "1) Build zomes"
    echo "2) Package DNA" 
    echo "3) Start sandbox"
    echo "4) Run tests"
    echo "5) Full build (build + package)"
    echo "6) Clean"
    echo "7) Exit"
    echo
    read -p "Enter choice [1-7]: " choice
}

# Main script
print_header
check_dependencies

if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        case $choice in
            1) build_zomes ;;
            2) package_dna ;;
            3) start_sandbox ;;
            4) run_tests ;;
            5) build_zomes && package_dna ;;
            6) clean ;;
            7) exit 0 ;;
            *) print_error "Invalid choice" ;;
        esac
    done
else
    # Command mode
    case "$1" in
        build) build_zomes ;;
        package) package_dna ;;
        sandbox) start_sandbox ;;
        test) run_tests ;;
        full) build_zomes && package_dna ;;
        clean) clean ;;
        *)
            echo "Usage: $0 [build|package|sandbox|test|full|clean]"
            exit 1
            ;;
    esac
fi