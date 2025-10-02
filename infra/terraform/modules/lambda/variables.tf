variable "function_name" { type = string }
variable "role_arn"      { type = string }

variable "package_type" {
  type        = string
  default     = "Zip"
  validation {
    condition     = contains(["Zip","Image"], var.package_type)
    error_message = "package_type must be Zip or Image."
  }
}

# image
variable "image_uri"     {
  type = string
  default = ""
}

variable "image_cmd"     {
  type = list(string)
  default = []
}

variable "image_entry"   {
  type = list(string)
  default = []
}

variable "image_workdir" {
  type = string
  default = null
}

# zip
variable "runtime"       {
  type = string
  default = "python3.11"
}

variable "handler"       {
  type = string
  default = "app.handler"
}

variable "filename"      {
  type = string
  default = ""
}       # local file path

variable "s3_bucket"     {
  type = string
  default = ""
}

variable "s3_key"        {
  type = string
  default = ""
}

variable "s3_object_version" {
  type = string
  default = ""
}

# Shared
variable "memory_size"   {
  type = number
  default = 512
}
variable "timeout"       {
  type = number
  default = 30
}
variable "architectures" {
  type = list(string)
  default = ["x86_64"]
}

variable "env_vars"      {
  type = map(string)
  default = {}
}

variable "layers"        {
  type = list(string)
  default = []
}

variable "log_retention" {
  type = number
  default = 14
}

variable "tags"          {
  type = map(string)
  default = {}
}

variable "publish"       {
  type = bool
  default = false
}
