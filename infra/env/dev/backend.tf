terraform {
  backend "s3" {
    bucket         = "tfstate-jobs-cv-agg-dev"
    key            = "terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "tf-locks-jobs-cv-agg"
    encrypt        = true
  }
}
