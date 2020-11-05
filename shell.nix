let
 pkgs = import <nixpkgs> {};
in
pkgs.stdenv.mkDerivation {
 name = "shell";
 buildInputs = [
  # deps from upstream
  pkgs.nodejs-14_x
  pkgs.cargo
  pkgs.rustc
  pkgs.cloudflared
 ];

 shellHook = ''
  export CARGO_HOME=$PWD/.cargo
  export PATH=$( npm bin ):$PATH
  export PATH=$CARGO_HOME/bin:$PATH
  npm install
  cargo install wrangler
 '';
}
