variable "name" {
  type = string
}

variable "assume_services" {
  type = list(string)
  default = ["lambda.amazonaws.com"]
}

variable "inline_policies" {
  type = map(string)
  default = {}
}

variable "tags" {
  type = map(string)
  default = {}
}
