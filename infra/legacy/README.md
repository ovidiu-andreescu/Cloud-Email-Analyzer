# Legacy AWS ClamAV Deployment

`aws-clamav-sam.yaml` is the historical AWS SAM/CloudFormation deployment for the project's ClamAV scanner and scheduled signature updater. It provisions a VPC, EFS-backed signature storage, scanning and database-update Lambda functions, IAM permissions, and supporting networking.

This template belongs to the AWS restoration path, but it is not part of the active LocalStack Pro deployment or the current Terraform entrypoint. Before reuse, reconcile it with `infra/terraform/`, replace the historical image URIs, review its IAM and networking rules, and decide whether EFS plus the scheduled `freshclam` function remains the desired production design.

Restoration work is tracked in [GitHub issue #16](https://github.com/ovidiu-andreescu/Cloud-Email-Analyzer/issues/16).
