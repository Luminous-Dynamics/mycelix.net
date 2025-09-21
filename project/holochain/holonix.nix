let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/main.tar.gz";
  };
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
  };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  packages = with nixpkgs; [
    nodejs_20
  ];
}
