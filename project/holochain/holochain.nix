{ pkgs ? import <nixpkgs> {} }:

# Holochain package definition for NixOS system-wide installation
let
  holochain-bin = pkgs.stdenv.mkDerivation rec {
    pname = "holochain";
    version = "0.2.4";
    
    src = pkgs.fetchurl {
      url = "https://github.com/holochain/holochain/releases/download/holochain-${version}/holochain-x86_64-unknown-linux-gnu";
      sha256 = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; # Replace with actual hash
    };
    
    dontUnpack = true;
    
    installPhase = ''
      mkdir -p $out/bin
      cp $src $out/bin/holochain
      chmod +x $out/bin/holochain
    '';
  };
  
  hc-bin = pkgs.stdenv.mkDerivation rec {
    pname = "hc";
    version = "0.2.4";
    
    src = pkgs.fetchurl {
      url = "https://github.com/holochain/holochain/releases/download/holochain-${version}/hc-x86_64-unknown-linux-gnu";
      sha256 = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; # Replace with actual hash
    };
    
    dontUnpack = true;
    
    installPhase = ''
      mkdir -p $out/bin
      cp $src $out/bin/hc
      chmod +x $out/bin/hc
    '';
  };
  
  lair-keystore-bin = pkgs.stdenv.mkDerivation rec {
    pname = "lair-keystore";
    version = "0.3.0";
    
    src = pkgs.fetchurl {
      url = "https://github.com/holochain/lair/releases/download/lair_keystore-v${version}/lair-keystore-v${version}-x86_64-unknown-linux-gnu";
      sha256 = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; # Replace with actual hash
    };
    
    dontUnpack = true;
    
    installPhase = ''
      mkdir -p $out/bin
      cp $src $out/bin/lair-keystore
      chmod +x $out/bin/lair-keystore
    '';
  };
  
in pkgs.buildEnv {
  name = "holochain-suite";
  paths = [ holochain-bin hc-bin lair-keystore-bin ];
}