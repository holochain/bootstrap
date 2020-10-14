let
 pkgs = import <nixpkgs> {};
in
pkgs.stdenv.mkDerivation {
 name = "shell";
 buildInputs = [
  # deps from upstream
  pkgs.nodejs-14_x
  pkgs.gnumake
 ];

 shellHook = ''
  # https://ghedam.at/15978/an-introduction-to-nix-shell
  mkdir -p .nix-node
  export NODE_PATH=$PWD/.nix-node
  export NPM_CONFIG_PREFIX=$PWD/.nix-node
  export PATH=$( npm bin ):$PATH
  # keep it fresh
  npm install
 '';
}
