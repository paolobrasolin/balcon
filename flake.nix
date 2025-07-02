{
  inputs.nixpkgs.url = "github:Nixos/nixpkgs/nixos-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {inherit system;};
      in {
        devShells.default = pkgs.mkShell {
          packages = [pkgs.bun];
        };
        packages = rec {
          nodeModules = pkgs.stdenv.mkDerivation {
            name = "node-modules";
            src = ./.;
            buildInputs = [pkgs.bun];
            buildPhase = ''
              bun install --frozen-lockfile
            '';
            installPhase = ''
              mkdir -p $out
              cp -r node_modules $out/
            '';
          };
          balcon = pkgs.stdenv.mkDerivation {
            name = "balcon";
            src = ./.;
            buildInputs = [pkgs.bun];
            configurePhase = ''
              ln -s ${nodeModules}/node_modules node_modules
            '';
            buildPhase = ''
              bun run build
            '';
            installPhase = ''
              cp -r dist $out
            '';
          };
          default = balcon;
        };
      }
    );
}
