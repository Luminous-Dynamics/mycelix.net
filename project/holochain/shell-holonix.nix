let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/main.tar.gz";
  };
  holonix = import (holonixPath) {
    holochainVersionId = "v0_2_4";
  };
  nixpkgs = holonix.pkgs;
in holonix.main.makeShell {
  packages = with nixpkgs; [
    holochain
    lair-keystore
    nodejs_20
    yarn
    websocat
    cargo-make
    wasm-pack
  ];
  
  shellHook = ''
    echo "Holochain Development Environment (Holonix)"
    holochain --version
  '';
}
