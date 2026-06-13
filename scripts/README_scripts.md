# BidIt deployment scripts

- `linux/package-lambdas.sh` and `win/package-lambdas.ps1` package each `lambdas/*.py` file into `.deploy/lambda-zips`.
- `linux/deploy-infrastructure.sh` and `win/deploy-infrastructure.ps1` upload those zip files to S3 and deploy `cloudformation/bidit-infrastructure.yaml`.

See `docs/Technical_Installation_Guide.md` for full regular AWS and AWS Academy/LabRole examples.
