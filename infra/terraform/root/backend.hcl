bucket         = "tfstate-shared-bucket"
key            = "cloud-email-analyzer/${terraform.workspace}/terraform.tfstate"
region         = "eu-central-1"
# dynamodb_table = "tf-locks-shared"
encrypt        = true