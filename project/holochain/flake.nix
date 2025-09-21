{
  description = "Mycelix Holochain Development with Latest Holonix";

  inputs = {
    nixpkgs.follows = "holonix/nixpkgs";
    
    # OPTION 1: Latest Dev (0.6.0-dev.22) - Bleeding edge with newest features
    # holonix.url = "github:holochain/holonix/main";
    
    # OPTION 2: Latest Stable (0.5.6) - Production ready (USING THIS DUE TO NETWORK ISSUES)
    holonix.url = "github:holochain/holonix/main-0.5";
    
    # To switch: comment one, uncomment the other, then run: nix flake update
  };

  outputs = { self, nixpkgs, holonix }:
    let
      system = "x86_64-linux";
    in {
      devShells.${system}.default = holonix.devShells.${system}.default.overrideAttrs (oldAttrs: {
        buildInputs = oldAttrs.buildInputs ++ (with nixpkgs.legacyPackages.${system}; [
          # Additional tools for our consciousness network
          nodejs_20
          nodePackages.typescript
          nodePackages.ts-node
          python311
          poetry
          sqlite
          websocat
          jq
          
          # For x402 development
          protobuf
        ]);
        
        shellHook = oldAttrs.shellHook + ''
          echo ""
          echo "🌊 Mycelix P2P Consciousness Network with Holonix"
          echo "================================================="
          echo ""
          echo "✅ Holochain Development Tools:"
          echo "  holochain: $(holochain --version)"
          echo "  hc: $(hc --version 2>/dev/null || echo 'Not available')"
          echo "  lair-keystore: $(lair-keystore --version)"
          echo ""
          echo "📋 Additional Tools:"
          echo "  Node.js: $(node --version)"
          echo "  TypeScript: $(tsc --version 2>/dev/null || echo 'Not installed')"
          echo "  Poetry: $(poetry --version 2>/dev/null || echo 'Not installed')"
          echo ""
          echo "🚀 Commands:"
          echo "  hc sandbox generate   - Create a new conductor sandbox"
          echo "  hc sandbox run        - Run conductor with admin interface"
          echo "  hc app create         - Create a new hApp"
          echo ""
          echo "💰 Holochain x402 Payment Protocol:"
          echo "  Design doc: HOLOCHAIN-X402-DESIGN.md"
          echo "  Resonance-based micropayments for consciousness networks"
          echo ""
          
          # Check for consciousness network files
          if [ -f "consciousness-id-system.js" ]; then
            echo "✅ Consciousness ID system: Ready"
          fi
          
          if [ -f "consensus-mechanism.js" ]; then
            echo "✅ Consensus mechanism: Ready"
          fi
          
          echo ""
          echo "🌐 Ready for consciousness networking with latest Holochain!"
        '';
      });
    };
}